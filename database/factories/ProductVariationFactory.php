<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\ProductVariation;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProductVariationFactory extends Factory
{
    protected $model = ProductVariation::class;

    public function definition(): array
    {
        return [
            'product_id' => Product::factory()->variable(),
            'name' => fake()->randomElement(['128GB Black', '256GB Silver', '512GB Gold']),
            'sku' => 'VAR-' . fake()->unique()->numerify('#####'),
            'barcode' => fake()->unique()->ean13(),
            'cost_price' => fake()->randomFloat(4, 100, 1000),
            'selling_price' => fake()->randomFloat(4, 200, 2000),
            'image' => null,
            'is_active' => true,
        ];
    }
}
