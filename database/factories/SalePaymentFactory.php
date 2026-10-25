<?php

namespace Database\Factories;

use App\Models\PaymentMethod;
use App\Models\SaleOrder;
use App\Models\SalePayment;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SalePayment>
 */
class SalePaymentFactory extends Factory
{
    public function definition(): array
    {
        return [
            'sale_order_id'     => SaleOrder::factory(),
            'pos_session_id'    => null,
            'date'              => fake()->date(),
            'amount'            => fake()->randomFloat(4, 50, 1000),
            'payment_method_id' => PaymentMethod::factory(),
            'treasury_id'       => null,
            'bank_account_id'   => null,
            'reference'         => fake()->lexify('PAY-????'),
            'notes'             => null,
            'created_by'        => User::factory(),
        ];
    }
}
