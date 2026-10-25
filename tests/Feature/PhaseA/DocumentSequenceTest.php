<?php

namespace Tests\Feature\PhaseA;

use App\Models\Branch;
use App\Models\Business;
use App\Models\DocumentSequence;
use App\Models\FiscalYear;
use App\Services\DocumentSequenceService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DocumentSequenceTest extends TestCase
{
    use RefreshDatabase;

    private DocumentSequenceService $service;
    private Branch $branch;
    private FiscalYear $fiscalYear;

    protected function setUp(): void
    {
        parent::setUp();

        $this->service = app(DocumentSequenceService::class);

        $business = Business::factory()->create();
        $this->branch = Branch::factory()->create(['business_id' => $business->id]);
        $this->fiscalYear = FiscalYear::factory()->create(['business_id' => $business->id, 'status' => 'open']);
    }

    public function test_generates_sequential_padded_numbers(): void
    {
        $num1 = $this->service->getNextNumber($this->branch->id, $this->fiscalYear->id, 'sale_invoice');
        $num2 = $this->service->getNextNumber($this->branch->id, $this->fiscalYear->id, 'sale_invoice');
        $num3 = $this->service->getNextNumber($this->branch->id, $this->fiscalYear->id, 'sale_invoice');

        $this->assertEquals('INV-00001', $num1);
        $this->assertEquals('INV-00002', $num2);
        $this->assertEquals('INV-00003', $num3);
    }

    public function test_sequence_does_not_duplicate_under_simulated_concurrent_requests(): void
    {
        $generatedNumbers = [];
        $totalRequests = 30;

        for ($i = 0; $i < $totalRequests; $i++) {
            $generatedNumbers[] = $this->service->getNextNumber(
                $this->branch->id,
                $this->fiscalYear->id,
                'pos_session'
            );
        }

        // Assert all generated numbers are unique
        $this->assertCount($totalRequests, $generatedNumbers);
        $this->assertCount($totalRequests, array_unique($generatedNumbers));

        // Assert database state matches
        $seq = DocumentSequence::where('branch_id', $this->branch->id)
            ->where('fiscal_year_id', $this->fiscalYear->id)
            ->where('doc_type', 'pos_session')
            ->first();

        $this->assertNotNull($seq);
        $this->assertEquals($totalRequests, $seq->last_number);
    }

    public function test_sequences_are_isolated_by_branch_fiscal_year_and_doc_type(): void
    {
        $branch2 = Branch::factory()->create(['business_id' => $this->branch->business_id]);

        $b1Inv = $this->service->getNextNumber($this->branch->id, $this->fiscalYear->id, 'sale_invoice');
        $b2Inv = $this->service->getNextNumber($branch2->id, $this->fiscalYear->id, 'sale_invoice');
        $b1Pos = $this->service->getNextNumber($this->branch->id, $this->fiscalYear->id, 'pos_session');

        $this->assertEquals('INV-00001', $b1Inv);
        $this->assertEquals('INV-00001', $b2Inv);
        $this->assertEquals('POS-00001', $b1Pos);
    }
}
