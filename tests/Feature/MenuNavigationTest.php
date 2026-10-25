<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tests\Traits\CreatesAdminUser;

class MenuNavigationTest extends TestCase
{
    use RefreshDatabase, CreatesAdminUser;

    private static ?array $cachedMenuConfig = null;

    /**
     * قراءة واستخراج مصفوفة القائمة مباشرة من ملف menu.config.js عبر Node.js
     */
    private function getMenuConfig(): array
    {
        if (self::$cachedMenuConfig !== null) {
            return self::$cachedMenuConfig;
        }

        $command = 'node -e "import(\'./resources/js/config/menu.config.js\').then(m => console.log(JSON.stringify(m.menuConfig)))"';
        $output = shell_exec($command);

        $this->assertNotEmpty($output, 'فشل تنفيذ أمر Node لقراءة ملف menu.config.js');

        $data = json_decode(trim($output), true);
        $this->assertIsArray($data, 'فشل تحويل مخرجات menu.config.js إلى مصفوفة صالحة');

        self::$cachedMenuConfig = $data;
        return $data;
    }

    /**
     * اختبار 1: التحقق من وجود 23 موديول رئيسي بنفس الترتيب والمسميات العربية الأصلية
     */
    public function test_menu_config_has_exact_23_top_level_modules_in_original_order(): void
    {
        $menu = $this->getMenuConfig();

        $expectedModules = [
            'الرئيسية',
            'موديول المبيعات',
            'موديول المشتريات',
            'المخازن',
            'إدارة المستخدمين',
            'جهات الاتصال',
            'المنتجات',
            'تصنيع',
            'الصيانة',
            'المصاريف',
            'مراكز التكلفة',
            'صرف بضاعة على مراكز التكلفة',
            'الحسابات',
            'المحاسبة',
            'الزكاة',
            'التقارير',
            'المقاولات',
            'نماذج الإشعارات',
            'إعدادات',
            'الحسابات العامة',
            'Crm',
            'شئون العاملين',
            'أساسيات'
        ];

        $this->assertCount(23, $menu, 'يجب أن يحتوي النظام على 23 موديول رئيسي تماماً');

        $actualLabels = array_column($menu, 'label');
        $this->assertSame($expectedModules, $actualLabels, 'أسماء وترتيب الموديولات الـ 23 يجب أن يطابق المرجع الأصلي حرفياً');
    }

    /**
     * اختبار 2: التحقق من الأعداد الدقيقة للقوائم الفرعية لكل موديول
     */
    public function test_submenus_exact_item_counts(): void
    {
        $menu = $this->getMenuConfig();
        $menuByKey = array_column($menu, null, 'key');

        // موديول المبيعات: 17 عنصراً
        $this->assertCount(17, $menuByKey['sales']['children'] ?? [], 'عدد عناصر موديول المبيعات الفرعية يجب أن يكون 17');

        // موديول المشتريات: 8 عناصر
        $this->assertCount(8, $menuByKey['purchases']['children'] ?? [], 'عدد عناصر موديول المشتريات الفرعية يجب أن يكون 8');

        // المخازن: 10 عناصر
        $this->assertCount(10, $menuByKey['inventory']['children'] ?? [], 'عدد عناصر موديول المخازن الفرعية يجب أن يكون 10');

        // إدارة المستخدمين: 3 عناصر
        $this->assertCount(3, $menuByKey['users']['children'] ?? [], 'عدد عناصر موديول إدارة المستخدمين الفرعية يجب أن يكون 3');

        // جهات الاتصال: 5 عناصر
        $this->assertCount(5, $menuByKey['contacts']['children'] ?? [], 'عدد عناصر موديول جهات الاتصال الفرعية يجب أن يكون 5');

        // المنتجات: 13 عنصراً
        $this->assertCount(13, $menuByKey['products']['children'] ?? [], 'عدد عناصر موديول المنتجات الفرعية يجب أن يكون 13');

        // المصاريف: 3 عناصر
        $this->assertCount(3, $menuByKey['expenses']['children'] ?? [], 'عدد عناصر موديول المصاريف الفرعية يجب أن يكون 3');

        // صرف بضاعة على مراكز التكلفة (معطلة): 3 عناصر
        $this->assertCount(3, $menuByKey['stock_issue_cost_centers']['children'] ?? [], 'عدد عناصر موديول صرف بضاعة الفرعية يجب أن يكون 3');

        // الحسابات: 5 عناصر
        $this->assertCount(5, $menuByKey['accounts']['children'] ?? [], 'عدد عناصر موديول الحسابات الفرعية يجب أن يكون 5');

        // التقارير: 18 عنصراً
        $this->assertCount(18, $menuByKey['reports']['children'] ?? [], 'عدد عناصر موديول التقارير الفرعية يجب أن يكون 18');

        // إعدادات: 9 عناصر
        $this->assertCount(9, $menuByKey['settings']['children'] ?? [], 'عدد عناصر موديول إعدادات الفرعية يجب أن يكون 9');

        // الحسابات العامة: 13 عنصراً
        $this->assertCount(13, $menuByKey['general_accounts']['children'] ?? [], 'عدد عناصر موديول الحسابات العامة الفرعية يجب أن يكون 13');

        // الوحدات بدون قوائم فرعية: 0
        $singleModules = ['dashboard', 'manufacturing', 'maintenance', 'cost_centers', 'accounting', 'zakat', 'contracting', 'notification_templates', 'crm', 'hr', 'basics'];
        foreach ($singleModules as $key) {
            $this->assertCount(0, $menuByKey[$key]['children'] ?? [], "الوحدة {$key} يجب أن تظل بلا قائمة فرعية");
        }
    }

