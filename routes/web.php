<?php

use App\Http\Controllers\AccountController;
use App\Http\Controllers\DashboardController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Web Routes - نظام ERP المحاسبي
|--------------------------------------------------------------------------
| مسارات الوحدات الـ 23 وقوائمها الفرعية المعرفة في menu.config.js
| الوحدات المعطلة (enabled: false) تُعيد 404
*/

// دالة مساعدة لتوليد واجهة الموديول الموحدة
$renderModule = function (string $title, string $href, string $category = '', string $key = '') {
    return Inertia::render('ModuleView', [
        'title' => $title,
        'href' => $href,
        'category' => $category,
        'keyName' => $key,
    ]);
};

// ==========================================
// 1. الرئيسية
// ==========================================
Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

// ==========================================
// 2. موديول المبيعات
// ==========================================
Route::get('/sales', fn () => $renderModule('موديول المبيعات', '/sales', 'المبيعات', 'sales'))->name('sales');

// مرتجعات المبيعات
Route::get('/sales/returns', [\App\Http\Controllers\SaleReturnController::class, 'index'])->name('sales.returns.index');
Route::get('/sales/returns/create', [\App\Http\Controllers\SaleReturnController::class, 'create'])->name('sales.returns.create');
Route::post('/sales/returns', [\App\Http\Controllers\SaleReturnController::class, 'store'])->name('sales.returns.store');
Route::get('/sales/returns/{saleReturn}', [\App\Http\Controllers\SaleReturnController::class, 'show'])->name('sales.returns.show');

// عروض الأسعار (Quotations)
Route::get('/sales/quotations', [\App\Http\Controllers\QuotationController::class, 'index'])->name('sales.quotations.index');
Route::get('/sales/quotations/create', [\App\Http\Controllers\QuotationController::class, 'create'])->name('sales.quotations.create');
Route::post('/sales/quotations', [\App\Http\Controllers\QuotationController::class, 'store'])->name('sales.quotations.store');
Route::get('/sales/quotations/{quotation}', [\App\Http\Controllers\QuotationController::class, 'show'])->name('sales.quotations.show');

// مسودات البيع (Drafts)
Route::get('/sales/drafts', [\App\Http\Controllers\SaleDraftController::class, 'index'])->name('sales.drafts.index');
Route::get('/sales/drafts/create', [\App\Http\Controllers\SaleDraftController::class, 'create'])->name('sales.drafts.create');
Route::post('/sales/drafts', [\App\Http\Controllers\SaleDraftController::class, 'store'])->name('sales.drafts.store');
Route::delete('/sales/drafts/{draft}', [\App\Http\Controllers\SaleDraftController::class, 'destroy'])->name('sales.drafts.destroy');

// الخصومات (Discounts)
Route::get('/sales/discounts', [\App\Http\Controllers\DiscountController::class, 'index'])->name('sales.discounts.index');
Route::post('/sales/discounts', [\App\Http\Controllers\DiscountController::class, 'store'])->name('sales.discounts.store');
Route::put('/sales/discounts/{discount}', [\App\Http\Controllers\DiscountController::class, 'update'])->name('sales.discounts.update');
Route::delete('/sales/discounts/{discount}', [\App\Http\Controllers\DiscountController::class, 'destroy'])->name('sales.discounts.destroy');

// نقاط البيع (POS Sessions)
Route::get('/sales/pos-list', [\App\Http\Controllers\PosSessionController::class, 'index'])->name('sales.pos.sessions');
Route::get('/sales/pos', [\App\Http\Controllers\PosSessionController::class, 'posScreen'])->name('sales.pos.screen');
Route::post('/sales/pos/open', [\App\Http\Controllers\PosSessionController::class, 'open'])->name('sales.pos.open');
Route::post('/sales/pos/checkout', [\App\Http\Controllers\PosSessionController::class, 'checkout'])->name('sales.pos.checkout');
Route::post('/sales/pos/{posSession}/close', [\App\Http\Controllers\PosSessionController::class, 'close'])->name('sales.pos.close');
Route::get('/sales/pos/{posSession}', [\App\Http\Controllers\PosSessionController::class, 'show'])->name('sales.pos.show');

