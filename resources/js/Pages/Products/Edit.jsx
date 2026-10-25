import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import {
    Package,
    ArrowRight,
    Plus,
    Trash2,
    Layers,
    Smartphone,
    Info,
    ChevronDown,
    ChevronUp,
    AlertTriangle,
    Lock
} from 'lucide-react';

export default function Edit({ product, hasMovements, categories, brands, units, warranties, taxes, sellingPriceGroups, accounts }) {
    const cost = parseFloat(product.cost_price) || 0;
    const selling = parseFloat(product.selling_price) || 0;
    const initialMargin = cost > 0 ? (((selling - cost) / cost) * 100).toFixed(2) : '25.00';

    const [marginPercent, setMarginPercent] = useState(initialMargin);
    const [showAdvancedAccounts, setShowAdvancedAccounts] = useState(false);

    const { data, setData, put, processing, errors } = useForm({
        name: product.name || '',
        sku: product.sku || '',
        barcode: product.barcode || '',
        category_id: product.category_id || '',
        brand_id: product.brand_id || '',
        unit_id: product.unit_id || '',
        purchase_unit_id: product.purchase_unit_id || '',
        warranty_id: product.warranty_id || '',
        type: product.type || 'single',
        tracking_type: product.tracking_type || 'none',
        cost_price: parseFloat(product.cost_price).toFixed(2),
        selling_price: parseFloat(product.selling_price).toFixed(2),
        min_selling_price: parseFloat(product.min_selling_price || 0).toFixed(2),
        reorder_level: parseFloat(product.reorder_level || 0).toFixed(2),
        tax_id: product.tax_id || '',
        income_account_id: product.income_account_id || '',
        cogs_account_id: product.cogs_account_id || '',
        inventory_account_id: product.inventory_account_id || '',
        description: product.description || '',
        image: null,
        is_active: Boolean(product.is_active),
        variations: (product.variations || []).map((v) => ({
            id: v.id,
            name: v.name,
            sku: v.sku,
            barcode: v.barcode || '',
            cost_price: parseFloat(v.cost_price || 0).toFixed(2),
            selling_price: parseFloat(v.selling_price || 0).toFixed(2),
        })),
        price_group_prices: (sellingPriceGroups || []).map((spg) => {
            const found = (product.price_group_prices || []).find((p) => p.selling_price_group_id === spg.id);
            return {
                selling_price_group_id: spg.id,
                price: found ? parseFloat(found.price).toFixed(2) : '0.00',
            };
        }),
    });

    const handleCostChange = (val) => {
        setData('cost_price', val);
        const c = parseFloat(val) || 0;
        const m = parseFloat(marginPercent) || 0;
        const calculatedSelling = c + (c * (m / 100));
        setData((prev) => ({
            ...prev,
            cost_price: val,
            selling_price: calculatedSelling.toFixed(2),
        }));
    };

    const handleMarginChange = (val) => {
        setMarginPercent(val);
        const c = parseFloat(data.cost_price) || 0;
        const m = parseFloat(val) || 0;
        const calculatedSelling = c + (c * (m / 100));
        setData('selling_price', calculatedSelling.toFixed(2));
    };

    const handleSellingPriceChange = (val) => {
        setData('selling_price', val);
        const c = parseFloat(data.cost_price) || 0;
        const s = parseFloat(val) || 0;
        if (c > 0) {
            const calculatedMargin = ((s - c) / c) * 100;
            setMarginPercent(calculatedMargin.toFixed(2));
        }
    };

    const addVariationRow = () => {
        const nextIdx = data.variations.length + 1;
        setData('variations', [
            ...data.variations,
            {
                id: null,
                name: `تباين ${nextIdx}`,
                sku: `${data.sku || 'PRD'}-V${nextIdx}`,
                barcode: '',
                cost_price: data.cost_price,
                selling_price: data.selling_price,
            },
        ]);
    };

    const removeVariationRow = (index) => {
        setData('variations', data.variations.filter((_, i) => i !== index));
    };

    const handleVariationChange = (index, field, value) => {
        const updated = [...data.variations];
        updated[index][field] = value;
        setData('variations', updated);
    };

    const handlePriceGroupChange = (spgId, value) => {
        const updated = data.price_group_prices.map((pg) => {
            if (pg.selling_price_group_id === spgId) {
                return { ...pg, price: value };
            }
            return pg;
        });
        setData('price_group_prices', updated);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        put(`/products/${product.id}`, {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout title={`تعديل المنتج: ${product.name}`}>
            <Head title={`تعديل: ${product.name}`} />

            <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                    <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
                        <Link href="/products" className="hover:text-white transition">المنتجات</Link>
                        <span>/</span>
                        <span className="text-white font-bold">تعديل المنتج</span>
                    </div>
                    <h2 className="text-2xl font-black text-white flex items-center gap-2">
                        <Package className="text-blue-500" size={26} />
                        <span>تعديل بطاقة المنتج: {product.name}</span>
                    </h2>
                </div>

                <Link
                    href="/products"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition border border-slate-700"
                >
                    <ArrowRight size={16} />
                    <span>العودة للقائمة</span>
                </Link>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* 1. Basic Info */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
                    <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                        <span>1. البيانات الأساسية</span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-slate-300 mb-1">
                                اسم المنتج <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                            />
                            {errors.name && <div className="text-rose-400 text-sm mt-1">{errors.name}</div>}
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-1">
                                رمز SKU <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={data.sku}
                                onChange={(e) => setData('sku', e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-blue-500"
                            />
                            {errors.sku && <div className="text-rose-400 text-sm mt-1">{errors.sku}</div>}
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-1">الباركود</label>
                            <input
                                type="text"
                                value={data.barcode}
                                onChange={(e) => setData('barcode', e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-1">الصنف</label>
                            <select
                                value={data.category_id}
                                onChange={(e) => setData('category_id', e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                            >
                                <option value="">اختر الصنف...</option>
                                {categories.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-1">العلامة التجارية</label>
                            <select
                                value={data.brand_id}
                                onChange={(e) => setData('brand_id', e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                            >
                                <option value="">اختر العلامة...</option>
                                {brands.map((b) => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-1">
                                الوحدة الأساسية <span className="text-rose-500">*</span>
                            </label>
                            <select
                                required
                                value={data.unit_id}
                                onChange={(e) => setData('unit_id', e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                            >
                                {units.map((u) => (
                                    <option key={u.id} value={u.id}>{u.name} ({u.symbol || u.name})</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-1">الضمان</label>
                            <select
                                value={data.warranty_id}
                                onChange={(e) => setData('warranty_id', e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                            >
                                <option value="">بدون ضمان</option>
                                {warranties.map((w) => (
                                    <option key={w.id} value={w.id}>{w.name} ({w.duration_months} شهر)</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-300 mb-1">وصف المنتج</label>
                        <textarea
                            rows={2}
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>
                </div>

                {/* 2. Type & Tracking Mode (Locked if has movements) */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                    <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-cyan-500"></div>
                        <span>2. نوع المنتج ونظام التتبع</span>
                        {hasMovements && (
                            <span className="mr-auto inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-950/60 text-amber-400 border border-amber-800 text-sm font-bold">
                                <Lock size={14} />
                                <span>نوع التتبع مقفل (لوجود حركات مخزنية)</span>
                            </span>
                        )}
                    </h3>

                    {hasMovements && (
                        <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/60 flex items-center gap-2.5 text-sm text-amber-300">
                            <AlertTriangle size={18} className="shrink-0" />
                            <span>
                                لا يمكن تغيير نوع التتبع (سيريال / كمية) لهذا المنتج نظراً لوجود قيود وحركات مخزنية سابقة مرتبطة به.
                            </span>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-2">نوع التتبع الحالي</label>
                            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3">
                                {product.tracking_type === 'serial' ? (
                                    <>
                                        <Smartphone size={22} className="text-cyan-400" />
                                        <div>
                                            <div className="font-bold text-white text-sm">متتبع بالأرقام التسلسلية (Serial / IMEI)</div>
                                            <div className="text-slate-400 text-sm">يتم تسجيل واستعلام كل جهاز بسرياله المنفصل.</div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <Layers size={22} className="text-blue-400" />
                                        <div>
                                            <div className="font-bold text-white text-sm">متتبع بالكمية الإجمالية فقط (None)</div>
                                            <div className="text-slate-400 text-sm">تتبع كميات وحساب المتوسط المرجح التلقائي.</div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-2">نوع المنتج</label>
                            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white font-bold">
                                {product.type === 'single' && 'منتج فردي (Single)'}
                                {product.type === 'variable' && 'منتج متعدد التباينات (Variable)'}
                                {product.type === 'service' && 'خدمة (Service)'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Pricing */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
                    <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                        <span>3. التسعير والضريبة</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-1">
                                سعر الشراء (التكلفة) <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    required
                                    value={data.cost_price}
                                    onChange={(e) => handleCostChange(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-3 pl-12 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
                                />
                                <span className="absolute left-3 top-2.5 text-sm font-bold text-slate-500">ر.س</span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-1">هامش الربح %</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    step="0.1"
                                    value={marginPercent}
                                    onChange={(e) => handleMarginChange(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-3 pl-8 py-2.5 text-sm text-cyan-400 font-mono focus:outline-none focus:border-cyan-500"
                                />
                                <span className="absolute left-3 top-2.5 text-sm font-bold text-slate-500">%</span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-1">
                                سعر البيع الافتراضي <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    required
                                    value={data.selling_price}
                                    onChange={(e) => handleSellingPriceChange(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-3 pl-12 py-2.5 text-sm text-emerald-400 font-bold font-mono focus:outline-none focus:border-emerald-500"
                                />
                                <span className="absolute left-3 top-2.5 text-sm font-bold text-slate-500">ر.س</span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-1">أقل سعر بيع مسموح</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={data.min_selling_price}
                                    onChange={(e) => setData('min_selling_price', e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-3 pl-12 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
                                />
                                <span className="absolute left-3 top-2.5 text-sm font-bold text-slate-500">ر.س</span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-1">الضريبة</label>
                            <select
                                value={data.tax_id}
                                onChange={(e) => setData('tax_id', e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                            >
                                <option value="">بدون ضريبة</option>
                                {taxes.map((t) => (
                                    <option key={t.id} value={t.id}>{t.name} ({Number(t.rate)}%)</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* 4. Variations for variable product */}
                {data.type === 'variable' && (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                                <span>4. تباينات المنتج</span>
                            </h3>

                            <button
                                type="button"
                                onClick={addVariationRow}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm shadow-md transition"
                            >
                                <Plus size={16} />
                                <span>إضافة تباين</span>
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-right text-sm">
                                <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                                    <tr>
                                        <th className="py-2.5 px-3">اسم التباين</th>
                                        <th className="py-2.5 px-3">رمز SKU</th>
                                        <th className="py-2.5 px-3">الباركود</th>
                                        <th className="py-2.5 px-3">سعر الشراء</th>
                                        <th className="py-2.5 px-3">سعر البيع</th>
                                        <th className="py-2.5 px-3 text-left w-12">حذف</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {data.variations.map((v, idx) => (
                                        <tr key={idx}>
                                            <td className="py-2 px-3">
                                                <input
                                                    type="text"
                                                    required
                                                    value={v.name}
                                                    onChange={(e) => handleVariationChange(idx, 'name', e.target.value)}
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-sm text-white"
                                                />
                                            </td>
                                            <td className="py-2 px-3">
                                                <input
                                                    type="text"
                                                    required
                                                    value={v.sku}
                                                    onChange={(e) => handleVariationChange(idx, 'sku', e.target.value)}
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-sm text-blue-400 font-mono"
                                                />
                                            </td>
                                            <td className="py-2 px-3">
                                                <input
                                                    type="text"
                                                    value={v.barcode}
                                                    onChange={(e) => handleVariationChange(idx, 'barcode', e.target.value)}
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-sm text-white font-mono"
                                                />
                                            </td>
                                            <td className="py-2 px-3">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={v.cost_price}
                                                    onChange={(e) => handleVariationChange(idx, 'cost_price', e.target.value)}
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-sm text-white font-mono"
                                                />
                                            </td>
                                            <td className="py-2 px-3">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={v.selling_price}
                                                    onChange={(e) => handleVariationChange(idx, 'selling_price', e.target.value)}
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-sm text-emerald-400 font-bold font-mono"
                                                />
                                            </td>
                                            <td className="py-2 px-3 text-left">
                                                <button
                                                    type="button"
                                                    onClick={() => removeVariationRow(idx)}
                                                    className="p-1.5 text-rose-400 hover:bg-rose-950/50 rounded-lg"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* 5. Inventory Reorder Level */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                    <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-3 mb-4 flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-purple-500"></div>
                        <span>5. حد تنبيه الكمية</span>
                    </h3>

                    <div className="w-full sm:w-80">
                        <label className="block text-sm font-bold text-slate-300 mb-1">حد تنبيه انخفاض المخزون</label>
                        <input
                            type="number"
                            step="0.01"
                            value={data.reorder_level}
                            onChange={(e) => setData('reorder_level', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-purple-500"
                        />
                    </div>
                </div>

                {/* Form Buttons */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center justify-between">
                    <Link
                        href="/products"
                        className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition border border-slate-700"
                    >
                        إلغاء
                    </Link>

                    <button
                        type="submit"
                        disabled={processing}
                        className="px-8 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition disabled:opacity-50"
                    >
                        {processing ? 'جارِ الحفظ...' : 'حفظ التعديلات'}
                    </button>
                </div>
            </form>
        </AppLayout>
    );
}
