<?php

namespace Database\Factories;

use App\Models\InventoryTransfer;
use App\Models\InventoryTransferLine;
use App\Models\Product;
use App\Models\Unit;
use Illuminate\Database\Eloquent\Factories\Factory;

class InventoryTransferLineFactory extends Factory
{
    protected $model = InventoryTransferLine::class;

    public function definition(): array
    {
        return [
            'inventory_transfer_id' => InventoryTransfer::factory(),
            'product_id' => Product::factory(),
            'variation_id' => null,
            'serial_id' => null,
            'quantity' => 5,
            'unit_id' => Unit::factory(),
            'unit_cost' => 100,
            'notes' => null,
        ];
    }
}
