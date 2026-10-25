<?php

namespace Tests\Feature\PhaseA;

use App\Models\Branch;
use App\Models\Business;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WarehouseDefaultTest extends TestCase
{
    use RefreshDatabase;

    public function test_only_one_default_warehouse_per_branch(): void
    {
        $business = Business::factory()->create();
        $branch = Branch::factory()->create(['business_id' => $business->id]);

        $wh1 = Warehouse::factory()->create([
            'branch_id' => $branch->id,
            'is_default' => true,
        ]);

        $this->assertTrue($wh1->fresh()->is_default);

        // Create a second warehouse with is_default = true
        $wh2 = Warehouse::factory()->create([
            'branch_id' => $branch->id,
            'is_default' => true,
        ]);

        $this->assertFalse($wh1->fresh()->is_default);
        $this->assertTrue($wh2->fresh()->is_default);

        // Update wh1 back to default
        $wh1->refresh();
        $wh1->update(['is_default' => true]);

        $this->assertTrue($wh1->fresh()->is_default);
        $this->assertFalse($wh2->fresh()->is_default);

        // Verify total defaults in this branch is exactly 1
        $defaultCount = Warehouse::where('branch_id', $branch->id)
            ->where('is_default', true)
            ->count();

        $this->assertEquals(1, $defaultCount);
    }

    public function test_default_warehouses_in_different_branches_do_not_interfere(): void
    {
        $business = Business::factory()->create();
        $branch1 = Branch::factory()->create(['business_id' => $business->id]);
        $branch2 = Branch::factory()->create(['business_id' => $business->id]);

        $whB1 = Warehouse::factory()->create([
            'branch_id' => $branch1->id,
            'is_default' => true,
        ]);

        $whB2 = Warehouse::factory()->create([
            'branch_id' => $branch2->id,
            'is_default' => true,
        ]);

        $this->assertTrue($whB1->fresh()->is_default);
        $this->assertTrue($whB2->fresh()->is_default);
    }
}
