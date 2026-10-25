<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DamagedStockLine extends Model
{
    use HasFactory;

    protected $fillable = [
        'damaged_stock_id',
        'product_id',
        'variation_id',
        'serial_id',
        'quantity',
        'unit_cost',
        'total_cost',
        'notes',
    ];

    protected $casts = [
        'quantity' => 'decimal:4',
        'unit_cost' => 'decimal:4',
        'total_cost' => 'decimal:4',
    ];

    public function damagedStock(): BelongsTo
    {
        return $this->belongsTo(DamagedStock::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function variation(): BelongsTo
    {
        return $this->belongsTo(ProductVariation::class);
    }

    public function serial(): BelongsTo
    {
        return $this->belongsTo(ProductSerial::class);
    }
}
