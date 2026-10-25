<?php

namespace Database\Factories;

use App\Models\Branch;
use App\Models\Contact;
use App\Models\FiscalYear;
use App\Models\SaleDraft;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SaleDraft>
 */
class SaleDraftFactory extends Factory
{
    public function definition(): array
    {
        $subtotal = fake()->randomFloat(4, 100, 3000);
        return [
            'draft_number'    => 'DFT-' . fake()->unique()->numerify('#####'),
            'date'            => fake()->date(),
            'fiscal_year_id'  => FiscalYear::factory(),
            'contact_id'      => Contact::factory()->customer(),
            'branch_id'       => Branch::factory(),
            'warehouse_id'    => Warehouse::factory(),
            'user_id'         => User::factory(),
            'subtotal'        => $subtotal,
            'discount_amount' => 0,
            'tax_amount'      => 0,
            'total_amount'    => $subtotal,
            'notes'           => null,
        ];
    }
}
