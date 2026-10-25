import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    FileSpreadsheet,
    Search,
    Printer,
    ShoppingBag,
    Calendar,
    UserCheck,
    X,
} from 'lucide-react';

export default function ItemsReport({
    items,
    filters = {},
    metrics = {},
    suppliers = [],
}) {
    const [search, setSearch] = useState(filters.search || '');
    const [contactId, setContactId] = useState(filters.contact_id || '');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');

    const handleFilter = (e) => {
        if (e) e.preventDefault();
        router.get('/purchases/reports/items', {
            search,
            contact_id: contactId,
            date_from: dateFrom,
            date_to: dateTo,
        }, { preserveState: true });
    };

    const handleReset = () => {
        setSearch('');
        setContactId('');
        setDateFrom('');
        setDateTo('');
        router.get('/purchases/reports/items', {}, { preserveState: true });
    };

    const formatCurrency = (val) => {
        return Number(val || 0).toLocaleString('ar-SA', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }) + ' ر.س';
    };

    return (
        <AppLayout>
            <Head title="تقرير عناصر المشتريات" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
                            <FileSpreadsheet className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white tracking-wide">تقرير عناصر المشتريات</h1>
                            <p className="text-xs text-slate-400">تحليل تفصيلي لجميع بنود وأسطر فواتير المشتريات والكميات وتكاليف الشراء</p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition"
                    >
                        <Printer className="w-4 h-4 text-sky-400" />
                        طباعة التقرير
                    </button>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 print:hidden">
                    <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-4 shadow-sm">
                        <div className="text-xs text-slate-400 mb-1">إجمالي الكميات المشتراة</div>
                        <div className="text-xl font-bold text-white font-mono">{Number(metrics.total_qty || 0).toLocaleString()}</div>
                    </div>
                    <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-4 shadow-sm">
                        <div className="text-xs text-slate-400 mb-1">إجمالي قيمة البنود</div>
                        <div className="text-xl font-bold text-emerald-400 font-mono">{formatCurrency(metrics.total_cost)}</div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-4 shadow-sm print:hidden">
                    <form onSubmit={handleFilter} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                        <div className="md:col-span-2">
                            <div className="relative">
                                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="اسم الصنف، SKU..."
                                    className="w-full pl-3 pr-9 py-2 bg-slate-950/50 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                                />
                            </div>
                        </div>

                        <div>
                            <select
                                value={contactId}
                                onChange={(e) => setContactId(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-950/50 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50"
                            >
                                <option value="">كل الموردين</option>
                                {suppliers.map((s) => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-950/50 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50"
                            />
                        </div>

                        <div className="flex items-center gap-1.5">
                            <button
                                type="submit"
                                className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-medium transition"
                            >
                                بحث
                            </button>
                            <button
                                type="button"
                                onClick={handleReset}
                                className="py-2 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs transition"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </form>
                </div>

                {/* Table */}
                <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl overflow-hidden shadow-sm print:border-none print:bg-white print:text-black">
                    <div className="overflow-x-auto">
                        <table className="w-full text-right text-xs">
                            <thead className="bg-slate-950/60 print:bg-gray-100 border-b border-slate-800/80 print:border-gray-200 text-slate-400 print:text-gray-700 font-medium">
                                <tr>
                                    <th className="py-3 px-4">رقم الفاتورة</th>
                                    <th className="py-3 px-4">التاريخ</th>
                                    <th className="py-3 px-4">المورد</th>
                                    <th className="py-3 px-4">المنتج</th>
                                    <th className="py-3 px-4">التصنيف</th>
                                    <th className="py-3 px-4 text-center">الكمية</th>
                                    <th className="py-3 px-4">سعر الوحدة</th>
                                    <th className="py-3 px-4 text-left">الإجمالي</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50 print:divide-gray-200 text-slate-300 print:text-gray-800">
                                {items.data && items.data.length > 0 ? (
                                    items.data.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-800/30 transition">
                                            <td className="py-3 px-4 font-semibold text-emerald-400 print:text-emerald-700 font-mono">
                                                {item.purchase_order?.order_number}
                                            </td>
                                            <td className="py-3 px-4 text-slate-400 print:text-gray-600">
                                                {item.purchase_order?.date}
                                            </td>
                                            <td className="py-3 px-4 font-medium text-white print:text-black">
                                                {item.purchase_order?.contact?.name || 'مورد عام'}
                                            </td>
                                            <td className="py-3 px-4 font-medium text-white print:text-black">
                                                {item.product?.name}
                                            </td>
                                            <td className="py-3 px-4 text-slate-400 print:text-gray-600">
                                                {item.product?.category?.name || '—'}
                                            </td>
                                            <td className="py-3 px-4 text-center font-mono font-bold">
                                                {Number(item.quantity)} {item.unit?.name || ''}
                                            </td>
                                            <td className="py-3 px-4 font-mono">{formatCurrency(item.unit_cost)}</td>
                                            <td className="py-3 px-4 text-left font-bold text-white print:text-black font-mono">
                                                {formatCurrency(item.total_amount)}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={8} className="py-12 text-center text-slate-500">
                                            لا توجد عناصر مشتريات مطابقة للبحث
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
