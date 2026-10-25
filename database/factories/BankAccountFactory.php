<?php

namespace Database\Factories;

use App\Models\Account;
use App\Models\BankAccount;
use App\Models\Branch;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<BankAccount>
 */
class BankAccountFactory extends Factory
{
    protected $model = BankAccount::class;

    public function definition(): array
    {
        return [
            'branch_id' => Branch::factory(),
            'bank_name' => fake()->company() . ' Bank',
            'account_number' => fake()->bankAccountNumber(),
            'iban' => fake()->iban('SA'),
            'account_id' => Account::first()?->id ?? Account::factory(),
            'is_active' => true,
        ];
    }
}