    /**
     * اختبار 3: التحقق من التطابق الحرفي لنصوص وترتيب القوائم الفرعية
     */
    public function test_submenus_exact_labels_and_order_match_literal_requirements(): void
    {
        $menu = $this->getMenuConfig();
        $menuByKey = array_column($menu, null, 'key');

        // موديول المبيعات (17)
        $expectedSales = [
            'كل المبيعات', 'إضافة بيع', 'قائمة نقطة البيع', 'نقطة بيع', 'إضافة مسودة', 'قائمة المسودات',
            'إضافة اقتباس', 'قائمة بيان الأسعار', 'قائمة مرتجع المبيعات', 'الشحنات', 'خصومات',
            'استيراد المبيعات', 'مشتريات ومبيعات', 'تقرير المبيعات', 'فاتورة مبيعات إلكترونية',
            'تقرير مبيعات المنتجات', 'تقرير مرتجع المنتجات'
        ];
        $this->assertSame($expectedSales, array_column($menuByKey['sales']['children'], 'label'));

        // موديول المشتريات (8)
        $expectedPurchases = [
            'طلبية الشراء', 'قائمة المشتريات', 'أضف مشتريات', 'قائمة مرتجع المشتريات', 'تقرير العناصر',
            'تقرير مشتريات المنتجات', 'تقرير مرتجع المنتجات', 'تقرير المشتريات'
        ];
        $this->assertSame($expectedPurchases, array_column($menuByKey['purchases']['children'], 'label'));

        // المخازن (10)
        $expectedInventory = [
            'تقرير جرد بسعر التكلفة', 'تقرير جرد بسعر البيع', 'تقرير جرد بدون أسعار', 'ملخص تقرير المخزون',
            'أذن صرف', 'أذن إضافة', 'قائمة تحويلات المخزون', 'إضافة تحويل مخزون',
            'قائمة المخزون التالف', 'أضف تالف'
        ];
        $this->assertSame($expectedInventory, array_column($menuByKey['inventory']['children'], 'label'));

        // إدارة المستخدمين (3)
        $expectedUsers = ['المستخدمين', 'الصلاحيات', 'مندوب'];
        $this->assertSame($expectedUsers, array_column($menuByKey['users']['children'], 'label'));

        // جهات الاتصال (5)
        $expectedContacts = ['الموردين', 'العملاء', 'مجموعات العملاء', 'تقرير الزيارات القادمة', 'استيراد جهات الاتصال'];
        $this->assertSame($expectedContacts, array_column($menuByKey['contacts']['children'], 'label'));

        // المنتجات (13)
        $expectedProducts = [
            'قائمة المنتجات', 'أضف منتجاً', 'تحديث سعر المنتج', 'طباعة الملصقات', 'التباينات',
            'استيراد المنتجات', 'استيراد المخزون الافتتاحي', 'أضف بضاعة أول المدة',
            'مجموعة أسعار البيع', 'الوحدات', 'الأصناف', 'العلامات التجارية', 'الضمانات'
        ];
        $this->assertSame($expectedProducts, array_column($menuByKey['products']['children'], 'label'));

        // المصاريف (3)
        $expectedExpenses = ['قائمة المصاريف', 'إضافة المصاريف', 'فئات المصاريف'];
        $this->assertSame($expectedExpenses, array_column($menuByKey['expenses']['children'], 'label'));

        // صرف بضاعة على مراكز التكلفة (3)
        $expectedStockIssue = ['قائمة صرف البضاعة', 'إضافة صرف بضاعة', 'ربط الحسابات'];
        $this->assertSame($expectedStockIssue, array_column($menuByKey['stock_issue_cost_centers']['children'], 'label'));

        // الحسابات (5)
        $expectedAccounts = ['قائمة الحسابات', 'الميزانية', 'ميزان المراجعة', 'التدفق النقدي', 'الفواتير المحصلة'];
        $this->assertSame($expectedAccounts, array_column($menuByKey['accounts']['children'], 'label'));

        // التقارير (18)
        $expectedReports = [
            'تقرير الربح / الخسارة', 'الربحية بالعملاء', 'تقرير الضرائب', 'تقرير الموردين والعملاء',
            'تقرير مجموعات العملاء', 'تقرير المخزون', 'تتبع السريال', 'تقرير أرباح السريالات',
            'تقرير المخزون التالف', 'المنتجات الشائعة', 'تقرير المصاريف', 'تقرير المندوبية',
            'تقرير مندوب المبيعات', 'ملخص تقرير المبيعات', 'صافي المبيعات والمرجوعات',
            'صافي مبيعات العملاء', 'قائمة الأسعار', 'سجل النشاطات'
        ];
        $this->assertSame($expectedReports, array_column($menuByKey['reports']['children'], 'label'));

        // إعدادات (9)
        $expectedSettings = [
            'إعدادات الشركة', 'فروع النشاط', 'إعدادات الفواتير', 'شركات الشحن', 'العملات وأسعار الصرف',
            'إعدادات الباركوود', 'طابعات الإيصالات', 'معدلات الضرائب', 'اشتراك'
        ];
        $this->assertSame($expectedSettings, array_column($menuByKey['settings']['children'], 'label'));

        // الحسابات العامة (13)
        $expectedGeneralAccounts = [
            'تقرير الشيكات', 'إنشاء شيك صادر', 'إنشاء شيك وارد', 'حركة الشيكات', 'تقرير حركة الشيكات',
            'السندات', 'إنشاء سند صرف نقدي', 'إنشاء سند استلام نقدي', 'كشف حركة الخزينة',
            'التحويلات البنكية', 'إنشاء إيداع بنكي', 'إنشاء سحب بنكي', 'كشف حركة البنك'
        ];
        $this->assertSame($expectedGeneralAccounts, array_column($menuByKey['general_accounts']['children'], 'label'));
    }

