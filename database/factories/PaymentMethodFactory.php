<?php

namespace Database\Factories;

use App\Models\Account;
use App\Models\PaymentMethod;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PaymentMethod>
 */
class PaymentMethodFactory extends Factory
{
    protected $model = PaymentMethod::class;

    public function definition(): array
    {
        return [
            'name' => 'نقدي',
            'type' => 'cash',
            'account_id' => Account::first()?->id ?? Account::factory(),
            'is_active' => true,
        ];
    }
}
