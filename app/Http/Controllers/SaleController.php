<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSaleOrderRequest;
use App\Http\Requests\StoreSalePaymentRequest;
use App\Models\Branch;
use App\Models\Contact;
use App\Models\Discount;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\ProductSerial;
use App\Models\Representative;
use App\Models\SaleOrder;
use App\Models\SalePayment;
use App\Models\Tax;
use App\Models\Treasury;
use App\Models\BankAccount;
use App\Models\Warehouse;
use App\Services\SaleService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SaleController extends Controller
{
    public function __construct(
        protected SaleService $saleService
    ) {}

    /**
     * Display a listing of sales invoices / orders.
     */
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->can('sales.all.view'), 403, 'غير مصرح لك بعرض قائمة المبيعات.');

        $user = $request->user();
        $query = SaleOrder::query()
            ->with([
                'contact:id,name,phone,tax_number',
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

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('payment_status')) {
            $query->where('payment_status', $request->payment_status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('order_number', 'like', "%{$search}%")
                    ->orWhere('notes', 'like', "%{$search}%")
                    ->orWhereHas('contact', fn ($sq) => $sq->where('name', 'like', "%{$search}%"));
            });
        }

        if ($request->filled('date_from')) {
            $query->whereDate('date', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('date', '<=', $request->date_to);
        }

        $sales = $query->orderByDesc('id')
            ->paginate($request->integer('per_page', 15))
            ->withQueryString();

        // Metrics
        $baseMetrics = SaleOrder::query();
        if ($user && !$user->can('branches.view_all') && $user->branch_id) {
            $baseMetrics->where('branch_id', $user->branch_id);
        }

        $metrics = [
            'total_sales'      => (float) (clone $baseMetrics)->sum('total_amount'),
            'total_paid'       => (float) (clone $baseMetrics)->sum('paid_amount'),
            'total_unpaid'     => (float) (clone $baseMetrics)->where('payment_status', 'unpaid')->sum('total_amount'),
            'invoices_count'   => (int) (clone $baseMetrics)->count(),
        ];

        $branchesQuery = Branch::select('id', 'name');
        if ($user && !$user->can('branches.view_all') && $user->branch_id) {
            $branchesQuery->where('id', $user->branch_id);
        }

        return Inertia::render('Sales/Index', [
            'sales'      => $sales,
            'filters'    => $request->only(['branch_id', 'warehouse_id', 'contact_id', 'status', 'payment_status', 'search', 'date_from', 'date_to', 'per_page']),
            'metrics'    => $metrics,
            'branches'   => $branchesQuery->get(),
            'warehouses' => Warehouse::select('id', 'name', 'branch_id')->get(),
            'customers'  => Contact::where('type', 'customer')->orWhere('type', 'both')->select('id', 'name', 'phone')->get(),
        ]);
    }

    /**
     * Show the form for creating a new sale invoice.
     */
    public function create(Request $request): Response
    {
        abort_unless($request->user()?->can('sales.create.view'), 403, 'غير مصرح لك بإنشاء فاتورة بيع.');

        $user = $request->user();

        $branchesQuery = Branch::select('id', 'name');
        if ($user && !$user->can('branches.view_all') && $user->branch_id) {
            $branchesQuery->where('id', $user->branch_id);
        }

        $products = Product::where('is_active', true)
            ->with([
                'unit:id,name',
                'variations:id,product_id,name,sku,selling_price',
                'serials' => fn ($q) => $q->where('status', 'in_stock')->select('id', 'product_id', 'serial_number', 'imei1', 'warehouse_id', 'cost_price'),
                'stockBalances' => fn ($q) => $q->select('id', 'product_id', 'warehouse_id', 'quantity', 'avg_cost'),
            ])
            ->select('id', 'name', 'sku', 'barcode', 'type', 'tracking_type', 'unit_id', 'selling_price', 'cost_price', 'tax_id')
            ->get();

        return Inertia::render('Sales/Create', [
            'customers'       => Contact::where('type', 'customer')->orWhere('type', 'both')->where('is_active', true)->select('id', 'name', 'phone', 'tax_number', 'credit_limit')->get(),
            'branches'        => $branchesQuery->get(),
            'warehouses'      => Warehouse::select('id', 'name', 'branch_id')->get(),
            'products'        => $products,
            'taxes'           => Tax::where('is_active', true)->select('id', 'name', 'rate')->get(),
            'paymentMethods'  => PaymentMethod::where('is_active', true)->select('id', 'name')->get(),
            'treasuries'      => Treasury::select('id', 'name', 'branch_id')->get(),
            'bankAccounts'    => BankAccount::select('id', 'bank_name', 'account_number')->get(),
            'representatives' => Representative::select('id', 'name')->get(),
            'discounts'       => Discount::where('is_active', true)->select('id', 'name', 'type', 'value', 'applies_to')->get(),
            'defaultBranchId' => $user?->branch_id ?? Branch::first()?->id,
        ]);
    }

    /**
     * Store a newly created sale invoice in storage.
     */
    public function store(StoreSaleOrderRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $order = $this->saleService->create($validated);

        return redirect()->route('sales.show', $order->id)
            ->with('success', "تم إنشاء فاتورة المبيعات بنجاح برقم {$order->order_number}");
    }

    /**
     * Display the specified sale invoice.
     */
    public function show(Request $request, SaleOrder $sale): Response
    {
        abort_unless($request->user()?->can('sales.all.view'), 403, 'غير مصرح لك بعرض تفاصيل الفاتورة.');

        $user = $request->user();
        if ($user && !$user->can('branches.view_all') && $user->branch_id && $sale->branch_id !== $user->branch_id) {
            abort(403, 'غير مصرح لك بعرض فاتورة تابعة لفرع آخر.');
        }

        $sale->load([
            'contact',
            'branch',
            'warehouse',
            'user',
            'representative',
            'discount',
            'lines.product.unit',
            'lines.variation',
            'lines.tax',
            'lines.serials.serial',
            'payments.paymentMethod',
            'payments.treasury',
            'payments.bankAccount',
            'payments.creator',
            'returns.lines',
        ]);

        return Inertia::render('Sales/Show', [
            'sale'           => $sale,
            'paymentMethods' => PaymentMethod::where('is_active', true)->select('id', 'name')->get(),
            'treasuries'     => Treasury::where('branch_id', $sale->branch_id)->select('id', 'name')->get(),
            'bankAccounts'   => BankAccount::select('id', 'bank_name', 'account_number')->get(),
        ]);
    }

    /**
     * Record a payment against the sale order.
     */
    public function recordPayment(StoreSalePaymentRequest $request, SaleOrder $sale): RedirectResponse
    {
        $user = $request->user();
        if ($user && !$user->can('branches.view_all') && $user->branch_id && $sale->branch_id !== $user->branch_id) {
            abort(403, 'غير مصرح لك بالسداد لفاتورة فرع آخر.');
        }

        $this->saleService->recordPayment($sale, $request->validated());

        return back()->with('success', 'تم تسجيل دفعة المبيعات بنجاح.');
    }

    /**
     * Delete a payment from the sale order.
     */
    public function deletePayment(Request $request, SalePayment $payment): RedirectResponse
    {
        $sale = $payment->saleOrder;
        $user = $request->user();
        if ($user && !$user->can('branches.view_all') && $user->branch_id && $sale && $sale->branch_id !== $user->branch_id) {
            abort(403, 'غير مصرح لك بحذف دفعة لفرع آخر.');
        }

        $this->saleService->deletePayment($payment);

        return back()->with('success', 'تم حذف الدفعة بنجاح وتحديث الرصيد.');
    }

    /**
     * Remove the specified sale invoice from storage.
     */
    public function destroy(Request $request, SaleOrder $sale): RedirectResponse
    {
        $user = $request->user();
        if ($user && !$user->can('branches.view_all') && $user->branch_id && $sale->branch_id !== $user->branch_id) {
            abort(403, 'غير مصرح لك بحذف فاتورة فرع آخر.');
        }

        if ($sale->payments()->count() > 0) {
            return back()->withErrors(['error' => 'لا يمكن حذف فاتورة بيع تحتوي على مدفوعات مسجلة. قم بحذف الدفعات أولاً.']);
        }

        $sale->delete();

        return redirect()->route('sales.index')->with('success', 'تم حذف فاتورة المبيعات بنجاح.');
    }
}
