<?php

namespace Tests\Feature\PhaseC1;

use App\Exceptions\ClosedFiscalYearException;
use App\Models\Branch;
use App\Models\Business;
use App\Models\Contact;
use App\Models\ContactLedgerEntry;
use App\Models\FiscalYear;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\ProductSerial;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderLine;
use App\Models\PurchasePayment;
use App\Models\PurchaseReturn;
use App\Models\PurchaseReturnLine;
use App\Models\PurchaseReturnLineSerial;
use App\Models\StockBalance;
use App\Models\StockMovement;
use App\Models\Unit;
use App\Models\User;
use App\Models\Warehouse;
use App\Services\PurchaseService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use InvalidArgumentException;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class PurchaseOrderTest extends TestCase
{
    use RefreshDatabase;

    protected Branch $branch;
    protected Warehouse $warehouse;
    protected FiscalYear $fiscalYear;
    protected User $user;
    protected Unit $unit;
    protected Contact $supplier;
    protected PaymentMethod $paymentMethod;
    protected PurchaseService $purchaseService;

    protected function setUp(): void
    {
        parent::setUp();

        Business::factory()->create();
        $this->branch        = Branch::factory()->create();
        $this->warehouse     = Warehouse::factory()->create(['branch_id' => $this->branch->id]);
        $this->fiscalYear    = FiscalYear::factory()->create(['status' => 'open']);
        $this->user          = User::factory()->create(['branch_id' => $this->branch->id]);
        $this->unit          = Unit::factory()->create();
        $this->supplier      = Contact::factory()->supplier()->create();
        $this->paymentMethod = PaymentMethod::factory()->create();

        $this->actingAs($this->user);
        $this->purchaseService = app(PurchaseService::class);
    }

    // ── 1. إنشاء أمر شراء (منتج عادي) ────────────────────────────
    public function test_create_purchase_order_for_regular_product(): void
    {
        $product = Product::factory()->create([
            'tracking_type' => 'none',
            'unit_id'       => $this->unit->id,
        ]);

        $order = $this->purchaseService->create([
            'contact_id'   => $this->supplier->id,
            'branch_id'    => $this->branch->id,
            'warehouse_id' => $this->warehouse->id,
            'date'         => now()->toDateString(),
            'fiscal_year_id' => $this->fiscalYear->id,
            'notes'        => null,
            'lines'        => [
                [
                    'product_id'      => $product->id,
                    'variation_id'    => null,
                    'quantity'        => 10,
                    'unit_id'         => $this->unit->id,
                    'unit_cost'       => 500,
                    'discount_amount' => 0,
                    'tax_amount'      => 0,
                    'total_amount'    => 5000,
                ],
            ],
        ]);

        $this->assertEquals('confirmed', $order->status);
        $this->assertEquals(1, $order->lines->count());
        $this->assertEquals('5000.0000', $order->total_amount);
        $this->assertEquals('unpaid', $order->payment_status);

        // لم يدخل مخزون بعد (status = confirmed فقط)
        $this->assertEquals(0, StockMovement::count());
    }

    // ── 2. استلام أمر الشراء يحدّث المخزون ──────────────────────
    public function test_receive_purchase_order_updates_stock_for_regular_product(): void
    {
        $product = Product::factory()->create([
            'tracking_type' => 'none',
            'unit_id'       => $this->unit->id,
        ]);

        $order = $this->purchaseService->create([
            'contact_id'     => $this->supplier->id,
            'branch_id'      => $this->branch->id,
            'warehouse_id'   => $this->warehouse->id,
            'date'           => now()->toDateString(),
            'fiscal_year_id' => $this->fiscalYear->id,
            'notes'          => null,
            'lines'          => [[
                'product_id'      => $product->id,
                'variation_id'    => null,
                'quantity'        => 5,
                'unit_id'         => $this->unit->id,
                'unit_cost'       => 300,
                'discount_amount' => 0,
                'tax_amount'      => 0,
                'total_amount'    => 1500,
            ]],
        ]);

        $received = $this->purchaseService->receive($order);

        $this->assertEquals('received', $received->status);

        // حركة مخزون واحدة (purchase_in)
        $movements = StockMovement::where('type', 'purchase_in')->get();
        $this->assertCount(1, $movements);
        $this->assertEquals(5, $movements->first()->quantity);
        $this->assertEquals('300.0000', $movements->first()->unit_cost);

        // رصيد المخزون محدّث
        $balance = StockBalance::where('product_id', $product->id)
            ->where('warehouse_id', $this->warehouse->id)
            ->first();
        $this->assertEquals(5, $balance->quantity);
        $this->assertEquals('300.0000', $balance->avg_cost);
    }

    // ── 3. استلام منتج سيريال يحدّث حالة السيريال والمخزون ──────
    public function test_receive_serial_product_transitions_serial_to_in_stock(): void
    {
        $product = Product::factory()->create([
            'tracking_type' => 'serial',
            'unit_id'       => $this->unit->id,
        ]);

        // إنشاء سيريال بحالة in_stock
        $serial = ProductSerial::create([
            'product_id'    => $product->id,
            'serial_number' => 'SN-NEW-001',
            'status'        => 'in_stock',
            'warehouse_id'  => $this->warehouse->id,
            'cost_price'    => 0,
        ]);

        $order = $this->purchaseService->create([
            'contact_id'     => $this->supplier->id,
            'branch_id'      => $this->branch->id,
            'warehouse_id'   => $this->warehouse->id,
            'date'           => now()->toDateString(),
            'fiscal_year_id' => $this->fiscalYear->id,
            'notes'          => null,
            'lines'          => [[
                'product_id'      => $product->id,
                'variation_id'    => null,
                'quantity'        => 1,
                'unit_id'         => $this->unit->id,
                'unit_cost'       => 1200,
                'discount_amount' => 0,
                'tax_amount'      => 0,
                'total_amount'    => 1200,
            ]],
        ]);

        $line = $order->lines->first();

        $received = $this->purchaseService->receive($order, [
            $line->id => ['serial_ids' => [$serial->id]],
        ]);

        $this->assertEquals('received', $received->status);

        // حالة السيريال تحوّلت إلى in_stock
        $serial->refresh();
        $this->assertEquals('in_stock', $serial->status);
        $this->assertEquals('1200.0000', $serial->cost_price);

        // حركة مخزون qty=1 مع serial_id
        $movement = StockMovement::where('type', 'purchase_in')->first();
        $this->assertNotNull($movement);
        $this->assertEquals(1, $movement->quantity);
        $this->assertEquals($serial->id, $movement->serial_id);

        // رصيد المخزون = 1
        $balance = StockBalance::where('product_id', $product->id)
            ->where('warehouse_id', $this->warehouse->id)
            ->first();
        $this->assertEquals(1, $balance->quantity);
    }

    // ── 4. منع استلام أمر مستلم مرة ثانية ─────────────────────
    public function test_receiving_already_received_order_throws_exception(): void
    {
        $product = Product::factory()->create([
            'tracking_type' => 'none',
            'unit_id'       => $this->unit->id,
        ]);

        $order = $this->purchaseService->create([
            'contact_id'     => $this->supplier->id,
            'branch_id'      => $this->branch->id,
            'warehouse_id'   => $this->warehouse->id,
            'date'           => now()->toDateString(),
            'fiscal_year_id' => $this->fiscalYear->id,
            'notes'          => null,
            'lines'          => [[
                'product_id'      => $product->id,
                'variation_id'    => null,
                'quantity'        => 3,
                'unit_id'         => $this->unit->id,
                'unit_cost'       => 200,
                'discount_amount' => 0,
                'tax_amount'      => 0,
                'total_amount'    => 600,
            ]],
        ]);

        $this->purchaseService->receive($order);
        $order->refresh();

        $this->expectException(InvalidArgumentException::class);
        $this->purchaseService->receive($order);
    }

    // ── 5. تسجيل دفعة يحدّث paid_amount و payment_status ────────
    public function test_record_payment_updates_paid_amount_and_status(): void
    {
        $product = Product::factory()->create([
            'tracking_type' => 'none',
            'unit_id'       => $this->unit->id,
        ]);

        $order = $this->purchaseService->create([
            'contact_id'     => $this->supplier->id,
            'branch_id'      => $this->branch->id,
            'warehouse_id'   => $this->warehouse->id,
            'date'           => now()->toDateString(),
            'fiscal_year_id' => $this->fiscalYear->id,
            'notes'          => null,
            'lines'          => [[
                'product_id'      => $product->id,
                'variation_id'    => null,
                'quantity'        => 2,
                'unit_id'         => $this->unit->id,
                'unit_cost'       => 1000,
                'discount_amount' => 0,
                'tax_amount'      => 0,
                'total_amount'    => 2000,
            ]],
        ]);

        // دفعة جزئية
        $this->purchaseService->recordPayment($order, [
            'date'              => now()->toDateString(),
            'amount'            => 1000,
            'payment_method_id' => $this->paymentMethod->id,
        ]);
        $order->refresh();
        $this->assertEquals('1000.0000', $order->paid_amount);
        $this->assertEquals('partial', $order->payment_status);

        // دفعة اكتمال
        $this->purchaseService->recordPayment($order, [
            'date'              => now()->toDateString(),
            'amount'            => 1000,
            'payment_method_id' => $this->paymentMethod->id,
        ]);
        $order->refresh();
        $this->assertEquals('2000.0000', $order->paid_amount);
        $this->assertEquals('paid', $order->payment_status);
    }

    // ── 6. مرتجع مشتريات يخفض المخزون ────────────────────────────
    public function test_purchase_return_reduces_stock_for_regular_product(): void
    {
        $product = Product::factory()->create([
            'tracking_type' => 'none',
            'unit_id'       => $this->unit->id,
        ]);

        $order = $this->purchaseService->create([
            'contact_id'     => $this->supplier->id,
            'branch_id'      => $this->branch->id,
            'warehouse_id'   => $this->warehouse->id,
            'date'           => now()->toDateString(),
            'fiscal_year_id' => $this->fiscalYear->id,
            'notes'          => null,
            'lines'          => [[
                'product_id'      => $product->id,
                'variation_id'    => null,
                'quantity'        => 10,
                'unit_id'         => $this->unit->id,
                'unit_cost'       => 400,
                'discount_amount' => 0,
                'tax_amount'      => 0,
                'total_amount'    => 4000,
            ]],
        ]);

        $this->purchaseService->receive($order);
        $order->refresh();

        // رصيد = 10 قبل المرتجع
        $balance = StockBalance::where('product_id', $product->id)->first();
        $this->assertEquals(10, $balance->quantity);

        $line = $order->lines->first();
        $return = $this->purchaseService->createReturn([
            'original_purchase_id' => $order->id,
            'contact_id'           => $this->supplier->id,
            'branch_id'            => $this->branch->id,
            'warehouse_id'         => $this->warehouse->id,
            'date'                 => now()->toDateString(),
            'fiscal_year_id'       => $this->fiscalYear->id,
            'notes'                => null,
            'lines'                => [[
                'original_line_id' => $line->id,
                'product_id'       => $product->id,
                'variation_id'     => null,
                'quantity'         => 3,
                'unit_cost'        => 400,
                'tax_amount'       => 0,
                'total_amount'     => 1200,
            ]],
        ]);

        $this->assertEquals('confirmed', $return->status);

        // رصيد = 7 بعد المرتجع
        $balance->refresh();
        $this->assertEquals(7, $balance->quantity);

        // حركة خروج من نوع purchase_return_out
        $this->assertEquals(1, StockMovement::where('type', 'purchase_return_out')->count());
    }

    // ── 7. مرتجع سيريال يُحوّل حالة الجهاز إلى returned_to_supplier
    public function test_purchase_return_serial_transitions_to_returned_to_supplier(): void
    {
        $product = Product::factory()->create([
            'tracking_type' => 'serial',
            'unit_id'       => $this->unit->id,
        ]);

        $serial = ProductSerial::create([
            'product_id'    => $product->id,
            'serial_number' => 'SN-RET-001',
            'status'        => 'in_stock',
            'warehouse_id'  => $this->warehouse->id,
            'cost_price'    => 0,
        ]);

        $order = $this->purchaseService->create([
            'contact_id'     => $this->supplier->id,
            'branch_id'      => $this->branch->id,
            'warehouse_id'   => $this->warehouse->id,
            'date'           => now()->toDateString(),
            'fiscal_year_id' => $this->fiscalYear->id,
            'notes'          => null,
            'lines'          => [[
                'product_id'      => $product->id,
                'variation_id'    => null,
                'quantity'        => 1,
                'unit_id'         => $this->unit->id,
                'unit_cost'       => 900,
                'discount_amount' => 0,
                'tax_amount'      => 0,
                'total_amount'    => 900,
            ]],
        ]);

        $line = $order->lines->first();

        $this->purchaseService->receive($order, [
            $line->id => ['serial_ids' => [$serial->id]],
        ]);

        $serial->refresh();
        $this->assertEquals('in_stock', $serial->status);

        // إرجاع الجهاز للمورد
        $return = $this->purchaseService->createReturn([
            'original_purchase_id' => $order->id,
            'contact_id'           => $this->supplier->id,
            'branch_id'            => $this->branch->id,
            'warehouse_id'         => $this->warehouse->id,
            'date'                 => now()->toDateString(),
            'fiscal_year_id'       => $this->fiscalYear->id,
            'notes'                => null,
            'lines'                => [[
                'original_line_id' => $line->id,
                'product_id'       => $product->id,
                'variation_id'     => null,
                'quantity'         => 1,
                'unit_cost'        => 900,
                'tax_amount'       => 0,
                'total_amount'     => 900,
                'serial_ids'       => [$serial->id],
            ]],
        ]);

        $serial->refresh();
        $this->assertEquals('returned_to_supplier', $serial->status);

        // رصيد المخزون = 0
        $balance = StockBalance::where('product_id', $product->id)->first();
        $this->assertEquals(0, $balance->quantity);
    }

    // ── 8. عدد السيريالات يجب أن يطابق الكمية ──────────────────
    public function test_serial_count_mismatch_throws_exception(): void
    {
        $product = Product::factory()->create([
            'tracking_type' => 'serial',
            'unit_id'       => $this->unit->id,
        ]);

        $serial1 = ProductSerial::create([
            'product_id' => $product->id, 'serial_number' => 'SN-A',
            'status' => 'in_stock', 'warehouse_id' => $this->warehouse->id, 'cost_price' => 0,
        ]);

        $order = $this->purchaseService->create([
            'contact_id'     => $this->supplier->id,
            'branch_id'      => $this->branch->id,
            'warehouse_id'   => $this->warehouse->id,
            'date'           => now()->toDateString(),
            'fiscal_year_id' => $this->fiscalYear->id,
            'notes'          => null,
            'lines'          => [[
                'product_id'      => $product->id,
                'variation_id'    => null,
                'quantity'        => 2,  // طلب 2 ولكن نُعطي 1 فقط
                'unit_id'         => $this->unit->id,
                'unit_cost'       => 500,
                'discount_amount' => 0,
                'tax_amount'      => 0,
                'total_amount'    => 1000,
            ]],
        ]);

        $line = $order->lines->first();

        $this->expectException(InvalidArgumentException::class);
        $this->purchaseService->receive($order, [
            $line->id => ['serial_ids' => [$serial1->id]],  // 1 بدلاً من 2
        ]);
    }

    // ── 9. المتوسط المرجح بعد شراءين بسعرين (10×100 ثم 5×120 = 106.6667) ──
    public function test_weighted_average_cost_after_two_purchases_via_service(): void
    {
        $product = Product::factory()->create([
            'tracking_type' => 'none',
            'unit_id'       => $this->unit->id,
        ]);

        // شراء 1: 10 قطع بسعر 100
        $order1 = $this->purchaseService->create([
            'contact_id'     => $this->supplier->id,
            'branch_id'      => $this->branch->id,
            'warehouse_id'   => $this->warehouse->id,
            'date'           => now()->toDateString(),
            'fiscal_year_id' => $this->fiscalYear->id,
            'lines'          => [[
                'product_id'   => $product->id,
                'variation_id' => null,
                'quantity'     => 10,
                'unit_id'      => $this->unit->id,
                'unit_cost'    => 100,
                'total_amount' => 1000,
            ]],
        ]);
        $this->purchaseService->receive($order1);

        $balance1 = StockBalance::where('product_id', $product->id)->first();
        $this->assertEquals(10, $balance1->quantity);
        $this->assertEquals('100.0000', $balance1->avg_cost);

        // شراء 2: 5 قطع بسعر 120
        $order2 = $this->purchaseService->create([
            'contact_id'     => $this->supplier->id,
            'branch_id'      => $this->branch->id,
            'warehouse_id'   => $this->warehouse->id,
            'date'           => now()->toDateString(),
            'fiscal_year_id' => $this->fiscalYear->id,
            'lines'          => [[
                'product_id'   => $product->id,
                'variation_id' => null,
                'quantity'     => 5,
                'unit_id'      => $this->unit->id,
                'unit_cost'    => 120,
                'total_amount' => 600,
            ]],
        ]);
        $this->purchaseService->receive($order2);

        // (10*100 + 5*120) / 15 = 1600 / 15 = 106.6667
        $balance2 = StockBalance::where('product_id', $product->id)->first();
        $this->assertEquals(15, $balance2->quantity);
        $this->assertEquals('106.6667', $balance2->avg_cost);
    }

    // ── 10. الشراء الآجل يكتب contact_ledger_entry للمورد، والدفعة تخفضه، والمرتجع يخفضه ──
    public function test_credit_purchase_writes_contact_ledger_and_payment_and_return_reduce_it(): void
    {
        $product = Product::factory()->create([
            'tracking_type' => 'none',
            'unit_id'       => $this->unit->id,
        ]);

        // 1. شراء آجل واستلامه بقيمة 5000
        $order = $this->purchaseService->create([
            'contact_id'     => $this->supplier->id,
            'branch_id'      => $this->branch->id,
            'warehouse_id'   => $this->warehouse->id,
            'date'           => now()->toDateString(),
            'fiscal_year_id' => $this->fiscalYear->id,
            'lines'          => [[
                'product_id'   => $product->id,
                'variation_id' => null,
                'quantity'     => 10,
                'unit_id'      => $this->unit->id,
                'unit_cost'    => 500,
                'total_amount' => 5000,
            ]],
        ]);
        $this->purchaseService->receive($order);

        // تم تسجيل قيد دائن للمورد بـ 5000 ورصيد المورد أصبح 5000 (مستحق له)
        $this->assertDatabaseHas('contact_ledger_entries', [
            'contact_id'     => $this->supplier->id,
            'reference_type' => 'PurchaseOrder',
            'reference_id'   => $order->id,
            'credit'         => '5000.0000',
            'debit'          => '0.0000',
        ]);
        $this->assertEquals(5000.0, $this->supplier->fresh()->balance);

        // 2. سداد دفعة بـ 2000
        $payment = $this->purchaseService->recordPayment($order, [
            'date'              => now()->toDateString(),
            'amount'            => 2000,
            'payment_method_id' => $this->paymentMethod->id,
        ]);

        // تسجيل قيد مدين بـ 2000 يخفض رصيد المورد إلى 3000
        $this->assertDatabaseHas('contact_ledger_entries', [
            'contact_id'     => $this->supplier->id,
            'reference_type' => 'PurchasePayment',
            'reference_id'   => $payment->id,
            'debit'          => '2000.0000',
            'credit'         => '0.0000',
        ]);
        $this->assertEquals(3000.0, $this->supplier->fresh()->balance);

        // 3. مرتجع مشتريات بقطعتين (1000)
        $line = $order->lines->first();
        $return = $this->purchaseService->createReturn([
            'original_purchase_id' => $order->id,
            'contact_id'           => $this->supplier->id,
            'branch_id'            => $this->branch->id,
            'warehouse_id'         => $this->warehouse->id,
            'date'                 => now()->toDateString(),
            'fiscal_year_id'       => $this->fiscalYear->id,
            'lines'                => [[
                'original_line_id' => $line->id,
                'product_id'       => $product->id,
                'variation_id'     => null,
                'quantity'         => 2,
                'unit_cost'        => 500,
                'total_amount'     => 1000,
            ]],
        ]);

        // تسجيل قيد مدين بـ 1000 يخفض رصيد المورد إلى 2000
        $this->assertDatabaseHas('contact_ledger_entries', [
            'contact_id'     => $this->supplier->id,
            'reference_type' => 'PurchaseReturn',
            'reference_id'   => $return->id,
            'debit'          => '1000.0000',
            'credit'         => '0.0000',
        ]);
        $this->assertEquals(2000.0, $this->supplier->fresh()->balance);
    }

    // ── 11. paid_amount = SUM(purchase_payments) بعد إضافة دفعتين ثم حذف واحدة ──
    public function test_paid_amount_equals_sum_payments_after_two_payments_and_one_deletion(): void
    {
        $product = Product::factory()->create([
            'tracking_type' => 'none',
            'unit_id'       => $this->unit->id,
        ]);

        $order = $this->purchaseService->create([
            'contact_id'     => $this->supplier->id,
            'branch_id'      => $this->branch->id,
            'warehouse_id'   => $this->warehouse->id,
            'date'           => now()->toDateString(),
            'fiscal_year_id' => $this->fiscalYear->id,
            'lines'          => [[
                'product_id'   => $product->id,
                'variation_id' => null,
                'quantity'     => 4,
                'unit_cost'    => 1000,
                'total_amount' => 4000,
            ]],
        ]);
        $this->purchaseService->receive($order);

        // إضافة دفعة 1: 1000
        $payment1 = $this->purchaseService->recordPayment($order, [
            'date'              => now()->toDateString(),
            'amount'            => 1000,
            'payment_method_id' => $this->paymentMethod->id,
        ]);
        $order->refresh();
        $this->assertEquals('1000.0000', $order->paid_amount);
        $this->assertEquals('partial', $order->payment_status);

        // إضافة دفعة 2: 1500
        $payment2 = $this->purchaseService->recordPayment($order, [
            'date'              => now()->toDateString(),
            'amount'            => 1500,
            'payment_method_id' => $this->paymentMethod->id,
        ]);
        $order->refresh();
        $this->assertEquals('2500.0000', $order->paid_amount);
        $this->assertEquals('partial', $order->payment_status);

        // حذف الدفعة الثانية عبر PurchaseService
        $this->purchaseService->deletePayment($payment2);

        $order->refresh();
        $this->assertEquals('1000.0000', $order->paid_amount);
        $this->assertEquals('partial', $order->payment_status);
        $this->assertDatabaseMissing('purchase_payments', ['id' => $payment2->id]);
        $this->assertDatabaseMissing('contact_ledger_entries', [
            'reference_type' => 'PurchasePayment',
            'reference_id'   => $payment2->id,
        ]);
        $this->assertEquals(3000.0, $this->supplier->fresh()->balance);
    }

    // ── 12. منع مرتجع كمية أكبر من المشتراة (ومن المرتجع سابقاً) ──
    public function test_prevent_returning_more_than_purchased_and_previously_returned(): void
    {
        $product = Product::factory()->create([
            'tracking_type' => 'none',
            'unit_id'       => $this->unit->id,
        ]);

        $order = $this->purchaseService->create([
            'contact_id'     => $this->supplier->id,
            'branch_id'      => $this->branch->id,
            'warehouse_id'   => $this->warehouse->id,
            'date'           => now()->toDateString(),
            'fiscal_year_id' => $this->fiscalYear->id,
            'lines'          => [[
                'product_id'   => $product->id,
                'variation_id' => null,
                'quantity'     => 5,
                'unit_cost'    => 200,
                'total_amount' => 1000,
            ]],
        ]);
        $this->purchaseService->receive($order);
        $line = $order->lines->first();

        // 1. محاولة إرجاع 6 قطع من أصل 5 (يجب أن ترفض)
        try {
            $this->purchaseService->createReturn([
                'original_purchase_id' => $order->id,
                'branch_id'            => $this->branch->id,
                'warehouse_id'         => $this->warehouse->id,
                'date'                 => now()->toDateString(),
                'lines'                => [[
                    'original_line_id' => $line->id,
                    'product_id'       => $product->id,
                    'quantity'         => 6,
                    'unit_cost'        => 200,
                    'total_amount'     => 1200,
                ]],
            ]);
            $this->fail('Expected InvalidArgumentException for returning more than purchased quantity');
        } catch (InvalidArgumentException $e) {
            $this->assertStringContainsString('أكبر من الكمية المتاحة', $e->getMessage());
        }

        // 2. إرجاع 3 قطع (ناجح)
        $this->purchaseService->createReturn([
            'original_purchase_id' => $order->id,
            'branch_id'            => $this->branch->id,
            'warehouse_id'         => $this->warehouse->id,
            'date'                 => now()->toDateString(),
            'lines'                => [[
                'original_line_id' => $line->id,
                'product_id'       => $product->id,
                'quantity'         => 3,
                'unit_cost'        => 200,
                'total_amount'     => 600,
            ]],
        ]);

        // 3. محاولة إرجاع 3 قطع أخرى (المتبقي فقط 2) -> يجب أن ترفض
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('أكبر من الكمية المتاحة');
        $this->purchaseService->createReturn([
            'original_purchase_id' => $order->id,
            'branch_id'            => $this->branch->id,
            'warehouse_id'         => $this->warehouse->id,
            'date'                 => now()->toDateString(),
            'lines'                => [[
                'original_line_id' => $line->id,
                'product_id'       => $product->id,
                'quantity'         => 3,
                'unit_cost'        => 200,
                'total_amount'     => 600,
            ]],
        ]);
    }

    // ── 13. منع إدخال سيريال/IMEI مكرر عبر فاتورتين ──
    public function test_prevent_duplicate_serial_or_imei_across_two_purchase_invoices(): void
    {
        $product = Product::factory()->create([
            'tracking_type' => 'serial',
            'unit_id'       => $this->unit->id,
        ]);

        $serial1 = ProductSerial::create([
            'product_id'    => $product->id,
            'serial_number' => 'SN-DUP-001',
            'imei1'         => '111112222233333',
            'status'        => 'in_stock',
            'warehouse_id'  => $this->warehouse->id,
            'cost_price'    => 1000,
        ]);

        // فاتورة 1 تستلم السيريال الأول
        $order1 = $this->purchaseService->create([
            'contact_id'     => $this->supplier->id,
            'branch_id'      => $this->branch->id,
            'warehouse_id'   => $this->warehouse->id,
            'date'           => now()->toDateString(),
            'fiscal_year_id' => $this->fiscalYear->id,
            'lines'          => [[
                'product_id'   => $product->id,
                'quantity'     => 1,
                'unit_id'      => $this->unit->id,
                'unit_cost'    => 1000,
                'total_amount' => 1000,
            ]],
        ]);
        $line1 = $order1->lines->first();
        $this->purchaseService->receive($order1, [
            $line1->id => ['serial_ids' => [$serial1->id]],
        ]);

        // فاتورة 2 تحاول استلام نفس السيريال SN-DUP-001
        $order2 = $this->purchaseService->create([
            'contact_id'     => $this->supplier->id,
            'branch_id'      => $this->branch->id,
            'warehouse_id'   => $this->warehouse->id,
            'date'           => now()->toDateString(),
            'fiscal_year_id' => $this->fiscalYear->id,
            'lines'          => [[
                'product_id'   => $product->id,
                'quantity'     => 1,
                'unit_id'      => $this->unit->id,
                'unit_cost'    => 1000,
                'total_amount' => 1000,
            ]],
        ]);
        $line2 = $order2->lines->first();

        try {
            $this->purchaseService->receive($order2, [
                $line2->id => ['serial_ids' => [$serial1->id]],
            ]);
            $this->fail('Expected InvalidArgumentException when receiving already-received serial');
        } catch (InvalidArgumentException $e) {
            $this->assertStringContainsString('مسجل في أمر شراء آخر', $e->getMessage());
        }

        // محاولة إنشاء سيريال بنفس IMEI في قاعدة البيانات تمنعها UNIQUE
        $this->expectException(\Illuminate\Database\QueryException::class);
        ProductSerial::create([
            'product_id'    => $product->id,
            'serial_number' => 'SN-DUP-002',
            'imei1'         => '111112222233333', // مكرر
            'status'        => 'in_stock',
            'warehouse_id'  => $this->warehouse->id,
        ]);
    }

    // ── 14. مرتجع سيريال يستخدم cost_price الفعلي المسجل في purchase_return_line_serials ──
    public function test_purchase_return_serial_uses_actual_cost_price_in_return_serials_and_movement(): void
    {
        $product = Product::factory()->create([
            'tracking_type' => 'serial',
            'unit_id'       => $this->unit->id,
        ]);

        $serial = ProductSerial::create([
            'product_id'    => $product->id,
            'serial_number' => 'SN-SPEC-COST',
            'status'        => 'in_stock',
            'warehouse_id'  => $this->warehouse->id,
            'cost_price'    => 1850.5000,
        ]);

        $order = $this->purchaseService->create([
            'contact_id'     => $this->supplier->id,
            'branch_id'      => $this->branch->id,
            'warehouse_id'   => $this->warehouse->id,
            'date'           => now()->toDateString(),
            'fiscal_year_id' => $this->fiscalYear->id,
            'lines'          => [[
                'product_id'   => $product->id,
                'quantity'     => 1,
                'unit_id'      => $this->unit->id,
                'unit_cost'    => 1850.5000,
                'total_amount' => 1850.5000,
            ]],
        ]);
        $line = $order->lines->first();
        $this->purchaseService->receive($order, [
            $line->id => ['serial_ids' => [$serial->id]],
        ]);

        // إرجاع السيريال
        $return = $this->purchaseService->createReturn([
            'original_purchase_id' => $order->id,
            'contact_id'           => $this->supplier->id,
            'branch_id'            => $this->branch->id,
            'warehouse_id'         => $this->warehouse->id,
            'date'                 => now()->toDateString(),
            'fiscal_year_id'       => $this->fiscalYear->id,
            'lines'                => [[
                'original_line_id' => $line->id,
                'product_id'       => $product->id,
                'quantity'         => 1,
                'unit_cost'        => 1850.5000,
                'total_amount'     => 1850.5000,
                'serial_ids'       => [$serial->id],
            ]],
        ]);

        // التحقق من أن سطر السيريال المرتجع يحمل التكلفة الفعلية
        $returnSerial = PurchaseReturnLineSerial::where('serial_id', $serial->id)->first();
        $this->assertNotNull($returnSerial);
        $this->assertEquals('1850.5000', $returnSerial->cost_price);

        // التحقق من أن حركة المخزون purchase_return_out سجلت بالتكلفة الفعلية المحددة للجهاز (ADR-16/ADR-24)
        $outMovement = StockMovement::where('type', 'purchase_return_out')
            ->where('serial_id', $serial->id)
            ->first();
        $this->assertNotNull($outMovement);
        $this->assertEquals('1850.5000', $outMovement->unit_cost);
    }

    // ── 15. عزل الفروع للمشتريات، ورفض فاتورة في سنة مالية مغلقة ──
    public function test_branch_isolation_and_closed_fiscal_year_protection_for_purchases(): void
    {
        $business = Business::first();
        $branch2 = Branch::factory()->create(['business_id' => $business->id]);
        $wh2     = Warehouse::factory()->create(['branch_id' => $branch2->id]);

        $userBranch1 = User::factory()->create(['branch_id' => $this->branch->id]);
        $userBranch2 = User::factory()->create(['branch_id' => $branch2->id]);

        // أمر شراء لفرع 1 وأمر شراء لفرع 2
        $this->actingAs($userBranch1);
        $orderBranch1 = PurchaseOrder::create([
            'order_number'    => 'PO-BR1-TEST',
            'branch_id'       => $this->branch->id,
            'warehouse_id'    => $this->warehouse->id,
            'fiscal_year_id'  => $this->fiscalYear->id,
            'contact_id'      => $this->supplier->id,
            'date'            => now()->toDateString(),
            'total_amount'    => 1000,
            'paid_amount'     => 0,
            'payment_status'  => 'unpaid',
            'status'          => 'confirmed',
        ]);

        $this->actingAs($userBranch2);
        $orderBranch2 = PurchaseOrder::create([
            'order_number'    => 'PO-BR2-TEST',
            'branch_id'       => $branch2->id,
            'warehouse_id'    => $wh2->id,
            'fiscal_year_id'  => $this->fiscalYear->id,
            'contact_id'      => $this->supplier->id,
            'date'            => now()->toDateString(),
            'total_amount'    => 2000,
            'paid_amount'     => 0,
            'payment_status'  => 'unpaid',
            'status'          => 'confirmed',
        ]);

        // مستخدم فرع 1 يرى فقط فرع 1
        $this->actingAs($userBranch1);
        $ordersSeenByBranch1 = PurchaseOrder::all();
        $this->assertTrue($ordersSeenByBranch1->contains('id', $orderBranch1->id));
        $this->assertFalse($ordersSeenByBranch1->contains('id', $orderBranch2->id));

        // مستخدم بصلاحية branches.view_all يرى كل الفروع
        Permission::firstOrCreate(['name' => 'branches.view_all', 'guard_name' => 'web']);
        $adminUser = User::factory()->create(['branch_id' => $this->branch->id]);
        $adminUser->givePermissionTo('branches.view_all');
        $this->actingAs($adminUser);
        $ordersSeenByAdmin = PurchaseOrder::all();
        $this->assertTrue($ordersSeenByAdmin->contains('id', $orderBranch1->id));
        $this->assertTrue($ordersSeenByAdmin->contains('id', $orderBranch2->id));

        // رفض إنشاء فاتورة في سنة مالية مغلقة
        $closedFiscalYear = FiscalYear::factory()->create([
            'business_id' => $business->id,
            'status'      => 'closed',
        ]);

        $this->expectException(ClosedFiscalYearException::class);
        PurchaseOrder::create([
            'order_number'    => 'PO-CLOSED-TEST',
            'branch_id'       => $this->branch->id,
            'warehouse_id'    => $this->warehouse->id,
            'fiscal_year_id'  => $closedFiscalYear->id,
            'contact_id'      => $this->supplier->id,
            'date'            => now()->toDateString(),
            'total_amount'    => 500,
            'paid_amount'     => 0,
            'payment_status'  => 'unpaid',
            'status'          => 'confirmed',
        ]);
    }

    public function test_create_purchase_order_rejects_empty_lines(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('أمر الشراء يجب أن يحتوي على سطر واحد على الأقل.');

        $this->purchaseService->create([
            'contact_id'     => $this->supplier->id,
            'branch_id'      => $this->branch->id,
            'warehouse_id'   => $this->warehouse->id,
            'date'           => now()->toDateString(),
            'fiscal_year_id' => $this->fiscalYear->id,
            'lines'          => [],
        ]);
    }

    public function test_purchase_order_subtotal_and_total_calculated_from_lines(): void
    {
        $product1 = Product::factory()->create(['unit_id' => $this->unit->id]);
        $product2 = Product::factory()->create(['unit_id' => $this->unit->id]);

        $order = $this->purchaseService->create([
            'contact_id'      => $this->supplier->id,
            'branch_id'       => $this->branch->id,
            'warehouse_id'    => $this->warehouse->id,
            'date'            => now()->toDateString(),
            'fiscal_year_id'  => $this->fiscalYear->id,
            'shipping_amount' => 50,
            'lines'           => [
                [
                    'product_id'      => $product1->id,
                    'quantity'        => 2,
                    'unit_cost'       => 100,
                    'discount_amount' => 10, // subtotal = 190
                    'tax_amount'      => 19, // total = 209
                ],
                [
                    'product_id'      => $product2->id,
                    'quantity'        => 3,
                    'unit_cost'       => 200,
                    'discount_amount' => 0,  // subtotal = 600
                    'tax_amount'      => 60, // total = 660
                ],
            ],
        ]);

        $this->assertEquals('790.0000', $order->subtotal);
        $this->assertEquals('10.0000', $order->discount_amount);
        $this->assertEquals('79.0000', $order->tax_amount);
        $this->assertEquals('50.0000', $order->shipping_amount);
        // total = 790 + 79 + 50 = 919
        $this->assertEquals('919.0000', $order->total_amount);

        $line1 = $order->lines->firstWhere('product_id', $product1->id);
        $line2 = $order->lines->firstWhere('product_id', $product2->id);
        $this->assertEquals('209.0000', $line1->total_amount);
        $this->assertEquals('660.0000', $line2->total_amount);
    }
}
