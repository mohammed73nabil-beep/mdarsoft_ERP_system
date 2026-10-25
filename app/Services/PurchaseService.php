<?php

namespace App\Services;

use App\Models\ContactLedgerEntry;
use App\Models\FiscalYear;
use App\Models\PurchaseLineSerial;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderLine;
use App\Models\PurchasePayment;
use App\Models\PurchaseReturn;
use App\Models\PurchaseReturnLine;
use App\Models\PurchaseReturnLineSerial;
use App\Models\ProductSerial;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class PurchaseService
{
    public function __construct(
        private readonly StockService $stockService,
        private readonly SerialStateMachine $serialStateMachine,
        private readonly DocumentSequenceService $sequenceService,
    ) {}

    // ──────────────────────────────────────────────────────────────
    // 1. إنشاء أمر شراء (confirmed)
    // ──────────────────────────────────────────────────────────────

    /**
     * Create a new purchase order with its lines (status = confirmed).
     * Does NOT touch stock — stock is updated on receive().
     */
    public function create(array $data): PurchaseOrder
    {
        return DB::transaction(function () use ($data) {
            if (empty($data['lines']) || count($data['lines']) === 0) {
                throw new InvalidArgumentException('أمر الشراء يجب أن يحتوي على سطر واحد على الأقل.');
            }

            $fiscalYearId = $data['fiscal_year_id']
                ?? FiscalYear::where('status', 'open')->first()?->id;

            if (! $fiscalYearId) {
                throw new InvalidArgumentException('لا توجد سنة مالية مفتوحة.');
            }

            $orderNumber = $this->sequenceService->getNextNumber(
                $data['branch_id'],
                $fiscalYearId,
                'PO'
            );

            $processedLines = collect($data['lines'])->map(function ($line) {
                $qty = (float) $line['quantity'];
                $cost = (float) $line['unit_cost'];
                $discount = (float) ($line['discount_amount'] ?? 0);
                $tax = (float) ($line['tax_amount'] ?? 0);
                $subtotal = ($cost * $qty) - $discount;
                $lineTotal = isset($line['total_amount']) ? (float) $line['total_amount'] : ($subtotal + $tax);

                return [
                    ...$line,
                    'quantity'        => $qty,
                    'unit_cost'       => $cost,
                    'discount_amount' => $discount,
                    'tax_amount'      => $tax,
                    'subtotal'        => $subtotal,
                    'total_amount'    => $lineTotal,
                ];
            });

            $subtotal    = $processedLines->sum('subtotal');
            $discountAmt = $processedLines->sum('discount_amount');
            $taxAmount   = $processedLines->sum('tax_amount');
            $shippingAmt = (float) ($data['shipping_amount'] ?? 0);
            $totalAmount = $subtotal + $taxAmount + $shippingAmt;

            $order = PurchaseOrder::create([
                'order_number'    => $orderNumber,
                'date'            => $data['date'],
                'fiscal_year_id'  => $fiscalYearId,
                'contact_id'      => $data['contact_id'] ?? null,
                'branch_id'       => $data['branch_id'],
                'warehouse_id'    => $data['warehouse_id'],
                'user_id'         => Auth::id(),
                'subtotal'        => round($subtotal, 4),
                'discount_amount' => round($discountAmt, 4),
                'tax_amount'      => round($taxAmount, 4),
                'shipping_amount' => round($shippingAmt, 4),
                'total_amount'    => round($totalAmount, 4),
                'paid_amount'     => 0,
                'payment_status'  => 'unpaid',
                'status'          => 'confirmed',
                'notes'           => $data['notes'] ?? null,
            ]);

            foreach ($processedLines as $line) {
                PurchaseOrderLine::create([
                    'purchase_order_id' => $order->id,
                    'product_id'        => $line['product_id'],
                    'variation_id'      => $line['variation_id'] ?? null,
                    'quantity'          => $line['quantity'],
                    'unit_id'           => $line['unit_id'] ?? \App\Models\Product::find($line['product_id'])?->unit_id,
                    'unit_cost'         => round((float) $line['unit_cost'], 4),
                    'discount_amount'   => round((float) $line['discount_amount'], 4),
                    'tax_id'            => $line['tax_id'] ?? null,
                    'tax_amount'        => round((float) $line['tax_amount'], 4),
                    'total_amount'      => round((float) $line['total_amount'], 4),
                    'expiry_date'       => $line['expiry_date'] ?? null,
                    'notes'             => $line['notes'] ?? null,
                ]);
            }

            return $order->fresh('lines');
        });
    }

    // ──────────────────────────────────────────────────────────────
    // 2. استلام أمر الشراء (received) — يحدث المخزون وحالة السيريال
    // ──────────────────────────────────────────────────────────────

    /**
     * Receive a purchase order:
     *  - Transitions serial devices to 'in_stock'
     *  - Calls StockService::recordIn for each line
     *  - Inserts purchase_line_serials for serial products
     *  - Marks order as 'received'
     *
     * @param array<int, array{serial_ids?: int[]}> $receiveData  keyed by line_id
     */
    public function receive(PurchaseOrder $order, array $receiveData = []): PurchaseOrder
    {
        if (in_array($order->status, ['received', 'completed'])) {
            throw new InvalidArgumentException('أمر الشراء مستلم بالفعل.');
        }
        if ($order->status === 'cancelled') {
            throw new InvalidArgumentException('لا يمكن استلام أمر شراء ملغى.');
        }

        return DB::transaction(function () use ($order, $receiveData) {
            $order->loadMissing('lines.product');

            foreach ($order->lines as $line) {
                $lineData = $receiveData[$line->id] ?? [];
                $product  = $line->product;

                if ($product->tracking_type === 'serial') {
                    $serialIds = $lineData['serial_ids'] ?? [];
                    if (count($serialIds) !== (int) $line->quantity) {
                        throw new InvalidArgumentException(
                            "عدد السيريالات ({$line->id}) لا يتطابق مع الكمية المطلوبة ({$line->quantity})."
                        );
                    }

                    foreach ($serialIds as $serialId) {
                        $serial = ProductSerial::lockForUpdate()->findOrFail($serialId);

                        // Prevent receiving a serial already received on another active purchase order
                        if (PurchaseLineSerial::where('serial_id', $serialId)
                            ->where('purchase_order_line_id', '!=', $line->id)
                            ->whereHas('purchaseOrderLine.purchaseOrder', fn ($q) => $q->where('status', '!=', 'cancelled'))
                            ->exists() && $serial->status !== 'returned_to_supplier') {
                            throw new InvalidArgumentException("السيريال ({$serial->serial_number}) مسجل في أمر شراء آخر ولا يمكن تكراره.");
                        }

                        if ($serial->status !== 'in_stock') {
                            $this->serialStateMachine->transition(
                                $serial,
                                'in_stock',
                                [
                                    'event_type'     => 'purchased',
                                    'reference_type' => 'PurchaseOrder',
                                    'reference_id'   => $order->id,
                                    'created_by'     => Auth::id(),
                                ]
                            );
                        } else {
                            \App\Models\SerialEvent::create([
                                'serial_id'         => $serial->id,
                                'event_type'        => 'purchased',
                                'from_warehouse_id' => null,
                                'to_warehouse_id'   => $order->warehouse_id,
                                'from_status'       => 'in_stock',
                                'to_status'         => 'in_stock',
                                'reference_type'    => 'PurchaseOrder',
                                'reference_id'      => $order->id,
                                'unit_cost'         => $line->unit_cost,
                                'created_by'        => Auth::id(),
                            ]);
                        }

                        $serial->update([
                            'cost_price'   => $line->unit_cost,
                            'warehouse_id' => $order->warehouse_id,
                        ]);

                        PurchaseLineSerial::create([
                            'purchase_order_line_id' => $line->id,
                            'serial_id'              => $serialId,
                        ]);

                        $this->stockService->recordIn(
                            productId:     $product->id,
                            variationId:   $line->variation_id,
                            warehouseId:   $order->warehouse_id,
                            quantity:      1,
                            unitCost:      $line->unit_cost,
                            movementType:  'purchase_in',
                            referenceType: 'PurchaseOrder',
                            referenceId:   $order->id,
                            serialId:      $serialId,
                            fiscalYearId:  $order->fiscal_year_id,
                            createdBy:     Auth::id(),
                        );
                    }
                } else {
                    $this->stockService->recordIn(
                        productId:     $product->id,
                        variationId:   $line->variation_id,
                        warehouseId:   $order->warehouse_id,
                        quantity:      $line->quantity,
                        unitCost:      $line->unit_cost,
                        movementType:  'purchase_in',
                        referenceType: 'PurchaseOrder',
                        referenceId:   $order->id,
                        fiscalYearId:  $order->fiscal_year_id,
                        createdBy:     Auth::id(),
                    );
                }
            }

            $order->update(['status' => 'received']);

            // Sub-ledger: Credit entry for supplier (we owe supplier)
            if ($order->contact_id) {
                ContactLedgerEntry::create([
                    'contact_id'     => $order->contact_id,
                    'fiscal_year_id' => $order->fiscal_year_id,
                    'date'           => $order->date,
                    'debit'          => 0,
                    'credit'         => $order->total_amount,
                    'reference_type' => 'PurchaseOrder',
                    'reference_id'   => $order->id,
                    'description'    => "فاتورة شراء رقم {$order->order_number}",
                ]);
            }

            return $order->fresh();
        });
    }

    // ──────────────────────────────────────────────────────────────
    // 3. تسجيل دفعة للمورد
    // ──────────────────────────────────────────────────────────────

    public function recordPayment(PurchaseOrder $order, array $data): PurchasePayment
    {
        return DB::transaction(function () use ($order, $data) {
            if ($order->status === 'cancelled') {
                throw new InvalidArgumentException('لا يمكن إضافة دفعة لأمر شراء ملغى.');
            }

            $payment = PurchasePayment::create([
                'purchase_order_id' => $order->id,
                'date'              => $data['date'],
                'amount'            => round((float) $data['amount'], 4),
                'payment_method_id' => $data['payment_method_id'],
                'treasury_id'       => $data['treasury_id'] ?? null,
                'bank_account_id'   => $data['bank_account_id'] ?? null,
                'reference'         => $data['reference'] ?? null,
                'notes'             => $data['notes'] ?? null,
                'created_by'        => Auth::id(),
            ]);

            $paid  = (float) $order->payments()->sum('amount');
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

            // Sub-ledger: Debit entry for supplier payment (reduces payable)
            if ($order->contact_id) {
                ContactLedgerEntry::create([
                    'contact_id'     => $order->contact_id,
                    'fiscal_year_id' => $order->fiscal_year_id,
                    'date'           => $data['date'],
                    'debit'          => round((float) $data['amount'], 4),
                    'credit'         => 0,
                    'reference_type' => 'PurchasePayment',
                    'reference_id'   => $payment->id,
                    'description'    => "سداد دفعة لفاتورة الشراء رقم {$order->order_number}",
                ]);
            }

            return $payment;
        });
    }

    /**
     * Delete a purchase payment and atomically update the order's paid amount & ledger.
     */
    public function deletePayment(PurchasePayment $payment): bool
    {
        return DB::transaction(fn () => $payment->delete());
    }

    // ──────────────────────────────────────────────────────────────
    // 4. مرتجع مشتريات (إعادة البضاعة للمورد)
    // ──────────────────────────────────────────────────────────────

    /**
     * Process a purchase return: reduces stock and transitions serials
     * to 'returned_to_supplier'.
     */
    public function createReturn(array $data): PurchaseReturn
    {
        return DB::transaction(function () use ($data) {
            if (empty($data['lines']) || count($data['lines']) === 0) {
                throw new InvalidArgumentException('مرتجع الشراء يجب أن يحتوي على سطر واحد على الأقل.');
            }

            $fiscalYearId = $data['fiscal_year_id']
                ?? FiscalYear::where('status', 'open')->first()?->id;

            $originalOrder = PurchaseOrder::findOrFail($data['original_purchase_id']);

            $returnNumber = $this->sequenceService->getNextNumber(
                $data['branch_id'],
                $fiscalYearId,
                'PR'
            );

            $totalAmount = collect($data['lines'])->sum('total_amount');
            $taxAmount   = collect($data['lines'])->sum('tax_amount');

            $return = PurchaseReturn::create([
                'return_number'        => $returnNumber,
                'date'                 => $data['date'],
                'fiscal_year_id'       => $fiscalYearId,
                'original_purchase_id' => $originalOrder->id,
                'contact_id'           => $data['contact_id'] ?? $originalOrder->contact_id,
                'branch_id'            => $data['branch_id'],
                'warehouse_id'         => $data['warehouse_id'],
                'user_id'              => Auth::id(),
                'total_amount'         => round((float) $totalAmount, 4),
                'tax_amount'           => round((float) $taxAmount, 4),
                'status'               => 'confirmed',
                'notes'                => $data['notes'] ?? null,
            ]);

            foreach ($data['lines'] as $lineData) {
                $originalLine = PurchaseOrderLine::findOrFail($lineData['original_line_id']);
                $product      = $originalLine->product;

                // Validate return quantity against purchased and previously returned quantity
                $alreadyReturned = (float) PurchaseReturnLine::where('original_line_id', $originalLine->id)
                    ->whereHas('purchaseReturn', fn ($q) => $q->where('status', '!=', 'cancelled'))
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

                $returnLine = PurchaseReturnLine::create([
                    'purchase_return_id' => $return->id,
                    'original_line_id'   => $originalLine->id,
                    'product_id'         => $lineData['product_id'],
                    'variation_id'       => $lineData['variation_id'] ?? null,
                    'quantity'           => $lineData['quantity'],
                    'unit_cost'          => round((float) $lineData['unit_cost'], 4),
                    'tax_amount'         => round((float) ($lineData['tax_amount'] ?? 0), 4),
                    'total_amount'       => round((float) $lineData['total_amount'], 4),
                ]);

                if ($product->tracking_type === 'serial') {
                    $serialIds = $lineData['serial_ids'] ?? [];
                    if (count($serialIds) !== (int) $lineData['quantity']) {
                        throw new InvalidArgumentException(
                            "عدد السيريالات لا يتطابق مع كمية المرتجع في السطر {$returnLine->id}."
                        );
                    }

                    foreach ($serialIds as $serialId) {
                        $serial = ProductSerial::lockForUpdate()->findOrFail($serialId);

                        $this->serialStateMachine->transition(
                            $serial,
                            'returned_to_supplier',
                            [
                                'reference_type' => 'PurchaseReturn',
                                'reference_id'   => $return->id,
                                'created_by'     => Auth::id(),
                            ]
                        );

                        // Use actual specific serial cost (ADR-16/ADR-24)
                        $serialCost = (float) ($serial->cost_price > 0 ? $serial->cost_price : $lineData['unit_cost']);

                        PurchaseReturnLineSerial::create([
                            'purchase_return_line_id' => $returnLine->id,
                            'serial_id'               => $serialId,
                            'cost_price'              => round($serialCost, 4),
                        ]);

                        $this->stockService->recordOut(
                            productId:     $product->id,
                            variationId:   $lineData['variation_id'] ?? null,
                            warehouseId:   $data['warehouse_id'],
                            quantity:      1,
                            unitCost:      $serialCost,
                            movementType:  'purchase_return_out',
                            referenceType: 'PurchaseReturn',
                            referenceId:   $return->id,
                            serialId:      $serialId,
                            fiscalYearId:  $fiscalYearId,
                            createdBy:     Auth::id(),
                        );
                    }
                } else {
                    $this->stockService->recordOut(
                        productId:     $lineData['product_id'],
                        variationId:   $lineData['variation_id'] ?? null,
                        warehouseId:   $data['warehouse_id'],
                        quantity:      $lineData['quantity'],
                        unitCost:      null,
                        movementType:  'purchase_return_out',
                        referenceType: 'PurchaseReturn',
                        referenceId:   $return->id,
                        fiscalYearId:  $fiscalYearId,
                        createdBy:     Auth::id(),
                    );
                }
            }

            // Sub-ledger: Debit entry for purchase return (reduces supplier payable)
            if ($return->contact_id) {
                ContactLedgerEntry::create([
                    'contact_id'     => $return->contact_id,
                    'fiscal_year_id' => $return->fiscal_year_id,
                    'date'           => $return->date,
                    'debit'          => $return->total_amount,
                    'credit'         => 0,
                    'reference_type' => 'PurchaseReturn',
                    'reference_id'   => $return->id,
                    'description'    => "مرتجع مشتريات رقم {$return->return_number} لفاتورة الشراء رقم {$originalOrder->order_number}",
                ]);
            }

            return $return->fresh('lines');
        });
    }
}