// الشحنات (Shipments)
Route::get('/sales/shipments', [\App\Http\Controllers\ShipmentController::class, 'index'])->name('sales.shipments.index');
Route::post('/sales/shipments', [\App\Http\Controllers\ShipmentController::class, 'store'])->name('sales.shipments.store');
Route::get('/sales/shipments/{shipment}', [\App\Http\Controllers\ShipmentController::class, 'show'])->name('sales.shipments.show');
Route::put('/sales/shipments/{shipment}', [\App\Http\Controllers\ShipmentController::class, 'update'])->name('sales.shipments.update');
Route::get('/sales/import', fn () => $renderModule('استيراد المبيعات', '/sales/import', 'المبيعات', 'sales_import'));
Route::get('/sales/purchases-and-sales', fn () => $renderModule('مشتريات ومبيعات', '/sales/purchases-and-sales', 'المبيعات', 'sales_purchases_and_sales'));
Route::get('/sales/reports/sales-report', fn () => $renderModule('تقرير المبيعات', '/sales/reports/sales-report', 'المبيعات', 'sales_report'));
Route::get('/sales/electronic-invoice', fn () => $renderModule('فاتورة مبيعات إلكترونية', '/sales/electronic-invoice', 'المبيعات', 'sales_electronic_invoice'));
Route::get('/sales/reports/products-sales', fn () => $renderModule('تقرير مبيعات المنتجات', '/sales/reports/products-sales', 'المبيعات', 'sales_products_sales_report'));
Route::get('/sales/reports/products-returns', fn () => $renderModule('تقرير مرتجع المنتجات', '/sales/reports/products-returns', 'المبيعات', 'sales_products_returns_report'));

// فواتير المبيعات
Route::get('/sales/all', [\App\Http\Controllers\SaleController::class, 'index'])->name('sales.index');
Route::get('/sales/create', [\App\Http\Controllers\SaleController::class, 'create'])->name('sales.create');
Route::post('/sales', [\App\Http\Controllers\SaleController::class, 'store'])->name('sales.store');
Route::get('/sales/{sale}', [\App\Http\Controllers\SaleController::class, 'show'])->whereNumber('sale')->name('sales.show');
Route::delete('/sales/{sale}', [\App\Http\Controllers\SaleController::class, 'destroy'])->whereNumber('sale')->name('sales.destroy');
Route::post('/sales/{sale}/payments', [\App\Http\Controllers\SaleController::class, 'recordPayment'])->whereNumber('sale')->name('sales.payments.store');
Route::delete('/sales/payments/{payment}', [\App\Http\Controllers\SaleController::class, 'deletePayment'])->whereNumber('payment')->name('sales.payments.destroy');

// ==========================================
// 3. موديول المشتريات
// ==========================================
Route::get('/purchases', fn () => $renderModule('موديول المشتريات', '/purchases', 'المشتريات', 'purchases'))->name('purchases');

// تقارير المشتريات (قبل المعلمات الديناميكية)
Route::get('/purchases/reports/items', [\App\Http\Controllers\PurchaseReportController::class, 'items'])->name('purchases.reports.items');
Route::get('/purchases/reports/products', [\App\Http\Controllers\PurchaseReportController::class, 'products'])->name('purchases.reports.products');
Route::get('/purchases/reports/products-returns', [\App\Http\Controllers\PurchaseReportController::class, 'productsReturns'])->name('purchases.reports.products_returns');
Route::get('/purchases/reports/summary', [\App\Http\Controllers\PurchaseReportController::class, 'summary'])->name('purchases.reports.summary');

// مرتجع المشتريات (قبل المعلمات الديناميكية)
Route::get('/purchases/returns', [\App\Http\Controllers\PurchaseReturnController::class, 'index'])->name('purchases.returns.index');
Route::get('/purchases/returns/create', [\App\Http\Controllers\PurchaseReturnController::class, 'create'])->name('purchases.returns.create');
Route::post('/purchases/returns', [\App\Http\Controllers\PurchaseReturnController::class, 'store'])->name('purchases.returns.store');
Route::get('/purchases/returns/{purchaseReturn}', [\App\Http\Controllers\PurchaseReturnController::class, 'show'])->name('purchases.returns.show');

// طلبيات الشراء
Route::get('/purchases/order-requests', [\App\Http\Controllers\PurchaseController::class, 'orderRequests'])->name('purchases.order_requests');

// فواتير وأوامر الشراء
Route::get('/purchases/list', [\App\Http\Controllers\PurchaseController::class, 'index'])->name('purchases.index');
Route::get('/purchases/create', [\App\Http\Controllers\PurchaseController::class, 'create'])->name('purchases.create');
Route::post('/purchases', [\App\Http\Controllers\PurchaseController::class, 'store'])->name('purchases.store');
Route::get('/purchases/{purchase}', [\App\Http\Controllers\PurchaseController::class, 'show'])->name('purchases.show');
Route::delete('/purchases/{purchase}', [\App\Http\Controllers\PurchaseController::class, 'destroy'])->name('purchases.destroy');
Route::post('/purchases/{purchase}/receive', [\App\Http\Controllers\PurchaseController::class, 'receive'])->name('purchases.receive');
Route::post('/purchases/{purchase}/payments', [\App\Http\Controllers\PurchaseController::class, 'recordPayment'])->name('purchases.payments.store');
Route::delete('/purchases/payments/{payment}', [\App\Http\Controllers\PurchaseController::class, 'deletePayment'])->name('purchases.payments.destroy');

