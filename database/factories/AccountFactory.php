<?php

namespace Database\Factories;

use App\Models\Account;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Account>
 */
class AccountFactory extends Factory
{
    protected $model = Account::class;

    public function definition(): array
    {
        return [
            'code' => fake()->unique()->numerify('####'),
            'name_ar' => fake()->word(),
            'name' => fake()->word(),
            'type' => 'asset',
            'nature' => 'debit',
            'parent_id' => null,
            'level' => 1,
            'is_parent' => false,
            'is_header' => false,
            'is_system' => false,
            'is_active' => true,
        ];
    }
}
