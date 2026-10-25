<?php

namespace Database\Factories;

use App\Models\Account;
use App\Models\Branch;
use App\Models\Treasury;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Treasury>
 */
class TreasuryFactory extends Factory
{
    protected $model = Treasury::class;

    public function definition(): array
    {
        return [
            'branch_id' => Branch::factory(),
            'name' => 'Main Treasury',
            'account_id' => Account::first()?->id ?? Account::factory(),
            'is_default' => false,
            'is_active' => true,
        ];
    }
}
