<?php

namespace Database\Factories;

use App\Models\Branch;
use App\Models\Contact;
use App\Models\FiscalYear;
use App\Models\Quotation;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Quotation>
 */
class QuotationFactory extends Factory
{
    public function definition(): array
    {
        $subtotal = fake()->randomFloat(4, 100, 3000);
        return [
            'quotation_number' => 'QUO-' . fake()->unique()->numerify('#####'),
            'date'             => fake()->date(),
            'expiry_date'      => fake()->date(),
            'fiscal_year_id'   => FiscalYear::factory(),
            'contact_id'       => Contact::factory()->customer(),
            'branch_id'        => Branch::factory(),
            'warehouse_id'     => Warehouse::factory(),
            'user_id'          => User::factory(),
            'subtotal'         => $subtotal,
            'discount_amount'  => 0,
            'tax_amount'       => 0,
            'total_amount'     => $subtotal,
            'status'           => 'draft',
            'notes'            => null,
        ];
    }
}
