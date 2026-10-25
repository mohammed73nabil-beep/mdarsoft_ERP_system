<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\SaleOrder;
use App\Models\SaleOrderLine;
use App\Models\Unit;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SaleOrderLine>
 */
class SaleOrderLineFactory extends Factory
{
    public function definition(): array
    {
        $qty = fake()->randomFloat(4, 1, 10);
        $price = fake()->randomFloat(4, 50, 500);
        return [
            'sale_order_id'       => SaleOrder::factory(),
            'product_id'          => Product::factory(),
            'variation_id'        => null,
            'quantity'            => $qty,
            'unit_id'             => Unit::factory(),
            'unit_price'          => $price,
            'discount_amount'     => 0,
            'tax_amount'          => 0,
            'total_amount'        => $qty * $price,
            'cost_price'          => 0,
            'warranty_expires_at' => null,
            'notes'               => null,
        ];
    }
}
