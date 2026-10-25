<?php

namespace Database\Factories;

use App\Models\Branch;
use App\Models\Contact;
use App\Models\FiscalYear;
use App\Models\PurchaseOrder;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PurchaseOrder>
 */
class PurchaseOrderFactory extends Factory
{
    public function definition(): array
    {
        $subtotal = fake()->randomFloat(4, 100, 5000);
        return [
            'order_number'    => 'PO-' . fake()->unique()->numerify('#####'),
            'date'            => fake()->date(),
            'fiscal_year_id'  => FiscalYear::factory(),
            'contact_id'      => Contact::factory()->supplier(),
            'branch_id'       => Branch::factory(),
            'warehouse_id'    => Warehouse::factory(),
            'user_id'         => User::factory(),
            'subtotal'        => $subtotal,
            'discount_amount' => 0,
            'tax_amount'      => 0,
            'shipping_amount' => 0,
            'total_amount'    => $subtotal,
            'paid_amount'     => 0,
            'payment_status'  => 'unpaid',
            'status'          => 'confirmed',
            'notes'           => null,
        ];
    }
}
