<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SaleReturnLineSerial extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'sale_return_line_id',
        'serial_id',
        'cost_price',
        'created_at',
    ];

    protected $casts = [
        'cost_price' => 'decimal:4',
        'created_at' => 'datetime',
    ];

    public function saleReturnLine(): BelongsTo
    {
        return $this->belongsTo(SaleReturnLine::class);
    }

    public function serial(): BelongsTo
    {
        return $this->belongsTo(ProductSerial::class, 'serial_id');
    }
}
