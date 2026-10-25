<?php

namespace Database\Factories;

use App\Models\OpeningStock;
use App\Models\OpeningStockLine;
use App\Models\Product;
use App\Models\Warehouse;
use Illuminate\Database\Eloquent\Factories\Factory;

class OpeningStockLineFactory extends Factory
{
    protected $model = OpeningStockLine::class;

    public function definition(): array
    {
        return [
            'opening_stock_id' => OpeningStock::factory(),
            'product_id' => Product::factory(),
            'variation_id' => null,
            'warehouse_id' => Warehouse::factory(),
            'serial_id' => null,
            'quantity' => 10,
            'unit_cost' => 100,
            'notes' => null,
        ];
    }
}
