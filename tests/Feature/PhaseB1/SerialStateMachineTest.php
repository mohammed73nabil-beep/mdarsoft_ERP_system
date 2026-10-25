<?php

namespace Tests\Feature\PhaseB1;

use App\Exceptions\InvalidSerialStatusException;
use App\Models\Branch;
use App\Models\Business;
use App\Models\Product;
use App\Models\ProductSerial;
use App\Models\SerialEvent;
use App\Models\User;
use App\Models\Warehouse;
use App\Services\SerialStateMachine;
use Illuminate\Foundation\Testing\RefreshDatabase;
use RuntimeException;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class SerialStateMachineTest extends TestCase
{
    use RefreshDatabase;

    protected Warehouse $warehouse1;
    protected Warehouse $warehouse2;
    protected Product $product;
    protected SerialStateMachine $service;

    protected function setUp(): void
    {
        parent::setUp();

        $business = Business::factory()->create();
        $branch = Branch::factory()->create(['business_id' => $business->id]);
        $this->warehouse1 = Warehouse::factory()->create(['branch_id' => $branch->id, 'name' => 'WH1']);
        $this->warehouse2 = Warehouse::factory()->create(['branch_id' => $branch->id, 'name' => 'WH2']);
        $this->product = Product::factory()->serial()->create();
        $this->service = new SerialStateMachine();

        Permission::firstOrCreate(['name' => 'serials.accept_return', 'guard_name' => 'web']);
    }

    public function test_all_allowed_transitions_succeed_and_write_events(): void
    {
        // 1. in_stock -> sold
        $serial1 = ProductSerial::factory()->create([
            'product_id' => $this->product->id,
            'warehouse_id' => $this->warehouse1->id,
            'status' => 'in_stock',
        ]);
        $res1 = $this->service->transition($serial1, 'sold', ['reference_type' => 'SaleOrder', 'reference_id' => 1]);
        $this->assertEquals('sold', $res1->status);
        $this->assertDatabaseHas('serial_events', [
            'serial_id' => $serial1->id,
            'from_status' => 'in_stock',
            'to_status' => 'sold',
            'event_type' => 'sold',
        ]);

        // 2. in_stock -> damaged
        $serial2 = ProductSerial::factory()->create([
            'product_id' => $this->product->id,
            'warehouse_id' => $this->warehouse1->id,
            'status' => 'in_stock',
        ]);
        $res2 = $this->service->transition($serial2, 'damaged', ['notes' => 'Broken screen']);
        $this->assertEquals('damaged', $res2->status);

        // 3. in_stock -> transferred
        $serial3 = ProductSerial::factory()->create([
            'product_id' => $this->product->id,
            'warehouse_id' => $this->warehouse1->id,
            'status' => 'in_stock',
        ]);
        $res3 = $this->service->transition($serial3, 'transferred', [
            'to_warehouse_id' => $this->warehouse2->id,
        ]);
        $this->assertEquals('transferred', $res3->status);

        // 4. transferred -> in_stock
        $res3b = $this->service->transition($res3, 'in_stock', [
            'to_warehouse_id' => $this->warehouse2->id,
        ]);
        $this->assertEquals('in_stock', $res3b->status);
        $this->assertEquals($this->warehouse2->id, $res3b->warehouse_id);

        // 5. in_stock -> returned_to_supplier
        $serial4 = ProductSerial::factory()->create([
            'product_id' => $this->product->id,
            'warehouse_id' => $this->warehouse1->id,
            'status' => 'in_stock',
        ]);
        $res4 = $this->service->transition($serial4, 'returned_to_supplier');
        $this->assertEquals('returned_to_supplier', $res4->status);

        // 6. sold -> returned -> in_stock (full cycle with permission)
        $user = User::factory()->create();
        $user->givePermissionTo('serials.accept_return');
        $this->actingAs($user);

        $res1b = $this->service->transition($res1, 'returned', ['notes' => 'Customer refund']);
        $this->assertEquals('returned', $res1b->status);

        $res1c = $this->service->transition($res1b, 'in_stock', ['notes' => 'Accepted into stock']);
        $this->assertEquals('in_stock', $res1c->status);

        // 7. returned -> returned_to_supplier
        $serial5 = ProductSerial::factory()->create([
            'product_id' => $this->product->id,
            'warehouse_id' => $this->warehouse1->id,
            'status' => 'returned',
        ]);
        $res5 = $this->service->transition($serial5, 'returned_to_supplier');
        $this->assertEquals('returned_to_supplier', $res5->status);

        // 8. damaged -> in_stock (with adjustment)
        $res2b = $this->service->transition($res2, 'in_stock', [
            'event_type' => 'adjusted',
            'is_approved_adjustment' => true,
            'notes' => 'Repaired and recalibrated',
        ]);
        $this->assertEquals('in_stock', $res2b->status);
    }

    public function test_disallowed_direct_transition_returned_to_sold_is_forbidden(): void
    {
        $serial = ProductSerial::factory()->create([
            'product_id' => $this->product->id,
            'warehouse_id' => $this->warehouse1->id,
            'status' => 'returned',
        ]);

        $this->expectException(InvalidSerialStatusException::class);
        $this->service->transition($serial, 'sold');
    }

    public function test_disallowed_transition_in_stock_to_returned_is_forbidden(): void
    {
        $serial = ProductSerial::factory()->create([
            'product_id' => $this->product->id,
            'warehouse_id' => $this->warehouse1->id,
            'status' => 'in_stock',
        ]);

        $this->expectException(InvalidSerialStatusException::class);
        $this->service->transition($serial, 'returned');
    }

    public function test_disallowed_transition_sold_to_in_stock_directly_is_forbidden(): void
    {
        $serial = ProductSerial::factory()->create([
            'product_id' => $this->product->id,
            'warehouse_id' => $this->warehouse1->id,
            'status' => 'sold',
        ]);

        $this->expectException(InvalidSerialStatusException::class);
        $this->service->transition($serial, 'in_stock');
    }

    public function test_returned_to_supplier_is_terminal_and_cannot_transition(): void
    {
        $serial = ProductSerial::factory()->create([
            'product_id' => $this->product->id,
            'warehouse_id' => $this->warehouse1->id,
            'status' => 'returned_to_supplier',
        ]);

        $this->expectException(InvalidSerialStatusException::class);
        $this->service->transition($serial, 'in_stock');
    }

    public function test_damaged_to_in_stock_without_adjustment_is_forbidden(): void
    {
        $serial = ProductSerial::factory()->create([
            'product_id' => $this->product->id,
            'warehouse_id' => $this->warehouse1->id,
            'status' => 'damaged',
        ]);

        $this->expectException(InvalidSerialStatusException::class);
        $this->service->transition($serial, 'in_stock');
    }

    public function test_returned_to_in_stock_without_permission_is_forbidden(): void
    {
        $cashier = User::factory()->create();
        // Cashier has NO serials.accept_return permission
        $this->actingAs($cashier);

        $serial = ProductSerial::factory()->create([
            'product_id' => $this->product->id,
            'warehouse_id' => $this->warehouse1->id,
            'status' => 'returned',
        ]);

        $this->expectException(InvalidSerialStatusException::class);
        $this->expectExceptionMessage("serials.accept_return");
        $this->service->transition($serial, 'in_stock');
    }

    public function test_serial_events_are_immutable(): void
    {
        $serial = ProductSerial::factory()->create([
            'product_id' => $this->product->id,
            'warehouse_id' => $this->warehouse1->id,
            'status' => 'in_stock',
        ]);

        $this->service->transition($serial, 'sold', ['reference_type' => 'SaleOrder', 'reference_id' => 99]);

        $event = SerialEvent::where('serial_id', $serial->id)->first();
        $this->assertNotNull($event);

        // Attempting to update event must throw RuntimeException
        try {
            $event->notes = 'Hacked note';
            $event->save();
            $this->fail('Expected RuntimeException on updating SerialEvent');
        } catch (RuntimeException $e) {
            $this->assertStringContainsString('immutable', $e->getMessage());
        }

        // Attempting to delete event must throw RuntimeException
        try {
            $event->delete();
            $this->fail('Expected RuntimeException on deleting SerialEvent');
        } catch (RuntimeException $e) {
            $this->assertStringContainsString('immutable', $e->getMessage());
        }
    }

    public function test_serial_events_database_triggers_block_direct_db_update_and_delete(): void
    {
        $serial = ProductSerial::factory()->create([
            'product_id' => $this->product->id,
            'warehouse_id' => $this->warehouse1->id,
            'status' => 'in_stock',
        ]);

        $this->service->transition($serial, 'sold', ['reference_type' => 'SaleOrder', 'reference_id' => 101]);

        $eventId = \Illuminate\Support\Facades\DB::table('serial_events')
            ->where('serial_id', $serial->id)
            ->value('id');

        $this->assertNotNull($eventId);

        // Attempting to update via DB::table must be aborted by MySQL trigger trg_serial_events_prevent_update
        try {
            \Illuminate\Support\Facades\DB::table('serial_events')
                ->where('id', $eventId)
                ->update(['notes' => 'Direct DB bypass attempt']);
            $this->fail('Expected QueryException due to MySQL trigger on direct update');
        } catch (\Illuminate\Database\QueryException $e) {
            $this->assertStringContainsString('immutable', $e->getMessage());
        }

        // Attempting to delete via DB::table must be aborted by MySQL trigger trg_serial_events_prevent_delete
        try {
            \Illuminate\Support\Facades\DB::table('serial_events')
                ->where('id', $eventId)
                ->delete();
            $this->fail('Expected QueryException due to MySQL trigger on direct delete');
        } catch (\Illuminate\Database\QueryException $e) {
            $this->assertStringContainsString('immutable', $e->getMessage());
        }
    }

    public function test_simulated_concurrent_transitions_only_one_succeeds(): void
    {
        $serial = ProductSerial::factory()->create([
            'product_id' => $this->product->id,
            'warehouse_id' => $this->warehouse1->id,
            'status' => 'in_stock',
        ]);

        // Transaction 1 locks and transitions the serial to 'sold'
        $t1Success = false;
        \Illuminate\Support\Facades\DB::transaction(function () use ($serial, &$t1Success) {
            $this->service->transition($serial, 'sold', ['reference_type' => 'SaleOrder', 'reference_id' => 201]);
            $t1Success = true;
        });

        $this->assertTrue($t1Success);

        // Transaction 2 (simulated competing transaction) tries to transition the same serial to 'damaged'
        // Since serial is now 'sold', transition from 'sold' to 'damaged' is illegal and must fail with InvalidSerialStatusException
        $this->expectException(InvalidSerialStatusException::class);
        $this->service->transition($serial, 'damaged');
    }
}
