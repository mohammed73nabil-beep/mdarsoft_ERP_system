import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    CornerUpLeft,
    Plus,
    Search,
    Filter,
    Calendar,
    Building2,
    Warehouse,
    UserCheck,
    DollarSign,
    CheckCircle2,
    Eye,
    FileText,
    ChevronLeft,
    ChevronRight,
    X,
    ArrowRight,
} from 'lucide-react';

export default function SaleReturnIndex({
    returns,
    filters = {},
    branches = [],
    warehouses = [],
    customers = [],
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
            '/sales/returns',
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

    const clearFilters = () => {
        setSearch('');
        setBranchId('');
        setWarehouseId('');
        setContactId('');
        setDateFrom('');
        setDateTo('');
        router.get('/sales/returns');
    };

    const formatCurrency = (val) => {
        return Number(val || 0).toLocaleString('ar-SA', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }) + ' ر.س';
    };

    return (
        <AppLayout title="قائمة مرتجع المبيعات">
            <Head title="قائمة مرتجع المبيعات" />

            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Link href="/sales/all" className="text-slate-400 hover:text-white text-xs flex items-center gap-1">
                                <ArrowRight className="w-3.5 h-3.5" />
                                المبيعات
                            </Link>
                        </div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            <CornerUpLeft className="w-7 h-7 text-amber-500" />
                            مرتجعات المبيعات
                        </h1>
                        <p className="text-slate-400 text-sm mt-1">
                            سجل الأجهزة والبضائع المسترجعة من العملاء وإعادة إدخالها للمخزون بتكلفتها الأصلية
                        </p>
                    </div>

                    <Link
                        href="/sales/returns/create"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-amber-900/30 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        تسجيل مرتجع جديد
                    </Link>
                </div>

                {/* Filters */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <form onSubmit={handleFilter} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
                        <div className="lg:col-span-2">
                            <label className="text-xs text-slate-400 mb-1 block">بحث برقم المرتجع أو الفاتورة أو العميل</label>
                            <div className="relative">
                                <Search className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="رقم المرتجع، الفاتورة الأصلية..."
                                    className="w-full bg-slate-800/80 border border-slate-700 rounded-lg pr-9 pl-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs text-slate-400 mb-1 block">الفرع</label>
                            <select
                                value={branchId}
                                onChange={(e) => setBranchId(e.target.value)}
                                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                            >
                                <option value="">كل الفروع</option>
                                {branches.map((b) => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-xs text-slate-400 mb-1 block">المستودع</label>
                            <select
                                value={warehouseId}
                                onChange={(e) => setWarehouseId(e.target.value)}
                                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                            >
                                <option value="">كل المستودعات</option>
                                {warehouses.map((w) => (
                                    <option key={w.id} value={w.id}>{w.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-xs text-slate-400 mb-1 block">من تاريخ</label>
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                            />
                        </div>

                        <div>
                            <label className="text-xs text-slate-400 mb-1 block">إلى تاريخ</label>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                            />
                        </div>

                        <div className="flex items-end gap-2">
                            <button
                                type="submit"
                                className="flex-1 bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1"
                            >
                                <Filter className="w-3.5 h-3.5" />
                                تصفية
                            </button>
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white p-2 rounded-lg border border-slate-700 transition-colors"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </form>
                </div>

                {/* Table */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-right text-sm">
                            <thead className="bg-slate-800/70 text-slate-400 text-xs font-medium uppercase border-b border-slate-800">
                                <tr>
                                    <th className="px-4 py-3">رقم المرتجع</th>
                                    <th className="px-4 py-3">الفاتورة الأصلية</th>
                                    <th className="px-4 py-3">التاريخ</th>
                                    <th className="px-4 py-3">العميل</th>
                                    <th className="px-4 py-3">الفرع والمستودع</th>
                                    <th className="px-4 py-3">الأسطر</th>
                                    <th className="px-4 py-3">قيمة المرتجع</th>
                                    <th className="px-4 py-3">طريقة الرد</th>
                                    <th className="px-4 py-3 text-center">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {returns.data?.length === 0 ? (
                                    <tr>
                                        <td colSpan="9" className="px-4 py-12 text-center text-slate-500">
                                            <CornerUpLeft className="w-12 h-12 mx-auto text-slate-600 mb-2 opacity-50" />
                                            لا توجد مرتجعات مبيعات مسجلة
                                        </td>
                                    </tr>
                                ) : (
                                    returns.data.map((ret) => (
                                        <tr key={ret.id} className="hover:bg-slate-800/30 transition-colors">
                                            <td className="px-4 py-3.5 font-semibold text-white">
                                                <Link
                                                    href={`/sales/returns/${ret.id}`}
                                                    className="text-amber-400 hover:underline flex items-center gap-1.5"
                                                >
                                                    <FileText className="w-4 h-4 text-amber-500" />
                                                    {ret.return_number}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3.5 text-slate-300">
                                                {ret.original_sale?.order_number || '-'}
                                            </td>
                                            <td className="px-4 py-3.5 text-slate-300">
                                                {ret.date}
                                            </td>
                                            <td className="px-4 py-3.5 text-slate-200">
                                                {ret.contact?.name || 'عميل نقدي'}
                                            </td>
                                            <td className="px-4 py-3.5 text-xs text-slate-400">
                                                <span className="block text-slate-200">{ret.branch?.name}</span>
                                                <span className="block text-slate-500">{ret.warehouse?.name}</span>
                                            </td>
                                            <td className="px-4 py-3.5 text-slate-300 font-medium">
                                                {ret.lines_count}
                                            </td>
                                            <td className="px-4 py-3.5 font-bold text-amber-400">
                                                {formatCurrency(ret.total_amount)}
                                            </td>
                                            <td className="px-4 py-3.5 text-xs">
                                                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                                    {ret.refund_method === 'cash' ? 'نقداً' : ret.refund_method === 'credit' ? 'رصيد حساب' : 'استبدال'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5 text-center">
                                                <Link
                                                    href={`/sales/returns/${ret.id}`}
                                                    className="p-1.5 text-slate-400 hover:text-amber-400 bg-slate-800 hover:bg-slate-700/80 rounded border border-slate-700 transition-colors inline-block"
                                                    title="عرض تفاصيل المرتجع"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {returns.links && returns.total > returns.per_page && (
                        <div className="p-4 border-t border-slate-800 flex items-center justify-between">
                            <span className="text-xs text-slate-400">
                                عرض {returns.from} إلى {returns.to} من أصل {returns.total} مرتجع
                            </span>
                            <div className="flex gap-1">
                                {returns.links.map((link, idx) => (
                                    <button
                                        key={idx}
                                        disabled={!link.url}
                                        onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        className={`px-3 py-1 text-xs rounded border transition-colors ${
                                            link.active
                                                ? 'bg-amber-600 text-white border-amber-500 font-bold'
                                                : link.url
                                                ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                                                : 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed'
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
