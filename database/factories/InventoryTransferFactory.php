<?php

namespace Database\Factories;

use App\Models\FiscalYear;
use App\Models\InventoryTransfer;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Database\Eloquent\Factories\Factory;

class InventoryTransferFactory extends Factory
{
    protected $model = InventoryTransfer::class;

    public function definition(): array
    {
        return [
            'transfer_number' => 'TRF-' . $this->faker->unique()->numberBetween(10000, 99999),
            'date' => now()->toDateString(),
            'fiscal_year_id' => FiscalYear::factory(),
            'from_warehouse_id' => Warehouse::factory(),
            'to_warehouse_id' => Warehouse::factory(),
            'status' => 'draft',
            'notes' => null,
            'created_by' => User::factory(),
            'received_by' => null,
        ];
    }
}
