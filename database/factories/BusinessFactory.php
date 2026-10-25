<?php

namespace Database\Factories;

use App\Models\Business;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Business>
 */
class BusinessFactory extends Factory
{
    protected $model = Business::class;

    public function definition(): array
    {
        return [
            'name' => fake()->company(),
            'name_en' => fake()->company(),
            'logo' => null,
            'address' => fake()->address(),
            'phone' => fake()->phoneNumber(),
            'email' => fake()->companyEmail(),
            'tax_number' => '3' . fake()->numerify('##############'),
            'commercial_register' => fake()->numerify('1010######'),
            'decimal_places' => 2,
        ];
    }
}
