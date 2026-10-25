<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreQuotationRequest;
use App\Models\Branch;
use App\Models\Contact;
use App\Models\Product;
use App\Models\Quotation;
use App\Models\Warehouse;
use App\Services\SaleService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class QuotationController extends Controller
{
    public function __construct(
        protected SaleService $saleService
    ) {}

    public function index(Request $request): Response
    {
        abort_unless($request->user()?->can('sales.quotations_list.view'), 403, 'غير مصرح لك بعرض قائمة عروض الأسعار.');

        $user = $request->user();
        $query = Quotation::query()
            ->with([
                'contact:id,name,phone',
                'branch:id,name',
                'user:id,name',
            ])
            ->withCount('lines');

        if ($user && !$user->can('branches.view_all') && $user->branch_id) {
            $query->where('branch_id', $user->branch_id);
        }

        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->filled('contact_id')) {
            $query->where('contact_id', $request->contact_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('quotation_number', 'like', "%{$search}%")
                    ->orWhere('notes', 'like', "%{$search}%")
                    ->orWhereHas('contact', fn ($sq) => $sq->where('name', 'like', "%{$search}%"));
            });
        }

        $quotations = $query->orderByDesc('id')
            ->paginate($request->integer('per_page', 15))
            ->withQueryString();

        $branchesQuery = Branch::select('id', 'name');
        if ($user && !$user->can('branches.view_all') && $user->branch_id) {
            $branchesQuery->where('id', $user->branch_id);
        }

        return Inertia::render('Sales/Quotations/Index', [
            'quotations' => $quotations,
            'filters'    => $request->only(['branch_id', 'contact_id', 'status', 'search', 'per_page']),
            'branches'   => $branchesQuery->get(),
            'customers'  => Contact::where('type', 'customer')->orWhere('type', 'both')->select('id', 'name')->get(),
        ]);
    }

    public function create(Request $request): Response
    {
        abort_unless($request->user()?->can('sales.quotation_create.view'), 403, 'غير مصرح لك بإنشاء عرض سعر.');

        $user = $request->user();
        $branchesQuery = Branch::select('id', 'name');
        if ($user && !$user->can('branches.view_all') && $user->branch_id) {
            $branchesQuery->where('id', $user->branch_id);
        }

        return Inertia::render('Sales/Quotations/Create', [
            'customers'       => Contact::where('type', 'customer')->orWhere('type', 'both')->select('id', 'name', 'phone')->get(),
            'branches'        => $branchesQuery->get(),
            'warehouses'      => Warehouse::select('id', 'name', 'branch_id')->get(),
            'products'        => Product::where('is_active', true)->select('id', 'name', 'sku', 'selling_price', 'unit_id')->with('unit:id,name')->get(),
            'defaultBranchId' => $user?->branch_id ?? Branch::first()?->id,
        ]);
    }

    public function store(StoreQuotationRequest $request): RedirectResponse
    {
        $quotation = $this->saleService->createQuotation($request->validated());

        return redirect()->route('sales.quotations.index')
            ->with('success', "تم إنشاء عرض السعر بنجاح برقم {$quotation->quotation_number}");
    }

    public function show(Request $request, Quotation $quotation): Response
    {
        abort_unless($request->user()?->can('sales.quotations_list.view'), 403, 'غير مصرح لك بعرض تفاصيل عرض السعر.');

        $quotation->load([
            'contact',
            'branch',
            'warehouse',
            'user',
            'lines.product.unit',
            'lines.variation',
        ]);

        return Inertia::render('Sales/Quotations/Show', [
            'quotation' => $quotation,
        ]);
    }
}
