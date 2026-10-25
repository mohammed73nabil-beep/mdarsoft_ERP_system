<?php

namespace App\Services;

use App\Models\ContactLedgerEntry;
use App\Models\Discount;
use App\Models\FiscalYear;
use App\Models\Product;
use App\Models\ProductSerial;
use App\Models\Quotation;
use App\Models\QuotationLine;
use App\Models\SaleDraft;
use App\Models\SaleDraftLine;
use App\Models\SaleLineSerial;
use App\Models\SaleOrder;
use App\Models\SaleOrderLine;
use App\Models\SalePayment;
use App\Models\SaleReturn;
use App\Models\SaleReturnLine;
use App\Models\SaleReturnLineSerial;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class SaleService
{
    public function __construct(
        private readonly StockService $stockService,
        private readonly SerialStateMachine $serialStateMachine,
        private readonly DocumentSequenceService $sequenceService,
    ) {}

    // ──────────────────────────────────────────────────────────────
    // 1. إنشاء فاتورة مبيعات (Sale Order)
    // ──────────────────────────────────────────────────────────────

    public function create(array $data): SaleOrder
    {
        return DB::transaction(function () use ($data) {
            if (empty($data['lines']) || count($data['lines']) === 0) {
                throw new InvalidArgumentException('فاتورة المبيعات يجب أن تحتوي على سطر واحد على الأقل.');
            }

            $fiscalYearId = $data['fiscal_year_id']
                ?? FiscalYear::where('status', 'open')->first()?->id;

            if (! $fiscalYearId) {
                throw new InvalidArgumentException('لا توجد سنة مالية مفتوحة.');
            }

            $orderNumber = $this->sequenceService->getNextNumber(
                $data['branch_id'],
                $fiscalYearId,
                'sale_invoice',
                'INV'
            );

            // Process lines
            $processedLines = collect($data['lines'])->map(function ($line) {
                $qty = (float) $line['quantity'];
                $price = (float) $line['unit_price'];
                $lineDiscount = 0.0;

                if (!empty($line['discount_type']) && isset($line['discount_value'])) {
                    $discVal = (float) $line['discount_value'];
                    if ($line['discount_type'] === 'percentage') {
                        $lineDiscount = ($price * $qty) * ($discVal / 100);
                    } else {
                        $lineDiscount = $discVal;
                    }
                } elseif (isset($line['discount_amount'])) {
                    $lineDiscount = (float) $line['discount_amount'];
                }

                $tax = (float) ($line['tax_amount'] ?? 0);
                $subtotal = ($price * $qty) - $lineDiscount;
                $lineTotal = isset($line['total_amount']) ? (float) $line['total_amount'] : ($subtotal + $tax);

                return [
                    ...$line,
                    'quantity'        => $qty,
                    'unit_price'      => $price,
                    'discount_amount' => $lineDiscount,
                    'tax_amount'      => $tax,
                    'subtotal'        => $subtotal,
                    'total_amount'    => $lineTotal,
                ];
            });

            $subtotal = $processedLines->sum('subtotal');
            $linesTaxAmount = $processedLines->sum('tax_amount');

            // Header discount
            $headerDiscountAmount = 0.0;
            if (!empty($data['discount_id'])) {
                $discountModel = Discount::find($data['discount_id']);
                if ($discountModel && $discountModel->is_active) {
                    if ($discountModel->type === 'percentage') {
                        $headerDiscountAmount = $subtotal * ((float) $discountModel->value / 100);
                    } else {
                        $headerDiscountAmount = (float) $discountModel->value;
                    }
                }
            } elseif (!empty($data['discount_type']) && isset($data['discount_value'])) {
                $discVal = (float) $data['discount_value'];
                if ($data['discount_type'] === 'percentage') {
                    $headerDiscountAmount = $subtotal * ($discVal / 100);
                } else {
                    $headerDiscountAmount = $discVal;
                }
            } elseif (isset($data['discount_amount'])) {
                $headerDiscountAmount = (float) $data['discount_amount'];
            }

            $shippingAmt = (float) ($data['shipping_amount'] ?? 0);
            $totalAmount = max(0, $subtotal - $headerDiscountAmount) + $linesTaxAmount + $shippingAmt;

            $order = SaleOrder::create([
                'order_number'        => $orderNumber,
                'date'                => $data['date'],
                'fiscal_year_id'      => $fiscalYearId,
                'pos_session_id'      => $data['pos_session_id'] ?? null,
                'contact_id'          => $data['contact_id'] ?? null,
                'branch_id'           => $data['branch_id'],
                'warehouse_id'        => $data['warehouse_id'],
                'user_id'             => Auth::id() ?? $data['user_id'] ?? null,
                'representative_id'   => $data['representative_id'] ?? null,
                'shipping_company_id' => $data['shipping_company_id'] ?? null,
                'discount_id'         => $data['discount_id'] ?? null,
                'subtotal'            => round($subtotal, 4),
                'discount_type'       => $data['discount_type'] ?? null,
                'discount_value'      => round((float) ($data['discount_value'] ?? 0), 4),
                'discount_amount'     => round($headerDiscountAmount, 4),
                'tax_amount'          => round($linesTaxAmount, 4),
                'shipping_amount'     => round($shippingAmt, 4),
                'total_amount'        => round($totalAmount, 4),
                'paid_amount'         => 0,
                'payment_status'      => 'unpaid',
                'status'              => $data['status'] ?? 'confirmed',
                'source_draft_id'     => $data['source_draft_id'] ?? null,
                'source_quotation_id' => $data['source_quotation_id'] ?? null,
                'notes'               => $data['notes'] ?? null,
            ]);

            foreach ($processedLines as $line) {
                $product = Product::findOrFail($line['product_id']);

                if ($product->isVariable() && empty($line['variation_id'])) {
                    throw new InvalidArgumentException("المنتج المتغير ({$product->name}) يتطلب تحديد variation_id إجبارياً.");
                }

                $orderLine = SaleOrderLine::create([
                    'sale_order_id'       => $order->id,
                    'product_id'          => $product->id,
                    'variation_id'        => $line['variation_id'] ?? null,
                    'discount_id'         => $line['discount_id'] ?? null,
                    'quantity'            => $line['quantity'],
                    'unit_id'             => $line['unit_id'] ?? $product->unit_id,
                    'unit_price'          => round((float) $line['unit_price'], 4),
                    'discount_type'       => $line['discount_type'] ?? null,
                    'discount_value'      => round((float) ($line['discount_value'] ?? 0), 4),
                    'discount_amount'     => round((float) $line['discount_amount'], 4),
                    'tax_id'              => $line['tax_id'] ?? null,
                    'tax_amount'          => round((float) $line['tax_amount'], 4),
                    'total_amount'        => round((float) $line['total_amount'], 4),
                    'cost_price'          => 0,
                    'warranty_expires_at' => $line['warranty_expires_at'] ?? null,
                    'notes'               => $line['notes'] ?? null,
                ]);

                // Inventory deduction if not a service
                if (! $product->isService()) {
                    if ($product->tracking_type === 'serial') {
                        $serialIds = $line['serial_ids'] ?? [];
                        if (count($serialIds) !== (int) $line['quantity']) {
                            throw new InvalidArgumentException(
                                "عدد السيريالات ({$orderLine->id}) لا يتطابق مع الكمية المباعة ({$line['quantity']})."
                            );
                        }

                        foreach ($serialIds as $serialId) {
                            /** @var ProductSerial $serial */
                            $serial = ProductSerial::lockForUpdate()->findOrFail($serialId);

                            if ($serial->status !== 'in_stock') {
                                throw new InvalidArgumentException(
                                    "السيريال ({$serial->serial_number}) ليس بحالة متوفر في المخزن (حالته: {$serial->status})."
                                );
                            }

                            // Transition status in_stock -> sold
                            $this->serialStateMachine->transition(
                                $serial,
                                'sold',
                                [
                                    'event_type'     => 'sold',
                                    'reference_type' => 'SaleOrder',
                                    'reference_id'   => $order->id,
                                    'created_by'     => Auth::id(),
                                ]
                            );

                            // ADR-21: Serial keeps last warehouse_id
                            $serialCost = (float) $serial->cost_price;

                            SaleLineSerial::create([
                                'sale_order_line_id' => $orderLine->id,
                                'serial_id'          => $serialId,
                                'cost_price'         => round($serialCost, 4),
                            ]);

                            $this->stockService->recordOut(
                                productId:     $product->id,
                                variationId:   $line['variation_id'] ?? null,
                                warehouseId:   $order->warehouse_id,
                                quantity:      1,
                                unitCost:      $serialCost,
                                movementType:  'sale_out',
                                referenceType: 'SaleOrder',
                                referenceId:   $order->id,
                                serialId:      $serialId,
                                fiscalYearId:  $order->fiscal_year_id,
                                createdBy:     Auth::id(),
                            );
                        }
                    } else {
                        // Regular product: deduce stock at current avg_cost
                        $movement = $this->stockService->recordOut(
                            productId:     $product->id,
                            variationId:   $line['variation_id'] ?? null,
                            warehouseId:   $order->warehouse_id,
                            quantity:      $line['quantity'],
                            unitCost:      null,
                            movementType:  'sale_out',
                            referenceType: 'SaleOrder',
                            referenceId:   $order->id,
                            fiscalYearId:  $order->fiscal_year_id,
                            createdBy:     Auth::id(),
                        );

                        // ADR-17: Record avg_cost at sale time into line cost_price
                        $orderLine->update([
                            'cost_price' => round((float) $movement->unit_cost, 4),
                        ]);
                    }
                }
            }

            // Sub-ledger: Debit entry for customer (customer owes business)
            if ($order->contact_id) {
                ContactLedgerEntry::create([
                    'contact_id'     => $order->contact_id,
                    'fiscal_year_id' => $order->fiscal_year_id,
                    'date'           => $order->date,
                    'debit'          => $order->total_amount,
                    'credit'         => 0,
                    'reference_type' => 'SaleOrder',
                    'reference_id'   => $order->id,
                    'description'    => "فاتورة مبيعات رقم {$order->order_number}",
                ]);
            }

            // Record initial payments if provided
            if (!empty($data['payments'])) {
                foreach ($data['payments'] as $paymentData) {
                    $this->recordPayment($order, $paymentData);
                }
            }

            return $order->fresh(['lines.serials', 'payments']);
        });
    }

    // ──────────────────────────────────────────────────────────────
    // 2. تسجيل دفعة لمبيعات (Sale Payment)
    // ──────────────────────────────────────────────────────────────

    public function recordPayment(SaleOrder $order, array $data): SalePayment
    {
        return DB::transaction(function () use ($order, $data) {
            if ($order->status === 'cancelled') {
                throw new InvalidArgumentException('لا يمكن إضافة دفعة لفاتورة مبيعات ملغاة.');
            }

            $amount = round((float) $data['amount'], 4);
            if ($amount <= 0) {
                throw new InvalidArgumentException('مبلغ الدفعة يجب أن يكون أكبر من الصفر.');
            }

            $payment = SalePayment::create([
                'sale_order_id'     => $order->id,
                'pos_session_id'    => $data['pos_session_id'] ?? $order->pos_session_id,
                'date'              => $data['date'],
                'amount'            => $amount,
                'payment_method_id' => $data['payment_method_id'],
                'treasury_id'       => $data['treasury_id'] ?? null,
                'bank_account_id'   => $data['bank_account_id'] ?? null,
                'reference'         => $data['reference'] ?? null,
                'notes'             => $data['notes'] ?? null,
                'created_by'        => Auth::id() ?? $data['created_by'] ?? null,
            ]);

            $paid = (float) $order->payments()->sum('amount');
            $total = (float) $order->total_amount;
            $status = match (true) {
                $paid <= 0     => 'unpaid',
                $paid < $total => 'partial',
                default        => 'paid',
            };

            $order->update([
                'paid_amount'    => round($paid, 4),
                'payment_status' => $status,
            ]);

            // Sub-ledger: Credit entry for customer (reduces receivable)
            if ($order->contact_id) {
                ContactLedgerEntry::create([
                    'contact_id'     => $order->contact_id,
                    'fiscal_year_id' => $order->fiscal_year_id,
                    'date'           => $data['date'],
                    'debit'          => 0,
                    'credit'         => $amount,
                    'reference_type' => 'SalePayment',
                    'reference_id'   => $payment->id,
                    'description'    => "سداد دفعة لفاتورة المبيعات رقم {$order->order_number}",
                ]);
            }

            return $payment;
        });
    }

    public function deletePayment(SalePayment $payment): bool
    {
        return DB::transaction(fn () => $payment->delete());
    }

    // ──────────────────────────────────────────────────────────────
    // 3. مرتجع مبيعات (Sale Return)
    // ──────────────────────────────────────────────────────────────

    public function createReturn(array $data): SaleReturn
    {
        return DB::transaction(function () use ($data) {
            if (empty($data['lines']) || count($data['lines']) === 0) {
                throw new InvalidArgumentException('مرتجع المبيعات يجب أن يحتوي على سطر واحد على الأقل.');
            }

            $fiscalYearId = $data['fiscal_year_id']
                ?? FiscalYear::where('status', 'open')->first()?->id;

            $originalOrder = SaleOrder::findOrFail($data['original_sale_id']);

            $returnNumber = $this->sequenceService->getNextNumber(
                $data['branch_id'] ?? $originalOrder->branch_id,
                $fiscalYearId,
                'sale_return',
                'SRT'
            );

            $totalAmount = collect($data['lines'])->sum('total_amount');
            $taxAmount = collect($data['lines'])->sum('tax_amount');

            $return = SaleReturn::create([
                'return_number'    => $returnNumber,
                'date'             => $data['date'],
                'fiscal_year_id'   => $fiscalYearId,
                'original_sale_id' => $originalOrder->id,
                'contact_id'       => $data['contact_id'] ?? $originalOrder->contact_id,
                'branch_id'        => $data['branch_id'] ?? $originalOrder->branch_id,
                'warehouse_id'     => $data['warehouse_id'] ?? $originalOrder->warehouse_id,
                'user_id'          => Auth::id() ?? $data['user_id'] ?? null,
                'total_amount'     => round((float) $totalAmount, 4),
                'tax_amount'       => round((float) $taxAmount, 4),
                'status'           => 'confirmed',
                'refund_method'    => $data['refund_method'] ?? 'cash',
                'notes'            => $data['notes'] ?? null,
            ]);

            foreach ($data['lines'] as $lineData) {
                $originalLine = SaleOrderLine::findOrFail($lineData['original_line_id']);
                $product = $originalLine->product;

                // Validate return quantity against sold and previously returned
                $alreadyReturned = (float) SaleReturnLine::where('original_line_id', $originalLine->id)
                    ->whereHas('saleReturn', fn ($q) => $q->where('status', '!=', 'cancelled'))
                    ->sum('quantity');

                $availableToReturn = (float) $originalLine->quantity - $alreadyReturned;
                $returnQty = (float) $lineData['quantity'];

                if ($returnQty <= 0) {
                    throw new InvalidArgumentException("كمية المرتجع يجب أن تكون أكبر من الصفر.");
                }

                if ($returnQty > $availableToReturn) {
                    throw new InvalidArgumentException(
                        "لا يمكن إرجاع كمية ({$returnQty}) أكبر من الكمية المتاحة للإرجاع ({$availableToReturn}) للسطر {$originalLine->id}."
                    );
                }

                // Determine return_cost_price
                // ADR-17: For none-tracked products, uses original_line.cost_price
                $returnCostPrice = (float) ($originalLine->cost_price ?? 0);

                $returnLine = SaleReturnLine::create([
                    'sale_return_id'    => $return->id,
                    'original_line_id'  => $originalLine->id,
                    'product_id'        => $lineData['product_id'],
                    'variation_id'      => $lineData['variation_id'] ?? null,
                    'quantity'          => $returnQty,
                    'unit_id'           => $lineData['unit_id'] ?? $originalLine->unit_id,
                    'unit_price'        => round((float) $lineData['unit_price'], 4),
                    'return_cost_price' => round($returnCostPrice, 4),
                    'tax_amount'        => round((float) ($lineData['tax_amount'] ?? 0), 4),
                    'total_amount'      => round((float) $lineData['total_amount'], 4),
                ]);

                if (! $product->isService()) {
                    if ($product->tracking_type === 'serial') {
                        $serialIds = $lineData['serial_ids'] ?? [];
                        if (count($serialIds) !== (int) $returnQty) {
                            throw new InvalidArgumentException(
                                "عدد السيريالات لا يتطابق مع كمية المرتجع في السطر {$returnLine->id}."
                            );
                        }

                        foreach ($serialIds as $serialId) {
                            /** @var ProductSerial $serial */
                            $serial = ProductSerial::lockForUpdate()->findOrFail($serialId);

                            if ($serial->status !== 'sold') {
                                throw new InvalidArgumentException(
                                    "السيريال ({$serial->serial_number}) ليس بحالة مباع (حالته: {$serial->status})."
                                );
                            }

                            // Transition sold -> returned (ADR-14)
                            $this->serialStateMachine->transition(
                                $serial,
                                'returned',
                                [
                                    'event_type'     => 'returned',
                                    'reference_type' => 'SaleReturn',
                                    'reference_id'   => $return->id,
                                    'created_by'     => Auth::id(),
                                ]
                            );

                            // Find original serial cost at sale time (ADR-16/17)
                            $origSaleSerial = SaleLineSerial::where('sale_order_line_id', $originalLine->id)
                                ->where('serial_id', $serialId)
                                ->first();

                            $serialCost = $origSaleSerial ? (float) $origSaleSerial->cost_price : (float) $serial->cost_price;

                            SaleReturnLineSerial::create([
                                'sale_return_line_id' => $returnLine->id,
                                'serial_id'           => $serialId,
                                'cost_price'          => round($serialCost, 4),
                            ]);

                            // Accept into stock if requested
                            $acceptIntoStock = $data['accept_into_stock'] ?? true;
                            if ($acceptIntoStock) {
                                // Transition returned -> in_stock
                                $this->serialStateMachine->transition(
                                    $serial,
                                    'in_stock',
                                    [
                                        'event_type'     => 'returned',
                                        'reference_type' => 'SaleReturn',
                                        'reference_id'   => $return->id,
                                        'created_by'     => Auth::id(),
                                    ]
                                );

                                $this->stockService->recordIn(
                                    productId:     $product->id,
                                    variationId:   $lineData['variation_id'] ?? null,
                                    warehouseId:   $return->warehouse_id,
                                    quantity:      1,
                                    unitCost:      $serialCost,
                                    movementType:  'sale_return_in',
                                    referenceType: 'SaleReturn',
                                    referenceId:   $return->id,
                                    serialId:      $serialId,
                                    fiscalYearId:  $fiscalYearId,
                                    createdBy:     Auth::id(),
                                );
                            }
                        }
                    } else {
                        // Regular product: recordIn at original cost (ADR-17)
                        $this->stockService->recordIn(
                            productId:     $lineData['product_id'],
                            variationId:   $lineData['variation_id'] ?? null,
                            warehouseId:   $return->warehouse_id,
                            quantity:      $returnQty,
                            unitCost:      $returnCostPrice,
                            movementType:  'sale_return_in',
                            referenceType: 'SaleReturn',
                            referenceId:   $return->id,
                            fiscalYearId:  $fiscalYearId,
                            createdBy:     Auth::id(),
                        );
                    }
                }
            }

            // Sub-ledger: Credit entry for customer on return (reduces customer debt)
            if ($return->contact_id) {
                ContactLedgerEntry::create([
                    'contact_id'     => $return->contact_id,
                    'fiscal_year_id' => $return->fiscal_year_id,
                    'date'           => $return->date,
                    'debit'          => 0,
                    'credit'         => $return->total_amount,
                    'reference_type' => 'SaleReturn',
                    'reference_id'   => $return->id,
                    'description'    => "مرتجع مبيعات رقم {$return->return_number} لفاتورة المبيعات رقم {$originalOrder->order_number}",
                ]);
            }

            return $return->fresh('lines.serials');
        });
    }

    // ──────────────────────────────────────────────────────────────
    // 4. عروض الأسعار (Quotations)
    // ──────────────────────────────────────────────────────────────

    public function createQuotation(array $data): Quotation
    {
        return DB::transaction(function () use ($data) {
            if (empty($data['lines']) || count($data['lines']) === 0) {
                throw new InvalidArgumentException('عرض السعر يجب أن يحتوي على سطر واحد على الأقل.');
            }

            $fiscalYearId = $data['fiscal_year_id']
                ?? FiscalYear::where('status', 'open')->first()?->id;

            $quoNumber = $this->sequenceService->getNextNumber(
                $data['branch_id'],
                $fiscalYearId,
                'quotation',
                'QUO'
            );

            $processedLines = collect($data['lines'])->map(function ($line) {
                $qty = (float) $line['quantity'];
                $price = (float) $line['unit_price'];
                $disc = (float) ($line['discount_amount'] ?? 0);
                $tax = (float) ($line['tax_amount'] ?? 0);
                $subtotal = ($price * $qty) - $disc;
                $lineTotal = isset($line['total_amount']) ? (float) $line['total_amount'] : ($subtotal + $tax);

                return [
                    ...$line,
                    'quantity'        => $qty,
                    'unit_price'      => $price,
                    'discount_amount' => $disc,
                    'tax_amount'      => $tax,
                    'subtotal'        => $subtotal,
                    'total_amount'    => $lineTotal,
                ];
            });

            $subtotal = $processedLines->sum('subtotal');
            $taxAmt = $processedLines->sum('tax_amount');
            $discAmt = (float) ($data['discount_amount'] ?? $processedLines->sum('discount_amount'));
            $totalAmount = $subtotal + $taxAmt;

            $quotation = Quotation::create([
                'quotation_number' => $quoNumber,
                'date'             => $data['date'],
                'expiry_date'      => $data['expiry_date'] ?? null,
                'fiscal_year_id'   => $fiscalYearId,
                'contact_id'       => $data['contact_id'] ?? null,
                'branch_id'        => $data['branch_id'],
                'warehouse_id'     => $data['warehouse_id'] ?? null,
                'user_id'          => Auth::id() ?? $data['user_id'] ?? null,
                'subtotal'         => round($subtotal, 4),
                'discount_amount'  => round($discAmt, 4),
                'tax_amount'       => round($taxAmt, 4),
                'total_amount'     => round($totalAmount, 4),
                'status'           => $data['status'] ?? 'draft',
                'notes'            => $data['notes'] ?? null,
            ]);

            foreach ($processedLines as $line) {
                QuotationLine::create([
                    'quotation_id'    => $quotation->id,
                    'product_id'      => $line['product_id'],
                    'variation_id'    => $line['variation_id'] ?? null,
                    'quantity'        => $line['quantity'],
                    'unit_id'         => $line['unit_id'] ?? Product::find($line['product_id'])?->unit_id,
                    'unit_price'      => round((float) $line['unit_price'], 4),
                    'discount_amount' => round((float) $line['discount_amount'], 4),
                    'tax_amount'      => round((float) $line['tax_amount'], 4),
                    'total_amount'    => round((float) $line['total_amount'], 4),
                    'notes'           => $line['notes'] ?? null,
                ]);
            }

            return $quotation->fresh('lines');
        });
    }

    // ──────────────────────────────────────────────────────────────
    // 5. مسودات البيع (Sale Drafts)
    // ──────────────────────────────────────────────────────────────

    public function createDraft(array $data): SaleDraft
    {
        return DB::transaction(function () use ($data) {
            if (empty($data['lines']) || count($data['lines']) === 0) {
                throw new InvalidArgumentException('مسودة البيع يجب أن تحتوي على سطر واحد على الأقل.');
            }

            $fiscalYearId = $data['fiscal_year_id']
                ?? FiscalYear::where('status', 'open')->first()?->id;

            $draftNumber = $this->sequenceService->getNextNumber(
                $data['branch_id'],
                $fiscalYearId,
                'sale_draft',
                'DFT'
            );

            $processedLines = collect($data['lines'])->map(function ($line) {
                $qty = (float) $line['quantity'];
                $price = (float) $line['unit_price'];
                $total = isset($line['total_amount']) ? (float) $line['total_amount'] : ($qty * $price);

                return [
                    ...$line,
                    'quantity'     => $qty,
                    'unit_price'   => $price,
                    'total_amount' => $total,
                ];
            });

            $subtotal = $processedLines->sum('total_amount');
            $discAmt = (float) ($data['discount_amount'] ?? 0);
            $taxAmt = (float) ($data['tax_amount'] ?? 0);
            $totalAmount = $subtotal - $discAmt + $taxAmt;

            $draft = SaleDraft::create([
                'draft_number'    => $draftNumber,
                'date'            => $data['date'],
                'fiscal_year_id'  => $fiscalYearId,
                'contact_id'      => $data['contact_id'] ?? null,
                'branch_id'       => $data['branch_id'],
                'warehouse_id'    => $data['warehouse_id'],
                'user_id'         => Auth::id() ?? $data['user_id'] ?? null,
                'subtotal'        => round($subtotal, 4),
                'discount_amount' => round($discAmt, 4),
                'tax_amount'      => round($taxAmt, 4),
                'total_amount'    => round($totalAmount, 4),
                'notes'           => $data['notes'] ?? null,
            ]);

            foreach ($processedLines as $line) {
                SaleDraftLine::create([
                    'sale_draft_id' => $draft->id,
                    'product_id'    => $line['product_id'],
                    'variation_id'  => $line['variation_id'] ?? null,
                    'quantity'      => $line['quantity'],
                    'unit_id'       => $line['unit_id'] ?? Product::find($line['product_id'])?->unit_id,
                    'unit_price'    => round((float) $line['unit_price'], 4),
                    'total_amount'  => round((float) $line['total_amount'], 4),
                ]);
            }

            return $draft->fresh('lines');
        });
    }
}
