<?php

namespace App\Services;

use App\Models\InventoryTransfer;
use App\Models\StockBalance;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;
use RuntimeException;

class InventoryTransferService
{
    public function __construct(
        protected StockService $stockService,
        protected SerialStateMachine $serialStateMachine
    ) {}

    /**
     * Send inventory transfer: Deducts from source warehouse at source average cost (ADR-25).
     * Serial products transition from in_stock to transferred.
     */
    public function send(InventoryTransfer $transfer): InventoryTransfer
    {
        return DB::transaction(function () use ($transfer) {
            $lockedTransfer = InventoryTransfer::where('id', $transfer->id)->lockForUpdate()->firstOrFail();

            if ($lockedTransfer->status !== 'draft') {
                throw new RuntimeException("Cannot send transfer with status '{$lockedTransfer->status}'. Must be draft.");
            }

            $lockedTransfer->load('lines.product');

            if ($lockedTransfer->lines->isEmpty()) {
                throw new InvalidArgumentException('Transfer must contain at least one line.');
            }

            foreach ($lockedTransfer->lines as $line) {
                $product = $line->product;

                // Determine unit cost from source warehouse average cost (ADR-25)
                $sourceBalance = StockBalance::where('product_id', $line->product_id)
                    ->where('warehouse_id', $lockedTransfer->from_warehouse_id)
                    ->where(function ($q) use ($line) {
                        if ($line->variation_id === null) {
                            $q->whereNull('variation_id');
                        } else {
                            $q->where('variation_id', $line->variation_id);
                        }
                    })
                    ->first();

                $unitCost = $sourceBalance ? (float) $sourceBalance->avg_cost : 0.0;
                $line->unit_cost = $unitCost;
                $line->save();

                if ($product->tracking_type === 'serial') {
                    if (!$line->serial_id) {
                        throw new InvalidArgumentException("Serial ID is required for line product {$product->id}.");
                    }

                    // Transition serial to 'transferred'
                    $this->serialStateMachine->transition(
                        $line->serial_id,
                        'transferred',
                        [
                            'reference_type' => 'InventoryTransfer',
                            'reference_id' => $lockedTransfer->id,
                            'to_warehouse_id' => $lockedTransfer->to_warehouse_id,
                            'unit_cost' => $unitCost,
                            'notes' => "Transfer {$lockedTransfer->transfer_number} sent",
                        ]
                    );

                    // Record single serial out movement
                    $this->stockService->recordOut(
                        productId: $line->product_id,
                        variationId: $line->variation_id,
                        warehouseId: $lockedTransfer->from_warehouse_id,
                        quantity: 1,
                        unitCost: $unitCost,
                        movementType: 'transfer_out',
                        referenceType: 'InventoryTransfer',
                        referenceId: $lockedTransfer->id,
                        serialId: $line->serial_id,
                        fiscalYearId: $lockedTransfer->fiscal_year_id,
                        createdBy: Auth::id(),
                        notes: "Transfer #{$lockedTransfer->transfer_number} sent"
                    );
                } else {
                    // Non-serial product
                    $this->stockService->recordOut(
                        productId: $line->product_id,
                        variationId: $line->variation_id,
                        warehouseId: $lockedTransfer->from_warehouse_id,
                        quantity: $line->quantity,
                        unitCost: $unitCost,
                        movementType: 'transfer_out',
                        referenceType: 'InventoryTransfer',
                        referenceId: $lockedTransfer->id,
                        serialId: null,
                        fiscalYearId: $lockedTransfer->fiscal_year_id,
                        createdBy: Auth::id(),
                        notes: "Transfer #{$lockedTransfer->transfer_number} sent"
                    );
                }
            }

            $lockedTransfer->status = 'sent';
            $lockedTransfer->save();

            return $lockedTransfer;
        });
    }

    /**
     * Receive inventory transfer: Adds to destination warehouse using sender's unit_cost (ADR-25).
     * Serial products transition from transferred to in_stock at destination warehouse.
     */
    public function receive(InventoryTransfer $transfer, ?int $receivedBy = null): InventoryTransfer
    {
        return DB::transaction(function () use ($transfer, $receivedBy) {
            $lockedTransfer = InventoryTransfer::where('id', $transfer->id)->lockForUpdate()->firstOrFail();

            if ($lockedTransfer->status !== 'sent') {
                throw new RuntimeException("Cannot receive transfer with status '{$lockedTransfer->status}'. Must be sent.");
            }

            $lockedTransfer->load('lines.product');

            foreach ($lockedTransfer->lines as $line) {
                $product = $line->product;
                $cost = (float) $line->unit_cost;

                if ($product->tracking_type === 'serial') {
                    if (!$line->serial_id) {
                        throw new InvalidArgumentException("Serial ID is required for line product {$product->id}.");
                    }

                    // Transition serial to 'in_stock' at destination warehouse
                    $this->serialStateMachine->transition(
                        $line->serial_id,
                        'in_stock',
                        [
                            'reference_type' => 'InventoryTransfer',
                            'reference_id' => $lockedTransfer->id,
                            'to_warehouse_id' => $lockedTransfer->to_warehouse_id,
                            'unit_cost' => $cost,
                            'notes' => "Transfer {$lockedTransfer->transfer_number} received",
                        ]
                    );

                    // Record single serial in movement
                    $this->stockService->recordIn(
                        productId: $line->product_id,
                        variationId: $line->variation_id,
                        warehouseId: $lockedTransfer->to_warehouse_id,
                        quantity: 1,
                        unitCost: $cost,
                        movementType: 'transfer_in',
                        referenceType: 'InventoryTransfer',
                        referenceId: $lockedTransfer->id,
                        serialId: $line->serial_id,
                        fiscalYearId: $lockedTransfer->fiscal_year_id,
                        createdBy: $receivedBy ?? Auth::id(),
                        notes: "Transfer #{$lockedTransfer->transfer_number} received"
                    );
                } else {
                    // Non-serial product
                    $this->stockService->recordIn(
                        productId: $line->product_id,
                        variationId: $line->variation_id,
                        warehouseId: $lockedTransfer->to_warehouse_id,
                        quantity: $line->quantity,
                        unitCost: $cost,
                        movementType: 'transfer_in',
                        referenceType: 'InventoryTransfer',
                        referenceId: $lockedTransfer->id,
                        serialId: null,
                        fiscalYearId: $lockedTransfer->fiscal_year_id,
                        createdBy: $receivedBy ?? Auth::id(),
                        notes: "Transfer #{$lockedTransfer->transfer_number} received"
                    );
                }
            }

            $lockedTransfer->status = 'received';
            $lockedTransfer->received_by = $receivedBy ?? Auth::id();
            $lockedTransfer->save();

            return $lockedTransfer;
        });
    }
}
