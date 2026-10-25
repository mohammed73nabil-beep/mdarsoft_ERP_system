import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '../../../Layouts/AppLayout';
import {
    BarChart3,
    Filter,
    Search,
    DollarSign,
    Package,
    RotateCcw,
    Barcode,
    Warehouse as WarehouseIcon
} from 'lucide-react';

export default function SummaryReport({ balances, filters, warehouses, categories, summary }) {
    const [warehouseId, setWarehouseId] = useState(filters?.warehouse_id || '');
    const [categoryId, setCategoryId] = useState(filters?.category_id || '');
    const [search, setSearch] = useState(filters?.search || '');

    const applyFilters = () => {
        router.get('/inventory/reports/summary', {
            warehouse_id: warehouseId,
            category_id: categoryId,
            search: search,
            page: 1,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const resetFilters = () => {
        setWarehouseId('');
        setCategoryId('');
        setSearch('');
        router.get('/inventory/reports/summary');
    };

    return (
        <AppLayout title="ملخص تقرير المخزون">
            <Head title="ملخص تقرير المخزون" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
                        <Link href="/inventory" className="hover:text-white transition">المخازن</Link>
                        <span>/</span>
                        <span className="text-white font-bold">تقارير الجرد</span>
                    </div>
                    <h2 className="text-2xl font-black text-white flex items-center gap-2">
                        <BarChart3 className="text-emerald-500" size={26} />
                        <span>ملخص أرصدة المخازن الشامل (Inventory Summary)</span>
                    </h2>
                </div>

                {/* Sub Navigation Tabs */}
                <div className="flex flex-wrap items-center gap-1.5 bg-slate-900 border border-slate-800 p-1.5 rounded-xl text-xs">
                    <Link
                        href="/inventory/reports/stocktaking-cost"
                        className="px-3 py-1.5 rounded-lg font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    >
                        الجرد بالتكلفة
                    </Link>
                    <Link
                        href="/inventory/reports/stocktaking-sale"
                        className="px-3 py-1.5 rounded-lg font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    >
                        الجرد بسعر البيع
                    </Link>
                    <Link
                        href="/inventory/reports/stocktaking-no-price"
                        className="px-3 py-1.5 rounded-lg font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    >
                        استمارة الجرد الميداني
                    </Link>
                    <Link
                        href="/inventory/reports/summary"
                        className="px-3 py-1.5 rounded-lg font-bold bg-emerald-600 text-white shadow"
                    >
                        ملخص الأرصدة
                    </Link>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                        <Package size={24} />
                    </div>
                    <div>
                        <span className="text-xs text-slate-400 block">إجمالي الوحدات المتوفرة</span>
                        <span className="text-2xl font-black text-white font-mono">{summary.total_quantity}</span>
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <span className="text-xs text-slate-400 block">إجمالي تقييم التكلفة</span>
                        <div className="flex items-center gap-1 font-mono text-emerald-400 font-black text-2xl">
                            <span>{Number(summary.total_cost || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                            <span className="text-xs text-slate-400 font-sans">SAR</span>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <span className="text-xs text-slate-400 block">إجمالي القيمة البيعية</span>
                        <div className="flex items-center gap-1 font-mono text-purple-400 font-black text-2xl">
                            <span>{Number(summary.total_sale || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                            <span className="text-xs text-slate-400 font-sans">SAR</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Panel */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6 shadow-xl">
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1">المستودع / المخزن</label>
                        <select
                            value={warehouseId}
                            onChange={(e) => setWarehouseId(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm focus:border-emerald-500 focus:outline-none"
                        >
                            <option value="">جميع المخازن المصرح بها</option>
                            {warehouses?.map((w) => (
                                <option key={w.id} value={w.id}>{w.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1">تصنيف المنتجات</label>
                        <select
                            value={categoryId}
                            onChange={(e) => setCategoryId(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm focus:border-emerald-500 focus:outline-none"
                        >
                            <option value="">جميع التصنيفات</option>
                            {categories?.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1">بحث بالاسم أو الباركود أو SKU</label>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                            placeholder="اكتب واضغط Enter..."
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm focus:border-emerald-500 focus:outline-none"
                        />
                    </div>

                    <div className="flex items-end gap-2">
                        <button
                            type="button"
                            onClick={applyFilters}
                            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold transition"
                        >
                            <Filter size={16} />
                            <span>تصفية</span>
                        </button>
                        <button
                            type="button"
                            onClick={resetFilters}
                            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
                            title="إعادة تعيين"
                        >
                            <RotateCcw size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-right text-sm">
                        <thead className="bg-slate-950/60 text-slate-400 text-xs font-bold border-b border-slate-800">
                            <tr>
                                <th className="p-4">#</th>
                                <th className="p-4">المخزن</th>
                                <th className="p-4">الفرع</th>
                                <th className="p-4">رمز الصنف (SKU)</th>
                                <th className="p-4">اسم الصنف</th>
                                <th className="p-4">التتبع</th>
                                <th className="p-4">الكمية</th>
                                <th className="p-4">متوسط التكلفة</th>
                                <th className="p-4">إجمالي التكلفة</th>
                                <th className="p-4">سعر البيع</th>
                                <th className="p-4">إجمالي البيع</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-slate-200">
                            {balances.data?.length === 0 ? (
                                <tr>
                                    <td colSpan="11" className="text-center p-8 text-slate-500">
                                        لا توجد بيانات مطابقة للفلاتر المحددة.
                                    </td>
                                </tr>
                            ) : (
                                balances.data?.map((b, idx) => (
                                    <tr key={b.id} className="hover:bg-slate-800/30">
                                        <td className="p-4 text-slate-500 font-mono">{balances.from + idx}</td>
                                        <td className="p-4 font-medium text-slate-300">{b.warehouse?.name}</td>
                                        <td className="p-4 text-xs text-slate-400">{b.warehouse?.branch?.name || '-'}</td>
                                        <td className="p-4 font-mono text-xs text-slate-400">{b.product?.sku}</td>
                                        <td className="p-4 font-bold text-white">
                                            {b.product?.name}
                                            {b.variation && (
                                                <span className="text-xs text-blue-400 block font-normal">({b.variation.name})</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            {b.product?.tracking_type === 'serial' ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                                    <Barcode size={12} />
                                                    سيريال
                                                </span>
                                            ) : (
                                                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-800 text-slate-400">
                                                    كمية
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 font-mono font-bold text-white">{b.current_stock}</td>
                                        <td className="p-4 font-mono">
                                            {Number(b.unit_cost || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} SAR
                                        </td>
                                        <td className="p-4 font-mono font-bold text-emerald-400">
                                            {Number(b.total_cost || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} SAR
                                        </td>
                                        <td className="p-4 font-mono">
                                            {Number(b.unit_sale_price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} SAR
                                        </td>
                                        <td className="p-4 font-mono font-bold text-purple-400">
                                            {Number(b.total_sale || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} SAR
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {balances.links && balances.links.length > 3 && (
                    <div className="p-4 border-t border-slate-800 flex justify-center gap-1">
                        {balances.links.map((link, key) => (
                            <Link
                                key={key}
                                href={link.url || '#'}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                                    link.active
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                                } ${!link.url ? 'opacity-40 cursor-not-allowed' : ''}`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
