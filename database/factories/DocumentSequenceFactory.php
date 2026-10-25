<?php

namespace Database\Factories;

use App\Models\Branch;
use App\Models\DocumentSequence;
use App\Models\FiscalYear;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<DocumentSequence>
 */
class DocumentSequenceFactory extends Factory
{
    protected $model = DocumentSequence::class;

    public function definition(): array
    {
        return [
            'branch_id' => Branch::factory(),
            'fiscal_year_id' => FiscalYear::factory(),
            'doc_type' => fake()->randomElement(['sale_invoice', 'pos_session', 'purchase']),
            'prefix' => 'DOC',
            'last_number' => 0,
            'padding' => 5,
        ];
    }
}
