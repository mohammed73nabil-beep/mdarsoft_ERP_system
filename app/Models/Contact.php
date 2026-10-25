<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Contact extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'type',
        'name',
        'code',
        'phone',
        'phone_alt',
        'email',
        'address',
        'tax_number',
        'contact_group_id',
        'representative_id',
        'selling_price_group_id',
        'credit_limit',
        'opening_balance',
        'opening_balance_type',
        'is_active',
        'notes',
    ];

    protected $casts = [
        'credit_limit' => 'decimal:4',
        'opening_balance' => 'decimal:4',
        'is_active' => 'boolean',
    ];

    public function group(): BelongsTo
    {
        return $this->belongsTo(ContactGroup::class, 'contact_group_id');
    }

    public function representative(): BelongsTo
    {
        return $this->belongsTo(Representative::class);
    }

    public function sellingPriceGroup(): BelongsTo
    {
        return $this->belongsTo(SellingPriceGroup::class);
    }

    public function ledgerEntries(): HasMany
    {
        return $this->hasMany(ContactLedgerEntry::class);
    }

    public function purchaseOrders(): HasMany
    {
        return $this->hasMany(PurchaseOrder::class);
    }

    public function purchaseReturns(): HasMany
    {
        return $this->hasMany(PurchaseReturn::class);
    }

    public function isCustomer(): bool
    {
        return in_array($this->type, ['customer', 'both'], true);
    }

    public function isSupplier(): bool
    {
        return in_array($this->type, ['supplier', 'both'], true);
    }

    /**
     * Net balance in sub-ledger.
     * Customers: positive = receivable (owe us).
     * Suppliers: positive = payable (we owe them).
     */
    public function getBalanceAttribute(): float
    {
        $sumDebit = (float) $this->ledgerEntries()->sum('debit');
        $sumCredit = (float) $this->ledgerEntries()->sum('credit');

        if ($this->type === 'customer') {
            return $sumDebit - $sumCredit;
        }

        if ($this->type === 'supplier') {
            return $sumCredit - $sumDebit;
        }

        // Both: net receivable / payable
        return $sumDebit - $sumCredit;
    }
}