    /**
     * اختبار 4: التحقق من عدم وجود أي key مكرر أو href مكرر في كامل شجرة القائمة
     */
    public function test_no_duplicate_keys_and_no_duplicate_hrefs(): void
    {
        $menu = $this->getMenuConfig();

        $allKeys = [];
        $allHrefs = [];
        $allPermissions = [];

        foreach ($menu as $item) {
            $allKeys[] = $item['key'];
            $allHrefs[] = $item['href'];
            $allPermissions[] = $item['permission'];

            foreach ($item['children'] ?? [] as $child) {
                $allKeys[] = $child['key'];
                $allHrefs[] = $child['href'];
                $allPermissions[] = $child['permission'];

                // التأكد من صيغة الصلاحية module.item.view
                $this->assertMatchesRegularExpression('/^[a-z_]+\.[a-z_]+\.view$/', $child['permission'], "صيغة الصلاحية غير مطابقة: {$child['permission']}");
            }
        }

        $this->assertSame(count($allKeys), count(array_unique($allKeys)), 'يوجد مفتاح (key) مكرر في القائمة');
        $this->assertSame(count($allHrefs), count(array_unique($allHrefs)), 'يوجد رابط (href) مكرر في القائمة');
        $this->assertSame(count($allPermissions), count(array_unique($allPermissions)), 'يوجد تصريح (permission) مكرر في القائمة');
    }

