import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    CornerUpLeft,
    Search,
    Printer,
    Package,
    X,
} from 'lucide-react';

export default function ProductsReturnsReport({ returns, filters = {} }) {
    const [search, setSearch] = useState(filters.search || '');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');

    const handleFilter = (e) => {
        if (e) e.preventDefault();
        router.get('/purchases/reports/products-returns', {
            search,
            date_from: dateFrom,
            date_to: dateTo,
        }, { preserveState: true });
    };

    const handleReset = () => {
        setSearch('');
        setDateFrom('');
        setDateTo('');
        router.get('/purchases/reports/products-returns', {}, { preserveState: true });
    };

    const formatCurrency = (val) => {
        return Number(val || 0).toLocaleString('ar-SA', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }) + ' ر.س';
    };

    return (
        <AppLayout>
            <Head title="تقرير مرتجع المنتجات" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-rose-500/10 rounded-xl border border-rose-500/20 text-rose-400">
                            <CornerUpLeft className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white tracking-wide">تقرير مرتجع المنتجات</h1>
                            <p className="text-xs text-slate-400">سجل وحصر المنتجات المرتجعة للموردين مع الأرقام وتكاليف الاسترداد</p>
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

                {/* Filters */}
                <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-4 shadow-sm print:hidden">
                    <form onSubmit={handleFilter} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="md:col-span-2">
                            <div className="relative">
                                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="اسم المنتج، SKU..."
                                    className="w-full pl-3 pr-9 py-2 bg-slate-950/50 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500/50"
                                />
                            </div>
                        </div>

                        <div>
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-950/50 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-rose-500/50"
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
                                    <th className="py-3 px-4">رقم المرتجع</th>
                                    <th className="py-3 px-4">التاريخ</th>
                                    <th className="py-3 px-4">المورد</th>
                                    <th className="py-3 px-4">اسم المنتج</th>
                                    <th className="py-3 px-4 text-center">الكمية المرتجعة</th>
                                    <th className="py-3 px-4">تكلفة الوحدة</th>
                                    <th className="py-3 px-4 text-left">إجمالي المرتجع</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50 print:divide-gray-200 text-slate-300 print:text-gray-800">
                                {returns.data && returns.data.length > 0 ? (
                                    returns.data.map((retLine) => (
                                        <tr key={retLine.id} className="hover:bg-slate-800/30 transition">
                                            <td className="py-3 px-4 font-semibold text-rose-400 font-mono">
                                                {retLine.purchase_return?.return_number}
                                            </td>
                                            <td className="py-3 px-4 text-slate-400 print:text-gray-600">
                                                {retLine.purchase_return?.date}
                                            </td>
                                            <td className="py-3 px-4 font-medium text-white print:text-black">
                                                {retLine.purchase_return?.contact?.name || 'مورد عام'}
                                            </td>
                                            <td className="py-3 px-4 font-medium text-white print:text-black">
                                                {retLine.product?.name}
                                            </td>
                                            <td className="py-3 px-4 text-center font-mono font-bold text-rose-400">
                                                {Number(retLine.quantity)}
                                            </td>
                                            <td className="py-3 px-4 font-mono">
                                                {formatCurrency(retLine.unit_cost)}
                                            </td>
                                            <td className="py-3 px-4 text-left font-bold text-rose-400 font-mono">
                                                {formatCurrency(retLine.total_amount)}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="py-12 text-center text-slate-500">
                                            لا توجد منتجات مرتجعة مسجلة
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