// ==========================================
// 4. المخازن
// ==========================================
// ==========================================
// 4. المخازن
// ==========================================
Route::get('/inventory', fn () => $renderModule('المخازن', '/inventory', 'المخازن', 'inventory'))->name('inventory');

// بضاعة أول المدة
Route::get('/inventory/opening-stock', [\App\Http\Controllers\OpeningStockController::class, 'index'])->name('inventory.opening_stock.index');
Route::get('/inventory/opening-stock/create', [\App\Http\Controllers\OpeningStockController::class, 'create'])->name('inventory.opening_stock.create');
Route::post('/inventory/opening-stock', [\App\Http\Controllers\OpeningStockController::class, 'store'])->name('inventory.opening_stock.store');
Route::get('/inventory/opening-stock/{openingStock}', [\App\Http\Controllers\OpeningStockController::class, 'show'])->name('inventory.opening_stock.show');
Route::post('/inventory/opening-stock/{openingStock}/post', [\App\Http\Controllers\OpeningStockController::class, 'post'])->name('inventory.opening_stock.post');

// تقارير الجرد
Route::get('/inventory/reports/stocktaking-cost', [\App\Http\Controllers\StocktakingReportController::class, 'cost'])->name('inventory.reports.stocktaking_cost');
Route::get('/inventory/reports/stocktaking-sale', [\App\Http\Controllers\StocktakingReportController::class, 'sale'])->name('inventory.reports.stocktaking_sale');
Route::get('/inventory/reports/stocktaking-no-price', [\App\Http\Controllers\StocktakingReportController::class, 'noPrice'])->name('inventory.reports.stocktaking_no_price');
Route::get('/inventory/reports/summary', [\App\Http\Controllers\StocktakingReportController::class, 'summary'])->name('inventory.reports.summary');

// أذونات الصرف
Route::get('/inventory/vouchers/delivery', [\App\Http\Controllers\StockVoucherController::class, 'deliveryIndex'])->name('inventory.vouchers.delivery');
Route::get('/inventory/vouchers/delivery/create', [\App\Http\Controllers\StockVoucherController::class, 'deliveryCreate'])->name('inventory.vouchers.delivery.create');
Route::post('/inventory/vouchers/delivery', [\App\Http\Controllers\StockVoucherController::class, 'deliveryStore'])->name('inventory.vouchers.delivery.store');
Route::get('/inventory/vouchers/delivery/{voucher}', [\App\Http\Controllers\StockVoucherController::class, 'deliveryShow'])->name('inventory.vouchers.delivery.show');
Route::post('/inventory/vouchers/delivery/{voucher}/post', [\App\Http\Controllers\StockVoucherController::class, 'post'])->name('inventory.vouchers.delivery.post');

// أذونات الإضافة
Route::get('/inventory/vouchers/receiving', [\App\Http\Controllers\StockVoucherController::class, 'receivingIndex'])->name('inventory.vouchers.receiving');
Route::get('/inventory/vouchers/receiving/create', [\App\Http\Controllers\StockVoucherController::class, 'receivingCreate'])->name('inventory.vouchers.receiving.create');
Route::post('/inventory/vouchers/receiving', [\App\Http\Controllers\StockVoucherController::class, 'receivingStore'])->name('inventory.vouchers.receiving.store');
Route::get('/inventory/vouchers/receiving/{voucher}', [\App\Http\Controllers\StockVoucherController::class, 'receivingShow'])->name('inventory.vouchers.receiving.show');
Route::post('/inventory/vouchers/receiving/{voucher}/post', [\App\Http\Controllers\StockVoucherController::class, 'post'])->name('inventory.vouchers.receiving.post');

// تحويلات المخزون
Route::get('/inventory/transfers', [\App\Http\Controllers\InventoryTransferController::class, 'index'])->name('inventory.transfers.index');
Route::get('/inventory/transfers/create', [\App\Http\Controllers\InventoryTransferController::class, 'create'])->name('inventory.transfers.create');
Route::post('/inventory/transfers', [\App\Http\Controllers\InventoryTransferController::class, 'store'])->name('inventory.transfers.store');
Route::get('/inventory/transfers/{transfer}', [\App\Http\Controllers\InventoryTransferController::class, 'show'])->name('inventory.transfers.show');
Route::post('/inventory/transfers/{transfer}/send', [\App\Http\Controllers\InventoryTransferController::class, 'send'])->name('inventory.transfers.send');
Route::post('/inventory/transfers/{transfer}/receive', [\App\Http\Controllers\InventoryTransferController::class, 'receive'])->name('inventory.transfers.receive');

