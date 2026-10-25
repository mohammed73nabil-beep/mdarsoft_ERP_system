<?php

namespace App\Services;

use App\Exceptions\InvalidSerialStatusException;
use App\Models\ProductSerial;
use App\Models\SerialEvent;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class SerialStateMachine
{
    public const ALLOWED_TRANSITIONS = [
        'in_stock'             => ['sold', 'damaged', 'transferred', 'returned_to_supplier'],
        'sold'                 => ['returned'],
        'returned'             => ['in_stock', 'returned_to_supplier'],
        'transferred'          => ['in_stock'],
        'damaged'              => ['in_stock'],
        'returned_to_supplier' => [],
    ];

    /**
     * Transition a serial to a new status inside a database transaction with lockForUpdate.
     * Automatically logs a serial_event.
     *
     * @throws InvalidSerialStatusException
     */
    public function transition(ProductSerial|int $serial, string $toStatus, array $context = []): ProductSerial
    {
        $serialId = $serial instanceof ProductSerial ? $serial->id : $serial;

        return DB::transaction(function () use ($serialId, $toStatus, $context) {
            /** @var ProductSerial $lockedSerial */
            $lockedSerial = ProductSerial::where('id', $serialId)->lockForUpdate()->firstOrFail();
            $fromStatus = $lockedSerial->status;

            if ($fromStatus === $toStatus) {
                return $lockedSerial;
            }

            $allowed = self::ALLOWED_TRANSITIONS[$fromStatus] ?? [];

            if (!in_array($toStatus, $allowed, true)) {
                throw new InvalidSerialStatusException(
                    "Invalid serial transition from '{$fromStatus}' to '{$toStatus}'. Allowed: [" . implode(', ', $allowed) . "]."
                );
            }

            // Check specific permission for accepting customer return into stock
            if ($fromStatus === 'returned' && $toStatus === 'in_stock') {
                if (Auth::check() && !Auth::user()->can('serials.accept_return')) {
                    throw new InvalidSerialStatusException(
                        "User does not have permission 'serials.accept_return' to accept returned serial into warehouse stock."
                    );
                }
            }

            // Check damage rehabilitation condition
            if ($fromStatus === 'damaged' && $toStatus === 'in_stock') {
                $eventType = $context['event_type'] ?? null;
                if ($eventType !== 'adjusted' && empty($context['is_approved_adjustment'])) {
                    throw new InvalidSerialStatusException(
                        "Rehabilitating damaged serial to in_stock requires an approved adjustment voucher (event_type: adjusted)."
                    );
                }
            }

            $fromWarehouseId = $lockedSerial->warehouse_id;
            $toWarehouseId = $context['to_warehouse_id'] ?? $context['warehouse_id'] ?? $fromWarehouseId;

            // Apply updates to serial:
            // Rule: Sold serial preserves its last warehouse_id (do not set to null)
            $lockedSerial->status = $toStatus;
            if ($toStatus === 'in_stock' && isset($context['to_warehouse_id'])) {
                $lockedSerial->warehouse_id = $context['to_warehouse_id'];
            } elseif (isset($context['warehouse_id'])) {
                $lockedSerial->warehouse_id = $context['warehouse_id'];
            }

            if (isset($context['notes'])) {
                $lockedSerial->notes = $context['notes'];
            }

            $lockedSerial->save();

            // Default event_type based on toStatus if not explicitly provided
            $eventType = $context['event_type'] ?? match ($toStatus) {
                'sold' => 'sold',
                'returned' => 'returned',
                'transferred' => 'transferred',
                'damaged' => 'damaged',
                'returned_to_supplier' => 'returned_to_supplier',
                'in_stock' => ($fromStatus === 'transferred' ? 'transferred' : ($fromStatus === 'damaged' ? 'adjusted' : 'returned')),
                default => 'adjusted',
            };

            // Write serial_events record automatically
            SerialEvent::create([
                'serial_id' => $lockedSerial->id,
                'event_type' => $eventType,
                'from_warehouse_id' => $fromWarehouseId,
                'to_warehouse_id' => $toWarehouseId,
                'from_status' => $fromStatus,
                'to_status' => $toStatus,
                'reference_type' => $context['reference_type'] ?? null,
                'reference_id' => $context['reference_id'] ?? null,
                'unit_cost' => $context['unit_cost'] ?? $lockedSerial->cost_price,
                'unit_price' => $context['unit_price'] ?? null,
                'notes' => $context['notes'] ?? null,
                'created_by' => $context['created_by'] ?? Auth::id(),
                'created_at' => now(),
            ]);

            return $lockedSerial;
        });
    }
}
