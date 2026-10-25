<?php

namespace App\Services;

use App\Models\OpeningStock;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;
use RuntimeException;

class OpeningStockService
{
    public function __construct(
        protected StockService $stockService,
        protected SerialStateMachine $serialStateMachine
    ) {}

    /**
     * Post opening stock voucher: creates opening stock movements and balances.
     */
    public function post(OpeningStock $openingStock): OpeningStock
    {
        return DB::transaction(function () use ($openingStock) {
            $locked = OpeningStock::where('id', $openingStock->id)->lockForUpdate()->firstOrFail();

            if ($locked->status !== 'draft') {
                throw new RuntimeException("Cannot post opening stock with status '{$locked->status}'. Must be draft.");
            }

            $locked->load('lines.product');

            if ($locked->lines->isEmpty()) {
                throw new InvalidArgumentException('Opening stock must contain at least one line.');
            }

            foreach ($locked->lines as $line) {
                $product = $line->product;
                $cost = (float) $line->unit_cost;
                $qty = (float) $line->quantity;

                if ($product->tracking_type === 'serial') {
                    if (!$line->serial_id) {
                        throw new InvalidArgumentException("Serial ID required for line {$line->id}.");
                    }

                    $this->stockService->recordIn(
                        productId: $line->product_id,
                        variationId: $line->variation_id,
                        warehouseId: $line->warehouse_id,
                        quantity: 1,
                        unitCost: $cost,
                        movementType: 'opening_balance',
                        referenceType: 'OpeningStock',
                        referenceId: $locked->id,
                        serialId: $line->serial_id,
                        fiscalYearId: $locked->fiscal_year_id,
                        createdBy: Auth::id(),
                        notes: "Opening Stock #{$locked->id}"
                    );
                } else {
                    $this->stockService->recordIn(
                        productId: $line->product_id,
                        variationId: $line->variation_id,
                        warehouseId: $line->warehouse_id,
                        quantity: $qty,
                        unitCost: $cost,
                        movementType: 'opening_balance',
                        referenceType: 'OpeningStock',
                        referenceId: $locked->id,
                        serialId: null,
                        fiscalYearId: $locked->fiscal_year_id,
                        createdBy: Auth::id(),
                        notes: "Opening Stock #{$locked->id}"
                    );
                }
            }

            $locked->status = 'posted';
            $locked->save();

            return $locked;
        });
    }
}