// المخزون التالف
Route::get('/inventory/damaged', [\App\Http\Controllers\DamagedStockController::class, 'index'])->name('inventory.damaged.index');
Route::get('/inventory/damaged/create', [\App\Http\Controllers\DamagedStockController::class, 'create'])->name('inventory.damaged.create');
Route::post('/inventory/damaged', [\App\Http\Controllers\DamagedStockController::class, 'store'])->name('inventory.damaged.store');
Route::get('/inventory/damaged/{damagedStock}', [\App\Http\Controllers\DamagedStockController::class, 'show'])->name('inventory.damaged.show');
Route::post('/inventory/damaged/{damagedStock}/post', [\App\Http\Controllers\DamagedStockController::class, 'post'])->name('inventory.damaged.post');

// ==========================================
// 5. إدارة المستخدمين
// ==========================================
Route::get('/users', [\App\Http\Controllers\UserController::class, 'index'])->name('users');
Route::get('/users/list', [\App\Http\Controllers\UserController::class, 'index'])->name('users.list');
Route::post('/users', [\App\Http\Controllers\UserController::class, 'store'])->name('users.store');
Route::put('/users/{user}', [\App\Http\Controllers\UserController::class, 'update'])->name('users.update');
Route::post('/users/{user}/toggle-active', [\App\Http\Controllers\UserController::class, 'toggleActive'])->name('users.toggle_active');

Route::get('/users/roles', [\App\Http\Controllers\UserController::class, 'rolesIndex'])->name('users.roles');
Route::post('/users/roles', [\App\Http\Controllers\UserController::class, 'rolesStore'])->name('users.roles.store');

Route::get('/users/representatives', [\App\Http\Controllers\UserController::class, 'representativesIndex'])->name('users.representatives');
Route::post('/users/representatives', [\App\Http\Controllers\UserController::class, 'representativesStore'])->name('users.representatives.store');

// ==========================================
// 6. جهات الاتصال (الموردون والعملاء وكشف الحساب ومجموعات جهات التعامل)
// ==========================================
Route::get('/contacts', fn () => $renderModule('جهات الاتصال', '/contacts', 'جهات الاتصال', 'contacts'))->name('contacts');

// الموردين (Suppliers)
Route::get('/contacts/suppliers', [\App\Http\Controllers\ContactController::class, 'suppliersIndex'])->name('contacts.suppliers.index');
Route::get('/contacts/suppliers/create', [\App\Http\Controllers\ContactController::class, 'suppliersCreate'])->name('contacts.suppliers.create');
Route::post('/contacts/suppliers', [\App\Http\Controllers\ContactController::class, 'suppliersStore'])->name('contacts.suppliers.store');
Route::get('/contacts/suppliers/{contact}', [\App\Http\Controllers\ContactController::class, 'suppliersShow'])->name('contacts.suppliers.show');
Route::get('/contacts/suppliers/{contact}/edit', [\App\Http\Controllers\ContactController::class, 'suppliersEdit'])->name('contacts.suppliers.edit');
Route::put('/contacts/suppliers/{contact}', [\App\Http\Controllers\ContactController::class, 'suppliersUpdate'])->name('contacts.suppliers.update');

// العملاء (Customers)
Route::get('/contacts/customers', [\App\Http\Controllers\ContactController::class, 'customersIndex'])->name('contacts.customers.index');
Route::get('/contacts/customers/create', [\App\Http\Controllers\ContactController::class, 'customersCreate'])->name('contacts.customers.create');
Route::post('/contacts/customers', [\App\Http\Controllers\ContactController::class, 'customersStore'])->name('contacts.customers.store');
Route::get('/contacts/customers/{contact}', [\App\Http\Controllers\ContactController::class, 'customersShow'])->name('contacts.customers.show');
Route::get('/contacts/customers/{contact}/edit', [\App\Http\Controllers\ContactController::class, 'customersEdit'])->name('contacts.customers.edit');
Route::put('/contacts/customers/{contact}', [\App\Http\Controllers\ContactController::class, 'customersUpdate'])->name('contacts.customers.update');

// عمليات مشتركة (حذف، تفعيل/تعطيل، كشف حساب تفصيلي)
Route::delete('/contacts/{contact}', [\App\Http\Controllers\ContactController::class, 'destroy'])->name('contacts.destroy');
Route::post('/contacts/{contact}/toggle-active', [\App\Http\Controllers\ContactController::class, 'toggleActive'])->name('contacts.toggle_active');
Route::get('/contacts/{contact}/ledger', [\App\Http\Controllers\ContactController::class, 'ledger'])->name('contacts.ledger');

