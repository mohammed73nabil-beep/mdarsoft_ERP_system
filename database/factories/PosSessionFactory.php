<?php

namespace Database\Factories;

use App\Models\Branch;
use App\Models\FiscalYear;
use App\Models\PosSession;
use App\Models\Treasury;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PosSession>
 */
class PosSessionFactory extends Factory
{
    protected $model = PosSession::class;

    public function definition(): array
    {
        return [
            'session_number' => 'POS-' . fake()->unique()->numerify('#####'),
            'branch_id' => Branch::factory(),
            'warehouse_id' => Warehouse::factory(),
            'treasury_id' => Treasury::factory(),
            'user_id' => User::factory(),
            'fiscal_year_id' => FiscalYear::factory(),
            'opened_at' => now(),
            'closed_at' => null,
            'opening_balance' => 0.0000,
            'expected_closing' => 0.0000,
            'actual_closing' => null,
            'difference' => null,
            'status' => 'open',
            'notes' => null,
        ];
    }

    public function closed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'closed',
            'closed_at' => now(),
            'actual_closing' => 100.0000,
            'expected_closing' => 100.0000,
            'difference' => 0.0000,
        ]);
    }
}
