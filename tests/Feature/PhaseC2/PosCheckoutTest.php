<?php

namespace Tests\Feature\PhaseC2;

use App\Exceptions\InsufficientStockException;
use App\Models\Branch;
use App\Models\Business;
use App\Models\Contact;
use App\Models\FiscalYear;
use App\Models\PaymentMethod;
use App\Models\PosSession;
use App\Models\Product;
use App\Models\ProductSerial;
use App\Models\SaleOrder;
use App\Models\Treasury;
use App\Models\Unit;
use App\Models\User;
use App\Models\Warehouse;
use App\Services\PosCheckoutService;
use App\Services\StockService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use InvalidArgumentException;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class PosCheckoutTest extends TestCase
{
    use RefreshDatabase;

    protected Branch $branch;
    protected Warehouse $warehouse;
    protected Treasury $treasury;
    protected FiscalYear $fiscalYear;
    protected User $cashier;
    protected PosSession $session;
    protected Unit $unit;
    protected Contact $customer;
    protected PaymentMethod $cashMethod;
    protected PaymentMethod $networkMethod;
    protected StockService $stockService;
    protected PosCheckoutService $checkoutService;

    protected function setUp(): void
    {
        parent::setUp();

        Business::factory()->create();
        $this->branch     = Branch::factory()->create();
        $this->warehouse  = Warehouse::factory()->create(['branch_id' => $this->branch->id]);
        $this->treasury   = Treasury::factory()->create(['branch_id' => $this->branch->id]);
        $this->fiscalYear = FiscalYear::factory()->create(['status' => 'open']);
        $this->cashier    = User::factory()->create(['branch_id' => $this->branch->id]);
        $this->unit       = Unit::factory()->create();
        $this->customer   = Contact::factory()->customer()->create(['credit_limit' => 5000]);

        $this->cashMethod    = PaymentMethod::factory()->create(['type' => 'cash']);
        $this->networkMethod = PaymentMethod::factory()->create(['type' => 'network']);

        // Permissions
        Permission::findOrCreate('pos.override_price', 'web');
        Permission::findOrCreate('pos.discount', 'web');
        Permission::findOrCreate('pos_sessions.view', 'web');

        // Create open session for cashier
        $this->session = PosSession::create([
            'session_number'  => 'POS-2026-0001',
            'user_id'         => $this->cashier->id,
            'branch_id'       => $this->branch->id,
            'warehouse_id'    => $this->warehouse->id,
            'treasury_id'     => $this->treasury->id,
            'fiscal_year_id'  => $this->fiscalYear->id,
            'opened_at'       => now(),
            'opening_balance' => 500.00,
            'status'          => 'open',
        ]);

        $this->actingAs($this->cashier);
        $this->stockService    = app(StockService::class);
        $this->checkoutService = app(PosCheckoutService::class);
    }

    /**
     * Helper: create a regular (none tracking) product with explicit min_selling_price = 0
     */
    private function makeRegularProduct(array $overrides = []): Product
    {
        return Product::factory()->create(array_merge([
            'unit_id'           => $this->unit->id,
            'tracking_type'     => 'none',
            'selling_price'     => 100,
            'min_selling_price' => 0,
        ], $overrides));
    }

    /**
     * Helper: create a serial product with serials in the session warehouse.
     * Returns [Product, ProductSerial[]]
     */
    private function makeSerialProductWithSerials(int $count, array $productOverrides = []): array
    {
        $product = Product::factory()->create(array_merge([
            'unit_id'           => $this->unit->id,
            'tracking_type'     => 'serial',
            'selling_price'     => 1500,
            'min_selling_price' => 0,
        ], $productOverrides));

        $serials = [];
        for ($i = 1; $i <= $count; $i++) {
            $serial = ProductSerial::factory()->create([
                'product_id'    => $product->id,
                'warehouse_id'  => $this->warehouse->id,
                'status'        => 'in_stock',
                'serial_number' => 'IMEI-' . str_pad($i, 4, '0', STR_PAD_LEFT) . '-' . uniqid(),
            ]);

            // Record stock IN for each serial individually (StockService requires serialId for serial products)
            $this->stockService->recordIn(
                productId:    $product->id,
                variationId:  null,
                warehouseId:  $this->warehouse->id,
                quantity:     1,
                unitCost:     (float) ($productOverrides['cost_price'] ?? 1000),
                movementType: 'opening_stock',
                serialId:     $serial->id,
            );

            $serials[] = $serial;
        }

        return [$product, $serials];
    }

    // ─────────────────────────────────────────────────────────────────
    // 1. جلسة الكاشير المفتوحة وربطها بالفاتورة والدفعات
    // ─────────────────────────────────────────────────────────────────

    public function test_checkout_requires_open_cashier_session_and_binds_session_to_order_and_payments(): void
    {
        $product = $this->makeRegularProduct(['selling_price' => 100]);
        $this->stockService->recordIn($product->id, null, $this->warehouse->id, 10, 50, 'opening_stock');

        $payload = [
            'lines' => [
                [
                    'product_id' => $product->id,
                    'quantity'   => 2,
                    'unit_price' => 100,
                ],
            ],
            'payments' => [
                [
                    'payment_method_id' => $this->cashMethod->id,
                    'amount'            => 200,
                ],
            ],
        ];

        $order = $this->checkoutService->checkout($payload, $this->cashier);

        $this->assertNotNull($order->id);
        $this->assertEquals($this->session->id, $order->pos_session_id);
        $this->assertEquals('paid', $order->payment_status);
        $this->assertEquals(200.00, (float) $order->paid_amount);

        // Check payment link
        $payment = $order->payments()->first();
        $this->assertNotNull($payment);
        $this->assertEquals($this->session->id, $payment->pos_session_id);
        $this->assertEquals($this->treasury->id, $payment->treasury_id);

        // If session is closed, checkout fails
        $this->session->update(['status' => 'closed', 'closed_at' => now()]);
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('لا توجد جلسة نقطة بيع مفتوحة');
        $this->checkoutService->checkout($payload, $this->cashier);
    }

    // ─────────────────────────────────────────────────────────────────
    // 2. منتج serial: سيريال لكل وحدة في مخزن الجلسة
    // ─────────────────────────────────────────────────────────────────

    public function test_checkout_serial_product_requires_serial_per_unit_in_stock_in_session_warehouse(): void
    {
        [$product, $serials] = $this->makeSerialProductWithSerials(2);

        // 1. Missing serial IDs count mismatch
        try {
            $this->checkoutService->checkout([
                'lines' => [
                    [
                        'product_id' => $product->id,
                        'quantity'   => 2,
                        'unit_price' => 1500,
                        'serial_ids' => [$serials[0]->id], // Only 1 serial for 2 units
                    ],
                ],
            ], $this->cashier);
            $this->fail('Expected exception for serial count mismatch');
        } catch (InvalidArgumentException $e) {
            $this->assertStringContainsString('سيريال لكل وحدة', $e->getMessage());
        }

        // 2. Serial from another warehouse
        $otherWarehouse = Warehouse::factory()->create(['branch_id' => $this->branch->id]);
        $serialWrongWh  = ProductSerial::factory()->create([
            'product_id'    => $product->id,
            'warehouse_id'  => $otherWarehouse->id,
            'status'        => 'in_stock',
            'serial_number' => 'IMEI-WRONG-WH-' . uniqid(),
        ]);

        try {
            $this->checkoutService->checkout([
                'lines' => [
                    [
                        'product_id' => $product->id,
                        'quantity'   => 1,
                        'unit_price' => 1500,
                        'serial_ids' => [$serialWrongWh->id],
                    ],
                ],
            ], $this->cashier);
            $this->fail('Expected exception for wrong warehouse serial');
        } catch (InvalidArgumentException $e) {
            $this->assertStringContainsString('غير متوفر في مخزن الجلسة', $e->getMessage());
        }

        // 3. Valid serials pass and transition to sold
        $order = $this->checkoutService->checkout([
            'lines' => [
                [
                    'product_id' => $product->id,
                    'quantity'   => 2,
                    'unit_price' => 1500,
                    'serial_ids' => [$serials[0]->id, $serials[1]->id],
                ],
            ],
            'payments' => [
                [
                    'payment_method_id' => $this->cashMethod->id,
                    'amount'            => 3000,
                ],
            ],
        ], $this->cashier);

        $this->assertEquals('paid', $order->payment_status);
        $serials[0]->refresh();
        $serials[1]->refresh();
        $this->assertEquals('sold', $serials[0]->status);
        $this->assertEquals('sold', $serials[1]->status);
    }

    // ─────────────────────────────────────────────────────────────────
    // 3. دفع متعدد (نقدي + شبكة + آجل) وحد ائتمان العميل
    // ─────────────────────────────────────────────────────────────────

    public function test_checkout_multi_payment_cash_network_and_credit_limit_check(): void
    {
        $product = $this->makeRegularProduct(['selling_price' => 1000]);
        $this->stockService->recordIn($product->id, null, $this->warehouse->id, 10, 600, 'opening_stock');

        // Total = 2000. Customer credit limit is 5000.
        // Pay 500 Cash + 500 Network + 1000 Credit (Unpaid)
        $order = $this->checkoutService->checkout([
            'contact_id' => $this->customer->id,
            'lines'      => [
                [
                    'product_id' => $product->id,
                    'quantity'   => 2,
                    'unit_price' => 1000,
                ],
            ],
            'payments' => [
                [
                    'payment_method_id' => $this->cashMethod->id,
                    'amount'            => 500,
                ],
                [
                    'payment_method_id' => $this->networkMethod->id,
                    'amount'            => 500,
                ],
            ],
        ], $this->cashier);

        $order->refresh();
        $this->assertEquals(2000.0, (float) $order->total_amount);
        $this->assertEquals(1000.0, (float) $order->paid_amount);
        $this->assertEquals('partial', $order->payment_status);
        $this->assertCount(2, $order->payments);

        // Check customer subledger balance increased by 1000 net (2000 debit - 1000 credit)
        $this->assertEquals(1000.0, $this->customer->fresh()->balance);

        // Credit sale without customer contact_id throws exception
        try {
            $this->checkoutService->checkout([
                'contact_id' => null,
                'lines'      => [
                    [
                        'product_id' => $product->id,
                        'quantity'   => 1,
                        'unit_price' => 1000,
                    ],
                ],
                'payments' => [
                    [
                        'payment_method_id' => $this->cashMethod->id,
                        'amount'            => 500,
                    ],
                ],
            ], $this->cashier);
            $this->fail('Expected exception for anonymous credit sale');
        } catch (InvalidArgumentException $e) {
            $this->assertStringContainsString('البيع الآجل', $e->getMessage());
        }

        // Credit limit check: customer limit is 5000, current balance 1000. Try 4500 credit -> Exceeds (5500 > 5000)
        try {
            $this->checkoutService->checkout([
                'contact_id' => $this->customer->id,
                'lines'      => [
                    [
                        'product_id' => $product->id,
                        'quantity'   => 5,
                        'unit_price' => 1000, // Total 5000
                    ],
                ],
                'payments' => [
                    [
                        'payment_method_id' => $this->cashMethod->id,
                        'amount'            => 500, // Credit needed: 4500. Total owed would be 1000 + 4500 = 5500
                    ],
                ],
            ], $this->cashier);
            $this->fail('Expected exception for exceeding credit limit');
        } catch (InvalidArgumentException $e) {
            $this->assertStringContainsString('حد الائتمان', $e->getMessage());
        }
    }

    // ─────────────────────────────────────────────────────────────────
    // 4. مفتاح عدم التكرار idempotency_key
    // ─────────────────────────────────────────────────────────────────

    public function test_checkout_idempotency_key_prevents_duplicate_orders(): void
    {
        $product = $this->makeRegularProduct(['selling_price' => 100]);
        $this->stockService->recordIn($product->id, null, $this->warehouse->id, 10, 50, 'opening_stock');

        $key = 'pos-uuid-' . uniqid();
        $payload = [
            'idempotency_key' => $key,
            'lines'           => [
                [
                    'product_id' => $product->id,
                    'quantity'   => 1,
                    'unit_price' => 100,
                ],
            ],
            'payments' => [
                [
                    'payment_method_id' => $this->cashMethod->id,
                    'amount'            => 100,
                ],
            ],
        ];

        // First attempt succeeds
        $order = $this->checkoutService->checkout($payload, $this->cashier);
        $this->assertNotNull($order->id);

        // Second attempt with same key must throw exception
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('تمت معالجة هذه الفاتورة مسبقاً');
        $this->checkoutService->checkout($payload, $this->cashier);
    }

    // ─────────────────────────────────────────────────────────────────
    // 5. min_selling_price يتطلب pos.override_price
    // ─────────────────────────────────────────────────────────────────

    public function test_checkout_min_selling_price_requires_override_permission(): void
    {
        $product = $this->makeRegularProduct([
            'selling_price'     => 100,
            'min_selling_price' => 80,
        ]);
        $this->stockService->recordIn($product->id, null, $this->warehouse->id, 10, 50, 'opening_stock');

        $payload = [
            'lines' => [
                [
                    'product_id' => $product->id,
                    'quantity'   => 1,
                    'unit_price' => 70, // Below min_selling_price (80)
                ],
            ],
            'payments' => [
                [
                    'payment_method_id' => $this->cashMethod->id,
                    'amount'            => 70,
                ],
            ],
        ];

        // 1. Without permission -> Throws exception
        try {
            $this->checkoutService->checkout($payload, $this->cashier);
            $this->fail('Expected exception for selling below min price without permission');
        } catch (InvalidArgumentException $e) {
            $this->assertStringContainsString('pos.override_price', $e->getMessage());
        }

        // 2. With permission -> Passes
        $this->cashier->givePermissionTo('pos.override_price');
        $order = $this->checkoutService->checkout($payload, $this->cashier);
        $this->assertNotNull($order->id);
    }

    // ─────────────────────────────────────────────────────────────────
    // 6. خصم السطر والعام يتطلب pos.discount
    // ─────────────────────────────────────────────────────────────────

    public function test_checkout_discount_requires_pos_discount_permission(): void
    {
        $product = $this->makeRegularProduct(['selling_price' => 100]);
        $this->stockService->recordIn($product->id, null, $this->warehouse->id, 10, 50, 'opening_stock');

        // Line discount without permission
        $payloadLineDiscount = [
            'lines' => [
                [
                    'product_id'     => $product->id,
                    'quantity'       => 1,
                    'unit_price'     => 100,
                    'discount_value' => 10,
                    'discount_type'  => 'fixed',
                ],
            ],
            'payments' => [
                [
                    'payment_method_id' => $this->cashMethod->id,
                    'amount'            => 90,
                ],
            ],
        ];

        try {
            $this->checkoutService->checkout($payloadLineDiscount, $this->cashier);
            $this->fail('Expected exception for line discount without permission');
        } catch (InvalidArgumentException $e) {
            $this->assertStringContainsString('pos.discount', $e->getMessage());
        }

        // Header discount without permission
        $payloadHeaderDiscount = [
            'lines' => [
                [
                    'product_id' => $product->id,
                    'quantity'   => 1,
                    'unit_price' => 100,
                ],
            ],
            'discount_type'  => 'fixed',
            'discount_value' => 15,
            'payments'       => [
                [
                    'payment_method_id' => $this->cashMethod->id,
                    'amount'            => 85,
                ],
            ],
        ];

        try {
            $this->checkoutService->checkout($payloadHeaderDiscount, $this->cashier);
            $this->fail('Expected exception for header discount without permission');
        } catch (InvalidArgumentException $e) {
            $this->assertStringContainsString('pos.discount', $e->getMessage());
        }

        // Grant permission -> Passes
        $this->cashier->givePermissionTo('pos.discount');
        $order = $this->checkoutService->checkout($payloadLineDiscount, $this->cashier);
        $this->assertNotNull($order->id);
    }

    // ─────────────────────────────────────────────────────────────────
    // 7. stock:reconcile نظيف 100% بعد سيناريو بيع POS
    // ─────────────────────────────────────────────────────────────────

    public function test_stock_reconcile_runs_clean_after_pos_checkout_scenario(): void
    {
        // 1. Setup regular product
        $regularProduct = $this->makeRegularProduct(['selling_price' => 200]);
        $this->stockService->recordIn($regularProduct->id, null, $this->warehouse->id, 20, 100, 'opening_stock');

        // 2. Setup serial product with 3 serials
        [$serialProduct, $serials] = $this->makeSerialProductWithSerials(3, [
            'selling_price' => 2500,
            'cost_price'    => 1800,
        ]);

        // Pre-check reconciliation is clean
        $this->artisan('stock:reconcile')->assertExitCode(0);

        // Perform POS Checkout: sell 5 units of regular, and 2 units of serial
        $order = $this->checkoutService->checkout([
            'lines' => [
                [
                    'product_id' => $regularProduct->id,
                    'quantity'   => 5,
                    'unit_price' => 200,
                ],
                [
                    'product_id' => $serialProduct->id,
                    'quantity'   => 2,
                    'unit_price' => 2500,
                    'serial_ids' => [$serials[0]->id, $serials[1]->id],
                ],
            ],
            'payments' => [
                [
                    'payment_method_id' => $this->cashMethod->id,
                    'amount'            => 6000,
                ],
            ],
        ], $this->cashier);

        $this->assertNotNull($order->id);

        // Post-check reconciliation: stock:reconcile MUST exit with code 0 (100% clean)
        $this->artisan('stock:reconcile')->assertExitCode(0);
    }
}
