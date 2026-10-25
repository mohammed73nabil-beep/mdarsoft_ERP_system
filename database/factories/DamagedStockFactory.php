<?php

namespace Database\Factories;

use App\Models\Branch;
use App\Models\DamagedStock;
use App\Models\FiscalYear;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Database\Eloquent\Factories\Factory;

class DamagedStockFactory extends Factory
{
    protected $model = DamagedStock::class;

    public function definition(): array
    {
        return [
            'reference_number' => 'DMG-' . $this->faker->unique()->numberBetween(10000, 99999),
            'date' => now()->toDateString(),
            'fiscal_year_id' => FiscalYear::factory(),
            'branch_id' => Branch::factory(),
            'warehouse_id' => Warehouse::factory(),
            'total_cost' => 0,
            'status' => 'draft',
            'notes' => null,
            'created_by' => User::factory(),
        ];
    }
}
