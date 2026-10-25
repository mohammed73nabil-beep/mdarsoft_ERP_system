<?php

namespace Database\Factories;

use App\Models\SellingPriceGroup;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SellingPriceGroup>
 */
class SellingPriceGroupFactory extends Factory
{
    protected $model = SellingPriceGroup::class;

    public function definition(): array
    {
        return [
            'name' => fake()->word() . ' Price Group',
            'description' => fake()->sentence(),
            'is_active' => true,
        ];
    }
}
