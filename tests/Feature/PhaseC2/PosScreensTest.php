<?php

namespace Tests\Feature\PhaseC2;

use App\Models\Branch;
use App\Models\Business;
use App\Models\Contact;
use App\Models\FiscalYear;
use App\Models\PosSession;
use App\Models\Product;
use App\Models\Shipment;
use App\Models\ShippingCompany;
use App\Models\SaleOrder;
use App\Models\Treasury;
use App\Models\Unit;
use App\Models\User;
use App\Models\Warehouse;
use App\Services\StockService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

/**
 * PosScreensTest
 *
 * اختبارات شاشات نقطة البيع (POS Sessions) والشحنات (Shipments).
 * المرحلة: ج2 (مرتبط بـ SaleOrder).
 * الحالة: مكتملة ومختبرة خادمياً (Server-Side Feature Tests).
 */
class PosScreensTest extends TestCase
{
    use RefreshDatabase;

    protected Branch $branch1;
    protected Branch $branch2;
    protected Warehouse $warehouse1;
    protected Treasury $treasury1;
    protected FiscalYear $fiscalYear;
    protected User $adminUser;
    protected User $branch1User;
    protected ShippingCompany $shippingCompany;

    protected function setUp(): void
    {
        parent::setUp();

        Business::factory()->create();
        $this->branch1 = Branch::factory()->create(['name' => 'فرع الرياض']);
        $this->branch2 = Branch::factory()->create(['name' => 'فرع جدة']);

        $this->warehouse1 = Warehouse::factory()->create(['branch_id' => $this->branch1->id]);
        $this->treasury1  = Treasury::factory()->create(['branch_id' => $this->branch1->id]);
        $this->fiscalYear = FiscalYear::factory()->create(['status' => 'open']);

        $this->shippingCompany = ShippingCompany::factory()->create([
            'name'      => 'أرامكس',
            'is_active' => true,
        ]);

        // Permissions
        $permissions = [
            'sales.view',
            'sales.all.view',
            'sales.create.view',
            'branches.view_all',
        ];
        foreach ($permissions as $perm) {
            Permission::findOrCreate($perm, 'web');
        }

        $adminRole = Role::findOrCreate('admin', 'web');
        $adminRole->syncPermissions($permissions);

        $viewerRole = Role::findOrCreate('viewer', 'web');
        $viewerRole->syncPermissions(['sales.all.view']);

        $this->adminUser = User::factory()->create(['branch_id' => $this->branch1->id]);
        $this->adminUser->assignRole('admin');

        $this->branch1User = User::factory()->create(['branch_id' => $this->branch1->id]);
        $this->branch1User->givePermissionTo('sales.create.view');
        $this->branch1User->givePermissionTo('sales.all.view');
    }

    // ─────────────────────────────────────────────────────────────
    // 1. شاشة فتح/عرض جلسة نقطة البيع — الأذونات وصفحة الفتح
    // ─────────────────────────────────────────────────────────────

    public function test_pos_screen_requires_permission_and_returns_200_for_admin(): void
    {
        // 200 للمدير
        $response = $this->actingAs($this->adminUser)->get('/sales/pos');
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Pos/Screen'));

        // 403 بدون صلاحية
        $noPermUser = User::factory()->create(['branch_id' => $this->branch1->id]);
        $response = $this->actingAs($noPermUser)->get('/sales/pos');
        $response->assertStatus(403);
    }

