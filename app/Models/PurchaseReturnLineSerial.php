<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PurchaseReturnLineSerial extends Model
{
    use HasFactory;

    protected $fillable = [
        'purchase_return_line_id',
        'serial_id',
        'cost_price',
    ];

    protected $casts = [
        'cost_price' => 'decimal:4',
    ];

    public function returnLine(): BelongsTo
    {
        return $this->belongsTo(PurchaseReturnLine::class, 'purchase_return_line_id');
    }

    public function serial(): BelongsTo
    {
        return $this->belongsTo(ProductSerial::class, 'serial_id');
    }
}
