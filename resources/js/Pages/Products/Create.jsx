import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import {
    Package,
    ArrowRight,
    Sparkles,
    Plus,
    Trash2,
    Layers,
    Smartphone,
    DollarSign,
    Info,
    ChevronDown,
    ChevronUp,
    AlertCircle,
    Check
} from 'lucide-react';

export default function Create({ categories, brands, units, warranties, taxes, sellingPriceGroups, accounts, autoSku }) {
    const [marginPercent, setMarginPercent] = useState('25.00');
    const [showAdvancedAccounts, setShowAdvancedAccounts] = useState(false);

    const defaultTax = taxes?.find((t) => Number(t.rate) === 15) || taxes?.[0];

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        sku: autoSku || '',
        barcode: '',
        category_id: '',
        brand_id: '',
        unit_id: units?.[0]?.id || '',
        purchase_unit_id: '',
        warranty_id: '',
        type: 'single', // single | variable | service
        tracking_type: 'none', // none | serial
        cost_price: '0.00',
        selling_price: '0.00',
        min_selling_price: '0.00',
        reorder_level: '5.00',
        tax_id: defaultTax?.id || '',
        income_account_id: accounts?.income?.id || '',
        cogs_account_id: accounts?.cogs?.id || '',
        inventory_account_id: accounts?.inventory?.id || '',
        description: '',
        image: null,
        is_active: true,
        action: 'save', // save | save_and_add_another | save_and_opening_stock
        variations: [],
        price_group_prices: (sellingPriceGroups || []).map((spg) => ({
            selling_price_group_id: spg.id,
            price: '0.00',
        })),
    });

    // Auto-calculate selling price when cost or margin changes
    const handleCostChange = (val) => {
        setData('cost_price', val);
        const cost = parseFloat(val) || 0;
        const margin = parseFloat(marginPercent) || 0;
        const calculatedSelling = cost + (cost * (margin / 100));
        setData((prev) => ({
            ...prev,
            cost_price: val,
            selling_price: calculatedSelling.toFixed(2),
        }));
    };

    const handleMarginChange = (val) => {
        setMarginPercent(val);
        const cost = parseFloat(data.cost_price) || 0;
        const margin = parseFloat(val) || 0;
        const calculatedSelling = cost + (cost * (margin / 100));
        setData('selling_price', calculatedSelling.toFixed(2));
    };

    const handleSellingPriceChange = (val) => {
        setData('selling_price', val);
        const cost = parseFloat(data.cost_price) || 0;
        const selling = parseFloat(val) || 0;
        if (cost > 0) {
            const calculatedMargin = ((selling - cost) / cost) * 100;
            setMarginPercent(calculatedMargin.toFixed(2));
        }
    };

    const generateRandomSku = () => {
        const rnd = 'PRD-' + Math.floor(100000 + Math.random() * 900000);
        setData('sku', rnd);
    };

    const addVariationRow = () => {
        const nextIdx = data.variations.length + 1;
        setData('variations', [
            ...data.variations,
            {
                name: `لون / مقاس ${nextIdx}`,
                sku: `${data.sku || 'PRD'}-V${nextIdx}`,
                barcode: '',
                cost_price: data.cost_price || '0.00',
                selling_price: data.selling_price || '0.00',
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

    const submitWithAction = (actionName) => {
        data.action = actionName;
        post('/products', {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout title="إضافة منتج جديد">
            <Head title="إضافة منتج جديد" />

            {/* Breadcrumb & Title */}
            <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                    <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
                        <Link href="/products" className="hover:text-white transition">المنتجات</Link>
                        <span>/</span>
                        <span className="text-white font-bold">إضافة منتج جديد</span>
                    </div>
                    <h2 className="text-2xl font-black text-white flex items-center gap-2">
                        <Package className="text-blue-500" size={26} />
                        <span>بطاقة تعريف منتج جديد</span>
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

            <form onSubmit={(e) => { e.preventDefault(); submitWithAction('save'); }} className="space-y-6">
                {/* 1. Basic Information Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
                    <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                        <span>1. البيانات الأساسية للمنتج</span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {/* Name */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-slate-300 mb-1">
                                اسم المنتج <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="مثال: آيفون 15 برو ماكس 256 جيجا أو شاحن أنكر 20 واط"
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                            />
                            {errors.name && <div className="text-rose-400 text-sm mt-1">{errors.name}</div>}
                        </div>

                        {/* SKU */}
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="text-sm font-bold text-slate-300">
                                    رمز SKU <span className="text-rose-500">*</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={generateRandomSku}
                                    className="text-sm font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                                >
                                    <Sparkles size={14} />
                                    <span>توليد تلقائي</span>
                                </button>
                            </div>
                            <input
                                type="text"
                                required
                                value={data.sku}
                                onChange={(e) => setData('sku', e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-blue-500"
                            />
                            {errors.sku && <div className="text-rose-400 text-sm mt-1">{errors.sku}</div>}
                        </div>

                        {/* Barcode */}
                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-1">الباركود الدولي</label>
                            <input
                                type="text"
                                value={data.barcode}
                                onChange={(e) => setData('barcode', e.target.value)}
                                placeholder="امسح الباركود بجهاز المسح"
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-blue-500"
                            />
                        </div>

                        {/* Category */}
                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-1">الصنف (التصنيف)</label>
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

                        {/* Brand */}
                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-1">العلامة التجارية (الماركة)</label>
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

                        {/* Base Unit */}
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

                        {/* Warranty */}
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

                        {/* Image */}
                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-1">صورة المنتج</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setData('image', e.target.files[0])}
                                className="w-full text-sm text-slate-400 file:mr-0 file:ml-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer"
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-bold text-slate-300 mb-1">وصف المنتج</label>
                        <textarea
                            rows={2}
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            placeholder="وصف تفصيلي أو ملاحظات إضافية عن المنتج..."
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>
                </div>

                {/* 2. Type & Tracking Mode Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
                    <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-cyan-500"></div>
                        <span>2. نوع المنتج ونظام تتبع المخزون</span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Product Type */}
                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-2">نوع المنتج</label>
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { id: 'single', title: 'منتج فردي (Single)', desc: 'صنف عادي بدون ألوان/مقاسات' },
                                    { id: 'variable', title: 'متغير (Variable)', desc: 'له عدة تباينات أو مواصفات' },
                                    { id: 'service', title: 'خدمة (Service)', desc: 'غير ملموسة ولا تُخزن' },
                                ].map((t) => (
                                    <div
                                        key={t.id}
                                        onClick={() => {
                                            setData((prev) => ({
                                                ...prev,
                                                type: t.id,
                                                tracking_type: t.id === 'service' ? 'none' : prev.tracking_type,
                                            }));
                                        }}
                                        className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                                            data.type === t.id
                                                ? 'bg-blue-600/15 border-blue-500 text-white'
                                                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                                        }`}
                                    >
                                        <span className="font-bold text-sm text-slate-200">{t.title}</span>
                                        <span className="text-sm text-slate-400 mt-1">{t.desc}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Tracking Type */}
                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-2">طريقة تتبع المخزون والأجهزة</label>
                            <div className="grid grid-cols-2 gap-3">
                                <div
                                    onClick={() => setData('tracking_type', 'none')}
                                    className={`p-3.5 rounded-xl border cursor-pointer transition ${
                                        data.tracking_type === 'none'
                                            ? 'bg-blue-600/15 border-blue-500 text-white'
                                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                                    }`}
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <Layers size={18} className="text-slate-300" />
                                        <span className="font-bold text-sm text-slate-200">بدون تتبع (كمية فقط)</span>
                                    </div>
                                    <p className="text-sm text-slate-400">
                                        المنتجات السائبة، الإكسسوارات، والقطع الصغيرة.
                                    </p>
                                </div>

                                <div
                                    onClick={() => {
                                        if (data.type !== 'service') {
                                            setData('tracking_type', 'serial');
                                        }
                                    }}
                                    className={`p-3.5 rounded-xl border cursor-pointer transition ${
                                        data.type === 'service'
                                            ? 'opacity-40 cursor-not-allowed bg-slate-950 border-slate-800'
                                            : data.tracking_type === 'serial'
                                            ? 'bg-cyan-600/15 border-cyan-500 text-white'
                                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                                    }`}
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <Smartphone size={18} className="text-cyan-400" />
                                        <span className="font-bold text-sm text-slate-200">تتبع بالسيريال / IMEI</span>
                                    </div>
                                    <p className="text-sm text-slate-400">
                                        الأجهزة الذكية والشاشات حيث لكل جهاز رقم IMEI مستقل.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2.5 text-sm text-slate-400">
                        <Info size={18} className="text-cyan-400 shrink-0 mt-0.5" />
                        <div>
                            <span className="font-bold text-slate-200">قاعدة استقرار المخزون (DB_SCHEMA):</span> الستوك القديم بالكمية يُدخل بدون سيريال. لا يمكن تغيير نوع التتبع من كمية إلى سيريال أو العكس بعد تسجيل أي حركات مخزنية لهذا المنتج في الدفاتر.
                        </div>
                    </div>
                </div>

                {/* 3. Pricing & Taxes Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
                    <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                        <span>3. التسعير، الهامش، والضريبة</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        {/* Cost Price */}
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

                        {/* Margin % */}
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

                        {/* Selling Price */}
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

                        {/* Min Selling Price */}
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

                        {/* Tax */}
                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-1">الضريبة المطبقة</label>
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

                    {/* Selling Price Groups */}
                    {sellingPriceGroups && sellingPriceGroups.length > 0 && (
                        <div className="pt-4 border-t border-slate-800/80">
                            <h4 className="text-sm font-bold text-slate-300 mb-3">أسعار مجموعات البيع المخصصة (اختياري)</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {sellingPriceGroups.map((spg) => {
                                    const curr = data.price_group_prices.find((p) => p.selling_price_group_id === spg.id);
                                    return (
                                        <div key={spg.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                                            <label className="block text-sm font-bold text-slate-400 mb-1">{spg.name}</label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={curr?.price || ''}
                                                    onChange={(e) => handlePriceGroupChange(spg.id, e.target.value)}
                                                    placeholder="السعر الخاص بالمجموعة"
                                                    className="w-full bg-slate-900 border border-slate-800 rounded-lg pr-3 pl-12 py-1.5 text-sm text-white font-mono focus:outline-none focus:border-blue-500"
                                                />
                                                <span className="absolute left-3 top-1.5 text-sm font-bold text-slate-500">ر.س</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* 4. Variations (Variable Products Only) */}
                {data.type === 'variable' && (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            <div>
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                                    <span>4. تباينات ومواصفات المنتج (Variations)</span>
                                </h3>
                                <p className="text-sm text-slate-400 mt-0.5">حدد تباينات المنتج كالألوان والمقاسات وسعات التخزين</p>
                            </div>

                            <button
                                type="button"
                                onClick={addVariationRow}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm shadow-md transition"
                            >
                                <Plus size={16} />
                                <span>إضافة تباين</span>
                            </button>
                        </div>

                        {data.variations.length === 0 ? (
                            <div className="p-8 text-center text-slate-500 bg-slate-950 rounded-xl border border-dashed border-slate-800">
                                لم تقم بإضافة أي تباين بعد. انقر على زر "إضافة تباين" لتعريف الخيارات.
                            </div>
                        ) : (
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
                                            <tr key={idx} className="hover:bg-slate-800/30">
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
                        )}
                        {errors.variations && <div className="text-rose-400 text-sm">{errors.variations}</div>}
                    </div>
                )}

                {/* 5. Inventory & Reorder Level */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                    <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-purple-500"></div>
                        <span>5. إدارة تنبيهات المخزون</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-1">حد تنبيه انخفاض الكمية (Reorder Level)</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={data.reorder_level}
                                onChange={(e) => setData('reorder_level', e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-purple-500"
                            />
                            <p className="text-sm text-slate-400 mt-1">
                                سيظهر تنبيه انخفاض المخزون في التقارير إذا وصل رصيد المنتج إلى هذا الحد أو أقل.
                            </p>
                        </div>
                    </div>
                </div>

                {/* 6. Advanced Accounting Routing (Collapsible) */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                    <button
                        type="button"
                        onClick={() => setShowAdvancedAccounts(!showAdvancedAccounts)}
                        className="w-full flex items-center justify-between text-left text-white font-bold"
                    >
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-slate-500"></div>
                            <span className="text-lg font-bold">6. حسابات التوجيه المحاسبي (متقدم)</span>
                            <span className="text-sm font-normal text-slate-400 mr-2">(4100 إيرادات، 5100 تكلفة، 1140 مخزون افتراضياً)</span>
                        </div>
                        {showAdvancedAccounts ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>

                    {showAdvancedAccounts && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-5 mt-4 border-t border-slate-800">
                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-1">حساب الإيراد (Sales Revenue)</label>
                                <input
                                    type="text"
                                    disabled
                                    value={accounts?.income ? `${accounts.income.code} - ${accounts.income.name}` : '4100 - إيرادات المبيعات'}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-400 cursor-not-allowed"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-1">حساب التكلفة (COGS)</label>
                                <input
                                    type="text"
                                    disabled
                                    value={accounts?.cogs ? `${accounts.cogs.code} - ${accounts.cogs.name}` : '5100 - تكلفة البضاعة المباعة'}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-400 cursor-not-allowed"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-1">حساب أصل المخزون (Inventory)</label>
                                <input
                                    type="text"
                                    disabled
                                    value={accounts?.inventory ? `${accounts.inventory.code} - ${accounts.inventory.name}` : '1140 - المخزون'}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-400 cursor-not-allowed"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Form Action Buttons */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
                    <Link
                        href="/products"
                        className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm text-center transition border border-slate-700"
                    >
                        إلغاء
                    </Link>

                    <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap justify-end">
                        <button
                            type="button"
                            disabled={processing}
                            onClick={() => submitWithAction('save_and_add_another')}
                            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-400 border border-blue-900/40 font-bold text-sm transition"
                        >
                            حفظ وإضافة آخر
                        </button>

                        <button
                            type="button"
                            disabled={processing}
                            onClick={() => submitWithAction('save_and_opening_stock')}
                            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-600 text-white font-bold text-sm shadow-lg shadow-purple-700/30 transition"
                        >
                            حفظ وأضف مخزون الافتتاح
                        </button>

                        <button
                            type="submit"
                            disabled={processing}
                            onClick={() => submitWithAction('save')}
                            className="w-full sm:w-auto px-8 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition"
                        >
                            {processing ? 'جارِ الحفظ...' : 'حفظ المنتج'}
                        </button>
                    </div>
                </div>
            </form>
        </AppLayout>
    );
}
