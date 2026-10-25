<?php

namespace Database\Factories;

use App\Models\DamagedStock;
use App\Models\DamagedStockLine;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

class DamagedStockLineFactory extends Factory
{
    protected $model = DamagedStockLine::class;

    public function definition(): array
    {
        return [
            'damaged_stock_id' => DamagedStock::factory(),
            'product_id' => Product::factory(),
            'variation_id' => null,
            'serial_id' => null,
            'quantity' => 2,
            'unit_cost' => 100,
            'total_cost' => 200,
            'notes' => null,
        ];
    }
}
