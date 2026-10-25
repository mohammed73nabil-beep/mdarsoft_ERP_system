<?php

namespace Database\Factories;

use App\Models\Branch;
use App\Models\FiscalYear;
use App\Models\OpeningStock;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class OpeningStockFactory extends Factory
{
    protected $model = OpeningStock::class;

    public function definition(): array
    {
        return [
            'fiscal_year_id' => FiscalYear::factory(),
            'branch_id' => Branch::factory(),
            'date' => now()->toDateString(),
            'status' => 'draft',
            'notes' => null,
            'created_by' => User::factory(),
        ];
    }
}
