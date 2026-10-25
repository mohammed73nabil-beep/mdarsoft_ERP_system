<?php

namespace Database\Factories;

use App\Models\Representative;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Representative>
 */
class RepresentativeFactory extends Factory
{
    protected $model = Representative::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'name' => fake()->name(),
            'phone' => fake()->phoneNumber(),
            'commission_rate' => fake()->randomFloat(2, 0, 15),
            'is_active' => true,
        ];
    }
}