// مجموعات جهات التعامل (Customer Groups)
Route::get('/contacts/customer-groups', [\App\Http\Controllers\ContactGroupController::class, 'index'])->name('contacts.customer_groups.index');
Route::post('/contacts/customer-groups', [\App\Http\Controllers\ContactGroupController::class, 'store'])->name('contacts.customer_groups.store');
Route::put('/contacts/customer-groups/{group}', [\App\Http\Controllers\ContactGroupController::class, 'update'])->name('contacts.customer_groups.update');
Route::delete('/contacts/customer-groups/{group}', [\App\Http\Controllers\ContactGroupController::class, 'destroy'])->name('contacts.customer_groups.destroy');

// تقارير واستيراد
Route::get('/contacts/reports/upcoming-visits', fn () => $renderModule('تقرير الزيارات القادمة', '/contacts/reports/upcoming-visits', 'جهات الاتصال', 'contacts_upcoming_visits_report'));
Route::get('/contacts/import', fn () => $renderModule('استيراد جهات الاتصال', '/contacts/import', 'جهات الاتصال', 'contacts_import'));

// ==========================================
// 7. المنتجات
// ==========================================
Route::get('/products', [\App\Http\Controllers\ProductController::class, 'index'])->name('products.index');
Route::get('/products/list', [\App\Http\Controllers\ProductController::class, 'index'])->name('products.list');
Route::get('/products/create', [\App\Http\Controllers\ProductController::class, 'create'])->name('products.create');
Route::post('/products', [\App\Http\Controllers\ProductController::class, 'store'])->name('products.store');
Route::get('/products/quick-query', [\App\Http\Controllers\ProductController::class, 'quickQuery'])->name('products.quick_query');

// Serials
Route::get('/products/serials', [\App\Http\Controllers\ProductSerialController::class, 'index'])->name('products.serials.index');
Route::post('/products/serials/batch', [\App\Http\Controllers\ProductSerialController::class, 'storeBatch'])->name('products.serials.store_batch');
Route::post('/products/serials/{serial}/transition', [\App\Http\Controllers\ProductSerialController::class, 'transition'])->name('products.serials.transition');

// Auxiliary tables
Route::get('/products/categories', [\App\Http\Controllers\ProductCategoryController::class, 'index'])->name('products.categories');
Route::post('/products/categories', [\App\Http\Controllers\ProductCategoryController::class, 'store'])->name('products.categories.store');
Route::put('/products/categories/{category}', [\App\Http\Controllers\ProductCategoryController::class, 'update'])->name('products.categories.update');
Route::delete('/products/categories/{category}', [\App\Http\Controllers\ProductCategoryController::class, 'destroy'])->name('products.categories.destroy');

Route::get('/products/brands', [\App\Http\Controllers\BrandController::class, 'index'])->name('products.brands');
Route::post('/products/brands', [\App\Http\Controllers\BrandController::class, 'store'])->name('products.brands.store');
Route::put('/products/brands/{brand}', [\App\Http\Controllers\BrandController::class, 'update'])->name('products.brands.update');
Route::delete('/products/brands/{brand}', [\App\Http\Controllers\BrandController::class, 'destroy'])->name('products.brands.destroy');

Route::get('/products/units', [\App\Http\Controllers\UnitController::class, 'index'])->name('products.units');
Route::post('/products/units', [\App\Http\Controllers\UnitController::class, 'store'])->name('products.units.store');
Route::put('/products/units/{unit}', [\App\Http\Controllers\UnitController::class, 'update'])->name('products.units.update');
Route::delete('/products/units/{unit}', [\App\Http\Controllers\UnitController::class, 'destroy'])->name('products.units.destroy');

Route::get('/products/warranties', [\App\Http\Controllers\WarrantyController::class, 'index'])->name('products.warranties');
Route::post('/products/warranties', [\App\Http\Controllers\WarrantyController::class, 'store'])->name('products.warranties.store');
Route::put('/products/warranties/{warranty}', [\App\Http\Controllers\WarrantyController::class, 'update'])->name('products.warranties.update');
Route::delete('/products/warranties/{warranty}', [\App\Http\Controllers\WarrantyController::class, 'destroy'])->name('products.warranties.destroy');

// Specific product operations
Route::get('/products/{product}', [\App\Http\Controllers\ProductController::class, 'show'])->name('products.show')->whereNumber('product');
Route::get('/products/{product}/edit', [\App\Http\Controllers\ProductController::class, 'edit'])->name('products.edit')->whereNumber('product');
Route::put('/products/{product}', [\App\Http\Controllers\ProductController::class, 'update'])->name('products.update')->whereNumber('product');
Route::delete('/products/{product}', [\App\Http\Controllers\ProductController::class, 'destroy'])->name('products.destroy')->whereNumber('product');
Route::post('/products/{product}/toggle-active', [\App\Http\Controllers\ProductController::class, 'toggleActive'])->name('products.toggle_active')->whereNumber('product');

