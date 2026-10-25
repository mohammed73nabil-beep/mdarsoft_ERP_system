import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    ShoppingBag,
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
    ArrowDownLeft,
    X,
} from 'lucide-react';

export default function PurchaseIndex({
    orders,
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
    const [status, setStatus] = useState(filters.status || '');
    const [paymentStatus, setPaymentStatus] = useState(filters.payment_status || '');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');

    const handleFilter = (e) => {
        if (e) e.preventDefault();
        router.get(
            '/purchases/list',
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

    const handleReset = () => {
        setSearch('');
        setBranchId('');
        setWarehouseId('');
        setContactId('');
        setStatus('');
        setPaymentStatus('');
        setDateFrom('');
        setDateTo('');
        router.get('/purchases/list', {}, { preserveState: true });
    };

    const handleDelete = (order) => {
        if (confirm(`هل أنت متأكد من حذف أمر الشراء رقم ${order.order_number}؟`)) {
            router.delete(`/purchases/${order.id}`);
        }
    };

    const formatCurrency = (val) => {
        return Number(val || 0).toLocaleString('ar-SA', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }) + ' ر.س';
    };

    const getStatusBadge = (statusVal) => {
        switch (statusVal) {
            case 'received':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        مستلم بالمخزن
                    </span>
                );
            case 'confirmed':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <Clock className="w-3.5 h-3.5" />
                        بانتظار الاستلام
                    </span>
                );
            case 'cancelled':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        <X className="w-3.5 h-3.5" />
                        ملغى
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20">
                        {statusVal}
                    </span>
                );
        }
    };

    const getPaymentBadge = (payStatus) => {
        switch (payStatus) {
            case 'paid':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        مدفوع بالكامل
                    </span>
                );
            case 'partial':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-sky-500/10 text-sky-400 border border-sky-500/20">
                        سداد جزئي
                    </span>
                );
            case 'unpaid':
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        غير مدفوع (آجل)
                    </span>
                );
        }
    };

    return (
        <AppLayout>
            <Head title="قائمة المشتريات وفواتير الشراء" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
                            <ShoppingBag className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white tracking-wide">قائمة المشتريات وفواتير الشراء</h1>
                            <p className="text-xs text-slate-400">إدارة أوامر الشراء، استلام البضائع، وتتبع سداد الموردين</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <Link
                            href="/purchases/returns"
                            className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition"
                        >
                            <CornerUpLeft className="w-4 h-4 text-rose-400" />
                            مرتجع المشتريات
                        </Link>
                        <Link
                            href="/purchases/create"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-medium rounded-xl shadow-lg shadow-emerald-500/20 transition"
                        >
                            <Plus className="w-4 h-4" />
                            إضافة فاتورة مشتريات
                        </Link>
                    </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-4 shadow-sm">
                        <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                            <span>إجمالي المشتريات</span>
                            <ShoppingBag className="w-4 h-4 text-indigo-400" />
                        </div>
                        <div className="text-xl font-bold text-white">
                            {formatCurrency(metrics.total_purchases)}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1">
                            {metrics.total_count || 0} فاتورة مسجلة
                        </div>
                    </div>

                    <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-4 shadow-sm">
                        <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                            <span>المسدد للموردين</span>
                            <DollarSign className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div className="text-xl font-bold text-emerald-400">
                            {formatCurrency(metrics.total_paid)}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1">
                            دفعات نقدية وبنكية
                        </div>
                    </div>

                    <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-4 shadow-sm">
                        <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                            <span>المتبقي غير المسدد</span>
                            <CreditCard className="w-4 h-4 text-amber-400" />
                        </div>
                        <div className="text-xl font-bold text-amber-400">
                            {formatCurrency(metrics.total_due)}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1">
                            مستحقات واجبة السداد
                        </div>
                    </div>

                    <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-4 shadow-sm">
                        <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                            <span>عدد الفواتير</span>
                            <FileText className="w-4 h-4 text-teal-400" />
                        </div>
                        <div className="text-xl font-bold text-white">
                            {orders.total || 0}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1">
                            بحسب الفلاتر المحددة
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-4 shadow-sm">
                    <form onSubmit={handleFilter} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                        <div className="lg:col-span-2">
                            <div className="relative">
                                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="رقم الفاتورة، اسم المورد..."
                                    className="w-full pl-3 pr-9 py-2 bg-slate-950/50 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition"
                                />
                            </div>
                        </div>

                        <div>
                            <select
                                value={contactId}
                                onChange={(e) => setContactId(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-950/50 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50 transition"
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
                                className="w-full px-3 py-2 bg-slate-950/50 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50 transition"
                            >
                                <option value="">كل المستودعات</option>
                                {warehouses.map((w) => (
                                    <option key={w.id} value={w.id}>{w.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-950/50 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50 transition"
                            >
                                <option value="">حالة الاستلام</option>
                                <option value="received">مستلم بالمخزن</option>
                                <option value="confirmed">بانتظار الاستلام</option>
                                <option value="cancelled">ملغى</option>
                            </select>
                        </div>

                        <div>
                            <select
                                value={paymentStatus}
                                onChange={(e) => setPaymentStatus(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-950/50 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50 transition"
                            >
                                <option value="">حالة الدفع</option>
                                <option value="paid">مدفوع</option>
                                <option value="partial">جزئي</option>
                                <option value="unpaid">غير مدفوع (آجل)</option>
                            </select>
                        </div>

                        <div>
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-950/50 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50 transition"
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
                                    <th className="py-3 px-4">رقم الفاتورة</th>
                                    <th className="py-3 px-4">التاريخ</th>
                                    <th className="py-3 px-4">المورد</th>
                                    <th className="py-3 px-4">المستودع</th>
                                    <th className="py-3 px-4 text-center">الأسطر</th>
                                    <th className="py-3 px-4">الإجمالي</th>
                                    <th className="py-3 px-4">المدفوع</th>
                                    <th className="py-3 px-4">المتبقي</th>
                                    <th className="py-3 px-4 text-center">حالة الاستلام</th>
                                    <th className="py-3 px-4 text-center">حالة الدفع</th>
                                    <th className="py-3 px-4 text-center">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50 text-slate-300">
                                {orders.data && orders.data.length > 0 ? (
                                    orders.data.map((order) => {
                                        const remaining = Math.max(0, Number(order.total_amount) - Number(order.paid_amount));
                                        return (
                                            <tr key={order.id} className="hover:bg-slate-800/30 transition">
                                                <td className="py-3 px-4 font-semibold text-emerald-400">
                                                    <Link href={`/purchases/${order.id}`} className="hover:underline">
                                                        {order.order_number}
                                                    </Link>
                                                </td>
                                                <td className="py-3 px-4 text-slate-400">
                                                    {order.date}
                                                </td>
                                                <td className="py-3 px-4 font-medium text-white">
                                                    {order.contact?.name || 'مورد عام'}
                                                </td>
                                                <td className="py-3 px-4 text-slate-400">
                                                    {order.warehouse?.name || '—'}
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[11px]">
                                                        {order.lines_count || 0}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 font-bold text-white">
                                                    {formatCurrency(order.total_amount)}
                                                </td>
                                                <td className="py-3 px-4 text-emerald-400">
                                                    {formatCurrency(order.paid_amount)}
                                                </td>
                                                <td className="py-3 px-4 font-semibold text-amber-400">
                                                    {formatCurrency(remaining)}
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    {getStatusBadge(order.status)}
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    {getPaymentBadge(order.payment_status)}
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        <Link
                                                            href={`/purchases/${order.id}`}
                                                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition"
                                                            title="عرض التفاصيل"
                                                        >
                                                            <Eye className="w-3.5 h-3.5" />
                                                        </Link>
                                                        {order.status === 'confirmed' && (
                                                            <button
                                                                onClick={() => handleDelete(order)}
                                                                className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition"
                                                                title="حذف أمر الشراء"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={11} className="py-12 text-center text-slate-500">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <ShoppingBag className="w-8 h-8 text-slate-600" />
                                                <span>لا توجد فواتير مشتريات مطابقة للبحث</span>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {orders.links && orders.links.length > 3 && (
                        <div className="p-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                            <div>
                                عرض {orders.from || 0} إلى {orders.to || 0} من أصل {orders.total} فاتورة
                            </div>
                            <div className="flex items-center gap-1">
                                {orders.links.map((link, i) => (
                                    <Link
                                        key={i}
                                        href={link.url || '#'}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        className={`px-2.5 py-1 rounded-lg transition ${
                                            link.active
                                                ? 'bg-emerald-600 text-white font-medium'
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
