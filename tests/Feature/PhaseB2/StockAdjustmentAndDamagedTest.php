<?php

namespace Tests\Feature\PhaseB2;

use App\Models\Branch;
use App\Models\Business;
use App\Models\DamagedStock;
use App\Models\DamagedStockLine;
use App\Models\FiscalYear;
use App\Models\OpeningStock;
use App\Models\OpeningStockLine;
use App\Models\Product;
use App\Models\ProductSerial;
use App\Models\StockAdjustment;
use App\Models\StockAdjustmentLine;
use App\Models\StockBalance;
use App\Models\StockMovement;
use App\Models\Unit;
use App\Models\User;
use App\Models\Warehouse;
use App\Services\DamagedStockService;
use App\Services\OpeningStockService;
use App\Services\StockAdjustmentService;
use App\Services\StockService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StockAdjustmentAndDamagedTest extends TestCase
{
    use RefreshDatabase;

    protected Business $business;
    protected Branch $branch;
    protected Warehouse $warehouse;
    protected FiscalYear $fiscalYear;
    protected User $user;
    protected Unit $unit;
    protected StockService $stockService;
    protected OpeningStockService $openingStockService;
    protected DamagedStockService $damagedStockService;
    protected StockAdjustmentService $adjustmentService;

    protected function setUp(): void
    {
        parent::setUp();

        $this->business = Business::factory()->create();
        $this->branch = Branch::factory()->create();
        $this->warehouse = Warehouse::factory()->create(['branch_id' => $this->branch->id]);
        $this->fiscalYear = FiscalYear::factory()->create(['status' => 'open']);
        $this->user = User::factory()->create();
        $this->unit = Unit::factory()->create();
        $this->actingAs($this->user);

        $this->stockService = app(StockService::class);
        $this->openingStockService = app(OpeningStockService::class);
        $this->damagedStockService = app(DamagedStockService::class);
        $this->adjustmentService = app(StockAdjustmentService::class);
    }

    public function test_opening_stock_posting(): void
    {
        $product = Product::factory()->create(['unit_id' => $this->unit->id]);

        $opening = OpeningStock::create([
            'fiscal_year_id' => $this->fiscalYear->id,
            'branch_id' => $this->branch->id,
            'date' => now()->toDateString(),
            'status' => 'draft',
            'created_by' => $this->user->id,
        ]);

        OpeningStockLine::create([
            'opening_stock_id' => $opening->id,
            'product_id' => $product->id,
            'variation_id' => null,
            'warehouse_id' => $this->warehouse->id,
            'quantity' => 50,
            'unit_cost' => 80,
        ]);

        $this->openingStockService->post($opening);

        $opening->refresh();
        $this->assertEquals('posted', $opening->status);

        $balance = StockBalance::where('product_id', $product->id)
            ->where('warehouse_id', $this->warehouse->id)
            ->first();

        $this->assertEquals(50.0000, (float) $balance->quantity);
        $this->assertEquals(80.0000, (float) $balance->avg_cost);

        $movement = StockMovement::where('product_id', $product->id)->first();
        $this->assertEquals('opening_stock', $movement->type);
        $this->assertEquals(50.0000, (float) $movement->quantity);
        $this->assertEquals('in', $movement->direction);
    }

    public function test_damaged_stock_deduction_and_serial_status(): void
    {
        $product = Product::factory()->create([
            'tracking_type' => 'serial',
            'unit_id' => $this->unit->id,
        ]);

        $serial = ProductSerial::factory()->create([
            'product_id' => $product->id,
            'warehouse_id' => $this->warehouse->id,
            'status' => 'in_stock',
            'cost_price' => 150,
        ]);

        // Place serial in stock
        $this->stockService->recordIn(
            productId: $product->id,
            variationId: null,
            warehouseId: $this->warehouse->id,
            quantity: 1,
            unitCost: 150,
            movementType: 'adjust_in',
            serialId: $serial->id
        );

        $balance = StockBalance::where('product_id', $product->id)->where('warehouse_id', $this->warehouse->id)->first();
        $this->assertEquals(1.0000, (float) $balance->quantity);

        // Create Damaged Stock voucher
        $damagedStock = DamagedStock::create([
            'reference_number' => 'DMG-001',
            'date' => now()->toDateString(),
            'fiscal_year_id' => $this->fiscalYear->id,
            'branch_id' => $this->branch->id,
            'warehouse_id' => $this->warehouse->id,
            'status' => 'draft',
            'created_by' => $this->user->id,
        ]);

        DamagedStockLine::create([
            'damaged_stock_id' => $damagedStock->id,
            'product_id' => $product->id,
            'variation_id' => null,
            'serial_id' => $serial->id,
            'quantity' => 1,
            'unit_cost' => 150,
        ]);

        $this->damagedStockService->post($damagedStock);

        $damagedStock->refresh();
        $this->assertEquals('posted', $damagedStock->status);
        $this->assertEquals(150.0000, (float) $damagedStock->total_cost);

        // Serial status must be damaged
        $serial->refresh();
        $this->assertEquals('damaged', $serial->status);

        // Balance deducted to 0
        $balance->refresh();
        $this->assertEquals(0.0000, (float) $balance->quantity);

        // Movement type 'damaged_out'
        $movement = StockMovement::where('product_id', $product->id)->where('type', 'damaged_out')->first();
        $this->assertNotNull($movement);
        $this->assertEquals(1.0000, (float) $movement->quantity);
        $this->assertEquals('out', $movement->direction);
    }

    public function test_rehabilitating_damaged_serial_to_in_stock_via_approved_stock_adjustment(): void
    {
        $product = Product::factory()->create([
            'tracking_type' => 'serial',
            'unit_id' => $this->unit->id,
        ]);

        $serial = ProductSerial::factory()->create([
            'product_id' => $product->id,
            'warehouse_id' => $this->warehouse->id,
            'status' => 'damaged',
            'cost_price' => 200,
        ]);

        // Adjustment voucher (receiving voucher / in) to rehabilitate damaged serial
        $adjustment = StockAdjustment::create([
            'adjustment_number' => 'ADJ-REHAB-01',
            'type' => 'receiving_voucher',
            'date' => now()->toDateString(),
            'fiscal_year_id' => $this->fiscalYear->id,
            'branch_id' => $this->branch->id,
            'warehouse_id' => $this->warehouse->id,
            'status' => 'draft',
            'created_by' => $this->user->id,
        ]);

        StockAdjustmentLine::create([
            'stock_adjustment_id' => $adjustment->id,
            'product_id' => $product->id,
            'variation_id' => null,
            'serial_id' => $serial->id,
            'adjusted_quantity' => 1,
            'direction' => 'in',
            'unit_cost' => 200,
        ]);

        $this->adjustmentService->post($adjustment);

        $adjustment->refresh();
        $this->assertEquals('posted', $adjustment->status);

        // Serial status must be in_stock
        $serial->refresh();
        $this->assertEquals('in_stock', $serial->status);

        // Balance updated to 1
        $balance = StockBalance::where('product_id', $product->id)->where('warehouse_id', $this->warehouse->id)->first();
        $this->assertEquals(1.0000, (float) $balance->quantity);
    }
}
