import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    ShoppingCart,
    Plus,
    Trash2,
    Save,
    ArrowRight,
    Building2,
    Warehouse,
    UserCheck,
    Calendar,
    Tag,
    Hash,
    DollarSign,
    CheckCircle2,
    AlertCircle,
    Percent,
} from 'lucide-react';

export default function SaleCreate({
    customers = [],
    branches = [],
    warehouses = [],
    products = [],
    taxes = [],
    paymentMethods = [],
    treasuries = [],
    bankAccounts = [],
    representatives = [],
    discounts = [],
    defaultBranchId = null,
}) {
    const { data, setData, post, processing, errors } = useForm({
        branch_id: defaultBranchId || (branches[0]?.id ?? ''),
        warehouse_id: warehouses[0]?.id ?? '',
        contact_id: '',
        date: new Date().toISOString().split('T')[0],
        representative_id: '',
        discount_id: '',
        discount_type: '',
        discount_value: 0,
        shipping_amount: 0,
        notes: '',
        lines: [
            {
                product_id: '',
                variation_id: '',
                unit_id: '',
                quantity: 1,
                unit_price: 0,
                discount_type: 'fixed',
                discount_value: 0,
                discount_amount: 0,
                tax_id: '',
                tax_amount: 0,
                total_amount: 0,
                serial_ids: [],
                notes: '',
            },
        ],
        payments: [],
    });

    const [withPayment, setWithPayment] = useState(false);
    const [initialPayment, setInitialPayment] = useState({
        amount: 0,
        payment_method_id: paymentMethods[0]?.id ?? '',
        date: new Date().toISOString().split('T')[0],
    });

    const handleProductChange = (index, productId) => {
        const prod = products.find((p) => p.id === Number(productId));
        const updated = [...data.lines];

        if (prod) {
            const price = Number(prod.selling_price || 0);
            const qty = Number(updated[index].quantity || 1);
            const lineSubtotal = price * qty;

            updated[index] = {
                ...updated[index],
                product_id: prod.id,
                unit_id: prod.unit_id || '',
                unit_price: price,
                tax_id: prod.tax_id || '',
                total_amount: lineSubtotal,
                serial_ids: [],
            };
        } else {
            updated[index] = {
                ...updated[index],
                product_id: '',
                unit_id: '',
                unit_price: 0,
                total_amount: 0,
                serial_ids: [],
            };
        }

        setData('lines', updated);
    };

    const handleLineChange = (index, field, value) => {
        const updated = [...data.lines];
        updated[index][field] = value;

        // Recalculate line total
        const qty = Number(updated[index].quantity || 0);
        const price = Number(updated[index].unit_price || 0);
        let disc = 0;

        if (updated[index].discount_type === 'percentage') {
            disc = (qty * price) * (Number(updated[index].discount_value || 0) / 100);
        } else {
            disc = Number(updated[index].discount_value || 0);
        }
        updated[index].discount_amount = disc;

        const subtotal = Math.max(0, (qty * price) - disc);
        const tax = Number(updated[index].tax_amount || 0);
        updated[index].total_amount = subtotal + tax;

        setData('lines', updated);
    };

    const addLine = () => {
        setData('lines', [
            ...data.lines,
            {
                product_id: '',
                variation_id: '',
                unit_id: '',
                quantity: 1,
                unit_price: 0,
                discount_type: 'fixed',
                discount_value: 0,
                discount_amount: 0,
                tax_id: '',
                tax_amount: 0,
                total_amount: 0,
                serial_ids: [],
                notes: '',
            },
        ]);
    };

    const removeLine = (index) => {
        if (data.lines.length === 1) return;
        setData('lines', data.lines.filter((_, i) => i !== index));
    };

    const handleSerialToggle = (lineIndex, serialId) => {
        const updated = [...data.lines];
        const currentSerials = updated[lineIndex].serial_ids || [];

        if (currentSerials.includes(serialId)) {
            updated[lineIndex].serial_ids = currentSerials.filter((id) => id !== serialId);
        } else {
            updated[lineIndex].serial_ids = [...currentSerials, serialId];
        }

        updated[lineIndex].quantity = updated[lineIndex].serial_ids.length;

        const price = Number(updated[lineIndex].unit_price || 0);
        updated[lineIndex].total_amount = price * updated[lineIndex].quantity;

        setData('lines', updated);
    };

    // Calculate totals
    const linesSubtotal = data.lines.reduce((sum, l) => sum + Math.max(0, (Number(l.quantity || 0) * Number(l.unit_price || 0)) - Number(l.discount_amount || 0)), 0);
    const linesTaxTotal = data.lines.reduce((sum, l) => sum + Number(l.tax_amount || 0), 0);

    let headerDiscount = 0;
    if (data.discount_id) {
        const discObj = discounts.find((d) => d.id === Number(data.discount_id));
        if (discObj) {
            headerDiscount = discObj.type === 'percentage'
                ? linesSubtotal * (Number(discObj.value) / 100)
                : Number(discObj.value);
        }
    } else if (data.discount_type === 'percentage') {
        headerDiscount = linesSubtotal * (Number(data.discount_value || 0) / 100);
    } else if (data.discount_type === 'fixed') {
        headerDiscount = Number(data.discount_value || 0);
    }

    const shipping = Number(data.shipping_amount || 0);
    const grandTotal = Math.max(0, linesSubtotal - headerDiscount) + linesTaxTotal + shipping;

    const handleSubmit = (e) => {
        e.preventDefault();

        const payload = {
            ...data,
            payments: withPayment && Number(initialPayment.amount) > 0 ? [initialPayment] : [],
        };

        post('/sales', {
            data: payload,
        });
    };

    const filteredWarehouses = warehouses.filter(
        (w) => !data.branch_id || String(w.branch_id) === String(data.branch_id)
    );

    return (
        <AppLayout title="إضافة فاتورة بيع جديدة">
            <Head title="إضافة فاتورة بيع جديدة" />

            <div className="p-6 max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <Link
                            href="/sales/all"
                            className="inline-flex items-center gap-1 text-slate-400 hover:text-white text-sm mb-2 transition-colors"
                        >
                            <ArrowRight className="w-4 h-4" />
                            العودة لقائمة المبيعات
                        </Link>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            <ShoppingCart className="w-7 h-7 text-emerald-500" />
                            إنشاء فاتورة مبيعات جديدة
                        </h1>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Info */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
                        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2 border-b border-slate-800 pb-2">
                            <Building2 className="w-4 h-4 text-emerald-400" />
                            بيانات الفاتورة والعميل
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="text-xs text-slate-400 mb-1 block">الفرع *</label>
                                <select
                                    value={data.branch_id}
                                    onChange={(e) => setData('branch_id', e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                >
                                    {branches.map((b) => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </select>
                                {errors.branch_id && <p className="text-rose-500 text-xs mt-1">{errors.branch_id}</p>}
                            </div>

                            <div>
                                <label className="text-xs text-slate-400 mb-1 block">المستودع المصدر *</label>
                                <select
                                    value={data.warehouse_id}
                                    onChange={(e) => setData('warehouse_id', e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                >
                                    {filteredWarehouses.map((w) => (
                                        <option key={w.id} value={w.id}>{w.name}</option>
                                    ))}
                                </select>
                                {errors.warehouse_id && <p className="text-rose-500 text-xs mt-1">{errors.warehouse_id}</p>}
                            </div>

                            <div>
                                <label className="text-xs text-slate-400 mb-1 block">العميل</label>
                                <select
                                    value={data.contact_id}
                                    onChange={(e) => setData('contact_id', e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                >
                                    <option value="">عميل نقدي (بدون حساب آجل)</option>
                                    {customers.map((c) => (
                                        <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>
                                    ))}
                                </select>
                                {errors.contact_id && <p className="text-rose-500 text-xs mt-1">{errors.contact_id}</p>}
                            </div>

                            <div>
                                <label className="text-xs text-slate-400 mb-1 block">تاريخ الفاتورة *</label>
                                <input
                                    type="date"
                                    value={data.date}
                                    onChange={(e) => setData('date', e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                                {errors.date && <p className="text-rose-500 text-xs mt-1">{errors.date}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Line Items */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                                <Tag className="w-4 h-4 text-emerald-400" />
                                بنود الفاتورة والمنتجات
                            </h2>

                            <button
                                type="button"
                                onClick={addLine}
                                className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                إضافة سطر جديد
                            </button>
                        </div>

                        {errors.lines && <p className="text-rose-500 text-xs">{errors.lines}</p>}

                        <div className="space-y-4">
                            {data.lines.map((line, idx) => {
                                const selectedProduct = products.find((p) => p.id === Number(line.product_id));
                                const availableSerials = selectedProduct?.serials?.filter(
                                    (s) => String(s.warehouse_id) === String(data.warehouse_id)
                                ) || [];

                                return (
                                    <div key={idx} className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-4 space-y-3">
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                                            {/* Product Select */}
                                            <div className="md:col-span-4">
                                                <label className="text-xs text-slate-400 mb-1 block">المنتج *</label>
                                                <select
                                                    value={line.product_id}
                                                    onChange={(e) => handleProductChange(idx, e.target.value)}
                                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                                >
                                                    <option value="">اختر المنتج...</option>
                                                    {products.map((p) => (
                                                        <option key={p.id} value={p.id}>
                                                            {p.name} {p.sku ? `(${p.sku})` : ''} - سعر: {p.selling_price} ر.س
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Quantity */}
                                            <div className="md:col-span-2">
                                                <label className="text-xs text-slate-400 mb-1 block">
                                                    الكمية {selectedProduct?.tracking_type === 'serial' && '(من السيريالات)'}
                                                </label>
                                                <input
                                                    type="number"
                                                    step="any"
                                                    min="1"
                                                    readOnly={selectedProduct?.tracking_type === 'serial'}
                                                    value={line.quantity}
                                                    onChange={(e) => handleLineChange(idx, 'quantity', e.target.value)}
                                                    className={`w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                                                        selectedProduct?.tracking_type === 'serial' ? 'bg-slate-950 text-slate-400 cursor-not-allowed' : ''
                                                    }`}
                                                />
                                            </div>

                                            {/* Unit Price */}
                                            <div className="md:col-span-2">
                                                <label className="text-xs text-slate-400 mb-1 block">سعر البيع</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={line.unit_price}
                                                    onChange={(e) => handleLineChange(idx, 'unit_price', e.target.value)}
                                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                                />
                                            </div>

                                            {/* Line Discount */}
                                            <div className="md:col-span-2">
                                                <label className="text-xs text-slate-400 mb-1 block">خصم السطر</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={line.discount_value}
                                                    onChange={(e) => handleLineChange(idx, 'discount_value', e.target.value)}
                                                    placeholder="قيمة الخصم"
                                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                                />
                                            </div>

                                            {/* Line Total */}
                                            <div className="md:col-span-1">
                                                <label className="text-xs text-slate-400 mb-1 block">الإجمالي</label>
                                                <span className="block text-sm font-bold text-white py-1.5">
                                                    {Number(line.total_amount || 0).toFixed(2)}
                                                </span>
                                            </div>

                                            {/* Remove Line */}
                                            <div className="md:col-span-1 flex justify-center pb-1">
                                                <button
                                                    type="button"
                                                    onClick={() => removeLine(idx)}
                                                    className="p-1.5 text-slate-400 hover:text-rose-400 bg-slate-900 hover:bg-slate-750 rounded border border-slate-700 transition-colors"
                                                    title="حذف السطر"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Serial Numbers Selector for Serial Tracked Products */}
                                        {selectedProduct?.tracking_type === 'serial' && (
                                            <div className="pt-2 border-t border-slate-700/60 bg-slate-900/60 p-3 rounded-lg space-y-2">
                                                <div className="flex items-center justify-between text-xs text-slate-300">
                                                    <span className="font-semibold flex items-center gap-1.5 text-emerald-400">
                                                        <Hash className="w-3.5 h-3.5" />
                                                        تحديد الأجهزة بالسيريال (المتوفر بالمستودع: {availableSerials.length})
                                                    </span>
                                                    <span>تم تحديد: {line.serial_ids?.length || 0} جهاز</span>
                                                </div>

                                                {availableSerials.length === 0 ? (
                                                    <p className="text-rose-400 text-xs">
                                                        لا توجد أرقام تسلسلية بحالة متوفرة (in_stock) في هذا المستودع لهذا المنتج.
                                                    </p>
                                                ) : (
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-36 overflow-y-auto pr-1">
                                                        {availableSerials.map((s) => {
                                                            const isSelected = line.serial_ids?.includes(s.id);
                                                            return (
                                                                <button
                                                                    key={s.id}
                                                                    type="button"
                                                                    onClick={() => handleSerialToggle(idx, s.id)}
                                                                    className={`px-2.5 py-1.5 text-xs rounded border text-right transition-colors ${
                                                                        isSelected
                                                                            ? 'bg-emerald-900/50 border-emerald-500 text-emerald-200 font-semibold'
                                                                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                                                                    }`}
                                                                >
                                                                    <div className="font-mono">{s.serial_number}</div>
                                                                    {s.imei1 && <div className="text-[10px] text-slate-400 font-mono">IMEI: {s.imei1}</div>}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Discounts, Shipping & Payments */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Header Discounts & Shipping */}
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
                            <h2 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                                <Percent className="w-4 h-4 text-emerald-400" />
                                الخصومات والشحن
                            </h2>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-slate-400 mb-1 block">خصم مخصص من النظام</label>
                                    <select
                                        value={data.discount_id}
                                        onChange={(e) => setData('discount_id', e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                    >
                                        <option value="">بدون خصم تلقائي</option>
                                        {discounts.map((d) => (
                                            <option key={d.id} value={d.id}>
                                                {d.name} ({d.value} {d.type === 'percentage' ? '%' : 'ر.س'})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs text-slate-400 mb-1 block">رسوم الشحن والتوصيل</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={data.shipping_amount}
                                        onChange={(e) => setData('shipping_amount', e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                    />
                                </div>
                            </div>

                            {/* Initial Payment Toggle */}
                            <div className="pt-3 border-t border-slate-800 space-y-3">
                                <label className="inline-flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={withPayment}
                                        onChange={(e) => {
                                            setWithPayment(e.target.checked);
                                            if (e.target.checked) {
                                                setInitialPayment({
                                                    ...initialPayment,
                                                    amount: grandTotal,
                                                });
                                            }
                                        }}
                                        className="rounded border-slate-700 bg-slate-800 text-emerald-600 focus:ring-emerald-500"
                                    />
                                    <span className="text-sm font-medium text-white">تسجيل سداد فوري (نقداً أو شبكة)</span>
                                </label>

                                {withPayment && (
                                    <div className="grid grid-cols-2 gap-3 p-3 bg-slate-800/40 rounded-lg border border-slate-700/60">
                                        <div>
                                            <label className="text-xs text-slate-400 mb-1 block">المبلغ المدفوع</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={initialPayment.amount}
                                                onChange={(e) => setInitialPayment({ ...initialPayment, amount: e.target.value })}
                                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-xs text-slate-400 mb-1 block">طريقة الدفع</label>
                                            <select
                                                value={initialPayment.payment_method_id}
                                                onChange={(e) => setInitialPayment({ ...initialPayment, payment_method_id: e.target.value })}
                                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                            >
                                                {paymentMethods.map((pm) => (
                                                    <option key={pm.id} value={pm.id}>{pm.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Summary & Submit */}
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between space-y-4">
                            <h2 className="text-sm font-semibold text-white border-b border-slate-800 pb-2">
                                ملخص الفاتورة النهائي
                            </h2>

                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between text-slate-400">
                                    <span>المجموع الفرعي للبنود:</span>
                                    <span className="font-semibold text-white">{linesSubtotal.toFixed(2)} ر.س</span>
                                </div>

                                {headerDiscount > 0 && (
                                    <div className="flex justify-between text-amber-400">
                                        <span>إجمالي الخصم:</span>
                                        <span className="font-semibold">-{headerDiscount.toFixed(2)} ر.س</span>
                                    </div>
                                )}

                                {linesTaxTotal > 0 && (
                                    <div className="flex justify-between text-slate-400">
                                        <span>إجمالي الضريبة:</span>
                                        <span className="font-semibold text-white">+{linesTaxTotal.toFixed(2)} ر.س</span>
                                    </div>
                                )}

                                {shipping > 0 && (
                                    <div className="flex justify-between text-slate-400">
                                        <span>رسوم الشحن والتوصيل:</span>
                                        <span className="font-semibold text-white">+{shipping.toFixed(2)} ر.س</span>
                                    </div>
                                )}

                                <div className="flex justify-between text-lg font-bold text-white border-t border-slate-800 pt-3">
                                    <span className="text-emerald-400">الإجمالي النهائي:</span>
                                    <span className="text-emerald-400">{grandTotal.toFixed(2)} ر.س</span>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-lg shadow-lg shadow-emerald-900/30 transition-colors flex items-center justify-center gap-2"
                            >
                                <Save className="w-5 h-5" />
                                {processing ? 'جاري الحفظ...' : 'حفظ وترحيل فاتورة المبيعات'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