    /**
     * اختبار 5: التحقق من أن الوحدات المعطلة وبند اشتراك تحمل enabled: false
     */
    public function test_disabled_modules_and_items_have_enabled_false(): void
    {
        $menu = $this->getMenuConfig();
        $menuByKey = array_column($menu, null, 'key');

        $disabledKeys = [
            'manufacturing',
            'maintenance',
            'contracting',
            'crm',
            'hr',
            'cost_centers',
            'stock_issue_cost_centers'
        ];

        foreach ($disabledKeys as $key) {
            $this->assertFalse($menuByKey[$key]['enabled'], "الوحدة {$key} يجب أن تكون معطلة (enabled: false)");
        }

        // جميع عناصر صرف بضاعة على مراكز التكلفة يجب أن تكون enabled: false
        foreach ($menuByKey['stock_issue_cost_centers']['children'] as $child) {
            $this->assertFalse($child['enabled'], "العنصر الفرعي {$child['key']} يجب أن يكون معطلاً");
        }

        // بند اشتراك في الإعدادات يجب أن يكون معطلاً
        $settingsChildren = array_column($menuByKey['settings']['children'], null, 'key');
        $this->assertFalse($settingsChildren['settings_subscription']['enabled'], 'بند اشتراك في الإعدادات يجب أن يكون enabled: false');
    }

    /**
     * اختبار 6: التحقق من أن كل href مفعّل له مسار route يعمل ويعيد رمز 200
     */
    public function test_all_enabled_hrefs_return_http_200_for_admin(): void
    {
        // تسجيل Gate::before أولاً ثم إنشاء المدير
        $this->setUpAdminGate();
        $admin = $this->createAdminUser();

        $menu = $this->getMenuConfig();

        $enabledHrefs = [];

        foreach ($menu as $item) {
            if ($item['enabled']) {
                $enabledHrefs[] = $item['href'];

                foreach ($item['children'] ?? [] as $child) {
                    if ($child['enabled']) {
                        $enabledHrefs[] = $child['href'];
                    }
                }
            }
        }

        $this->assertGreaterThan(50, count($enabledHrefs), 'يجب أن يكون هناك أكثر من 50 مسار مفعّل');

        foreach ($enabledHrefs as $href) {
            $response = $this->actingAs($admin)->get($href);
            $response->assertStatus(200);
        }
    }

    /**
     * اختبار 7: التحقق من أن المسارات المعطلة لا تفتح وتُعيد 404
     */
    public function test_disabled_modules_and_items_return_404(): void
    {
        $disabledPaths = [
            '/manufacturing',
            '/maintenance',
            '/cost-centers',
            '/cost-centers/stock-issue',
            '/cost-centers/stock-issue/list',
            '/cost-centers/stock-issue/create',
            '/cost-centers/stock-issue/account-linking',
            '/contracting',
            '/crm',
            '/hr',
            '/settings/subscription'
        ];

        foreach ($disabledPaths as $path) {
            $response = $this->get($path);
            $response->assertStatus(404);
        }
    }

    /**
     * اختبار 8: اختبار فلترة القائمة بالصلاحيات عبر دالة filterMenuByPermissions
     */
    public function test_menu_permission_filtering_logic(): void
    {
        $command = 'node -e "import(\'./resources/js/config/menu.config.js\').then(m => { const admin = m.filterMenuByPermissions(m.menuConfig, [\'*\']); const salesOnly = m.filterMenuByPermissions(m.menuConfig, [\'sales.view\', \'sales.all.view\']); console.log(JSON.stringify({ adminTopLevelCount: admin.length, salesOnlyTopLevelCount: salesOnly.length, salesOnlyChildrenCount: salesOnly[0]?.children?.length || 0 })); })"';

        $output = shell_exec($command);
        $result = json_decode(trim($output), true);

        $this->assertIsArray($result, 'مخرجات تصفية الصلاحيات يجب أن تكون صالحة');

        // الوحدات المفعّلة هي 16 وحدة (23 - 7 معطلة)
        $this->assertSame(16, $result['adminTopLevelCount'], 'مدير النظام يجب أن يرى الـ 16 موديول المفعّلة فقط');

        // مستخدم بصلاحية مبيعات فقط
        $this->assertSame(1, $result['salesOnlyTopLevelCount'], 'المستخدم المقيد بالمبيعات يرى موديول المبيعات فقط');
        $this->assertSame(1, $result['salesOnlyChildrenCount'], 'المستخدم المقيد يرى فقط العنصر الفرعي المصرح له به');
    }
}