// Remaining submodules (placeholders until respective phases)
Route::get('/products/update-price', fn () => $renderModule('تحديث سعر المنتج', '/products/update-price', 'المنتجات', 'products_update_price'));
Route::get('/products/print-labels', fn () => $renderModule('طباعة الملصقات', '/products/print-labels', 'المنتجات', 'products_print_labels'));
Route::get('/products/variations', fn () => $renderModule('التباينات', '/products/variations', 'المنتجات', 'products_variations'));
Route::get('/products/import', fn () => $renderModule('استيراد المنتجات', '/products/import', 'المنتجات', 'products_import'));
Route::get('/products/import-opening-stock', fn () => $renderModule('استيراد المخزون الافتتاحي', '/products/import-opening-stock', 'المنتجات', 'products_import_opening_stock'));
Route::get('/products/add-opening-stock', [\App\Http\Controllers\OpeningStockController::class, 'create'])->name('products.add_opening_stock');
// مجموعة أسعار البيع (Selling Price Groups)
Route::get('/products/selling-price-groups', [\App\Http\Controllers\SellingPriceGroupController::class, 'index'])->name('products.selling_price_groups.index');
Route::post('/products/selling-price-groups', [\App\Http\Controllers\SellingPriceGroupController::class, 'store'])->name('products.selling_price_groups.store');
Route::put('/products/selling-price-groups/{sellingPriceGroup}', [\App\Http\Controllers\SellingPriceGroupController::class, 'update'])->name('products.selling_price_groups.update');
Route::delete('/products/selling-price-groups/{sellingPriceGroup}', [\App\Http\Controllers\SellingPriceGroupController::class, 'destroy'])->name('products.selling_price_groups.destroy');
Route::post('/products/selling-price-groups/{sellingPriceGroup}/toggle-active', [\App\Http\Controllers\SellingPriceGroupController::class, 'toggleActive'])->name('products.selling_price_groups.toggle_active');

// ==========================================
// 8. تصنيع (معطلة -> 404)
// ==========================================
Route::get('/manufacturing', fn () => abort(404));

// ==========================================
// 9. الصيانة (معطلة -> 404)
// ==========================================
Route::get('/maintenance', fn () => abort(404));

// ==========================================
// 10. المصاريف
// ==========================================
Route::get('/expenses', fn () => $renderModule('المصاريف', '/expenses', 'المصاريف', 'expenses'))->name('expenses');
Route::get('/expenses/list', fn () => $renderModule('قائمة المصاريف', '/expenses/list', 'المصاريف', 'expenses_list'));
Route::get('/expenses/create', fn () => $renderModule('إضافة المصاريف', '/expenses/create', 'المصاريف', 'expenses_create'));
Route::get('/expenses/categories', fn () => $renderModule('فئات المصاريف', '/expenses/categories', 'المصاريف', 'expenses_categories'));

// ==========================================
// 11. مراكز التكلفة (معطلة -> 404)
// ==========================================
Route::get('/cost-centers', fn () => abort(404));

// ==========================================
// 12. صرف بضاعة على مراكز التكلفة (معطلة -> 404)
// ==========================================
Route::get('/cost-centers/stock-issue', fn () => abort(404));
Route::get('/cost-centers/stock-issue/list', fn () => abort(404));
Route::get('/cost-centers/stock-issue/create', fn () => abort(404));
Route::get('/cost-centers/stock-issue/account-linking', fn () => abort(404));

// ==========================================
// 13. الحسابات
// ==========================================
Route::get('/accounts', [AccountController::class, 'index'])->name('accounts.index');
Route::post('/accounts', [AccountController::class, 'store'])->name('accounts.store');
Route::get('/accounts/list', [AccountController::class, 'index'])->name('accounts.list');
Route::get('/accounts/budget', fn () => $renderModule('الميزانية', '/accounts/budget', 'الحسابات', 'accounts_budget'));
Route::get('/accounts/trial-balance', fn () => $renderModule('ميزان المراجعة', '/accounts/trial-balance', 'الحسابات', 'accounts_trial_balance'));
Route::get('/accounts/cash-flow', fn () => $renderModule('التدفق النقدي', '/accounts/cash-flow', 'الحسابات', 'accounts_cash_flow'));
Route::get('/accounts/collected-invoices', fn () => $renderModule('الفواتير المحصلة', '/accounts/collected-invoices', 'الحسابات', 'accounts_collected_invoices'));

// ==========================================
// 14. المحاسبة
// ==========================================
Route::get('/accounting', fn () => $renderModule('المحاسبة', '/accounting', 'المحاسبة', 'accounting'))->name('accounting');

