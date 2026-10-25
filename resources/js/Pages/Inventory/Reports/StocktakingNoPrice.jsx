import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '../../../Layouts/AppLayout';
import {
    ClipboardList,
    Printer,
    Filter,
    Search,
    RotateCcw,
    Barcode
} from 'lucide-react';

export default function StocktakingNoPrice({ balances, filters, warehouses, categories }) {
    const [warehouseId, setWarehouseId] = useState(filters?.warehouse_id || '');
    const [categoryId, setCategoryId] = useState(filters?.category_id || '');
    const [search, setSearch] = useState(filters?.search || '');

    const applyFilters = () => {
        router.get('/inventory/reports/stocktaking-no-price', {
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
        router.get('/inventory/reports/stocktaking-no-price');
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <AppLayout title="استمارة الجرد الميداني (بدون أسعار)">
            <Head title="استمارة الجرد الميداني بدون أسعار" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 print:hidden">
                <div>
                    <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
                        <Link href="/inventory" className="hover:text-white transition">المخازن</Link>
                        <span>/</span>
                        <span className="text-white font-bold">تقارير الجرد</span>
                    </div>
                    <h2 className="text-2xl font-black text-white flex items-center gap-2">
                        <ClipboardList className="text-amber-500" size={26} />
                        <span>استمارة الجرد الميداني الفعلي (بدون أسعار)</span>
                    </h2>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-bold border border-slate-700 transition"
                    >
                        <Printer size={16} />
                        <span>طباعة الاستمارة</span>
                    </button>

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
                            className="px-3 py-1.5 rounded-lg font-bold bg-amber-600 text-white shadow"
                        >
                            استمارة الجرد الميداني
                        </Link>
                        <Link
                            href="/inventory/reports/summary"
                            className="px-3 py-1.5 rounded-lg font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition"
                        >
                            ملخص الأرصدة
                        </Link>
                    </div>
                </div>
            </div>

            {/* Filter Panel */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6 shadow-xl print:hidden">
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1">المستودع / المخزن</label>
                        <select
                            value={warehouseId}
                            onChange={(e) => setWarehouseId(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm focus:border-amber-500 focus:outline-none"
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
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm focus:border-amber-500 focus:outline-none"
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
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm focus:border-amber-500 focus:outline-none"
                        />
                    </div>

                    <div className="flex items-end gap-2">
                        <button
                            type="button"
                            onClick={applyFilters}
                            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-bold transition"
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

            {/* Printable Count Sheet */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl print:bg-white print:text-black print:border-none print:shadow-none">
                <div className="hidden print:block p-4 text-center border-b">
                    <h1 className="text-xl font-black text-black">كشف جرد الأصناف الفعلي بالمستودع</h1>
                    <p className="text-xs text-gray-600 mt-1">تاريخ الطباعة: {new Date().toLocaleDateString('en-GB')}</p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-right text-sm">
                        <thead className="bg-slate-950/60 text-slate-400 text-xs font-bold border-b border-slate-800 print:bg-gray-100 print:text-black">
                            <tr>
                                <th className="p-4 print:p-2 border-b print:border">#</th>
                                <th className="p-4 print:p-2 border-b print:border">المستودع</th>
                                <th className="p-4 print:p-2 border-b print:border">رمز الصنف (SKU)</th>
                                <th className="p-4 print:p-2 border-b print:border">اسم المنتج / المتغير</th>
                                <th className="p-4 print:p-2 border-b print:border">الوحدة</th>
                                <th className="p-4 print:p-2 border-b print:border">نوع التتبع</th>
                                <th className="p-4 print:p-2 border-b print:border text-center">الرصيد الدفتري</th>
                                <th className="p-4 print:p-2 border-b print:border text-center w-32 print:w-28">العدد الفعلي المجرود</th>
                                <th className="p-4 print:p-2 border-b print:border text-center w-28 print:w-24">الفرق (+/-)</th>
                                <th className="p-4 print:p-2 border-b print:border w-40 print:w-36">توقيع الجارد / ملاحظات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-slate-200 print:text-black print:divide-gray-300">
                            {balances.data?.length === 0 ? (
                                <tr>
                                    <td colSpan="10" className="text-center p-8 text-slate-500">
                                        لا توجد بيانات مطابقة للفلاتر المحددة.
                                    </td>
                                </tr>
                            ) : (
                                balances.data?.map((b, idx) => (
                                    <tr key={b.id} className="hover:bg-slate-800/30 print:hover:bg-transparent">
                                        <td className="p-4 print:p-2 text-slate-500 print:text-black font-mono print:border">{balances.from + idx}</td>
                                        <td className="p-4 print:p-2 font-medium text-slate-300 print:text-black print:border">{b.warehouse?.name}</td>
                                        <td className="p-4 print:p-2 font-mono text-xs text-slate-400 print:text-black print:border">{b.product?.sku}</td>
                                        <td className="p-4 print:p-2 font-bold text-white print:text-black print:border">
                                            {b.product?.name}
                                            {b.variation && (
                                                <span className="text-xs text-blue-400 print:text-gray-700 block font-normal">({b.variation.name})</span>
                                            )}
                                        </td>
                                        <td className="p-4 print:p-2 text-xs text-slate-400 print:text-black print:border">{b.product?.unit?.name || 'قطعة'}</td>
                                        <td className="p-4 print:p-2 print:border">
                                            {b.product?.tracking_type === 'serial' ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20 print:border-none print:text-black">
                                                    <Barcode size={12} className="print:hidden" />
                                                    سيريال
                                                </span>
                                            ) : (
                                                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-800 text-slate-400 print:bg-transparent print:text-black">
                                                    كمية
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 print:p-2 font-mono font-bold text-white print:text-black text-center print:border">{b.current_stock}</td>
                                        <td className="p-4 print:p-2 text-center bg-slate-950/40 print:bg-transparent print:border"></td>
                                        <td className="p-4 print:p-2 text-center bg-slate-950/40 print:bg-transparent print:border"></td>
                                        <td className="p-4 print:p-2 text-xs text-slate-400 print:border"></td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {balances.links && balances.links.length > 3 && (
                    <div className="p-4 border-t border-slate-800 flex justify-center gap-1 print:hidden">
                        {balances.links.map((link, key) => (
                            <Link
                                key={key}
                                href={link.url || '#'}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                                    link.active
                                        ? 'bg-amber-600 text-white'
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
