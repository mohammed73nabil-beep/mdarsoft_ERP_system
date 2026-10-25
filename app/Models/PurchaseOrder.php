<?php

namespace App\Models;

use App\Traits\BelongsToBranch;
use App\Traits\ValidatesFiscalYear;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class PurchaseOrder extends Model
{
    use HasFactory, SoftDeletes, BelongsToBranch, ValidatesFiscalYear;

    protected static function booted(): void
    {
        static::creating(function (PurchaseOrder $order) {
            if ($order->subtotal === null) {
                $order->subtotal = $order->total_amount ?? 0;
            }
            if ($order->total_amount === null) {
                $order->total_amount = $order->subtotal ?? 0;
            }
        });
    }

    protected $fillable = [
        'order_number',
        'date',
        'fiscal_year_id',
        'contact_id',
        'branch_id',
        'warehouse_id',
        'user_id',
        'subtotal',
        'discount_amount',
        'tax_amount',
        'shipping_amount',
        'total_amount',
        'paid_amount',
        'payment_status',
        'status',
        'notes',
    ];

    protected $casts = [
        'date' => 'date',
        'subtotal' => 'decimal:4',
        'discount_amount' => 'decimal:4',
        'tax_amount' => 'decimal:4',
        'shipping_amount' => 'decimal:4',
        'total_amount' => 'decimal:4',
        'paid_amount' => 'decimal:4',
    ];

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function fiscalYear(): BelongsTo
    {
        return $this->belongsTo(FiscalYear::class);
    }

    public function lines(): HasMany
    {
        return $this->hasMany(PurchaseOrderLine::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(PurchasePayment::class);
    }

    public function returns(): HasMany
    {
        return $this->hasMany(PurchaseReturn::class, 'original_purchase_id');
    }
}
