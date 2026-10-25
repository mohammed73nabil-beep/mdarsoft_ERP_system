<?php

namespace Tests\Feature\PhaseC2;

use App\Models\Branch;
use App\Models\Business;
use App\Models\Contact;
use App\Models\Discount;
use App\Models\FiscalYear;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\ProductSerial;
use App\Models\Quotation;
use App\Models\SaleDraft;
use App\Models\SaleOrder;
use App\Models\SaleReturn;
use App\Models\Unit;
use App\Models\User;
use App\Models\Warehouse;
use App\Services\StockService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class SaleScreensTest extends TestCase
{
    use RefreshDatabase;

    protected Branch $branch1;
    protected Branch $branch2;
    protected Warehouse $warehouse1;
    protected Warehouse $warehouse2;
    protected FiscalYear $fiscalYear;
    protected User $adminUser;
    protected User $branch1User;
    protected User $branch2User;
    protected Contact $customer;
    protected Unit $unit;
    protected Product $product;
    protected PaymentMethod $paymentMethod;
    protected StockService $stockService;

    protected function setUp(): void
    {
        parent::setUp();

        Business::factory()->create();
        $this->branch1 = Branch::factory()->create(['name' => 'فرع الرياض']);
        $this->branch2 = Branch::factory()->create(['name' => 'فرع جدة']);

        $this->warehouse1 = Warehouse::factory()->create(['branch_id' => $this->branch1->id, 'name' => 'مستودع الرياض']);
        $this->warehouse2 = Warehouse::factory()->create(['branch_id' => $this->branch2->id, 'name' => 'مستودع جدة']);

        $this->fiscalYear = FiscalYear::factory()->create(['status' => 'open']);
        $this->customer   = Contact::factory()->customer()->create(['name' => 'مؤسسة الأفق']);
        $this->unit       = Unit::factory()->create(['name' => 'حبة']);

        $this->paymentMethod = PaymentMethod::factory()->create(['name' => 'نقدي']);

        // Create Permissions
        $permissions = [
            'sales.view',
            'sales.all.view',
            'sales.create.view',
            'sales.returns_list.view',
            'sales.quotations_list.view',
            'sales.quotation_create.view',
            'sales.drafts_list.view',
            'sales.draft_create.view',
            'sales.discounts.view',
            'branches.view_all',
            'serials.accept_return',
        ];

        foreach ($permissions as $perm) {
            Permission::findOrCreate($perm, 'web');
        }

        $adminRole = Role::findOrCreate('admin', 'web');
        $adminRole->syncPermissions(Permission::all());

        $this->adminUser = User::factory()->create([
            'branch_id' => $this->branch1->id,
            'is_active' => true,
        ]);
        $this->adminUser->assignRole($adminRole);

        $salesRole = Role::findOrCreate('sales_rep', 'web');
        $salesRole->syncPermissions([
            'sales.view',
            'sales.all.view',
            'sales.create.view',
            'sales.returns_list.view',
            'sales.quotations_list.view',
            'sales.quotation_create.view',
            'sales.drafts_list.view',
            'sales.draft_create.view',
            'sales.discounts.view',
        ]);

        $this->branch1User = User::factory()->create([
            'branch_id' => $this->branch1->id,
            'is_active' => true,
        ]);
        $this->branch1User->assignRole($salesRole);

        $this->branch2User = User::factory()->create([
            'branch_id' => $this->branch2->id,
            'is_active' => true,
        ]);
        $this->branch2User->assignRole($salesRole);

        $this->product = Product::factory()->create([
            'unit_id'       => $this->unit->id,
            'tracking_type' => 'none',
            'cost_price'    => 200,
            'selling_price' => 300,
            'is_active'     => true,
        ]);

        $this->stockService = app(StockService::class);
        $this->stockService->recordIn($this->product->id, null, $this->warehouse1->id, 50, 200, 'opening_stock');
    }

    public function test_sales_index_requires_permission_and_returns_200_for_admin(): void
    {
        $unauthorized = User::factory()->create(['branch_id' => $this->branch1->id]);
        $this->actingAs($unauthorized)->get('/sales/all')->assertStatus(403);

        $this->actingAs($this->adminUser)
            ->get('/sales/all')
            ->assertStatus(200)
            ->assertInertia(fn ($page) => $page
                ->component('Sales/Index')
                ->has('sales')
                ->has('metrics')
            );
    }

    public function test_sales_create_page_requires_permission_and_returns_200_for_admin(): void
    {
        $unauthorized = User::factory()->create(['branch_id' => $this->branch1->id]);
        $this->actingAs($unauthorized)->get('/sales/create')->assertStatus(403);

        $this->actingAs($this->adminUser)
            ->get('/sales/create')
            ->assertStatus(200)
            ->assertInertia(fn ($page) => $page
                ->component('Sales/Create')
                ->has('customers')
                ->has('branches')
                ->has('warehouses')
                ->has('products')
            );
    }

    public function test_sale_store_lifecycle_and_validation(): void
    {
        // Validation: empty lines rejected
        $this->actingAs($this->adminUser)
            ->post('/sales', [
                'branch_id'    => $this->branch1->id,
                'warehouse_id' => $this->warehouse1->id,
                'date'         => now()->toDateString(),
                'lines'        => [],
            ])
            ->assertSessionHasErrors(['lines']);

        // Success store
        $response = $this->actingAs($this->adminUser)
            ->post('/sales', [
                'branch_id'    => $this->branch1->id,
                'warehouse_id' => $this->warehouse1->id,
                'contact_id'   => $this->customer->id,
                'date'         => now()->toDateString(),
                'lines'        => [
                    [
                        'product_id' => $this->product->id,
                        'quantity'   => 5,
                        'unit_price' => 300,
                    ],
                ],
            ]);

        $order = SaleOrder::latest('id')->first();
        $this->assertNotNull($order);
        $this->assertEquals(1500.0000, (float) $order->total_amount);

        $response->assertRedirect("/sales/{$order->id}");
    }

    public function test_sale_show_page_and_payments_recording(): void
    {
        $order = SaleOrder::factory()->create([
            'branch_id'    => $this->branch1->id,
            'warehouse_id' => $this->warehouse1->id,
            'contact_id'   => $this->customer->id,
            'total_amount' => 500,
            'paid_amount'  => 0,
            'payment_status' => 'unpaid',
        ]);

        $this->actingAs($this->adminUser)
            ->get("/sales/{$order->id}")
            ->assertStatus(200)
            ->assertInertia(fn ($page) => $page
                ->component('Sales/Show')
                ->where('sale.id', $order->id)
            );

        // Record payment
        $this->actingAs($this->adminUser)
            ->post("/sales/{$order->id}/payments", [
                'date'              => now()->toDateString(),
                'amount'            => 200,
                'payment_method_id' => $this->paymentMethod->id,
            ])
            ->assertSessionHasNoErrors();

        $order->refresh();
        $this->assertEquals(200.0000, (float) $order->paid_amount);
        $this->assertEquals('partial', $order->payment_status);
    }

    public function test_sale_payment_delete_updates_order_and_subledger(): void
    {
        $order = SaleOrder::factory()->create([
            'branch_id'    => $this->branch1->id,
            'warehouse_id' => $this->warehouse1->id,
            'contact_id'   => $this->customer->id,
            'total_amount' => 1000,
            'paid_amount'  => 0,
            'payment_status' => 'unpaid',
        ]);

        $this->actingAs($this->adminUser)
            ->post("/sales/{$order->id}/payments", [
                'date'              => now()->toDateString(),
                'amount'            => 400,
                'payment_method_id' => $this->paymentMethod->id,
            ]);

        $order->refresh();
        $this->assertEquals(400.0000, (float) $order->paid_amount);

        $payment = $order->payments()->first();
        $this->assertNotNull($payment);

        $this->actingAs($this->adminUser)
            ->delete("/sales/payments/{$payment->id}")
            ->assertSessionHasNoErrors();

        $order->refresh();
        $this->assertEquals(0, (float) $order->paid_amount);
        $this->assertEquals('unpaid', $order->payment_status);
    }

    public function test_sale_returns_index_create_and_store_lifecycle(): void
    {
        $order = SaleOrder::factory()->create([
            'branch_id'    => $this->branch1->id,
            'warehouse_id' => $this->warehouse1->id,
            'contact_id'   => $this->customer->id,
            'total_amount' => 600,
        ]);

        $line = $order->lines()->create([
            'product_id'   => $this->product->id,
            'quantity'     => 2,
            'unit_id'      => $this->unit->id,
            'unit_price'   => 300,
            'total_amount' => 600,
            'cost_price'   => 200,
        ]);

        // Index
        $this->actingAs($this->adminUser)
            ->get('/sales/returns')
            ->assertStatus(200)
            ->assertInertia(fn ($page) => $page->component('Sales/Returns/Index'));

        // Create page
        $this->actingAs($this->adminUser)
            ->get("/sales/returns/create?sale_id={$order->id}")
            ->assertStatus(200)
            ->assertInertia(fn ($page) => $page->component('Sales/Returns/Create'));

        // Store
        $this->actingAs($this->adminUser)
            ->post('/sales/returns', [
                'original_sale_id' => $order->id,
                'date'             => now()->toDateString(),
                'lines'            => [
                    [
                        'original_line_id' => $line->id,
                        'product_id'       => $this->product->id,
                        'quantity'         => 1,
                        'unit_price'       => 300,
                        'total_amount'     => 300,
                    ],
                ],
            ])
            ->assertSessionHasNoErrors();

        $ret = SaleReturn::latest('id')->first();
        $this->assertNotNull($ret);
        $this->assertEquals(300.0000, (float) $ret->total_amount);

        // Show
        $this->actingAs($this->adminUser)
            ->get("/sales/returns/{$ret->id}")
            ->assertStatus(200)
            ->assertInertia(fn ($page) => $page->component('Sales/Returns/Show'));
    }

    public function test_quotations_index_create_and_store_lifecycle(): void
    {
        $this->actingAs($this->adminUser)
            ->get('/sales/quotations')
            ->assertStatus(200)
            ->assertInertia(fn ($page) => $page->component('Sales/Quotations/Index'));

        $this->actingAs($this->adminUser)
            ->get('/sales/quotations/create')
            ->assertStatus(200)
            ->assertInertia(fn ($page) => $page->component('Sales/Quotations/Create'));

        $this->actingAs($this->adminUser)
            ->post('/sales/quotations', [
                'branch_id'    => $this->branch1->id,
                'warehouse_id' => $this->warehouse1->id,
                'contact_id'   => $this->customer->id,
                'date'         => now()->toDateString(),
                'lines'        => [
                    [
                        'product_id' => $this->product->id,
                        'quantity'   => 4,
                        'unit_price' => 320,
                    ],
                ],
            ])
            ->assertSessionHasNoErrors();

        $quo = Quotation::latest('id')->first();
        $this->assertNotNull($quo);
        $this->assertEquals(1280.0000, (float) $quo->total_amount);
    }

    public function test_sale_drafts_index_create_and_store_lifecycle(): void
    {
        $this->actingAs($this->adminUser)
            ->get('/sales/drafts')
            ->assertStatus(200)
            ->assertInertia(fn ($page) => $page->component('Sales/Drafts/Index'));

        $this->actingAs($this->adminUser)
            ->get('/sales/drafts/create')
            ->assertStatus(200)
            ->assertInertia(fn ($page) => $page->component('Sales/Drafts/Create'));

        $this->actingAs($this->adminUser)
            ->post('/sales/drafts', [
                'branch_id'    => $this->branch1->id,
                'warehouse_id' => $this->warehouse1->id,
                'contact_id'   => $this->customer->id,
                'date'         => now()->toDateString(),
                'lines'        => [
                    [
                        'product_id' => $this->product->id,
                        'quantity'   => 2,
                        'unit_price' => 300,
                    ],
                ],
            ])
            ->assertSessionHasNoErrors();

        $draft = SaleDraft::latest('id')->first();
        $this->assertNotNull($draft);
        $this->assertEquals(600.0000, (float) $draft->total_amount);
    }

    public function test_discounts_index_store_update_and_delete_lifecycle(): void
    {
        $this->actingAs($this->adminUser)
            ->get('/sales/discounts')
            ->assertStatus(200)
            ->assertInertia(fn ($page) => $page->component('Sales/Discounts'));

        // Store
        $this->actingAs($this->adminUser)
            ->post('/sales/discounts', [
                'name'       => 'خصم الافتتاح',
                'type'       => 'percentage',
                'value'      => 15,
                'applies_to' => 'all',
                'is_active'  => true,
            ])
            ->assertSessionHasNoErrors();

        $discount = Discount::latest('id')->first();
        $this->assertNotNull($discount);
        $this->assertEquals('خصم الافتتاح', $discount->name);

        // Update
        $this->actingAs($this->adminUser)
            ->put("/sales/discounts/{$discount->id}", [
                'name'       => 'خصم الافتتاح المحدث',
                'type'       => 'percentage',
                'value'      => 20,
                'applies_to' => 'all',
                'is_active'  => true,
            ])
            ->assertSessionHasNoErrors();

        $discount->refresh();
        $this->assertEquals(20.0000, (float) $discount->value);

        // Delete
        $this->actingAs($this->adminUser)
            ->delete("/sales/discounts/{$discount->id}")
            ->assertSessionHasNoErrors();

        $this->assertDatabaseMissing('discounts', ['id' => $discount->id]);
    }

    public function test_branch_isolation_in_sales(): void
    {
        $saleBranch1 = SaleOrder::factory()->create([
            'branch_id'    => $this->branch1->id,
            'warehouse_id' => $this->warehouse1->id,
            'contact_id'   => $this->customer->id,
            'order_number' => 'INV-BR1-001',
        ]);

        $saleBranch2 = SaleOrder::factory()->create([
            'branch_id'    => $this->branch2->id,
            'warehouse_id' => $this->warehouse2->id,
            'contact_id'   => $this->customer->id,
            'order_number' => 'INV-BR2-002',
        ]);

        // Branch 1 user cannot access Branch 2 sale (BranchScope hides it -> 404)
        $this->actingAs($this->branch1User)
            ->get("/sales/{$saleBranch2->id}")
            ->assertNotFound();

        // Branch 1 user can access Branch 1 sale
        $this->actingAs($this->branch1User)
            ->get("/sales/{$saleBranch1->id}")
            ->assertStatus(200);

        // Branch 1 user only sees Branch 1 in index
        $this->actingAs($this->branch1User)
            ->get(route('sales.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('sales.data', 1)
                ->where('sales.data.0.id', $saleBranch1->id)
            );

        // Admin can access both
        $this->actingAs($this->adminUser)
            ->get("/sales/{$saleBranch2->id}")
            ->assertStatus(200);
    }
}
