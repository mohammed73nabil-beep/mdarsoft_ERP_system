<?php

namespace Database\Factories;

use App\Models\Branch;
use App\Models\Contact;
use App\Models\FiscalYear;
use App\Models\SaleOrder;
use App\Models\SaleReturn;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SaleReturn>
 */
class SaleReturnFactory extends Factory
{
    public function definition(): array
    {
        $total = fake()->randomFloat(4, 50, 1000);
        return [
            'return_number'    => 'SRT-' . fake()->unique()->numerify('#####'),
            'date'             => fake()->date(),
            'fiscal_year_id'   => FiscalYear::factory(),
            'original_sale_id' => SaleOrder::factory(),
            'contact_id'       => Contact::factory()->customer(),
            'branch_id'        => Branch::factory(),
            'warehouse_id'     => Warehouse::factory(),
            'user_id'          => User::factory(),
            'total_amount'     => $total,
            'tax_amount'       => 0,
            'status'           => 'confirmed',
            'refund_method'    => 'cash',
            'notes'            => null,
        ];
    }
}
