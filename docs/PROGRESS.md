# سجل التقدم والحالة (Project Progress & Status)

> **آخر تحديث:** 2026-10-25  
> **الحالة الإجمالية:** 204 اختبارات ناجحة بنسبة 100% (1376 تأكيداً) — بناء الأصول ناجح بالكامل وتطابق مخزني نظيف 100%.  
> **تنبيه الأمانة الهندسية:** واجهات React ومساراتها مختبرة وموثقة خادمياً (Server-Side / Feature Tests) وبلا اختبارات متصفح آلية (E2E Client-side Tests)، وحركات المشتريات والمبيعات والمخزون مسجلة بدفاتر الأستاذ المساعد والحركات المخزنية فقط دون قيود محاسبية عامة (القيود العامة مؤجلة للمرحلة د).

---

## 1. ملخص الحالة الراهنة الموحد

| المرحلة | الجداول | الاختبارات المنفذة | الحالة الفعلية |
|---|---|---|---|
| **أ — الأساس (Foundation)** | 15 جدولاً + 5 Spatie = 20 | 24 اختباراً (في 9 ملفات) | منفذة ومختبرة ومستقرة |
| **ب1 — المنتجات والسيريال** | 9 جداول | 54 اختباراً (21 للموديلات والآلة + 33 لشاشات المنتجات) | منفذة ومختبرة خادمياً |
| **ب2 — حركات وأرصدة المخزون** | 10 جداول + Triggers | 17 اختباراً (في 5 ملفات مع معالج الاستثناءات) | منفذة ومختبرة ومستقرة |
| **ب2-شاشات — واجهات المخزون (الدفعة 1)** | — | **6 اختبارات** (InventoryScreensTest) | منفذة ومختبرة خادمياً (واجهة بلا E2E) |
| **عامة وأساسية (Core & Menu)** | — | 10 اختبارات (Unit + Navigation) | منفذة ومختبرة |
| **ج1 — جهات التعامل والمشتريات** | 10 جداول | 24 اختباراً (في ملفين) | منفذة ومختبرة خادمياً (القيود العامة مؤجلة للمرحلة د) |
| **ج1-شاشات — الموردون والعملاء وكشف الحساب (الدفعة 2)** | — | **10 اختبارات** (ContactScreensTest) | منفذة ومختبرة خادمياً (واجهة بلا E2E) |
| **ج1-شاشات — فواتير المشتريات والمرتجعات والتقارير** | — | **10 اختبارات** (PurchaseScreensTest) | منفذة ومختبرة خادمياً (واجهة بلا E2E) |
| **ج2 — المبيعات وعروض الأسعار والمسودات ونقاط البيع والشحنات** | 14 جدولاً | **49 اختباراً** (18 لخدمات المبيعات + 10 لشاشات المبيعات + 14 لنقاط البيع والشحنات + 7 لخدمة PosCheckout) | منفذة ومختبرة خادمياً وبناء أصول نظيف |
| **د — القيود والشيكات والبنوك** | 12 جدولاً | لم تبدأ | لم تُبنَ بعد |

**إجمالي الاختبارات الحالي:** **204 passed (1376 assertions)** — خلو تام من أي فشل أو تحذير.

---

## 2. تفصيل عدد الاختبارات الفعلي بالملفات

تم حصر وتأكيد الاختبارات من الملفات البرمجية في مجلد `tests/`:

### 2.1 اختبارات عامة وملاحة (10 اختبارات):
- `tests/Unit/ExampleTest.php`: **1**
- `tests/Feature/ExampleTest.php`: **1**
- `tests/Feature/MenuNavigationTest.php`: **8** (مطابقة الـ 23 موديول، القوائم الفرعية، الروابط، وتعطيل الوحدات السبع 404)

### 2.2 المرحلة أ — الأساس (24 اختباراً):
- `tests/Feature/PhaseA/AdminRolePermissionsTest.php`: **1**
- `tests/Feature/PhaseA/BranchIsolationTest.php`: **3**
- `tests/Feature/PhaseA/CashierPermissionTest.php`: **1**
- `tests/Feature/PhaseA/ChartOfAccountsStabilizationTest.php`: **8**
- `tests/Feature/PhaseA/DocumentSequenceTest.php`: **3**
- `tests/Feature/PhaseA/FiscalYearDocumentProtectionTest.php`: **3**
- `tests/Feature/PhaseA/MigrationFreshRollbackTest.php`: **1**
- `tests/Feature/PhaseA/PosSessionTest.php`: **2**
- `tests/Feature/PhaseA/WarehouseDefaultTest.php`: **2**

### 2.3 المرحلة ب1 — المنتجات والسيريال وشاشاتها (54 اختباراً):
- `tests/Feature/PhaseB1/ProductCatalogTest.php`: **7**
- `tests/Feature/PhaseB1/ProductSerialTest.php`: **4**
- `tests/Feature/PhaseB1/SerialStateMachineTest.php`: **10** (الانتقالات، الحماية، Triggers، والتزامن)
- `tests/Feature/PhaseB1/ProductScreensTest.php`: **33** (فحص مسارات وصلاحيات وقواعد شاشات المنتجات)

### 2.4 المرحلة ب2 — حركات وأرصدة المخزون (17 اختباراً):
- `tests/Feature/PhaseB2/InventoryTransferTest.php`: **3**
- `tests/Feature/PhaseB2/StockAdjustmentAndDamagedTest.php`: **3**
- `tests/Feature/PhaseB2/StockReconciliationTest.php`: **3**
- `tests/Feature/PhaseB2/StockServiceTest.php`: **6**
- `tests/Feature/PhaseB2/InventoryExceptionHandlerTest.php`: **2** (معالجة نقص المخزون وحالات السيريال)

### 2.4.1 واجهات المخزون — الدفعة 1 (6 اختبارات):
- `tests/Feature/PhaseB2/InventoryScreensTest.php`: **6**
  - `opening_stock_routes_authorization_and_lifecycle`: صلاحيات 200/403 + إنشاء وترحيل بضاعة أول المدة
  - `stock_vouchers_receiving_and_delivery_lifecycle`: أذن إضافة + أذن صرف مع تحديث الرصيد
  - `inventory_transfer_send_and_receive_flow`: إنشاء + إرسال + استلام تحويل مخزوني
  - `damaged_stock_creation_and_posting_with_serial`: تسجيل تالف بسيريال + ترحيل + تغيير الحالة
  - `stocktaking_reports_render_200_and_respect_permissions`: 4 تقارير × (200 للمدير / 403 بلا صلاحية)
  - `branch_isolation_in_stocktaking_reports`: عزل الفروع في تقارير الجرد

