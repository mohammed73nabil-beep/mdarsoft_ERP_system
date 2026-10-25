import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    CornerUpLeft,
    Plus,
    Search,
    Calendar,
    Building2,
    Warehouse,
    UserCheck,
    Eye,
    Receipt,
    FileText,
    ShoppingBag,
    X,
} from 'lucide-react';

export default function PurchaseReturnsIndex({
    returns,
    filters = {},
    metrics = {},
    branches = [],
    warehouses = [],
    suppliers = [],
}) {
    const [search, setSearch] = useState(filters.search || '');
    const [branchId, setBranchId] = useState(filters.branch_id || '');
    const [warehouseId, setWarehouseId] = useState(filters.warehouse_id || '');
    const [contactId, setContactId] = useState(filters.contact_id || '');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');

    const handleFilter = (e) => {
        if (e) e.preventDefault();
        router.get(
            '/purchases/returns',
            {
                search,
                branch_id: branchId,
                warehouse_id: warehouseId,
                contact_id: contactId,
                date_from: dateFrom,
                date_to: dateTo,
            },
            { preserveState: true }
        );
    };

    const handleReset = () => {
        setSearch('');
        setBranchId('');
        setWarehouseId('');
        setContactId('');
        setDateFrom('');
        setDateTo('');
        router.get('/purchases/returns', {}, { preserveState: true });
    };

    const formatCurrency = (val) => {
        return Number(val || 0).toLocaleString('ar-SA', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }) + ' ر.س';
    };

    return (
        <AppLayout>
            <Head title="قائمة مرتجع المشتريات" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-rose-500/10 rounded-xl border border-rose-500/20 text-rose-400">
                            <CornerUpLeft className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white tracking-wide">قائمة مرتجع المشتريات</h1>
                            <p className="text-xs text-slate-400">إدارة البضاعة المسترجعة للموردين وخفض رصيد المديونية</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <Link
                            href="/purchases/list"
                            className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition"
                        >
                            <ShoppingBag className="w-4 h-4 text-emerald-400" />
                            فواتير المشتريات
                        </Link>
                        <Link
                            href="/purchases/returns/create"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-rose-500/20 transition"
                        >
                            <Plus className="w-4 h-4" />
                            إنشاء مرتجع مشتريات
                        </Link>
                    </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-4 shadow-sm">
                        <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                            <span>إجمالي المرتجعات</span>
                            <CornerUpLeft className="w-4 h-4 text-rose-400" />
                        </div>
                        <div className="text-xl font-bold text-rose-400">
                            {formatCurrency(metrics.total_returns)}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1">
                            مسترد من حسابات الموردين
                        </div>
                    </div>

                    <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-4 shadow-sm">
                        <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                            <span>الضريبة المستردة</span>
                            <Receipt className="w-4 h-4 text-amber-400" />
                        </div>
                        <div className="text-xl font-bold text-amber-400">
                            {formatCurrency(metrics.total_tax)}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1">
                            ضريبة القيمة المضافة المخفضة
                        </div>
                    </div>

                    <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-4 shadow-sm">
                        <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                            <span>عدد سندات الإرجاع</span>
                            <FileText className="w-4 h-4 text-indigo-400" />
                        </div>
                        <div className="text-xl font-bold text-white">
                            {returns.total || 0}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1">
                            عمليات إرجاع للموردين
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-4 shadow-sm">
                    <form onSubmit={handleFilter} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                        <div className="lg:col-span-2">
                            <div className="relative">
                                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="رقم المرتجع، اسم المورد..."
                                    className="w-full pl-3 pr-9 py-2 bg-slate-950/50 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500/50 transition"
                                />
                            </div>
                        </div>

                        <div>
                            <select
                                value={contactId}
                                onChange={(e) => setContactId(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-950/50 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-rose-500/50 transition"
                            >
                                <option value="">كل الموردين</option>
                                {suppliers.map((s) => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <select
                                value={warehouseId}
                                onChange={(e) => setWarehouseId(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-950/50 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-rose-500/50 transition"
                            >
                                <option value="">كل المستودعات</option>
                                {warehouses.map((w) => (
                                    <option key={w.id} value={w.id}>{w.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-950/50 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-rose-500/50 transition"
                            />
                        </div>

                        <div>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-950/50 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-rose-500/50 transition"
                            />
                        </div>

                        <div className="flex items-center gap-1.5">
                            <button
                                type="submit"
                                className="flex-1 py-2 px-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-medium transition"
                            >
                                تصفية
                            </button>
                            <button
                                type="button"
                                onClick={handleReset}
                                className="py-2 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs transition"
                                title="إعادة تعيين"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </form>
                </div>

                {/* Table */}
                <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-right text-xs">
                            <thead className="bg-slate-950/60 border-b border-slate-800/80 text-slate-400 font-medium">
                                <tr>
                                    <th className="py-3 px-4">رقم المرتجع</th>
                                    <th className="py-3 px-4">التاريخ</th>
                                    <th className="py-3 px-4">الفاتورة الأصلية</th>
                                    <th className="py-3 px-4">المورد</th>
                                    <th className="py-3 px-4">المستودع</th>
                                    <th className="py-3 px-4 text-center">الأسطر</th>
                                    <th className="py-3 px-4">إجمالي المرتجع</th>
                                    <th className="py-3 px-4">الضريبة</th>
                                    <th className="py-3 px-4 text-center">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50 text-slate-300">
                                {returns.data && returns.data.length > 0 ? (
                                    returns.data.map((ret) => (
                                        <tr key={ret.id} className="hover:bg-slate-800/30 transition">
                                            <td className="py-3 px-4 font-semibold text-rose-400">
                                                <Link href={`/purchases/returns/${ret.id}`} className="hover:underline">
                                                    {ret.return_number}
                                                </Link>
                                            </td>
                                            <td className="py-3 px-4 text-slate-400">{ret.date}</td>
                                            <td className="py-3 px-4 font-mono text-emerald-400">
                                                {ret.original_purchase ? (
                                                    <Link href={`/purchases/${ret.original_purchase.id}`} className="hover:underline">
                                                        {ret.original_purchase.order_number}
                                                    </Link>
                                                ) : '—'}
                                            </td>
                                            <td className="py-3 px-4 font-medium text-white">
                                                {ret.contact?.name || 'مورد عام'}
                                            </td>
                                            <td className="py-3 px-4 text-slate-400">
                                                {ret.warehouse?.name || '—'}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[11px]">
                                                    {ret.lines_count || 0}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 font-bold text-white font-mono">
                                                {formatCurrency(ret.total_amount)}
                                            </td>
                                            <td className="py-3 px-4 text-amber-400 font-mono">
                                                {formatCurrency(ret.tax_amount)}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <Link
                                                    href={`/purchases/returns/${ret.id}`}
                                                    className="p-1.5 inline-flex bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition"
                                                    title="عرض التفاصيل"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={9} className="py-12 text-center text-slate-500">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <CornerUpLeft className="w-8 h-8 text-slate-600" />
                                                <span>لا توجد مرتجعات مشتريات مسجلة</span>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {returns.links && returns.links.length > 3 && (
                        <div className="p-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                            <div>
                                عرض {returns.from || 0} إلى {returns.to || 0} من أصل {returns.total} مرتجع
                            </div>
                            <div className="flex items-center gap-1">
                                {returns.links.map((link, i) => (
                                    <Link
                                        key={i}
                                        href={link.url || '#'}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        className={`px-2.5 py-1 rounded-lg transition ${
                                            link.active
                                                ? 'bg-rose-600 text-white font-medium'
                                                : link.url
                                                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                                : 'text-slate-600 cursor-not-allowed'
                                        }`}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
