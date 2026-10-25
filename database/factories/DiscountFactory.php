<?php

namespace Database\Factories;

use App\Models\Discount;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Discount>
 */
class DiscountFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name'       => fake()->word() . ' Discount',
            'type'       => 'percentage',
            'value'      => 10.0000,
            'applies_to' => 'all',
            'target_id'  => null,
            'start_date' => null,
            'end_date'   => null,
            'min_amount' => 0,
            'is_active'  => true,
        ];
    }
}
