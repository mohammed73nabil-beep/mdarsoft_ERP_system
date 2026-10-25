<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\StockBalance;
use App\Models\Warehouse;
use Illuminate\Database\Eloquent\Factories\Factory;

class StockBalanceFactory extends Factory
{
    protected $model = StockBalance::class;

    public function definition(): array
    {
        return [
            'product_id' => Product::factory(),
            'variation_id' => null,
            'warehouse_id' => Warehouse::factory(),
            'current_balance' => 0,
            'reserved_balance' => 0,
            'avg_cost' => 0,
        ];
    }
}
