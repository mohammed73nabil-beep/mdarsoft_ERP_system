<?php

namespace App\Http\Controllers;

use App\Models\ProductCategory;
use App\Models\ProductSerial;
use App\Models\StockBalance;
use App\Models\Warehouse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StocktakingReportController extends Controller
{
    /**
     * تقرير جرد بسعر التكلفة (Stocktaking at Cost Price)
     */
    public function cost(Request $request): Response
    {
        abort_unless($request->user()?->can('inventory.stocktaking_cost.view'), 403, 'غير مصرح لك بعرض تقرير الجرد بسعر التكلفة.');

        $data = $this->buildReportData($request);

        return Inertia::render('Inventory/Reports/StocktakingCost', $data);
    }

    /**
     * تقرير جرد بسعر البيع (Stocktaking at Selling Price)
     */
    public function sale(Request $request): Response
    {
        abort_unless($request->user()?->can('inventory.stocktaking_sale.view'), 403, 'غير مصرح لك بعرض تقرير الجرد بسعر البيع.');

        $data = $this->buildReportData($request);

        return Inertia::render('Inventory/Reports/StocktakingSale', $data);
    }

    /**
     * تقرير جرد بدون أسعار (Stocktaking without Prices - Physical Count Sheet)
     */
    public function noPrice(Request $request): Response
    {
        abort_unless($request->user()?->can('inventory.stocktaking_no_price.view'), 403, 'غير مصرح لك بعرض تقرير الجرد بدون أسعار.');

        $data = $this->buildReportData($request);

        return Inertia::render('Inventory/Reports/StocktakingNoPrice', $data);
    }

    /**
     * ملخص تقرير المخزون (Inventory Summary Report)
     */
    public function summary(Request $request): Response
    {
        abort_unless($request->user()?->can('inventory.summary_report.view'), 403, 'غير مصرح لك بعرض ملخص تقرير المخزون.');

        $data = $this->buildReportData($request);

        return Inertia::render('Inventory/Reports/SummaryReport', $data);
    }

    private function buildReportData(Request $request): array
    {
        $user = $request->user();
        $branchWarehouses = Warehouse::query();
        if ($user && !$user->can('branches.view_all') && $user->branch_id) {
            $branchWarehouses->where('branch_id', $user->branch_id);
        }
        $allowedWarehouseIds = $branchWarehouses->pluck('id')->toArray();

        $query = StockBalance::query()
            ->with([
                'product:id,name,sku,barcode,tracking_type,category_id,unit_id,selling_price,cost_price,reorder_level',
                'product.category:id,name',
                'product.unit:id,name,symbol',
                'variation:id,name,sku,selling_price,cost_price',
                'warehouse:id,name,branch_id',
                'warehouse.branch:id,name',
            ])
            ->whereIn('warehouse_id', $allowedWarehouseIds);

        if ($request->filled('warehouse_id')) {
            $query->where('warehouse_id', $request->warehouse_id);
        }

        if ($request->filled('category_id')) {
            $catId = $request->category_id;
            $query->whereHas('product', fn ($pq) => $pq->where('category_id', $catId));
        }

        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->whereHas('product', function ($pq) use ($search) {
                $pq->where('name', 'like', "%{$search}%")
                   ->orWhere('sku', 'like', "%{$search}%")
                   ->orWhere('barcode', 'like', "%{$search}%");
            });
        }

        // Fetch serial counts in_stock mapped by key
        $serialCounts = ProductSerial::where('status', 'in_stock')
            ->whereIn('warehouse_id', $allowedWarehouseIds)
            ->selectRaw('product_id, warehouse_id, COALESCE(variation_id, 0) as var_key, COUNT(*) as in_stock_count')
            ->groupBy('product_id', 'warehouse_id', 'var_key')
            ->get()
            ->keyBy(fn ($item) => "{$item->product_id}_{$item->warehouse_id}_{$item->var_key}");

        // Paginate items
        $balances = $query->paginate(25)->withQueryString();

        // Transform collection to set serial count as accurate in_stock quantity
        $totalValuationCost = 0;
        $totalValuationSale = 0;
        $totalQty = 0;

        $balances->getCollection()->transform(function ($item) use ($serialCounts, &$totalValuationCost, &$totalValuationSale, &$totalQty) {
            $product = $item->product;
            if (!$product) {
                return $item;
            }

            if ($product->tracking_type === 'serial') {
                $varKey = $item->variation_id ?? 0;
                $key = "{$item->product_id}_{$item->warehouse_id}_{$varKey}";
                $serialCount = $serialCounts->get($key)?->in_stock_count ?? 0;
                $item->current_stock = (float) $serialCount;
            } else {
                $item->current_stock = (float) $item->quantity;
            }

            $unitCost = (float) $item->avg_cost;
            $unitSale = (float) ($item->variation?->selling_price ?? $product->selling_price ?? 0);

            $item->unit_cost = $unitCost;
            $item->unit_sale_price = $unitSale;
            $item->total_cost = round($item->current_stock * $unitCost, 4);
            $item->total_sale = round($item->current_stock * $unitSale, 4);

            $totalQty += $item->current_stock;
            $totalValuationCost += $item->total_cost;
            $totalValuationSale += $item->total_sale;

            return $item;
        });

        return [
            'balances'   => $balances,
            'filters'    => $request->only(['warehouse_id', 'category_id', 'search']),
            'warehouses' => Warehouse::whereIn('id', $allowedWarehouseIds)->select('id', 'name')->get(),
            'categories' => ProductCategory::select('id', 'name')->get(),
            'summary'    => [
                'total_quantity' => round($totalQty, 2),
                'total_cost'     => round($totalValuationCost, 2),
                'total_sale'     => round($totalValuationSale, 2),
            ],
        ];
    }
}
