<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use RuntimeException;

class StockMovement extends Model
{
    use HasFactory;

    public const UPDATED_AT = null;

    protected $fillable = [
        'product_id',
        'variation_id',
        'warehouse_id',
        'type',
        'direction',
        'quantity',
        'unit_cost',
        'avg_cost_before',
        'avg_cost_after',
        'reference_type',
        'reference_id',
        'serial_id',
        'fiscal_year_id',
        'created_by',
    ];

    protected $casts = [
        'quantity' => 'decimal:4',
        'unit_cost' => 'decimal:4',
        'avg_cost_before' => 'decimal:4',
        'avg_cost_after' => 'decimal:4',
    ];

    /**
     * Signed quantity change (+ for in, - for out).
     */
    public function getQuantityChangeAttribute(): float
    {
        $qty = (float) ($this->attributes['quantity'] ?? 0);
        return ($this->attributes['direction'] ?? 'in') === 'in' ? $qty : -$qty;
    }

    public function getMovementTypeAttribute(): string
    {
        return $this->attributes['type'] ?? '';
    }

    protected static function booted(): void
    {
        static::updating(function () {
            throw new RuntimeException('Stock movements are immutable and cannot be updated.');
        });

        static::deleting(function () {
            throw new RuntimeException('Stock movements are immutable and cannot be deleted.');
        });
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function variation(): BelongsTo
    {
        return $this->belongsTo(ProductVariation::class);
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function serial(): BelongsTo
    {
        return $this->belongsTo(ProductSerial::class);
    }

    public function fiscalYear(): BelongsTo
    {
        return $this->belongsTo(FiscalYear::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
