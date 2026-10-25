import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    PieChart,
    Search,
    Printer,
    DollarSign,
    CreditCard,
    ShoppingBag,
    Receipt,
    Truck,
    X,
} from 'lucide-react';

export default function PurchasesSummaryReport({
    orders,
    summary = {},
    suppliers = [],
    filters = {},
}) {
    const [contactId, setContactId] = useState(filters.contact_id || '');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');

    const handleFilter = (e) => {
        if (e) e.preventDefault();
        router.get('/purchases/reports/summary', {
            contact_id: contactId,
            date_from: dateFrom,
            date_to: dateTo,
        }, { preserveState: true });
    };

    const handleReset = () => {
        setContactId('');
        setDateFrom('');
        setDateTo('');
        router.get('/purchases/reports/summary', {}, { preserveState: true });
    };

    const formatCurrency = (val) => {
        return Number(val || 0).toLocaleString('ar-SA', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }) + ' ر.س';
    };

    return (
        <AppLayout>
            <Head title="ملخص تقرير المشتريات" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
                            <PieChart className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white tracking-wide">ملخص تقرير المشتريات</h1>
                            <p className="text-xs text-slate-400">إجمالي المشتريات، الضرائب، مصاريف الشحن، المسدد، والمستحق للموردين</p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition"
                    >
                        <Printer className="w-4 h-4 text-sky-400" />
                        طباعة الملخص
                    </button>
                </div>

                {/* Summary Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 print:grid-cols-3">
                    <div className="bg-slate-900/60 print:bg-gray-50 border border-slate-800/80 print:border-gray-200 rounded-2xl p-3.5 shadow-sm">
                        <div className="text-[11px] text-slate-400 print:text-gray-600 mb-1">المجموع قبل الضريبة</div>
                        <div className="text-sm font-bold text-white print:text-black font-mono">{formatCurrency(summary.total_subtotal)}</div>
                    </div>
                    <div className="bg-slate-900/60 print:bg-gray-50 border border-slate-800/80 print:border-gray-200 rounded-2xl p-3.5 shadow-sm">
                        <div className="text-[11px] text-slate-400 print:text-gray-600 mb-1">إجمالي الضريبة (15%)</div>
                        <div className="text-sm font-bold text-amber-400 print:text-amber-700 font-mono">{formatCurrency(summary.total_tax)}</div>
                    </div>
                    <div className="bg-slate-900/60 print:bg-gray-50 border border-slate-800/80 print:border-gray-200 rounded-2xl p-3.5 shadow-sm">
                        <div className="text-[11px] text-slate-400 print:text-gray-600 mb-1">مصاريف الشحن</div>
                        <div className="text-sm font-bold text-slate-200 print:text-gray-800 font-mono">{formatCurrency(summary.total_shipping)}</div>
                    </div>
                    <div className="bg-slate-900/60 print:bg-gray-50 border border-slate-800/80 print:border-gray-200 rounded-2xl p-3.5 shadow-sm">
                        <div className="text-[11px] text-slate-400 print:text-gray-600 mb-1">صافي المشتريات</div>
                        <div className="text-sm font-bold text-emerald-400 print:text-emerald-700 font-mono">{formatCurrency(summary.total_amount)}</div>
                    </div>
                    <div className="bg-slate-900/60 print:bg-gray-50 border border-slate-800/80 print:border-gray-200 rounded-2xl p-3.5 shadow-sm">
                        <div className="text-[11px] text-slate-400 print:text-gray-600 mb-1">المسدد للموردين</div>
                        <div className="text-sm font-bold text-blue-400 print:text-blue-700 font-mono">{formatCurrency(summary.total_paid)}</div>
                    </div>
                    <div className="bg-slate-900/60 print:bg-gray-50 border border-slate-800/80 print:border-gray-200 rounded-2xl p-3.5 shadow-sm">
                        <div className="text-[11px] text-slate-400 print:text-gray-600 mb-1">المتبقي غير المسدد</div>
                        <div className="text-sm font-bold text-rose-400 print:text-rose-700 font-mono">{formatCurrency(summary.total_due)}</div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-4 shadow-sm print:hidden">
                    <form onSubmit={handleFilter} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
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

                        <div>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-950/50 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50"
                            />
                        </div>

                        <div className="flex items-center gap-1.5">
                            <button
                                type="submit"
                                className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-medium transition"
                            >
                                تصفية
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
                                    <th className="py-3 px-4">المبلغ قبل الضريبة</th>
                                    <th className="py-3 px-4">الضريبة</th>
                                    <th className="py-3 px-4">الإجمالي النهائي</th>
                                    <th className="py-3 px-4">المدفوع</th>
                                    <th className="py-3 px-4 text-left">المتبقي</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50 print:divide-gray-200 text-slate-300 print:text-gray-800">
                                {orders.data && orders.data.length > 0 ? (
                                    orders.data.map((order) => {
                                        const due = Math.max(0, Number(order.total_amount) - Number(order.paid_amount));
                                        return (
                                            <tr key={order.id} className="hover:bg-slate-800/30 transition">
                                                <td className="py-3 px-4 font-semibold text-emerald-400 font-mono">
                                                    <Link href={`/purchases/${order.id}`} className="hover:underline">
                                                        {order.order_number}
                                                    </Link>
                                                </td>
                                                <td className="py-3 px-4 text-slate-400 print:text-gray-600">{order.date}</td>
                                                <td className="py-3 px-4 font-medium text-white print:text-black">
                                                    {order.contact?.name || 'مورد عام'}
                                                </td>
                                                <td className="py-3 px-4 font-mono">{formatCurrency(order.subtotal)}</td>
                                                <td className="py-3 px-4 font-mono text-amber-400">{formatCurrency(order.tax_amount)}</td>
                                                <td className="py-3 px-4 font-bold text-white print:text-black font-mono">
                                                    {formatCurrency(order.total_amount)}
                                                </td>
                                                <td className="py-3 px-4 text-emerald-400 font-mono">{formatCurrency(order.paid_amount)}</td>
                                                <td className="py-3 px-4 text-left font-bold text-rose-400 font-mono">
                                                    {formatCurrency(due)}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={8} className="py-12 text-center text-slate-500">
                                            لا توجد بيانات مطابقة
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
