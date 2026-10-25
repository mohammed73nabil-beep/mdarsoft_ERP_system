<?php

namespace Tests\Feature\PhaseB1;

use App\Models\Branch;
use App\Models\Business;
use App\Models\Product;
use App\Models\ProductSerial;
use App\Models\Warehouse;
use App\Services\SerialStateMachine;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductSerialTest extends TestCase
{
    use RefreshDatabase;

    protected Warehouse $warehouse;
    protected Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        $business = Business::factory()->create();
        $branch = Branch::factory()->create(['business_id' => $business->id]);
        $this->warehouse = Warehouse::factory()->create(['branch_id' => $branch->id]);
        $this->product = Product::factory()->serial()->create();
    }

    public function test_prevent_duplicate_serial_number(): void
    {
        ProductSerial::create([
            'product_id' => $this->product->id,
            'serial_number' => 'SN-11223344',
            'imei1' => '356987101111111',
            'status' => 'in_stock',
            'warehouse_id' => $this->warehouse->id,
            'cost_price' => 1200.00,
        ]);

        $this->expectException(QueryException::class);
        ProductSerial::create([
            'product_id' => $this->product->id,
            'serial_number' => 'SN-11223344',
            'imei1' => '356987102222222',
            'status' => 'in_stock',
            'warehouse_id' => $this->warehouse->id,
            'cost_price' => 1300.00,
        ]);
    }

    public function test_prevent_duplicate_imei1_but_accept_multiple_nulls(): void
    {
        // First serial with imei1
        ProductSerial::create([
            'product_id' => $this->product->id,
            'serial_number' => 'SN-IMEI-01',
            'imei1' => '359999999999991',
            'status' => 'in_stock',
            'warehouse_id' => $this->warehouse->id,
        ]);

        // Multiple serials with NULL imei1 must be accepted
        $serialNull1 = ProductSerial::create([
            'product_id' => $this->product->id,
            'serial_number' => 'SN-IMEI-NULL-1',
            'imei1' => null,
            'status' => 'in_stock',
            'warehouse_id' => $this->warehouse->id,
        ]);

        $serialNull2 = ProductSerial::create([
            'product_id' => $this->product->id,
            'serial_number' => 'SN-IMEI-NULL-2',
            'imei1' => null,
            'status' => 'in_stock',
            'warehouse_id' => $this->warehouse->id,
        ]);

        $this->assertNotNull($serialNull1->id);
        $this->assertNotNull($serialNull2->id);

        // Duplicate non-null imei1 must be rejected
        $this->expectException(QueryException::class);
        ProductSerial::create([
            'product_id' => $this->product->id,
            'serial_number' => 'SN-IMEI-02',
            'imei1' => '359999999999991',
            'status' => 'in_stock',
            'warehouse_id' => $this->warehouse->id,
        ]);
    }

    public function test_prevent_duplicate_imei2_but_accept_multiple_nulls(): void
    {
        // Multiple serials with NULL imei2 must be accepted
        $serialNull1 = ProductSerial::create([
            'product_id' => $this->product->id,
            'serial_number' => 'SN-IMEI2-NULL-1',
            'imei2' => null,
            'status' => 'in_stock',
            'warehouse_id' => $this->warehouse->id,
        ]);

        $serialNull2 = ProductSerial::create([
            'product_id' => $this->product->id,
            'serial_number' => 'SN-IMEI2-NULL-2',
            'imei2' => null,
            'status' => 'in_stock',
            'warehouse_id' => $this->warehouse->id,
        ]);

        $this->assertNotNull($serialNull1->id);
        $this->assertNotNull($serialNull2->id);

        // First non-null imei2
        ProductSerial::create([
            'product_id' => $this->product->id,
            'serial_number' => 'SN-IMEI2-A',
            'imei2' => '861111111111112',
            'status' => 'in_stock',
            'warehouse_id' => $this->warehouse->id,
        ]);

        // Duplicate non-null imei2 must be rejected
        $this->expectException(QueryException::class);
        ProductSerial::create([
            'product_id' => $this->product->id,
            'serial_number' => 'SN-IMEI2-B',
            'imei2' => '861111111111112',
            'status' => 'in_stock',
            'warehouse_id' => $this->warehouse->id,
        ]);
    }

    public function test_sold_serial_preserves_last_warehouse_id(): void
    {
        $serial = ProductSerial::create([
            'product_id' => $this->product->id,
            'serial_number' => 'SN-PRESERVE-WH-01',
            'status' => 'in_stock',
            'warehouse_id' => $this->warehouse->id,
            'cost_price' => 1500.00,
        ]);

        $stateMachine = new SerialStateMachine();
        $updated = $stateMachine->transition($serial, 'sold', [
            'reference_type' => 'SaleOrder',
            'reference_id' => 101,
            'unit_price' => 2000.00,
        ]);

        $this->assertEquals('sold', $updated->status);
        $this->assertEquals($this->warehouse->id, $updated->warehouse_id);
        $this->assertNotNull($updated->warehouse_id);
    }
}