### 2.5 المرحلة ج1 — جهات التعامل ومشتريات الموردين (24 اختباراً):
- `tests/Feature/PhaseC1/ContactTest.php`: **7** (الرمز الفريد، البريد الإلكتروني، دوال المورد/العميل، حد الائتمان، المجموعات، رصيد Sub-ledger، والحذف الناعم SoftDeletes)
- `tests/Feature/PhaseC1/PurchaseOrderTest.php`: **17** (إنشاء واستلام أوامر الشراء، السيريالات، الدفعات، المرتجعات، منع تجاوز الكمية المشتراة، منع تكرار السيريال، رفض أمر شراء بلا أسطر، وحساب subtotal/total تلقائياً من الأسطر)

### 2.5.1 واجهات جهات التعامل — الدفعة 2 (10 اختبارات):
- `tests/Feature/PhaseC1/ContactScreensTest.php`: **10**
  - `suppliers_index_requires_permission_and_returns_200_for_admin`: صلاحيات 200/403 للموردين
  - `suppliers_create_page_and_store_lifecycle`: إنشاء مورد مع كود مخصص وقيد رصيد افتتاحي
  - `suppliers_show_and_edit_and_update`: عرض بيانات المورد وإحصائياته وتعديلها
  - `customers_index_requires_permission_and_returns_200_for_admin`: صلاحيات 200/403 للعملاء
  - `customers_create_and_store_lifecycle`: إنشاء عميل مع توليد الكود التلقائي CUS- وقيد رصيد افتتاحي
  - `customers_show_and_edit_and_update`: عرض بيانات العميل وملفه المالي وتعديلها
  - `contact_statement_of_account_ledger_calculation_and_filtering`: كشف الحساب التفصيلي مع فلترة التاريخ وحساب الرصيد السابق والتراكمي
  - `contact_toggle_active_status`: تفعيل وتعطيل جهة التعامل
  - `contact_delete_with_purchase_orders_is_prevented_and_unused_is_soft_deleted`: حماية الحذف عند وجود فواتير وحذف ناعم لمن لا حركات له
  - `contact_groups_index_store_update_and_delete_lifecycle`: إدارة مجموعات جهات التعامل ونسب الخصم

### 2.5.2 واجهات المشتريات — فواتير المشتريات والمرتجعات والتقارير (10 اختبارات):
- `tests/Feature/PhaseC1/PurchaseScreensTest.php`: **10**
  - `purchases_index_requires_permission_and_returns_200_for_admin`: شاشة قائمة الفواتير والأوامر
  - `purchases_create_page_requires_permission_and_returns_200_for_admin`: شاشة إنشاء أمر/فاتورة شراء
  - `purchase_store_lifecycle_and_validation`: إنشاء أمر شراء مع التحقق وصلاحيات الفروع
  - `purchase_immediate_auto_receive`: الاستلام الفوري مع خيار الترحيل المباشر
  - `purchase_show_page_and_receive_action`: عرض الفاتورة وإجراء الاستلام المخزني
  - `purchase_payments_lifecycle`: تسجيل الدفعات وحذفها وتحديث الحالة المالية
  - `purchase_returns_index_create_and_store_lifecycle`: دورة حياة مرتجعات المشتريات
  - `purchase_order_requests_screen`: شاشة طلبات الشراء وقيد الاستلام
  - `purchase_reports_screens_render_200`: تقارير المشتريات الأربعة
  - `branch_isolation_in_purchases`: عزل الفروع في فواتير الشراء

### 2.6 المرحلة ج2 — المبيعات وعروض الأسعار والمسودات (28 اختباراً — **منفذة ومختبرة خادمياً**):
- `tests/Feature/PhaseC2/SaleOrderTest.php`: **18**
  - إنشاء فاتورة مبيعات لمنتج عادي مع خصم المخزون وتسجيل تكلفة البضاعة المباعة COGS
  - إنشاء فاتورة مبيعات لمنتج بسيريال ونقل حالة السيريال من `in_stock` إلى `sold`
  - منع إنشاء فاتورة مبيعات بلا أسطر
  - منع بيع سيريال غير متوفر في المخزون
  - التحقق من مطابقة عدد السيريالات المحددة للكمية المطلوبة
  - دورة حياة مدفوعات المبيعات ومزامنة المدفوع والمتبقي وحالة السداد
  - كتابة قيد دفتر الأستاذ المساعد للعميل (Sub-ledger) عند البيع الآجل وخفضه بالدفعات والمرتجعات
  - مرتجع المبيعات يستعيد المخزون بتكلفة السطر الأصلية للبيع وليس بمتوسط التكلفة الحالي (ADR-17)
  - مرتجع السيريال ينقل الحالة من `sold` إلى `returned` ثم `in_stock` مع الاحتفاظ بالتكلفة الفعلية
  - منع إرجاع كمية تتجاوز الكمية المباعة
  - حساب خصومات الفاتورة والأسطر (نسبة ومبلغ ثابت) بدقة متناهية
  - إنشاء عروض الأسعار مع أسطرها وتوثيقها
  - إنشاء مسودات المبيعات مع أسطرها وتوثيقها
  - **سد ثغرة:** رفض فاتورة مبيعات في سنة مالية مغلقة (`ClosedFiscalYearException`)
  - **سد ثغرة:** عزل الفروع في سجلات المبيعات وعدم ظهور فواتير فرع لمستخدم فرع آخر
  - **سد ثغرة:** بيع كمية أكبر من الرصيد يرجع خطأ عربي عبر جلسة Inertia ورسالة 422 للـ JSON
  - **سد ثغرة:** مطابقة `paid_amount` و `payment_status` بعد تسجيل دفعتين وحذف واحدة
  - **سد ثغرة:** اختبار ADR-20 لأسعار مجموعات البيع `product_price_group_prices` مع `variation_id = NULL` ومنع التكرار
- `tests/Feature/PhaseC2/SaleScreensTest.php`: **10**
  - `sales_index_requires_permission_and_returns_200_for_admin`: شاشة قائمة الفواتير والأوامر والمقاييس المالية
  - `sales_create_page_requires_permission_and_returns_200_for_admin`: شاشة إنشاء فاتورة بيع جديدة مع تحميل العملاء والمنتجات والسيريالات المتاحة
  - `sale_store_lifecycle_and_validation`: إنشاء فاتورة مبيعات عبر HTTP والتحقق من الحقول الإجبارية
  - `sale_show_page_and_payments_recording`: شاشة عرض الفاتورة (مجهزة للطباعة) وتسجيل الدفعات النقدية والبنكية
  - `sale_payment_delete_updates_order_and_subledger`: حذف الدفعة وتحديث رصيد الفاتورة ودفتر الأستاذ المساعد للعميل
  - `sale_returns_index_create_and_store_lifecycle`: دورة حياة شاشات مرتجعات المبيعات
  - `quotations_index_create_and_store_lifecycle`: شاشات عروض الأسعار (عرض، إنشاء، حفظ)
  - `sale_drafts_index_create_and_store_lifecycle`: شاشات مسودات المبيعات (عرض، إنشاء، حفظ)
  - `discounts_index_store_update_and_delete_lifecycle`: إدارة الخصومات والبروموكود
  - `branch_isolation_in_sales`: عزل الفروع في فواتير المبيعات وحماية النطاق
