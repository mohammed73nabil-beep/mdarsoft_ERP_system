<?php

namespace Tests\Feature\PhaseC1;

use App\Models\Branch;
use App\Models\Business;
use App\Models\Contact;
use App\Models\ContactLedgerEntry;
use App\Models\FiscalYear;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\PurchasePayment;
use App\Models\PurchaseReturn;
use App\Models\StockBalance;
use App\Models\Tax;
use App\Models\User;
use App\Models\Warehouse;
use Database\Seeders\ChartOfAccountsSeeder;
use Database\Seeders\PhaseASeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;
use Tests\Traits\CreatesAdminUser;

class PurchaseScreensTest extends TestCase
{
    use RefreshDatabase, CreatesAdminUser;

    protected User $admin;
    protected User $noPermUser;
    protected Branch $branch;
    protected Warehouse $warehouse;
    protected FiscalYear $fiscalYear;
    protected Contact $supplier;
    protected Product $product;
    protected PaymentMethod $paymentMethod;
    protected Tax $tax;

    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpAdminGate();

        $this->seed(ChartOfAccountsSeeder::class);
        $this->seed(PhaseASeeder::class);

        $this->admin = $this->createAdminUser();
        $this->noPermUser = $this->createNoPermUser();

        $this->branch = Branch::first();
        $this->warehouse = Warehouse::first();
        $this->fiscalYear = FiscalYear::where('status', 'open')->first();

        $this->supplier = Contact::factory()->create([
            'type'        => 'supplier',
            'name'        => 'شركة التوريدات العالمية',
            'code'        => 'SUP-9901',
            'is_active'   => true,
        ]);

        $this->product = Product::factory()->create([
            'name'          => 'شاشة سامسونج 27 بوصة',
            'sku'           => 'SAM-SCR-27',
            'cost_price'    => 500.00,
            'tracking_type' => 'none',
            'is_active'     => true,
        ]);

        $this->paymentMethod = PaymentMethod::first() ?? PaymentMethod::create([
            'name'      => 'نقدي',
            'type'      => 'cash',
            'is_active' => true,
        ]);