// ==========================================
// 15. الزكاة
// ==========================================
Route::get('/tax-zakat', fn () => $renderModule('الزكاة', '/tax-zakat', 'الزكاة', 'zakat'))->name('zakat');

// ==========================================
// 16. التقارير
// ==========================================
Route::get('/reports', fn () => $renderModule('التقارير', '/reports', 'التقارير', 'reports'))->name('reports');
Route::get('/reports/profit-loss', fn () => $renderModule('تقرير الربح / الخسارة', '/reports/profit-loss', 'التقارير', 'reports_profit_loss'));
Route::get('/reports/customer-profitability', fn () => $renderModule('الربحية بالعملاء', '/reports/customer-profitability', 'التقارير', 'reports_customer_profitability'));
Route::get('/reports/taxes', fn () => $renderModule('تقرير الضرائب', '/reports/taxes', 'التقارير', 'reports_taxes'));
Route::get('/reports/suppliers-customers', fn () => $renderModule('تقرير الموردين والعملاء', '/reports/suppliers-customers', 'التقارير', 'reports_suppliers_customers'));
Route::get('/reports/customer-groups', fn () => $renderModule('تقرير مجموعات العملاء', '/reports/customer-groups', 'التقارير', 'reports_customer_groups'));
Route::get('/reports/stock', fn () => $renderModule('تقرير المخزون', '/reports/stock', 'التقارير', 'reports_stock'));
Route::get('/reports/serial-tracking', fn () => $renderModule('تتبع السريال', '/reports/serial-tracking', 'التقارير', 'reports_serial_tracking'));
Route::get('/reports/serials-profit', fn () => $renderModule('تقرير أرباح السريالات', '/reports/serials-profit', 'التقارير', 'reports_serials_profit'));
Route::get('/reports/damaged-stock', fn () => $renderModule('تقرير المخزون التالف', '/reports/damaged-stock', 'التقارير', 'reports_damaged_stock'));
Route::get('/reports/trending-products', fn () => $renderModule('المنتجات الشائعة', '/reports/trending-products', 'التقارير', 'reports_trending_products'));
Route::get('/reports/expenses', fn () => $renderModule('تقرير المصاريف', '/reports/expenses', 'التقارير', 'reports_expenses'));
Route::get('/reports/delegates', fn () => $renderModule('تقرير المندوبية', '/reports/delegates', 'التقارير', 'reports_delegates'));
Route::get('/reports/sales-representative', fn () => $renderModule('تقرير مندوب المبيعات', '/reports/sales-representative', 'التقارير', 'reports_sales_representative'));
Route::get('/reports/sales-summary', fn () => $renderModule('ملخص تقرير المبيعات', '/reports/sales-summary', 'التقارير', 'reports_sales_summary'));
Route::get('/reports/net-sales-returns', fn () => $renderModule('صافي المبيعات والمرجوعات', '/reports/net-sales-returns', 'التقارير', 'reports_net_sales_returns'));
Route::get('/reports/customers-net-sales', fn () => $renderModule('صافي مبيعات العملاء', '/reports/customers-net-sales', 'التقارير', 'reports_customers_net_sales'));
Route::get('/reports/price-list', fn () => $renderModule('قائمة الأسعار', '/reports/price-list', 'التقارير', 'reports_price_list'));
Route::get('/reports/activity-log', fn () => $renderModule('سجل النشاطات', '/reports/activity-log', 'التقارير', 'reports_activity_log'));

// ==========================================
// 17. المقاولات (معطلة -> 404)
// ==========================================
Route::get('/contracting', fn () => abort(404));

// ==========================================
// 18. نماذج الإشعارات
// ==========================================
Route::get('/notifications/templates', fn () => $renderModule('نماذج الإشعارات', '/notifications/templates', 'نماذج الإشعارات', 'notification_templates'))->name('notifications');

// ==========================================
// 19. إعدادات
// ==========================================
Route::get('/settings', [\App\Http\Controllers\SettingsController::class, 'business'])->name('settings');
Route::get('/settings/business', [\App\Http\Controllers\SettingsController::class, 'business'])->name('settings.business');
Route::post('/settings/business', [\App\Http\Controllers\SettingsController::class, 'updateBusiness'])->name('settings.business.update');

Route::get('/settings/branches', [\App\Http\Controllers\SettingsController::class, 'branches'])->name('settings.branches');
Route::post('/settings/branches', [\App\Http\Controllers\SettingsController::class, 'storeBranch'])->name('settings.branches.store');

Route::get('/settings/invoices', fn () => $renderModule('إعدادات الفواتير', '/settings/invoices', 'إعدادات', 'settings_invoices'));

