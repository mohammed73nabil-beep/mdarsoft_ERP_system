<?php

namespace Database\Factories;

use App\Models\ProductCategory;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProductCategoryFactory extends Factory
{
    protected $model = ProductCategory::class;

    public function definition(): array
    {
        return [
            'parent_id' => null,
            'name' => fake()->unique()->word() . ' Category',
            'code' => 'CAT-' . fake()->unique()->numerify('####'),
            'is_active' => true,
        ];
    }
}
