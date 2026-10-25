import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AppLayout from '../../../Layouts/AppLayout';
import {
    ArrowLeftRight,
    Plus,
    Filter,
    Calendar,
    Warehouse as WarehouseIcon,
    Eye,
    CheckCircle2,
    Clock,
    Send,
    RotateCcw
} from 'lucide-react';

export default function Index({ transfers, filters, warehouses, allWarehouses }) {
    const { auth } = usePage().props;
    const userPermissions = auth?.user?.permissions || [];
    const isAdmin = auth?.user?.roles?.includes('مدير النظام') || auth?.user?.roles?.includes('admin');
    const canCreate = isAdmin || userPermissions.includes('inventory.transfer_create.view');

    const [fromWarehouseId, setFromWarehouseId] = useState(filters?.from_warehouse_id || '');
    const [toWarehouseId, setToWarehouseId] = useState(filters?.to_warehouse_id || '');
    const [status, setStatus] = useState(filters?.status || '');
    const [dateFrom, setDateFrom] = useState(filters?.date_from || '');
    const [dateTo, setDateTo] = useState(filters?.date_to || '');

    const applyFilters = () => {
        router.get('/inventory/transfers', {
            from_warehouse_id: fromWarehouseId,
            to_warehouse_id: toWarehouseId,
            status,
            date_from: dateFrom,
            date_to: dateTo,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const resetFilters = () => {
        setFromWarehouseId('');
        setToWarehouseId('');
        setStatus('');
        setDateFrom('');
        setDateTo('');
        router.get('/inventory/transfers');
    };

    return (
        <AppLayout title="تحويلات المخزون بين الفروع والمستودعات">
            <Head title="تحويلات المخزون" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
                        <Link href="/inventory" className="hover:text-white transition">المخازن</Link>
                        <span>/</span>
                        <span className="text-white font-bold">تحويلات المخزون</span>
                    </div>
                    <h2 className="text-2xl font-black text-white flex items-center gap-2">
                        <ArrowLeftRight className="text-cyan-500" size={26} />
                        <span>تحويلات المخزون (Inventory Transfers)</span>
                    </h2>
                </div>

                {canCreate && (
                    <Link
                        href="/inventory/transfers/create"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm shadow-lg shadow-cyan-600/30 transition"
                    >
                        <Plus size={18} />
                        <span>إضافة تحويل مخزون</span>
                    </Link>
                )}
            </div>

            {/* Filters */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6 shadow-xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-300 mb-1.5">من مستودع:</label>
                        <select
                            value={fromWarehouseId}
                            onChange={(e) => setFromWarehouseId(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                        >
                            <option value="">كل المستودعات</option>
                            {warehouses?.map((w) => (
                                <option key={w.id} value={w.id}>{w.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-300 mb-1.5">إلى مستودع:</label>
                        <select
                            value={toWarehouseId}
                            onChange={(e) => setToWarehouseId(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                        >
                            <option value="">كل المستودعات</option>
                            {allWarehouses?.map((w) => (
                                <option key={w.id} value={w.id}>{w.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-300 mb-1.5">الحالة:</label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                        >
                            <option value="">الكل</option>
                            <option value="draft">مسودة (Draft)</option>
                            <option value="sent">تم الإرسال (Sent)</option>
                            <option value="received">تم الاستلام (Received)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-300 mb-1.5 flex items-center gap-2">
                            <Calendar size={16} className="text-slate-400" />
                            <span>من تاريخ:</span>
                        </label>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-300 mb-1.5 flex items-center gap-2">
                            <Calendar size={16} className="text-slate-400" />
                            <span>إلى تاريخ:</span>
                        </label>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 mt-4 pt-3 border-t border-slate-800">
                    <button
                        onClick={resetFilters}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition flex items-center gap-2"
                    >
                        <RotateCcw size={16} />
                        <span>إعادة ضبط</span>
                    </button>
                    <button
                        onClick={applyFilters}
                        className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-md transition flex items-center gap-2"
                    >
                        <Filter size={16} />
                        <span>تطبيق الفلترة</span>
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                        <thead>
                            <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 text-sm font-bold">
                                <th className="p-4">رقم التحويل</th>
                                <th className="p-4">من مستودع</th>
                                <th className="p-4">إلى مستودع</th>
                                <th className="p-4">التاريخ</th>
                                <th className="p-4">عدد البنود</th>
                                <th className="p-4">الحالة</th>
                                <th className="p-4 text-center">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-sm">
                            {transfers?.data?.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-slate-500 font-bold">
                                        لا توجد تحويلات مخزنية مسجلة حالياً.
                                    </td>
                                </tr>
                            ) : (
                                transfers?.data?.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-800/40 transition">
                                        <td className="p-4 font-mono font-bold text-cyan-400">
                                            {item.transfer_number}
                                        </td>
                                        <td className="p-4 font-bold text-white">
                                            {item.from_warehouse?.name || '—'}
                                        </td>
                                        <td className="p-4 font-bold text-white">
                                            {item.to_warehouse?.name || '—'}
                                        </td>
                                        <td className="p-4 text-slate-300 font-mono">
                                            {item.date ? String(item.date).substring(0, 10) : '—'}
                                        </td>
                                        <td className="p-4 font-mono text-slate-200">
                                            {item.lines_count || 0} بنود
                                        </td>
                                        <td className="p-4">
                                            {item.status === 'received' ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                                                    <CheckCircle2 size={14} />
                                                    <span>تم الاستلام</span>
                                                </span>
                                            ) : item.status === 'sent' ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 font-bold border border-blue-500/20">
                                                    <Send size={14} />
                                                    <span>قيد النقل (مُرسل)</span>
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20">
                                                    <Clock size={14} />
                                                    <span>مسودة</span>
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-center">
                                            <Link
                                                href={`/inventory/transfers/${item.id}`}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm border border-slate-700 transition"
                                            >
                                                <Eye size={15} />
                                                <span>عرض</span>
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {transfers?.links && transfers.links.length > 3 && (
                    <div className="p-4 border-t border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-sm text-slate-400 font-mono">
                            عرض {transfers.from || 0} إلى {transfers.to || 0} من أصل {transfers.total || 0} تحويل
                        </span>
                        <div className="flex items-center gap-1">
                            {transfers.links.map((link, idx) => (
                                <Link
                                    key={idx}
                                    href={link.url || '#'}
                                    preserveScroll
                                    className={`px-3 py-1.5 rounded-lg text-sm font-bold transition ${
                                        link.active
                                            ? 'bg-blue-600 text-white'
                                            : link.url
                                            ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                            : 'bg-slate-900 text-slate-600 cursor-not-allowed'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
