<?php

namespace App\Services;

use App\Models\DamagedStock;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;
use RuntimeException;

class DamagedStockService
{
    public function __construct(
        protected StockService $stockService,
        protected SerialStateMachine $serialStateMachine
    ) {}

    /**
     * Post damaged stock: Deducts items from inventory and sets serial status to damaged.
     */
    public function post(DamagedStock $damagedStock): DamagedStock
    {
        return DB::transaction(function () use ($damagedStock) {
            $locked = DamagedStock::where('id', $damagedStock->id)->lockForUpdate()->firstOrFail();

            if ($locked->status !== 'draft') {
                throw new RuntimeException("Cannot post damaged stock with status '{$locked->status}'. Must be draft.");
            }

            $locked->load('lines.product');

            if ($locked->lines->isEmpty()) {
                throw new InvalidArgumentException('Damaged stock voucher must contain at least one line.');
            }

            $totalCost = 0.0;

            foreach ($locked->lines as $line) {
                $product = $line->product;
                $cost = (float) $line->unit_cost;
                $qty = (float) $line->quantity;
                $lineTotal = round($qty * $cost, 4);

                $line->total_cost = $lineTotal;
                $line->save();

                $totalCost += $lineTotal;

                if ($product->tracking_type === 'serial') {
                    if (!$line->serial_id) {
                        throw new InvalidArgumentException("Serial ID required for line {$line->id}.");
                    }

                    // Transition serial to damaged
                    $this->serialStateMachine->transition(
                        $line->serial_id,
                        'damaged',
                        [
                            'event_type' => 'damaged',
                            'reference_type' => 'DamagedStock',
                            'reference_id' => $locked->id,
                            'warehouse_id' => $locked->warehouse_id,
                            'unit_cost' => $cost,
                            'notes' => "Marked damaged in voucher #{$locked->reference_number}",
                        ]
                    );

                    $this->stockService->recordOut(
                        productId: $line->product_id,
                        variationId: $line->variation_id,
                        warehouseId: $locked->warehouse_id,
                        quantity: 1,
                        unitCost: $cost,
                        movementType: 'damaged',
                        referenceType: 'DamagedStock',
                        referenceId: $locked->id,
                        serialId: $line->serial_id,
                        fiscalYearId: $locked->fiscal_year_id,
                        createdBy: Auth::id(),
                        notes: "Damaged stock #{$locked->reference_number}"
                    );
                } else {
                    $this->stockService->recordOut(
                        productId: $line->product_id,
                        variationId: $line->variation_id,
                        warehouseId: $locked->warehouse_id,
                        quantity: $qty,
                        unitCost: $cost,
                        movementType: 'damaged',
                        referenceType: 'DamagedStock',
                        referenceId: $locked->id,
                        serialId: null,
                        fiscalYearId: $locked->fiscal_year_id,
                        createdBy: Auth::id(),
                        notes: "Damaged stock #{$locked->reference_number}"
                    );
                }
            }

            $locked->total_cost = round($totalCost, 4);
            $locked->status = 'posted';
            $locked->save();

            return $locked;
        });
    }
}
