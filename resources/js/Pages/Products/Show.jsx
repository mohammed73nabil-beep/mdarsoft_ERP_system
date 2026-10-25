import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import {
    Package,
    ArrowRight,
    Edit,
    Layers,
    Smartphone,
    Warehouse as WarehouseIcon,
    DollarSign,
    Shield,
    Tag
} from 'lucide-react';

export default function Show({ product }) {
    const totalStock = product.tracking_type === 'serial'
        ? (product.serials ? product.serials.filter((s) => s.status === 'in_stock').length : 0)
        : (product.stock_balances || []).reduce((acc, b) => acc + Number(b.quantity || 0), 0);

    return (
        <AppLayout title={`تفاصيل المنتج: ${product.name}`}>
            <Head title={product.name} />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
                        <Link href="/products" className="hover:text-white transition">المنتجات</Link>
                        <span>/</span>
                        <span className="text-white font-bold">تفاصيل المنتج</span>
                    </div>
                    <h2 className="text-2xl font-black text-white flex items-center gap-2">
                        <Package className="text-blue-500" size={26} />
                        <span>{product.name}</span>
                    </h2>
                </div>

                <div className="flex items-center gap-2">
                    <Link
                        href={`/products/${product.id}/edit`}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-md transition"
                    >
                        <Edit size={16} />
                        <span>تعديل المنتج</span>
                    </Link>
                    <Link
                        href="/products"
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition border border-slate-700"
                    >
                        <ArrowRight size={16} />
                        <span>العودة للقائمة</span>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Details */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Basic Info Box */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                        <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3 mb-4 flex items-center gap-2">
                            <Tag className="text-blue-400" size={18} />
                            <span>المواصفات والبيانات الأساسية</span>
                        </h3>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                                <span className="text-slate-400 block text-sm mb-1">رمز SKU:</span>
                                <span className="font-mono font-bold text-blue-400 text-base">{product.sku}</span>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                                <span className="text-slate-400 block text-sm mb-1">الباركود:</span>
                                <span className="font-mono text-slate-200 text-base">{product.barcode || '—'}</span>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                                <span className="text-slate-400 block text-sm mb-1">الصنف:</span>
                                <span className="font-bold text-white">{product.category?.name || '—'}</span>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                                <span className="text-slate-400 block text-sm mb-1">العلامة التجارية:</span>
                                <span className="font-bold text-white">{product.brand?.name || '—'}</span>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                                <span className="text-slate-400 block text-sm mb-1">الوحدة:</span>
                                <span className="font-bold text-white">{product.unit?.name} ({product.unit?.symbol || product.unit?.name})</span>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                                <span className="text-slate-400 block text-sm mb-1">الضمان:</span>
                                <span className="font-bold text-white">
                                    {product.warranty ? `${product.warranty.name} (${product.warranty.duration_months} شهر)` : 'بدون ضمان'}
                                </span>
                            </div>
                        </div>

                        {product.description && (
                            <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800">
                                <span className="text-slate-400 block text-sm mb-1 font-bold">الوصف:</span>
                                <p className="text-slate-300 text-sm leading-relaxed">{product.description}</p>
                            </div>
                        )}
                    </div>

                    {/* Warehouse Balances */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                        <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3 mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <WarehouseIcon className="text-emerald-400" size={18} />
                                <span>أرصدة المخزون حسب المستودع</span>
                            </div>
                            <span className="font-mono font-black text-emerald-400 text-base">
                                إجمالي: {totalStock} {product.unit?.symbol || product.unit?.name}
                            </span>
                        </h3>

                        {product.stock_balances && product.stock_balances.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {product.stock_balances.map((b) => (
                                    <div key={b.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                                        <div>
                                            <div className="font-bold text-white text-sm">{b.warehouse?.name}</div>
                                            <div className="text-slate-400 text-sm">متوسط التكلفة: {Number(b.avg_cost).toFixed(2)} ر.س</div>
                                        </div>
                                        <div className="font-mono font-black text-lg text-emerald-400">
                                            {Number(b.quantity).toFixed(2)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-6 text-center text-slate-500 bg-slate-950 rounded-xl border border-slate-800 text-sm">
                                لا توجد أرصدة مسجلة في أي مستودع حتى الآن.
                            </div>
                        )}
                    </div>

                    {/* Variations if variable */}
                    {product.type === 'variable' && product.variations && product.variations.length > 0 && (
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                            <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3 mb-4">
                                قائمة التباينات والمواصفات ({product.variations.length})
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-right text-sm">
                                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                                        <tr>
                                            <th className="py-2.5 px-3">الاسم</th>
                                            <th className="py-2.5 px-3">SKU</th>
                                            <th className="py-2.5 px-3">الباركود</th>
                                            <th className="py-2.5 px-3">سعر الشراء</th>
                                            <th className="py-2.5 px-3">سعر البيع</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {product.variations.map((v) => (
                                            <tr key={v.id}>
                                                <td className="py-2 px-3 font-bold text-white">{v.name}</td>
                                                <td className="py-2 px-3 font-mono text-blue-400">{v.sku}</td>
                                                <td className="py-2 px-3 font-mono text-slate-300">{v.barcode || '—'}</td>
                                                <td className="py-2 px-3 font-mono text-slate-200">{Number(v.cost_price).toFixed(2)} ر.س</td>
                                                <td className="py-2 px-3 font-mono font-bold text-emerald-400">{Number(v.selling_price).toFixed(2)} ر.س</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar Cards */}
                <div className="space-y-6">
                    {/* Image Box */}
                    {product.image && (
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl text-center">
                            <img
                                src={product.image}
                                alt={product.name}
                                className="w-full max-h-60 object-contain rounded-xl mx-auto border border-slate-800 bg-slate-950"
                            />
                        </div>
                    )}

                    {/* Financial Summary */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                        <h4 className="text-base font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
                            <DollarSign className="text-emerald-400" size={18} />
                            <span>البيانات المالية والتسعير</span>
                        </h4>

                        <div className="space-y-3 text-sm">
                            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                                <span className="text-slate-400">سعر الشراء (التكلفة):</span>
                                <span className="font-mono font-bold text-white">{Number(product.cost_price).toFixed(2)} ر.س</span>
                            </div>
                            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                                <span className="text-slate-400">سعر البيع الافتراضي:</span>
                                <span className="font-mono font-black text-emerald-400 text-base">{Number(product.selling_price).toFixed(2)} ر.س</span>
                            </div>
                            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                                <span className="text-slate-400">أقل سعر بيع مسموح:</span>
                                <span className="font-mono text-slate-300">{Number(product.min_selling_price || 0).toFixed(2)} ر.س</span>
                            </div>
                            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                                <span className="text-slate-400">الضريبة المطبقة:</span>
                                <span className="font-bold text-cyan-400">{product.tax?.name || 'بدون ضريبة'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