        $this->tax = Tax::first() ?? Tax::create([
            'name'      => 'ضريبة 15%',
            'rate'      => 15.00,
            'type'      => 'percentage',
            'tax_type'  => 'vat_input',
            'is_active' => true,
        ]);
    }

    public function test_purchases_index_requires_permission_and_returns_200_for_admin(): void
    {
        $response = $this->actingAs($this->admin)->get(route('purchases.index'));
        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Purchases/Index')
            ->has('orders')
            ->has('metrics')
        );

        $responseNoPerm = $this->actingAs($this->noPermUser)->get(route('purchases.index'));
        $responseNoPerm->assertForbidden();
    }

    public function test_purchases_create_page_requires_permission_and_returns_200_for_admin(): void
    {
        $response = $this->actingAs($this->admin)->get(route('purchases.create'));
        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Purchases/Create')
            ->has('suppliers')
            ->has('branches')
            ->has('warehouses')
            ->has('products')
        );

        $responseNoPerm = $this->actingAs($this->noPermUser)->get(route('purchases.create'));
        $responseNoPerm->assertForbidden();
    }

    public function test_purchase_store_lifecycle_and_validation(): void
    {
        // 1. Validation error if missing contact and lines
        $responseInvalid = $this->actingAs($this->admin)->post(route('purchases.store'), [
            'branch_id'    => $this->branch->id,
            'warehouse_id' => $this->warehouse->id,
            'date'         => '2026-03-01',
            'lines'        => [],
        ]);
        $responseInvalid->assertSessionHasErrors(['contact_id', 'lines']);

        // 2. Successful store
        $postData = [
            'contact_id'      => $this->supplier->id,
            'branch_id'       => $this->branch->id,
            'warehouse_id'    => $this->warehouse->id,
            'date'            => '2026-03-01',
            'notes'           => 'أمر شراء مبدئي للتجهيزات',
            'shipping_amount' => 50.00,
            'lines'           => [
                [
                    'product_id'      => $this->product->id,
                    'quantity'        => 5,
                    'unit_cost'       => 500.00,
                    'discount_amount' => 100.00,
                    'tax_amount'      => 360.00,
                    'total_amount'    => 2760.00,
                ],
            ],
        ];

        $response = $this->actingAs($this->admin)->post(route('purchases.store'), $postData);
        $order = PurchaseOrder::where('contact_id', $this->supplier->id)->latest('id')->first();
        $this->assertNotNull($order);
        $this->assertSame('confirmed', $order->status);
        $this->assertSame('unpaid', $order->payment_status);

        $response->assertRedirect(route('purchases.show', $order->id));
        $this->assertDatabaseHas('purchase_orders', [
            'id'         => $order->id,
            'contact_id' => $this->supplier->id,
        ]);
        $this->assertDatabaseHas('purchase_order_lines', [
            'purchase_order_id' => $order->id,
            'product_id'        => $this->product->id,
            'quantity'          => 5,
        ]);
    }

    public function test_purchase_immediate_auto_receive(): void
    {
        $postData = [
            'contact_id'      => $this->supplier->id,
            'branch_id'       => $this->branch->id,
            'warehouse_id'    => $this->warehouse->id,
            'date'            => '2026-03-01',
            'shipping_amount' => 0,
            'auto_receive'    => true,
            'lines'           => [
                [
                    'product_id'      => $this->product->id,
                    'quantity'        => 10,
                    'unit_cost'       => 500.00,
                    'discount_amount' => 0,
                    'tax_amount'      => 750.00,
                    'total_amount'    => 5750.00,
                ],
            ],
        ];

        $response = $this->actingAs($this->admin)->post(route('purchases.store'), $postData);
        $order = PurchaseOrder::where('contact_id', $this->supplier->id)->latest('id')->first();
        $this->assertNotNull($order);
        $this->assertSame('received', $order->status);

        // Check stock updated
        $balance = StockBalance::where('warehouse_id', $this->warehouse->id)
            ->where('product_id', $this->product->id)
            ->first();
        $this->assertNotNull($balance);
        $this->assertEquals(10, (float) $balance->quantity);

        // Check ledger credit entry for supplier
        $this->assertDatabaseHas('contact_ledger_entries', [
            'contact_id'     => $this->supplier->id,
            'reference_type' => 'PurchaseOrder',
            'reference_id'   => $order->id,
            'credit'         => 5750.00,
        ]);
    }

    public function test_purchase_show_page_and_receive_action(): void
    {
        $order = PurchaseOrder::create([
            'order_number'    => 'PO-2026-0001',
            'date'            => '2026-03-01',
            'fiscal_year_id'  => $this->fiscalYear->id,
            'contact_id'      => $this->supplier->id,
            'branch_id'       => $this->branch->id,
            'warehouse_id'    => $this->warehouse->id,
            'user_id'         => $this->admin->id,
            'subtotal'        => 1000.00,
            'discount_amount' => 0,
            'tax_amount'      => 150.00,
            'shipping_amount' => 0,
            'total_amount'    => 1150.00,
            'paid_amount'     => 0,
            'payment_status'  => 'unpaid',
            'status'          => 'confirmed',
        ]);

        $order->lines()->create([
            'product_id'   => $this->product->id,
            'unit_id'      => $this->product->unit_id,
            'quantity'     => 2,
            'unit_cost'    => 500.00,
            'tax_amount'   => 150.00,
            'total_amount' => 1150.00,
        ]);

        // 1. Show page 200
        $responseShow = $this->actingAs($this->admin)->get(route('purchases.show', $order->id));
        $responseShow->assertOk();
        $responseShow->assertInertia(fn ($page) => $page
            ->component('Purchases/Show')
            ->has('order')
            ->has('paymentMethods')
        );

        // 2. Receive action
        $responseReceive = $this->actingAs($this->admin)->post(route('purchases.receive', $order->id));
        $responseReceive->assertRedirect();

        $order->refresh();
        $this->assertSame('received', $order->status);

        // Stock in balance
        $balance = StockBalance::where('warehouse_id', $this->warehouse->id)
            ->where('product_id', $this->product->id)
            ->first();
        $this->assertEquals(2, (float) $balance->quantity);
    }

    public function test_purchase_payments_lifecycle(): void
    {
        $order = PurchaseOrder::create([
            'order_number'    => 'PO-2026-0002',
            'date'            => '2026-03-01',
            'fiscal_year_id'  => $this->fiscalYear->id,
            'contact_id'      => $this->supplier->id,
            'branch_id'       => $this->branch->id,
            'warehouse_id'    => $this->warehouse->id,
            'user_id'         => $this->admin->id,
            'subtotal'        => 2000.00,
            'tax_amount'      => 300.00,
            'total_amount'    => 2300.00,
            'paid_amount'     => 0,
            'payment_status'  => 'unpaid',
            'status'          => 'received',
        ]);

        // 1. Record partial payment
        $responsePay = $this->actingAs($this->admin)->post(route('purchases.payments.store', $order->id), [
            'date'              => '2026-03-02',
            'amount'            => 1000.00,
            'payment_method_id' => $this->paymentMethod->id,
            'reference'         => 'TRX-101',
        ]);
        $responsePay->assertRedirect();

        $order->refresh();
        $this->assertEquals(1000.00, (float) $order->paid_amount);
        $this->assertSame('partial', $order->payment_status);

        // Check ledger entry
        $payment = PurchasePayment::where('purchase_order_id', $order->id)->first();
        $this->assertNotNull($payment);
        $this->assertDatabaseHas('contact_ledger_entries', [
            'contact_id'     => $this->supplier->id,
            'reference_type' => 'PurchasePayment',
            'reference_id'   => $payment->id,
            'debit'          => 1000.00,
        ]);

        // 2. Delete payment
        $responseDelete = $this->actingAs($this->admin)->delete(route('purchases.payments.destroy', $payment->id));
        $responseDelete->assertRedirect();

        $order->refresh();
        $this->assertEquals(0, (float) $order->paid_amount);
        $this->assertSame('unpaid', $order->payment_status);
        $this->assertDatabaseMissing('contact_ledger_entries', [
            'reference_type' => 'PurchasePayment',
            'reference_id'   => $payment->id,
        ]);
    }

    public function test_purchase_returns_index_create_and_store_lifecycle(): void
    {
        // Setup received order
        $order = PurchaseOrder::create([
            'order_number'    => 'PO-2026-0003',
            'date'            => '2026-03-01',
            'fiscal_year_id'  => $this->fiscalYear->id,
            'contact_id'      => $this->supplier->id,
            'branch_id'       => $this->branch->id,
            'warehouse_id'    => $this->warehouse->id,
            'user_id'         => $this->admin->id,
            'subtotal'        => 2000.00,
            'tax_amount'      => 300.00,
            'total_amount'    => 2300.00,
            'paid_amount'     => 0,
            'payment_status'  => 'unpaid',
            'status'          => 'received',
        ]);

        $line = $order->lines()->create([
            'product_id'   => $this->product->id,
            'unit_id'      => $this->product->unit_id,
            'quantity'     => 4,
            'unit_cost'    => 500.00,
            'tax_amount'   => 300.00,
            'total_amount' => 2300.00,
        ]);

        // Pre-fill stock balance
        StockBalance::create([
            'product_id'    => $this->product->id,
            'warehouse_id'  => $this->warehouse->id,
            'quantity'      => 4,
            'unit_cost'     => 500.00,
        ]);

        // 1. Returns index 200 for admin, 403 for no perm
        $resIndex = $this->actingAs($this->admin)->get(route('purchases.returns.index'));
        $resIndex->assertOk();
        $resIndex->assertInertia(fn ($page) => $page->component('Purchases/Returns/Index'));

        $resNoPerm = $this->actingAs($this->noPermUser)->get(route('purchases.returns.index'));
        $resNoPerm->assertForbidden();

        // 2. Returns create page
        $resCreate = $this->actingAs($this->admin)->get(route('purchases.returns.create', ['order_id' => $order->id]));
        $resCreate->assertOk();
        $resCreate->assertInertia(fn ($page) => $page->component('Purchases/Returns/Create'));

        // 3. Store return
        $resStore = $this->actingAs($this->admin)->post(route('purchases.returns.store'), [
            'original_purchase_id' => $order->id,
            'branch_id'            => $this->branch->id,
            'warehouse_id'         => $this->warehouse->id,
            'date'                 => '2026-03-05',
            'notes'                => 'إرجاع قطعتين معيبتين',
            'lines'                => [
                [
                    'original_line_id' => $line->id,
                    'product_id'        => $this->product->id,
                    'quantity'          => 2,
                    'unit_cost'         => 500.00,
                    'tax_amount'        => 150.00,
                    'total_amount'      => 1150.00,
                ],
            ],
        ]);

        $return = PurchaseReturn::where('original_purchase_id', $order->id)->first();
        $this->assertNotNull($return);
        $resStore->assertRedirect(route('purchases.returns.show', $return->id));

        // 4. Returns show page
        $resShow = $this->actingAs($this->admin)->get(route('purchases.returns.show', $return->id));
        $resShow->assertOk();
        $resShow->assertInertia(fn ($page) => $page->component('Purchases/Returns/Show'));
    }

    public function test_purchase_order_requests_screen(): void
    {
        $response = $this->actingAs($this->admin)->get(route('purchases.order_requests'));
        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->component('Purchases/OrderRequests'));

        $responseNoPerm = $this->actingAs($this->noPermUser)->get(route('purchases.order_requests'));
        $responseNoPerm->assertForbidden();
    }

    public function test_purchase_reports_screens_render_200(): void
    {
        $reports = [
            route('purchases.reports.items')            => 'Purchases/Reports/ItemsReport',
            route('purchases.reports.products')         => 'Purchases/Reports/ProductsReport',
            route('purchases.reports.products_returns') => 'Purchases/Reports/ProductsReturnsReport',
            route('purchases.reports.summary')          => 'Purchases/Reports/SummaryReport',
        ];

        foreach ($reports as $url => $component) {
            $res = $this->actingAs($this->admin)->get($url);
            $res->assertOk();
            $res->assertInertia(fn ($page) => $page->component($component));

            $resNoPerm = $this->actingAs($this->noPermUser)->get($url);
            $resNoPerm->assertForbidden();
        }
    }

    public function test_branch_isolation_in_purchases(): void
    {
        $branch2 = Branch::factory()->create([
            'business_id' => $this->branch->business_id,
            'name'        => 'فرع جدة',
            'code'        => 'JED',
            'is_active'   => true,
        ]);

        $orderBranch1 = PurchaseOrder::create([
            'order_number'    => 'PO-B1-001',
            'date'            => '2026-03-01',
            'fiscal_year_id'  => $this->fiscalYear->id,
            'contact_id'      => $this->supplier->id,
            'branch_id'       => $this->branch->id,
            'warehouse_id'    => $this->warehouse->id,
            'user_id'         => $this->admin->id,
            'subtotal'        => 500.00,
            'total_amount'    => 575.00,
            'status'          => 'confirmed',
        ]);

        $orderBranch2 = PurchaseOrder::create([
            'order_number'    => 'PO-B2-001',
            'date'            => '2026-03-01',
            'fiscal_year_id'  => $this->fiscalYear->id,
            'contact_id'      => $this->supplier->id,
            'branch_id'       => $branch2->id,
            'warehouse_id'    => $this->warehouse->id,
            'user_id'         => $this->admin->id,
            'subtotal'        => 800.00,
            'total_amount'    => 920.00,
            'status'          => 'confirmed',
        ]);

        // Branch 1 user with view permission but without branches.view_all
        $branch1User = User::factory()->create(['branch_id' => $this->branch->id]);
        Permission::firstOrCreate(['name' => 'purchases.list.view', 'guard_name' => 'web']);
        $branch1User->givePermissionTo('purchases.list.view');

        $res = $this->actingAs($branch1User)->get(route('purchases.index'));
        $res->assertOk();
        $res->assertInertia(fn ($page) => $page
            ->has('orders.data', 1)
            ->where('orders.data.0.id', $orderBranch1->id)
        );
    }
}
