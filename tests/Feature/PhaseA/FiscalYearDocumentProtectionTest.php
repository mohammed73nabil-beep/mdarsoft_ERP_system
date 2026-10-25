<?php

namespace Tests\Feature\PhaseA;

use App\Exceptions\ClosedFiscalYearException;
use App\Models\Branch;
use App\Models\Business;
use App\Models\FiscalYear;
use App\Models\PosSession;
use App\Models\Treasury;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FiscalYearDocumentProtectionTest extends TestCase
{
    use RefreshDatabase;

    private Business $business;
    private Branch $branch;
    private Warehouse $warehouse;
    private Treasury $treasury;
    private User $cashier;

    protected function setUp(): void
    {
        parent::setUp();

        $this->business = Business::factory()->create();
        $this->branch = Branch::factory()->create(['business_id' => $this->business->id]);
        $this->warehouse = Warehouse::factory()->create(['branch_id' => $this->branch->id]);
        $this->treasury = Treasury::factory()->create(['branch_id' => $this->branch->id]);
        $this->cashier = User::factory()->create(['branch_id' => $this->branch->id]);
    }

    public function test_can_toggle_fiscal_year_status(): void
    {
        $fy = FiscalYear::factory()->create([
            'business_id' => $this->business->id,
            'status' => 'open',
        ]);

        $this->assertTrue($fy->isOpen());
        $this->assertFalse($fy->isClosed());

        $fy->close($this->cashier);
        $fy->refresh();

        $this->assertTrue($fy->isClosed());
        $this->assertNotNull($fy->closed_at);
        $this->assertEquals($this->cashier->id, $fy->closed_by);

        $fy->reopen();
        $fy->refresh();

        $this->assertTrue($fy->isOpen());
        $this->assertNull($fy->closed_at);
        $this->assertNull($fy->closed_by);
    }

    public function test_can_create_document_in_open_fiscal_year(): void
    {
        $fy = FiscalYear::factory()->create([
            'business_id' => $this->business->id,
            'status' => 'open',
        ]);

        $session = PosSession::create([
            'session_number' => 'POS-00001',
            'branch_id' => $this->branch->id,
            'warehouse_id' => $this->warehouse->id,
            'treasury_id' => $this->treasury->id,
            'user_id' => $this->cashier->id,
            'fiscal_year_id' => $fy->id,
            'opened_at' => now(),
            'opening_balance' => 0,
        ]);

        $this->assertDatabaseHas('pos_sessions', ['id' => $session->id]);
    }

    public function test_cannot_create_document_in_closed_fiscal_year(): void
    {
        $fy = FiscalYear::factory()->create([
            'business_id' => $this->business->id,
            'status' => 'closed',
            'closed_at' => now(),
        ]);

        $this->expectException(ClosedFiscalYearException::class);

        PosSession::create([
            'session_number' => 'POS-00002',
            'branch_id' => $this->branch->id,
            'warehouse_id' => $this->warehouse->id,
            'treasury_id' => $this->treasury->id,
            'user_id' => $this->cashier->id,
            'fiscal_year_id' => $fy->id,
            'opened_at' => now(),
            'opening_balance' => 0,
        ]);
    }
}
