<?php

namespace Database\Seeders;

use App\Models\Account;
use Illuminate\Database\Seeder;

class ChartOfAccountsSeeder extends Seeder
{
    public function run(): void
    {
        $accounts = [
            // 1. الأصول
            [
                'code' => '1', 'name' => 'الأصول', 'name_ar' => 'الأصول', 'name_en' => 'Assets',
                'type' => 'asset', 'nature' => 'debit', 'level' => 1, 'is_parent' => true, 'is_header' => true, 'is_system' => true,
                'children' => [
                    [
                        'code' => '11', 'name' => 'الأصول المتداولة', 'name_ar' => 'الأصول المتداولة', 'name_en' => 'Current Assets',
                        'type' => 'asset', 'nature' => 'debit', 'level' => 2, 'is_parent' => true, 'is_header' => true, 'is_system' => true,
                        'children' => [
                            [
                                'code' => '111', 'name' => 'النقد وما في حكمه', 'name_ar' => 'النقد وما في حكمه', 'name_en' => 'Cash & Equivalents',
                                'type' => 'asset', 'nature' => 'debit', 'level' => 3, 'is_parent' => true, 'is_header' => true, 'is_system' => true,
                                'children' => [
                                    ['code' => '1111', 'name' => 'الصندوق الرئيسي (cash)', 'name_ar' => 'الصندوق الرئيسي', 'name_en' => 'Main Cash Box', 'type' => 'asset', 'nature' => 'debit', 'level' => 4, 'is_parent' => false, 'is_header' => false, 'is_system' => true],
                                    ['code' => '1121', 'name' => 'البنك الرئيسي (bank)', 'name_ar' => 'البنك الرئيسي', 'name_en' => 'Main Bank', 'type' => 'asset', 'nature' => 'debit', 'level' => 4, 'is_parent' => false, 'is_header' => false, 'is_system' => true],
                                    ['code' => '1131', 'name' => 'شبكة الدفع (network)', 'name_ar' => 'شبكة الدفع', 'name_en' => 'Payment Network', 'type' => 'asset', 'nature' => 'debit', 'level' => 4, 'is_parent' => false, 'is_header' => false, 'is_system' => true],
                                ]
                            ],
                            ['code' => '1130', 'name' => 'الذمم المدينة AR', 'name_ar' => 'الذمم المدينة AR', 'name_en' => 'Accounts Receivable', 'type' => 'asset', 'nature' => 'debit', 'level' => 3, 'is_parent' => false, 'is_header' => false, 'is_system' => true],
                            ['code' => '1140', 'name' => 'المخزون', 'name_ar' => 'المخزون', 'name_en' => 'Inventory', 'type' => 'asset', 'nature' => 'debit', 'level' => 3, 'is_parent' => false, 'is_header' => false, 'is_system' => true],
                            ['code' => '1150', 'name' => 'ضريبة مدخلات', 'name_ar' => 'ضريبة مدخلات', 'name_en' => 'Input VAT', 'type' => 'asset', 'nature' => 'debit', 'level' => 3, 'is_parent' => false, 'is_header' => false, 'is_system' => true],
                            ['code' => '1160', 'name' => 'أوراق قبض (شيكات واردة)', 'name_ar' => 'أوراق قبض', 'name_en' => 'Notes Receivable', 'type' => 'asset', 'nature' => 'debit', 'level' => 3, 'is_parent' => false, 'is_header' => false, 'is_system' => true],
                        ]
                    ],
                    [
                        'code' => '12', 'name' => 'الأصول غير المتداولة (الثابتة)', 'name_ar' => 'الأصول غير المتداولة', 'name_en' => 'Non-Current Assets',
                        'type' => 'asset', 'nature' => 'debit', 'level' => 2, 'is_parent' => true, 'is_header' => true, 'is_system' => false,
                        'children' => [
                            ['code' => '1210', 'name' => 'أجهزة ومعدات إلكترونية', 'name_ar' => 'أجهزة ومعدات إلكترونية', 'name_en' => 'IT & Electronic Equipment', 'type' => 'asset', 'nature' => 'debit', 'level' => 3, 'is_parent' => false, 'is_header' => false, 'is_system' => false],
                            ['code' => '1220', 'name' => 'ديكورات وتحسينات المعرض', 'name_ar' => 'ديكورات المعرض', 'name_en' => 'Showroom Decor', 'type' => 'asset', 'nature' => 'debit', 'level' => 3, 'is_parent' => false, 'is_header' => false, 'is_system' => false],
                        ]
                    ]
                ]
            ],

            // 2. الخصوم
            [
                'code' => '2', 'name' => 'الخصوم والالتزامات', 'name_ar' => 'الخصوم والالتزامات', 'name_en' => 'Liabilities',
                'type' => 'liability', 'nature' => 'credit', 'level' => 1, 'is_parent' => true, 'is_header' => true, 'is_system' => true,
                'children' => [
                    [
                        'code' => '21', 'name' => 'الخصوم المتداولة', 'name_ar' => 'الخصوم المتداولة', 'name_en' => 'Current Liabilities',
                        'type' => 'liability', 'nature' => 'credit', 'level' => 2, 'is_parent' => true, 'is_header' => true, 'is_system' => true,
                        'children' => [
                            ['code' => '2100', 'name' => 'الذمم الدائنة AP', 'name_ar' => 'الذمم الدائنة AP', 'name_en' => 'Accounts Payable', 'type' => 'liability', 'nature' => 'credit', 'level' => 3, 'is_parent' => false, 'is_header' => false, 'is_system' => true],
                            ['code' => '2120', 'name' => 'أوراق دفع (شيكات صادرة)', 'name_ar' => 'أوراق دفع', 'name_en' => 'Notes Payable', 'type' => 'liability', 'nature' => 'credit', 'level' => 3, 'is_parent' => false, 'is_header' => false, 'is_system' => true],
                            ['code' => '2200', 'name' => 'ضريبة مخرجات مستحقة', 'name_ar' => 'ضريبة مخرجات مستحقة', 'name_en' => 'Output VAT Payable', 'type' => 'liability', 'nature' => 'credit', 'level' => 3, 'is_parent' => false, 'is_header' => false, 'is_system' => true],
                        ]
                    ],
                    [
                        'code' => '22', 'name' => 'الخصوم غير المتداولة', 'name_ar' => 'الخصوم غير المتداولة', 'name_en' => 'Non-Current Liabilities',
                        'type' => 'liability', 'nature' => 'credit', 'level' => 2, 'is_parent' => true, 'is_header' => true, 'is_system' => false,
                        'children' => [
                            ['code' => '2210', 'name' => 'قروض وتسهيلات بنكية', 'name_ar' => 'قروض وتسهيلات بنكية', 'name_en' => 'Bank Loans', 'type' => 'liability', 'nature' => 'credit', 'level' => 3, 'is_parent' => false, 'is_header' => false, 'is_system' => false],
                        ]
                    ]
                ]
            ],

            // 3. حقوق الملكية
            [
                'code' => '3', 'name' => 'حقوق الملكية', 'name_ar' => 'حقوق الملكية', 'name_en' => 'Equity',
                'type' => 'equity', 'nature' => 'credit', 'level' => 1, 'is_parent' => true, 'is_header' => true, 'is_system' => true,
                'children' => [
                    ['code' => '3100', 'name' => 'رأس المال المدفوع', 'name_ar' => 'رأس المال المدفوع', 'name_en' => 'Capital', 'type' => 'equity', 'nature' => 'credit', 'level' => 2, 'is_parent' => false, 'is_header' => false, 'is_system' => false],
                    ['code' => '3200', 'name' => 'الأرباح المبقاة', 'name_ar' => 'الأرباح المبقاة', 'name_en' => 'Retained Earnings', 'type' => 'equity', 'nature' => 'credit', 'level' => 2, 'is_parent' => false, 'is_header' => false, 'is_system' => false],
                    ['code' => '3500', 'name' => 'أرصدة افتتاحية', 'name_ar' => 'أرصدة افتتاحية', 'name_en' => 'Opening Balances Equity', 'type' => 'equity', 'nature' => 'credit', 'level' => 2, 'is_parent' => false, 'is_header' => false, 'is_system' => true],
                ]
            ],

            // 4. الإيرادات
            [
                'code' => '4', 'name' => 'الإيرادات', 'name_ar' => 'الإيرادات', 'name_en' => 'Revenues',
                'type' => 'revenue', 'nature' => 'credit', 'level' => 1, 'is_parent' => true, 'is_header' => true, 'is_system' => true,
                'children' => [
                    ['code' => '4100', 'name' => 'إيرادات المبيعات', 'name_ar' => 'إيرادات المبيعات', 'name_en' => 'Sales Revenue', 'type' => 'revenue', 'nature' => 'credit', 'level' => 2, 'is_parent' => false, 'is_header' => false, 'is_system' => true],
                    ['code' => '4200', 'name' => 'إيرادات أخرى', 'name_ar' => 'إيرادات أخرى', 'name_en' => 'Other Revenue', 'type' => 'revenue', 'nature' => 'credit', 'level' => 2, 'is_parent' => false, 'is_header' => false, 'is_system' => true],
                ]
            ],

            // 5. المصروفات
            [
                'code' => '5', 'name' => 'المصروفات والتكاليف', 'name_ar' => 'المصروفات والتكاليف', 'name_en' => 'Expenses',
                'type' => 'expense', 'nature' => 'debit', 'level' => 1, 'is_parent' => true, 'is_header' => true, 'is_system' => true,
                'children' => [
                    ['code' => '5100', 'name' => 'تكلفة البضاعة المباعة (COGS)', 'name_ar' => 'تكلفة البضاعة المباعة', 'name_en' => 'Cost of Goods Sold', 'type' => 'expense', 'nature' => 'debit', 'level' => 2, 'is_parent' => false, 'is_header' => false, 'is_system' => true],
                    [
                        'code' => '5200', 'name' => 'مصاريف تشغيلية', 'name_ar' => 'مصاريف تشغيلية', 'name_en' => 'Operating Expenses',
                        'type' => 'expense', 'nature' => 'debit', 'level' => 2, 'is_parent' => true, 'is_header' => true, 'is_system' => false,
                        'children' => [
                            ['code' => '5210', 'name' => 'إيجار المقرات والفروع', 'name_ar' => 'إيجار المقرات والفروع', 'name_en' => 'Rent Expense', 'type' => 'expense', 'nature' => 'debit', 'level' => 3, 'is_parent' => false, 'is_header' => false, 'is_system' => false],
                            ['code' => '5220', 'name' => 'رواتب وأجور الموظفين', 'name_ar' => 'رواتب وأجور الموظفين', 'name_en' => 'Salaries Expense', 'type' => 'expense', 'nature' => 'debit', 'level' => 3, 'is_parent' => false, 'is_header' => false, 'is_system' => false],
                            ['code' => '5230', 'name' => 'فواتير المرافق والاتصالات', 'name_ar' => 'فواتير المرافق والاتصالات', 'name_en' => 'Utilities & Comms', 'type' => 'expense', 'nature' => 'debit', 'level' => 3, 'is_parent' => false, 'is_header' => false, 'is_system' => false],
                        ]
                    ],
                    ['code' => '5300', 'name' => 'خسارة مخزون تالف/جرد', 'name_ar' => 'خسارة مخزون تالف/جرد', 'name_en' => 'Damaged Inventory Loss', 'type' => 'expense', 'nature' => 'debit', 'level' => 2, 'is_parent' => false, 'is_header' => false, 'is_system' => true],
                    ['code' => '5400', 'name' => 'مصروف شيكات مرتجعة', 'name_ar' => 'مصروف شيكات مرتجعة', 'name_en' => 'Bounced Checks Expense', 'type' => 'expense', 'nature' => 'debit', 'level' => 2, 'is_parent' => false, 'is_header' => false, 'is_system' => true],
                ]
            ],
        ];

        $this->seedAccountsTree($accounts, null);
    }

    private function seedAccountsTree(array $items, ?int $parentId): void
    {
        foreach ($items as $item) {
            $children = $item['children'] ?? [];
            unset($item['children']);

            $item['parent_id'] = $parentId;
            $item['is_active'] = true;

            $account = Account::firstOrCreate(['code' => $item['code']], $item);

            if (!empty($children)) {
                $this->seedAccountsTree($children, $account->id);
            }
        }
    }
}
