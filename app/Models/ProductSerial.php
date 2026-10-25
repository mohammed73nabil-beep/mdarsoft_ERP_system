<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProductSerial extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'variation_id',
        'serial_number',
        'imei1',
        'imei2',
        'status',
        'warehouse_id',
        'cost_price',
        'notes',
    ];

    protected $casts = [
        'cost_price' => 'decimal:4',
    ];

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

    public function events(): HasMany
    {
        return $this->hasMany(SerialEvent::class, 'serial_id');
    }
}
