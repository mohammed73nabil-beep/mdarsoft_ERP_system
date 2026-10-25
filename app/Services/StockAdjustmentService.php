<?php

namespace App\Services;

use App\Models\StockAdjustment;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;
use RuntimeException;

class StockAdjustmentService
{
    public function __construct(
        protected StockService $stockService,
        protected SerialStateMachine $serialStateMachine
    ) {}

    /**
     * Post a stock adjustment voucher.
     */
    public function post(StockAdjustment $adjustment): StockAdjustment
    {
        return DB::transaction(function () use ($adjustment) {
            $lockedAdjustment = StockAdjustment::where('id', $adjustment->id)->lockForUpdate()->firstOrFail();

            if ($lockedAdjustment->status !== 'draft') {
                throw new RuntimeException("Cannot post adjustment with status '{$lockedAdjustment->status}'. Must be draft.");
            }

            $lockedAdjustment->load('lines.product');

            if ($lockedAdjustment->lines->isEmpty()) {
                throw new InvalidArgumentException('Adjustment must have at least one line.');
            }

            foreach ($lockedAdjustment->lines as $line) {
                $product = $line->product;
                $cost = (float) $line->unit_cost;
                $direction = $line->direction;

                if ($direction === 'in') {
                    if ($product->tracking_type === 'serial') {
                        if (!$line->serial_id) {
                            throw new InvalidArgumentException("Serial ID required for line {$line->id}.");
                        }

                        // If serial was damaged, rehabilitate to in_stock
                        $serial = $line->serial;
                        if ($serial && $serial->status === 'damaged') {
                            $this->serialStateMachine->transition(
                                $line->serial_id,
                                'in_stock',
                                [
                                    'event_type' => 'adjusted',
                                    'is_approved_adjustment' => true,
                                    'reference_type' => 'StockAdjustment',
                                    'reference_id' => $lockedAdjustment->id,
                                    'warehouse_id' => $lockedAdjustment->warehouse_id,
                                    'unit_cost' => $cost,
                                    'notes' => "Rehabilitated via adjustment #{$lockedAdjustment->adjustment_number}",
                                ]
                            );
                        }

                        $this->stockService->recordIn(
                            productId: $line->product_id,
                            variationId: $line->variation_id,
                            warehouseId: $lockedAdjustment->warehouse_id,
                            quantity: 1,
                            unitCost: $cost,
                            movementType: 'adjust_in',
                            referenceType: 'StockAdjustment',
                            referenceId: $lockedAdjustment->id,
                            serialId: $line->serial_id,
                            fiscalYearId: $lockedAdjustment->fiscal_year_id,
                            createdBy: Auth::id(),
                            notes: "Adjustment #{$lockedAdjustment->adjustment_number}"
                        );
                    } else {
                        $this->stockService->recordIn(
                            productId: $line->product_id,
                            variationId: $line->variation_id,
                            warehouseId: $lockedAdjustment->warehouse_id,
                            quantity: $line->adjusted_quantity,
                            unitCost: $cost,
                            movementType: 'adjust_in',
                            referenceType: 'StockAdjustment',
                            referenceId: $lockedAdjustment->id,
                            serialId: null,
                            fiscalYearId: $lockedAdjustment->fiscal_year_id,
                            createdBy: Auth::id(),
                            notes: "Adjustment #{$lockedAdjustment->adjustment_number}"
                        );
                    }
                } elseif ($direction === 'out') {
                    if ($product->tracking_type === 'serial') {
                        if (!$line->serial_id) {
                            throw new InvalidArgumentException("Serial ID required for line {$line->id}.");
                        }

                        $this->stockService->recordOut(
                            productId: $line->product_id,
                            variationId: $line->variation_id,
                            warehouseId: $lockedAdjustment->warehouse_id,
                            quantity: 1,
                            unitCost: $cost,
                            movementType: 'adjust_out',
                            referenceType: 'StockAdjustment',
                            referenceId: $lockedAdjustment->id,
                            serialId: $line->serial_id,
                            fiscalYearId: $lockedAdjustment->fiscal_year_id,
                            createdBy: Auth::id(),
                            notes: "Adjustment #{$lockedAdjustment->adjustment_number}"
                        );
                    } else {
                        $this->stockService->recordOut(
                            productId: $line->product_id,
                            variationId: $line->variation_id,
                            warehouseId: $lockedAdjustment->warehouse_id,
                            quantity: $line->adjusted_quantity,
                            unitCost: $cost,
                            movementType: 'adjust_out',
                            referenceType: 'StockAdjustment',
                            referenceId: $lockedAdjustment->id,
                            serialId: null,
                            fiscalYearId: $lockedAdjustment->fiscal_year_id,
                            createdBy: Auth::id(),
                            notes: "Adjustment #{$lockedAdjustment->adjustment_number}"
                        );
                    }
                }
            }

            $lockedAdjustment->status = 'posted';
            $lockedAdjustment->save();

            return $lockedAdjustment;
        });
    }
}