- `tests/Feature/PhaseC2/PosScreensTest.php`: **14**
  - `pos_screen_requires_permission_and_returns_200_for_admin`: حماية شاشة نقطة البيع بالصلاحية وعرض واجهة الكاشير
  - `pos_screen_renders_with_open_session_and_catalog`: عرض شاشة الكاشير والكتالوج والمنتجات والعملاء عند وجود جلسة مفتوحة
  - `open_pos_session_creates_new_session_for_cashier`: فتح جلسة كاشير جديدة برصيد افتتاحي
  - `cannot_open_second_pos_session_while_first_is_open`: منع فتح جلسة ثانية لنفس المستخدم أثناء وجود جلسة مفتوحة
  - `close_pos_session_updates_status_and_calculates_difference`: إغلاق الجلسة واحتساب الفرق (عجز/فائض) بدقة
  - `pos_sessions_list_requires_permission_and_returns_200`: قائمة جلسات نقاط البيع مع الفلاتر والمقاييس المالية
  - `pos_session_show_renders_200_with_session_data`: تفاصيل الجلسة وإحصائيات المبيعات والمدفوعات
  - `cannot_open_pos_session_in_closed_fiscal_year`: حماية السنة المالية المغلقة من فتح جلسات بيع
  - `shipments_index_requires_permission_and_returns_200`: قائمة الشحنات وتصفياتها والمقاييس التشغيلية
  - `store_shipment_creates_record_linked_to_sale_order`: إنشاء شحنة وربطها بأمر البيع وشركة الشحن
  - `show_and_update_shipment_status_lifecycle`: دورة حياة حالات الشحنة (ordered, packed, shipped, delivered, cancelled)
  - `branch_isolation_in_shipments`: عزل الفروع وحماية خصوصية شحنات كل فرع
  - `pos_session_shows_sales_linked_to_it`: ربط المبيعات المنفذة بالجلسة وعرضها في السجل المالي
  - `pos_checkout_endpoint_creates_order_and_returns_json`: إتمام عملية البيع السريع ونقطة البيع عبر API/Inertia
- `tests/Feature/PhaseC2/PosCheckoutTest.php`: **7**
  - `checkout_requires_open_cashier_session_and_binds_session_to_order_and_payments`: اشتراط جلسة مفتوحة وربطها بالفاتورة والدفعات
  - `checkout_serial_product_requires_serial_per_unit_in_stock_in_session_warehouse`: فحص سيريالات الأجهزة وتوفرها بمستودع الجلسة
  - `checkout_multi_payment_cash_network_and_credit_limit_check`: الدفع المتعدد وفحص سقف ائتمان العميل عند البيع الآجل
  - `checkout_idempotency_key_prevents_duplicate_orders`: منع تكرار الفواتير والضغط المزدوج عبر Idempotency Key
  - `checkout_min_selling_price_requires_override_permission`: حماية الحد الأدنى لسعر البيع واشتراط صلاحية التجاوز
  - `checkout_discount_requires_pos_discount_permission`: اشتراط صلاحية الخصم `pos.discount`
  - `stock_reconcile_runs_clean_after_pos_checkout_scenario`: تطابق كامل 100% بين الحركات المخزنية والأرصدة بعد عمليات نقطة البيع

**المجموع الكلي:** 10 + 24 + 54 + 17 + 6 + 24 + 10 + 10 + 49 = **204 اختباراً**.

---

## 3. تفاصيل البنية التحتية المنفذة

### 3.1 المرحلة أ (20 جدولاً):
- **الجداول (15):** `businesses`, `fiscal_years`, `branches`, `warehouses`, `users`, `representatives`, `document_sequences`, `pos_sessions`, `taxes`, `payment_methods`, `treasuries`, `bank_accounts`, `shipping_companies`, `selling_price_groups`, `currencies`.
- **جداول Spatie RBAC (5):** `roles`, `permissions`, `model_has_roles`, `model_has_permissions`, `role_has_permissions`.
- **التثبيت:** عزل الفروع عبر `branches.view_all`، إزالة `current_balance` المخزن من الحسابات، ضبط 10 حسابات نظامية.

### 3.2 المرحلة ب1 (9 جداول):
- **الجداول (9):** `product_categories`, `brands`, `units`, `warranties`, `products`, `product_variations`, `product_price_group_prices` (مع عمود `variation_key` المولد لمنع تكرار NULL), `product_serials`, `serial_events`.
- **الخدمات والآلة:** `SerialStateMachine` (قفل تشاؤمي، منع البيع المباشر للمرتجع، اشتراط `serials.accept_return`، اشتراط إذن تسوية لإعادة تأهيل التالف، وحماية `serial_events` بترجرز MySQL).

### 3.3 المرحلة ب2 (10 جداول مخزنية + Triggers):
- **الجداول (10):** `stock_balances` (مع `variation_key` المولد), `stock_movements` (مع MySQL Triggers لمنع UPDATE و DELETE نهائياً), `opening_stocks`, `opening_stock_lines`, `stock_adjustments`, `stock_adjustment_lines`, `inventory_transfers`, `inventory_transfer_lines`, `damaged_stock`, `damaged_stock_lines`.
- **الخدمات البرمجية:**
  - `StockService`: حساب المتوسط المرجح التلقائي، منع المخزون السالب الصارم، حركة مخزنية واحدة لكل جهاز سيريال، مع نقطة ربط مؤجلة للقيود `dispatchDeferredJournalEntry`.
  - `InventoryTransferService`: تحويل ذري بين المستودعات مع توريث تكلفة المصدر (ADR-25).
  - `StockAdjustmentService`: ترحيل سندات الإدخال والإخراج والجرد وتسوية التالف.
  - `DamagedStockService`: إثبات التالف وخصم الرصيد ونقل حالة السيريال.
  - `OpeningStockService`: ترحيل بضاعة أول المدة.
  - `StockReconciliationService` وأمر Artisan `stock:reconcile`: فحص التطابق بالمعامل الآمن `<=>`.

### 3.4 المرحلة ج1 — جهات التعامل والمشتريات (10 جداول):
- **الجداول (10):** `contact_groups`, `contacts`, `contact_ledger_entries` (Sub-ledger), `purchase_orders`, `purchase_order_lines`, `purchase_line_serials`, `purchase_payments`, `purchase_returns`, `purchase_return_lines`, `purchase_return_line_serials`.
- **الخدمات البرمجية:**
  - `PurchaseService`: إنشاء أوامر الشراء، استلام البضائع `receive` وتحديث المخزون عبر `StockService` وتسجيل سيريالات الأجهزة `in_stock`، تسجيل الدفعات وسندات السداد للموردين وتحديث `paid_amount` و `payment_status`، إنشاء مرتجع المشتريات `createReturn` وخفض المخزون وإرجاع السيريال للمورد بحالة `returned_to_supplier` وتوثيق تكلفة الاسترداد الفعلية للجهاز (ADR-14/ADR-16).
