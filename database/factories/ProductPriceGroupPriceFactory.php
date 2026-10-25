<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\ProductPriceGroupPrice;
use App\Models\SellingPriceGroup;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProductPriceGroupPriceFactory extends Factory
{
    protected $model = ProductPriceGroupPrice::class;

    public function definition(): array
    {
        return [
            'product_id' => Product::factory(),
            'variation_id' => null,
            'selling_price_group_id' => SellingPriceGroup::factory(),
            'price' => fake()->randomFloat(4, 50, 1000),
        ];
    }
}
