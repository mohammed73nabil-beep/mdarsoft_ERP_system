<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\SaleOrderLine;
use App\Models\SaleReturn;
use App\Models\SaleReturnLine;
use App\Models\Unit;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SaleReturnLine>
 */
class SaleReturnLineFactory extends Factory
{
    public function definition(): array
    {
        $qty = fake()->randomFloat(4, 1, 5);
        $cost = fake()->randomFloat(4, 50, 200);
        return [
            'sale_return_id'    => SaleReturn::factory(),
            'original_line_id'  => SaleOrderLine::factory(),
            'product_id'        => Product::factory(),
            'variation_id'      => null,
            'quantity'          => $qty,
            'unit_id'           => Unit::factory(),
            'unit_price'        => $cost * 1.5,
            'return_cost_price' => $cost,
            'tax_amount'        => 0,
            'total_amount'      => $qty * $cost * 1.5,
        ];
    }
}