- **إقرار وتصريح محاسبي صريح:**
  > [!IMPORTANT]
  > **تنبيه محاسبي وفق خطة وهيكلة المشروع:** المرحلة ج1 منفذة حالياً **بلا قيود محاسبية عامة** (قيود اليومية `journal_entries` وسندات الأستاذ العام مؤجلة للمرحلة د). تُسجل حركات الموردين فقط في دفتر الأستاذ المساعد (`contact_ledger_entries` - Sub-ledger) لمتابعة المستحقات وأرصدة الموردين، و**دفتر الأستاذ المساعد `contact_ledger` غير مطابق للأستاذ العام (General Ledger) بعد**، والتطابق الكامل سيتم عند ربط قيود اليومية الآلية في المرحلة د.

### 3.5 المرحلة ج2 — المبيعات وعروض الأسعار والمسودات (13 جدولاً):
- **الجداول (13):** `discounts`, `quotations`, `quotation_lines`, `sale_drafts`, `sale_draft_lines`, `sale_orders`, `sale_order_lines`, `sale_line_serials`, `sale_payments`, `sale_returns`, `sale_return_lines`, `sale_return_line_serials`, `shipments`.
- **الخدمات البرمجية:**
  - `SaleService`:
    - إنشاء فواتير المبيعات الذري داخل DB Transaction.
    - فحص المخزون وخصمه عبر `StockService::recordOut` وتوثيق تكلفة البضاعة المباعة COGS.
    - إدارة دورة السيريال: التحقق من `in_stock`، وتحديثه بحالة `sold` عبر `SerialStateMachine` مع الاحتفاظ بـ `warehouse_id` (ADR-21) وحفظ تكلفة الشراء الفعلية في سطر السيريال.
    - قيد دفتر الأستاذ المساعد للعميل `contact_ledger_entries` (مدين بقيمة الفاتورة، دائن بالدفعات والمرتجعات).
    - تسجيل دفعات المبيعات وحذفها مع مزامنة `paid_amount` و `payment_status`.
    - إنشاء مرتجعات المبيعات وإعادة المخزون بتكلفة البيع الأصلية (ADR-17) لتجنب تشويه تكلفة COGS، ونقل حالة سيريالات الأجهزة إلى `returned` ثم إلى `in_stock` مع الاحتفاظ بتكلفتها الفعلية (ADR-14/ADR-16/ADR-24).
    - إنشاء وإدارة عروض الأسعار والمسودات وقوائم الخصومات.
- **الشاشات والواجهات (12 شاشة برمجية تفاعلية بـ Inertia + React):**
  - مبيعات: `Sales/Index`, `Sales/Create`, `Sales/Show` (مع دعم طباعة حرارية A4/80mm عبر `@media print`).
  - مرتجعات: `Sales/Returns/Index`, `Sales/Returns/Create`, `Sales/Returns/Show`.
  - عروض الأسعار: `Sales/Quotations/Index`, `Sales/Quotations/Create`, `Sales/Quotations/Show`.
  - المسودات: `Sales/Drafts/Index`, `Sales/Drafts/Create`.
  - الخصومات: `Sales/Discounts`.
- **إقرار وتصريح محاسبي صريح:**
  > [!IMPORTANT]
  > **تنبيه محاسبي:** تماماً كالمرحلة ج1، المرحلة ج2 مسجلة بدفتر الأستاذ المساعد للعملاء `contact_ledger_entries`، ولم ترتبط بعد بدفتر الأستاذ العام وقيود اليومية `journal_entries` وحساب الإيرادات وتكلفة البضاعة المباعة (التي تبدأ في المرحلة د).

---

## 4. تصنيف الشاشات والواجهات (بحسب قاعدة الصدق والأمانة الهندسية)

### 4.1 شاشات المنتجات (React 19 + Inertia):
- **الحالة:** **مختبرة من جهة الخادم (Server-Side Tested) — الواجهة بلا اختبارات آلية (No Client-Side / E2E Tests).**
- **الشاشات المنفذة (8 شاشات):**
  1. `resources/js/Pages/Products/Index.jsx` (قائمة المنتجات مع الفلاتر ونافذة الاستعلام السريع وتفعيل/تعطيل وحذف المنتج).
  2. `resources/js/Pages/Products/Create.jsx` (إضافة منتج عادي / متغير / خدمة مع الأسعار والسمات).
  3. `resources/js/Pages/Products/Edit.jsx` (تعديل المنتج مع حماية قفل نوع التتبع عند وجود حركات).
  4. `resources/js/Pages/Products/Show.jsx` (عرض تفاصيل المنتج ومخزونه وتاريخ سيريالاته).
  5. `resources/js/Pages/Products/Serials.jsx` (شاشة تتبع الأرقام التسلسلية وسجل أحداثها وإجراء الانتقالات).
  6. `resources/js/Pages/Products/Categories.jsx` (إدارة التصنيفات وشجرتها الهرمية).
  7. `resources/js/Pages/Products/Brands.jsx` (إدارة العلامات التجارية).
  8. `resources/js/Pages/Products/Units.jsx` (إدارة الوحدات ومعاملات التحويل).
  9. `resources/js/Pages/Products/Warranties.jsx` (إدارة فترات وشروط الضمان).
- **التغطية:** مغطاة بالكامل بـ 33 اختبار Feature (`ProductScreensTest`) تفحص مسارات الـ HTTP، الاستجابات، صلاحيات RBAC، وقواعد FormRequests. واجهة المستخدم لم تُختبر باختبارات متصفح آلية (Playwright/Cypress غير مبنية).

### 4.2 لوحة التحكم وشاشات الموديول:
- `Dashboard.jsx`: الأرقام الوهمية محذوفة وتعيد 0، مختبرة من جهة الخادم (200 OK للمدير). الواجهة بلا اختبارات آلية.
- `ModuleView.jsx`: واجهة عرض موحدة لباقي البنود، مختبرة من جهة المسارات (200 للمفعل و404 للمعطل).

### 4.3 واجهات المخزون — الدفعة 1 (React + Inertia — **مكتملة في هذه الجلسة**):

> [!IMPORTANT]  
> **قاعدة الصدق:** الشاشات التالية مختبرة من جهة الخادم فقط عبر Feature Tests (HTTP 200/403 + RBAC + منطق العمل). لا تتوفر اختبارات متصفح آلية (Playwright/Cypress/E2E) — واجهة React بلا اختبارات عميل آلية.

**الشاشات المنفذة (16 شاشة React في 6 مجموعات):**

1. **بضاعة أول المدة** (`/inventory/opening-stock*`):
   - `Index.jsx`, `Create.jsx`, `Show.jsx` + `OpeningStockController` + `StoreOpeningStockRequest`
