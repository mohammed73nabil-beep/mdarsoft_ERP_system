<?php

namespace Database\Factories;

use App\Models\Brand;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\Unit;
use App\Models\Warranty;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProductFactory extends Factory
{
    protected $model = Product::class;

    public function definition(): array
    {
        return [
            'type' => 'single',
            'name' => fake()->words(3, true) . ' ' . fake()->unique()->numerify('###'),
            'sku' => 'SKU-' . fake()->unique()->numerify('#####'),
            'barcode' => fake()->unique()->ean13(),
            'category_id' => ProductCategory::factory(),
            'brand_id' => Brand::factory(),
            'unit_id' => Unit::factory(),
            'purchase_unit_id' => null,
            'warranty_id' => Warranty::factory(),
            'tracking_type' => 'none',
            'has_expiry' => false,
            'cost_price' => fake()->randomFloat(4, 10, 500),
            'selling_price' => fake()->randomFloat(4, 50, 1000),
            'min_selling_price' => fake()->randomFloat(4, 30, 800),
            'reorder_level' => 5.0000,
            'tax_id' => null,
            'income_account_id' => null,
            'cogs_account_id' => null,
            'inventory_account_id' => null,
            'description' => fake()->paragraph(),
            'image' => null,
            'is_active' => true,
        ];
    }

    public function serial(): static
    {
        return $this->state(fn () => [
            'tracking_type' => 'serial',
        ]);
    }

    public function variable(): static
    {
        return $this->state(fn () => [
            'type' => 'variable',
        ]);
    }
}
