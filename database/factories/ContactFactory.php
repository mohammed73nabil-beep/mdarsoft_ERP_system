<?php

namespace Database\Factories;

use App\Models\Contact;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Contact>
 */
class ContactFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'contact_group_id'    => null,
            'code'                => 'C-' . fake()->unique()->numerify('#####'),
            'name'                => fake()->company(),
            'type'                => fake()->randomElement(['supplier', 'customer', 'both']),
            'phone'               => fake()->phoneNumber(),
            'email'               => fake()->unique()->safeEmail(),
            'tax_number'          => fake()->numerify('310#########'),
            'credit_limit'        => fake()->randomFloat(4, 0, 50000),
            'opening_balance'     => 0,
            'opening_balance_type'=> 'debit',
            'is_active'           => true,
        ];
    }

    public function supplier(): static
    {
        return $this->state(fn () => ['type' => 'supplier']);
    }

    public function customer(): static
    {
        return $this->state(fn () => ['type' => 'customer']);
    }
}