    public function test_pos_screen_renders_with_open_session_and_catalog(): void
    {
        PosSession::create([
            'session_number'  => 'POS-SCR-01',
            'branch_id'       => $this->branch1->id,
            'warehouse_id'    => $this->warehouse1->id,
            'treasury_id'     => $this->treasury1->id,
            'user_id'         => $this->adminUser->id,
            'fiscal_year_id'  => $this->fiscalYear->id,
            'opened_at'       => now(),
            'opening_balance' => 500,
            'expected_closing'=> 500,
            'status'          => 'open',
        ]);

        Contact::factory()->customer()->create();
        $unit = Unit::factory()->create();
        $cat = \App\Models\ProductCategory::factory()->create();
        $tax = \App\Models\Tax::factory()->create();
        $product = Product::factory()->create([
            'unit_id' => $unit->id,
            'category_id' => $cat->id,
            'tax_id' => $tax->id,
            'tracking_type' => 'none',
        ]);
        \App\Models\Discount::factory()->create(['is_active' => true]);
        \App\Models\PaymentMethod::factory()->create(['is_active' => true]);

        $response = $this->actingAs($this->adminUser)->get('/sales/pos');
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Pos/Screen')
            ->has('openSession')
            ->has('customers')
            ->has('products')
            ->has('paymentMethods')
            ->has('categories')
            ->has('discounts')
            ->has('taxes')
        );
    }

    // ─────────────────────────────────────────────────────────────
    // 2. فتح جلسة POS جديدة
    // ─────────────────────────────────────────────────────────────

    public function test_open_pos_session_creates_new_session_for_cashier(): void
    {
        $this->assertDatabaseCount('pos_sessions', 0);

        $response = $this->actingAs($this->branch1User)->post('/sales/pos/open', [
            'branch_id'       => $this->branch1->id,
            'warehouse_id'    => $this->warehouse1->id,
            'treasury_id'     => $this->treasury1->id,
            'fiscal_year_id'  => $this->fiscalYear->id,
            'opening_balance' => '500.00',
            'notes'           => 'بداية وردية الصباح',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseCount('pos_sessions', 1);
        $this->assertDatabaseHas('pos_sessions', [
            'branch_id'    => $this->branch1->id,
            'user_id'      => $this->branch1User->id,
            'status'       => 'open',
        ]);
    }

    // ─────────────────────────────────────────────────────────────
    // 3. منع فتح جلسة ثانية قبل إغلاق الأولى
    // ─────────────────────────────────────────────────────────────

    public function test_cannot_open_second_pos_session_while_first_is_open(): void
    {
        // افتح أولى
        PosSession::create([
            'session_number' => 'POS-T001',
            'branch_id'      => $this->branch1->id,
            'warehouse_id'   => $this->warehouse1->id,
            'treasury_id'    => $this->treasury1->id,
            'user_id'        => $this->branch1User->id,
            'fiscal_year_id' => $this->fiscalYear->id,
            'opened_at'      => now(),
            'opening_balance'=> 500,
            'status'         => 'open',
        ]);

        // حاول فتح ثانية — يجب أن يُعيد الإنرشيا إلى الخلف مع خطأ
        $response = $this->actingAs($this->branch1User)->post('/sales/pos/open', [
            'branch_id'       => $this->branch1->id,
            'warehouse_id'    => $this->warehouse1->id,
            'treasury_id'     => $this->treasury1->id,
            'fiscal_year_id'  => $this->fiscalYear->id,
            'opening_balance' => '200.00',
        ]);

        // يجب أن يرجع back مع خطأ (not create a second session)
        $this->assertDatabaseCount('pos_sessions', 1);
    }

    // ─────────────────────────────────────────────────────────────
    // 4. إغلاق جلسة POS وحساب الفرق
    // ─────────────────────────────────────────────────────────────

    public function test_close_pos_session_updates_status_and_calculates_difference(): void
    {
        $session = PosSession::create([
            'session_number'  => 'POS-T002',
            'branch_id'       => $this->branch1->id,
            'warehouse_id'    => $this->warehouse1->id,
            'treasury_id'     => $this->treasury1->id,
            'user_id'         => $this->branch1User->id,
            'fiscal_year_id'  => $this->fiscalYear->id,
            'opened_at'       => now(),
            'opening_balance' => 500,
            'expected_closing'=> 500,
            'status'          => 'open',
        ]);

        $response = $this->actingAs($this->branch1User)
            ->post("/sales/pos/{$session->id}/close", [
                'actual_closing' => '520.00',
                'notes'          => 'وردية ناجحة مع فائض',
            ]);

        $response->assertRedirect();

        $session->refresh();
        $this->assertEquals('closed', $session->status);
        $this->assertEquals('520.0000', $session->actual_closing);
        $this->assertEquals('20.0000',  $session->difference);
        $this->assertNotNull($session->closed_at);
    }

    // ─────────────────────────────────────────────────────────────
    // 5. قائمة جلسات POS — 200 للمدير، 403 بدون صلاحية
    // ─────────────────────────────────────────────────────────────

    public function test_pos_sessions_list_requires_permission_and_returns_200(): void
    {
        $response = $this->actingAs($this->adminUser)->get('/sales/pos-list');
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Pos/SessionsList'));

        $noPermUser = User::factory()->create(['branch_id' => $this->branch1->id]);
        $response = $this->actingAs($noPermUser)->get('/sales/pos-list');
        $response->assertStatus(403);
    }

    // ─────────────────────────────────────────────────────────────
    // 6. عرض تفاصيل جلسة POS
    // ─────────────────────────────────────────────────────────────

    public function test_pos_session_show_renders_200_with_session_data(): void
    {
        $session = PosSession::create([
            'session_number'  => 'POS-T003',
            'branch_id'       => $this->branch1->id,
            'warehouse_id'    => $this->warehouse1->id,
            'treasury_id'     => $this->treasury1->id,
            'user_id'         => $this->adminUser->id,
            'fiscal_year_id'  => $this->fiscalYear->id,
            'opened_at'       => now(),
            'opening_balance' => 300,
            'status'          => 'open',
        ]);

        $response = $this->actingAs($this->adminUser)->get("/sales/pos/{$session->id}");
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('Pos/SessionShow')
                 ->has('session')
                 ->has('sales')
                 ->has('sessionMetrics')
        );
    }

    // ─────────────────────────────────────────────────────────────
    // 7. رفض فتح جلسة في سنة مالية مغلقة
    // ─────────────────────────────────────────────────────────────

    public function test_cannot_open_pos_session_in_closed_fiscal_year(): void
    {
        $closedFY = FiscalYear::factory()->create(['status' => 'closed']);

        $response = $this->actingAs($this->branch1User)->post('/sales/pos/open', [
            'branch_id'       => $this->branch1->id,
            'warehouse_id'    => $this->warehouse1->id,
            'treasury_id'     => $this->treasury1->id,
            'fiscal_year_id'  => $closedFY->id,
            'opening_balance' => '0.00',
        ]);

        $this->assertDatabaseCount('pos_sessions', 0);
    }

    // ─────────────────────────────────────────────────────────────
    // 8. قائمة الشحنات — الأذونات والبيانات
    // ─────────────────────────────────────────────────────────────

    public function test_shipments_index_requires_permission_and_returns_200(): void
    {
        $response = $this->actingAs($this->adminUser)->get('/sales/shipments');
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('Sales/Shipments/Index')
                 ->has('shipments')
                 ->has('metrics')
                 ->has('shippingCompanies')
        );

        $noPermUser = User::factory()->create(['branch_id' => $this->branch1->id]);
        $response = $this->actingAs($noPermUser)->get('/sales/shipments');
        $response->assertStatus(403);
    }

    // ─────────────────────────────────────────────────────────────
    // 9. إنشاء شحنة مرتبطة بفاتورة بيع
    // ─────────────────────────────────────────────────────────────

    public function test_store_shipment_creates_record_linked_to_sale_order(): void
    {
        $contact = Contact::factory()->customer()->create();
        $unit    = Unit::factory()->create();
        $product = Product::factory()->create(['unit_id' => $unit->id]);

        // Create sale order directly
        $saleOrder = SaleOrder::create([
            'order_number'   => 'INV-0001',
            'date'           => now()->toDateString(),
            'fiscal_year_id' => $this->fiscalYear->id,
            'contact_id'     => $contact->id,
            'branch_id'      => $this->branch1->id,
            'warehouse_id'   => $this->warehouse1->id,
            'user_id'        => $this->adminUser->id,
            'subtotal'       => 1000,
            'total_amount'   => 1000,
            'paid_amount'    => 0,
            'payment_status' => 'unpaid',
            'status'         => 'confirmed',
        ]);

        $response = $this->actingAs($this->adminUser)->post('/sales/shipments', [
            'sale_order_id'       => $saleOrder->id,
            'shipping_company_id' => $this->shippingCompany->id,
            'tracking_number'     => 'ARAMEX-123456',
            'shipped_at'          => now()->toDateString(),
            'shipping_cost'       => '25.00',
            'notes'               => 'شحن سريع',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('shipments', [
            'sale_order_id'       => $saleOrder->id,
            'shipping_company_id' => $this->shippingCompany->id,
            'tracking_number'     => 'ARAMEX-123456',
            'status'              => 'shipped', // shipped_at was provided
        ]);
    }

    // ─────────────────────────────────────────────────────────────
    // 10. عرض تفاصيل شحنة وتحديث حالتها
    // ─────────────────────────────────────────────────────────────

    public function test_show_and_update_shipment_status_lifecycle(): void
    {
        $contact = Contact::factory()->customer()->create();
        $unit    = Unit::factory()->create();

        $saleOrder = SaleOrder::create([
            'order_number'   => 'INV-0002',
            'date'           => now()->toDateString(),
            'fiscal_year_id' => $this->fiscalYear->id,
            'contact_id'     => $contact->id,
            'branch_id'      => $this->branch1->id,
            'warehouse_id'   => $this->warehouse1->id,
            'user_id'        => $this->adminUser->id,
            'subtotal'       => 500,
            'total_amount'   => 500,
            'paid_amount'    => 0,
            'payment_status' => 'unpaid',
            'status'         => 'confirmed',
        ]);

        $shipment = Shipment::create([
            'sale_order_id'       => $saleOrder->id,
            'shipping_company_id' => $this->shippingCompany->id,
            'tracking_number'     => 'DHL-9999',
            'shipping_cost'       => 30,
            'status'              => 'pending',
        ]);

        // عرض الشحنة
        $response = $this->actingAs($this->adminUser)->get("/sales/shipments/{$shipment->id}");
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('Sales/Shipments/Show')
                 ->has('shipment')
                 ->has('shippingCompanies')
        );

        // تحديث الحالة إلى مسلّمة
        $response = $this->actingAs($this->adminUser)->put("/sales/shipments/{$shipment->id}", [
            'status'       => 'delivered',
            'delivered_at' => now()->toDateString(),
            'shipped_at'   => now()->subDay()->toDateString(),
            'shipping_cost'=> '30.00',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('shipments', [
            'id'     => $shipment->id,
            'status' => 'delivered',
        ]);
    }

    // ─────────────────────────────────────────────────────────────
    // 11. عزل الفروع في الشحنات
    // ─────────────────────────────────────────────────────────────

    public function test_branch_isolation_in_shipments(): void
    {
        $branch2Warehouse = Warehouse::factory()->create(['branch_id' => $this->branch2->id]);
        $branch2User = User::factory()->create(['branch_id' => $this->branch2->id]);
        $branch2User->givePermissionTo('sales.all.view');
        $branch2User->givePermissionTo('sales.create.view');

        $contact = Contact::factory()->customer()->create();

        // فاتورة بيع للفرع الأول
        $saleOrder = SaleOrder::create([
            'order_number'   => 'INV-0003',
            'date'           => now()->toDateString(),
            'fiscal_year_id' => $this->fiscalYear->id,
            'contact_id'     => $contact->id,
            'branch_id'      => $this->branch1->id,
            'warehouse_id'   => $this->warehouse1->id,
            'user_id'        => $this->adminUser->id,
            'subtotal'       => 200,
            'total_amount'   => 200,
            'paid_amount'    => 0,
            'payment_status' => 'unpaid',
            'status'         => 'confirmed',
        ]);

        $shipment = Shipment::create([
            'sale_order_id' => $saleOrder->id,
            'shipping_cost' => 15,
            'status'        => 'pending',
        ]);

        // مستخدم الفرع2 لا يرى هذه الشحنة في القائمة
        $response = $this->actingAs($branch2User)->get('/sales/shipments');
        $response->assertStatus(200);

        $data = $response->original->getData();
        // الشحنات المعادة يجب أن تكون صفر (بعزل الفرع)
        $shipmentsData = $data['page']['props']['shipments']['data'] ?? [];
        $this->assertCount(0, $shipmentsData);

        // محاولة الوصول المباشر للشحنة من فرع آخر يُعيد 403
        $response = $this->actingAs($branch2User)->get("/sales/shipments/{$shipment->id}");
        $response->assertStatus(403);
    }

    // ─────────────────────────────────────────────────────────────
    // 12. اختبار POS: ربط فاتورة مبيعات بجلسة POS
    // ─────────────────────────────────────────────────────────────

    public function test_pos_session_shows_sales_linked_to_it(): void
    {
        $session = PosSession::create([
            'session_number'  => 'POS-T010',
            'branch_id'       => $this->branch1->id,
            'warehouse_id'    => $this->warehouse1->id,
            'treasury_id'     => $this->treasury1->id,
            'user_id'         => $this->adminUser->id,
            'fiscal_year_id'  => $this->fiscalYear->id,
            'opened_at'       => now(),
            'opening_balance' => 1000,
            'status'          => 'open',
        ]);

        $contact = Contact::factory()->customer()->create();

        // إنشاء فاتورتي بيع مرتبطتين بالجلسة
        foreach (['INV-S01', 'INV-S02'] as $num) {
            SaleOrder::create([
                'order_number'   => $num,
                'date'           => now()->toDateString(),
                'fiscal_year_id' => $this->fiscalYear->id,
                'contact_id'     => $contact->id,
                'branch_id'      => $this->branch1->id,
                'warehouse_id'   => $this->warehouse1->id,
                'user_id'        => $this->adminUser->id,
                'pos_session_id' => $session->id,
                'subtotal'       => 300,
                'total_amount'   => 300,
                'paid_amount'    => 300,
                'payment_status' => 'paid',
                'status'         => 'confirmed',
            ]);
        }

        $response = $this->actingAs($this->adminUser)->get("/sales/pos/{$session->id}");
        $response->assertStatus(200);

        $data = $response->original->getData();
        $sales = $data['page']['props']['sales'] ?? [];
        $this->assertCount(2, $sales);

        $metrics = $data['page']['props']['sessionMetrics'];
        $this->assertEquals(600.0, $metrics['total_sales']);
        $this->assertEquals(2, $metrics['invoices_count']);
    }

    public function test_pos_checkout_endpoint_creates_order_and_returns_json(): void
    {
        $session = PosSession::create([
            'session_number'  => 'POS-CHK-01',
            'branch_id'       => $this->branch1->id,
            'warehouse_id'    => $this->warehouse1->id,
            'treasury_id'     => $this->treasury1->id,
            'user_id'         => $this->adminUser->id,
            'fiscal_year_id'  => $this->fiscalYear->id,
            'opened_at'       => now(),
            'opening_balance' => 500,
            'expected_closing'=> 500,
            'status'          => 'open',
        ]);

        $unit = Unit::factory()->create();
        $product = Product::factory()->create([
            'tracking_type'     => 'none',
            'unit_id'           => $unit->id,
            'selling_price'     => 100,
            'min_selling_price' => 0,
        ]);

        $stockService = app(StockService::class);
        $stockService->recordIn(
            $product->id,
            null,
            $this->warehouse1->id,
            10,
            50,
            'opening_stock',
            1
        );

        $paymentMethod = \App\Models\PaymentMethod::factory()->create(['type' => 'cash']);

        $payload = [
            'pos_session_id'  => $session->id,
            'idempotency_key' => 'idemp_' . uniqid(),
            'lines' => [
                [
                    'product_id' => $product->id,
                    'quantity'   => 2,
                    'unit_price' => 100,
                ],
            ],
            'payments' => [
                [
                    'payment_method_id' => $paymentMethod->id,
                    'amount'            => 200,
                ],
            ],
        ];

        $response = $this->actingAs($this->adminUser)
            ->postJson('/sales/pos/checkout', $payload);

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->assertDatabaseHas('sale_orders', [
            'pos_session_id' => $session->id,
            'total_amount'   => 200,
            'paid_amount'    => 200,
            'payment_status' => 'paid',
        ]);
    }
}

