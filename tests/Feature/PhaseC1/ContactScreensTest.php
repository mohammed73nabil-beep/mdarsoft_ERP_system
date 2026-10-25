<?php

namespace Tests\Feature\PhaseC1;

use App\Models\Business;
use App\Models\Contact;
use App\Models\ContactGroup;
use App\Models\ContactLedgerEntry;
use App\Models\FiscalYear;
use App\Models\PurchaseOrder;
use App\Models\Representative;
use App\Models\SellingPriceGroup;
use App\Models\User;
use Database\Seeders\PhaseASeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;
use Tests\Traits\CreatesAdminUser;

class ContactScreensTest extends TestCase
{
    use RefreshDatabase, CreatesAdminUser;

    protected Business $business;
    protected FiscalYear $fiscalYear;
    protected ContactGroup $supplierGroup;
    protected ContactGroup $customerGroup;
    protected SellingPriceGroup $priceGroup;
    protected Representative $representative;

    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpAdminGate();

        $this->business = Business::factory()->create();
        $this->fiscalYear = FiscalYear::factory()->create(['status' => 'open']);

        $this->supplierGroup = ContactGroup::factory()->create([
            'name' => 'موردو الأجهزة',
            'type' => 'supplier',
        ]);

        $this->customerGroup = ContactGroup::factory()->create([
            'name' => 'عملاء الجملة',
            'type' => 'customer',
        ]);

        $this->priceGroup = SellingPriceGroup::factory()->create();
        $this->representative = Representative::factory()->create();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 1. الموردين (Suppliers)
    // ─────────────────────────────────────────────────────────────────────────