Route::get('/settings/shipping-companies', [\App\Http\Controllers\SettingsController::class, 'shippingCompanies'])->name('settings.shipping_companies');
Route::post('/settings/shipping-companies', [\App\Http\Controllers\SettingsController::class, 'storeShippingCompany'])->name('settings.shipping_companies.store');

Route::get('/settings/currencies', fn () => $renderModule('العملات وأسعار الصرف', '/settings/currencies', 'إعدادات', 'settings_currencies'));
Route::get('/settings/barcodes', fn () => $renderModule('إعدادات الباركوود', '/settings/barcodes', 'إعدادات', 'settings_barcodes'));
Route::get('/settings/receipt-printers', fn () => $renderModule('طابعات الإيصالات', '/settings/receipt-printers', 'إعدادات', 'settings_receipt_printers'));

Route::get('/settings/tax-rates', [\App\Http\Controllers\SettingsController::class, 'taxRates'])->name('settings.tax_rates');
Route::post('/settings/tax-rates', [\App\Http\Controllers\SettingsController::class, 'storeTaxRate'])->name('settings.tax_rates.store');

Route::get('/settings/subscription', fn () => abort(404)); // بند اشتراك معطل

// ==========================================
// 20. الحسابات العامة
// ==========================================
Route::get('/general-ledger', fn () => $renderModule('الحسابات العامة', '/general-ledger', 'الحسابات العامة', 'general_accounts'))->name('general_accounts');
Route::get('/general-ledger/checks/report', fn () => $renderModule('تقرير الشيكات', '/general-ledger/checks/report', 'الحسابات العامة', 'general_accounts_checks_report'));
Route::get('/general-ledger/checks/issued/create', fn () => $renderModule('إنشاء شيك صادر', '/general-ledger/checks/issued/create', 'الحسابات العامة', 'general_accounts_issued_check_create'));
Route::get('/general-ledger/checks/received/create', fn () => $renderModule('إنشاء شيك وارد', '/general-ledger/checks/received/create', 'الحسابات العامة', 'general_accounts_received_check_create'));
Route::get('/general-ledger/checks/transactions', fn () => $renderModule('حركة الشيكات', '/general-ledger/checks/transactions', 'الحسابات العامة', 'general_accounts_checks_transactions'));
Route::get('/general-ledger/checks/transactions-report', fn () => $renderModule('تقرير حركة الشيكات', '/general-ledger/checks/transactions-report', 'الحسابات العامة', 'general_accounts_checks_transactions_report'));
Route::get('/general-ledger/vouchers', fn () => $renderModule('السندات', '/general-ledger/vouchers', 'الحسابات العامة', 'general_accounts_vouchers'));
Route::get('/general-ledger/vouchers/payment/create', fn () => $renderModule('إنشاء سند صرف نقدي', '/general-ledger/vouchers/payment/create', 'الحسابات العامة', 'general_accounts_payment_voucher_create'));
Route::get('/general-ledger/vouchers/receipt/create', fn () => $renderModule('إنشاء سند استلام نقدي', '/general-ledger/vouchers/receipt/create', 'الحسابات العامة', 'general_accounts_receipt_voucher_create'));
Route::get('/general-ledger/treasury/statement', fn () => $renderModule('كشف حركة الخزينة', '/general-ledger/treasury/statement', 'الحسابات العامة', 'general_accounts_treasury_statement'));
Route::get('/general-ledger/bank-transfers', fn () => $renderModule('التحويلات البنكية', '/general-ledger/bank-transfers', 'الحسابات العامة', 'general_accounts_bank_transfers'));
Route::get('/general-ledger/bank-transfers/deposit/create', fn () => $renderModule('إنشاء إيداع بنكي', '/general-ledger/bank-transfers/deposit/create', 'الحسابات العامة', 'general_accounts_bank_deposit_create'));
Route::get('/general-ledger/bank-transfers/withdrawal/create', fn () => $renderModule('إنشاء سحب بنكي', '/general-ledger/bank-transfers/withdrawal/create', 'الحسابات العامة', 'general_accounts_bank_withdrawal_create'));
Route::get('/general-ledger/bank/statement', fn () => $renderModule('كشف حركة البنك', '/general-ledger/bank/statement', 'الحسابات العامة', 'general_accounts_bank_statement'));

// ==========================================
// 21. Crm (معطلة -> 404)
// ==========================================
Route::get('/crm', fn () => abort(404));

// ==========================================
// 22. شئون العاملين (معطلة -> 404)
// ==========================================
Route::get('/hr', fn () => abort(404));

// ==========================================
// 23. أساسيات
// ==========================================
Route::get('/basics', fn () => $renderModule('أساسيات', '/basics', 'أساسيات', 'basics'))->name('basics');
