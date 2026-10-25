<?php

namespace App\Http\Controllers;

use App\Http\Requests\ReceivePurchaseOrderRequest;
use App\Http\Requests\StorePurchaseOrderRequest;
use App\Http\Requests\StorePurchasePaymentRequest;
use App\Models\Branch;
use App\Models\Contact;
use App\Models\FiscalYear;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\PurchasePayment;
use App\Models\Tax;
use App\Models\Treasury;
use App\Models\BankAccount;
use App\Models\Warehouse;
use App\Services\PurchaseService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PurchaseController extends Controller
{
    public function __construct(
        protected PurchaseService $purchaseService
    ) {}

    /**
     * Display a listing of purchase orders / invoices.
     */
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->can('purchases.list.view'), 403, 'غير مصرح لك بعرض قائمة المشتريات.');

        $user = $request->user();
        $query = PurchaseOrder::query()
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

        // Metrics calculation on filtered query
        $metricsQuery = clone $query;
        $totalPurchases = (float) $metricsQuery->sum('total_amount');
        $totalPaid      = (float) $metricsQuery->sum('paid_amount');
        $totalDue       = max(0, $totalPurchases - $totalPaid);
        $totalCount     = $metricsQuery->count();

        $orders = $query->latest('id')->paginate(15)->withQueryString();

        $branches = Branch::where('is_active', true)->select('id', 'name')->get();
        $warehouses = Warehouse::where('is_active', true)->select('id', 'name', 'branch_id')->get();
        $suppliers = Contact::whereIn('type', ['supplier', 'both'])
            ->where('is_active', true)
            ->select('id', 'name')
            ->get();

        return Inertia::render('Purchases/Index', [
            'orders'   => $orders,
            'filters'  => $request->only(['search', 'branch_id', 'warehouse_id', 'contact_id', 'status', 'payment_status', 'date_from', 'date_to']),
            'metrics'  => [
                'total_purchases' => $totalPurchases,
                'total_paid'      => $totalPaid,
                'total_due'       => $totalDue,
                'total_count'     => $totalCount,
            ],
            'branches'   => $branches,
            'warehouses' => $warehouses,
            'suppliers'  => $suppliers,
        ]);
    }

    /**
     * Show the form for creating a new purchase order.
     */
    public function create(Request $request): Response
    {
        abort_unless($request->user()?->can('purchases.create.view'), 403, 'غير مصرح لك بإضافة فاتورة مشتريات.');

        $user = $request->user();
        $branchesQuery = Branch::where('is_active', true);
        if ($user && !$user->can('branches.view_all') && $user->branch_id) {
            $branchesQuery->where('id', $user->branch_id);
        }
        $branches = $branchesQuery->select('id', 'name')->get();

        $warehouses = Warehouse::where('is_active', true)
            ->select('id', 'name', 'branch_id')
            ->get();

        $suppliers = Contact::whereIn('type', ['supplier', 'both'])
            ->where('is_active', true)
            ->select('id', 'name', 'code', 'phone', 'tax_number', 'opening_balance')
            ->get();

        $taxes = Tax::where('is_active', true)->select('id', 'name', 'rate', 'type')->get();
        $paymentMethods = PaymentMethod::where('is_active', true)->select('id', 'name', 'type')->get();

        $products = Product::where('is_active', true)
            ->with(['variations:id,product_id,name,sku,cost_price', 'unit:id,name'])
            ->select('id', 'name', 'sku', 'barcode', 'cost_price', 'tracking_type', 'unit_id')
            ->get();

        $openFiscalYear = FiscalYear::where('status', 'open')->first();

        return Inertia::render('Purchases/Create', [
            'branches'       => $branches,
            'warehouses'     => $warehouses,
            'suppliers'      => $suppliers,
            'taxes'          => $taxes,
            'paymentMethods' => $paymentMethods,
            'products'       => $products,
            'openFiscalYear' => $openFiscalYear,
            'defaultBranchId' => $user?->branch_id ?? $branches->first()?->id,
        ]);
    }

    /**
     * Store a newly created purchase order.
     */
    public function store(StorePurchaseOrderRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $order = $this->purchaseService->create($data);

        // Immediate receipt if requested
        if (!empty($data['auto_receive'])) {
            $receiveData = [];
            foreach ($data['lines'] as $lineIndex => $line) {
                if (!empty($line['serial_ids'])) {
                    // Match line by order lines fresh
                    $createdLine = $order->lines[$lineIndex] ?? null;
                    if ($createdLine) {
                        $receiveData[$createdLine->id] = [
                            'serial_ids' => $line['serial_ids'],
                        ];
                    }
                }
            }

            $this->purchaseService->receive($order, $receiveData);
        }

        return redirect()->route('purchases.show', $order->id)
            ->with('success', 'تم حفظ فاتورة المشتريات بنجاح رقم ' . $order->order_number);
    }

    /**
     * Display the specified purchase order.
     */
    public function show(Request $request, PurchaseOrder $purchase): Response
    {
        abort_unless($request->user()?->can('purchases.list.view'), 403, 'غير مصرح لك بعرض فاتورة المشتريات.');

        $user = $request->user();
        if ($user && !$user->can('branches.view_all') && $user->branch_id && $purchase->branch_id !== $user->branch_id) {
            abort(403, 'غير مصرح لك بعرض فواتير الفروع الأخرى.');
        }

        $purchase->load([
            'contact',
            'branch:id,name',
            'warehouse:id,name',
            'user:id,name',
            'lines.product:id,name,sku,tracking_type',
            'lines.variation:id,name,sku',
            'lines.unit:id,name',
            'lines.serials.serial',
            'payments.paymentMethod:id,name,type',
            'payments.treasury:id,name',
            'payments.bankAccount:id,bank_name,account_number',
            'payments.creator:id,name',
            'returns.lines.product:id,name',
            'returns.lines.serials.serial',
        ]);

        $paymentMethods = PaymentMethod::where('is_active', true)->select('id', 'name', 'type')->get();
        $treasuries = Treasury::where('branch_id', $purchase->branch_id)->where('is_active', true)->select('id', 'name')->get();
        $bankAccounts = BankAccount::where('branch_id', $purchase->branch_id)->where('is_active', true)->select('id', 'bank_name', 'account_number')->get();

        return Inertia::render('Purchases/Show', [
            'order'          => $purchase,
            'paymentMethods' => $paymentMethods,
            'treasuries'     => $treasuries,
            'bankAccounts'   => $bankAccounts,
        ]);
    }

    /**
     * Receive goods for the purchase order.
     */
    public function receive(ReceivePurchaseOrderRequest $request, PurchaseOrder $purchase): RedirectResponse
    {
        abort_unless($request->user()?->can('purchases.create.view'), 403, 'غير مصرح لك باستلام بضاعة المشتريات.');

        $receiveData = $request->validated()['receive_data'] ?? [];

        try {
            $this->purchaseService->receive($purchase, $receiveData);
            return redirect()->back()->with('success', 'تم استلام بضاعة فاتورة الشراء وتحديث المخزون بنجاح.');
        } catch (\Throwable $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    /**
     * Record a payment for the purchase order.
     */
    public function recordPayment(StorePurchasePaymentRequest $request, PurchaseOrder $purchase): RedirectResponse
    {
        $data = $request->validated();

        try {
            $this->purchaseService->recordPayment($purchase, $data);
            return redirect()->back()->with('success', 'تم تسجيل دفعة السداد للمورد بنجاح.');
        } catch (\Throwable $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    /**
     * Delete a payment.
     */
    public function deletePayment(Request $request, PurchasePayment $payment): RedirectResponse
    {
        abort_unless($request->user()?->can('purchases.list.view'), 403, 'غير مصرح لك بحذف الدفعة.');

        try {
            $this->purchaseService->deletePayment($payment);
            return redirect()->back()->with('success', 'تم إلغاء دفعة السداد وإعادة احتساب الرصيد بنجاح.');
        } catch (\Throwable $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    /**
     * Delete / Cancel purchase order.
     */
    public function destroy(Request $request, PurchaseOrder $purchase): RedirectResponse
    {
        abort_unless($request->user()?->can('purchases.list.view'), 403, 'غير مصرح لك بإلغاء فاتورة المشتريات.');

        if ($purchase->status === 'received') {
            return redirect()->back()->with('error', 'لا يمكن حذف فاتورة مشتريات مستلمة بالفعل. يرجى استخدام مرتجع المشتريات.');
        }

        if ($purchase->payments()->exists()) {
            return redirect()->back()->with('error', 'لا يمكن حذف فاتورة شراء مسجل عليها دفعات مالية.');
        }

        $purchase->delete();

        return redirect()->route('purchases.index')->with('success', 'تم حذف أمر الشراء بنجاح.');
    }

    /**
     * Display purchase order requests.
     */
    public function orderRequests(Request $request): Response
    {
        abort_unless($request->user()?->can('purchases.order_request.view'), 403, 'غير مصرح لك بعرض طلبات الشراء.');

        $user = $request->user();
        $query = PurchaseOrder::query()
            ->where('status', 'confirmed')
            ->with(['contact:id,name', 'branch:id,name', 'warehouse:id,name'])
            ->withCount('lines');

        if ($user && !$user->can('branches.view_all') && $user->branch_id) {
            $query->where('branch_id', $user->branch_id);
        }

        $requests = $query->latest('id')->paginate(15);

        return Inertia::render('Purchases/OrderRequests', [
            'requests' => $requests,
        ]);
    }
}
