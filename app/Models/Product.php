<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'type',
        'name',
        'sku',
        'barcode',
        'category_id',
        'brand_id',
        'unit_id',
        'purchase_unit_id',
        'warranty_id',
        'tracking_type',
        'has_expiry',
        'cost_price',
        'selling_price',
        'min_selling_price',
        'reorder_level',
        'tax_id',
        'income_account_id',
        'cogs_account_id',
        'inventory_account_id',
        'description',
        'image',
        'is_active',
    ];

    protected $casts = [
        'has_expiry' => 'boolean',
        'is_active' => 'boolean',
        'cost_price' => 'decimal:4',
        'selling_price' => 'decimal:4',
        'min_selling_price' => 'decimal:4',
        'reorder_level' => 'decimal:4',
    ];

    public function isSingle(): bool
    {
        return $this->type === 'single';
    }

    public function isVariable(): bool
    {
        return $this->type === 'variable';
    }

    public function isService(): bool
    {
        return $this->type === 'service';
    }

    public function tracksSerial(): bool
    {
        return $this->tracking_type === 'serial';
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(ProductCategory::class, 'category_id');
    }

    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class, 'brand_id');
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class, 'unit_id');
    }

    public function purchaseUnit(): BelongsTo
    {
        return $this->belongsTo(Unit::class, 'purchase_unit_id');
    }

    public function warranty(): BelongsTo
    {
        return $this->belongsTo(Warranty::class, 'warranty_id');
    }

    public function tax(): BelongsTo
    {
        return $this->belongsTo(Tax::class, 'tax_id');
    }

    public function incomeAccount(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'income_account_id');
    }

    public function cogsAccount(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'cogs_account_id');
    }

    public function inventoryAccount(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'inventory_account_id');
    }

    public function variations(): HasMany
    {
        return $this->hasMany(ProductVariation::class, 'product_id');
    }

    public function serials(): HasMany
    {
        return $this->hasMany(ProductSerial::class, 'product_id');
    }

    public function priceGroupPrices(): HasMany
    {
        return $this->hasMany(ProductPriceGroupPrice::class, 'product_id');
    }

    public function stockBalances(): HasMany
    {
        return $this->hasMany(StockBalance::class, 'product_id');
    }

    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class, 'product_id');
    }
}
