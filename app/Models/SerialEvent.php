<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use RuntimeException;

class SerialEvent extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'serial_id',
        'event_type',
        'from_warehouse_id',
        'to_warehouse_id',
        'from_status',
        'to_status',
        'reference_type',
        'reference_id',
        'unit_cost',
        'unit_price',
        'notes',
        'created_by',
        'created_at',
    ];

    protected $casts = [
        'unit_cost' => 'decimal:4',
        'unit_price' => 'decimal:4',
        'created_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (SerialEvent $event) {
            if (!$event->created_at) {
                $event->created_at = now();
            }
        });

        static::updating(function () {
            throw new RuntimeException('Serial events are immutable and cannot be updated.');
        });

        static::deleting(function () {
            throw new RuntimeException('Serial events are immutable and cannot be deleted.');
        });
    }

    public function serial(): BelongsTo
    {
        return $this->belongsTo(ProductSerial::class, 'serial_id');
    }

    public function fromWarehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'from_warehouse_id');
    }

    public function toWarehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'to_warehouse_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
