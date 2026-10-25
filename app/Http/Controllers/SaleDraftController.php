<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSaleDraftRequest;
use App\Models\Branch;
use App\Models\Contact;
use App\Models\Product;
use App\Models\SaleDraft;
use App\Models\Warehouse;
use App\Services\SaleService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SaleDraftController extends Controller
{
    public function __construct(
        protected SaleService $saleService
    ) {}

    public function index(Request $request): Response
    {
        abort_unless($request->user()?->can('sales.drafts_list.view'), 403, 'غير مصرح لك بعرض قائمة المسودات.');

        $user = $request->user();
        $query = SaleDraft::query()
            ->with([
                'contact:id,name,phone',
                'branch:id,name',
                'warehouse:id,name',
                'user:id,name',
            ])
            ->withCount('lines');

        if ($user && !$user->can('branches.view_all') && $user->branch_id) {
            $query->where('branch_id', $user->branch_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('draft_number', 'like', "%{$search}%")
                    ->orWhere('notes', 'like', "%{$search}%")
                    ->orWhereHas('contact', fn ($sq) => $sq->where('name', 'like', "%{$search}%"));
            });
        }

        $drafts = $query->orderByDesc('id')
            ->paginate($request->integer('per_page', 15))
            ->withQueryString();

        return Inertia::render('Sales/Drafts/Index', [
            'drafts'  => $drafts,
            'filters' => $request->only(['search', 'per_page']),
        ]);
    }

    public function create(Request $request): Response
    {
        abort_unless($request->user()?->can('sales.draft_create.view'), 403, 'غير مصرح لك بإضافة مسودة بيع.');

        $user = $request->user();
        $branchesQuery = Branch::select('id', 'name');
        if ($user && !$user->can('branches.view_all') && $user->branch_id) {
            $branchesQuery->where('id', $user->branch_id);
        }

        return Inertia::render('Sales/Drafts/Create', [
            'customers'       => Contact::where('type', 'customer')->orWhere('type', 'both')->select('id', 'name', 'phone')->get(),
            'branches'        => $branchesQuery->get(),
            'warehouses'      => Warehouse::select('id', 'name', 'branch_id')->get(),
            'products'        => Product::where('is_active', true)->select('id', 'name', 'sku', 'selling_price', 'unit_id')->with('unit:id,name')->get(),
            'defaultBranchId' => $user?->branch_id ?? Branch::first()?->id,
        ]);
    }

    public function store(StoreSaleDraftRequest $request): RedirectResponse
    {
        $draft = $this->saleService->createDraft($request->validated());

        return redirect()->route('sales.drafts.index')
            ->with('success', "تم حفظ مسودة البيع بنجاح برقم {$draft->draft_number}");
    }

    public function destroy(SaleDraft $draft): RedirectResponse
    {
        $draft->delete();

        return back()->with('success', 'تم حذف مسودة البيع بنجاح.');
    }
}
