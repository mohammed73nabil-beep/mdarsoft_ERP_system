<?php

namespace Tests\Feature\PhaseB2;

use App\Exceptions\InsufficientStockException;
use App\Models\Business;
use App\Models\FiscalYear;
use App\Models\Product;
use App\Models\ProductSerial;
use App\Models\StockBalance;
use App\Models\StockMovement;
use App\Models\Unit;
use App\Models\User;
use App\Models\Warehouse;
use App\Services\StockService;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use RuntimeException;
use Tests\TestCase;

class StockServiceTest extends TestCase
{
    use RefreshDatabase;

    protected Business $business;
    protected Warehouse $warehouse;
    protected FiscalYear $fiscalYear;
    protected User $user;
    protected Unit $unit;
    protected StockService $stockService;

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
    }

    public function test_weighted_average_cost_calculation(): void
    {
        // 10 units @ 100, then 5 units @ 120 = 106.6667
        $product = Product::factory()->create([
            'tracking_type' => 'none',
            'unit_id' => $this->unit->id,
            'cost_price' => 100,
        ]);

        // First batch: 10 * 100
        $this->stockService->recordIn(
            productId: $product->id,
            variationId: null,
            warehouseId: $this->warehouse->id,
            quantity: 10,
            unitCost: 100,
            movementType: 'adjust_in'
        );

        $balance = StockBalance::where('product_id', $product->id)
            ->where('warehouse_id', $this->warehouse->id)
            ->first();

        $this->assertEquals(10.0000, (float) $balance->quantity);
        $this->assertEquals(100.0000, (float) $balance->avg_cost);

        // Second batch: 5 * 120 -> ((10*100) + (5*120)) / 15 = 1600 / 15 = 106.6667
        $this->stockService->recordIn(
            productId: $product->id,
            variationId: null,
            warehouseId: $this->warehouse->id,
            quantity: 5,
            unitCost: 120,
            movementType: 'adjust_in'
        );

        $balance->refresh();
        $this->assertEquals(15.0000, (float) $balance->quantity);
        $this->assertEquals(106.6667, (float) $balance->avg_cost);
    }

    public function test_negative_stock_is_strictly_prevented(): void
    {
        $product = Product::factory()->create([
            'tracking_type' => 'none',
            'unit_id' => $this->unit->id,
        ]);

        // Add 10 items
        $this->stockService->recordIn(
            productId: $product->id,
            variationId: null,
            warehouseId: $this->warehouse->id,
            quantity: 10,
            unitCost: 50,
            movementType: 'adjust_in'
        );

        // Attempting to withdraw 11 must throw InsufficientStockException
        $this->expectException(InsufficientStockException::class);
        $this->stockService->recordOut(
            productId: $product->id,
            variationId: null,
            warehouseId: $this->warehouse->id,
            quantity: 11,
            unitCost: null,
            movementType: 'adjust_out'
        );
    }

    public function test_single_movement_per_serial_device(): void
    {
        $product = Product::factory()->create([
            'tracking_type' => 'serial',
            'unit_id' => $this->unit->id,
        ]);

        $serial1 = ProductSerial::factory()->create([
            'product_id' => $product->id,
            'warehouse_id' => $this->warehouse->id,
            'status' => 'in_stock',
            'cost_price' => 200,
        ]);
        $serial2 = ProductSerial::factory()->create([
            'product_id' => $product->id,
            'warehouse_id' => $this->warehouse->id,
            'status' => 'in_stock',
            'cost_price' => 250,
        ]);

        // Record incoming for each serial
        $m1 = $this->stockService->recordIn(
            productId: $product->id,
            variationId: null,
            warehouseId: $this->warehouse->id,
            quantity: 1,
            unitCost: 200,
            movementType: 'adjust_in',
            serialId: $serial1->id
        );

        $m2 = $this->stockService->recordIn(
            productId: $product->id,
            variationId: null,
            warehouseId: $this->warehouse->id,
            quantity: 1,
            unitCost: 250,
            movementType: 'adjust_in',
            serialId: $serial2->id
        );

        $this->assertEquals(1.0000, (float) $m1->quantity);
        $this->assertEquals('in', $m1->direction);
        $this->assertEquals($serial1->id, $m1->serial_id);

        $this->assertEquals(1.0000, (float) $m2->quantity);
        $this->assertEquals('in', $m2->direction);
        $this->assertEquals($serial2->id, $m2->serial_id);

        $movementsCount = StockMovement::where('product_id', $product->id)->count();
        $this->assertEquals(2, $movementsCount);

        $balance = StockBalance::where('product_id', $product->id)->where('warehouse_id', $this->warehouse->id)->first();
        $this->assertEquals(2.0000, (float) $balance->quantity);
    }

    public function test_stock_movement_cannot_be_updated_or_deleted_via_eloquent(): void
    {
        $product = Product::factory()->create(['unit_id' => $this->unit->id]);

        $movement = $this->stockService->recordIn(
            productId: $product->id,
            variationId: null,
            warehouseId: $this->warehouse->id,
            quantity: 5,
            unitCost: 30,
            movementType: 'adjust_in'
        );

        // Eloquent update attempt
        try {
            $movement->quantity = 999;
            $movement->save();
            $this->fail('Expected RuntimeException on updating movement');
        } catch (RuntimeException $e) {
            $this->assertStringContainsString('immutable', $e->getMessage());
        }

        // Eloquent delete attempt
        try {
            $movement->delete();
            $this->fail('Expected RuntimeException on deleting movement');
        } catch (RuntimeException $e) {
            $this->assertStringContainsString('immutable', $e->getMessage());
        }
    }

    public function test_stock_movement_cannot_be_updated_or_deleted_via_direct_db_triggers(): void
    {
        $product = Product::factory()->create(['unit_id' => $this->unit->id]);

        $movement = $this->stockService->recordIn(
            productId: $product->id,
            variationId: null,
            warehouseId: $this->warehouse->id,
            quantity: 5,
            unitCost: 30,
            movementType: 'adjust_in'
        );

        // Direct DB update
        try {
            DB::table('stock_movements')->where('id', $movement->id)->update(['quantity' => 999]);
            $this->fail('Expected trigger QueryException on direct DB update');
        } catch (QueryException $e) {
            $this->assertStringContainsString('immutable', $e->getMessage());
        }

        // Direct DB delete
        try {
            DB::table('stock_movements')->where('id', $movement->id)->delete();
            $this->fail('Expected trigger QueryException on direct DB delete');
        } catch (QueryException $e) {
            $this->assertStringContainsString('immutable', $e->getMessage());
        }
    }

    public function test_null_variation_id_does_not_duplicate_stock_balance(): void
    {
        $product = Product::factory()->create(['unit_id' => $this->unit->id]);

        // First operation
        $this->stockService->recordIn(
            productId: $product->id,
            variationId: null,
            warehouseId: $this->warehouse->id,
            quantity: 10,
            unitCost: 50,
            movementType: 'adjust_in'
        );

        // Second operation with null variation
        $this->stockService->recordIn(
            productId: $product->id,
            variationId: null,
            warehouseId: $this->warehouse->id,
            quantity: 5,
            unitCost: 50,
            movementType: 'adjust_in'
        );

        // Count must be exactly 1
        $count = StockBalance::where('product_id', $product->id)
            ->where('warehouse_id', $this->warehouse->id)
            ->count();

        $this->assertEquals(1, $count);

        $balance = StockBalance::where('product_id', $product->id)
            ->where('warehouse_id', $this->warehouse->id)
            ->first();

        $this->assertEquals(15.0000, (float) $balance->quantity);
        $this->assertEquals(0, $balance->variation_key);
    }
}
