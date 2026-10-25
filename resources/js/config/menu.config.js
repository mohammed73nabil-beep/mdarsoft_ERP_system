/**
 * هيكل القائمة الرئيسي ونظام الصلاحيات لنظام ERP المحاسبي
 * الـ 23 وحدة الرئيسية وقوائمها الفرعية الحرفية
 */

export const menuConfig = [
    // 1. الرئيسية
    {
        key: 'dashboard',
        label: 'الرئيسية',
        icon: 'LayoutDashboard',
        href: '/',
        permission: 'dashboard.view',
        enabled: true,
        children: []
    },

    // 2. موديول المبيعات (17 عنصراً فرعياً)
    {
        key: 'sales',
        label: 'موديول المبيعات',
        icon: 'ShoppingCart',
        href: '/sales',
        permission: 'sales.view',
        enabled: true,
        children: [
            { key: 'sales_all', label: 'كل المبيعات', href: '/sales/all', permission: 'sales.all.view', enabled: true },
            { key: 'sales_create', label: 'إضافة بيع', href: '/sales/create', permission: 'sales.create.view', enabled: true },
            { key: 'sales_pos_list', label: 'قائمة نقطة البيع', href: '/sales/pos-list', permission: 'sales.pos_list.view', enabled: true },
            { key: 'sales_pos', label: 'نقطة بيع', href: '/sales/pos', permission: 'sales.pos.view', enabled: true },
            { key: 'sales_draft_create', label: 'إضافة مسودة', href: '/sales/drafts/create', permission: 'sales.draft_create.view', enabled: true },
            { key: 'sales_drafts_list', label: 'قائمة المسودات', href: '/sales/drafts', permission: 'sales.drafts_list.view', enabled: true },
            { key: 'sales_quotation_create', label: 'إضافة اقتباس', href: '/sales/quotations/create', permission: 'sales.quotation_create.view', enabled: true },
            { key: 'sales_quotations_list', label: 'قائمة بيان الأسعار', href: '/sales/quotations', permission: 'sales.quotations_list.view', enabled: true },
            { key: 'sales_returns_list', label: 'قائمة مرتجع المبيعات', href: '/sales/returns', permission: 'sales.returns_list.view', enabled: true },
            { key: 'sales_shipments', label: 'الشحنات', href: '/sales/shipments', permission: 'sales.shipments.view', enabled: true },
            { key: 'sales_discounts', label: 'خصومات', href: '/sales/discounts', permission: 'sales.discounts.view', enabled: true },
            { key: 'sales_import', label: 'استيراد المبيعات', href: '/sales/import', permission: 'sales.import.view', enabled: true },
            { key: 'sales_purchases_and_sales', label: 'مشتريات ومبيعات', href: '/sales/purchases-and-sales', permission: 'sales.purchases_and_sales.view', enabled: true },
            { key: 'sales_report', label: 'تقرير المبيعات', href: '/sales/reports/sales-report', permission: 'sales.report.view', enabled: true },
            { key: 'sales_electronic_invoice', label: 'فاتورة مبيعات إلكترونية', href: '/sales/electronic-invoice', permission: 'sales.electronic_invoice.view', enabled: true },
            { key: 'sales_products_sales_report', label: 'تقرير مبيعات المنتجات', href: '/sales/reports/products-sales', permission: 'sales.products_sales_report.view', enabled: true },
            { key: 'sales_products_returns_report', label: 'تقرير مرتجع المنتجات', href: '/sales/reports/products-returns', permission: 'sales.products_returns_report.view', enabled: true }
        ]
    },

    // 3. موديول المشتريات (8 عناصر فرعية)
    {
        key: 'purchases',
        label: 'موديول المشتريات',
        icon: 'ShoppingBag',
        href: '/purchases',
        permission: 'purchases.view',
        enabled: true,
        children: [
            { key: 'purchases_order_request', label: 'طلبية الشراء', href: '/purchases/order-requests', permission: 'purchases.order_request.view', enabled: true },
            { key: 'purchases_list', label: 'قائمة المشتريات', href: '/purchases/list', permission: 'purchases.list.view', enabled: true },
            { key: 'purchases_create', label: 'أضف مشتريات', href: '/purchases/create', permission: 'purchases.create.view', enabled: true },
            { key: 'purchases_returns_list', label: 'قائمة مرتجع المشتريات', href: '/purchases/returns', permission: 'purchases.returns_list.view', enabled: true },
            { key: 'purchases_items_report', label: 'تقرير العناصر', href: '/purchases/reports/items', permission: 'purchases.items_report.view', enabled: true },
            { key: 'purchases_products_report', label: 'تقرير مشتريات المنتجات', href: '/purchases/reports/products', permission: 'purchases.products_report.view', enabled: true },
            { key: 'purchases_products_returns_report', label: 'تقرير مرتجع المنتجات', href: '/purchases/reports/products-returns', permission: 'purchases.products_returns_report.view', enabled: true },
            { key: 'purchases_report', label: 'تقرير المشتريات', href: '/purchases/reports/summary', permission: 'purchases.report.view', enabled: true }
        ]
    },

    // 4. المخازن (10 عناصر فرعية)
    {
        key: 'inventory',
        label: 'المخازن',
        icon: 'Warehouse',
        href: '/inventory',
        permission: 'inventory.view',
        enabled: true,
        children: [
            { key: 'inventory_stocktaking_cost', label: 'تقرير جرد بسعر التكلفة', href: '/inventory/reports/stocktaking-cost', permission: 'inventory.stocktaking_cost.view', enabled: true },
            { key: 'inventory_stocktaking_sale', label: 'تقرير جرد بسعر البيع', href: '/inventory/reports/stocktaking-sale', permission: 'inventory.stocktaking_sale.view', enabled: true },
            { key: 'inventory_stocktaking_no_price', label: 'تقرير جرد بدون أسعار', href: '/inventory/reports/stocktaking-no-price', permission: 'inventory.stocktaking_no_price.view', enabled: true },
            { key: 'inventory_summary_report', label: 'ملخص تقرير المخزون', href: '/inventory/reports/summary', permission: 'inventory.summary_report.view', enabled: true },
            { key: 'inventory_delivery_voucher', label: 'أذن صرف', href: '/inventory/vouchers/delivery', permission: 'inventory.delivery_voucher.view', enabled: true },
            { key: 'inventory_receiving_voucher', label: 'أذن إضافة', href: '/inventory/vouchers/receiving', permission: 'inventory.receiving_voucher.view', enabled: true },
            { key: 'inventory_transfers_list', label: 'قائمة تحويلات المخزون', href: '/inventory/transfers', permission: 'inventory.transfers_list.view', enabled: true },
            { key: 'inventory_transfer_create', label: 'إضافة تحويل مخزون', href: '/inventory/transfers/create', permission: 'inventory.transfer_create.view', enabled: true },
            { key: 'inventory_damaged_list', label: 'قائمة المخزون التالف', href: '/inventory/damaged', permission: 'inventory.damaged_list.view', enabled: true },
            { key: 'inventory_damaged_create', label: 'أضف تالف', href: '/inventory/damaged/create', permission: 'inventory.damaged_create.view', enabled: true }
        ]
    },

    // 5. إدارة المستخدمين (3 عناصر فرعية)
    {
        key: 'users',
        label: 'إدارة المستخدمين',
        icon: 'Users',
        href: '/users',
        permission: 'users.view',
        enabled: true,
        children: [
            { key: 'users_list', label: 'المستخدمين', href: '/users/list', permission: 'users.list.view', enabled: true },
            { key: 'users_roles', label: 'الصلاحيات', href: '/users/roles', permission: 'users.roles.view', enabled: true },
            { key: 'users_representatives', label: 'مندوب', href: '/users/representatives', permission: 'users.representatives.view', enabled: true }
        ]
    },

    // 6. جهات الاتصال (5 عناصر فرعية)
    {
        key: 'contacts',
        label: 'جهات الاتصال',
        icon: 'Contact',
        href: '/contacts',
        permission: 'contacts.view',
        enabled: true,
        children: [
            { key: 'contacts_suppliers', label: 'الموردين', href: '/contacts/suppliers', permission: 'contacts.suppliers.view', enabled: true },
            { key: 'contacts_customers', label: 'العملاء', href: '/contacts/customers', permission: 'contacts.customers.view', enabled: true },
            { key: 'contacts_customer_groups', label: 'مجموعات العملاء', href: '/contacts/customer-groups', permission: 'contacts.customer_groups.view', enabled: true },
            { key: 'contacts_upcoming_visits_report', label: 'تقرير الزيارات القادمة', href: '/contacts/reports/upcoming-visits', permission: 'contacts.upcoming_visits_report.view', enabled: true },
            { key: 'contacts_import', label: 'استيراد جهات الاتصال', href: '/contacts/import', permission: 'contacts.import.view', enabled: true }
        ]
    },

    // 7. المنتجات (13 عنصراً فرعياً)
    {
        key: 'products',
        label: 'المنتجات',
        icon: 'Package',
        href: '/products',
        permission: 'products.view',
        enabled: true,
        children: [
            { key: 'products_list', label: 'قائمة المنتجات', href: '/products/list', permission: 'products.list.view', enabled: true },
            { key: 'products_create', label: 'أضف منتجاً', href: '/products/create', permission: 'products.create.view', enabled: true },
            { key: 'products_update_price', label: 'تحديث سعر المنتج', href: '/products/update-price', permission: 'products.update_price.view', enabled: true },
            { key: 'products_print_labels', label: 'طباعة الملصقات', href: '/products/print-labels', permission: 'products.print_labels.view', enabled: true },
            { key: 'products_variations', label: 'التباينات', href: '/products/variations', permission: 'products.variations.view', enabled: true },
            { key: 'products_import', label: 'استيراد المنتجات', href: '/products/import', permission: 'products.import.view', enabled: true },
            { key: 'products_import_opening_stock', label: 'استيراد المخزون الافتتاحي', href: '/products/import-opening-stock', permission: 'products.import_opening_stock.view', enabled: true },
            { key: 'products_add_opening_stock', label: 'أضف بضاعة أول المدة', href: '/products/add-opening-stock', permission: 'products.add_opening_stock.view', enabled: true },
            { key: 'products_selling_price_groups', label: 'مجموعة أسعار البيع', href: '/products/selling-price-groups', permission: 'products.selling_price_groups.view', enabled: true },
            { key: 'products_units', label: 'الوحدات', href: '/products/units', permission: 'products.units.view', enabled: true },
            { key: 'products_categories', label: 'الأصناف', href: '/products/categories', permission: 'products.categories.view', enabled: true },
            { key: 'products_brands', label: 'العلامات التجارية', href: '/products/brands', permission: 'products.brands.view', enabled: true },
            { key: 'products_warranties', label: 'الضمانات', href: '/products/warranties', permission: 'products.warranties.view', enabled: true }
        ]
    },

    // 8. تصنيع (معطلة)
    {
        key: 'manufacturing',
        label: 'تصنيع',
        icon: 'Factory',
        href: '/manufacturing',
        permission: 'manufacturing.view',
        enabled: false,
        children: []
    },

    // 9. الصيانة (معطلة)
    {
        key: 'maintenance',
        label: 'الصيانة',
        icon: 'Wrench',
        href: '/maintenance',
        permission: 'maintenance.view',
        enabled: false,
        children: []
    },

    // 10. المصاريف (3 عناصر فرعية)
    {
        key: 'expenses',
        label: 'المصاريف',
        icon: 'Receipt',
        href: '/expenses',
        permission: 'expenses.view',
        enabled: true,
        children: [
            { key: 'expenses_list', label: 'قائمة المصاريف', href: '/expenses/list', permission: 'expenses.list.view', enabled: true },
            { key: 'expenses_create', label: 'إضافة المصاريف', href: '/expenses/create', permission: 'expenses.create.view', enabled: true },
            { key: 'expenses_categories', label: 'فئات المصاريف', href: '/expenses/categories', permission: 'expenses.categories.view', enabled: true }
        ]
    },

    // 11. مراكز التكلفة (معطلة)
    {
        key: 'cost_centers',
        label: 'مراكز التكلفة',
        icon: 'Target',
        href: '/cost-centers',
        permission: 'cost_centers.view',
        enabled: false,
        children: []
    },

    // 12. صرف بضاعة على مراكز التكلفة (معطلة - 3 عناصر فرعية معطلة)
    {
        key: 'stock_issue_cost_centers',
        label: 'صرف بضاعة على مراكز التكلفة',
        icon: 'ArrowDownRight',
        href: '/cost-centers/stock-issue',
        permission: 'stock_issue_cost_centers.view',
        enabled: false,
        children: [
            { key: 'stock_issue_list', label: 'قائمة صرف البضاعة', href: '/cost-centers/stock-issue/list', permission: 'stock_issue.list.view', enabled: false },
            { key: 'stock_issue_create', label: 'إضافة صرف بضاعة', href: '/cost-centers/stock-issue/create', permission: 'stock_issue.create.view', enabled: false },
            { key: 'stock_issue_account_linking', label: 'ربط الحسابات', href: '/cost-centers/stock-issue/account-linking', permission: 'stock_issue.account_linking.view', enabled: false }
        ]
    },

    // 13. الحسابات (5 عناصر فرعية)
    {
        key: 'accounts',
        label: 'الحسابات',
        icon: 'BookOpen',
        href: '/accounts',
        permission: 'accounts.view',
        enabled: true,
        children: [
            { key: 'accounts_list', label: 'قائمة الحسابات', href: '/accounts/list', permission: 'accounts.list.view', enabled: true },
            { key: 'accounts_budget', label: 'الميزانية', href: '/accounts/budget', permission: 'accounts.budget.view', enabled: true },
            { key: 'accounts_trial_balance', label: 'ميزان المراجعة', href: '/accounts/trial-balance', permission: 'accounts.trial_balance.view', enabled: true },
            { key: 'accounts_cash_flow', label: 'التدفق النقدي', href: '/accounts/cash-flow', permission: 'accounts.cash_flow.view', enabled: true },
            { key: 'accounts_collected_invoices', label: 'الفواتير المحصلة', href: '/accounts/collected-invoices', permission: 'accounts.collected_invoices.view', enabled: true }
        ]
    },

    // 14. المحاسبة
    {
        key: 'accounting',
        label: 'المحاسبة',
        icon: 'Calculator',
        href: '/accounting',
        permission: 'accounting.view',
        enabled: true,
        children: []
    },

    // 15. الزكاة
    {
        key: 'zakat',
        label: 'الزكاة',
        icon: 'FileSpreadsheet',
        href: '/tax-zakat',
        permission: 'zakat.view',
        enabled: true,
        children: []
    },

    // 16. التقارير (18 عنصراً فرعياً)
    {
        key: 'reports',
        label: 'التقارير',
        icon: 'BarChart3',
        href: '/reports',
        permission: 'reports.view',
        enabled: true,
        children: [
            { key: 'reports_profit_loss', label: 'تقرير الربح / الخسارة', href: '/reports/profit-loss', permission: 'reports.profit_loss.view', enabled: true },
            { key: 'reports_customer_profitability', label: 'الربحية بالعملاء', href: '/reports/customer-profitability', permission: 'reports.customer_profitability.view', enabled: true },
            { key: 'reports_taxes', label: 'تقرير الضرائب', href: '/reports/taxes', permission: 'reports.taxes.view', enabled: true },
            { key: 'reports_suppliers_customers', label: 'تقرير الموردين والعملاء', href: '/reports/suppliers-customers', permission: 'reports.suppliers_customers.view', enabled: true },
            { key: 'reports_customer_groups', label: 'تقرير مجموعات العملاء', href: '/reports/customer-groups', permission: 'reports.customer_groups.view', enabled: true },
            { key: 'reports_stock', label: 'تقرير المخزون', href: '/reports/stock', permission: 'reports.stock.view', enabled: true },
            { key: 'reports_serial_tracking', label: 'تتبع السريال', href: '/reports/serial-tracking', permission: 'reports.serial_tracking.view', enabled: true },
            { key: 'reports_serials_profit', label: 'تقرير أرباح السريالات', href: '/reports/serials-profit', permission: 'reports.serials_profit.view', enabled: true },
            { key: 'reports_damaged_stock', label: 'تقرير المخزون التالف', href: '/reports/damaged-stock', permission: 'reports.damaged_stock.view', enabled: true },
            { key: 'reports_trending_products', label: 'المنتجات الشائعة', href: '/reports/trending-products', permission: 'reports.trending_products.view', enabled: true },
            { key: 'reports_expenses', label: 'تقرير المصاريف', href: '/reports/expenses', permission: 'reports.expenses.view', enabled: true },
            { key: 'reports_delegates', label: 'تقرير المندوبية', href: '/reports/delegates', permission: 'reports.delegates.view', enabled: true },
            { key: 'reports_sales_representative', label: 'تقرير مندوب المبيعات', href: '/reports/sales-representative', permission: 'reports.sales_representative.view', enabled: true },
            { key: 'reports_sales_summary', label: 'ملخص تقرير المبيعات', href: '/reports/sales-summary', permission: 'reports.sales_summary.view', enabled: true },
            { key: 'reports_net_sales_returns', label: 'صافي المبيعات والمرجوعات', href: '/reports/net-sales-returns', permission: 'reports.net_sales_returns.view', enabled: true },
            { key: 'reports_customers_net_sales', label: 'صافي مبيعات العملاء', href: '/reports/customers-net-sales', permission: 'reports.customers_net_sales.view', enabled: true },
            { key: 'reports_price_list', label: 'قائمة الأسعار', href: '/reports/price-list', permission: 'reports.price_list.view', enabled: true },
            { key: 'reports_activity_log', label: 'سجل النشاطات', href: '/reports/activity-log', permission: 'reports.activity_log.view', enabled: true }
        ]
    },

    // 17. المقاولات (معطلة)
    {
        key: 'contracting',
        label: 'المقاولات',
        icon: 'HardHat',
        href: '/contracting',
        permission: 'contracting.view',
        enabled: false,
        children: []
    },

    // 18. نماذج الإشعارات
    {
        key: 'notification_templates',
        label: 'نماذج الإشعارات',
        icon: 'BellRing',
        href: '/notifications/templates',
        permission: 'notification_templates.view',
        enabled: true,
        children: []
    },

    // 19. إعدادات (9 عناصر فرعية - بند اشتراك معطل)
    {
        key: 'settings',
        label: 'إعدادات',
        icon: 'Settings',
        href: '/settings',
        permission: 'settings.view',
        enabled: true,
        children: [
            { key: 'settings_business', label: 'إعدادات الشركة', href: '/settings/business', permission: 'settings.business.view', enabled: true },
            { key: 'settings_branches', label: 'فروع النشاط', href: '/settings/branches', permission: 'settings.branches.view', enabled: true },
            { key: 'settings_invoices', label: 'إعدادات الفواتير', href: '/settings/invoices', permission: 'settings.invoices.view', enabled: true },
            { key: 'settings_shipping_companies', label: 'شركات الشحن', href: '/settings/shipping-companies', permission: 'settings.shipping_companies.view', enabled: true },
            { key: 'settings_currencies', label: 'العملات وأسعار الصرف', href: '/settings/currencies', permission: 'settings.currencies.view', enabled: true },
            { key: 'settings_barcodes', label: 'إعدادات الباركوود', href: '/settings/barcodes', permission: 'settings.barcodes.view', enabled: true },
            { key: 'settings_receipt_printers', label: 'طابعات الإيصالات', href: '/settings/receipt-printers', permission: 'settings.receipt_printers.view', enabled: true },
            { key: 'settings_tax_rates', label: 'معدلات الضرائب', href: '/settings/tax-rates', permission: 'settings.tax_rates.view', enabled: true },
            { key: 'settings_subscription', label: 'اشتراك', href: '/settings/subscription', permission: 'settings.subscription.view', enabled: false }
        ]
    },

    // 20. الحسابات العامة (13 عنصراً فرعياً)
    {
        key: 'general_accounts',
        label: 'الحسابات العامة',
        icon: 'Landmark',
        href: '/general-ledger',
        permission: 'general_accounts.view',
        enabled: true,
        children: [
            { key: 'general_accounts_checks_report', label: 'تقرير الشيكات', href: '/general-ledger/checks/report', permission: 'general_accounts.checks_report.view', enabled: true },
            { key: 'general_accounts_issued_check_create', label: 'إنشاء شيك صادر', href: '/general-ledger/checks/issued/create', permission: 'general_accounts.issued_check_create.view', enabled: true },
            { key: 'general_accounts_received_check_create', label: 'إنشاء شيك وارد', href: '/general-ledger/checks/received/create', permission: 'general_accounts.received_check_create.view', enabled: true },
            { key: 'general_accounts_checks_transactions', label: 'حركة الشيكات', href: '/general-ledger/checks/transactions', permission: 'general_accounts.checks_transactions.view', enabled: true },
            { key: 'general_accounts_checks_transactions_report', label: 'تقرير حركة الشيكات', href: '/general-ledger/checks/transactions-report', permission: 'general_accounts.checks_transactions_report.view', enabled: true },
            { key: 'general_accounts_vouchers', label: 'السندات', href: '/general-ledger/vouchers', permission: 'general_accounts.vouchers.view', enabled: true },
            { key: 'general_accounts_payment_voucher_create', label: 'إنشاء سند صرف نقدي', href: '/general-ledger/vouchers/payment/create', permission: 'general_accounts.payment_voucher_create.view', enabled: true },
            { key: 'general_accounts_receipt_voucher_create', label: 'إنشاء سند استلام نقدي', href: '/general-ledger/vouchers/receipt/create', permission: 'general_accounts.receipt_voucher_create.view', enabled: true },
            { key: 'general_accounts_treasury_statement', label: 'كشف حركة الخزينة', href: '/general-ledger/treasury/statement', permission: 'general_accounts.treasury_statement.view', enabled: true },
            { key: 'general_accounts_bank_transfers', label: 'التحويلات البنكية', href: '/general-ledger/bank-transfers', permission: 'general_accounts.bank_transfers.view', enabled: true },
            { key: 'general_accounts_bank_deposit_create', label: 'إنشاء إيداع بنكي', href: '/general-ledger/bank-transfers/deposit/create', permission: 'general_accounts.bank_deposit_create.view', enabled: true },
            { key: 'general_accounts_bank_withdrawal_create', label: 'إنشاء سحب بنكي', href: '/general-ledger/bank-transfers/withdrawal/create', permission: 'general_accounts.bank_withdrawal_create.view', enabled: true },
            { key: 'general_accounts_bank_statement', label: 'كشف حركة البنك', href: '/general-ledger/bank/statement', permission: 'general_accounts.bank_statement.view', enabled: true }
        ]
    },

    // 21. Crm (معطلة)
    {
        key: 'crm',
        label: 'Crm',
        icon: 'HeartHandshake',
        href: '/crm',
        permission: 'crm.view',
        enabled: false,
        children: []
    },

    // 22. شئون العاملين (معطلة)
    {
        key: 'hr',
        label: 'شئون العاملين',
        icon: 'UserCheck',
        href: '/hr',
        permission: 'hr.view',
        enabled: false,
        children: []
    },

    // 23. أساسيات
    {
        key: 'basics',
        label: 'أساسيات',
        icon: 'FolderKanban',
        href: '/basics',
        permission: 'basics.view',
        enabled: true,
        children: []
    }
];

/**
 * فلترة القائمة بالصلاحيات وحالة التفعيل (enabled)
 * @param {Array} menu قائمة الوحدات
 * @param {Array|null} userPermissions مصفوفة صلاحيات المستخدم (null تعني مدير النظام/الكل)
 * @returns {Array} القائمة المفلترة
 */
export function filterMenuByPermissions(menu = menuConfig, userPermissions = null) {
    return menu
        .filter(item => item.enabled)
        .filter(item => {
            if (!userPermissions || userPermissions.includes('*')) return true;
            return userPermissions.includes(item.permission);
        })
        .map(item => ({
            ...item,
            children: (item.children || [])
                .filter(child => child.enabled)
                .filter(child => {
                    if (!userPermissions || userPermissions.includes('*')) return true;
                    return userPermissions.includes(child.permission);
                })
        }));
}
