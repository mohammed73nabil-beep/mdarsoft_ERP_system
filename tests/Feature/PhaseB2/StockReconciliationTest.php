<?php

namespace Tests\Feature\PhaseB2;

use App\Models\Business;
use App\Models\FiscalYear;
use App\Models\Product;
use App\Models\ProductSerial;
use App\Models\StockBalance;
use App\Models\Unit;
use App\Models\User;
use App\Models\Warehouse;
use App\Services\StockReconciliationService;
use App\Services\StockService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class StockReconciliationTest extends TestCase
{
    use RefreshDatabase;

    protected Business $business;
    protected Warehouse $warehouse;
    protected FiscalYear $fiscalYear;
    protected User $user;
    protected Unit $unit;
    protected StockService $stockService;
    protected StockReconciliationService $reconciliationService;

    protected function setUp(): void
    {
        parent::setUp();

        $this->business = Business::factory()->create();
        $this->warehouse = Warehouse::factory()->create();
        $this->fiscalYear = FiscalYear::factory()->create(['status' => 'open']);
        $this->user = User::factory()->create();
        $this->unit = Unit::factory()->create();
        $this->actingAs($this->user);

        $this->stockService = app(StockService::class);
        $this->reconciliationService = app(StockReconciliationService::class);
    }

    public function test_reconciliation_is_clean_after_normal_stock_operations(): void
    {
        $product = Product::factory()->create(['unit_id' => $this->unit->id]);

        $this->stockService->recordIn(
            productId: $product->id,
            variationId: null,
            warehouseId: $this->warehouse->id,
            quantity: 25,
            unitCost: 100,
            movementType: 'adjust_in'
        );

        $this->stockService->recordOut(
            productId: $product->id,
            variationId: null,
            warehouseId: $this->warehouse->id,
            quantity: 5,
            unitCost: 100,
            movementType: 'adjust_out'
        );

        $result = $this->reconciliationService->reconcile();
        $this->assertTrue($result['is_clean']);
        $this->assertFalse($result['has_discrepancies']);

        $this->artisan('stock:reconcile')->assertExitCode(0);
    }

    public function test_detection_of_artificial_stock_movement_discrepancy(): void
    {
        $product = Product::factory()->create(['unit_id' => $this->unit->id]);

        $this->stockService->recordIn(
            productId: $product->id,
            variationId: null,
            warehouseId: $this->warehouse->id,
            quantity: 10,
            unitCost: 100,
            movementType: 'adjust_in'
        );

        // Artificially tamper balance directly via DB::table
        $balance = StockBalance::where('product_id', $product->id)
            ->where('warehouse_id', $this->warehouse->id)
            ->first();

        DB::table('stock_balances')->where('id', $balance->id)->update([
            'quantity' => 99, // tampered! movements sum is 10
        ]);

        $result = $this->reconciliationService->reconcile();

        $this->assertFalse($result['is_clean']);
        $this->assertTrue($result['has_discrepancies']);
        $this->assertCount(1, $result['movement_discrepancies']);
        $this->assertEquals(99.0000, (float) $result['movement_discrepancies'][0]->stored_quantity);
        $this->assertEquals(10.0000, (float) $result['movement_discrepancies'][0]->movements_sum);

        // Verify artisan command returns failure
        $this->artisan('stock:reconcile')->assertExitCode(1);

        // Restore balance
        DB::table('stock_balances')->where('id', $balance->id)->update([
            'quantity' => 10,
        ]);

        $cleanResult = $this->reconciliationService->reconcile();
        $this->assertTrue($cleanResult['is_clean']);
        $this->artisan('stock:reconcile')->assertExitCode(0);
    }

    public function test_detection_of_serial_stock_discrepancy(): void
    {
        $product = Product::factory()->create([
            'tracking_type' => 'serial',
            'unit_id' => $this->unit->id,
        ]);

        $serial = ProductSerial::factory()->create([
            'product_id' => $product->id,
            'warehouse_id' => $this->warehouse->id,
            'status' => 'in_stock',
            'cost_price' => 500,
        ]);

        $this->stockService->recordIn(
            productId: $product->id,
            variationId: null,
            warehouseId: $this->warehouse->id,
            quantity: 1,
            unitCost: 500,
            movementType: 'adjust_in',
            serialId: $serial->id
        );

        // Initial state is reconciled
        $this->assertTrue($this->reconciliationService->reconcile()['is_clean']);

        // Artificially change serial status in DB without recording stock movement
        DB::table('product_serials')->where('id', $serial->id)->update([
            'status' => 'damaged',
        ]);

        // Balance is 1, but in_stock count is 0
        $result = $this->reconciliationService->reconcile();

        $this->assertFalse($result['is_clean']);
        $this->assertCount(1, $result['serial_discrepancies']);
        $this->assertEquals(1.0000, (float) $result['serial_discrepancies'][0]->stored_quantity);
        $this->assertEquals(0, $result['serial_discrepancies'][0]->in_stock_serial_count);

        $this->artisan('stock:reconcile')->assertExitCode(1);
    }
}
