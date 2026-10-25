<?php

namespace Tests\Feature\PhaseB2;

use App\Models\Branch;
use App\Models\Business;
use App\Models\DamagedStock;
use App\Models\FiscalYear;
use App\Models\InventoryTransfer;
use App\Models\OpeningStock;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\ProductSerial;
use App\Models\StockAdjustment;
use App\Models\StockBalance;
use App\Models\Unit;
use App\Models\Warehouse;
use App\Services\StockService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;
use Tests\Traits\CreatesAdminUser;

class InventoryScreensTest extends TestCase
{
    use RefreshDatabase, CreatesAdminUser;

    protected Business $business;
    protected Branch $branchA;
    protected Branch $branchB;
    protected Warehouse $warehouseA;
    protected Warehouse $warehouseB;
    protected FiscalYear $fiscalYear;
    protected Unit $unit;
    protected ProductCategory $category;

    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpAdminGate();

        $this->business = Business::factory()->create();
        $this->branchA = Branch::factory()->create(['business_id' => $this->business->id]);
        $this->branchB = Branch::factory()->create(['business_id' => $this->business->id]);

        $this->warehouseA = Warehouse::factory()->create([
            'branch_id' => $this->branchA->id,
        ]);
        $this->warehouseB = Warehouse::factory()->create([
            'branch_id' => $this->branchB->id,
        ]);

