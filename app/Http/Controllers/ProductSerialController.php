<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSerialBatchRequest;
use App\Models\Product;
use App\Models\ProductSerial;
use App\Models\SerialEvent;
use App\Models\Warehouse;
use App\Services\SerialStateMachine;
use App\Services\StockService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ProductSerialController extends Controller
{
    public function __construct(
        protected SerialStateMachine $serialStateMachine,
        protected StockService $stockService
    ) {}

    /**
     * Serial tracking index: search by serial_number, imei1, imei2 and view event history.
     */
    public function index(Request $request): Response|JsonResponse
    {
        abort_unless($request->user()?->can('serials.view'), 403, 'غير مصرح لك بعرض شاشة تتبع الأرقام التسلسلية.');

        $user = $request->user();
        $branchWarehouses = Warehouse::query();
        if ($user && !$user->can('branches.view_all') && $user->branch_id) {
            $branchWarehouses->where('branch_id', $user->branch_id);
        }
        $allowedWarehouseIds = $branchWarehouses->pluck('id')->toArray();

        $query = ProductSerial::query()
            ->with(['product:id,name,sku', 'warehouse:id,name', 'events.creator:id,name'])
            ->whereIn('warehouse_id', $allowedWarehouseIds);

        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('serial_number', 'like', "%{$search}%")
                    ->orWhere('imei1', 'like', "%{$search}%")
                    ->orWhere('imei2', 'like', "%{$search}%")
                    ->orWhereHas('product', fn ($pq) => $pq->where('name', 'like', "%{$search}%")->orWhere('sku', 'like', "%{$search}%"));
            });
        }

        if ($request->filled('product_id')) {
            $query->where('product_id', $request->product_id);
        }
        if ($request->filled('warehouse_id')) {
            $query->where('warehouse_id', $request->warehouse_id);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $serials = $query->latest('id')->paginate(25)->withQueryString();

        if ($request->wantsJson()) {
            return response()->json($serials);
        }

        return Inertia::render('Products/Serials', [
            'serials' => $serials,
            'filters' => $request->only(['search', 'product_id', 'warehouse_id', 'status']),
            'products' => Product::where('tracking_type', 'serial')->select('id', 'name', 'sku')->get(),
            'warehouses' => Warehouse::whereIn('id', $allowedWarehouseIds)->select('id', 'name')->get(),
            'statuses' => [
                ['id' => 'in_stock', 'name' => 'في المخزن (in_stock)'],
                ['id' => 'sold', 'name' => 'تم البيع (sold)'],
                ['id' => 'returned', 'name' => 'مرتجع عميل (returned)'],
                ['id' => 'damaged', 'name' => 'تالف (damaged)'],
                ['id' => 'transferred', 'name' => 'قيد التحويل (transferred)'],
                ['id' => 'returned_to_supplier', 'name' => 'مرتجع لمورد (returned_to_supplier)'],
            ],
        ]);
    }

    /**
     * Store batch of serial numbers / IMEIs atomically.
     */
    public function storeBatch(StoreSerialBatchRequest $request): JsonResponse|RedirectResponse
    {
        $data = $request->validated();
        $productId = (int) $data['product_id'];
        $warehouseId = (int) $data['warehouse_id'];
        $product = Product::findOrFail($productId);

        abort_unless($product->tracking_type === 'serial', 422, 'هذا المنتج ليس من النوع متتبع بالسيريال.');

        $insertedSerials = DB::transaction(function () use ($productId, $warehouseId, $product, $data) {
            $serials = [];
            foreach ($data['serials'] as $item) {
                $cost = isset($item['cost_price']) && $item['cost_price'] !== ''
                    ? (float) $item['cost_price']
                    : (float) $product->cost_price;

                $serial = ProductSerial::create([
                    'product_id' => $productId,
                    'variation_id' => null,
                    'warehouse_id' => $warehouseId,
                    'serial_number' => $item['serial_number'],
                    'imei1' => !empty($item['imei1']) ? $item['imei1'] : null,
                    'imei2' => !empty($item['imei2']) ? $item['imei2'] : null,
                    'cost_price' => $cost,
                    'status' => 'in_stock',
                ]);

                // Create initial entry event
                SerialEvent::create([
                    'serial_id' => $serial->id,
                    'event_type' => 'purchased',
                    'from_warehouse_id' => null,
                    'to_warehouse_id' => $warehouseId,
                    'from_status' => null,
                    'to_status' => 'in_stock',
                    'unit_cost' => $cost,
                    'created_by' => Auth::id(),
                    'created_at' => now(),
                    'notes' => 'إدخال سيريال أولي للمنتج',
                ]);

                // Record stock movement (1 movement per serial)
                $this->stockService->recordIn(
                    productId: $productId,
                    variationId: null,
                    warehouseId: $warehouseId,
                    quantity: 1,
                    unitCost: $cost,
                    movementType: 'adjust_in',
                    serialId: $serial->id,
                    notes: "إدخال أولي للجهاز بالسيريال #{$serial->serial_number}"
                );

                $serials[] = $serial;
            }

            return $serials;
        });

        if ($request->wantsJson()) {
            return response()->json([
                'message' => 'تم حفظ السيريالات بنجاح وتحديث أرصدة المخزون.',
                'count' => count($insertedSerials),
            ], 201);
        }

        return back()->with('success', "تم إدخال " . count($insertedSerials) . " جهاز بنجاح وتحديث المخزون.");
    }

    /**
     * Transition serial status using SerialStateMachine.
     */
    public function transition(Request $request, ProductSerial $serial): JsonResponse|RedirectResponse
    {
        $request->validate([
            'to_status' => ['required', 'string', 'in:in_stock,sold,returned,damaged,transferred,returned_to_supplier'],
            'warehouse_id' => ['nullable', 'exists:warehouses,id'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $toStatus = $request->input('to_status');
        $context = [
            'notes' => $request->input('notes'),
            'to_warehouse_id' => $request->input('warehouse_id', $serial->warehouse_id),
            'warehouse_id' => $request->input('warehouse_id', $serial->warehouse_id),
        ];

        // Permission check for accept return
        if ($serial->status === 'returned' && $toStatus === 'in_stock') {
            abort_unless($request->user()?->can('serials.accept_return'), 403, 'ليس لديك صلاحية قبول المرتجع بالمخزن.');
        }

        $this->serialStateMachine->transition($serial, $toStatus, $context);

        if ($request->wantsJson()) {
            return response()->json([
                'message' => 'تم تحديث حالة السيريال بنجاح.',
                'serial' => $serial->fresh(['events']),
            ]);
        }

        return back()->with('success', 'تم تحديث حالة السيريال بنجاح.');
    }
}
