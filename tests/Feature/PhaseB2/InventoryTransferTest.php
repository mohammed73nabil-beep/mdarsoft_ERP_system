<?php

namespace Tests\Feature\PhaseB2;

use App\Exceptions\InsufficientStockException;
use App\Models\Business;
use App\Models\FiscalYear;
use App\Models\InventoryTransfer;
use App\Models\InventoryTransferLine;
use App\Models\Product;
use App\Models\ProductSerial;
use App\Models\StockBalance;
use App\Models\StockMovement;
use App\Models\Unit;
use App\Models\User;
use App\Models\Warehouse;
use App\Services\InventoryTransferService;
use App\Services\StockService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InventoryTransferTest extends TestCase
{
    use RefreshDatabase;

    protected Business $business;
    protected Warehouse $fromWarehouse;
    protected Warehouse $toWarehouse;
    protected FiscalYear $fiscalYear;
    protected User $user;
    protected Unit $unit;
    protected StockService $stockService;
    protected InventoryTransferService $transferService;

    protected function setUp(): void
    {
        parent::setUp();

        $this->business = Business::factory()->create();
        $this->fromWarehouse = Warehouse::factory()->create();
        $this->toWarehouse = Warehouse::factory()->create();
        $this->fiscalYear = FiscalYear::factory()->create(['status' => 'open']);
        $this->user = User::factory()->create();
        $this->unit = Unit::factory()->create();
        $this->actingAs($this->user);

        $this->stockService = app(StockService::class);
        $this->transferService = app(InventoryTransferService::class);
    }

    public function test_transfer_lifecycle_and_adr25_cost_inheritance_without_changing_source_avg_cost(): void
    {
        $product = Product::factory()->create([
            'tracking_type' => 'none',
            'unit_id' => $this->unit->id,
        ]);

        // Load source warehouse with 20 items @ 100
        $this->stockService->recordIn(
            productId: $product->id,
            variationId: null,
            warehouseId: $this->fromWarehouse->id,
            quantity: 20,
            unitCost: 100,
            movementType: 'adjust_in'
        );

        // Create transfer for 8 items
        $transfer = InventoryTransfer::create([
            'transfer_number' => 'TRF-001',
            'date' => now()->toDateString(),
            'fiscal_year_id' => $this->fiscalYear->id,
            'from_warehouse_id' => $this->fromWarehouse->id,
            'to_warehouse_id' => $this->toWarehouse->id,
            'status' => 'draft',
            'created_by' => $this->user->id,
        ]);

        $line = InventoryTransferLine::create([
            'inventory_transfer_id' => $transfer->id,
            'product_id' => $product->id,
            'variation_id' => null,
            'serial_id' => null,
            'quantity' => 8,
            'unit_id' => $this->unit->id,
            'unit_cost' => 0, // will be populated from source avg_cost
        ]);

        // 1. Send transfer
        $sentTransfer = $this->transferService->send($transfer);
        $this->assertEquals('sent', $sentTransfer->status);

        $line->refresh();
        $this->assertEquals(100.0000, (float) $line->unit_cost);

        // Verify source balance deducted but avg_cost UNCHANGED
        $fromBalance = StockBalance::where('product_id', $product->id)
            ->where('warehouse_id', $this->fromWarehouse->id)
            ->first();

        $this->assertEquals(12.0000, (float) $fromBalance->quantity);
        $this->assertEquals(100.0000, (float) $fromBalance->avg_cost); // transfer_out does NOT alter source avg_cost!

        // 2. Receive transfer
        $receivedTransfer = $this->transferService->receive($sentTransfer);
        $this->assertEquals('received', $receivedTransfer->status);

        // Verify destination balance created at unit_cost 100
        $toBalance = StockBalance::where('product_id', $product->id)
            ->where('warehouse_id', $this->toWarehouse->id)
            ->first();

        $this->assertEquals(8.0000, (float) $toBalance->quantity);
        $this->assertEquals(100.0000, (float) $toBalance->avg_cost);
    }

    public function test_serial_transfer_transitions_and_single_movement(): void
    {
        $product = Product::factory()->create([
            'tracking_type' => 'serial',
            'unit_id' => $this->unit->id,
        ]);

        $serial = ProductSerial::factory()->create([
            'product_id' => $product->id,
            'warehouse_id' => $this->fromWarehouse->id,
            'status' => 'in_stock',
            'cost_price' => 300,
        ]);

        $this->stockService->recordIn(
            productId: $product->id,
            variationId: null,
            warehouseId: $this->fromWarehouse->id,
            quantity: 1,
            unitCost: 300,
            movementType: 'adjust_in',
            serialId: $serial->id
        );

        $transfer = InventoryTransfer::create([
            'transfer_number' => 'TRF-SERIAL-01',
            'date' => now()->toDateString(),
            'fiscal_year_id' => $this->fiscalYear->id,
            'from_warehouse_id' => $this->fromWarehouse->id,
            'to_warehouse_id' => $this->toWarehouse->id,
            'status' => 'draft',
            'created_by' => $this->user->id,
        ]);

        $line = InventoryTransferLine::create([
            'inventory_transfer_id' => $transfer->id,
            'product_id' => $product->id,
            'variation_id' => null,
            'serial_id' => $serial->id,
            'quantity' => 1,
            'unit_id' => $this->unit->id,
            'unit_cost' => 0,
        ]);

        // Send: serial status should become transferred
        $this->transferService->send($transfer);
        $serial->refresh();
        $this->assertEquals('transferred', $serial->status);

        // Receive: serial status should become in_stock with warehouse_id updated to toWarehouse
        $this->transferService->receive($transfer);
        $serial->refresh();
        $this->assertEquals('in_stock', $serial->status);
        $this->assertEquals($this->toWarehouse->id, $serial->warehouse_id);

        // Source warehouse balance: 0, Destination warehouse balance: 1
        $fromBal = StockBalance::where('product_id', $product->id)->where('warehouse_id', $this->fromWarehouse->id)->first();
        $toBal = StockBalance::where('product_id', $product->id)->where('warehouse_id', $this->toWarehouse->id)->first();
        $this->assertEquals(0.0000, (float) $fromBal->quantity);
        $this->assertEquals(1.0000, (float) $toBal->quantity);
    }

    public function test_transfer_atomic_rollback_on_midway_failure(): void
    {
        $product1 = Product::factory()->create(['unit_id' => $this->unit->id]);
        $product2 = Product::factory()->create(['unit_id' => $this->unit->id]);

        // Product 1 has 10 units in stock
        $this->stockService->recordIn(
            productId: $product1->id,
            variationId: null,
            warehouseId: $this->fromWarehouse->id,
            quantity: 10,
            unitCost: 50,
            movementType: 'adjust_in'
        );

        // Product 2 has only 2 units in stock
        $this->stockService->recordIn(
            productId: $product2->id,
            variationId: null,
            warehouseId: $this->fromWarehouse->id,
            quantity: 2,
            unitCost: 50,
            movementType: 'adjust_in'
        );

        $initialMovementsCount = StockMovement::count();

        // Create transfer with 2 lines: line 1 valid (5 units), line 2 invalid (requests 10 units > 2)
        $transfer = InventoryTransfer::create([
            'transfer_number' => 'TRF-FAIL-01',
            'date' => now()->toDateString(),
            'fiscal_year_id' => $this->fiscalYear->id,
            'from_warehouse_id' => $this->fromWarehouse->id,
            'to_warehouse_id' => $this->toWarehouse->id,
            'status' => 'draft',
            'created_by' => $this->user->id,
        ]);

        InventoryTransferLine::create([
            'inventory_transfer_id' => $transfer->id,
            'product_id' => $product1->id,
            'variation_id' => null,
            'quantity' => 5,
            'unit_id' => $this->unit->id,
            'unit_cost' => 50,
        ]);

        InventoryTransferLine::create([
            'inventory_transfer_id' => $transfer->id,
            'product_id' => $product2->id,
            'variation_id' => null,
            'quantity' => 10, // Exceeds available stock of 2!
            'unit_id' => $this->unit->id,
            'unit_cost' => 50,
        ]);

        try {
            $this->transferService->send($transfer);
            $this->fail('Expected InsufficientStockException on line 2');
        } catch (InsufficientStockException $e) {
            $this->assertStringContainsString('Insufficient stock', $e->getMessage());
        }

        // Verify complete rollback:
        // 1. Transfer status remains draft
        $transfer->refresh();
        $this->assertEquals('draft', $transfer->status);

        // 2. Product 1 balance is STILL 10 (not 5)
        $p1Balance = StockBalance::where('product_id', $product1->id)
            ->where('warehouse_id', $this->fromWarehouse->id)
            ->first();
        $this->assertEquals(10.0000, (float) $p1Balance->quantity);

        // 3. No new stock movements were committed
        $this->assertEquals($initialMovementsCount, StockMovement::count());
    }
}
