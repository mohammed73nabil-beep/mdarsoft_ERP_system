<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use InvalidArgumentException;

class ProductCategory extends Model
{
    use HasFactory;

    protected $fillable = [
        'parent_id',
        'name',
        'code',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::saving(function (ProductCategory $category) {
            if ($category->parent_id && $category->id && $category->parent_id == $category->id) {
                throw new InvalidArgumentException('A category cannot be its own parent.');
            }

            if ($category->id && $category->parent_id) {
                $parent = static::find($category->parent_id);
                while ($parent) {
                    if ($parent->id == $category->id) {
                        throw new InvalidArgumentException('Circular loop detected in category hierarchy.');
                    }
                    $parent = $parent->parent;
                }
            }
        });
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(ProductCategory::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(ProductCategory::class, 'parent_id');
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class, 'category_id');
    }
}
