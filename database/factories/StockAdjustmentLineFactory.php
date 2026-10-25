<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\StockAdjustment;
use App\Models\StockAdjustmentLine;
use Illuminate\Database\Eloquent\Factories\Factory;

class StockAdjustmentLineFactory extends Factory
{
    protected $model = StockAdjustmentLine::class;

    public function definition(): array
    {
        return [
            'stock_adjustment_id' => StockAdjustment::factory(),
            'product_id' => Product::factory(),
            'variation_id' => null,
            'serial_id' => null,
            'system_quantity' => 10,
            'counted_quantity' => 12,
            'adjusted_quantity' => 2,
            'direction' => 'in',
            'unit_cost' => 100,
            'notes' => null,
        ];
    }
}
