<?php

namespace App\Http\Controllers;

use App\Models\Shipment;
use App\Models\SaleOrder;
use App\Models\ShippingCompany;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ShipmentController extends Controller
{
    /**
     * قائمة الشحنات.
     */
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->can('sales.all.view'), 403, 'غير مصرح لك بعرض قائمة الشحنات.');

        $user = $request->user();

        $query = Shipment::with([
            'saleOrder:id,order_number,branch_id,contact_id',
            'saleOrder.contact:id,name,phone',
            'saleOrder.branch:id,name',
            'shippingCompany:id,name',
        ])->orderByDesc('id');

        // Branch isolation via sale_order
        if ($user && !$user->can('branches.view_all') && $user->branch_id) {
            $query->whereHas('saleOrder', fn ($q) => $q->where('branch_id', $user->branch_id));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('shipping_company_id')) {
            $query->where('shipping_company_id', $request->shipping_company_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('tracking_number', 'like', "%{$search}%")
                    ->orWhereHas('saleOrder', fn ($sq) => $sq->where('order_number', 'like', "%{$search}%"));
            });
        }

        if ($request->filled('date_from')) {
            $query->whereDate('shipped_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('shipped_at', '<=', $request->date_to);
        }

        $shipments = $query->paginate($request->integer('per_page', 15))->withQueryString();

        // Metrics
        $metricsQuery = Shipment::query();
        if ($user && !$user->can('branches.view_all') && $user->branch_id) {
            $metricsQuery->whereHas('saleOrder', fn ($q) => $q->where('branch_id', $user->branch_id));
        }

        $metrics = [
            'total'     => (int) (clone $metricsQuery)->count(),
            'pending'   => (int) (clone $metricsQuery)->where('status', 'pending')->count(),
            'shipped'   => (int) (clone $metricsQuery)->where('status', 'shipped')->count(),
            'delivered' => (int) (clone $metricsQuery)->where('status', 'delivered')->count(),
            'returned'  => (int) (clone $metricsQuery)->where('status', 'returned')->count(),
        ];

        return Inertia::render('Sales/Shipments/Index', [
            'shipments'        => $shipments,
            'metrics'          => $metrics,
            'filters'          => $request->only(['status', 'shipping_company_id', 'search', 'date_from', 'date_to', 'per_page']),
            'shippingCompanies'=> ShippingCompany::where('is_active', true)->select('id', 'name')->get(),
        ]);
    }

    /**
     * إنشاء شحنة جديدة لفاتورة بيع.
     */
    public function store(Request $request): RedirectResponse
    {
        abort_unless($request->user()?->can('sales.create.view'), 403, 'غير مصرح لك بإنشاء شحنة.');

        $validated = $request->validate([
            'sale_order_id'       => ['required', 'exists:sale_orders,id'],
            'shipping_company_id' => ['nullable', 'exists:shipping_companies,id'],
            'tracking_number'     => ['nullable', 'string', 'max:100'],
            'shipped_at'          => ['nullable', 'date'],
            'shipping_cost'       => ['nullable', 'numeric', 'min:0'],
            'notes'               => ['nullable', 'string', 'max:500'],
        ], [
            'sale_order_id.required' => 'يجب ربط الشحنة بفاتورة بيع.',
            'sale_order_id.exists'   => 'فاتورة البيع المحددة غير موجودة.',
        ]);

        $user = $request->user();
        $saleOrder = SaleOrder::findOrFail($validated['sale_order_id']);

        // Branch isolation check
        if ($user && !$user->can('branches.view_all') && $user->branch_id && $saleOrder->branch_id !== $user->branch_id) {
            abort(403, 'غير مصرح لك بإنشاء شحنة لفاتورة تابعة لفرع آخر.');
        }

        $shipment = Shipment::create([
            'sale_order_id'       => $validated['sale_order_id'],
            'shipping_company_id' => $validated['shipping_company_id'] ?? null,
            'tracking_number'     => $validated['tracking_number'] ?? null,
            'shipped_at'          => $validated['shipped_at'] ?? null,
            'shipping_cost'       => $validated['shipping_cost'] ?? 0,
            'status'              => $validated['shipped_at'] ? 'shipped' : 'pending',
            'notes'               => $validated['notes'] ?? null,
        ]);

        return redirect()->route('sales.shipments.show', $shipment->id)
            ->with('success', 'تم إنشاء الشحنة بنجاح.');
    }

    /**
     * عرض تفاصيل شحنة.
     */
    public function show(Request $request, Shipment $shipment): Response
    {
        abort_unless($request->user()?->can('sales.all.view'), 403, 'غير مصرح لك بعرض تفاصيل الشحنة.');

        $user = $request->user();
        $shipment->load([
            'saleOrder.contact',
            'saleOrder.branch',
            'saleOrder.user',
            'saleOrder.lines.product',
            'shippingCompany',
        ]);

        // Branch isolation
        if ($user && !$user->can('branches.view_all') && $user->branch_id
            && $shipment->saleOrder?->branch_id !== $user->branch_id
        ) {
            abort(403, 'غير مصرح لك بعرض شحنة تابعة لفرع آخر.');
        }

        return Inertia::render('Sales/Shipments/Show', [
            'shipment'         => $shipment,
            'shippingCompanies'=> ShippingCompany::where('is_active', true)->select('id', 'name')->get(),
        ]);
    }

    /**
     * تحديث حالة أو بيانات شحنة.
     */
    public function update(Request $request, Shipment $shipment): RedirectResponse
    {
        abort_unless($request->user()?->can('sales.create.view'), 403, 'غير مصرح لك بتعديل الشحنة.');

        $user = $request->user();
        $shipment->load('saleOrder:id,branch_id');

        if ($user && !$user->can('branches.view_all') && $user->branch_id
            && $shipment->saleOrder?->branch_id !== $user->branch_id
        ) {
            abort(403, 'غير مصرح لك بتعديل شحنة تابعة لفرع آخر.');
        }

        $validated = $request->validate([
            'shipping_company_id' => ['nullable', 'exists:shipping_companies,id'],
            'tracking_number'     => ['nullable', 'string', 'max:100'],
            'shipped_at'          => ['nullable', 'date'],
            'delivered_at'        => ['nullable', 'date', 'after_or_equal:shipped_at'],
            'shipping_cost'       => ['nullable', 'numeric', 'min:0'],
            'status'              => ['required', 'in:pending,shipped,delivered,returned'],
            'notes'               => ['nullable', 'string', 'max:500'],
        ], [
            'status.required' => 'يجب تحديد حالة الشحنة.',
            'status.in'       => 'حالة الشحنة غير صحيحة.',
        ]);

        $shipment->update($validated);

        return back()->with('success', 'تم تحديث الشحنة بنجاح.');
    }
}
