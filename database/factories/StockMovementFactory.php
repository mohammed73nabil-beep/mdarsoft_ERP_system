<?php

namespace Database\Factories;

use App\Models\FiscalYear;
use App\Models\Product;
use App\Models\StockMovement;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Database\Eloquent\Factories\Factory;

class StockMovementFactory extends Factory
{
    protected $model = StockMovement::class;

    public function definition(): array
    {
        return [
            'product_id' => Product::factory(),
            'variation_id' => null,
            'warehouse_id' => Warehouse::factory(),
            'serial_id' => null,
            'movement_type' => 'adjust_in',
            'quantity_change' => 10,
            'balance_after' => 10,
            'unit_cost' => 100,
            'reference_type' => null,
            'reference_id' => null,
            'batch_number' => null,
            'fiscal_year_id' => FiscalYear::factory(),
            'created_by' => User::factory(),
            'notes' => null,
        ];
    }
}
