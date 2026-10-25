<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\ProductSerial;
use App\Models\Warehouse;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProductSerialFactory extends Factory
{
    protected $model = ProductSerial::class;

    public function definition(): array
    {
        return [
            'product_id' => Product::factory()->serial(),
            'variation_id' => null,
            'serial_number' => 'SN-' . fake()->unique()->numerify('##########'),
            'imei1' => fake()->unique()->numerify('35698710######'),
            'imei2' => fake()->unique()->numerify('35698710######'),
            'status' => 'in_stock',
            'warehouse_id' => Warehouse::factory(),
            'cost_price' => fake()->randomFloat(4, 500, 3000),
            'notes' => null,
        ];
    }
}
