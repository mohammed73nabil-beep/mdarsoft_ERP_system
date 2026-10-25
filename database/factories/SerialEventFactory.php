<?php

namespace Database\Factories;

use App\Models\ProductSerial;
use App\Models\SerialEvent;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Database\Eloquent\Factories\Factory;

class SerialEventFactory extends Factory
{
    protected $model = SerialEvent::class;

    public function definition(): array
    {
        return [
            'serial_id' => ProductSerial::factory(),
            'event_type' => 'purchased',
            'from_warehouse_id' => null,
            'to_warehouse_id' => Warehouse::factory(),
            'from_status' => 'in_stock',
            'to_status' => 'in_stock',
            'reference_type' => null,
            'reference_id' => null,
            'unit_cost' => fake()->randomFloat(4, 500, 3000),
            'unit_price' => null,
            'notes' => fake()->sentence(),
            'created_by' => User::factory(),
            'created_at' => now(),
        ];
    }
}
