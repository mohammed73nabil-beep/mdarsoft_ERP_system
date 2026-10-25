<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSaleReturnRequest;
use App\Models\Branch;
use App\Models\Contact;
use App\Models\SaleOrder;
use App\Models\SaleReturn;
use App\Models\Warehouse;
use App\Services\SaleService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SaleReturnController extends Controller
{
    public function __construct(
        protected SaleService $saleService
    ) {}

    /**
     * Display a listing of sale returns.
     */
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->can('sales.returns_list.view'), 403, 'غير مصرح لك بعرض قائمة مرتجع المبيعات.');

        $user = $request->user();
        $query = SaleReturn::query()
            ->with([
                'originalSale:id,order_number',
                'contact:id,name,phone',
                'branch:id,name',
                'warehouse:id,name',
                'user:id,name',
            ])
            ->withCount('lines');

        if ($user && !$user->can('branches.view_all') && $user->branch_id) {
            $query->where('branch_id', $user->branch_id);
        }

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
                    ->orWhereHas('originalSale', fn ($sq) => $sq->where('order_number', 'like', "%{$search}%"));
            });
        }

        if ($request->filled('date_from')) {
            $query->whereDate('date', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('date', '<=', $request->date_to);
        }

        $returns = $query->orderByDesc('id')
            ->paginate($request->integer('per_page', 15))
            ->withQueryString();

        $branchesQuery = Branch::select('id', 'name');
        if ($user && !$user->can('branches.view_all') && $user->branch_id) {
            $branchesQuery->where('id', $user->branch_id);
        }

        return Inertia::render('Sales/Returns/Index', [
            'returns'    => $returns,
            'filters'    => $request->only(['branch_id', 'warehouse_id', 'contact_id', 'search', 'date_from', 'date_to', 'per_page']),
            'branches'   => $branchesQuery->get(),
            'warehouses' => Warehouse::select('id', 'name', 'branch_id')->get(),
            'customers'  => Contact::where('type', 'customer')->orWhere('type', 'both')->select('id', 'name')->get(),
        ]);
    }

    /**
     * Show the form for creating a new sale return.
     */
    public function create(Request $request): Response
    {
        abort_unless($request->user()?->can('sales.returns_list.view'), 403, 'غير مصرح لك بإنشاء مرتجع مبيعات.');

        $user = $request->user();
        $selectedSale = null;

        if ($request->filled('sale_id')) {
            $selectedSale = SaleOrder::with([
                'lines.product.unit',
                'lines.variation',
                'lines.serials.serial',
            ])->find($request->sale_id);
        }

        $salesQuery = SaleOrder::where('status', '!=', 'cancelled')
            ->select('id', 'order_number', 'date', 'contact_id', 'branch_id', 'warehouse_id', 'total_amount');

        if ($user && !$user->can('branches.view_all') && $user->branch_id) {
            $salesQuery->where('branch_id', $user->branch_id);
        }

        return Inertia::render('Sales/Returns/Create', [
            'sales'        => $salesQuery->orderByDesc('id')->limit(50)->get(),
            'selectedSale' => $selectedSale,
        ]);
    }

    /**
     * Store a newly created sale return in storage.
     */
    public function store(StoreSaleReturnRequest $request): RedirectResponse
    {
        $return = $this->saleService->createReturn($request->validated());

        return redirect()->route('sales.returns.show', $return->id)
            ->with('success', "تم تسجيل مرتجع المبيعات بنجاح برقم {$return->return_number}");
    }

    /**
     * Display the specified sale return.
     */
    public function show(Request $request, SaleReturn $saleReturn): Response
    {
        abort_unless($request->user()?->can('sales.returns_list.view'), 403, 'غير مصرح لك بعرض تفاصيل مرتجع المبيعات.');

        $user = $request->user();
        if ($user && !$user->can('branches.view_all') && $user->branch_id && $saleReturn->branch_id !== $user->branch_id) {
            abort(403, 'غير مصرح لك بعرض مرتجع تابع لفرع آخر.');
        }

        $saleReturn->load([
            'originalSale:id,order_number,date,total_amount',
            'contact',
            'branch',
            'warehouse',
            'user',
            'lines.product.unit',
            'lines.variation',
            'lines.serials.serial',
        ]);

        return Inertia::render('Sales/Returns/Show', [
            'saleReturn' => $saleReturn,
        ]);
    }
}
