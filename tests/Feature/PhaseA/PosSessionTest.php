<?php

namespace Tests\Feature\PhaseA;

use App\Exceptions\OpenPosSessionExistsException;
use App\Models\Branch;
use App\Models\Business;
use App\Models\FiscalYear;
use App\Models\PosSession;
use App\Models\Treasury;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PosSessionTest extends TestCase
{
    use RefreshDatabase;

    private Branch $branch;
    private Warehouse $warehouse;
    private Treasury $treasury;
    private FiscalYear $fiscalYear;
    private User $cashier;

    protected function setUp(): void
    {
        parent::setUp();

        $business = Business::factory()->create();
        $this->branch = Branch::factory()->create(['business_id' => $business->id]);
        $this->warehouse = Warehouse::factory()->create(['branch_id' => $this->branch->id]);
        $this->treasury = Treasury::factory()->create(['branch_id' => $this->branch->id]);
        $this->fiscalYear = FiscalYear::factory()->create(['business_id' => $business->id, 'status' => 'open']);
        $this->cashier = User::factory()->create(['branch_id' => $this->branch->id]);
    }

    public function test_cashier_cannot_open_new_session_before_closing_previous(): void
    {
        // 1. Open first session
        $session1 = PosSession::create([
            'session_number' => 'POS-00010',
            'branch_id' => $this->branch->id,
            'warehouse_id' => $this->warehouse->id,
            'treasury_id' => $this->treasury->id,
            'user_id' => $this->cashier->id,
            'fiscal_year_id' => $this->fiscalYear->id,
            'opened_at' => now(),
            'opening_balance' => 500.0000,
            'status' => 'open',
        ]);

        $this->assertEquals('open', $session1->status);

        // 2. Attempt to open a second session while first is still open -> Exception
        $this->expectException(OpenPosSessionExistsException::class);

        PosSession::create([
            'session_number' => 'POS-00011',
            'branch_id' => $this->branch->id,
            'warehouse_id' => $this->warehouse->id,
            'treasury_id' => $this->treasury->id,
            'user_id' => $this->cashier->id,
            'fiscal_year_id' => $this->fiscalYear->id,
            'opened_at' => now(),
            'opening_balance' => 200.0000,
            'status' => 'open',
        ]);
    }

    public function test_cashier_can_open_new_session_after_closing_previous(): void
    {
        // 1. Open first session
        $session1 = PosSession::create([
            'session_number' => 'POS-00020',
            'branch_id' => $this->branch->id,
            'warehouse_id' => $this->warehouse->id,
            'treasury_id' => $this->treasury->id,
            'user_id' => $this->cashier->id,
            'fiscal_year_id' => $this->fiscalYear->id,
            'opened_at' => now(),
            'opening_balance' => 500.0000,
            'expected_closing' => 500.0000,
            'status' => 'open',
        ]);

        // 2. Close first session
        $session1->close(550.0000, 'Shift ended with surplus');
        $session1->refresh();

        $this->assertEquals('closed', $session1->status);
        $this->assertEquals(550.0000, (float) $session1->actual_closing);
        $this->assertEquals(50.0000, (float) $session1->difference);
        $this->assertNotNull($session1->closed_at);

        // 3. Now cashier can open another session without exception
        $session2 = PosSession::create([
            'session_number' => 'POS-00021',
            'branch_id' => $this->branch->id,
            'warehouse_id' => $this->warehouse->id,
            'treasury_id' => $this->treasury->id,
            'user_id' => $this->cashier->id,
            'fiscal_year_id' => $this->fiscalYear->id,
            'opened_at' => now(),
            'opening_balance' => 200.0000,
            'status' => 'open',
        ]);

        $this->assertDatabaseHas('pos_sessions', ['id' => $session2->id]);
    }
}
