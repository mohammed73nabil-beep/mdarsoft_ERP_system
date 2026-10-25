<?php

namespace Tests\Feature\PhaseA;

use App\Models\Account;
use Database\Seeders\ChartOfAccountsSeeder;
use DomainException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class ChartOfAccountsStabilizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_system_accounts_exist_after_seeding_with_correct_flags(): void
    {
        $this->seed(ChartOfAccountsSeeder::class);

        $requiredCodes = [
            '1130', // AR
            '1140', // مخزون
            '1150', // ضريبة مدخلات
            '2100', // AP
            '2200', // ضريبة مخرجات
            '3500', // أرصدة افتتاحية
            '4100', // إيرادات مبيعات
            '5100', // COGS
            '5300', // خسارة تالف/جرد
            '5400', // مصروف شيك مرتجع
        ];

        foreach ($requiredCodes as $code) {
            $account = Account::where('code', $code)->first();
            $this->assertNotNull($account, "Account {$code} must exist in seeded chart of accounts.");
            $this->assertTrue($account->is_system, "Account {$code} must have is_system = true.");
            $this->assertFalse($account->is_header, "Account {$code} must not be a header account (it is transactional).");
        }

        // Header parent accounts must have is_header = true
        $headerCodes = ['1', '11', '111', '2', '21', '3', '4', '5'];
        foreach ($headerCodes as $hCode) {
            $header = Account::where('code', $hCode)->first();
            $this->assertNotNull($header, "Header account {$hCode} must exist.");
            $this->assertTrue($header->is_header, "Account {$hCode} must have is_header = true.");
        }
    }

    public function test_current_balance_column_does_not_exist_in_accounts_table(): void
    {
        $this->assertFalse(
            Schema::hasColumn('accounts', 'current_balance'),
            'Column current_balance must be dropped from accounts table (balances derived from journal_lines).'
        );
    }

    public function test_prevent_duplicate_account_code(): void
    {
        Account::create([
            'code' => '7001',
            'name' => 'حساب اختبار 1',
            'type' => 'expense',
            'nature' => 'debit',
        ]);

        $this->expectException(\Illuminate\Database\QueryException::class);

        Account::create([
            'code' => '7001', // duplicate
            'name' => 'حساب اختبار مكرر',
            'type' => 'expense',
            'nature' => 'debit',
        ]);
    }

    public function test_prevent_self_parenting_and_circular_loops(): void
    {
        $parent = Account::create([
            'code' => '8000',
            'name' => 'حساب رئيسي',
            'type' => 'asset',
            'nature' => 'debit',
            'is_header' => true,
        ]);

        $child = Account::create([
            'code' => '8001',
            'name' => 'حساب فرعي',
            'type' => 'asset',
            'nature' => 'debit',
            'parent_id' => $parent->id,
        ]);

        $grandChild = Account::create([
            'code' => '8002',
            'name' => 'حساب فرع فرعي',
            'type' => 'asset',
            'nature' => 'debit',
            'parent_id' => $child->id,
        ]);

        // 1. Prevent self-parenting
        $this->expectException(DomainException::class);
        $parent->update(['parent_id' => $parent->id]);
    }

    public function test_prevent_circular_descendant_loop(): void
    {
        $parent = Account::create([
            'code' => '8100',
            'name' => 'أب 1',
            'type' => 'asset',
            'nature' => 'debit',
        ]);

        $child = Account::create([
            'code' => '8101',
            'name' => 'ابن 1',
            'type' => 'asset',
            'nature' => 'debit',
            'parent_id' => $parent->id,
        ]);

        $grandChild = Account::create([
            'code' => '8102',
            'name' => 'حفيد 1',
            'type' => 'asset',
            'nature' => 'debit',
            'parent_id' => $child->id,
        ]);

        // Attempt to make grandchild the parent of ancestor parent (circular loop)
        $this->expectException(DomainException::class);
        $parent->update(['parent_id' => $grandChild->id]);
    }

    public function test_prevent_deleting_account_with_children(): void
    {
        $parent = Account::create([
            'code' => '8200',
            'name' => 'حساب له أبناء',
            'type' => 'asset',
            'nature' => 'debit',
        ]);

        Account::create([
            'code' => '8201',
            'name' => 'ابن',
            'type' => 'asset',
            'nature' => 'debit',
            'parent_id' => $parent->id,
        ]);

        $this->expectException(DomainException::class);
        $parent->delete();
    }

    public function test_prevent_deleting_system_account(): void
    {
        $systemAccount = Account::create([
            'code' => '8300',
            'name' => 'حساب نظامي',
            'type' => 'asset',
            'nature' => 'debit',
            'is_system' => true,
        ]);

        $this->expectException(DomainException::class);
        $systemAccount->delete();
    }

    public function test_prevent_modifying_code_of_system_account(): void
    {
        $systemAccount = Account::create([
            'code' => '8400',
            'name' => 'حساب نظامي ثابت',
            'type' => 'asset',
            'nature' => 'debit',
            'is_system' => true,
        ]);

        $this->expectException(DomainException::class);
        $systemAccount->update(['code' => '8401']);
    }
}