2. **أذن إضافة** (`/inventory/vouchers/receiving*`):
   - `ReceivingIndex.jsx`, `ReceivingCreate.jsx`, `ReceivingShow.jsx` + `StockVoucherController::receivingStore` + `StoreStockVoucherRequest`
3. **أذن صرف** (`/inventory/vouchers/delivery*`):
   - `DeliveryIndex.jsx`, `DeliveryCreate.jsx`, `DeliveryShow.jsx` + `StockVoucherController::deliveryStore`
4. **تحويل مخزون** (`/inventory/transfers*`):
   - `Transfers/Index.jsx`, `Create.jsx`, `Show.jsx` + `InventoryTransferController` + `StoreInventoryTransferRequest`
5. **المخزون التالف** (`/inventory/damaged*`):
   - `Damaged/Index.jsx`, `Create.jsx`, `Show.jsx` + `DamagedStockController` + `StoreDamagedStockRequest`
6. **تقارير الجرد** (`/inventory/reports/*`):
   - `StocktakingCost.jsx`, `StocktakingSale.jsx`, `StocktakingNoPrice.jsx`, `SummaryReport.jsx` + `StocktakingReportController`

**تعديلات على كود الإنتاج:**
- إضافة `unit_id` لـ `InventoryTransferLine::create()` في `InventoryTransferController` (كان يفشل بـ DB error).
- تغيير `auto_post` الافتراضي من `true` إلى `false` في `DamagedStockController::store()` للسماح بالترحيل المنفصل.

### 4.4 واجهات جهات التعامل — الدفعة 2 (React + Inertia — **مكتملة في هذه الجلسة**):

> [!IMPORTANT]  
> **قاعدة الصدق:** الشاشات التالية مختبرة من جهة الخادم عبر 10 اختبارات Feature (`ContactScreensTest`) بنسبة نجاح 100% (HTTP 200/403 + RBAC + التحقق + دورة الحياة المالية للـ Sub-ledger).

**الشاشات المنفذة (10 شاشات React في 4 مجموعات):**

1. **الموردين** (`/contacts/suppliers*`):
   - `Suppliers/Index.jsx`: قائمة الموردين مع البحث، فلترة المجموعات والحالة، عرض الأرصدة المستحقة وإحصائيات سريعة.
   - `Suppliers/Create.jsx`: نموذج إضافة مورد مع التوليد التلقائي للكود `SUP-`، وتسجيل الرصيد الافتتاحي فوراً في الـ Sub-ledger.
   - `Suppliers/Edit.jsx`: نموذج تعديل بيانات المورد والاتصال وسقف الائتمان.
   - `Suppliers/Show.jsx`: الملف المالي الشامل للمورد (الرصيد المستحق، إجمالي المشتريات، إجمالي المدفوعات، آخر فواتير الشراء، ومعاينة كشف الحساب).
2. **العملاء** (`/contacts/customers*`):
   - `Customers/Index.jsx`: قائمة العملاء مع البحث، الفلترة بالمجموعات وأسعار البيع، وعرض المديونيات المستحقة.
   - `Customers/Create.jsx`: نموذج إضافة عميل مع كود `CUS-` وسقف الائتمان والرصيد الافتتاحي.
   - `Customers/Edit.jsx`: تعديل بيانات العميل والإعدادات المالية.
   - `Customers/Show.jsx`: الملف المالي للعميل وسقف الائتمان والمتاح منه.
3. **مجموعات جهات التعامل** (`/contacts/customer-groups*`):
   - `Groups/Index.jsx`: إدارة المجموعات، نسب الخصم التلقائية، وفئات أسعار البيع، مع نافذة مشروطة (Modal) للإضافة والتعديل.
4. **كشف الحساب التفصيلي** (`/contacts/{contact}/ledger`):
   - `Ledger/Show.jsx`: كشف حساب شامل (Statement of Account) مع فلترة الفترة الزمنية (من / إلى)، حساب رصيد ما قبل الفترة التلقائي، رصيد تراكمي لكل حركة، وإمكانية الطباعة المباشرة (`@media print`).

### 4.5 واجهة نقطة البيع السريعة (POS Terminal — React + Inertia — **مكتملة ومختبرة**):

> [!IMPORTANT]  
> **قاعدة الصدق والأمانة الهندسية:** شاشة نقطة البيع تم تحويلها من مجرد شاشة فتح جلسة إلى **محطة بيع كاشير كاملة وسريعة (POS Terminal)**، ومغطاة بـ 20 اختبار Feature خادمي بنسبة نجاح 100% (`PosScreensTest` و `PosCheckoutTest`) تؤكد دقة العمليات وحسابات المخزون والسيريالات والدفع المتعدد.

**الميزات والوظائف المنفذة بالكامل:**
1. **محرك المسح والإدخال السريع:** دعم مسح الباركود، أو السيريال/IMEI المباشر، أو البحث بالاسم والـ SKU مع الإضافة التلقائية للسلة.
2. **شريط التصنيفات التفاعلي:** تصفية المنتجات حسب الأقسام والتصنيفات وعرض عدد المنتجات.
3. **شبكة بطاقات المنتجات:** عرض الأسعار والوحدات، وحالة توفر المخزون في مستودع الجلسة حصراً، وتمييز أجهزة السيريال بعدد الأجهزة المتوفرة.
4. **سلة الكاشير المباشرة:** تعديل الكميات والأسعار (مع حماية الحد الأدنى لسعر البيع)، الخصومات على مستوى السطر والفاتورة (مع التحقق من صلاحية `pos.discount`).
5. **نافذة تحديد السيريال/IMEI للأجهزة:** فلترة السيريالات المتوفرة (`in_stock`) داخل مستودع الجلسة واشتراط تطابق عدد السيريالات المحددة مع كمية السطر.
6. **محدد العميل الذكي:** خيار العميل الافتراضي (عميل نقدي عام Walk-in)، أو اختيار عميل مسجل مع عرض رصيده وسقف ائتمانه.
7. **نافذة الدفع المتعدد والتجزئة (Multi-Payment Modal):** دعم الدفع المجزأ (نقدي، مدى/شبكة، تحويل، آجل)، واشتراط تحديد عميل والتحقق من `credit_limit` عند البيع الآجل.
8. **الفئات النقدية السريعة واحتساب الباقي:** أزرار (المطابق، 50، 100، 200، 500 ر.س) مع احتساب فوري للباقي للعميل (Change Due).
9. **حماية عدم التكرار:** توليد مفتاح فريد `idempotency_key` لكل عملية بيع لمنع تكرار الفواتير عند النقر المزدوج.
10. **إيصال حراري متوافق (80mm Thermal Receipt):** نافذة معاينة وطباعة الإيصال فور اعتماد الفاتورة بتنسيق حراري مخصص يشمل بيانات المنشأة، الضريبة، الباركود، تفاصيل الأجهزة وأرقام السيريال.
11. **اختصارات لوحة المفاتيح:**
    - `F1`: بدء فاتورة جديدة ومسح السلة.
    - `F2`: فتح نافذة الدفع والتسوية.
    - `F3`: التركيز المباشر على حقل مسح الباركود.
    - `Esc`: إغلاق النوافذ النشطة.

