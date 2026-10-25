<?php

namespace Database\Factories;

use App\Models\ShippingCompany;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ShippingCompany>
 */
class ShippingCompanyFactory extends Factory
{
    protected $model = ShippingCompany::class;

    public function definition(): array
    {
        return [
            'name' => fake()->company() . ' Logistics',
            'phone' => fake()->phoneNumber(),
            'is_active' => true,
        ];
    }
}
