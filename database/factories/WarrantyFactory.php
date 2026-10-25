<?php

namespace Database\Factories;

use App\Models\Warranty;
use Illuminate\Database\Eloquent\Factories\Factory;

class WarrantyFactory extends Factory
{
    protected $model = Warranty::class;

    public function definition(): array
    {
        return [
            'name' => fake()->unique()->word() . ' Warranty',
            'duration_months' => fake()->randomElement([6, 12, 24]),
            'description' => fake()->sentence(),
            'is_active' => true,
        ];
    }
}
