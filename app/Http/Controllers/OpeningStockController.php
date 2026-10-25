<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreOpeningStockRequest;
use App\Models\FiscalYear;
use App\Models\OpeningStock;
use App\Models\OpeningStockLine;
use App\Models\Product;
use App\Models\ProductSerial;
use App\Models\Warehouse;
use App\Services\OpeningStockService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class OpeningStockController extends Controller
{
    public function __construct(
        protected OpeningStockService $openingStockService
    ) {}

    /**
     * Display a paginated listing of opening stock vouchers.
     */
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->can('inventory.view'), 403, 'غير مصرح لك بعرض بضاعة أول المدة.');

        $user = $request->user();
        $allowedWarehouseIds = $this->getAllowedWarehouseIds($user);

        $query = OpeningStock::query()
            ->with(['branch:id,name', 'fiscalYear:id,name', 'creator:id,name'])
            ->withCount('lines');

        if ($user && !$user->can('branches.view_all') && $user->branch_id) {
            $query->where('branch_id', $user->branch_id);
        }

        if ($request->filled('warehouse_id')) {
            $warehouseId = (int) $request->warehouse_id;
            $query->whereHas('lines', fn ($lq) => $lq->where('warehouse_id', $warehouseId));
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

        $openingStocks = $query->latest('id')->paginate(25)->withQueryString();

        return Inertia::render('Inventory/OpeningStock/Index', [
            'openingStocks' => $openingStocks,
            'filters' => $request->only(['warehouse_id', 'status', 'date_from', 'date_to']),
            'warehouses' => Warehouse::whereIn('id', $allowedWarehouseIds)->select('id', 'name')->get(),
        ]);
    }

    /**
     * Show the form for creating opening stock.
     */
    public function create(Request $request): Response
    {
        abort_unless($request->user()?->can('products.add_opening_stock.view'), 403, 'غير مصرح لك بإضافة بضاعة أول المدة.');

        $user = $request->user();
        $allowedWarehouseIds = $this->getAllowedWarehouseIds($user);

        $products = Product::where('is_active', true)
            ->with(['variations:id,product_id,name,sku,cost_price', 'unit:id,name,symbol'])
            ->select('id', 'name', 'sku', 'barcode', 'tracking_type', 'type', 'cost_price', 'unit_id')
            ->get();

        return Inertia::render('Inventory/OpeningStock/Create', [
            'warehouses' => Warehouse::whereIn('id', $allowedWarehouseIds)->select('id', 'name', 'branch_id')->get(),
            'products'   => $products,
        ]);
    }

    /**
     * Store opening stock voucher.
     */
    public function store(StoreOpeningStockRequest $request): RedirectResponse
    {
        $user = $request->user();
        $warehouse = Warehouse::findOrFail($request->warehouse_id);
        $branchId = $warehouse->branch_id ?? $user->branch_id;

        $fiscalYear = FiscalYear::where('status', 'open')->first()
            ?? FiscalYear::first();

        $openingStock = DB::transaction(function () use ($request, $user, $branchId, $fiscalYear, $warehouse) {
            $voucher = OpeningStock::create([
                'fiscal_year_id' => $fiscalYear?->id,
                'branch_id'      => $branchId,
                'date'           => $request->date,
                'status'         => 'draft',
                'notes'          => $request->notes,
                'created_by'     => $user->id,
            ]);

            foreach ($request->lines as $lineData) {
                $product = Product::findOrFail($lineData['product_id']);
                $unitCost = (float) $lineData['unit_cost'];
                $variationId = $lineData['variation_id'] ?? null;

                if ($product->tracking_type === 'serial') {
                    $serials = $lineData['serials'] ?? [];
                    if (empty($serials)) {
                        // Fallback: create placeholder serial records based on quantity
                        $qty = (int) ($lineData['quantity'] ?? 1);
                        for ($i = 1; $i <= $qty; $i++) {
                            $serialNum = 'OPN-' . $voucher->id . '-' . $product->id . '-' . fake()->unique()->numerify('######');
                            $serial = ProductSerial::create([
                                'product_id'    => $product->id,
                                'variation_id'  => $variationId,
                                'serial_number' => $serialNum,
                                'status'        => 'in_stock',
                                'warehouse_id'  => $warehouse->id,
                                'cost_price'    => $unitCost,
                            ]);
                            OpeningStockLine::create([
                                'opening_stock_id' => $voucher->id,
                                'product_id'       => $product->id,
                                'variation_id'     => $variationId,
                                'warehouse_id'     => $warehouse->id,
                                'serial_id'        => $serial->id,
                                'quantity'         => 1,
                                'unit_cost'        => $unitCost,
                            ]);
                        }
                    } else {
                        foreach ($serials as $serialItem) {
                            $serialNum = trim($serialItem['serial_number'] ?? '');
                            if (!$serialNum) {
                                continue;
                            }
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

                            OpeningStockLine::create([
                                'opening_stock_id' => $voucher->id,
                                'product_id'       => $product->id,
                                'variation_id'     => $variationId,
                                'warehouse_id'     => $warehouse->id,
                                'serial_id'        => $serial->id,
                                'quantity'         => 1,
                                'unit_cost'        => $itemCost,
                            ]);
                        }
                    }
                } else {
                    OpeningStockLine::create([
                        'opening_stock_id' => $voucher->id,
                        'product_id'       => $product->id,
                        'variation_id'     => $variationId,
                        'warehouse_id'     => $warehouse->id,
                        'serial_id'        => null,
                        'quantity'         => (float) $lineData['quantity'],
                        'unit_cost'        => $unitCost,
                    ]);
                }
            }

            if ($request->input('auto_post', true)) {
                $this->openingStockService->post($voucher);
            }

            return $voucher;
        });

        return redirect()->route('inventory.opening_stock.show', $openingStock->id)
            ->with('success', 'تم حفظ وترحيل سند بضاعة أول المدة بنجاح.');
    }

    /**
     * Display the specified opening stock voucher.
     */
    public function show(Request $request, OpeningStock $openingStock): Response
    {
        abort_unless($request->user()?->can('inventory.view'), 403, 'غير مصرح لك بعرض تفاصيل السند.');

        $user = $request->user();
        if ($user && !$user->can('branches.view_all') && $user->branch_id && $openingStock->branch_id !== $user->branch_id) {
            abort(403, 'غير مصرح لك بعرض بيانات فرع آخر.');
        }

        $openingStock->load([
            'branch:id,name',
            'fiscalYear:id,name',
            'creator:id,name',
            'lines.product:id,name,sku,tracking_type',
            'lines.variation:id,name,sku',
            'lines.warehouse:id,name',
            'lines.serial:id,serial_number,imei1,imei2,status',
        ]);

        return Inertia::render('Inventory/OpeningStock/Show', [
            'openingStock' => $openingStock,
        ]);
    }

    /**
     * Post a draft opening stock voucher.
     */
    public function post(Request $request, OpeningStock $openingStock): RedirectResponse
    {
        abort_unless($request->user()?->can('products.add_opening_stock.view'), 403, 'غير مصرح لك بترحيل السند.');

        $this->openingStockService->post($openingStock);

        return back()->with('success', 'تم ترحيل سند بضاعة أول المدة وتحديث المخزون بنجاح.');
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
