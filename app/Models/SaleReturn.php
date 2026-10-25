<?php

namespace App\Models;

use App\Traits\BelongsToBranch;
use App\Traits\ValidatesFiscalYear;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SaleReturn extends Model
{
    use HasFactory, BelongsToBranch, ValidatesFiscalYear;

    protected $fillable = [
        'return_number',
        'date',
        'fiscal_year_id',
        'original_sale_id',
        'contact_id',
        'branch_id',
        'warehouse_id',
        'user_id',
        'total_amount',
        'tax_amount',
        'status',
        'refund_method',
        'notes',
    ];

    protected $casts = [
        'date' => 'date',
        'total_amount' => 'decimal:4',
        'tax_amount' => 'decimal:4',
    ];

    public function originalSale(): BelongsTo
    {
        return $this->belongsTo(SaleOrder::class, 'original_sale_id');
    }

    public function fiscalYear(): BelongsTo
    {
        return $this->belongsTo(FiscalYear::class);
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

    public function lines(): HasMany
    {
        return $this->hasMany(SaleReturnLine::class);
    }
}