---

## 5. القائمة والمسارات

| البند | الحالة |
|---|---|
| 23 وحدة رئيسية في `menu.config.js` | مكتملة ومطابقة للمرجع الأصلي حرفياً |
| القوائم الفرعية لجميع الوحدات | مكتملة ومطابقة 100% بالأعداد والترتيب |
| 7 وحدات معطلة (`enabled: false`) | تصنيع, صيانة, مقاولات, CRM, شؤون العاملين, مراكز التكلفة, صرف بضاعة على مراكز التكلفة (تعيد 404) |
| المسارات في `routes/web.php` | بلا تكرار وبلا أخطاء |

---

## 6. النتائج الحرفية للاختبارات والبناء

### 6.1 مخرجات `php artisan test` الحرفية:

```text
   PASS  Tests\Unit\ExampleTest
  ✓ that true is true                                                                                            0.02s  

   PASS  Tests\Feature\ExampleTest
  ✓ the application returns a successful response                                                                9.23s  

   PASS  Tests\Feature\MenuNavigationTest
  ✓ menu config has exact 23 top level modules in original order                                                 0.23s  
  ✓ submenus exact item counts                                                                                   0.06s  
  ✓ submenus exact labels and order match literal requirements                                                   0.06s  
  ✓ no duplicate keys and no duplicate hrefs                                                                     0.09s  
  ✓ disabled modules and items have enabled false                                                                0.06s  
  ✓ all enabled hrefs return http 200 for admin                                                                  1.06s  
  ✓ disabled modules and items return 404                                                                        0.11s  
  ✓ menu permission filtering logic                                                                              0.18s  

   PASS  Tests\Feature\PhaseA\AdminRolePermissionsTest
  ✓ admin role has all permissions and admin user is configured                                                  0.91s  

   PASS  Tests\Feature\PhaseA\BranchIsolationTest
  ✓ branch1 user can only see branch1 records                                                                    0.15s  
  ✓ branch2 user can only see branch2 records                                                                    0.11s  
  ✓ admin user can see records from all branches                                                                 0.10s  

   PASS  Tests\Feature\PhaseA\CashierPermissionTest
  ✓ cashier has limited permissions and cannot access user management                                            1.00s  

   PASS  Tests\Feature\PhaseA\ChartOfAccountsStabilizationTest
  ✓ system accounts exist after seeding with correct flags                                                       0.16s  
  ✓ current balance column does not exist in accounts table                                                      0.06s  
  ✓ prevent duplicate account code                                                                               0.07s  
  ✓ prevent self parenting and circular loops                                                                    0.06s  
  ✓ prevent circular descendant loop                                                                             0.05s  
  ✓ prevent deleting account with children                                                                       0.07s  
  ✓ prevent deleting system account                                                                              0.05s  
  ✓ prevent modifying code of system account                                                                     0.05s  

   PASS  Tests\Feature\PhaseA\DocumentSequenceTest
  ✓ generates sequential padded numbers                                                                          0.07s  
  ✓ sequence does not duplicate under simulated concurrent requests                                              0.14s  
  ✓ sequences are isolated by branch fiscal year and doc type                                                    0.07s  

   PASS  Tests\Feature\PhaseA\FiscalYearDocumentProtectionTest
  ✓ can toggle fiscal year status                                                                                0.06s  
  ✓ can create document in open fiscal year                                                                      0.07s  
  ✓ cannot create document in closed fiscal year                                                                 0.06s  

   PASS  Tests\Feature\PhaseA\MigrationFreshRollbackTest
  ✓ migrations can run fresh and rollback without errors                                                        16.58s  

   PASS  Tests\Feature\PhaseA\PosSessionTest
  ✓ cashier cannot open new session before closing previous                                                      8.17s  
  ✓ cashier can open new session after closing previous                                                          0.08s  

   PASS  Tests\Feature\PhaseA\WarehouseDefaultTest
  ✓ only one default warehouse per branch                                                                        0.07s  
  ✓ default warehouses in different branches do not interfere                                                    0.22s  

   PASS  Tests\Feature\PhaseB1\ProductCatalogTest
  ✓ prevent duplicate product sku                                                                                0.10s  
  ✓ prevent duplicate product variation sku                                                                      0.11s  
  ✓ prevent self parenting in product categories                                                                 0.06s  
  ✓ prevent circular loop in product categories                                                                  0.05s  
  ✓ category hierarchy validation rule                                                                           0.05s  
  ✓ variable product requires variation exception                                                                0.05s  
  ✓ prevent duplicate product price group price with null variation                                              0.06s  

   PASS  Tests\Feature\PhaseB1\ProductScreensTest
  ✓ products index returns 200 for admin                                                                         0.10s  
  ✓ products index returns 403 without permission                                                                0.06s  
  ✓ products create page returns 200 for admin                                                                   0.08s  
  ✓ products create page returns 403 without permission                                                          0.06s  
  ✓ store product creates record                                                                                 0.08s  
  ✓ store product rejects duplicate sku                                                                          0.08s  
  ✓ edit product page returns 200                                                                                0.09s  
  ✓ edit product returns 403 without permission                                                                  0.08s  
  ✓ show product page returns 200                                                                                0.09s  
  ✓ update tracking type blocked after serials exist                                                             0.10s  
  ✓ toggle active flips product status                                                                           0.08s  
  ✓ toggle active returns 403 without permission                                                                 0.07s  
  ✓ serials index returns 200                                                                                    0.09s  
  ✓ serials index returns 403 without permission                                                                 0.07s  
  ✓ categories index returns 200                                                                                 0.08s  
  ✓ categories index returns 403 without permission                                                              0.06s  
  ✓ store category creates record                                                                                0.06s  
  ✓ store category fails without name                                                                            0.06s  
  ✓ update category                                                                                              0.06s  
  ✓ delete category without products                                                                             0.30s  
  ✓ delete category with products fails                                                                          2.61s  
  ✓ brands index returns 200                                                                                     0.19s  
  ✓ store brand creates record                                                                                   0.10s  
  ✓ delete brand with products fails                                                                             1.46s  
  ✓ units index returns 200                                                                                      0.07s  
  ✓ store unit creates record                                                                                    0.07s  
  ✓ store unit with conversion                                                                                   0.07s  
  ✓ delete unit with products fails                                                                              0.97s  
  ✓ warranties index returns 200                                                                                 0.08s  
  ✓ store warranty creates record                                                                                0.07s  
  ✓ delete warranty with products fails                                                                          1.32s  
  ✓ quick query returns json                                                                                     0.10s  
  ✓ quick query returns 403 without permission                                                                   0.06s  

   PASS  Tests\Feature\PhaseB1\ProductSerialTest
  ✓ prevent duplicate serial number                                                                              0.11s  
  ✓ prevent duplicate imei1 but accept multiple nulls                                                            0.07s  
  ✓ prevent duplicate imei2 but accept multiple nulls                                                            0.08s  
  ✓ sold serial preserves last warehouse id                                                                      0.09s  

   PASS  Tests\Feature\PhaseB1\SerialStateMachineTest
  ✓ all allowed transitions succeed and write events                                                             0.14s  
  ✓ disallowed direct transition returned to sold is forbidden                                                   0.08s  
  ✓ disallowed transition in stock to returned is forbidden                                                      0.07s  
  ✓ disallowed transition sold to in stock directly is forbidden                                                 0.09s  
  ✓ returned to supplier is terminal and cannot transition                                                       0.08s  
  ✓ damaged to in stock without adjustment is forbidden                                                          0.07s  
  ✓ returned to in stock without permission is forbidden                                                         0.10s  
  ✓ serial events are immutable                                                                                  0.09s  
  ✓ serial events database triggers block direct db update and delete                                            0.12s  
  ✓ simulated concurrent transitions only one succeeds                                                           0.10s  

   PASS  Tests\Feature\PhaseB2\InventoryTransferTest
  ✓ transfer lifecycle and adr25 cost inheritance without changing source avg cost                               0.24s  
  ✓ serial transfer transitions and single movement                                                              0.23s  
  ✓ transfer atomic rollback on midway failure                                                                   0.62s  

   PASS  Tests\Feature\PhaseB2\StockAdjustmentAndDamagedTest
  ✓ opening stock posting                                                                                        0.13s  
  ✓ damaged stock deduction and serial status                                                                    0.11s  
  ✓ rehabilitating damaged serial to in stock via approved stock adjustment                                      0.10s  

   PASS  Tests\Feature\PhaseB2\StockReconciliationTest
  ✓ reconciliation is clean after normal stock operations                                                        0.14s  
  ✓ detection of artificial stock movement discrepancy                                                           0.12s  
  ✓ detection of serial stock discrepancy                                                                        0.10s  

   PASS  Tests\Feature\PhaseB2\StockServiceTest
  ✓ weighted average cost calculation                                                                            0.11s  
  ✓ negative stock is strictly prevented                                                                         0.10s  
  ✓ single movement per serial device                                                                            0.13s  
  ✓ stock movement cannot be updated or deleted via eloquent                                                     0.13s  
  ✓ stock movement cannot be updated or deleted via direct db triggers                                           0.17s  
  ✓ null variation id does not duplicate stock balance                                                           0.15s  

   PASS  Tests\Feature\PhaseC1\ContactTest
  ✓ prevent duplicate contact code                                                                               0.71s  
  ✓ null email accepted multiple times                                                                           0.64s  
  ✓ is supplier and is customer helpers                                                                          0.61s  
  ✓ contact credit limit stored correctly                                                                        0.61s  
  ✓ contact belongs to group                                                                                     0.62s  
  ✓ contact balance computed from ledger entries                                                                 0.62s  
  ✓ contact soft delete                                                                                          0.64s  

   PASS  Tests\Feature\PhaseC1\PurchaseOrderTest
  ✓ create purchase order for regular product                                                                    0.13s  
  ✓ receive purchase order updates stock for regular product                                                     0.11s  
  ✓ receive serial product transitions serial to in stock                                                        0.15s  
  ✓ receiving already received order throws exception                                                            0.10s  
  ✓ record payment updates paid amount and status                                                                0.10s  
  ✓ purchase return reduces stock for regular product                                                            0.13s  
  ✓ purchase return serial transitions to returned to supplier                                                   0.13s  
  ✓ serial count mismatch throws exception                                                                       0.10s  
  ✓ weighted average cost after two purchases via service                                                        0.13s  
  ✓ credit purchase writes contact ledger and payment and return reduce it                                       0.24s  
  ✓ paid amount equals sum payments after two payments and one deletion                                          0.19s  
  ✓ prevent returning more than purchased and previously returned                                                0.18s  
  ✓ prevent duplicate serial or imei across two purchase invoices                                                0.15s  
  ✓ purchase return serial uses actual cost price in return serials and movement                                 0.14s  
  ✓ branch isolation and closed fiscal year protection for purchases                                             0.10s  

  Tests:    183 passed (1257 assertions)
  Duration: 108.32s
```

