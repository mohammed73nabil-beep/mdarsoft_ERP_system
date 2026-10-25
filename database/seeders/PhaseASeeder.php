<?php

namespace Database\Seeders;

use App\Models\Account;
use App\Models\BankAccount;
use App\Models\Branch;
use App\Models\Business;
use App\Models\Currency;
use App\Models\FiscalYear;
use App\Models\PaymentMethod;
use App\Models\SellingPriceGroup;
use App\Models\Tax;
use App\Models\Treasury;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class PhaseASeeder extends Seeder
{
    public function run(): void
    {
        // 1. Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // 2. Extract and create permissions
        $permissions = $this->getSystemPermissions();
        foreach ($permissions as $permName) {
            Permission::firstOrCreate(['name' => $permName, 'guard_name' => 'web']);
        }

        // 3. Create Roles
        $adminRole = Role::firstOrCreate(['name' => 'مدير النظام', 'guard_name' => 'web']);
        $adminRoleAlias = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);

        // Give all permissions to admin role
        $allPermissions = Permission::where('guard_name', 'web')->get();
        $adminRole->syncPermissions($allPermissions);
        $adminRoleAlias->syncPermissions($allPermissions);

        // 4. Currency: Saudi Riyal only (ADR-13)
        Currency::firstOrCreate(
            ['code' => 'SAR'],
            [
                'name' => 'ريال سعودي',
                'symbol' => 'ر.س',
                'is_default' => true,
                'is_active' => true,
            ]
        );

        // 5. System Accounts
        $accountCash = Account::firstOrCreate(
            ['code' => '1111'],
            [
                'name' => 'الصندوق الرئيسي',
                'name_ar' => 'الصندوق الرئيسي',
                'name_en' => 'Main Cash Box',
                'type' => 'asset',
                'nature' => 'debit',
                'level' => 4,
                'is_system' => true,
                'is_active' => true,
            ]
        );

        $accountBank = Account::firstOrCreate(
            ['code' => '1121'],
            [
                'name' => 'البنك الرئيسي',
                'name_ar' => 'البنك الرئيسي',
                'name_en' => 'Main Bank Account',
                'type' => 'asset',
                'nature' => 'debit',
                'level' => 4,
                'is_system' => true,
                'is_active' => true,
            ]
        );

        $accountNetwork = Account::firstOrCreate(
            ['code' => '1131'],
            [
                'name' => 'شبكة الدفع',
                'name_ar' => 'شبكة الدفع',
                'name_en' => 'POS Network',
                'type' => 'asset',
                'nature' => 'debit',
                'level' => 4,
                'is_system' => true,
                'is_active' => true,
            ]
        );

        $accountAR = Account::firstOrCreate(
            ['code' => '1130'],
            [
                'name' => 'الذمم المدينة AR',
                'name_ar' => 'الذمم المدينة AR',
                'name_en' => 'Accounts Receivable',
                'type' => 'asset',
                'nature' => 'debit',
                'level' => 4,
                'is_system' => true,
                'is_active' => true,
            ]
        );

        // 6. Business, Branch, Warehouse
        $business = Business::firstOrCreate(
            ['name' => 'مؤسسة الحلول الذكية للإلكترونيات'],
            [
                'name_en' => 'Smart Solutions Electronics',
                'phone' => '0500000000',
                'email' => 'info@smartsolutions.com',
                'tax_number' => '300000000000003',
                'commercial_register' => '1010000000',
                'decimal_places' => 2,
            ]
        );

        $branch = Branch::firstOrCreate(
            ['code' => 'MAIN'],
            [
                'business_id' => $business->id,
                'name' => 'الفرع الرئيسي',
                'address' => 'الرياض، المملكة العربية السعودية',
                'phone' => '0110000000',
                'is_active' => true,
            ]
        );

        Warehouse::firstOrCreate(
            ['code' => 'WH-MAIN'],
            [
                'branch_id' => $branch->id,
                'name' => 'المخزن الرئيسي',
                'is_default' => true,
                'is_active' => true,
            ]
        );

        // 7. Open Fiscal Year
        FiscalYear::firstOrCreate(
            [
                'business_id' => $business->id,
                'start_date' => '2026-01-01',
            ],
            [
                'name' => 'السنة المالية 2026',
                'end_date' => '2026-12-31',
                'status' => 'open',
            ]
        );

        // 8. Main Treasury
        Treasury::firstOrCreate(
            ['name' => 'الخزينة الرئيسية', 'branch_id' => $branch->id],
            [
                'account_id' => $accountCash->id,
                'is_default' => true,
                'is_active' => true,
            ]
        );

        // 9. Main Bank Account
        BankAccount::firstOrCreate(
            ['account_number' => 'SA0000000000000000000001', 'branch_id' => $branch->id],
            [
                'bank_name' => 'مصرف الراجحي',
                'iban' => 'SA0000000000000000000001',
                'account_id' => $accountBank->id,
                'is_active' => true,
            ]
        );

        // 10. Payment Methods
        PaymentMethod::firstOrCreate(
            ['name' => 'نقدي'],
            [
                'type' => 'cash',
                'account_id' => $accountCash->id,
                'is_active' => true,
            ]
        );

        PaymentMethod::firstOrCreate(
            ['name' => 'شبكة'],
            [
                'type' => 'network',
                'account_id' => $accountNetwork->id,
                'is_active' => true,
            ]
        );

        PaymentMethod::firstOrCreate(
            ['name' => 'تحويل'],
            [
                'type' => 'bank',
                'account_id' => $accountBank->id,
                'is_active' => true,
            ]
        );

        PaymentMethod::firstOrCreate(
            ['name' => 'آجل'],
            [
                'type' => 'credit',
                'account_id' => $accountAR->id,
                'is_active' => true,
            ]
        );

        // 11. Taxes & Price Groups
        Tax::firstOrCreate(
            ['name' => 'ضريبة القيمة المضافة 15%'],
            [
                'rate' => 15.00,
                'type' => 'percentage',
                'tax_type' => 'vat_output',
                'is_active' => true,
            ]
        );

        SellingPriceGroup::firstOrCreate(
            ['name' => 'سعر التجزئة'],
            [
                'description' => 'سعر البيع الافتراضي للمستهلك',
                'is_active' => true,
            ]
        );

        // 12. Admin User
        $admin = User::firstOrCreate(
            ['email' => 'admin@erp.local'],
            [
                'name' => 'مدير النظام',
                'password' => Hash::make('password'),
                'branch_id' => $branch->id,
                'is_active' => true,
            ]
        );

        $admin->syncRoles(['مدير النظام', 'admin']);
    }

    private function getSystemPermissions(): array
    {
        $permissions = [
            'dashboard.view',
            'business.view', 'business.edit',
            'branches.view', 'branches.view_all', 'branches.create', 'branches.edit', 'branches.delete',
            'warehouses.view', 'warehouses.create', 'warehouses.edit', 'warehouses.delete',
            'fiscal_years.view', 'fiscal_years.create', 'fiscal_years.edit', 'fiscal_years.close',
            'users.view', 'users.create', 'users.edit', 'users.delete',
            'roles.view', 'roles.create', 'roles.edit', 'roles.delete',
            'currencies.view', 'currencies.create', 'currencies.edit',
            'taxes.view', 'taxes.create', 'taxes.edit',
            'payment_methods.view', 'payment_methods.create', 'payment_methods.edit',
            'treasuries.view', 'treasuries.create', 'treasuries.edit',
            'bank_accounts.view', 'bank_accounts.create', 'bank_accounts.edit',
            'shipping_companies.view', 'shipping_companies.create', 'shipping_companies.edit',
            'selling_price_groups.view', 'selling_price_groups.create', 'selling_price_groups.edit',
            'document_sequences.view', 'document_sequences.edit',
            'pos_sessions.view', 'pos_sessions.create', 'pos_sessions.close',
            'representatives.view', 'representatives.create', 'representatives.edit',
            'products.view', 'products.create', 'products.edit', 'products.delete',
            'serials.view', 'serials.accept_return',
            'categories.view', 'categories.create', 'categories.edit', 'categories.delete',
            'brands.view', 'brands.create', 'brands.edit', 'brands.delete',
            'units.view', 'units.create', 'units.edit', 'units.delete',
            'warranties.view', 'warranties.create', 'warranties.edit', 'warranties.delete',
        ];

        // Also add permissions from menu.config.js if exists
        $menuConfigFile = resource_path('js/config/menu.config.js');
        if (file_exists($menuConfigFile)) {
            $content = file_get_contents($menuConfigFile);
            preg_match_all('/permission:\s*[\'"]([^\'"]+)[\'"]/', $content, $matches);
            if (!empty($matches[1])) {
                $permissions = array_unique(array_merge($permissions, $matches[1]));
            }
        }

        return array_values($permissions);
    }
}
