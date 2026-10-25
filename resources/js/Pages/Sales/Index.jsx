import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    ShoppingCart,
    Plus,
    Search,
    Filter,
    Calendar,
    Building2,
    Warehouse,
    UserCheck,
    CreditCard,
    DollarSign,
    Clock,
    CheckCircle2,
    Eye,
    Trash2,
    CornerUpLeft,
    FileText,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    ArrowUpRight,
    X,
} from 'lucide-react';

export default function SaleIndex({
    sales,
    filters = {},
    metrics = {},
    branches = [],
    warehouses = [],
    customers = [],
}) {
    const [search, setSearch] = useState(filters.search || '');
    const [branchId, setBranchId] = useState(filters.branch_id || '');
    const [warehouseId, setWarehouseId] = useState(filters.warehouse_id || '');
    const [contactId, setContactId] = useState(filters.contact_id || '');
    const [status, setStatus] = useState(filters.status || '');
    const [paymentStatus, setPaymentStatus] = useState(filters.payment_status || '');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');

    const handleFilter = (e) => {
        if (e) e.preventDefault();
        router.get(
            '/sales/all',
            {
                search,
                branch_id: branchId,
                warehouse_id: warehouseId,
                contact_id: contactId,
                status,
                payment_status: paymentStatus,
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
        setStatus('');
        setPaymentStatus('');
        setDateFrom('');
        setDateTo('');
        router.get('/sales/all');
    };

    const handleDelete = (id, number) => {
        if (confirm(`هل أنت متأكد من حذف فاتورة المبيعات رقم ${number}؟`)) {
            router.delete(`/sales/${id}`);
        }
    };

    const formatCurrency = (val) => {
        return Number(val || 0).toLocaleString('ar-SA', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }) + ' ر.س';
    };

    const statusBadge = (s) => {
        switch (s) {
            case 'completed':
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-900/50 text-emerald-400 border border-emerald-800"><CheckCircle2 className="w-3 h-3" /> مكتملة</span>;
            case 'shipped':
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-900/50 text-cyan-400 border border-cyan-800"><ArrowUpRight className="w-3 h-3" /> تم الشحن</span>;
            case 'confirmed':
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900/50 text-blue-400 border border-blue-800"><CheckCircle2 className="w-3 h-3" /> مؤكدة</span>;
            case 'cancelled':
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-900/50 text-red-400 border border-red-800"><X className="w-3 h-3" /> ملغاة</span>;
            default:
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">{s}</span>;
        }
    };

    const paymentBadge = (p) => {
        switch (p) {
            case 'paid':
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-900/50 text-emerald-400 border border-emerald-800">مدفوع بالكامل</span>;
            case 'partial':
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-900/50 text-amber-400 border border-amber-800">مدفوع جزئياً</span>;
            case 'unpaid':
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-900/50 text-rose-400 border border-rose-800">غير مدفوع (آجل)</span>;
            default:
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">{p}</span>;
        }
    };

    return (
        <AppLayout title="قائمة فواتير المبيعات">
            <Head title="قائمة فواتير المبيعات" />

            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            <ShoppingCart className="w-7 h-7 text-emerald-500" />
                            فواتير ومبيعات العملاء
                        </h1>
                        <p className="text-slate-400 text-sm mt-1">
                            إدارة وتتبع فواتير البيع ومبيعات الأجهزة بالسيريال والمقبوضات
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            href="/sales/returns"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg border border-slate-700 transition-colors"
                        >
                            <CornerUpLeft className="w-4 h-4 text-amber-400" />
                            مرتجع المبيعات
                        </Link>
                        <Link
                            href="/sales/create"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-emerald-900/30 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            إضافة فاتورة بيع
                        </Link>
                    </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                            <DollarSign className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="text-slate-400 text-xs block">إجمالي المبيعات</span>
                            <span className="text-xl font-bold text-white block mt-0.5">
                                {formatCurrency(metrics.total_sales)}
                            </span>
                        </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="text-slate-400 text-xs block">المبالغ المحصلة</span>
                            <span className="text-xl font-bold text-white block mt-0.5">
                                {formatCurrency(metrics.total_paid)}
                            </span>
                        </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="text-slate-400 text-xs block">المستحقات الآجلة</span>
                            <span className="text-xl font-bold text-white block mt-0.5">
                                {formatCurrency(metrics.total_unpaid)}
                            </span>
                        </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="text-slate-400 text-xs block">عدد الفواتير</span>
                            <span className="text-xl font-bold text-white block mt-0.5">
                                {metrics.invoices_count || 0}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <form onSubmit={handleFilter} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                        <div className="lg:col-span-2">
                            <label className="text-xs text-slate-400 mb-1 block">بحث برقم الفاتورة أو العميل</label>
                            <div className="relative">
                                <Search className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="رقم الفاتورة، اسم العميل..."
                                    className="w-full bg-slate-800/80 border border-slate-700 rounded-lg pr-9 pl-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs text-slate-400 mb-1 block">الفرع</label>
                            <select
                                value={branchId}
                                onChange={(e) => setBranchId(e.target.value)}
                                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
                                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            >
                                <option value="">كل المستودعات</option>
                                {warehouses.map((w) => (
                                    <option key={w.id} value={w.id}>{w.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-xs text-slate-400 mb-1 block">العميل</label>
                            <select
                                value={contactId}
                                onChange={(e) => setContactId(e.target.value)}
                                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            >
                                <option value="">كل العملاء</option>
                                {customers.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-xs text-slate-400 mb-1 block">حالة السداد</label>
                            <select
                                value={paymentStatus}
                                onChange={(e) => setPaymentStatus(e.target.value)}
                                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            >
                                <option value="">الكل</option>
                                <option value="paid">مدفوع بالكامل</option>
                                <option value="partial">مدفوع جزئياً</option>
                                <option value="unpaid">غير مدفوع (آجل)</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-xs text-slate-400 mb-1 block">من تاريخ</label>
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                        </div>

                        <div className="flex items-end gap-2">
                            <button
                                type="submit"
                                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1"
                            >
                                <Filter className="w-3.5 h-3.5" />
                                تصفية
                            </button>
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white p-2 rounded-lg border border-slate-700 transition-colors"
                                title="إعادة ضبط الفلاتر"
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
                                    <th className="px-4 py-3">رقم الفاتورة</th>
                                    <th className="px-4 py-3">التاريخ</th>
                                    <th className="px-4 py-3">العميل</th>
                                    <th className="px-4 py-3">الفرع والمستودع</th>
                                    <th className="px-4 py-3">الأسطر</th>
                                    <th className="px-4 py-3">الإجمالي</th>
                                    <th className="px-4 py-3">المدفوع</th>
                                    <th className="px-4 py-3">حالة السداد</th>
                                    <th className="px-4 py-3">الحالة</th>
                                    <th className="px-4 py-3 text-center">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {sales.data?.length === 0 ? (
                                    <tr>
                                        <td colSpan="10" className="px-4 py-12 text-center text-slate-500">
                                            <ShoppingCart className="w-12 h-12 mx-auto text-slate-600 mb-2 opacity-50" />
                                            لا توجد فواتير مبيعات مسجلة تطابق معايير البحث
                                        </td>
                                    </tr>
                                ) : (
                                    sales.data.map((sale) => (
                                        <tr key={sale.id} className="hover:bg-slate-800/30 transition-colors">
                                            <td className="px-4 py-3.5 font-semibold text-white">
                                                <Link
                                                    href={`/sales/${sale.id}`}
                                                    className="text-emerald-400 hover:underline flex items-center gap-1.5"
                                                >
                                                    <FileText className="w-4 h-4 text-emerald-500" />
                                                    {sale.order_number}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3.5 text-slate-300">
                                                {sale.date}
                                            </td>
                                            <td className="px-4 py-3.5 text-slate-200">
                                                {sale.contact?.name || 'عميل نقدي'}
                                            </td>
                                            <td className="px-4 py-3.5 text-xs text-slate-400">
                                                <span className="block text-slate-200">{sale.branch?.name}</span>
                                                <span className="block text-slate-500">{sale.warehouse?.name}</span>
                                            </td>
                                            <td className="px-4 py-3.5 text-slate-300 font-medium">
                                                {sale.lines_count}
                                            </td>
                                            <td className="px-4 py-3.5 font-bold text-white">
                                                {formatCurrency(sale.total_amount)}
                                            </td>
                                            <td className="px-4 py-3.5 text-emerald-400 font-medium">
                                                {formatCurrency(sale.paid_amount)}
                                            </td>
                                            <td className="px-4 py-3.5">
                                                {paymentBadge(sale.payment_status)}
                                            </td>
                                            <td className="px-4 py-3.5">
                                                {statusBadge(sale.status)}
                                            </td>
                                            <td className="px-4 py-3.5 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <Link
                                                        href={`/sales/${sale.id}`}
                                                        className="p-1.5 text-slate-400 hover:text-emerald-400 bg-slate-800 hover:bg-slate-700/80 rounded border border-slate-700 transition-colors"
                                                        title="عرض التفاصيل والطباعة والسداد"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Link>

                                                    <button
                                                        onClick={() => handleDelete(sale.id, sale.order_number)}
                                                        className="p-1.5 text-slate-400 hover:text-rose-400 bg-slate-800 hover:bg-slate-700/80 rounded border border-slate-700 transition-colors"
                                                        title="حذف الفاتورة"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {sales.links && sales.total > sales.per_page && (
                        <div className="p-4 border-t border-slate-800 flex items-center justify-between">
                            <span className="text-xs text-slate-400">
                                عرض {sales.from} إلى {sales.to} من أصل {sales.total} فاتورة
                            </span>
                            <div className="flex gap-1">
                                {sales.links.map((link, idx) => (
                                    <button
                                        key={idx}
                                        disabled={!link.url}
                                        onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        className={`px-3 py-1 text-xs rounded border transition-colors ${
                                            link.active
                                                ? 'bg-emerald-600 text-white border-emerald-500 font-bold'
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
