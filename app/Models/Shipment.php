<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Shipment extends Model
{
    use HasFactory;

    protected $fillable = [
        'sale_order_id',
        'shipping_company_id',
        'tracking_number',
        'shipped_at',
        'delivered_at',
        'shipping_cost',
        'status',
        'notes',
    ];

    protected $casts = [
        'shipping_cost' => 'decimal:4',
        'shipped_at' => 'datetime',
        'delivered_at' => 'datetime',
    ];

    public function saleOrder(): BelongsTo
    {
        return $this->belongsTo(SaleOrder::class);
    }

    public function shippingCompany(): BelongsTo
    {
        return $this->belongsTo(ShippingCompany::class);
    }
}
