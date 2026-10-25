<?php

namespace Database\Factories;

use App\Models\PaymentMethod;
use App\Models\PurchaseOrder;
use App\Models\PurchasePayment;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PurchasePayment>
 */
class PurchasePaymentFactory extends Factory
{
    public function definition(): array
    {
        return [
            'purchase_order_id' => PurchaseOrder::factory(),
            'date'              => fake()->date(),
            'amount'            => fake()->randomFloat(4, 100, 5000),
            'payment_method_id' => PaymentMethod::factory(),
            'treasury_id'       => null,
            'bank_account_id'   => null,
            'reference'         => null,
            'notes'             => null,
            'created_by'        => User::factory(),
        ];
    }
}
