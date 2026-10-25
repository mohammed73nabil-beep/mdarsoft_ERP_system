<?php

namespace Tests\Feature\PhaseC1;

use App\Models\Contact;
use App\Models\ContactGroup;
use Tests\TestCase;
use Database\Seeders\PhaseASeeder;

class ContactTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PhaseASeeder::class);
    }

    // ── 1. منع رمز جهة تعامل مكرر ────────────────────────────────
    public function test_prevent_duplicate_contact_code(): void
    {
        Contact::factory()->create(['code' => 'SUP-001', 'type' => 'supplier']);

        $this->expectException(\Illuminate\Database\QueryException::class);

        Contact::factory()->create(['code' => 'SUP-001', 'type' => 'customer']);
    }

    // ── 2. التحقق من البريد الإلكتروني (null ومقبول التعدد) ────────
    public function test_null_email_accepted_multiple_times(): void
    {
        Contact::factory()->create(['email' => null]);
        Contact::factory()->create(['email' => null]);
        $this->assertEquals(2, Contact::whereNull('email')->count());

        $contact = Contact::factory()->create(['email' => 'client@test.com']);
        $this->assertEquals('client@test.com', $contact->email);
    }

    // ── 3. التحقق من دوال isSupplier و isCustomer ─────────────────
    public function test_is_supplier_and_is_customer_helpers(): void
    {
        $supplier = Contact::factory()->supplier()->create();
        $customer = Contact::factory()->customer()->create();
        $both     = Contact::factory()->create(['type' => 'both']);

        $this->assertTrue($supplier->isSupplier());
        $this->assertFalse($supplier->isCustomer());

        $this->assertTrue($customer->isCustomer());
        $this->assertFalse($customer->isSupplier());

        $this->assertTrue($both->isSupplier());
        $this->assertTrue($both->isCustomer());
    }

    // ── 4. حد الائتمان (credit_limit) ────────────────────────────
    public function test_contact_credit_limit_stored_correctly(): void
    {
        $contact = Contact::factory()->create([
            'type'         => 'customer',
            'credit_limit' => 10000.0000,
        ]);

        $this->assertEquals('10000.0000', $contact->fresh()->credit_limit);
    }

    // ── 5. جهة التعامل مرتبطة بمجموعة ────────────────────────────
    public function test_contact_belongs_to_group(): void
    {
        $group   = ContactGroup::factory()->create(['name' => 'موردو الجوالات']);
        $contact = Contact::factory()->create([
            'contact_group_id' => $group->id,
            'type'             => 'supplier',
        ]);

        $this->assertEquals($group->id, $contact->group->id);
        $this->assertEquals('موردو الجوالات', $contact->group->name);
    }

    // ── 6. رصيد Sub-ledger يُحسب من ledger_entries ───────────────
    public function test_contact_balance_computed_from_ledger_entries(): void
    {
        $contact = Contact::factory()->create(['type' => 'supplier']);

        // سجل دائن (مستحق للمورد) = 5000
        $contact->ledgerEntries()->create([
            'contact_id'      => $contact->id,
            'fiscal_year_id'  => \App\Models\FiscalYear::first()->id,
            'date'            => now()->toDateString(),
            'description'     => 'شراء',
            'debit'           => 0,
            'credit'          => 5000,
            'reference_type'  => null,
            'reference_id'    => null,
        ]);

        // سجل مدين (دفعنا) = 2000
        $contact->ledgerEntries()->create([
            'contact_id'      => $contact->id,
            'fiscal_year_id'  => \App\Models\FiscalYear::first()->id,
            'date'            => now()->toDateString(),
            'description'     => 'دفعة',
            'debit'           => 2000,
            'credit'          => 0,
            'reference_type'  => null,
            'reference_id'    => null,
        ]);

        // المورد: balance = credit - debit = 5000 - 2000 = 3000
        $this->assertEquals(3000, $contact->balance);
    }

    // ── 7. SoftDelete: جهة التعامل تُحذف ناعماً ──────────────────
    public function test_contact_soft_delete(): void
    {
        $contact = Contact::factory()->create();
        $id = $contact->id;

        $contact->delete();

        $this->assertSoftDeleted('contacts', ['id' => $id]);
        $this->assertNull(Contact::find($id));
        $this->assertNotNull(Contact::withTrashed()->find($id));
    }
}
