<?php

namespace Database\Factories;

use App\Models\Branch;
use App\Models\FiscalYear;
use App\Models\StockAdjustment;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Database\Eloquent\Factories\Factory;

class StockAdjustmentFactory extends Factory
{
    protected $model = StockAdjustment::class;

    public function definition(): array
    {
        return [
            'adjustment_number' => 'ADJ-' . $this->faker->unique()->numberBetween(10000, 99999),
            'type' => 'stocktaking',
            'date' => now()->toDateString(),
            'fiscal_year_id' => FiscalYear::factory(),
            'branch_id' => Branch::factory(),
            'warehouse_id' => Warehouse::factory(),
            'status' => 'draft',
            'notes' => null,
            'created_by' => User::factory(),
        ];
    }
}