        $this->fiscalYear = FiscalYear::factory()->create(['status' => 'open']);
        $this->unit = Unit::factory()->create();
        $this->category = ProductCategory::factory()->create();
    }

    // ==========================================
    // 1. بضاعة أول المدة (Opening Stock)
    // ==========================================

    public function test_opening_stock_routes_authorization_and_lifecycle(): void
    {
        $admin = $this->createAdminUser();
        $noPermUser = $this->createNoPermUser();

        // 403 without permission
        $this->actingAs($noPermUser)->get('/inventory/opening-stock')->assertForbidden();
        $this->actingAs($noPermUser)->get('/inventory/opening-stock/create')->assertForbidden();

        // 200 with admin
        $this->actingAs($admin)->get('/inventory/opening-stock')->assertOk();
        $this->actingAs($admin)->get('/inventory/opening-stock/create')->assertOk();

        // Create product
        $product = Product::factory()->create([
            'tracking_type' => 'none',
            'unit_id' => $this->unit->id,
            'cost_price' => 50,
        ]);

        // Store Opening Stock – controller auto_posts by default
        $response = $this->actingAs($admin)->post('/inventory/opening-stock', [
            'warehouse_id' => $this->warehouseA->id,
            'date' => now()->toDateString(),
            'notes' => 'Opening stock batch 1',
            'lines' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 10,
                    'unit_cost' => 50,
                ],
            ],
        ]);

        $response->assertRedirect();
        $openingStock = OpeningStock::where('branch_id', $this->branchA->id)->first();

        $this->assertNotNull($openingStock);
        $this->assertEquals(10, $openingStock->lines->first()->quantity);

        // Show page
        $this->actingAs($noPermUser)->get("/inventory/opening-stock/{$openingStock->id}")->assertForbidden();
        $this->actingAs($admin)->get("/inventory/opening-stock/{$openingStock->id}")->assertOk();

        // Controller auto-posts on store, so status should already be posted
        $this->assertEquals('posted', $openingStock->fresh()->status);
        $balance = StockBalance::where('warehouse_id', $this->warehouseA->id)
            ->where('product_id', $product->id)
            ->first();
        $this->assertNotNull($balance);
        $this->assertEquals(10, $balance->quantity);
    }

    // ==========================================
    // 2. أذونات الإضافة والصرف (Stock Vouchers)
    // ==========================================

    public function test_stock_vouchers_receiving_and_delivery_lifecycle(): void
    {
        $admin = $this->createAdminUser();
        $noPermUser = $this->createNoPermUser();

        // Check Permissions
        $this->actingAs($noPermUser)->get('/inventory/vouchers/receiving')->assertForbidden();
        $this->actingAs($noPermUser)->get('/inventory/vouchers/receiving/create')->assertForbidden();
        $this->actingAs($noPermUser)->get('/inventory/vouchers/delivery')->assertForbidden();
        $this->actingAs($noPermUser)->get('/inventory/vouchers/delivery/create')->assertForbidden();

        $this->actingAs($admin)->get('/inventory/vouchers/receiving')->assertOk();
        $this->actingAs($admin)->get('/inventory/vouchers/receiving/create')->assertOk();
        $this->actingAs($admin)->get('/inventory/vouchers/delivery')->assertOk();
        $this->actingAs($admin)->get('/inventory/vouchers/delivery/create')->assertOk();

        $product = Product::factory()->create([
            'tracking_type' => 'none',
            'unit_id' => $this->unit->id,
        ]);

        // 1. Create and Post Receiving Voucher (in)
        $recvResponse = $this->actingAs($admin)->post('/inventory/vouchers/receiving', [
            'warehouse_id' => $this->warehouseA->id,
            'type' => 'receiving_voucher',
            'date' => now()->toDateString(),
            'notes' => 'Receiving extra stock',
            'lines' => [
                [
                    'product_id' => $product->id,
                    'adjusted_quantity' => 15,
                    'unit_cost' => 80,
                ],
            ],
        ]);
        $recvResponse->assertRedirect();

        // Controller auto_post=true → voucher is posted immediately
        $recvVoucher = StockAdjustment::where('warehouse_id', $this->warehouseA->id)
            ->where('type', 'receiving_voucher')
            ->first();
        $this->assertNotNull($recvVoucher);
        // auto_post defaults to true in the controller
        $this->assertEquals('posted', $recvVoucher->status);

        // Show receiving voucher
        $this->actingAs($admin)->get("/inventory/vouchers/receiving/{$recvVoucher->id}")->assertOk();

        $balance = StockBalance::where('warehouse_id', $this->warehouseA->id)
            ->where('product_id', $product->id)
            ->first();
        $this->assertNotNull($balance);
        $this->assertEquals(15, $balance->quantity);

        // 2. Create and Post Delivery Voucher (out)
        $delivResponse = $this->actingAs($admin)->post('/inventory/vouchers/delivery', [
            'warehouse_id' => $this->warehouseA->id,
            'type' => 'delivery_voucher',
            'date' => now()->toDateString(),
            'notes' => 'Delivery voucher test',
            'lines' => [
                [
                    'product_id' => $product->id,
                    'adjusted_quantity' => 5,
                    'unit_cost' => 80,
                ],
            ],
        ]);
        $delivResponse->assertRedirect();

        $delivVoucher = StockAdjustment::where('warehouse_id', $this->warehouseA->id)
            ->where('type', 'delivery_voucher')
            ->first();
        $this->assertNotNull($delivVoucher);

        // Show delivery voucher
        $this->actingAs($admin)->get("/inventory/vouchers/delivery/{$delivVoucher->id}")->assertOk();

        // delivery voucher auto_post=true, already posted on store
        $this->assertEquals('posted', $delivVoucher->fresh()->status);
        // Remaining balance should be 15 - 5 = 10
        $this->assertEquals(10, $balance->fresh()->quantity);
    }

    // ==========================================
    // 3. تحويل المخزون (Inventory Transfer)
    // ==========================================

    public function test_inventory_transfer_send_and_receive_flow(): void
    {
        $admin = $this->createAdminUser();
        $noPermUser = $this->createNoPermUser();

        $this->actingAs($noPermUser)->get('/inventory/transfers')->assertForbidden();
        $this->actingAs($noPermUser)->get('/inventory/transfers/create')->assertForbidden();

        $this->actingAs($admin)->get('/inventory/transfers')->assertOk();
        $this->actingAs($admin)->get('/inventory/transfers/create')->assertOk();

        $product = Product::factory()->create([
            'tracking_type' => 'none',
            'unit_id' => $this->unit->id,
        ]);

        // Put 20 items in warehouse A @ 100
        app(StockService::class)->recordIn(
            productId: $product->id,
            variationId: null,
            warehouseId: $this->warehouseA->id,
            quantity: 20,
            unitCost: 100,
            movementType: 'opening_stock',
            referenceType: 'test',
            referenceId: 1
        );

        // Create transfer
        $response = $this->actingAs($admin)->post('/inventory/transfers', [
            'from_warehouse_id' => $this->warehouseA->id,
            'to_warehouse_id' => $this->warehouseB->id,
            'date' => now()->toDateString(),
            'notes' => 'Transfer between branches',
            'lines' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 8,
                ],
            ],
        ]);
        $response->assertRedirect();

        $transfer = InventoryTransfer::where('from_warehouse_id', $this->warehouseA->id)
            ->where('to_warehouse_id', $this->warehouseB->id)
            ->first();
        $this->assertNotNull($transfer);
        // Controller creates transfer with 'draft' status initially
        $this->assertEquals('draft', $transfer->status);

        // Show
        $this->actingAs($admin)->get("/inventory/transfers/{$transfer->id}")->assertOk();

        // Send transfer (draft → in_transit)
        $sendResponse = $this->actingAs($admin)->post("/inventory/transfers/{$transfer->id}/send");
        $sendResponse->assertRedirect();
        $this->assertEquals('sent', $transfer->fresh()->status);
        $sourceBal = StockBalance::where('warehouse_id', $this->warehouseA->id)
            ->where('product_id', $product->id)
            ->first();
        $this->assertEquals(12, $sourceBal->quantity);

        // Receive transfer
        $this->actingAs($admin)->post("/inventory/transfers/{$transfer->id}/receive")->assertRedirect();
        $this->assertEquals('received', $transfer->fresh()->status);
        $destBal = StockBalance::where('warehouse_id', $this->warehouseB->id)
            ->where('product_id', $product->id)
            ->first();
        $this->assertNotNull($destBal);
        $this->assertEquals(8, $destBal->quantity);
    }

    // ==========================================
    // 4. المخزون التالف (Damaged Stock)
    // ==========================================

    public function test_damaged_stock_creation_and_posting_with_serial(): void
    {
        $admin = $this->createAdminUser();
        $noPermUser = $this->createNoPermUser();

        $this->actingAs($noPermUser)->get('/inventory/damaged')->assertForbidden();
        $this->actingAs($noPermUser)->get('/inventory/damaged/create')->assertForbidden();

        $this->actingAs($admin)->get('/inventory/damaged')->assertOk();
        $this->actingAs($admin)->get('/inventory/damaged/create')->assertOk();

        $serialProduct = Product::factory()->create([
            'tracking_type' => 'serial',
            'unit_id' => $this->unit->id,
        ]);

        $serial = ProductSerial::create([
            'product_id' => $serialProduct->id,
            'serial_number' => 'SN-DAMAGED-001',
            'status' => 'in_stock',
            'warehouse_id' => $this->warehouseA->id,
            'cost_price' => 500,
        ]);

        app(StockService::class)->recordIn(
            productId: $serialProduct->id,
            variationId: null,
            warehouseId: $this->warehouseA->id,
            quantity: 1,
            unitCost: 500,
            movementType: 'opening_stock',
            referenceType: 'test',
            referenceId: 2,
            serialId: $serial->id
        );

        $this->assertEquals('in_stock', $serial->fresh()->status);

        // Store damaged stock entry
        $response = $this->actingAs($admin)->post('/inventory/damaged', [
            'warehouse_id' => $this->warehouseA->id,
            'date' => now()->toDateString(),
            'notes' => 'Damaged during water leak',
            'lines' => [
                [
                    'product_id' => $serialProduct->id,
                    'quantity' => 1,
                    'unit_cost' => 500,
                    'serial_ids' => [$serial->id],
                    'notes' => 'Water damage',
                ],
            ],
        ]);
        $response->assertRedirect();

        $damaged = DamagedStock::where('warehouse_id', $this->warehouseA->id)
            ->where('notes', 'Damaged during water leak')
            ->first();
        $this->assertNotNull($damaged);

        // Show
        $this->actingAs($admin)->get("/inventory/damaged/{$damaged->id}")->assertOk();

        // Post
        $this->actingAs($admin)->post("/inventory/damaged/{$damaged->id}/post")->assertRedirect();
        $this->assertEquals('posted', $damaged->fresh()->status);
        $this->assertEquals('damaged', $serial->fresh()->status);
    }

    // ==========================================
    // 5. تقارير الجرد (Stocktaking Reports)
    // ==========================================

    public function test_stocktaking_reports_render_200_and_respect_permissions(): void
    {
        $admin = $this->createAdminUser();
        $noPermUser = $this->createNoPermUser();

        // Cost Report
        $this->actingAs($noPermUser)->get('/inventory/reports/stocktaking-cost')->assertForbidden();
        $this->actingAs($admin)->get('/inventory/reports/stocktaking-cost')->assertOk();

        // Sale Report
        $this->actingAs($noPermUser)->get('/inventory/reports/stocktaking-sale')->assertForbidden();
        $this->actingAs($admin)->get('/inventory/reports/stocktaking-sale')->assertOk();

        // No Price Report
        $this->actingAs($noPermUser)->get('/inventory/reports/stocktaking-no-price')->assertForbidden();
        $this->actingAs($admin)->get('/inventory/reports/stocktaking-no-price')->assertOk();

        // Summary Report
        $this->actingAs($noPermUser)->get('/inventory/reports/summary')->assertForbidden();
        $this->actingAs($admin)->get('/inventory/reports/summary')->assertOk();
    }

    // ==========================================
    // 6. عزل الفروع (Branch Isolation)
    // ==========================================

    public function test_branch_isolation_in_stocktaking_reports(): void
    {
        $product = Product::factory()->create([
            'tracking_type' => 'none',
            'unit_id' => $this->unit->id,
        ]);

        // Load branch A warehouse with 10 units
        app(StockService::class)->recordIn(
            productId: $product->id,
            variationId: null,
            warehouseId: $this->warehouseA->id,
            quantity: 10,
            unitCost: 100,
            movementType: 'opening_stock',
            referenceType: 'test',
            referenceId: 10
        );

        // Load branch B warehouse with 25 units
        app(StockService::class)->recordIn(
            productId: $product->id,
            variationId: null,
            warehouseId: $this->warehouseB->id,
            quantity: 25,
            unitCost: 100,
            movementType: 'opening_stock',
            referenceType: 'test',
            referenceId: 11
        );

        // Create user restricted to Branch A
        $branchAUser = \App\Models\User::factory()->create([
            'branch_id' => $this->branchA->id,
        ]);

        // Assign only report permission without branches.view_all
        Permission::firstOrCreate(['name' => 'inventory.stocktaking_cost.view', 'guard_name' => 'web']);
        $branchAUser->givePermissionTo('inventory.stocktaking_cost.view');

        $response = $this->actingAs($branchAUser)->get('/inventory/reports/stocktaking-cost');
        $response->assertOk();

        $warehousesInReport = $response->viewData('page')['props']['warehouses'];
        $warehouseIds = collect($warehousesInReport)->pluck('id')->all();

        // Must include warehouse A and NOT include warehouse B
        $this->assertContains($this->warehouseA->id, $warehouseIds);
        $this->assertNotContains($this->warehouseB->id, $warehouseIds);
    }
}
