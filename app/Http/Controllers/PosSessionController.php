<?php

namespace App\Http\Controllers;

use App\Exceptions\OpenPosSessionExistsException;
use App\Models\Branch;
use App\Models\FiscalYear;
use App\Models\PosSession;
use App\Models\SaleOrder;
use App\Models\Treasury;
use App\Models\Warehouse;
use App\Services\DocumentSequenceService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PosSessionController extends Controller
{
    public function __construct(
        protected DocumentSequenceService $sequenceService
    ) {}

    /**
     * قائمة جلسات نقطة البيع.
     */
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->can('sales.all.view'), 403, 'غير مصرح لك بعرض جلسات نقطة البيع.');

        $user = $request->user();

        $query = PosSession::with(['branch:id,name', 'warehouse:id,name', 'treasury:id,name', 'user:id,name'])
            ->orderByDesc('id');

        if ($user && !$user->can('branches.view_all') && $user->branch_id) {
            $query->where('branch_id', $user->branch_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        $sessions = $query->paginate($request->integer('per_page', 15))->withQueryString();

        // Check if current user has an open session
        $openSession = PosSession::where('user_id', $user?->id)
            ->where('status', 'open')
            ->with(['branch:id,name', 'warehouse:id,name', 'treasury:id,name'])
            ->first();

        $branchesQuery = Branch::select('id', 'name');
        if ($user && !$user->can('branches.view_all') && $user->branch_id) {
            $branchesQuery->where('id', $user->branch_id);
        }

        return Inertia::render('Pos/SessionsList', [
            'sessions'    => $sessions,
            'openSession' => $openSession,
            'filters'     => $request->only(['status', 'branch_id', 'per_page']),
            'branches'    => $branchesQuery->get(),
        ]);
    }

    /**
     * شاشة فتح جلسة جديدة (أو عرض الجلسة المفتوحة للبدء بالبيع).
     */
    public function posScreen(Request $request): Response
    {
        abort_unless($request->user()?->can('sales.create.view'), 403, 'غير مصرح لك بالوصول لنقطة البيع.');

        $user = $request->user();

        // Check if user has an open session
        $openSession = PosSession::where('user_id', $user?->id)
            ->where('status', 'open')
            ->with(['branch:id,name', 'warehouse:id,name', 'treasury:id,name'])
            ->first();

        $branchesQuery = Branch::select('id', 'name');
        if ($user && !$user->can('branches.view_all') && $user->branch_id) {
            $branchesQuery->where('id', $user->branch_id);
        }

        $customers = [];
        $products = [];
        $paymentMethods = [];
        $categories = [];
        $discounts = [];
        $taxes = [];

        if ($openSession) {
            $customers = \App\Models\Contact::whereIn('type', ['customer', 'both'])
                ->where('is_active', true)
                ->select('id', 'name', 'phone', 'credit_limit')
                ->orderBy('name')
                ->get();

            $paymentMethods = \App\Models\PaymentMethod::where('is_active', true)
                ->select('id', 'name', 'type')
                ->get();

            $categories = \App\Models\ProductCategory::select('id', 'name')
                ->orderBy('name')
                ->get();

            $discounts = \App\Models\Discount::where('is_active', true)
                ->select('id', 'name', 'type', 'value')
                ->get();

            $taxes = \App\Models\Tax::where('is_active', true)
                ->select('id', 'name', 'rate')
                ->get();

            $rawProducts = \App\Models\Product::where('is_active', true)
                ->select('id', 'name', 'sku', 'barcode', 'selling_price', 'min_selling_price', 'tax_id', 'category_id', 'unit_id', 'tracking_type')
                ->with([
                    'unit:id,name,symbol',
                    'category:id,name',
                    'tax:id,name,rate',
                ])
                ->get();

            $products = $rawProducts->map(function ($product) use ($openSession) {
                $stock = \App\Models\StockBalance::where('product_id', $product->id)
                    ->where('warehouse_id', $openSession->warehouse_id)
                    ->value('quantity') ?? 0;
                $product->stock_balance = (float) $stock;

                if ($product->tracking_type === 'serial') {
                    $product->available_serials = \App\Models\ProductSerial::where('product_id', $product->id)
                        ->where('warehouse_id', $openSession->warehouse_id)
                        ->where('status', 'in_stock')
                        ->select('id', 'product_id', 'serial_number', 'imei1', 'imei2')
                        ->get();
                } else {
                    $product->available_serials = [];
                }
                return $product;
            });
        }

        return Inertia::render('Pos/Screen', [
            'openSession'        => $openSession,
            'branches'           => $branchesQuery->get(),
            'warehouses'         => Warehouse::select('id', 'name', 'branch_id')->get(),
            'treasuries'         => Treasury::select('id', 'name', 'branch_id')->get(),
            'fiscalYears'        => FiscalYear::where('status', 'open')->select('id', 'name')->get(),
            'customers'          => $customers,
            'products'           => $products,
            'paymentMethods'     => $paymentMethods,
            'categories'         => $categories,
            'discounts'          => $discounts,
            'taxes'              => $taxes,
            'userCanDiscount'    => $user?->can('pos.discount') ?? false,
            'userCanOverrideMin' => $user?->can('pos.override_min_price') ?? false,
        ]);
    }

    /**
     * فتح جلسة نقطة بيع جديدة.
     */
    public function open(Request $request): RedirectResponse
    {
        abort_unless($request->user()?->can('sales.create.view'), 403, 'غير مصرح لك بفتح جلسة نقطة بيع.');

        $validated = $request->validate([
            'branch_id'       => ['required', 'exists:branches,id'],
            'warehouse_id'    => ['required', 'exists:warehouses,id'],
            'treasury_id'     => ['required', 'exists:treasuries,id'],
            'fiscal_year_id'  => ['required', 'exists:fiscal_years,id'],
            'opening_balance' => ['required', 'numeric', 'min:0'],
            'notes'           => ['nullable', 'string', 'max:500'],
        ], [
            'branch_id.required'      => 'يجب تحديد الفرع.',
            'warehouse_id.required'   => 'يجب تحديد المستودع.',
            'treasury_id.required'    => 'يجب تحديد الخزينة.',
            'fiscal_year_id.required' => 'يجب تحديد السنة المالية.',
            'opening_balance.required'=> 'يجب إدخال الرصيد الافتتاحي.',
            'opening_balance.min'     => 'الرصيد الافتتاحي يجب أن يكون صفراً أو أكثر.',
        ]);

        $user = $request->user();

        // Check if fiscal year is open
        $fiscalYear = FiscalYear::findOrFail($validated['fiscal_year_id']);
        if ($fiscalYear->status !== 'open') {
            return back()->withErrors(['error' => 'لا يمكن فتح جلسة في سنة مالية مغلقة.']);
        }

        try {
            $sessionNumber = $this->sequenceService->getNextNumber(
                $validated['branch_id'],
                $validated['fiscal_year_id'],
                'pos_session',
                'POS'
            );

            $session = PosSession::create([
                'session_number'  => $sessionNumber,
                'branch_id'       => $validated['branch_id'],
                'warehouse_id'    => $validated['warehouse_id'],
                'treasury_id'     => $validated['treasury_id'],
                'user_id'         => $user->id,
                'fiscal_year_id'  => $validated['fiscal_year_id'],
                'opened_at'       => now(),
                'opening_balance' => $validated['opening_balance'],
                'expected_closing'=> $validated['opening_balance'],
                'status'          => 'open',
                'notes'           => $validated['notes'] ?? null,
            ]);

            return redirect()->route('sales.pos.screen')
                ->with('success', "تم فتح جلسة نقطة البيع برقم {$session->session_number}");
        } catch (OpenPosSessionExistsException $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * إغلاق جلسة نقطة البيع.
     */
    public function close(Request $request, PosSession $posSession): RedirectResponse
    {
        abort_unless($request->user()?->can('sales.create.view'), 403, 'غير مصرح لك بإغلاق جلسة نقطة البيع.');

        $user = $request->user();

        // Only the session owner or admin can close
        if ($posSession->user_id !== $user->id && !$user->can('branches.view_all')) {
            abort(403, 'لا يمكنك إغلاق جلسة تخص مستخدماً آخر.');
        }

        if ($posSession->status === 'closed') {
            return back()->withErrors(['error' => 'الجلسة مغلقة بالفعل.']);
        }

        $validated = $request->validate([
            'actual_closing' => ['required', 'numeric', 'min:0'],
            'notes'          => ['nullable', 'string', 'max:500'],
        ], [
            'actual_closing.required' => 'يجب إدخال الرصيد الفعلي عند الإغلاق.',
            'actual_closing.min'      => 'الرصيد الفعلي يجب أن يكون صفراً أو أكثر.',
        ]);

        $posSession->close($validated['actual_closing'], $validated['notes'] ?? null);

        return redirect()->route('sales.pos.sessions')
            ->with('success', "تم إغلاق جلسة نقطة البيع {$posSession->session_number} بنجاح.");
    }

    /**
     * عرض تفاصيل جلسة نقطة بيع.
     */
    public function show(Request $request, PosSession $posSession): Response
    {
        abort_unless($request->user()?->can('sales.all.view'), 403, 'غير مصرح لك بعرض تفاصيل الجلسة.');

        $posSession->load(['branch', 'warehouse', 'treasury', 'user']);

        // Load sales made in this session
        $sales = SaleOrder::where('pos_session_id', $posSession->id)
            ->with(['contact:id,name', 'user:id,name'])
            ->orderByDesc('id')
            ->get(['id', 'order_number', 'date', 'contact_id', 'total_amount', 'paid_amount', 'payment_status', 'user_id']);

        $sessionMetrics = [
            'total_sales'    => (float) $sales->sum('total_amount'),
            'total_paid'     => (float) $sales->sum('paid_amount'),
            'invoices_count' => (int) $sales->count(),
        ];

        return Inertia::render('Pos/SessionShow', [
            'session'        => $posSession,
            'sales'          => $sales,
            'sessionMetrics' => $sessionMetrics,
        ]);
    }

    /**
     * تنفيذ عملية دفع نقطة البيع (POS Checkout).
     */
    public function checkout(Request $request, \App\Services\PosCheckoutService $checkoutService)
    {
        abort_unless($request->user()?->can('sales.create.view'), 403, 'غير مصرح لك بإجراء عمليات البيع.');

        $data = $request->all();

        try {
            $order = $checkoutService->checkout($data, $request->user());

            if ($request->wantsJson() || $request->ajax()) {
                return response()->json([
                    'success' => true,
                    'message' => 'تم تسجيل فاتورة البيع بنجاح.',
                    'order'   => $order->load(['lines.product', 'lines.serials.productSerial', 'payments.paymentMethod', 'contact']),
                ]);
            }

            return redirect()->route('sales.pos.screen')
                ->with('success', "تم تسجيل الفاتورة بنجاح رقم {$order->order_number}")
                ->with('last_order_id', $order->id);
        } catch (\InvalidArgumentException $e) {
            if ($request->wantsJson() || $request->ajax()) {
                return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
            }
            return back()->withErrors(['error' => $e->getMessage()])->withInput();
        } catch (\App\Exceptions\InsufficientStockException $e) {
            if ($request->wantsJson() || $request->ajax()) {
                return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
            }
            return back()->withErrors(['error' => $e->getMessage()])->withInput();
        } catch (\Exception $e) {
            if ($request->wantsJson() || $request->ajax()) {
                return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
            }
            return back()->withErrors(['error' => $e->getMessage()])->withInput();
        }
    }
}