    public function test_suppliers_index_requires_permission_and_returns_200_for_admin(): void
    {
        $admin = $this->createAdminUser();
        $noPermUser = $this->createNoPermUser();

        // 403 without permission
        $this->actingAs($noPermUser)->get('/contacts/suppliers')->assertForbidden();

        // 200 for admin
        $response = $this->actingAs($admin)->get('/contacts/suppliers');
        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->component('Contacts/Suppliers/Index'));
    }

    public function test_suppliers_create_page_and_store_lifecycle(): void
    {
        $admin = $this->createAdminUser();

        // Create page returns 200
        $this->actingAs($admin)->get('/contacts/suppliers/create')->assertOk();

        // Store supplier with custom code and opening balance
        $response = $this->actingAs($admin)->post('/contacts/suppliers', [
            'type'                 => 'supplier',
            'name'                 => 'شركة التقنية الحديثة',
            'code'                 => 'SUP-TECH-01',
            'phone'                => '0551122334',
            'email'                => 'tech@supplier.com',
            'contact_group_id'     => $this->supplierGroup->id,
            'opening_balance'      => 5000.00,
            'opening_balance_type' => 'credit',
            'credit_limit'         => 20000.00,
        ]);

        $supplier = Contact::where('code', 'SUP-TECH-01')->first();
        $this->assertNotNull($supplier);
        $this->assertEquals('supplier', $supplier->type);
        $this->assertEquals('شركة التقنية الحديثة', $supplier->name);

        $response->assertRedirect(route('contacts.suppliers.show', $supplier->id));

        // Sub-ledger initial opening balance entry was recorded
        $ledgerEntry = ContactLedgerEntry::where('contact_id', $supplier->id)
            ->where('reference_type', 'opening_balance')
            ->first();

        $this->assertNotNull($ledgerEntry);
        $this->assertEquals('5000.0000', $ledgerEntry->credit);
        $this->assertEquals('0.0000', $ledgerEntry->debit);
    }

    public function test_suppliers_show_and_edit_and_update(): void
    {
        $admin = $this->createAdminUser();

        $supplier = Contact::factory()->supplier()->create([
            'contact_group_id' => $this->supplierGroup->id,
        ]);

        // Show
        $this->actingAs($admin)->get("/contacts/suppliers/{$supplier->id}")
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Contacts/Suppliers/Show'));

        // Edit
        $this->actingAs($admin)->get("/contacts/suppliers/{$supplier->id}/edit")
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Contacts/Suppliers/Edit'));

        // Update
        $this->actingAs($admin)->put("/contacts/suppliers/{$supplier->id}", [
            'type'  => 'supplier',
            'name'  => 'اسم مورد محدث',
            'phone' => '0599999999',
        ])->assertRedirect(route('contacts.suppliers.show', $supplier->id));

        $this->assertEquals('اسم مورد محدث', $supplier->fresh()->name);
        $this->assertEquals('0599999999', $supplier->fresh()->phone);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. العملاء (Customers)
    // ─────────────────────────────────────────────────────────────────────────

    public function test_customers_index_requires_permission_and_returns_200_for_admin(): void
    {
        $admin = $this->createAdminUser();
        $noPermUser = $this->createNoPermUser();

        // 403 without permission
        $this->actingAs($noPermUser)->get('/contacts/customers')->assertForbidden();

        // 200 for admin
        $response = $this->actingAs($admin)->get('/contacts/customers');
        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->component('Contacts/Customers/Index'));
    }

    public function test_customers_create_and_store_lifecycle(): void
    {
        $admin = $this->createAdminUser();

        // Create page returns 200
        $this->actingAs($admin)->get('/contacts/customers/create')->assertOk();

        // Store customer with auto generated code and opening balance
        $response = $this->actingAs($admin)->post('/contacts/customers', [
            'type'                 => 'customer',
            'name'                 => 'مؤسسة الأفق للتجارة',
            'phone'                => '0501234567',
            'contact_group_id'     => $this->customerGroup->id,
            'opening_balance'      => 1200.00,
            'opening_balance_type' => 'debit',
            'credit_limit'         => 10000.00,
        ]);

        $customer = Contact::where('name', 'مؤسسة الأفق للتجارة')->first();
        $this->assertNotNull($customer);
        $this->assertTrue(str_starts_with($customer->code, 'CUS-'));

        $response->assertRedirect(route('contacts.customers.show', $customer->id));

        // Sub-ledger debit entry created
        $ledgerEntry = ContactLedgerEntry::where('contact_id', $customer->id)
            ->where('reference_type', 'opening_balance')
            ->first();

        $this->assertNotNull($ledgerEntry);
        $this->assertEquals('1200.0000', $ledgerEntry->debit);
        $this->assertEquals('0.0000', $ledgerEntry->credit);
    }

    public function test_customers_show_and_edit_and_update(): void
    {
        $admin = $this->createAdminUser();

        $customer = Contact::factory()->customer()->create([
            'contact_group_id' => $this->customerGroup->id,
        ]);

        // Show
        $this->actingAs($admin)->get("/contacts/customers/{$customer->id}")
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Contacts/Customers/Show'));

        // Edit
        $this->actingAs($admin)->get("/contacts/customers/{$customer->id}/edit")
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Contacts/Customers/Edit'));

        // Update
        $this->actingAs($admin)->put("/contacts/customers/{$customer->id}", [
            'type'  => 'customer',
            'name'  => 'عميل محدث',
            'phone' => '0588888888',
        ])->assertRedirect(route('contacts.customers.show', $customer->id));

        $this->assertEquals('عميل محدث', $customer->fresh()->name);
        $this->assertEquals('0588888888', $customer->fresh()->phone);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. كشف الحساب (Statement of Account / Contact Ledger)
    // ─────────────────────────────────────────────────────────────────────────

    public function test_contact_statement_of_account_ledger_calculation_and_filtering(): void
    {
        $admin = $this->createAdminUser();

        $supplier = Contact::factory()->supplier()->create();

        // 1. Initial movement on 2026-01-01: Credit 10,000 (invoice)
        ContactLedgerEntry::create([
            'contact_id'     => $supplier->id,
            'fiscal_year_id' => $this->fiscalYear->id,
            'date'           => '2026-01-01',
            'debit'          => 0,
            'credit'         => 10000,
            'reference_type' => 'purchase_order',
            'reference_id'   => 1,
            'description'    => 'فاتورة مشتريات رقم 1',
        ]);

        // 2. Payment on 2026-01-15: Debit 3,000 (payment)
        ContactLedgerEntry::create([
            'contact_id'     => $supplier->id,
            'fiscal_year_id' => $this->fiscalYear->id,
            'date'           => '2026-01-15',
            'debit'          => 3000,
            'credit'         => 0,
            'reference_type' => 'payment',
            'reference_id'   => 1,
            'description'    => 'سند صرف سداد دفعة',
        ]);

        // 3. New Invoice on 2026-02-01: Credit 5,000
        ContactLedgerEntry::create([
            'contact_id'     => $supplier->id,
            'fiscal_year_id' => $this->fiscalYear->id,
            'date'           => '2026-02-01',
            'debit'          => 0,
            'credit'         => 5000,
            'reference_type' => 'purchase_order',
            'reference_id'   => 2,
            'description'    => 'فاتورة مشتريات رقم 2',
        ]);

        // Request full ledger (no date filter)
        $response = $this->actingAs($admin)->get("/contacts/{$supplier->id}/ledger");
        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->component('Contacts/Ledger/Show'));

        $summary = $response->viewData('page')['props']['summary'];
        $entries = $response->viewData('page')['props']['entries'];

        // Total debit = 3000, total credit = 15000, final payable balance = 12000
        $this->assertEquals(3000.0, $summary['period_debit']);
        $this->assertEquals(15000.0, $summary['period_credit']);
        $this->assertEquals(12000.0, $summary['closing_balance']);
        $this->assertCount(3, $entries);

        // Filter from 2026-01-20 to 2026-02-10
        // Previous balance before 2026-01-20 must be (10000 - 3000) = 7000
        $filteredResponse = $this->actingAs($admin)->get("/contacts/{$supplier->id}/ledger?date_from=2026-01-20&date_to=2026-02-10");
        $filteredResponse->assertOk();

        $filteredSummary = $filteredResponse->viewData('page')['props']['summary'];
        $filteredEntries = $filteredResponse->viewData('page')['props']['entries'];

        $this->assertEquals(7000.0, $filteredSummary['opening_balance']);
        $this->assertEquals(5000.0, $filteredSummary['period_credit']);
        $this->assertEquals(12000.0, $filteredSummary['closing_balance']);
        $this->assertCount(1, $filteredEntries);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 4. العمليات المشتركة (تفعيل/تعطيل، الحذف، ومجموعات العملاء)
    // ─────────────────────────────────────────────────────────────────────────

    public function test_contact_toggle_active_status(): void
    {
        $admin = $this->createAdminUser();

        $contact = Contact::factory()->create(['is_active' => true]);

        $this->actingAs($admin)->post("/contacts/{$contact->id}/toggle-active");
        $this->assertFalse($contact->fresh()->is_active);

        $this->actingAs($admin)->post("/contacts/{$contact->id}/toggle-active");
        $this->assertTrue($contact->fresh()->is_active);
    }

    public function test_contact_delete_with_purchase_orders_is_prevented_and_unused_is_soft_deleted(): void
    {
        $admin = $this->createAdminUser();

        $supplierWithPO = Contact::factory()->supplier()->create();
        PurchaseOrder::factory()->create([
            'contact_id' => $supplierWithPO->id,
            'status'     => 'confirmed',
        ]);

        // Prevent deletion when purchase orders exist
        $response = $this->actingAs($admin)->delete("/contacts/{$supplierWithPO->id}");
        $response->assertSessionHasErrors(['contact']);
        $this->assertNotNull($supplierWithPO->fresh());

        // Unused customer can be soft deleted
        $unusedCustomer = Contact::factory()->customer()->create();
        $this->actingAs($admin)->delete("/contacts/{$unusedCustomer->id}")
            ->assertRedirect(route('contacts.customers.index'));

        $this->assertSoftDeleted('contacts', ['id' => $unusedCustomer->id]);
    }

    public function test_contact_groups_index_store_update_and_delete_lifecycle(): void
    {
        $admin = $this->createAdminUser();

        // Index
        $this->actingAs($admin)->get('/contacts/customer-groups')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Contacts/Groups/Index'));

        // Store
        $this->actingAs($admin)->post('/contacts/customer-groups', [
            'name'             => 'كبار العملاء',
            'type'             => 'customer',
            'discount_percent' => 5.5,
        ])->assertSessionHas('success');

        $group = ContactGroup::where('name', 'كبار العملاء')->first();
        $this->assertNotNull($group);
        $this->assertEquals('5.50', $group->discount_percent);

        // Update
        $this->actingAs($admin)->put("/contacts/customer-groups/{$group->id}", [
            'name'             => 'عملاء VIP',
            'type'             => 'customer',
            'discount_percent' => 10.0,
        ])->assertSessionHas('success');

        $this->assertEquals('عملاء VIP', $group->fresh()->name);

        // Delete group without contacts
        $this->actingAs($admin)->delete("/contacts/customer-groups/{$group->id}")
            ->assertSessionHas('success');

        $this->assertDatabaseMissing('contact_groups', ['id' => $group->id]);
    }
}
