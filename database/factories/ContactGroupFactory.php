<?php

namespace Database\Factories;

use App\Models\ContactGroup;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ContactGroup>
 */
class ContactGroupFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name'             => fake()->words(2, true),
            'type'             => fake()->randomElement(['customer', 'supplier', 'both']),
            'discount_percent' => 0,
            'selling_price_group_id' => null,
        ];
    }

    public function customer(): static
    {
        return $this->state(fn () => ['type' => 'customer']);
    }

    public function supplier(): static
    {
        return $this->state(fn () => ['type' => 'supplier']);
    }

    public function both(): static
    {
        return $this->state(fn () => ['type' => 'both']);
    }
}
