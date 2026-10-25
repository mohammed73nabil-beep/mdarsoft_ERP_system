<?php

namespace Database\Factories;

use App\Models\Tax;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Tax>
 */
class TaxFactory extends Factory
{
    protected $model = Tax::class;

    public function definition(): array
    {
        return [
            'name' => 'VAT 15%',
            'rate' => 15.00,
            'type' => 'percentage',
            'tax_type' => 'vat_output',
            'account_id' => null,
            'is_active' => true,
        ];
    }
}
