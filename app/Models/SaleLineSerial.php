<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SaleLineSerial extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'sale_order_line_id',
        'serial_id',
        'cost_price',
        'created_at',
    ];

    protected $casts = [
        'cost_price' => 'decimal:4',
        'created_at' => 'datetime',
    ];

    public function saleOrderLine(): BelongsTo
    {
        return $this->belongsTo(SaleOrderLine::class);
    }

    public function serial(): BelongsTo
    {
        return $this->belongsTo(ProductSerial::class, 'serial_id');
    }
}
