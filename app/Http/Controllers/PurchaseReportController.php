<?php

namespace App\Http\Controllers;

use App\Models\Contact;
use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderLine;
use App\Models\PurchaseReturn;
use App\Models\PurchaseReturnLine;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PurchaseReportController extends Controller
{
    /**
     * تقرير العناصر (Items Report)
     */
    public function items(Request $request): Response
    {
        abort_unless($request->user()?->can('purchases.items_report.view'), 403, 'غير مصرح لك بعرض تقرير عناصر المشتريات.');

        $query = PurchaseOrderLine::query()
            ->with([
                'product:id,name,sku,category_id,unit_id',
                'product.category:id,name',
                'unit:id,name',
                'purchaseOrder:id,order_number,date,contact_id,branch_id',
                'purchaseOrder.contact:id,name',
            ])
            ->whereHas('purchaseOrder', function ($q) use ($request) {
                if ($request->filled('date_from')) {
                    $q->whereDate('date', '>=', $request->date_from);
                }
                if ($request->filled('date_to')) {
                    $q->whereDate('date', '<=', $request->date_to);
                }
                if ($request->filled('contact_id')) {
                    $q->where('contact_id', $request->contact_id);
                }
            });

        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('product', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('sku', 'like', "%{$search}%");
            });
        }

        $items = $query->latest('id')->paginate(20)->withQueryString();

        $metricsQuery = clone $query;
        $totalQty = (float) $metricsQuery->sum('quantity');
        $totalCost = (float) $metricsQuery->sum('total_amount');

        $suppliers = Contact::whereIn('type', ['supplier', 'both'])->where('is_active', true)->select('id', 'name')->get();

        return Inertia::render('Purchases/Reports/ItemsReport', [
            'items'     => $items,
            'filters'   => $request->only(['search', 'contact_id', 'date_from', 'date_to']),
            'metrics'   => [
                'total_qty'  => $totalQty,
                'total_cost' => $totalCost,
            ],
            'suppliers' => $suppliers,
        ]);
    }

    /**
     * تقرير مشتريات المنتجات (Products Purchases Report)
     */
    public function products(Request $request): Response
    {
        abort_unless($request->user()?->can('purchases.products_report.view'), 403, 'غير مصرح لك بعرض تقرير مشتريات المنتجات.');

        $query = DB::table('purchase_order_lines')
            ->join('products', 'purchase_order_lines.product_id', '=', 'products.id')
            ->join('purchase_orders', 'purchase_order_lines.purchase_order_id', '=', 'purchase_orders.id')
            ->select(
                'products.id as product_id',
                'products.name as product_name',
                'products.sku as product_sku',
                DB::raw('SUM(purchase_order_lines.quantity) as total_quantity'),
                DB::raw('AVG(purchase_order_lines.unit_cost) as avg_unit_cost'),
                DB::raw('SUM(purchase_order_lines.total_amount) as total_spending')
            )
            ->groupBy('products.id', 'products.name', 'products.sku');

        if ($request->filled('date_from')) {
            $query->whereDate('purchase_orders.date', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('purchase_orders.date', '<=', $request->date_to);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('products.name', 'like', "%{$search}%")
                  ->orWhere('products.sku', 'like', "%{$search}%");
            });
        }

        $products = $query->orderByDesc('total_spending')->paginate(20)->withQueryString();

        return Inertia::render('Purchases/Reports/ProductsReport', [
            'products' => $products,
            'filters'  => $request->only(['search', 'date_from', 'date_to']),
        ]);
    }

    /**
     * تقرير مرتجع المنتجات (Products Returns Report)
     */
    public function productsReturns(Request $request): Response
    {
        abort_unless($request->user()?->can('purchases.products_returns_report.view'), 403, 'غير مصرح لك بعرض تقرير مرتجع المنتجات.');

        $query = PurchaseReturnLine::query()
            ->with([
                'product:id,name,sku',
                'purchaseReturn:id,return_number,date,contact_id',
                'purchaseReturn.contact:id,name',
            ])
            ->whereHas('purchaseReturn', function ($q) use ($request) {
                if ($request->filled('date_from')) {
                    $q->whereDate('date', '>=', $request->date_from);
                }
                if ($request->filled('date_to')) {
                    $q->whereDate('date', '<=', $request->date_to);
                }
            });

        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('product', fn ($q) => $q->where('name', 'like', "%{$search}%")->orWhere('sku', 'like', "%{$search}%"));
        }

        $returns = $query->latest('id')->paginate(20)->withQueryString();

        return Inertia::render('Purchases/Reports/ProductsReturnsReport', [
            'returns' => $returns,
            'filters' => $request->only(['search', 'date_from', 'date_to']),
        ]);
    }

    /**
     * تقرير المشتريات الإجمالي (Purchases Summary Report)
     */
    public function summary(Request $request): Response
    {
        abort_unless($request->user()?->can('purchases.report.view'), 403, 'غير مصرح لك بعرض ملخص تقرير المشتريات.');

        $query = PurchaseOrder::query()
            ->with(['contact:id,name', 'branch:id,name'])
            ->latest('date');

        if ($request->filled('date_from')) {
            $query->whereDate('date', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('date', '<=', $request->date_to);
        }

        if ($request->filled('contact_id')) {
            $query->where('contact_id', $request->contact_id);
        }

        $orders = $query->paginate(20)->withQueryString();

        $metricsQuery = clone $query;
        $summary = [
            'total_subtotal' => (float) $metricsQuery->sum('subtotal'),
            'total_tax'      => (float) $metricsQuery->sum('tax_amount'),
            'total_shipping' => (float) $metricsQuery->sum('shipping_amount'),
            'total_amount'   => (float) $metricsQuery->sum('total_amount'),
            'total_paid'     => (float) $metricsQuery->sum('paid_amount'),
            'total_due'      => max(0, (float) $metricsQuery->sum('total_amount') - (float) $metricsQuery->sum('paid_amount')),
        ];

        $suppliers = Contact::whereIn('type', ['supplier', 'both'])->where('is_active', true)->select('id', 'name')->get();

        return Inertia::render('Purchases/Reports/SummaryReport', [
            'orders'    => $orders,
            'summary'   => $summary,
            'suppliers' => $suppliers,
            'filters'   => $request->only(['contact_id', 'date_from', 'date_to']),
        ]);
    }
}
