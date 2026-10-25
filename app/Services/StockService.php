<?php

namespace App\Services;

use App\Exceptions\InsufficientStockException;
use App\Models\FiscalYear;
use App\Models\Product;
use App\Models\StockBalance;
use App\Models\StockMovement;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class StockService
{
    /**
     * Record an incoming stock movement and update stock balances atomically.
     */
    public function recordIn(
        int $productId,
        ?int $variationId,
        int $warehouseId,
        float|string $quantity,
        float|string $unitCost,
        string $movementType,
        ?string $referenceType = null,
        ?int $referenceId = null,
        ?int $serialId = null,
        ?string $batchNumber = null,
        ?int $fiscalYearId = null,
        ?int $createdBy = null,
        ?string $notes = null
    ): StockMovement {
        return DB::transaction(function () use (
            $productId,
            $variationId,
            $warehouseId,
            $quantity,
            $unitCost,
            $movementType,
            $referenceType,
            $referenceId,
            $serialId,
            $batchNumber,
            $fiscalYearId,
            $createdBy,
            $notes
        ) {
            $product = Product::findOrFail($productId);
            $qty = (float) $quantity;
            $cost = (float) $unitCost;

            if ($product->tracking_type === 'serial') {
                if ($serialId === null) {
                    throw new InvalidArgumentException('Serial ID is required for serial tracked products.');
                }
                if ($qty != 1.0) {
                    throw new InvalidArgumentException('Quantity must be exactly 1 for serial movements.');
                }
            } else {
                if ($qty <= 0) {
                    throw new InvalidArgumentException('Quantity must be greater than zero.');
                }
            }

            $fiscalYearId = $fiscalYearId ?? FiscalYear::where('status', 'open')->first()?->id;
            $createdBy = $createdBy ?? Auth::id();

            $balance = $this->getOrCreateLockedBalance($productId, $variationId, $warehouseId);

            $oldQty = (float) $balance->quantity;
            $oldAvg = (float) $balance->avg_cost;
            $newQty = $oldQty + $qty;

            // Calculate new weighted average cost for tracking_type === 'none'
            if ($product->tracking_type === 'none') {
                if ($oldQty <= 0) {
                    $newAvg = $cost;
                } else {
                    $newAvg = (($oldQty * $oldAvg) + ($qty * $cost)) / $newQty;
                }
                $newAvg = round($newAvg, 4);
            } else {
                if ($oldQty <= 0) {
                    $newAvg = round($cost, 4);
                } else {
                    $newAvg = round((($oldQty * $oldAvg) + ($qty * $cost)) / $newQty, 4);
                }
            }

            $balance->quantity = $newQty;
            $balance->avg_cost = $newAvg;
            $balance->save();

            $type = match ($movementType) {
                'adjust_in', 'adjustment_in' => 'adjustment_in',
                'opening_balance', 'opening_stock' => 'opening_stock',
                'transfer_in' => 'transfer_in',
                'purchase_in' => 'purchase_in',
                'sale_return_in' => 'sale_return_in',
                default => $movementType,
            };

            $movement = StockMovement::create([
                'product_id' => $productId,
                'variation_id' => $variationId,
                'warehouse_id' => $warehouseId,
                'type' => $type,
                'direction' => 'in',
                'quantity' => $qty,
                'unit_cost' => round($cost, 4),
                'avg_cost_before' => round($oldAvg, 4),
                'avg_cost_after' => round($newAvg, 4),
                'reference_type' => $referenceType,
                'reference_id' => $referenceId,
                'serial_id' => $serialId,
                'fiscal_year_id' => $fiscalYearId,
                'created_by' => $createdBy,
            ]);

            $this->dispatchDeferredJournalEntry($movement);

            return $movement;
        });
    }

    /**
     * Record an outgoing stock movement and update stock balances atomically.
     */
    public function recordOut(
        int $productId,
        ?int $variationId,
        int $warehouseId,
        float|string $quantity,
        ?float $unitCost,
        string $movementType,
        ?string $referenceType = null,
        ?int $referenceId = null,
        ?int $serialId = null,
        ?string $batchNumber = null,
        ?int $fiscalYearId = null,
        ?int $createdBy = null,
        ?string $notes = null
    ): StockMovement {
        return DB::transaction(function () use (
            $productId,
            $variationId,
            $warehouseId,
            $quantity,
            $unitCost,
            $movementType,
            $referenceType,
            $referenceId,
            $serialId,
            $batchNumber,
            $fiscalYearId,
            $createdBy,
            $notes
        ) {
            $product = Product::findOrFail($productId);
            $qty = (float) $quantity;

            if ($product->tracking_type === 'serial') {
                if ($serialId === null) {
                    throw new InvalidArgumentException('Serial ID is required for serial tracked products.');
                }
                if ($qty != 1.0) {
                    throw new InvalidArgumentException('Quantity must be exactly 1 for serial movements.');
                }
            } else {
                if ($qty <= 0) {
                    throw new InvalidArgumentException('Quantity must be greater than zero.');
                }
            }

            $balance = $this->getOrCreateLockedBalance($productId, $variationId, $warehouseId);

            $currentBalance = (float) $balance->quantity;
            if ($currentBalance < $qty) {
                throw new InsufficientStockException(
                    "Insufficient stock for product ID {$productId} in warehouse ID {$warehouseId}. Available: {$currentBalance}, Requested: {$qty}"
                );
            }

            $fiscalYearId = $fiscalYearId ?? FiscalYear::where('status', 'open')->first()?->id;
            $createdBy = $createdBy ?? Auth::id();

            // Outgoing cost defaults to current avg_cost
            $cost = $unitCost !== null ? (float) $unitCost : (float) $balance->avg_cost;
            $oldAvg = (float) $balance->avg_cost;

            $newQty = $currentBalance - $qty;
            $balance->quantity = $newQty;
            // Outgoing stock does NOT alter the avg_cost of the remaining stock!
            $balance->save();

            $type = match ($movementType) {
                'adjust_out', 'adjustment_out' => 'adjustment_out',
                'damaged', 'damaged_out' => 'damaged_out',
                'transfer_out' => 'transfer_out',
                'sale_out' => 'sale_out',
                'purchase_return_out' => 'purchase_return_out',
                default => $movementType,
            };

            $movement = StockMovement::create([
                'product_id' => $productId,
                'variation_id' => $variationId,
                'warehouse_id' => $warehouseId,
                'type' => $type,
                'direction' => 'out',
                'quantity' => $qty,
                'unit_cost' => round($cost, 4),
                'avg_cost_before' => round($oldAvg, 4),
                'avg_cost_after' => round($oldAvg, 4), // outgoing leaves avg_cost unchanged
                'reference_type' => $referenceType,
                'reference_id' => $referenceId,
                'serial_id' => $serialId,
                'fiscal_year_id' => $fiscalYearId,
                'created_by' => $createdBy,
            ]);

            $this->dispatchDeferredJournalEntry($movement);

            return $movement;
        });
    }

    /**
     * Find or create stock balance record and lock it for update.
     */
    public function getOrCreateLockedBalance(int $productId, ?int $variationId, int $warehouseId): StockBalance
    {
        $query = fn() => StockBalance::where('product_id', $productId)
            ->where(function ($q) use ($variationId) {
                if ($variationId === null) {
                    $q->whereNull('variation_id');
                } else {
                    $q->where('variation_id', $variationId);
                }
            })
            ->where('warehouse_id', $warehouseId)
            ->lockForUpdate()
            ->first();

        $balance = $query();
        if ($balance) {
            return $balance;
        }

        try {
            StockBalance::create([
                'product_id' => $productId,
                'variation_id' => $variationId,
                'warehouse_id' => $warehouseId,
                'quantity' => 0,
                'avg_cost' => 0,
            ]);
        } catch (\Illuminate\Database\QueryException $e) {
            // Handled race condition: duplicate key error
        }

        return $query();
    }

    /**
     * Deferred journal entry call point (Phase D).
     */
    protected function dispatchDeferredJournalEntry(StockMovement $movement): void
    {
        // Placeholder for Phase D:
        // When accounting module (journal_entries) is implemented, dispatch event here:
        // event(new StockMovementRecordedForAccounting($movement));
    }
}
