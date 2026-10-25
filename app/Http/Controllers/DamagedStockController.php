<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreDamagedStockRequest;
use App\Models\DamagedStock;
use App\Models\DamagedStockLine;
use App\Models\FiscalYear;
use App\Models\Product;
use App\Models\ProductSerial;
use App\Models\StockBalance;
use App\Models\Warehouse;
use App\Services\DamagedStockService;
use App\Services\DocumentSequenceService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DamagedStockController extends Controller
{
    public function __construct(
        protected DamagedStockService $damagedStockService,
        protected DocumentSequenceService $sequenceService
    ) {}

    /**
     * Display a paginated listing of damaged stock vouchers.
     */
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->can('inventory.damaged_list.view'), 403, 'غير مصرح لك بعرض قائمة المخزون التالف.');

        $user = $request->user();
        $allowedWarehouseIds = $this->getAllowedWarehouseIds($user);

        $query = DamagedStock::query()
            ->with(['branch:id,name', 'warehouse:id,name', 'fiscalYear:id,name', 'creator:id,name'])
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

        $damagedStocks = $query->latest('id')->paginate(25)->withQueryString();

        return Inertia::render('Inventory/Damaged/Index', [
            'damagedStocks' => $damagedStocks,
            'filters'       => $request->only(['warehouse_id', 'status', 'date_from', 'date_to']),
            'warehouses'    => Warehouse::whereIn('id', $allowedWarehouseIds)->select('id', 'name')->get(),
        ]);
    }

    /**
     * Show the form for creating a new damaged stock voucher.
     */
    public function create(Request $request): Response
    {
        abort_unless($request->user()?->can('inventory.damaged_create.view'), 403, 'غير مصرح لك بإضافة مخزون تالف.');

        $user = $request->user();
        $allowedWarehouseIds = $this->getAllowedWarehouseIds($user);

        $products = Product::where('is_active', true)
            ->with(['variations:id,product_id,name,sku,cost_price', 'unit:id,name,symbol'])
            ->select('id', 'name', 'sku', 'barcode', 'tracking_type', 'cost_price', 'unit_id')
            ->get();

        return Inertia::render('Inventory/Damaged/Create', [
            'warehouses' => Warehouse::whereIn('id', $allowedWarehouseIds)->select('id', 'name', 'branch_id')->get(),
            'products'   => $products,
        ]);
    }

    /**
     * Store a newly created damaged stock voucher.
     */
    public function store(StoreDamagedStockRequest $request): RedirectResponse
    {
        $user = $request->user();
        $warehouse = Warehouse::findOrFail($request->warehouse_id);
        $branchId = $warehouse->branch_id ?? $user->branch_id;
        $fiscalYear = FiscalYear::where('status', 'open')->first() ?? FiscalYear::first();

        $damagedStock = DB::transaction(function () use ($request, $user, $branchId, $fiscalYear, $warehouse) {
            $refNumber = $this->sequenceService->getNextNumber($branchId, $fiscalYear->id, 'damaged', 'DMG');

            $voucher = DamagedStock::create([
                'reference_number' => $refNumber,
                'date'             => $request->date,
                'fiscal_year_id'   => $fiscalYear->id,
                'branch_id'        => $branchId,
                'warehouse_id'     => $warehouse->id,
                'total_cost'       => 0,
                'status'           => 'draft',
                'notes'            => $request->notes,
                'created_by'       => $user->id,
            ]);

            $totalCost = 0;

            foreach ($request->lines as $lineData) {
                $product = Product::findOrFail($lineData['product_id']);
                $variationId = $lineData['variation_id'] ?? null;

                // Determine default unit cost
                $sourceBalance = StockBalance::where('product_id', $product->id)
                    ->where('warehouse_id', $warehouse->id)
                    ->where(function ($q) use ($variationId) {
                        if ($variationId === null) {
                            $q->whereNull('variation_id');
                        } else {
                            $q->where('variation_id', $variationId);
                        }
                    })
                    ->first();
                $defaultCost = $sourceBalance ? (float) $sourceBalance->avg_cost : (float) ($product->cost_price ?? 0);
                $unitCost = isset($lineData['unit_cost']) && is_numeric($lineData['unit_cost'])
                    ? (float) $lineData['unit_cost']
                    : $defaultCost;

                if ($product->tracking_type === 'serial') {
                    $serialIds = $lineData['serial_ids'] ?? [];
                    if (!empty($lineData['serial_id'])) {
                        $serialIds[] = $lineData['serial_id'];
                    }
                    $serialIds = array_unique(array_filter($serialIds));

                    foreach ($serialIds as $sid) {
                        $serial = ProductSerial::find($sid);
                        $itemCost = $serial ? (float) $serial->cost_price : $unitCost;
                        $lineTotal = round($itemCost, 4);

                        DamagedStockLine::create([
                            'damaged_stock_id' => $voucher->id,
                            'product_id'       => $product->id,
                            'variation_id'     => $variationId,
                            'serial_id'        => $sid,
                            'quantity'         => 1,
                            'unit_cost'        => $itemCost,
                            'total_cost'       => $lineTotal,
                            'notes'            => $lineData['notes'] ?? null,
                        ]);

                        $totalCost += $lineTotal;
                    }
                } else {
                    $qty = (float) $lineData['quantity'];
                    $lineTotal = round($qty * $unitCost, 4);

                    DamagedStockLine::create([
                        'damaged_stock_id' => $voucher->id,
                        'product_id'       => $product->id,
                        'variation_id'     => $variationId,
                        'serial_id'        => null,
                        'quantity'         => $qty,
                        'unit_cost'        => $unitCost,
                        'total_cost'       => $lineTotal,
                        'notes'            => $lineData['notes'] ?? null,
                    ]);

                    $totalCost += $lineTotal;
                }
            }

            $voucher->total_cost = round($totalCost, 4);
            $voucher->save();

            if ($request->boolean('auto_post', false)) {
                $this->damagedStockService->post($voucher);
            }

            return $voucher;
        });

        return redirect()->route('inventory.damaged.show', $damagedStock->id)
            ->with('success', 'تم تسجيل سند المخزون التالف وترحيله بنجاح.');
    }

    /**
     * Display the specified damaged stock voucher.
     */
    public function show(Request $request, DamagedStock $damagedStock): Response
    {
        abort_unless($request->user()?->can('inventory.damaged_list.view'), 403, 'غير مصرح لك بعرض تفاصيل سند التالف.');

        $damagedStock->load([
            'branch:id,name',
            'warehouse:id,name',
            'fiscalYear:id,name',
            'creator:id,name',
            'lines.product:id,name,sku,tracking_type',
            'lines.variation:id,name,sku',
            'lines.serial:id,serial_number,imei1,imei2,status',
        ]);

        return Inertia::render('Inventory/Damaged/Show', [
            'damagedStock' => $damagedStock,
        ]);
    }

    /**
     * Post a draft damaged stock voucher.
     */
    public function post(Request $request, DamagedStock $damagedStock): RedirectResponse
    {
        abort_unless($request->user()?->can('inventory.damaged_create.view'), 403, 'غير مصرح لك بترحيل سند التالف.');

        $this->damagedStockService->post($damagedStock);

        return back()->with('success', 'تم ترحيل سند التالف وخصم الكميات من المخزون بنجاح.');
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
