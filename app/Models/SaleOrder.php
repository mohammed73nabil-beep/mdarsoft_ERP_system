<?php

namespace App\Models;

use App\Traits\BelongsToBranch;
use App\Traits\ValidatesFiscalYear;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class SaleOrder extends Model
{
    use HasFactory, SoftDeletes, BelongsToBranch, ValidatesFiscalYear;

    protected static function booted(): void
    {
        static::creating(function (SaleOrder $order) {
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
        'pos_session_id',
        'contact_id',
        'branch_id',
        'warehouse_id',
        'user_id',
        'representative_id',
        'shipping_company_id',
        'discount_id',
        'subtotal',
        'discount_type',
        'discount_value',
        'discount_amount',
        'tax_amount',
        'shipping_amount',
        'total_amount',
        'paid_amount',
        'payment_status',
        'status',
        'source_draft_id',
        'source_quotation_id',
        'zatca_uuid',
        'invoice_hash',
        'qr_code',
        'zatca_status',
        'zatca_submitted_at',
        'notes',
    ];

    protected $casts = [
        'date' => 'date',
        'subtotal' => 'decimal:4',
        'discount_value' => 'decimal:4',
        'discount_amount' => 'decimal:4',
        'tax_amount' => 'decimal:4',
        'shipping_amount' => 'decimal:4',
        'total_amount' => 'decimal:4',
        'paid_amount' => 'decimal:4',
        'zatca_submitted_at' => 'datetime',
    ];

    public function fiscalYear(): BelongsTo
    {
        return $this->belongsTo(FiscalYear::class);
    }

    public function posSession(): BelongsTo
    {
        return $this->belongsTo(PosSession::class);
    }

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

    public function representative(): BelongsTo
    {
        return $this->belongsTo(Representative::class);
    }

    public function shippingCompany(): BelongsTo
    {
        return $this->belongsTo(ShippingCompany::class);
    }

    public function discount(): BelongsTo
    {
        return $this->belongsTo(Discount::class);
    }

    public function sourceDraft(): BelongsTo
    {
        return $this->belongsTo(SaleDraft::class, 'source_draft_id');
    }

    public function sourceQuotation(): BelongsTo
    {
        return $this->belongsTo(Quotation::class, 'source_quotation_id');
    }

    public function lines(): HasMany
    {
        return $this->hasMany(SaleOrderLine::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(SalePayment::class);
    }

    public function returns(): HasMany
    {
        return $this->hasMany(SaleReturn::class, 'original_sale_id');
    }

    public function shipments(): HasMany
    {
        return $this->hasMany(Shipment::class);
    }
}
