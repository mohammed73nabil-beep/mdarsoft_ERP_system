<?php

namespace Tests\Feature\PhaseC2;

use App\Exceptions\ClosedFiscalYearException;
use App\Exceptions\InsufficientStockException;
use App\Models\Branch;
use App\Models\Business;
use App\Models\Contact;
use App\Models\ContactLedgerEntry;
use App\Models\Discount;
use App\Models\FiscalYear;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\ProductSerial;
use App\Models\Quotation;
use App\Models\SaleDraft;
use App\Models\SaleLineSerial;
use App\Models\SaleOrder;
use App\Models\SaleOrderLine;
use App\Models\SalePayment;
use App\Models\SaleReturn;
use App\Models\StockBalance;
use App\Models\StockMovement;
use App\Models\Unit;
use App\Models\User;
use App\Models\Warehouse;
use App\Services\SaleService;
use App\Services\StockService;
use App\Models\ProductPriceGroupPrice;
use App\Models\SellingPriceGroup;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use InvalidArgumentException;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class SaleOrderTest extends TestCase
{
    use RefreshDatabase;

    protected Branch $branch;
    protected Warehouse $warehouse;
    protected FiscalYear $fiscalYear;
    protected User $user;
    protected Unit $unit;
    protected Contact $customer;
    protected PaymentMethod $paymentMethod;
    protected SaleService $saleService;
    protected StockService $stockService;

    protected function setUp(): void
    {
        parent::setUp();

        Business::factory()->create();
        $this->branch        = Branch::factory()->create();
        $this->warehouse     = Warehouse::factory()->create(['branch_id' => $this->branch->id]);
        $this->fiscalYear    = FiscalYear::factory()->create(['status' => 'open']);
        $this->user          = User::factory()->create(['branch_id' => $this->branch->id]);
        $this->unit          = Unit::factory()->create();
        $this->customer      = Contact::factory()->customer()->create();
        $this->paymentMethod = PaymentMethod::factory()->create();

        // Ensure permission exists for serial return acceptance
        Permission::findOrCreate('serials.accept_return', 'web');
        $this->user->givePermissionTo('serials.accept_return');

        $this->actingAs($this->user);
        $this->saleService  = app(SaleService::class);
        $this->stockService = app(StockService::class);
    }

    public function test_create_sale_order_for_regular_product_deducts_stock_and_records_cogs_cost(): void
    {
        $product = Product::factory()->create([
            'tracking_type' => 'none',
            'unit_id'       => $this->unit->id,
            'cost_price'    => 100,
            'selling_price' => 150,
        ]);

        // Put stock in warehouse: 10 units at 100
        $this->stockService->recordIn(
            productId:     $product->id,
            variationId:   null,
            warehouseId:   $this->warehouse->id,
            quantity:      10,
            unitCost:      100,
            movementType:  'opening_stock',
            fiscalYearId:  $this->fiscalYear->id,
        );

        $order = $this->saleService->create([
            'date'         => now()->toDateString(),
            'branch_id'    => $this->branch->id,
            'warehouse_id' => $this->warehouse->id,
            'contact_id'   => $this->customer->id,
            'lines'        => [
                [
                    'product_id'   => $product->id,
                    'quantity'     => 3,
                    'unit_price'   => 150,
                ],
            ],
        ]);

        $this->assertDatabaseHas('sale_orders', [
            'id'             => $order->id,
            'order_number'   => $order->order_number,
            'total_amount'   => 450.0000,
            'status'         => 'confirmed',
            'payment_status' => 'unpaid',
        ]);

        // Stock decreased to 7
        $balance = StockBalance::where('product_id', $product->id)
            ->where('warehouse_id', $this->warehouse->id)
            ->first();
        $this->assertEquals(7, (float) $balance->quantity);

        // Movement recorded
        $this->assertDatabaseHas('stock_movements', [
            'product_id'     => $product->id,
            'warehouse_id'   => $this->warehouse->id,
            'type'           => 'sale_out',
            'direction'      => 'out',
            'quantity'       => 3,
            'reference_type' => 'SaleOrder',
            'reference_id'   => $order->id,
        ]);

        // ADR-17: Line cost price stored
        $line = $order->lines->first();
        $this->assertEquals(100.0000, (float) $line->cost_price);
    }

    public function test_create_sale_order_for_serial_product_transitions_serial_to_sold(): void
    {
        $product = Product::factory()->create([
            'tracking_type' => 'serial',
            'unit_id'       => $this->unit->id,
            'selling_price' => 1200,
        ]);

        // Create 2 serials in stock
        $serial1 = ProductSerial::factory()->create([
            'product_id'    => $product->id,
            'warehouse_id'  => $this->warehouse->id,
            'status'        => 'in_stock',
            'cost_price'    => 800,
            'serial_number' => 'SN-IPHONE-001',
        ]);

        $serial2 = ProductSerial::factory()->create([
            'product_id'    => $product->id,
            'warehouse_id'  => $this->warehouse->id,
            'status'        => 'in_stock',
            'cost_price'    => 850,
            'serial_number' => 'SN-IPHONE-002',
        ]);

        // Record stock in for both serials
        $this->stockService->recordIn($product->id, null, $this->warehouse->id, 1, 800, 'purchase_in', null, null, $serial1->id);
        $this->stockService->recordIn($product->id, null, $this->warehouse->id, 1, 850, 'purchase_in', null, null, $serial2->id);

        $order = $this->saleService->create([
            'date'         => now()->toDateString(),
            'branch_id'    => $this->branch->id,
            'warehouse_id' => $this->warehouse->id,
            'contact_id'   => $this->customer->id,
            'lines'        => [
                [
                    'product_id' => $product->id,
                    'quantity'   => 2,
                    'unit_price' => 1200,
                    'serial_ids' => [$serial1->id, $serial2->id],
                ],
            ],
        ]);

        $this->assertEquals('confirmed', $order->status);
        $this->assertEquals(2400.0000, (float) $order->total_amount);

        // Serials transitioned to sold
        $this->assertEquals('sold', $serial1->fresh()->status);
        $this->assertEquals('sold', $serial2->fresh()->status);

        // ADR-21: Warehouse id preserved
        $this->assertEquals($this->warehouse->id, $serial1->fresh()->warehouse_id);

        // ADR-16/24: Sale line serials have specific actual costs
        $this->assertDatabaseHas('sale_line_serials', [
            'serial_id'  => $serial1->id,
            'cost_price' => 800.0000,
        ]);
        $this->assertDatabaseHas('sale_line_serials', [
            'serial_id'  => $serial2->id,
            'cost_price' => 850.0000,
        ]);

        // Stock balance is now 0
        $balance = StockBalance::where('product_id', $product->id)
            ->where('warehouse_id', $this->warehouse->id)
            ->first();
        $this->assertEquals(0, (float) $balance->quantity);
    }

    public function test_sale_order_cannot_be_created_with_empty_lines(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('فاتورة المبيعات يجب أن تحتوي على سطر واحد على الأقل.');

        $this->saleService->create([
            'date'         => now()->toDateString(),
            'branch_id'    => $this->branch->id,
            'warehouse_id' => $this->warehouse->id,
            'lines'        => [],
        ]);
    }

    public function test_prevent_selling_serial_not_in_stock(): void
    {
        $product = Product::factory()->create([
            'tracking_type' => 'serial',
            'unit_id'       => $this->unit->id,
        ]);

        $serial = ProductSerial::factory()->create([
            'product_id'   => $product->id,
            'warehouse_id' => $this->warehouse->id,
            'status'       => 'sold', // Already sold!
        ]);

        $this->expectException(InvalidArgumentException::class);

        $this->saleService->create([
            'date'         => now()->toDateString(),
            'branch_id'    => $this->branch->id,
            'warehouse_id' => $this->warehouse->id,
            'lines'        => [
                [
                    'product_id' => $product->id,
                    'quantity'   => 1,
                    'unit_price' => 500,
                    'serial_ids' => [$serial->id],
                ],
            ],
        ]);
    }

    public function test_serial_count_mismatch_throws_exception(): void
    {
        $product = Product::factory()->create([
            'tracking_type' => 'serial',
            'unit_id'       => $this->unit->id,
        ]);

        $serial = ProductSerial::factory()->create([
            'product_id'   => $product->id,
            'warehouse_id' => $this->warehouse->id,
            'status'       => 'in_stock',
        ]);

        $this->expectException(InvalidArgumentException::class);

        // Requested qty 2, but only 1 serial ID passed
        $this->saleService->create([
            'date'         => now()->toDateString(),
            'branch_id'    => $this->branch->id,
            'warehouse_id' => $this->warehouse->id,
            'lines'        => [
                [
                    'product_id' => $product->id,
                    'quantity'   => 2,
                    'unit_price' => 500,
                    'serial_ids' => [$serial->id],
                ],
            ],
        ]);
    }

    public function test_sale_payment_lifecycle_and_paid_amount_sync(): void
    {
        $product = Product::factory()->create([
            'tracking_type' => 'none',
            'unit_id'       => $this->unit->id,
        ]);
        $this->stockService->recordIn($product->id, null, $this->warehouse->id, 10, 50, 'opening_stock');

        $order = $this->saleService->create([
            'date'         => now()->toDateString(),
            'branch_id'    => $this->branch->id,
            'warehouse_id' => $this->warehouse->id,
            'contact_id'   => $this->customer->id,
            'lines'        => [
                [
                    'product_id' => $product->id,
                    'quantity'   => 2,
                    'unit_price' => 100, // total 200
                ],
            ],
        ]);

        $this->assertEquals(0, (float) $order->paid_amount);
        $this->assertEquals('unpaid', $order->payment_status);

        // First payment of 50
        $payment1 = $this->saleService->recordPayment($order, [
            'date'              => now()->toDateString(),
            'amount'            => 50,
            'payment_method_id' => $this->paymentMethod->id,
        ]);

        $order->refresh();
        $this->assertEquals(50.0000, (float) $order->paid_amount);
        $this->assertEquals('partial', $order->payment_status);

        // Second payment of 150
        $payment2 = $this->saleService->recordPayment($order, [
            'date'              => now()->toDateString(),
            'amount'            => 150,
            'payment_method_id' => $this->paymentMethod->id,
        ]);

        $order->refresh();
        $this->assertEquals(200.0000, (float) $order->paid_amount);
        $this->assertEquals('paid', $order->payment_status);

        // Delete second payment
        $this->saleService->deletePayment($payment2);

        $order->refresh();
        $this->assertEquals(50.0000, (float) $order->paid_amount);
        $this->assertEquals('partial', $order->payment_status);
    }

    public function test_sub_ledger_written_on_credit_sale_and_reduced_on_payment_and_return(): void
    {
        $product = Product::factory()->create([
            'tracking_type' => 'none',
            'unit_id'       => $this->unit->id,
            'cost_price'    => 80,
        ]);
        $this->stockService->recordIn($product->id, null, $this->warehouse->id, 10, 80, 'opening_stock');

        // 1. Credit sale: 1000
        $order = $this->saleService->create([
            'date'         => now()->toDateString(),
            'branch_id'    => $this->branch->id,
            'warehouse_id' => $this->warehouse->id,
            'contact_id'   => $this->customer->id,
            'lines'        => [
                [
                    'product_id' => $product->id,
                    'quantity'   => 5,
                    'unit_price' => 200,
                ],
            ],
        ]);

        // Customer ledger has debit of 1000
        $this->assertDatabaseHas('contact_ledger_entries', [
            'contact_id'     => $this->customer->id,
            'reference_type' => 'SaleOrder',
            'reference_id'   => $order->id,
            'debit'          => 1000.0000,
            'credit'         => 0.0000,
        ]);

        // 2. Payment: 400
        $payment = $this->saleService->recordPayment($order, [
            'date'              => now()->toDateString(),
            'amount'            => 400,
            'payment_method_id' => $this->paymentMethod->id,
        ]);

        // Customer ledger has credit of 400
        $this->assertDatabaseHas('contact_ledger_entries', [
            'contact_id'     => $this->customer->id,
            'reference_type' => 'SalePayment',
            'reference_id'   => $payment->id,
            'debit'          => 0.0000,
            'credit'         => 400.0000,
        ]);

        // 3. Return: 1 item (200)
        $line = $order->lines->first();
        $return = $this->saleService->createReturn([
            'date'             => now()->toDateString(),
            'original_sale_id' => $order->id,
            'contact_id'       => $this->customer->id,
            'branch_id'        => $this->branch->id,
            'warehouse_id'     => $this->warehouse->id,
            'lines'            => [
                [
                    'original_line_id' => $line->id,
                    'product_id'       => $product->id,
                    'quantity'         => 1,
                    'unit_price'       => 200,
                    'total_amount'     => 200,
                ],
            ],
        ]);

        // Customer ledger has credit of 200
        $this->assertDatabaseHas('contact_ledger_entries', [
            'contact_id'     => $this->customer->id,
            'reference_type' => 'SaleReturn',
            'reference_id'   => $return->id,
            'debit'          => 0.0000,
            'credit'         => 200.0000,
        ]);

        // Net balance: 1000 - 400 - 200 = 400
        $this->assertEquals(400.0000, (float) $this->customer->fresh()->balance);
    }

    public function test_sale_return_restores_stock_at_original_cost_adr17(): void
    {
        $product = Product::factory()->create([
            'tracking_type' => 'none',
            'unit_id'       => $this->unit->id,
        ]);

        // Stock in at 100
        $this->stockService->recordIn($product->id, null, $this->warehouse->id, 5, 100, 'purchase_in');

        // Sale 2 units (cost is 100)
        $order = $this->saleService->create([
            'date'         => now()->toDateString(),
            'branch_id'    => $this->branch->id,
            'warehouse_id' => $this->warehouse->id,
            'contact_id'   => $this->customer->id,
            'lines'        => [
                [
                    'product_id' => $product->id,
                    'quantity'   => 2,
                    'unit_price' => 180,
                ],
            ],
        ]);

        // Now another purchase at higher cost 150 changes avg_cost of warehouse stock
        $this->stockService->recordIn($product->id, null, $this->warehouse->id, 5, 150, 'purchase_in');

        // Customer returns 1 unit
        $line = $order->lines->first();
        $return = $this->saleService->createReturn([
            'date'             => now()->toDateString(),
            'original_sale_id' => $order->id,
            'contact_id'       => $this->customer->id,
            'branch_id'        => $this->branch->id,
            'warehouse_id'     => $this->warehouse->id,
            'lines'            => [
                [
                    'original_line_id' => $line->id,
                    'product_id'       => $product->id,
                    'quantity'         => 1,
                    'unit_price'       => 180,
                    'total_amount'     => 180,
                ],
            ],
        ]);

        // ADR-17: Return movement recorded at original cost (100)
        $this->assertDatabaseHas('stock_movements', [
            'product_id'     => $product->id,
            'type'           => 'sale_return_in',
            'direction'      => 'in',
            'quantity'       => 1,
            'unit_cost'      => 100.0000,
            'reference_type' => 'SaleReturn',
            'reference_id'   => $return->id,
        ]);
    }

    public function test_sale_return_serial_transitions_sold_to_returned_and_in_stock_with_actual_cost(): void
    {
        $product = Product::factory()->create([
            'tracking_type' => 'serial',
            'unit_id'       => $this->unit->id,
        ]);

        $serial = ProductSerial::factory()->create([
            'product_id'    => $product->id,
            'warehouse_id'  => $this->warehouse->id,
            'status'        => 'in_stock',
            'cost_price'    => 750,
            'serial_number' => 'SN-RET-01',
        ]);
        $this->stockService->recordIn($product->id, null, $this->warehouse->id, 1, 750, 'purchase_in', null, null, $serial->id);

        // Sell serial
        $order = $this->saleService->create([
            'date'         => now()->toDateString(),
            'branch_id'    => $this->branch->id,
            'warehouse_id' => $this->warehouse->id,
            'contact_id'   => $this->customer->id,
            'lines'        => [
                [
                    'product_id' => $product->id,
                    'quantity'   => 1,
                    'unit_price' => 1100,
                    'serial_ids' => [$serial->id],
                ],
            ],
        ]);

        $this->assertEquals('sold', $serial->fresh()->status);

        // Return serial
        $line = $order->lines->first();
        $return = $this->saleService->createReturn([
            'date'             => now()->toDateString(),
            'original_sale_id' => $order->id,
            'contact_id'       => $this->customer->id,
            'branch_id'        => $this->branch->id,
            'warehouse_id'     => $this->warehouse->id,
            'accept_into_stock'=> true,
            'lines'            => [
                [
                    'original_line_id' => $line->id,
                    'product_id'       => $product->id,
                    'quantity'         => 1,
                    'unit_price'       => 1100,
                    'total_amount'     => 1100,
                    'serial_ids'       => [$serial->id],
                ],
            ],
        ]);

        // Serial returned to in_stock
        $this->assertEquals('in_stock', $serial->fresh()->status);

        // Recorded in return line serials with original cost 750
        $this->assertDatabaseHas('sale_return_line_serials', [
            'serial_id'  => $serial->id,
            'cost_price' => 750.0000,
        ]);

        // Stock movement in recorded
        $this->assertDatabaseHas('stock_movements', [
            'product_id'     => $product->id,
            'serial_id'      => $serial->id,
            'type'           => 'sale_return_in',
            'direction'      => 'in',
            'quantity'       => 1,
            'unit_cost'      => 750.0000,
            'reference_type' => 'SaleReturn',
            'reference_id'   => $return->id,
        ]);
    }

    public function test_prevent_returning_more_than_sold_quantity(): void
    {
        $product = Product::factory()->create([
            'tracking_type' => 'none',
            'unit_id'       => $this->unit->id,
        ]);
        $this->stockService->recordIn($product->id, null, $this->warehouse->id, 5, 50, 'opening_stock');

        $order = $this->saleService->create([
            'date'         => now()->toDateString(),
            'branch_id'    => $this->branch->id,
            'warehouse_id' => $this->warehouse->id,
            'lines'        => [
                [
                    'product_id' => $product->id,
                    'quantity'   => 2,
                    'unit_price' => 100,
                ],
            ],
        ]);

        $line = $order->lines->first();

        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('لا يمكن إرجاع كمية');

        // Try returning 3 when only 2 were purchased
        $this->saleService->createReturn([
            'date'             => now()->toDateString(),
            'original_sale_id' => $order->id,
            'branch_id'        => $this->branch->id,
            'warehouse_id'     => $this->warehouse->id,
            'lines'            => [
                [
                    'original_line_id' => $line->id,
                    'product_id'       => $product->id,
                    'quantity'         => 3,
                    'unit_price'       => 100,
                    'total_amount'     => 300,
                ],
            ],
        ]);
    }

    public function test_header_and_line_discounts_calculated_correctly(): void
    {
        $product = Product::factory()->create([
            'tracking_type' => 'none',
            'unit_id'       => $this->unit->id,
        ]);
        $this->stockService->recordIn($product->id, null, $this->warehouse->id, 10, 50, 'opening_stock');

        $discount = Discount::factory()->create([
            'type'      => 'percentage',
            'value'     => 10, // 10%
            'is_active' => true,
        ]);

        // Line: 2 * 100 = 200, line discount = 20 -> subtotal = 180
        // Header discount: 10% on 180 = 18 -> total = 162
        $order = $this->saleService->create([
            'date'            => now()->toDateString(),
            'branch_id'       => $this->branch->id,
            'warehouse_id'    => $this->warehouse->id,
            'discount_id'     => $discount->id,
            'lines'           => [
                [
                    'product_id'      => $product->id,
                    'quantity'        => 2,
                    'unit_price'      => 100,
                    'discount_amount' => 20,
                ],
            ],
        ]);

        $this->assertEquals(180.0000, (float) $order->subtotal);
        $this->assertEquals(18.0000, (float) $order->discount_amount);
        $this->assertEquals(162.0000, (float) $order->total_amount);
    }

    public function test_quotation_creation_and_lines(): void
    {
        $product = Product::factory()->create([
            'unit_id' => $this->unit->id,
        ]);

        $quotation = $this->saleService->createQuotation([
            'date'         => now()->toDateString(),
            'branch_id'    => $this->branch->id,
            'warehouse_id' => $this->warehouse->id,
            'contact_id'   => $this->customer->id,
            'lines'        => [
                [
                    'product_id' => $product->id,
                    'quantity'   => 5,
                    'unit_price' => 250,
                ],
            ],
        ]);

        $this->assertDatabaseHas('quotations', [
            'id'           => $quotation->id,
            'total_amount' => 1250.0000,
            'status'       => 'draft',
        ]);
        $this->assertCount(1, $quotation->lines);
    }

    public function test_sale_draft_creation_and_lines(): void
    {
        $product = Product::factory()->create([
            'unit_id' => $this->unit->id,
        ]);

        $draft = $this->saleService->createDraft([
            'date'         => now()->toDateString(),
            'branch_id'    => $this->branch->id,
            'warehouse_id' => $this->warehouse->id,
            'contact_id'   => $this->customer->id,
            'lines'        => [
                [
                    'product_id' => $product->id,
                    'quantity'   => 4,
                    'unit_price' => 300,
                ],
            ],
        ]);

        $this->assertDatabaseHas('sale_drafts', [
            'id'           => $draft->id,
            'total_amount' => 1200.0000,
        ]);
        $this->assertCount(1, $draft->lines);
    }

    public function test_sale_order_rejected_in_closed_fiscal_year(): void
    {
        $closedFiscalYear = FiscalYear::factory()->create(['status' => 'closed']);

        $product = Product::factory()->create([
            'tracking_type' => 'none',
            'unit_id'       => $this->unit->id,
            'cost_price'    => 100,
            'selling_price' => 150,
        ]);

        $this->stockService->recordIn(
            productId:    $product->id,
            variationId:  null,
            warehouseId:  $this->warehouse->id,
            quantity:     10,
            unitCost:     100,
            movementType: 'opening_stock',
            fiscalYearId: $this->fiscalYear->id,
        );

        $this->expectException(ClosedFiscalYearException::class);

        $this->saleService->create([
            'date'           => now()->toDateString(),
            'branch_id'      => $this->branch->id,
            'warehouse_id'   => $this->warehouse->id,
            'fiscal_year_id' => $closedFiscalYear->id,
            'contact_id'     => $this->customer->id,
            'lines'          => [
                [
                    'product_id' => $product->id,
                    'quantity'   => 1,
                    'unit_price' => 150,
                ],
            ],
        ]);
    }

    public function test_sale_order_branch_isolation_and_scoping(): void
    {
        $branch2 = Branch::factory()->create();
        $warehouse2 = Warehouse::factory()->create(['branch_id' => $branch2->id]);
        $userBranch2 = User::factory()->create(['branch_id' => $branch2->id]);

        $saleBranch1 = SaleOrder::factory()->create([
            'branch_id'    => $this->branch->id,
            'warehouse_id' => $this->warehouse->id,
            'contact_id'   => $this->customer->id,
            'order_number' => 'INV-ISO-BR1',
        ]);

        $saleBranch2 = SaleOrder::factory()->create([
            'branch_id'    => $branch2->id,
            'warehouse_id' => $warehouse2->id,
            'contact_id'   => $this->customer->id,
            'order_number' => 'INV-ISO-BR2',
        ]);

        // Branch 1 user without branches.view_all cannot see branch 2 sale
        $this->actingAs($this->user);
        $this->assertNotNull(SaleOrder::find($saleBranch1->id));
        $this->assertNull(SaleOrder::find($saleBranch2->id));

        // Branch 2 user cannot see branch 1 sale
        $this->actingAs($userBranch2);
        $this->assertNull(SaleOrder::find($saleBranch1->id));
        $this->assertNotNull(SaleOrder::find($saleBranch2->id));
    }

    public function test_sale_order_insufficient_stock_exception_inertia_and_json_responses(): void
    {
        Permission::findOrCreate('sales.create.view', 'web');
        $this->user->givePermissionTo('sales.create.view');

        $product = Product::factory()->create([
            'tracking_type' => 'none',
            'unit_id'       => $this->unit->id,
            'cost_price'    => 100,
            'selling_price' => 150,
        ]);
        // Put only 2 items in stock
        $this->stockService->recordIn(
            productId:    $product->id,
            variationId:  null,
            warehouseId:  $this->warehouse->id,
            quantity:     2,
            unitCost:     100,
            movementType: 'opening_stock',
            fiscalYearId: $this->fiscalYear->id,
        );

        $payload = [
            'date'         => now()->toDateString(),
            'branch_id'    => $this->branch->id,
            'warehouse_id' => $this->warehouse->id,
            'contact_id'   => $this->customer->id,
            'lines'        => [
                [
                    'product_id' => $product->id,
                    'quantity'   => 5, // Requires 5 but only 2 available
                    'unit_price' => 150,
                ],
            ],
        ];

        // 1. Inertia / Web request: redirects back with errors.stock with Arabic message
        $responseWeb = $this->actingAs($this->user)
            ->from('/sales/create')
            ->post('/sales', $payload);

        $responseWeb->assertRedirect('/sales/create');
        $responseWeb->assertSessionHasErrors(['stock']);
        $errorMsg = session('errors')->first('stock');
        $this->assertStringContainsString('غير كافٍ', $errorMsg);

        // 2. JSON request: returns 422 with JSON error structure
        $responseJson = $this->actingAs($this->user)
            ->postJson('/sales', $payload);

        $responseJson->assertStatus(422)
            ->assertJsonStructure(['message', 'errors' => ['stock']]);
        $this->assertStringContainsString('غير كافٍ', $responseJson->json('message'));
    }

    public function test_sale_payment_sync_after_adding_two_payments_and_deleting_one(): void
    {
        $product = Product::factory()->create([
            'tracking_type' => 'none',
            'unit_id'       => $this->unit->id,
            'cost_price'    => 100,
            'selling_price' => 200,
        ]);
        $this->stockService->recordIn($product->id, null, $this->warehouse->id, 10, 100, 'opening_stock');

        $order = $this->saleService->create([
            'date'         => now()->toDateString(),
            'branch_id'    => $this->branch->id,
            'warehouse_id' => $this->warehouse->id,
            'contact_id'   => $this->customer->id,
            'lines'        => [
                [
                    'product_id' => $product->id,
                    'quantity'   => 5,
                    'unit_price' => 200, // Total = 1000
                ],
            ],
        ]);

        $this->assertEquals(1000.0000, (float) $order->total_amount);
        $this->assertEquals(0.0, (float) $order->paid_amount);
        $this->assertEquals('unpaid', $order->payment_status);

        // Add payment 1: 300
        $pay1 = $this->saleService->recordPayment($order, [
            'amount'            => 300,
            'payment_method_id' => $this->paymentMethod->id,
            'date'              => now()->toDateString(),
        ]);
        $order->refresh();
        $this->assertEquals(300.0000, (float) $order->paid_amount);
        $this->assertEquals('partial', $order->payment_status);

        // Add payment 2: 400
        $pay2 = $this->saleService->recordPayment($order, [
            'amount'            => 400,
            'payment_method_id' => $this->paymentMethod->id,
            'date'              => now()->toDateString(),
        ]);
        $order->refresh();
        $this->assertEquals(700.0000, (float) $order->paid_amount);
        $this->assertEquals('partial', $order->payment_status);

        // Delete payment 1 (300) -> remaining paid = 400
        $this->saleService->deletePayment($pay1);
        $order->refresh();
        $this->assertEquals(400.0000, (float) $order->paid_amount);
        $this->assertEquals('partial', $order->payment_status);
        $this->assertDatabaseMissing('sale_payments', ['id' => $pay1->id]);
        $this->assertDatabaseHas('sale_payments', ['id' => $pay2->id]);
    }

    public function test_product_price_group_price_adr20_variation_null(): void
    {
        $group = SellingPriceGroup::factory()->create();
        $product = Product::factory()->create([
            'unit_id'       => $this->unit->id,
            'selling_price' => 200,
        ]);

        // ADR-20: Price for group with variation_id = NULL
        $groupPrice = ProductPriceGroupPrice::create([
            'product_id'             => $product->id,
            'variation_id'           => null,
            'selling_price_group_id' => $group->id,
            'price'                  => 160.00,
        ]);

        $this->assertDatabaseHas('product_price_group_prices', [
            'id'                     => $groupPrice->id,
            'selling_price_group_id' => $group->id,
            'product_id'             => $product->id,
            'variation_key'          => '0',
            'price'                  => 160.00,
        ]);

        // Unique constraint prevents duplicate with variation_id = null
        $this->expectException(QueryException::class);
        ProductPriceGroupPrice::create([
            'product_id'             => $product->id,
            'variation_id'           => null,
            'selling_price_group_id' => $group->id,
            'price'                  => 180.00,
        ]);
    }
}
