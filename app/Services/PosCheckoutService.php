<?php

namespace App\Services;

use App\Exceptions\InsufficientStockException;
use App\Models\Contact;
use App\Models\FiscalYear;
use App\Models\PosSession;
use App\Models\Product;
use App\Models\ProductSerial;
use App\Models\SaleOrder;
use App\Models\StockBalance;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class PosCheckoutService
{
    public function __construct(
        private readonly SaleService $saleService,
    ) {}

    /**
     * تنفيذ عملية دفع نقطة البيع (POS Checkout)
     *
     * @param array $data بيانات الفاتورة والدفعات
     * @param User|null $user المستخدم المنفذ (الكاشير)
     * @return SaleOrder
     * @throws InvalidArgumentException|InsufficientStockException
     */
    public function checkout(array $data, ?User $user = null): SaleOrder
    {
        $user = $user ?? Auth::user();
        if (! $user) {
            throw new InvalidArgumentException('يجب تسجيل الدخول لإتمام عملية البيع.');
        }

        // 1. التحقق من مفتاح عدم التكرار (Idempotency Key)
        $idempotencyKey = $data['idempotency_key'] ?? null;
        if ($idempotencyKey) {
            $cacheKey = "pos_idempotency_{$idempotencyKey}";
            if (Cache::has($cacheKey)) {
                throw new InvalidArgumentException('تمت معالجة هذه الفاتورة مسبقاً (مفتاح عدم التكرار مستخدم).');
            }
        }

        // 2. التحقق من وجود جلسة كاشير مفتوحة
        $session = null;
        if (!empty($data['pos_session_id'])) {
            $session = PosSession::with(['warehouse', 'branch', 'treasury'])->find($data['pos_session_id']);
            if (! $session || $session->status !== 'open') {
                throw new InvalidArgumentException('جلسة نقطة البيع المحددة غير موجودة أو مغلقة.');
            }
            if ($session->user_id !== $user->id && ! $user->can('pos_sessions.view')) {
                throw new InvalidArgumentException('جلسة نقطة البيع لا تخص هذا الكاشير.');
            }
        } else {
            $session = PosSession::with(['warehouse', 'branch', 'treasury'])
                ->where('user_id', $user->id)
                ->where('status', 'open')
                ->latest()
                ->first();

            if (! $session) {
                throw new InvalidArgumentException('لا توجد جلسة نقطة بيع مفتوحة للكاشير.');
            }
        }

        $branchId     = $session->branch_id;
        $warehouseId  = $session->warehouse_id;
        $fiscalYearId = $session->fiscal_year_id;
        $treasuryId   = $session->treasury_id;

        // التحقق من السنة المالية للجلسة
        $fiscalYear = FiscalYear::find($fiscalYearId);
        if (! $fiscalYear || $fiscalYear->status !== 'open') {
            throw new InvalidArgumentException('السنة المالية المرتبطة بالجلسة مغلقة أو غير صالحة.');
        }

        // 3. التحقق من صلاحيات الخصم العام (Header Discount)
        $hasHeaderDiscount = !empty($data['discount_id'])
            || (!empty($data['discount_value']) && (float) $data['discount_value'] > 0)
            || (!empty($data['discount_amount']) && (float) $data['discount_amount'] > 0);

        if ($hasHeaderDiscount && ! $user->can('pos.discount')) {
            throw new InvalidArgumentException('إضافة خصم على الفاتورة تتطلب صلاحية منح الخصم (pos.discount).');
        }

        // 4. التحقق من أسطر الفاتورة (الأسعار، الخصومات، التتبع، السيريالات، المخزون)
        if (empty($data['lines']) || count($data['lines']) === 0) {
            throw new InvalidArgumentException('فاتورة المبيعات يجب أن تحتوي على سطر واحد على الأقل.');
        }

        $calculatedSubtotal = 0.0;
        $calculatedTax      = 0.0;

        foreach ($data['lines'] as $line) {
            $product = Product::findOrFail($line['product_id']);
            $qty     = (float) $line['quantity'];
            $price   = (float) $line['unit_price'];

            if ($qty <= 0) {
                throw new InvalidArgumentException("الكمية للمنتج ({$product->name}) يجب أن تكون أكبر من الصفر.");
            }

            // فحص الحد الأدنى لسعر البيع min_selling_price
            if ($product->min_selling_price && (float) $product->min_selling_price > 0) {
                if ($price < (float) $product->min_selling_price && ! $user->can('pos.override_price')) {
                    $minFormatted = number_format($product->min_selling_price, 2);
                    throw new InvalidArgumentException(
                        "سعر بيع المنتج ({$product->name}) أقل من الحد الأدنى المسموح به ({$minFormatted})، ويتطلب صلاحية تجاوز السعر (pos.override_price)."
                    );
                }
            }

            // فحص صلاحية خصم السطر
            $hasLineDiscount = (!empty($line['discount_value']) && (float) $line['discount_value'] > 0)
                || (!empty($line['discount_amount']) && (float) $line['discount_amount'] > 0);

            if ($hasLineDiscount && ! $user->can('pos.discount')) {
                throw new InvalidArgumentException(
                    "إضافة خصم على المنتج ({$product->name}) تتطلب صلاحية منح الخصم (pos.discount)."
                );
            }

            // فحص تتبع المنتج والسيريالات
            if ($product->tracking_type === 'serial') {
                $serialIds = $line['serial_ids'] ?? [];
                if (count($serialIds) !== (int) $qty) {
                    throw new InvalidArgumentException(
                        "المنتج بالسيريال ({$product->name}) يتطلب سيريال لكل وحدة (المحدد: " . count($serialIds) . "، المطلوب: {$qty})."
                    );
                }

                foreach ($serialIds as $serialId) {
                    $serial = ProductSerial::find($serialId);
                    if (! $serial) {
                        throw new InvalidArgumentException("السيريال المحدد للمنتج ({$product->name}) غير موجود.");
                    }

                    if ($serial->product_id !== $product->id) {
                        throw new InvalidArgumentException("السيريال ({$serial->serial_number}) لا يتبع المنتج ({$product->name}).");
                    }

                    if ($serial->warehouse_id !== $warehouseId || $serial->status !== 'in_stock') {
                        throw new InvalidArgumentException(
                            "السيريال ({$serial->serial_number}) للمنتج ({$product->name}) غير متوفر في مخزن الجلسة الحالي أو تم بيعه مسبقاً."
                        );
                    }
                }
            } else {
                // منتج عادي (tracking_type == none): التحقق من رصيد المخزن
                $available = (float) (StockBalance::where('warehouse_id', $warehouseId)
                    ->where('product_id', $product->id)
                    ->where('variation_id', $line['variation_id'] ?? null)
                    ->value('quantity') ?? 0);

                if ($available < $qty) {
                    throw new InsufficientStockException(
                        "الرصيد المتوفر في المخزن للمنتج ({$product->name}) غير كافٍ. المتوفر: {$available}، المطلوب: {$qty}."
                    );
                }
            }

            // احتساب إجمالي السطر التقريبي للمطابقة المالية
            $lineDisc = 0.0;
            if (!empty($line['discount_type']) && isset($line['discount_value'])) {
                $lineDisc = $line['discount_type'] === 'percentage'
                    ? ($price * $qty) * ((float) $line['discount_value'] / 100)
                    : (float) $line['discount_value'];
            } elseif (isset($line['discount_amount'])) {
                $lineDisc = (float) $line['discount_amount'];
            }

            $lineSubtotal        = ($price * $qty) - $lineDisc;
            $calculatedSubtotal += $lineSubtotal;
            $calculatedTax      += (float) ($line['tax_amount'] ?? 0);
        }

        // احتساب الخصم العام
        $headerDiscAmount = 0.0;
        if (!empty($data['discount_type']) && isset($data['discount_value'])) {
            $headerDiscAmount = $data['discount_type'] === 'percentage'
                ? $calculatedSubtotal * ((float) $data['discount_value'] / 100)
                : (float) $data['discount_value'];
        } elseif (isset($data['discount_amount'])) {
            $headerDiscAmount = (float) $data['discount_amount'];
        }

        $shippingAmt      = (float) ($data['shipping_amount'] ?? 0);
        $totalOrderAmount = max(0, $calculatedSubtotal - $headerDiscAmount) + $calculatedTax + $shippingAmt;

        // 5. التحقق من المدفوعات والبيع الآجل وحد الائتمان
        $payments          = $data['payments'] ?? [];
        $totalPaidExpected = 0.0;

        foreach ($payments as $p) {
            $amt = (float) ($p['amount'] ?? 0);
            if ($amt > 0) {
                $totalPaidExpected += $amt;
            }
        }

        $unpaidDifference = round($totalOrderAmount - $totalPaidExpected, 4);
        $isCredit         = $unpaidDifference > 0.0001 || !empty($data['is_credit']);
        $contactId        = $data['contact_id'] ?? null;

        if ($isCredit) {
            if (! $contactId) {
                throw new InvalidArgumentException('البيع الآجل أو وجود مبلغ متبقٍ يتطلب تحديد عميل مسجل.');
            }

            $contact = Contact::findOrFail($contactId);
            if ($contact->credit_limit && (float) $contact->credit_limit > 0) {
                $currentBalance = (float) $contact->balance; // مدين - دائن
                $creditAttempt  = $unpaidDifference > 0 ? $unpaidDifference : $totalOrderAmount;

                if (($currentBalance + $creditAttempt) > (float) $contact->credit_limit) {
                    $limitFmt   = number_format($contact->credit_limit, 2);
                    $balanceFmt = number_format($currentBalance, 2);
                    $attemptFmt = number_format($creditAttempt, 2);
                    throw new InvalidArgumentException(
                        "تجاوز العميل ({$contact->name}) لحد الائتمان المسموح به ({$limitFmt} ر.س). الرصيد الحالي: {$balanceFmt} ر.س، المبلغ الآجل المطلوب: {$attemptFmt} ر.س."
                    );
                }
            }
        }

        // تجهيز بيانات الدفعات وربطها بالجلسة والخزينة الافتراضية
        $preparedPayments = [];
        foreach ($payments as $p) {
            $amt = round((float) ($p['amount'] ?? 0), 4);
            if ($amt <= 0) {
                continue;
            }

            $preparedPayments[] = [
                'amount'            => $amt,
                'payment_method_id' => $p['payment_method_id'],
                'pos_session_id'    => $session->id,
                'treasury_id'       => $p['treasury_id'] ?? $treasuryId,
                'bank_account_id'   => $p['bank_account_id'] ?? null,
                'date'              => $p['date'] ?? $data['date'] ?? now()->toDateString(),
                'reference'         => $p['reference'] ?? null,
                'notes'             => $p['notes'] ?? 'دفع نقطة بيع POS',
            ];
        }

        // 6. تنفيذ المعاملة داخل Transaction موحدة باستخدام SaleService
        return DB::transaction(function () use ($data, $session, $branchId, $warehouseId, $fiscalYearId, $contactId, $user, $preparedPayments, $idempotencyKey) {
            $salePayload = [
                ...$data,
                'pos_session_id' => $session->id,
                'branch_id'      => $branchId,
                'warehouse_id'   => $warehouseId,
                'fiscal_year_id' => $fiscalYearId,
                'contact_id'     => $contactId,
                'user_id'        => $user->id,
                'date'           => $data['date'] ?? now()->toDateString(),
                'payments'       => $preparedPayments,
            ];

            $order = $this->saleService->create($salePayload);

            // تخزين مفتاح عدم التكرار عند النجاح
            if ($idempotencyKey) {
                Cache::put("pos_idempotency_{$idempotencyKey}", $order->id, now()->addDay());
            }

            return $order;
        });
    }
}
