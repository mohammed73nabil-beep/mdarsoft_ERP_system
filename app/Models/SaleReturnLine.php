<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SaleReturnLine extends Model
{
    use HasFactory;

    protected $fillable = [
        'sale_return_id',
        'original_line_id',
        'product_id',
        'variation_id',
        'quantity',
        'unit_id',
        'unit_price',
        'return_cost_price',
        'tax_amount',
        'total_amount',
    ];

    protected $casts = [
        'quantity' => 'decimal:4',
        'unit_price' => 'decimal:4',
        'return_cost_price' => 'decimal:4',
        'tax_amount' => 'decimal:4',
        'total_amount' => 'decimal:4',
    ];

    public function saleReturn(): BelongsTo
    {
        return $this->belongsTo(SaleReturn::class);
    }

    public function originalLine(): BelongsTo
    {
        return $this->belongsTo(SaleOrderLine::class, 'original_line_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function variation(): BelongsTo
    {
        return $this->belongsTo(ProductVariation::class);
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }

    public function lineSerials(): HasMany
    {
        return $this->hasMany(SaleReturnLineSerial::class);
    }

    public function serials(): HasMany
    {
        return $this->lineSerials();
    }
}
