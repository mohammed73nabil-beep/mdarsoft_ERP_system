<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePurchaseReturnRequest;
use App\Models\Branch;
use App\Models\Contact;
use App\Models\PurchaseOrder;
use App\Models\PurchaseReturn;
use App\Models\PurchaseReturnLine;
use App\Models\Warehouse;
use App\Services\PurchaseService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PurchaseReturnController extends Controller
{
    public function __construct(
        protected PurchaseService $purchaseService
    ) {}

    /**
     * Display a listing of purchase returns.
     */
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->can('purchases.returns_list.view'), 403, 'غير مصرح لك بعرض مرتجعات المشتريات.');

        $user = $request->user();
        $query = PurchaseReturn::query()
            ->with([
                'originalPurchase:id,order_number',
                'contact:id,name,phone',
                'branch:id,name',
                'warehouse:id,name',
                'user:id,name',
            ])
            ->withCount('lines');

        // Branch isolation
        if ($user && !$user->can('branches.view_all') && $user->branch_id) {
            $query->where('branch_id', $user->branch_id);
        }

        // Filters
        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->filled('warehouse_id')) {
            $query->where('warehouse_id', $request->warehouse_id);
        }

        if ($request->filled('contact_id')) {
            $query->where('contact_id', $request->contact_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('return_number', 'like', "%{$search}%")
                    ->orWhere('notes', 'like', "%{$search}%")
                    ->orWhereHas('contact', fn ($sq) => $sq->where('name', 'like', "%{$search}%"))
                    ->orWhereHas('originalPurchase', fn ($sq) => $sq->where('order_number', 'like', "%{$search}%"));
            });
        }

        if ($request->filled('date_from')) {
            $query->whereDate('date', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('date', '<=', $request->date_to);
        }

        $metricsQuery = clone $query;
        $totalReturns = (float) $metricsQuery->sum('total_amount');
        $totalTax     = (float) $metricsQuery->sum('tax_amount');
        $totalCount   = $metricsQuery->count();

        $returns = $query->latest('id')->paginate(15)->withQueryString();

        $branches = Branch::where('is_active', true)->select('id', 'name')->get();
        $warehouses = Warehouse::where('is_active', true)->select('id', 'name', 'branch_id')->get();
        $suppliers = Contact::whereIn('type', ['supplier', 'both'])
            ->where('is_active', true)
            ->select('id', 'name')
            ->get();

        return Inertia::render('Purchases/Returns/Index', [
            'returns'   => $returns,
            'filters'   => $request->only(['search', 'branch_id', 'warehouse_id', 'contact_id', 'date_from', 'date_to']),
            'metrics'   => [
                'total_returns' => $totalReturns,
                'total_tax'     => $totalTax,
                'total_count'   => $totalCount,
            ],
            'branches'   => $branches,
            'warehouses' => $warehouses,
            'suppliers'  => $suppliers,
        ]);
    }

    /**
     * Show the form for creating a new purchase return.
     */
    public function create(Request $request): Response
    {
        abort_unless($request->user()?->can('purchases.returns_list.view'), 403, 'غير مصرح لك بإنشاء مرتجع مشتريات.');

        $orderId = $request->query('order_id');
        $selectedOrder = null;

        if ($orderId) {
            $selectedOrder = PurchaseOrder::with([
                'contact:id,name,phone,tax_number',
                'branch:id,name',
                'warehouse:id,name',
                'lines.product:id,name,sku,tracking_type',
                'lines.variation:id,name,sku',
                'lines.serials.serial:id,serial_number,status,cost_price',
            ])->find($orderId);

            if ($selectedOrder) {
                // Calculate already returned quantities
                foreach ($selectedOrder->lines as $line) {
                    $alreadyReturned = (float) PurchaseReturnLine::where('original_line_id', $line->id)
                        ->whereHas('purchaseReturn', fn ($q) => $q->where('status', '!=', 'cancelled'))
                        ->sum('quantity');
                    $line->already_returned_qty = $alreadyReturned;
                    $line->available_return_qty = max(0, (float) $line->quantity - $alreadyReturned);
                }
            }
        }

        $orders = PurchaseOrder::where('status', 'received')
            ->latest('id')
            ->limit(30)
            ->select('id', 'order_number', 'date', 'contact_id', 'total_amount')
            ->with('contact:id,name')
            ->get();

        return Inertia::render('Purchases/Returns/Create', [
            'selectedOrder' => $selectedOrder,
            'orders'        => $orders,
        ]);
    }

    /**
     * Store a newly created purchase return.
     */
    public function store(StorePurchaseReturnRequest $request): RedirectResponse
    {
        $data = $request->validated();

        try {
            $return = $this->purchaseService->createReturn($data);
            return redirect()->route('purchases.returns.show', $return->id)
                ->with('success', 'تم إنشاء مرتجع المشتريات بنجاح برقم ' . $return->return_number);
        } catch (\Throwable $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    /**
     * Display the specified purchase return.
     */
    public function show(Request $request, PurchaseReturn $purchaseReturn): Response
    {
        abort_unless($request->user()?->can('purchases.returns_list.view'), 403, 'غير مصرح لك بعرض مرتجع المشتريات.');

        $purchaseReturn->load([
            'originalPurchase:id,order_number,date',
            'contact:id,name,phone,tax_number',
            'branch:id,name',
            'warehouse:id,name',
            'user:id,name',
            'lines.product:id,name,sku,tracking_type',
            'lines.variation:id,name,sku',
            'lines.serials.serial:id,serial_number',
        ]);

        return Inertia::render('Purchases/Returns/Show', [
            'purchaseReturn' => $purchaseReturn,
        ]);
    }
}
