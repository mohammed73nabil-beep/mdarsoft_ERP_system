<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreInventoryTransferRequest;
use App\Models\FiscalYear;
use App\Models\InventoryTransfer;
use App\Models\InventoryTransferLine;
use App\Models\Product;
use App\Models\ProductSerial;
use App\Models\StockBalance;
use App\Models\Warehouse;
use App\Services\DocumentSequenceService;
use App\Services\InventoryTransferService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class InventoryTransferController extends Controller
{
    public function __construct(
        protected InventoryTransferService $transferService,
        protected DocumentSequenceService $sequenceService
    ) {}

    /**
     * Display a paginated listing of inventory transfers.
     */
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->can('inventory.transfers_list.view'), 403, 'غير مصرح لك بعرض قائمة تحويلات المخزون.');

        $user = $request->user();
        $allowedWarehouseIds = $this->getAllowedWarehouseIds($user);

        $query = InventoryTransfer::query()
            ->with(['fromWarehouse.branch:id,name', 'toWarehouse.branch:id,name', 'fiscalYear:id,name', 'creator:id,name', 'receiver:id,name'])
            ->withCount('lines');

        if ($user && !$user->can('branches.view_all') && $user->branch_id) {
            $query->where(function ($q) use ($allowedWarehouseIds) {
                $q->whereIn('from_warehouse_id', $allowedWarehouseIds)
                  ->orWhereIn('to_warehouse_id', $allowedWarehouseIds);
            });
        }

        if ($request->filled('from_warehouse_id')) {
            $query->where('from_warehouse_id', $request->from_warehouse_id);
        }

        if ($request->filled('to_warehouse_id')) {
            $query->where('to_warehouse_id', $request->to_warehouse_id);
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

        $transfers = $query->latest('id')->paginate(25)->withQueryString();

        return Inertia::render('Inventory/Transfers/Index', [
            'transfers'  => $transfers,
            'filters'    => $request->only(['from_warehouse_id', 'to_warehouse_id', 'status', 'date_from', 'date_to']),
            'warehouses' => Warehouse::whereIn('id', $allowedWarehouseIds)->select('id', 'name')->get(),
            'allWarehouses' => Warehouse::select('id', 'name')->get(),
        ]);
    }

    /**
     * Show the form for creating a new transfer.
     */
    public function create(Request $request): Response
    {
        abort_unless($request->user()?->can('inventory.transfer_create.view'), 403, 'غير مصرح لك بإنشاء تحويل مخزون.');

        $user = $request->user();
        $allowedWarehouseIds = $this->getAllowedWarehouseIds($user);

        $products = Product::where('is_active', true)
            ->with(['variations:id,product_id,name,sku,cost_price', 'unit:id,name,symbol'])
            ->select('id', 'name', 'sku', 'barcode', 'tracking_type', 'cost_price', 'unit_id')
            ->get();

        return Inertia::render('Inventory/Transfers/Create', [
            'fromWarehouses' => Warehouse::whereIn('id', $allowedWarehouseIds)->select('id', 'name', 'branch_id')->get(),
            'toWarehouses'   => Warehouse::select('id', 'name', 'branch_id')->get(),
            'products'       => $products,
        ]);
    }

    /**
     * Store a newly created inventory transfer.
     */
    public function store(StoreInventoryTransferRequest $request): RedirectResponse
    {
        $user = $request->user();
        $fromWarehouse = Warehouse::findOrFail($request->from_warehouse_id);
        $branchId = $fromWarehouse->branch_id ?? $user->branch_id;
        $fiscalYear = FiscalYear::where('status', 'open')->first() ?? FiscalYear::first();

        $transfer = DB::transaction(function () use ($request, $user, $branchId, $fiscalYear) {
            $trfNumber = $this->sequenceService->getNextNumber($branchId, $fiscalYear->id, 'transfer', 'ITR');

            $transfer = InventoryTransfer::create([
                'transfer_number'   => $trfNumber,
                'date'              => $request->date,
                'fiscal_year_id'    => $fiscalYear->id,
                'from_warehouse_id' => $request->from_warehouse_id,
                'to_warehouse_id'   => $request->to_warehouse_id,
                'status'            => 'draft',
                'notes'             => $request->notes,
                'created_by'        => $user->id,
            ]);

            foreach ($request->lines as $lineData) {
                $product = Product::findOrFail($lineData['product_id']);
                $variationId = $lineData['variation_id'] ?? null;

                // Determine unit cost from source balance (ADR-25)
                $sourceBalance = StockBalance::where('product_id', $product->id)
                    ->where('warehouse_id', $request->from_warehouse_id)
                    ->where(function ($q) use ($variationId) {
                        if ($variationId === null) {
                            $q->whereNull('variation_id');
                        } else {
                            $q->where('variation_id', $variationId);
                        }
                    })
                    ->first();
                $unitCost = $sourceBalance ? (float) $sourceBalance->avg_cost : (float) ($product->cost_price ?? 0);

                $unitId = $lineData['unit_id'] ?? $product->unit_id;

                if ($product->tracking_type === 'serial') {
                    $serialIds = $lineData['serial_ids'] ?? [];
                    if (!empty($lineData['serial_id'])) {
                        $serialIds[] = $lineData['serial_id'];
                    }
                    $serialIds = array_unique(array_filter($serialIds));

                    foreach ($serialIds as $sid) {
                        $serial = ProductSerial::find($sid);
                        $itemCost = $serial ? (float) $serial->cost_price : $unitCost;

                        InventoryTransferLine::create([
                            'inventory_transfer_id' => $transfer->id,
                            'product_id'            => $product->id,
                            'variation_id'          => $variationId,
                            'serial_id'             => $sid,
                            'quantity'              => 1,
                            'unit_id'               => $unitId,
                            'unit_cost'             => $itemCost,
                            'notes'                 => $lineData['notes'] ?? null,
                        ]);
                    }
                } else {
                    InventoryTransferLine::create([
                        'inventory_transfer_id' => $transfer->id,
                        'product_id'            => $product->id,
                        'variation_id'          => $variationId,
                        'serial_id'             => null,
                        'quantity'              => (float) $lineData['quantity'],
                        'unit_id'               => $unitId,
                        'unit_cost'             => $unitCost,
                        'notes'                 => $lineData['notes'] ?? null,
                    ]);
                }
            }

            if ($request->input('action') === 'send') {
                $this->transferService->send($transfer);
            }

            return $transfer;
        });

        return redirect()->route('inventory.transfers.show', $transfer->id)
            ->with('success', 'تم إنشاء تحويل المخزون بنجاح.');
    }

    /**
     * Display the specified transfer.
     */
    public function show(Request $request, InventoryTransfer $transfer): Response
    {
        abort_unless($request->user()?->can('inventory.transfers_list.view'), 403, 'غير مصرح لك بعرض تفاصيل التحويل.');

        $transfer->load([
            'fromWarehouse.branch:id,name',
            'toWarehouse.branch:id,name',
            'fiscalYear:id,name',
            'creator:id,name',
            'receiver:id,name',
            'lines.product:id,name,sku,tracking_type',
            'lines.variation:id,name,sku',
            'lines.serial:id,serial_number,imei1,imei2,status',
        ]);

        return Inertia::render('Inventory/Transfers/Show', [
            'transfer' => $transfer,
        ]);
    }

    /**
     * Send transfer (deducts from source warehouse and transitions serials to transferred).
     */
    public function send(Request $request, InventoryTransfer $transfer): RedirectResponse
    {
        abort_unless($request->user()?->can('inventory.transfers_list.view'), 403, 'غير مصرح لك بإرسال التحويل.');

        $this->transferService->send($transfer);

        return back()->with('success', 'تم إرسال التحويل وخصم الكميات من المستودع المصدر بنجاح.');
    }

    /**
     * Receive transfer (adds to destination warehouse and transitions serials to in_stock).
     */
    public function receive(Request $request, InventoryTransfer $transfer): RedirectResponse
    {
        abort_unless($request->user()?->can('inventory.transfers_list.view'), 403, 'غير مصرح لك باستلام التحويل.');

        $this->transferService->receive($transfer, $request->user()?->id);

        return back()->with('success', 'تم استلام التحويل وإيداع الكميات في المستودع الوجهة بنجاح.');
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
