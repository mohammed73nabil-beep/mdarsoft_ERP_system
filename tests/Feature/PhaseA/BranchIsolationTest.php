<?php

namespace Tests\Feature\PhaseA;

use App\Models\Branch;
use App\Models\Business;
use App\Models\FiscalYear;
use App\Models\PosSession;
use App\Models\Treasury;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class BranchIsolationTest extends TestCase
{
    use RefreshDatabase;

    private Branch $branch1;
    private Branch $branch2;
    private User $userBranch1;
    private User $userBranch2;
    private User $adminUser;
    private PosSession $sessionBranch1;
    private PosSession $sessionBranch2;

    protected function setUp(): void
    {
        parent::setUp();

        $business = Business::factory()->create();
        $this->branch1 = Branch::factory()->create(['business_id' => $business->id, 'name' => 'Branch 1']);
        $this->branch2 = Branch::factory()->create(['business_id' => $business->id, 'name' => 'Branch 2']);

        $wh1 = Warehouse::factory()->create(['branch_id' => $this->branch1->id]);
        $wh2 = Warehouse::factory()->create(['branch_id' => $this->branch2->id]);

        $tr1 = Treasury::factory()->create(['branch_id' => $this->branch1->id]);
        $tr2 = Treasury::factory()->create(['branch_id' => $this->branch2->id]);

        $fy = FiscalYear::factory()->create(['business_id' => $business->id, 'status' => 'open']);

        $this->userBranch1 = User::factory()->create(['branch_id' => $this->branch1->id]);
        $this->userBranch2 = User::factory()->create(['branch_id' => $this->branch2->id]);

        // Create roles and permission
        $viewAllPerm = \Spatie\Permission\Models\Permission::firstOrCreate(['name' => 'branches.view_all', 'guard_name' => 'web']);
        $adminRole = Role::firstOrCreate(['name' => 'مدير النظام', 'guard_name' => 'web']);
        $adminRole->givePermissionTo($viewAllPerm);
        Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);

        $this->adminUser = User::factory()->create(['branch_id' => $this->branch1->id]);
        $this->adminUser->assignRole('مدير النظام');

        // Create a PosSession for Branch 1
        $this->sessionBranch1 = PosSession::create([
            'session_number' => 'POS-BR1-0001',
            'branch_id' => $this->branch1->id,
            'warehouse_id' => $wh1->id,
            'treasury_id' => $tr1->id,
            'user_id' => $this->userBranch1->id,
            'fiscal_year_id' => $fy->id,
            'opened_at' => now(),
            'opening_balance' => 0,
        ]);

        // Create a PosSession for Branch 2
        $this->sessionBranch2 = PosSession::create([
            'session_number' => 'POS-BR2-0001',
            'branch_id' => $this->branch2->id,
            'warehouse_id' => $wh2->id,
            'treasury_id' => $tr2->id,
            'user_id' => $this->userBranch2->id,
            'fiscal_year_id' => $fy->id,
            'opened_at' => now(),
            'opening_balance' => 0,
        ]);
    }

    public function test_branch1_user_can_only_see_branch1_records(): void
    {
        $this->actingAs($this->userBranch1);

        $sessions = PosSession::all();

        $this->assertTrue($sessions->contains('id', $this->sessionBranch1->id));
        $this->assertFalse($sessions->contains('id', $this->sessionBranch2->id));
        $this->assertCount(1, $sessions);
    }

    public function test_branch2_user_can_only_see_branch2_records(): void
    {
        $this->actingAs($this->userBranch2);

        $sessions = PosSession::all();

        $this->assertFalse($sessions->contains('id', $this->sessionBranch1->id));
        $this->assertTrue($sessions->contains('id', $this->sessionBranch2->id));
        $this->assertCount(1, $sessions);
    }

    public function test_admin_user_can_see_records_from_all_branches(): void
    {
        $this->actingAs($this->adminUser);

        $sessions = PosSession::all();

        $this->assertTrue($sessions->contains('id', $this->sessionBranch1->id));
        $this->assertTrue($sessions->contains('id', $this->sessionBranch2->id));
        $this->assertCount(2, $sessions);
    }
}