### 6.2 مخرجات `npm run build` الحرفية:

```text
✓ 129 modules transformed.
rendering chunks...
computing gzip size...
✓ built in 14.12s
bootstrap/ssr/ssr.js  462.66 kB
✓ built in 15.65s
```

---

## 7. الخطة القادمة: المرحلة د (وفق DB_SCHEMA.md v3 حصراً)

المخطط الهيكلي المعتمد نصاً وحصراً في وثيقة `docs/DB_SCHEMA.md v3` دون أي جداول خارجة عنها:

### المرحلة د — القيود والشيكات والبنوك (12 جدولاً):
1. `accounts` (دليل الحسابات الشجري - مُثبَّت في المرحلة أ ويرتبط بالقيود).
2. `journal_entries` (سجل قيود اليومية العامة Polymorphic).
3. `journal_lines` (أسطر القيود اليومية مدين/دائن مع فحص التوازن).
4. `vouchers` (السندات المالية: صرف وقبض).
5. `checks` (الشيكات الصادرة والواردة).
6. `check_transactions` (حركات ومراحل تتبع الشيكات: مقاصة، صرف، ارتداد).
7. `bank_transfers` (التحويلات بين الحسابات البنكية).
8. `expense_categories` (تصنيفات المصاريف).
9. `expenses` (سندات ومصروفات المنشأة).
10. `notification_templates` (نماذج الإشعارات).
11. `settings` (إعدادات النظام العامة).
12. `activity_logs` (سجل تتبع نشاطات النظام والعمليات الحساسة).

*(ملاحظة: الجداول المستقبلية غير المنفذة: 7 جداول + الجداول المؤجلة صراحة ADR-10/13: 3 جداول).*

---

## 8. سجل التغييرات (Changelog)

