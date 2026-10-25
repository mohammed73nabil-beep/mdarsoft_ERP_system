<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockBalance extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'product_id',
        'variation_id',
        'warehouse_id',
        'quantity',
        'avg_cost',
        'updated_at',
    ];

    protected $casts = [
        'quantity' => 'decimal:4',
        'avg_cost' => 'decimal:4',
        'updated_at' => 'datetime',
    ];

    /**
     * Alias current_balance to quantity for semantic convenience.
     */
    public function getCurrentBalanceAttribute(): float
    {
        return (float) ($this->attributes['quantity'] ?? 0);
    }

    public function setCurrentBalanceAttribute($value): void
    {
        $this->attributes['quantity'] = $value;
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function variation(): BelongsTo
    {
        return $this->belongsTo(ProductVariation::class, 'variation_id');
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'warehouse_id');
    }
}
