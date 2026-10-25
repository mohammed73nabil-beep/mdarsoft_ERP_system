<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Models\Account;
use App\Models\Brand;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\ProductPriceGroupPrice;
use App\Models\ProductSerial;
use App\Models\ProductVariation;
use App\Models\SellingPriceGroup;
use App\Models\StockBalance;
use App\Models\StockMovement;
use App\Models\Tax;
use App\Models\Unit;
use App\Models\Warehouse;
use App\Models\Warranty;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    /**
     * Display a listing of products with server-side search, filters, and pagination.
     */
    public function index(Request $request): Response|JsonResponse
    {
        abort_unless($request->user()?->can('products.view'), 403, 'غير مصرح لك بعرض المنتجات.');

        $user = $request->user();
        $branchWarehouses = Warehouse::query();
        if ($user && !$user->can('branches.view_all') && $user->branch_id) {
            $branchWarehouses->where('branch_id', $user->branch_id);
        }
        $allowedWarehouseIds = $branchWarehouses->pluck('id')->toArray();

        // Selected warehouse filter
        $targetWarehouseIds = $allowedWarehouseIds;
        if ($request->filled('warehouse_id')) {
            $targetWarehouseIds = array_values(array_intersect($allowedWarehouseIds, [(int) $request->warehouse_id]));
        }

        $query = Product::query()
            ->with(['category:id,name', 'brand:id,name', 'unit:id,name,symbol', 'variations:id,product_id,name,sku,cost_price,selling_price']);

        // Search: Name, SKU, Barcode, Serial, IMEI
        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('sku', 'like', "%{$search}%")
                    ->orWhere('barcode', 'like', "%{$search}%")
                    ->orWhereHas('serials', function ($sq) use ($search) {
                        $sq->where('serial_number', 'like', "%{$search}%")
                            ->orWhere('imei1', 'like', "%{$search}%")
                            ->orWhere('imei2', 'like', "%{$search}%");
                    });
            });
        }

        // Filters
        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }
        if ($request->filled('brand_id')) {
            $query->where('brand_id', $request->brand_id);
        }
        if ($request->filled('tracking_type')) {
            $query->where('tracking_type', $request->tracking_type);
        }
        if ($request->filled('is_active')) {
            $query->where('is_active', filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN));
        }

        // Subquery for current stock
        // For 'none': sum of stock_balances.quantity in target warehouses
        // For 'serial': count of product_serials where status='in_stock' in target warehouses
        $targetWarehousesSql = empty($targetWarehouseIds) ? '0' : implode(',', $targetWarehouseIds);

        $query->select('products.*')
            ->selectSub("
                CASE
                    WHEN products.tracking_type = 'serial' THEN (
                        SELECT COUNT(*)
                        FROM product_serials ps
                        WHERE ps.product_id = products.id
                          AND ps.status = 'in_stock'
                          AND ps.warehouse_id IN ({$targetWarehousesSql})
                    )
                    ELSE (
                        SELECT COALESCE(SUM(sb.quantity), 0)
                        FROM stock_balances sb
                        WHERE sb.product_id = products.id
                          AND sb.warehouse_id IN ({$targetWarehousesSql})
                    )
                END
            ", 'current_stock');

        // Filter: low_stock
        if ($request->boolean('low_stock')) {
            $query->whereRaw("
                CASE
                    WHEN products.tracking_type = 'serial' THEN (
                        SELECT COUNT(*)
                        FROM product_serials ps
                        WHERE ps.product_id = products.id
                          AND ps.status = 'in_stock'
                          AND ps.warehouse_id IN ({$targetWarehousesSql})
                    )
                    ELSE (
                        SELECT COALESCE(SUM(sb.quantity), 0)
                        FROM stock_balances sb
                        WHERE sb.product_id = products.id
                          AND sb.warehouse_id IN ({$targetWarehousesSql})
                    )
                END <= products.reorder_level
            ");
        }

        // Sorting
        $sortField = $request->input('sort_by', 'id');
        $sortDirection = $request->input('sort_direction', 'desc');
        $allowedSorts = ['id', 'name', 'sku', 'cost_price', 'selling_price', 'current_stock', 'created_at'];

        if (in_array($sortField, $allowedSorts, true)) {
            $query->orderBy($sortField, $sortDirection === 'asc' ? 'asc' : 'desc');
        } else {
            $query->orderByDesc('id');
        }

        $perPage = (int) $request->input('per_page', 25);
        if (!in_array($perPage, [25, 50, 100], true)) {
            $perPage = 25;
        }

        $products = $query->paginate($perPage)->withQueryString();

        if ($request->wantsJson()) {
            return response()->json($products);
        }

        return Inertia::render('Products/Index', [
            'products' => $products,
            'filters' => $request->only(['search', 'category_id', 'brand_id', 'tracking_type', 'warehouse_id', 'is_active', 'low_stock', 'sort_by', 'sort_direction', 'per_page']),
            'categories' => ProductCategory::select('id', 'name', 'parent_id')->get(),
            'brands' => Brand::select('id', 'name')->where('is_active', true)->get(),
            'units' => Unit::select('id', 'name', 'symbol')->where('is_active', true)->get(),
            'warehouses' => Warehouse::whereIn('id', $allowedWarehouseIds)->select('id', 'name', 'branch_id')->get(),
        ]);
    }

    /**
     * Show the form for creating a new product.
     */
    public function create(Request $request): Response
    {
        abort_unless($request->user()?->can('products.create'), 403, 'غير مصرح لك بإضافة منتجات.');

        return Inertia::render('Products/Create', [
            'categories' => ProductCategory::select('id', 'name', 'parent_id')->get(),
            'brands' => Brand::select('id', 'name')->where('is_active', true)->get(),
            'units' => Unit::select('id', 'name', 'symbol')->where('is_active', true)->get(),
            'warranties' => Warranty::select('id', 'name', 'duration_months')->get(),
            'taxes' => Tax::select('id', 'name', 'rate')->where('is_active', true)->get(),
            'sellingPriceGroups' => SellingPriceGroup::select('id', 'name')->where('is_active', true)->get(),
            'accounts' => [
                'income' => Account::where('code', '4100')->select('id', 'code', 'name')->first(),
                'cogs' => Account::where('code', '5100')->select('id', 'code', 'name')->first(),
                'inventory' => Account::where('code', '1140')->select('id', 'code', 'name')->first(),
            ],
            'autoSku' => 'PRD-' . strtoupper(bin2hex(random_bytes(3))),
        ]);
    }

    /**
     * Store a newly created product in storage.
     */
    public function store(StoreProductRequest $request): RedirectResponse|JsonResponse
    {
        $data = $request->validated();

        $product = DB::transaction(function () use ($data, $request) {
            $productData = [
                'type' => $data['type'],
                'name' => $data['name'],
                'sku' => $data['sku'],
                'barcode' => $data['barcode'] ?? null,
                'category_id' => $data['category_id'] ?? null,
                'brand_id' => $data['brand_id'] ?? null,
                'unit_id' => $data['unit_id'],
                'purchase_unit_id' => $data['purchase_unit_id'] ?? null,
                'warranty_id' => $data['warranty_id'] ?? null,
                'tracking_type' => $data['tracking_type'],
                'cost_price' => $data['cost_price'],
                'selling_price' => $data['selling_price'],
                'min_selling_price' => $data['min_selling_price'] ?? 0,
                'reorder_level' => $data['reorder_level'] ?? 0,
                'tax_id' => $data['tax_id'] ?? null,
                'income_account_id' => $data['income_account_id'] ?? Account::where('code', '4100')->value('id'),
                'cogs_account_id' => $data['cogs_account_id'] ?? Account::where('code', '5100')->value('id'),
                'inventory_account_id' => $data['inventory_account_id'] ?? Account::where('code', '1140')->value('id'),
                'description' => $data['description'] ?? null,
                'is_active' => $data['is_active'] ?? true,
            ];

            // Image handling
            if ($request->hasFile('image')) {
                $path = $request->file('image')->store('products', 'public');
                $productData['image'] = '/storage/' . $path;
            }

            /** @var Product $product */
            $product = Product::create($productData);

            // Create Variations if variable
            if ($product->type === 'variable' && !empty($data['variations'])) {
                foreach ($data['variations'] as $v) {
                    ProductVariation::create([
                        'product_id' => $product->id,
                        'name' => $v['name'],
                        'sku' => $v['sku'],
                        'barcode' => $v['barcode'] ?? null,
                        'cost_price' => $v['cost_price'] ?? $product->cost_price,
                        'selling_price' => $v['selling_price'] ?? $product->selling_price,
                        'is_active' => true,
                    ]);
                }
            }

            // Price groups
            if (!empty($data['price_group_prices'])) {
                foreach ($data['price_group_prices'] as $pg) {
                    ProductPriceGroupPrice::create([
                        'product_id' => $product->id,
                        'selling_price_group_id' => $pg['selling_price_group_id'],
                        'variation_id' => null,
                        'price' => $pg['price'],
                    ]);
                }
            }

            return $product;
        });

        if ($request->wantsJson()) {
            return response()->json([
                'message' => 'تم إنشاء المنتج بنجاح.',
                'product' => $product->load(['variations', 'category', 'unit']),
            ], 201);
        }

        // Action button redirect handling
        $action = $request->input('action', 'save');
        if ($action === 'save_and_add_another') {
            return redirect()->route('products.create')->with('success', 'تم حفظ المنتج بنجاح، يمكنك الآن إضافة منتج آخر.');
        }

        if ($action === 'save_and_opening_stock') {
            return redirect()->route('products.index', ['open_stock_for' => $product->id])
                ->with('success', 'تم حفظ المنتج. يرجى إدخال بضاعة أول المدة.');
        }

        return redirect()->route('products.index')->with('success', 'تم حفظ المنتج بنجاح.');
    }

    /**
     * Show the product details.
     */
    public function show(Request $request, Product $product): Response|JsonResponse
    {
        abort_unless($request->user()?->can('products.view'), 403, 'غير مصرح لك بعرض هذا المنتج.');

        $product->load([
            'category',
            'brand',
            'unit',
            'warranty',
            'tax',
            'variations',
            'priceGroupPrices.sellingPriceGroup',
            'stockBalances.warehouse',
        ]);

        if ($product->tracking_type === 'serial') {
            $product->load(['serials' => function ($q) {
                $q->latest()->take(50);
            }]);
        }

        if ($request->wantsJson()) {
            return response()->json($product);
        }

        return Inertia::render('Products/Show', [
            'product' => $product,
        ]);
    }

    /**
     * Show the form for editing the specified product.
     */
    public function edit(Request $request, Product $product): Response
    {
        abort_unless($request->user()?->can('products.edit'), 403, 'غير مصرح لك بتعديل هذا المنتج.');

        $product->load(['variations', 'priceGroupPrices']);
        $hasMovements = StockMovement::where('product_id', $product->id)->exists();

        return Inertia::render('Products/Edit', [
            'product' => $product,
            'hasMovements' => $hasMovements,
            'categories' => ProductCategory::select('id', 'name', 'parent_id')->get(),
            'brands' => Brand::select('id', 'name')->where('is_active', true)->get(),
            'units' => Unit::select('id', 'name', 'symbol')->where('is_active', true)->get(),
            'warranties' => Warranty::select('id', 'name', 'duration_months')->get(),
            'taxes' => Tax::select('id', 'name', 'rate')->where('is_active', true)->get(),
            'sellingPriceGroups' => SellingPriceGroup::select('id', 'name')->where('is_active', true)->get(),
            'accounts' => [
                'income' => Account::where('code', '4100')->select('id', 'code', 'name')->first(),
                'cogs' => Account::where('code', '5100')->select('id', 'code', 'name')->first(),
                'inventory' => Account::where('code', '1140')->select('id', 'code', 'name')->first(),
            ],
        ]);
    }

    /**
     * Update the specified product in storage.
     */
    public function update(UpdateProductRequest $request, Product $product): RedirectResponse|JsonResponse
    {
        $data = $request->validated();

        DB::transaction(function () use ($data, $request, $product) {
            $hasMovements = StockMovement::where('product_id', $product->id)->exists();

            if ($hasMovements && isset($data['tracking_type']) && $data['tracking_type'] !== $product->tracking_type) {
                abort(422, 'لا يمكن تغيير نوع التتبع بعد وجود حركات مخزون لهذا المنتج.');
            }

            $productData = [
                'type' => $data['type'],
                'name' => $data['name'],
                'sku' => $data['sku'],
                'barcode' => $data['barcode'] ?? null,
                'category_id' => $data['category_id'] ?? null,
                'brand_id' => $data['brand_id'] ?? null,
                'unit_id' => $data['unit_id'],
                'purchase_unit_id' => $data['purchase_unit_id'] ?? null,
                'warranty_id' => $data['warranty_id'] ?? null,
                'tracking_type' => $hasMovements ? $product->tracking_type : $data['tracking_type'],
                'cost_price' => $data['cost_price'],
                'selling_price' => $data['selling_price'],
                'min_selling_price' => $data['min_selling_price'] ?? 0,
                'reorder_level' => $data['reorder_level'] ?? 0,
                'tax_id' => $data['tax_id'] ?? null,
                'income_account_id' => $data['income_account_id'] ?? null,
                'cogs_account_id' => $data['cogs_account_id'] ?? null,
                'inventory_account_id' => $data['inventory_account_id'] ?? null,
                'description' => $data['description'] ?? null,
                'is_active' => $data['is_active'] ?? true,
            ];

            if ($request->hasFile('image')) {
                $path = $request->file('image')->store('products', 'public');
                $productData['image'] = '/storage/' . $path;
            }

            $product->update($productData);

            // Update variations
            if ($product->type === 'variable' && isset($data['variations'])) {
                $sentIds = [];
                foreach ($data['variations'] as $v) {
                    if (!empty($v['id'])) {
                        $variation = ProductVariation::where('id', $v['id'])->where('product_id', $product->id)->first();
                        if ($variation) {
                            $variation->update([
                                'name' => $v['name'],
                                'sku' => $v['sku'],
                                'barcode' => $v['barcode'] ?? null,
                                'cost_price' => $v['cost_price'] ?? $product->cost_price,
                                'selling_price' => $v['selling_price'] ?? $product->selling_price,
                            ]);
                            $sentIds[] = $variation->id;
                        }
                    } else {
                        $created = ProductVariation::create([
                            'product_id' => $product->id,
                            'name' => $v['name'],
                            'sku' => $v['sku'],
                            'barcode' => $v['barcode'] ?? null,
                            'cost_price' => $v['cost_price'] ?? $product->cost_price,
                            'selling_price' => $v['selling_price'] ?? $product->selling_price,
                            'is_active' => true,
                        ]);
                        $sentIds[] = $created->id;
                    }
                }
                // Soft delete removed variations if no movements
                ProductVariation::where('product_id', $product->id)
                    ->whereNotIn('id', $sentIds)
                    ->delete();
            }

            // Update price groups
            if (isset($data['price_group_prices'])) {
                ProductPriceGroupPrice::where('product_id', $product->id)->delete();
                foreach ($data['price_group_prices'] as $pg) {
                    ProductPriceGroupPrice::create([
                        'product_id' => $product->id,
                        'selling_price_group_id' => $pg['selling_price_group_id'],
                        'variation_id' => null,
                        'price' => $pg['price'],
                    ]);
                }
            }
        });

        if ($request->wantsJson()) {
            return response()->json(['message' => 'تم تحديث المنتج بنجاح.', 'product' => $product]);
        }

        return redirect()->route('products.index')->with('success', 'تم تحديث بيانات المنتج بنجاح.');
    }

    /**
     * Remove the specified product from storage (soft delete).
     * Strictly forbidden if product has stock movements.
     */
    public function destroy(Request $request, Product $product): RedirectResponse|JsonResponse
    {
        abort_unless($request->user()?->can('products.delete'), 403, 'غير مصرح لك بحذف المنتجات.');

        // Rule: Forbidden if stock movements exist
        if ($product->stockMovements()->exists()) {
            if ($request->wantsJson()) {
                return response()->json(['message' => 'لا يمكن حذف منتج له حركات مخزون مسجلة.'], 422);
            }
            return back()->with('error', 'لا يمكن حذف منتج له حركات مخزون مسجلة مسبقاً في الدفاتر.');
        }

        $product->delete();

        if ($request->wantsJson()) {
            return response()->json(['message' => 'تم حذف المنتج بنجاح.']);
        }

        return redirect()->route('products.index')->with('success', 'تم حذف المنتج بنجاح.');
    }

    /**
     * Toggle product active status.
     */
    public function toggleActive(Request $request, Product $product): RedirectResponse|JsonResponse
    {
        abort_unless($request->user()?->can('products.edit'), 403, 'غير مصرح لك بتعديل حالة المنتج.');

        $product->is_active = !$product->is_active;
        $product->save();

        if ($request->wantsJson()) {
            return response()->json(['message' => 'تم تحديث حالة المنتج.', 'is_active' => $product->is_active]);
        }

        return back()->with('success', 'تم تحديث حالة المنتج بنجاح.');
    }

    /**
     * Quick query endpoint by Barcode, SKU, Serial Number, or IMEI.
     */
    public function quickQuery(Request $request): JsonResponse
    {
        abort_unless($request->user()?->can('products.view'), 403, 'غير مصرح لك بالاستعلام.');

        $query = trim($request->input('query', ''));
        if ($query === '') {
            $products = Product::where('is_active', true)
                ->select(['id', 'name', 'sku'])
                ->limit(20)
                ->get();

            return response()->json($products);
        }

        $user = $request->user();
        $branchWarehouses = Warehouse::query();
        if ($user && !$user->can('branches.view_all') && $user->branch_id) {
            $branchWarehouses->where('branch_id', $user->branch_id);
        }
        $allowedWarehouseIds = $branchWarehouses->pluck('id')->toArray();

        // 1. Check if it matches a Product Serial / IMEI directly
        $serial = ProductSerial::where(function ($q) use ($query) {
            $q->where('serial_number', $query)
                ->orWhere('imei1', $query)
                ->orWhere('imei2', $query);
        })
            ->with(['product.category', 'product.brand', 'product.unit', 'warehouse', 'events.creator'])
            ->first();

        if ($serial) {
            return response()->json([
                'found' => true,
                'type' => 'serial',
                'serial' => [
                    'id' => $serial->id,
                    'serial_number' => $serial->serial_number,
                    'imei1' => $serial->imei1,
                    'imei2' => $serial->imei2,
                    'status' => $serial->status,
                    'cost_price' => (float) $serial->cost_price,
                    'warehouse' => $serial->warehouse ? ['id' => $serial->warehouse->id, 'name' => $serial->warehouse->name] : null,
                ],
                'product' => [
                    'id' => $serial->product->id,
                    'name' => $serial->product->name,
                    'sku' => $serial->product->sku,
                    'barcode' => $serial->product->barcode,
                    'category' => $serial->product->category?->name,
                    'brand' => $serial->product->brand?->name,
                    'unit' => $serial->product->unit?->name,
                    'selling_price' => (float) $serial->product->selling_price,
                ],
                'events' => $serial->events->map(function ($event) {
                    return [
                        'id' => $event->id,
                        'event_type' => $event->event_type,
                        'from_status' => $event->from_status,
                        'to_status' => $event->to_status,
                        'created_at' => $event->created_at->format('Y-m-d H:i:s'),
                        'created_by' => $event->creator?->name,
                        'notes' => $event->notes,
                    ];
                }),
            ]);
        }

        // 2. Otherwise search product by Barcode or SKU
        $product = Product::where('barcode', $query)
            ->orWhere('sku', $query)
            ->with(['category', 'brand', 'unit', 'variations'])
            ->first();

        if ($product) {
            $balances = StockBalance::where('product_id', $product->id)
                ->whereIn('warehouse_id', $allowedWarehouseIds)
                ->with('warehouse:id,name')
                ->get()
                ->map(fn ($b) => [
                    'warehouse_name' => $b->warehouse?->name,
                    'quantity' => (float) $b->quantity,
                    'avg_cost' => (float) $b->avg_cost,
                ]);

            $totalStock = $product->tracking_type === 'serial'
                ? ProductSerial::where('product_id', $product->id)->whereIn('warehouse_id', $allowedWarehouseIds)->where('status', 'in_stock')->count()
                : StockBalance::where('product_id', $product->id)->whereIn('warehouse_id', $allowedWarehouseIds)->sum('quantity');

            return response()->json([
                'found' => true,
                'type' => 'product',
                'product' => [
                    'id' => $product->id,
                    'name' => $product->name,
                    'sku' => $product->sku,
                    'barcode' => $product->barcode,
                    'category' => $product->category?->name,
                    'brand' => $product->brand?->name,
                    'unit' => $product->unit?->name,
                    'tracking_type' => $product->tracking_type,
                    'cost_price' => (float) $product->cost_price,
                    'selling_price' => (float) $product->selling_price,
                    'total_stock' => (float) $totalStock,
                    'balances' => $balances,
                ],
            ]);
        }

        return response()->json(['found' => false, 'message' => 'لم يتم العثور على أي منتج أو جهاز مطابق للبيان المدخل.']);
    }
}