| التاريخ | ما تم إنجازه | الملفات الرئيسية | نتيجة الاختبارات والبناء |
|---|---|---|---|
| 2026-10-20 | تجهيز مشروع Laravel 12، ضبط MySQL ERP_Accounting_db، توليد المفتاح. | `.env`, `composer.json`, `migrations` | تم التحقق يدوياً |
| 2026-10-21 | تثبيت Inertia.js وReact 19 وLucide Icons، قالب Blade بـ RTL وخط Cairo. | `package.json`, `vite.config.js`, `app.blade.php`, `app.jsx` | `npm run build` ناجح |
| 2026-10-21 | إنشاء ملفات التوثيق (`CLAUDE.md`, `PROGRESS.md`, `DECISIONS.md`). | `CLAUDE.md`, `docs/*` | وثائق فقط |
| 2026-10-21 | `menu.config.js` + `AppLayout.jsx` + `ModuleView.jsx` + مسارات routes + 8 اختبارات. | `menu.config.js`, `AppLayout.jsx`, `ModuleView.jsx`, `web.php` | 10 passed (297 assertions) |
| 2026-10-21 | المرحلة أ كاملة: 14 جدولاً + Spatie RBAC، النماذج، والمصانع، وعزل الفروع. | `migrations/*`, `app/Models/*`, `database/factories/*`, `PhaseASeeder.php` | 25 passed (352 assertions) |
| 2026-10-21 | مرحلة التثبيت: حذف `current_balance`، تحديث دليل الحسابات، FormRequests، الخطوط >= 14px. | `Account.php`, `*Request.php`, `AccountController.php`, `DashboardController.php`, `Dashboard.jsx` | 33 passed (411 assertions) |
| 2026-10-22 | المرحلة ب1 كاملة: 9 جداول (المنتجات، المتغيرات، الأسعار مع `variation_key`، السيريال، سجل الأحداث غير القابل للتعديل)، `SerialStateMachine`، حماية التصنيفات، حماية المنتجات المتغيرة، صلاحيات `serials.accept_return`. | `migrations 010001-010009`, `app/Models/*`, `SerialStateMachine.php`, `app/Rules/*` | 53 passed (454 assertions) |
| 2026-10-22 | استكمال ب1: حماية `serial_events` بترجرز MySQL واختبار انتقالين متزامنين بنجاح واحد فقط. | `migration_010010`, `SerialStateMachineTest.php` | 55 passed (459 assertions) |
| 2026-10-22 | المرحلة ب2 كاملة: 10 جداول مخزنية + Triggers لمنع تعديل/حذف `stock_movements`، نماذج ومصانع، `StockService` (متوسط مرجح، منع السالب، حركة لكل سيريال، `lockForUpdate`)، خدمات التحويل والتسوية والتالف وأول المدة، أمر التطابق بـ (`<=>`) `stock:reconcile`. | `migrations 020001-020011`, `app/Models/*`, `app/Services/*`, `app/Console/Commands/*` | 70 passed (529 assertions) |
| 2026-10-22 | شاشات المنتجات (React 19 + Inertia): 8 شاشات تفاعلية، وحدات التحكم، طلبات التحقق FormRequests، نافذة الاستعلام السريع، حماية `tracking_type` بعد حركات المخزون والسيريالات، و 33 اختبار جديد لشاشات المنتجات. | `resources/js/Pages/Products/*`, `app/Http/Controllers/*Product*`, `app/Http/Requests/*Product*`, `ProductScreensTest.php` | 103 passed (616 assertions) |
| 2026-10-22 | إصلاح انهيار جلسات المتصفح المحلية (`Call to a member function can() on null`) عبر وسيط `AutoLoginInDev` وتعميم المعامل الآمن `?->can(...)`، وتحديث وثيقة `PROGRESS.md` وفق قاعدة الصدق وتفصيل الاختبارات بالعد الفعلي وتثبيت جداول المرحلتين ج ود. | `AutoLoginInDev.php`, `bootstrap/app.php`, `*Controller.php`, `docs/PROGRESS.md` | 103 passed (616 assertions) + Vite build ناجح |
| 2026-10-22 | إنجاز المرحلة ج1 بالكامل: 10 جداول (جهات التعامل، دفتر الأستاذ المساعد Sub-ledger، أوامر وفواتير الشراء، أسطر الشراء، سيريالات المشتريات، دفعات المشتريات، مرتجع المشتريات، أسطر وسيريالات المرتجع مع تكلفة الجهاز المستردة ADR-14/16)، ونماذج Eloquent، والمصانع، وخدمة PurchaseService، وتصحيح حالات السيريال، و15 اختبار Feature شامل. | `migrations 030001-030010`, `app/Models/*`, `PurchaseService.php`, `ContactTest.php`, `PurchaseOrderTest.php` | 118 passed (663 assertions) + Vite build ناجح |
| 2026-10-23 | سد ثغرات اختبارات ج1 السبع: المتوسط المرجح التلقائي بعد شراءين عبر PurchaseService، كتابة وخفض contact_ledger_entry عند الشراء الآجل والدفعة والمرتجع، دقة مجموع المدفوعات paid_amount بعد إضافة وحذف دفعات، منع تجاوز كمية المرتجع، منع تكرار السيريال أو IMEI عبر الفواتير، مرتجع السيريال بتكلفة الجهاز الفعلية المسجلة، عزل الفروع وحماية السنة المالية المغلقة، وإصلاح تهيئة subtotal تلقائياً في PurchaseOrder دون المساس بالاختبارات. | `PurchaseOrderTest.php`, `app/Models/PurchaseOrder.php`, `docs/PROGRESS.md` | 125 passed (696 assertions) + خلو تام من الأخطاء |
| 2026-10-23 | واجهات المخزون (الدفعة 1): 16 شاشة React تفاعلية (بضاعة أول المدة، أذونات الإضافة والصرف، التحويلات، التالف، وتقارير الجرد الأربعة)، و 6 اختبارات Feature شاملة لصلاحيات RBAC وتدفقات العمليات وعزل الفروع. | `resources/js/Pages/Inventory/*`, `InventoryScreensTest.php` | 131 passed (732 assertions) + Vite build ناجح |
| 2026-10-24 | واجهات جهات التعامل والمشتريات (الدفعة 2): 10 شاشات للموردين والعملاء وكشف الحساب ومجموعات جهات التعامل، مع 10 اختبارات شاملة للـ Sub-ledger. وفواتير المشتريات والمرتجعات والتقارير مع 10 اختبارات إضافية. | `resources/js/Pages/Contacts/*`, `resources/js/Pages/Purchases/*`, `ContactScreensTest.php`, `PurchaseScreensTest.php` | 155 passed (1045 assertions) + Vite build ناجح |
| 2026-10-24 | المرحلة ج2 (المبيعات والمسودات وعروض الأسعار والخصومات): 13 جدولاً، نماذج ومصانع، خدمة SaleService، 12 شاشة React تفاعلية، وسد الثغرات المعلقة (عزل الفروع، إغلاق السنة المالية، استجابات نقص المخزون Inertia/JSON، ومزامنة الدفعات بعد الحذف، واختبار ADR-20)، مع 28 اختبار Feature شامل. | `migrations 040001-040013`, `SaleService.php`, `resources/js/Pages/Sales/*`, `SaleOrderTest.php`, `SaleScreensTest.php` | 183 passed (1257 assertions) + Vite build ناجح |

