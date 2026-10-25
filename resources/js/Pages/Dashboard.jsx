import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '../Layouts/AppLayout';
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    Wallet,
    ArrowUpRight,
    ArrowDownLeft,
    Clock,
    FileText,
    Users,
    ShoppingCart,
    ShoppingBag,
    Warehouse,
    Package,
    BookOpen,
    Calculator,
    AlertCircle,
    ChevronLeft,
    PlusCircle
} from 'lucide-react';

export default function Dashboard({ stats, recentAccounts, modules }) {
    // إحصائيات فعلية من النظام (أصفار في حال انعدام الحركات)
    const kpis = stats || {
        totalRevenue: '0.00',
        totalExpenses: '0.00',
        netProfit: '0.00',
        cashBankBalance: '0.00',
        activeAccountsCount: 0,
        totalJournalsCount: 0
    };

    return (
        <AppLayout title="لوحة التحكم الرئيسية">
            <Head title="الرئيسية" />

            {/* ترويسة الصفحة مع التاريخ وأزرار الإجراءات السريعة */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-2xl font-black text-white flex items-center gap-2">
                        <span>لوحة التحكم ومؤشرات الأداء المحاسبي</span>
                    </h2>
                    <p className="text-sm text-slate-400 mt-1">
                        نظرة شاملة ومباشرة على الوضع المالي، الحسابات، والعمليات التشغيلية للنظام
                    </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <Link
                        href="/accounts"
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition"
                    >
                        <BookOpen size={18} />
                        <span>دليل الحسابات</span>
                    </Link>
                    <Link
                        href="/accounting/journals"
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-sm transition"
                    >
                        <PlusCircle size={18} />
                        <span>إضافة قيد يومي</span>
                    </Link>
                </div>
            </div>

            {/* بطاقات المؤشرات المالية الرئيسية (Financial KPI Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                {/* الإيرادات */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-900/80 border border-slate-800 rounded-2xl p-5 relative overflow-hidden group hover:border-emerald-500/50 transition">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-bold text-slate-400">إجمالي الإيرادات</span>
                        <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                            <TrendingUp size={20} />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-white">{kpis.totalRevenue} <span className="text-sm font-medium text-slate-400">ر.س</span></div>
                    <div className="flex items-center gap-1.5 mt-2 text-sm font-bold text-slate-400">
                        <span>إجمالي المبيعات المرحلة</span>
                    </div>
                </div>

                {/* المصروفات */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-900/80 border border-slate-800 rounded-2xl p-5 relative overflow-hidden group hover:border-rose-500/50 transition">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-bold text-slate-400">إجمالي المصروفات</span>
                        <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400">
                            <TrendingDown size={20} />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-white">{kpis.totalExpenses} <span className="text-sm font-medium text-slate-400">ر.س</span></div>
                    <div className="flex items-center gap-1.5 mt-2 text-sm font-bold text-slate-400">
                        <span>إجمالي المصروفات التشغيلية</span>
                    </div>
                </div>

                {/* صافي الربح */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-900/80 border border-slate-800 rounded-2xl p-5 relative overflow-hidden group hover:border-blue-500/50 transition">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-bold text-slate-400">صافي الربح التقديري</span>
                        <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
                            <DollarSign size={20} />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-white">{kpis.netProfit} <span className="text-sm font-medium text-slate-400">ر.س</span></div>
                    <div className="flex items-center gap-1.5 mt-2 text-sm font-bold text-slate-400">
                        <span>الإيرادات - المصروفات</span>
                    </div>
                </div>

                {/* النقدية وما في حكمها */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-900/80 border border-slate-800 rounded-2xl p-5 relative overflow-hidden group hover:border-amber-500/50 transition">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-bold text-slate-400">رصيد النقدية والبنوك</span>
                        <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
                            <Wallet size={20} />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-white">{kpis.cashBankBalance} <span className="text-sm font-medium text-slate-400">ر.س</span></div>
                    <div className="flex items-center gap-1.5 mt-2 text-sm font-bold text-slate-400">
                        <span>الخزينة + الحسابات البنكية</span>
                    </div>
                </div>
            </div>

            {/* شبكة أقسام النظام الـ 23 للوصول السريع */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                        <span>الموديولات التشغيلية (الوصول السريع)</span>
                    </h3>
                    <span className="text-sm text-slate-400">23 موديول متكامل</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {[
                        { title: 'المبيعات', icon: ShoppingCart, link: '/sales', color: 'from-blue-600 to-blue-700' },
                        { title: 'المشتريات', icon: ShoppingBag, link: '/purchases', color: 'from-indigo-600 to-indigo-700' },
                        { title: 'المخازن', icon: Warehouse, link: '/inventory', color: 'from-emerald-600 to-emerald-700' },
                        { title: 'الحسابات والشجرة', icon: BookOpen, link: '/accounts', color: 'from-sky-600 to-sky-700' },
                        { title: 'القيود والمحاسبة', icon: Calculator, link: '/accounting/journals', color: 'from-violet-600 to-violet-700' },
                        { title: 'المنتجات', icon: Package, link: '/products', color: 'from-amber-600 to-amber-700' },
                    ].map((mod, i) => {
                        const Icon = mod.icon;
                        return (
                            <Link
                                key={i}
                                href={mod.link}
                                className="group p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-800/80 transition flex flex-col items-center text-center text-slate-200"
                            >
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${mod.color} flex items-center justify-center text-white mb-3 shadow-lg shadow-blue-500/10 group-hover:scale-110 transition duration-200`}>
                                    <Icon size={22} />
                                </div>
                                <span className="text-sm font-bold text-slate-200 group-hover:text-white">{mod.title}</span>
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* قسم تفاصيل الحسابات وحالة النظام */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* بطاقة الحسابات */}
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h3 className="text-base font-bold text-white">دليل الحسابات النشطة</h3>
                            <p className="text-sm text-slate-400 mt-0.5">الحسابات المعرفة في شجرة الحسابات</p>
                        </div>
                        <Link href="/accounts" className="text-sm font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1">
                            <span>عرض الدليل كاملاً</span>
                            <ChevronLeft size={16} />
                        </Link>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-right text-sm">
                            <thead className="bg-slate-950/70 text-slate-400 uppercase font-bold border-b border-slate-800">
                                <tr>
                                    <th className="py-3 px-4">كود الحساب</th>
                                    <th className="py-3 px-4">اسم الحساب</th>
                                    <th className="py-3 px-4">النوع</th>
                                    <th className="py-3 px-4">طبيعة الحساب</th>
                                    <th className="py-3 px-4 text-left">الحالة</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                                {(recentAccounts || []).map((acc) => (
                                    <tr key={acc.id} className="hover:bg-slate-800/40 transition">
                                        <td className="py-3 px-4 font-mono font-bold text-blue-400">{acc.code}</td>
                                        <td className="py-3 px-4 font-bold text-white">{acc.name || acc.name_ar}</td>
                                        <td className="py-3 px-4">
                                            <span className="px-2.5 py-1 rounded-full text-sm font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                                                {acc.type === 'asset' && 'أصول'}
                                                {acc.type === 'liability' && 'خصوم'}
                                                {acc.type === 'equity' && 'حقوق ملكية'}
                                                {acc.type === 'revenue' && 'إيرادات'}
                                                {acc.type === 'expense' && 'مصروفات'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`text-sm font-bold ${acc.nature === 'debit' ? 'text-emerald-400' : 'text-blue-400'}`}>
                                                {acc.nature === 'debit' ? 'مدين' : 'دائن'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-left">
                                            <span className="px-2 py-0.5 rounded text-sm text-emerald-400 bg-emerald-950/50 border border-emerald-800/40 font-medium">نشط</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* بطاقة التنبيهات وإرشادات العمل المحاسبي */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
                    <div>
                        <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                            <AlertCircle size={20} className="text-amber-400" />
                            <span>تنبيهات وتوجيهات محاسبية</span>
                        </h3>
                        <p className="text-sm text-slate-400 mb-4">
                            متابعة دقة البيانات وسلامة القيود المحاسبية
                        </p>

                        <div className="space-y-3">
                            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start gap-3">
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 mt-1.5 shrink-0"></div>
                                <div>
                                    <h4 className="text-sm font-bold text-slate-200">دليل الحسابات المعتمد</h4>
                                    <p className="text-sm text-slate-400 mt-0.5">تم تهيئة شجرة الحسابات الخماسية المعتمدة وفق وثيقة التصميم v3.</p>
                                </div>
                            </div>

                            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start gap-3">
                                <div className="w-2.5 h-2.5 rounded-full bg-blue-400 mt-1.5 shrink-0"></div>
                                <div>
                                    <h4 className="text-sm font-bold text-slate-200">الضريبة المضافة والزكاة</h4>
                                    <p className="text-sm text-slate-400 mt-0.5">تم تجهيز ضريبة القيمة المضافة 15% وحسابات المدخلات والمخرجات.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-800">
                        <Link
                            href="/accounts"
                            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm transition"
                        >
                            <span>استعراض شجرة الحسابات</span>
                            <ChevronLeft size={18} />
                        </Link>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
