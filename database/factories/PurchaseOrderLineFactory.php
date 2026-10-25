<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderLine;
use App\Models\Unit;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PurchaseOrderLine>
 */
class PurchaseOrderLineFactory extends Factory
{
    public function definition(): array
    {
        $qty  = fake()->randomFloat(4, 1, 20);
        $cost = fake()->randomFloat(4, 50, 3000);
        return [
            'purchase_order_id' => PurchaseOrder::factory(),
            'product_id'        => Product::factory(),
            'variation_id'      => null,
            'quantity'          => $qty,
            'unit_id'           => Unit::factory(),
            'unit_cost'         => $cost,
            'discount_amount'   => 0,
            'tax_id'            => null,
            'tax_amount'        => 0,
            'total_amount'      => round($qty * $cost, 4),
            'expiry_date'       => null,
            'notes'             => null,
        ];
    }
}
