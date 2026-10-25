<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreStockVoucherRequest;
use App\Models\FiscalYear;
use App\Models\Product;
use App\Models\ProductSerial;
use App\Models\StockAdjustment;
use App\Models\StockAdjustmentLine;
use App\Models\Warehouse;
use App\Services\DocumentSequenceService;
use App\Services\StockAdjustmentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class StockVoucherController extends Controller
{
    public function __construct(
        protected StockAdjustmentService $adjustmentService,
        protected DocumentSequenceService $sequenceService
    ) {}

    // ─────────────────────────────────────────────────────────────────────────
    // أذن إضافة (Receiving Voucher - In)
    // ─────────────────────────────────────────────────────────────────────────

    public function receivingIndex(Request $request): Response
    {
        abort_unless($request->user()?->can('inventory.receiving_voucher.view'), 403, 'غير مصرح لك بعرض أذونات الإضافة.');

        $user = $request->user();
        $allowedWarehouseIds = $this->getAllowedWarehouseIds($user);

        $query = StockAdjustment::query()
            ->where('type', 'receiving_voucher')
            ->with(['branch:id,name', 'warehouse:id,name', 'creator:id,name'])
            ->withCount('lines');

        if ($user && !$user->can('branches.view_all') && $user->branch_id) {
            $query->where('branch_id', $user->branch_id);
        }

        if ($request->filled('warehouse_id')) {
            $query->where('warehouse_id', $request->warehouse_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('date', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('date', '<=', $request->date_to);
        }

        $vouchers = $query->latest('id')->paginate(25)->withQueryString();

        return Inertia::render('Inventory/Vouchers/ReceivingIndex', [
            'vouchers' => $vouchers,
            'filters'  => $request->only(['warehouse_id', 'status', 'date_from', 'date_to']),
            'warehouses' => Warehouse::whereIn('id', $allowedWarehouseIds)->select('id', 'name')->get(),
        ]);
    }

    public function receivingCreate(Request $request): Response
    {
        abort_unless($request->user()?->can('inventory.receiving_voucher.view'), 403, 'غير مصرح لك بإنشاء أذن إضافة.');

        $user = $request->user();
        $allowedWarehouseIds = $this->getAllowedWarehouseIds($user);

        $products = Product::where('is_active', true)
            ->with(['variations:id,product_id,name,sku,cost_price', 'unit:id,name,symbol'])
            ->select('id', 'name', 'sku', 'barcode', 'tracking_type', 'cost_price', 'unit_id')
            ->get();

        return Inertia::render('Inventory/Vouchers/ReceivingCreate', [
            'warehouses' => Warehouse::whereIn('id', $allowedWarehouseIds)->select('id', 'name', 'branch_id')->get(),
            'products'   => $products,
        ]);
    }

    public function receivingStore(StoreStockVoucherRequest $request): RedirectResponse
    {
        $user = $request->user();
        $warehouse = Warehouse::findOrFail($request->warehouse_id);
        $branchId = $warehouse->branch_id ?? $user->branch_id;
        $fiscalYear = FiscalYear::where('status', 'open')->first() ?? FiscalYear::first();

        $voucher = DB::transaction(function () use ($request, $user, $branchId, $fiscalYear, $warehouse) {
            $adjNumber = $this->sequenceService->getNextNumber($branchId, $fiscalYear->id, 'stock_adjustment', 'RCV');

            $stockAdjustment = StockAdjustment::create([
                'adjustment_number' => $adjNumber,
                'type'              => 'receiving_voucher',
                'date'              => $request->date,
                'fiscal_year_id'    => $fiscalYear->id,
                'branch_id'         => $branchId,
                'warehouse_id'      => $warehouse->id,
                'status'            => 'draft',
                'notes'             => $request->notes,
                'created_by'        => $user->id,
            ]);

            foreach ($request->lines as $lineData) {
                $product = Product::findOrFail($lineData['product_id']);
                $unitCost = (float) ($lineData['unit_cost'] ?? $product->cost_price ?? 0);
                $variationId = $lineData['variation_id'] ?? null;

                if ($product->tracking_type === 'serial') {
                    $serials = $lineData['serials'] ?? [];
                    if (empty($serials)) {
                        $qty = (int) ($lineData['adjusted_quantity'] ?? 1);
                        for ($i = 1; $i <= $qty; $i++) {
                            $serialNum = 'RCV-' . $stockAdjustment->id . '-' . $product->id . '-' . fake()->unique()->numerify('######');
                            $serial = ProductSerial::create([
                                'product_id'    => $product->id,
                                'variation_id'  => $variationId,
                                'serial_number' => $serialNum,
                                'status'        => 'in_stock',
                                'warehouse_id'  => $warehouse->id,
                                'cost_price'    => $unitCost,
                            ]);
                            StockAdjustmentLine::create([
                                'stock_adjustment_id' => $stockAdjustment->id,
                                'product_id'          => $product->id,
                                'variation_id'        => $variationId,
                                'serial_id'           => $serial->id,
                                'adjusted_quantity'   => 1,
                                'direction'           => 'in',
                                'unit_cost'           => $unitCost,
                                'notes'               => $lineData['notes'] ?? null,
                            ]);
                        }
                    } else {
                        foreach ($serials as $serialItem) {
                            $serialNum = trim($serialItem['serial_number'] ?? '');
                            if (!$serialNum) continue;

                            $itemCost = isset($serialItem['cost_price']) && is_numeric($serialItem['cost_price'])
                                ? (float) $serialItem['cost_price']
                                : $unitCost;

                            $serial = ProductSerial::firstOrCreate(
                                ['serial_number' => $serialNum],
                                [
                                    'product_id'   => $product->id,
                                    'variation_id' => $variationId,
                                    'imei1'        => $serialItem['imei1'] ?? null,
                                    'imei2'        => $serialItem['imei2'] ?? null,
                                    'status'       => 'in_stock',
                                    'warehouse_id' => $warehouse->id,
                                    'cost_price'   => $itemCost,
                                ]
                            );

                            StockAdjustmentLine::create([
                                'stock_adjustment_id' => $stockAdjustment->id,
                                'product_id'          => $product->id,
                                'variation_id'        => $variationId,
                                'serial_id'           => $serial->id,
                                'adjusted_quantity'   => 1,
                                'direction'           => 'in',
                                'unit_cost'           => $itemCost,
                                'notes'               => $lineData['notes'] ?? null,
                            ]);
                        }
                    }
                } else {
                    StockAdjustmentLine::create([
                        'stock_adjustment_id' => $stockAdjustment->id,
                        'product_id'          => $product->id,
                        'variation_id'        => $variationId,
                        'serial_id'           => null,
                        'adjusted_quantity'   => (float) $lineData['adjusted_quantity'],
                        'direction'           => 'in',
                        'unit_cost'           => $unitCost,
                        'notes'               => $lineData['notes'] ?? null,
                    ]);
                }
            }

            if ($request->input('auto_post', true)) {
                $this->adjustmentService->post($stockAdjustment);
            }

            return $stockAdjustment;
        });

        return redirect()->route('inventory.vouchers.receiving.show', $voucher->id)
            ->with('success', 'تم حفظ أذن الإضافة وترحيله بنجاح.');
    }

    public function receivingShow(Request $request, StockAdjustment $voucher): Response
    {
        abort_unless($request->user()?->can('inventory.receiving_voucher.view'), 403, 'غير مصرح لك بعرض أذن الإضافة.');

        $voucher->load([
            'branch:id,name',
            'warehouse:id,name',
            'fiscalYear:id,name',
            'creator:id,name',
            'lines.product:id,name,sku,tracking_type',
            'lines.variation:id,name,sku',
            'lines.serial:id,serial_number,imei1,imei2,status',
        ]);

        return Inertia::render('Inventory/Vouchers/ReceivingShow', [
            'voucher' => $voucher,
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // أذن صرف (Delivery Voucher - Out)
    // ─────────────────────────────────────────────────────────────────────────

    public function deliveryIndex(Request $request): Response
    {
        abort_unless($request->user()?->can('inventory.delivery_voucher.view'), 403, 'غير مصرح لك بعرض أذونات الصرف.');

        $user = $request->user();
        $allowedWarehouseIds = $this->getAllowedWarehouseIds($user);

        $query = StockAdjustment::query()
            ->where('type', 'delivery_voucher')
            ->with(['branch:id,name', 'warehouse:id,name', 'creator:id,name'])
            ->withCount('lines');

        if ($user && !$user->can('branches.view_all') && $user->branch_id) {
            $query->where('branch_id', $user->branch_id);
        }

        if ($request->filled('warehouse_id')) {
            $query->where('warehouse_id', $request->warehouse_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('date', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('date', '<=', $request->date_to);
        }

        $vouchers = $query->latest('id')->paginate(25)->withQueryString();

        return Inertia::render('Inventory/Vouchers/DeliveryIndex', [
            'vouchers' => $vouchers,
            'filters'  => $request->only(['warehouse_id', 'status', 'date_from', 'date_to']),
            'warehouses' => Warehouse::whereIn('id', $allowedWarehouseIds)->select('id', 'name')->get(),
        ]);
    }

    public function deliveryCreate(Request $request): Response
    {
        abort_unless($request->user()?->can('inventory.delivery_voucher.view'), 403, 'غير مصرح لك بإنشاء أذن صرف.');

        $user = $request->user();
        $allowedWarehouseIds = $this->getAllowedWarehouseIds($user);

        $products = Product::where('is_active', true)
            ->with(['variations:id,product_id,name,sku,cost_price', 'unit:id,name,symbol'])
            ->select('id', 'name', 'sku', 'barcode', 'tracking_type', 'cost_price', 'unit_id')
            ->get();

        return Inertia::render('Inventory/Vouchers/DeliveryCreate', [
            'warehouses' => Warehouse::whereIn('id', $allowedWarehouseIds)->select('id', 'name', 'branch_id')->get(),
            'products'   => $products,
        ]);
    }

    public function deliveryStore(StoreStockVoucherRequest $request): RedirectResponse
    {
        $user = $request->user();
        $warehouse = Warehouse::findOrFail($request->warehouse_id);
        $branchId = $warehouse->branch_id ?? $user->branch_id;
        $fiscalYear = FiscalYear::where('status', 'open')->first() ?? FiscalYear::first();

        $voucher = DB::transaction(function () use ($request, $user, $branchId, $fiscalYear, $warehouse) {
            $adjNumber = $this->sequenceService->getNextNumber($branchId, $fiscalYear->id, 'stock_adjustment', 'DLV');

            $stockAdjustment = StockAdjustment::create([
                'adjustment_number' => $adjNumber,
                'type'              => 'delivery_voucher',
                'date'              => $request->date,
                'fiscal_year_id'    => $fiscalYear->id,
                'branch_id'         => $branchId,
                'warehouse_id'      => $warehouse->id,
                'status'            => 'draft',
                'notes'             => $request->notes,
                'created_by'        => $user->id,
            ]);

            foreach ($request->lines as $lineData) {
                $product = Product::findOrFail($lineData['product_id']);
                $unitCost = (float) ($lineData['unit_cost'] ?? $product->cost_price ?? 0);
                $variationId = $lineData['variation_id'] ?? null;

                if ($product->tracking_type === 'serial') {
                    $serialIds = $lineData['serial_ids'] ?? [];
                    if (!empty($lineData['serial_id'])) {
                        $serialIds[] = $lineData['serial_id'];
                    }
                    $serialIds = array_unique(array_filter($serialIds));

                    foreach ($serialIds as $sid) {
                        $serial = ProductSerial::find($sid);
                        $cost = $serial ? (float) $serial->cost_price : $unitCost;

                        StockAdjustmentLine::create([
                            'stock_adjustment_id' => $stockAdjustment->id,
                            'product_id'          => $product->id,
                            'variation_id'        => $variationId,
                            'serial_id'           => $sid,
                            'adjusted_quantity'   => 1,
                            'direction'           => 'out',
                            'unit_cost'           => $cost,
                            'notes'               => $lineData['notes'] ?? null,
                        ]);
                    }
                } else {
                    StockAdjustmentLine::create([
                        'stock_adjustment_id' => $stockAdjustment->id,
                        'product_id'          => $product->id,
                        'variation_id'        => $variationId,
                        'serial_id'           => null,
                        'adjusted_quantity'   => (float) $lineData['adjusted_quantity'],
                        'direction'           => 'out',
                        'unit_cost'           => $unitCost,
                        'notes'               => $lineData['notes'] ?? null,
                    ]);
                }
            }

            if ($request->input('auto_post', true)) {
                $this->adjustmentService->post($stockAdjustment);
            }

            return $stockAdjustment;
        });

        return redirect()->route('inventory.vouchers.delivery.show', $voucher->id)
            ->with('success', 'تم حفظ أذن الصرف وترحيله بنجاح.');
    }

    public function deliveryShow(Request $request, StockAdjustment $voucher): Response
    {
        abort_unless($request->user()?->can('inventory.delivery_voucher.view'), 403, 'غير مصرح لك بعرض أذن الصرف.');

        $voucher->load([
            'branch:id,name',
            'warehouse:id,name',
            'fiscalYear:id,name',
            'creator:id,name',
            'lines.product:id,name,sku,tracking_type',
            'lines.variation:id,name,sku',
            'lines.serial:id,serial_number,imei1,imei2,status',
        ]);

        return Inertia::render('Inventory/Vouchers/DeliveryShow', [
            'voucher' => $voucher,
        ]);
    }

    public function post(Request $request, StockAdjustment $voucher): RedirectResponse
    {
        $perm = $voucher->type === 'delivery_voucher'
            ? 'inventory.delivery_voucher.view'
            : 'inventory.receiving_voucher.view';

        abort_unless($request->user()?->can($perm), 403, 'غير مصرح لك بترحيل السند.');

        $this->adjustmentService->post($voucher);

        return back()->with('success', 'تم ترحيل السند وتحديث المخزون بنجاح.');
    }

    private function getAllowedWarehouseIds(?object $user): array
    {
        $branchWarehouses = Warehouse::query();
        if ($user && !$user->can('branches.view_all') && $user->branch_id) {
            $branchWarehouses->where('branch_id', $user->branch_id);
        }
        return $branchWarehouses->pluck('id')->toArray();
    }
}
