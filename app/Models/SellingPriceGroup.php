<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SellingPriceGroup extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];
    public function productPrices(): HasMany
    {
        return $this->hasMany(ProductPriceGroupPrice::class, 'selling_price_group_id');
    }

    public function contacts(): HasMany
    {
        return $this->hasMany(Contact::class, 'selling_price_group_id');
    }

    public function contactGroups(): HasMany
    {
        return $this->hasMany(ContactGroup::class, 'selling_price_group_id');
    }
}
