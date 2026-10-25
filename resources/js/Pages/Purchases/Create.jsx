import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    ShoppingBag,
    Plus,
    Trash2,
    Calendar,
    Building2,
    Warehouse,
    UserCheck,
    Receipt,
    Truck,
    Percent,
    AlertCircle,
    ArrowRight,
    Save,
    CheckCircle2,
    Barcode,
} from 'lucide-react';

export default function PurchaseCreate({
    branches = [],
    warehouses = [],
    suppliers = [],
    taxes = [],
    paymentMethods = [],
    products = [],
    openFiscalYear = null,
    defaultBranchId = null,
}) {
    const today = new Date().toISOString().split('T')[0];

    const { data, setData, post, processing, errors } = useForm({
        contact_id: '',
        branch_id: defaultBranchId || (branches[0]?.id ?? ''),
        warehouse_id: warehouses[0]?.id ?? '',
        date: today,
        notes: '',
        shipping_amount: 0,
        auto_receive: false,
        lines: [
            {
                product_id: '',
                variation_id: '',
                quantity: 1,
                unit_cost: 0,
                discount_amount: 0,
                tax_id: taxes[0]?.id ?? '',
                tax_amount: 0,
                total_amount: 0,
                serial_ids: [],
                tracking_type: 'none',
            },
        ],
    });

    const filteredWarehouses = warehouses.filter(
        (w) => !data.branch_id || Number(w.branch_id) === Number(data.branch_id)
    );

    const handleProductChange = (index, productId) => {
        const prod = products.find((p) => p.id === Number(productId));
        const updatedLines = [...data.lines];

        if (prod) {
            const cost = Number(prod.cost_price || 0);
            const qty = Number(updatedLines[index].quantity || 1);
            const discount = Number(updatedLines[index].discount_amount || 0);
            const subtotal = Math.max(0, cost * qty - discount);

            // Calculate tax (default to 15% if VAT selected)
            const selectedTax = taxes.find((t) => t.id === Number(updatedLines[index].tax_id));
            const taxRate = selectedTax ? Number(selectedTax.rate) / 100 : 0.15;
            const taxAmt = Math.round(subtotal * taxRate * 100) / 100;

            updatedLines[index] = {
                ...updatedLines[index],
                product_id: prod.id,
                variation_id: prod.variations?.[0]?.id || '',
                unit_cost: cost,
                tax_amount: taxAmt,
                total_amount: subtotal + taxAmt,
                tracking_type: prod.tracking_type || 'none',
                serial_ids: [],
            };
        } else {
            updatedLines[index] = {
                ...updatedLines[index],
                product_id: '',
                variation_id: '',
                unit_cost: 0,
                tax_amount: 0,
                total_amount: 0,
                tracking_type: 'none',
                serial_ids: [],
            };
        }

        setData('lines', updatedLines);
    };

    const handleLineChange = (index, field, value) => {
        const updatedLines = [...data.lines];
        updatedLines[index][field] = value;

        const qty = Number(updatedLines[index].quantity || 0);
        const cost = Number(updatedLines[index].unit_cost || 0);
        const discount = Number(updatedLines[index].discount_amount || 0);
        const subtotal = Math.max(0, cost * qty - discount);

        const selectedTax = taxes.find((t) => t.id === Number(updatedLines[index].tax_id));
        const taxRate = selectedTax ? Number(selectedTax.rate) / 100 : 0.15;
        const taxAmt = Math.round(subtotal * taxRate * 100) / 100;

        updatedLines[index].tax_amount = taxAmt;
        updatedLines[index].total_amount = Math.round((subtotal + taxAmt) * 100) / 100;

        setData('lines', updatedLines);
    };

    const addLine = () => {
        setData('lines', [
            ...data.lines,
            {
                product_id: '',
                variation_id: '',
                quantity: 1,
                unit_cost: 0,
                discount_amount: 0,
                tax_id: taxes[0]?.id ?? '',
                tax_amount: 0,
                total_amount: 0,
                serial_ids: [],
                tracking_type: 'none',
            },
        ]);
    };

    const removeLine = (index) => {
        if (data.lines.length <= 1) return;
        const updatedLines = data.lines.filter((_, i) => i !== index);
        setData('lines', updatedLines);
    };

    // Overall totals calculation
    const subtotal = data.lines.reduce(
        (acc, line) => acc + (Number(line.unit_cost || 0) * Number(line.quantity || 0)),
        0
    );
    const totalDiscounts = data.lines.reduce(
        (acc, line) => acc + Number(line.discount_amount || 0),
        0
    );
    const totalTax = data.lines.reduce(
        (acc, line) => acc + Number(line.tax_amount || 0),
        0
    );
    const shipping = Number(data.shipping_amount || 0);
    const netTotal = Math.max(0, subtotal - totalDiscounts + totalTax + shipping);

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/purchases');
    };

    const formatCurrency = (val) => {
        return Number(val || 0).toLocaleString('ar-SA', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }) + ' ر.س';
    };

    return (
        <AppLayout>
            <Head title="إضافة فاتورة مشتريات جديدة" />

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/purchases/list"
                            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
                            title="العودة للقائمة"
                        >
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-white tracking-wide">إضافة فاتورة مشتريات جديدة</h1>
                            <p className="text-xs text-slate-400">تسجيل أمر شراء، إثبات المديونية في الأستاذ المساعد، وتوريد المخزون</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            href="/purchases/list"
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition"
                        >
                            إلغاء
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-emerald-500/20 transition disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            {processing ? 'جارٍ الحفظ...' : 'حفظ الفاتورة'}
                        </button>
                    </div>
                </div>

                {/* Fiscal Year Alert */}
                {!openFiscalYear && (
                    <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-400 text-xs">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span>تحذير: لا توجد سنة مالية مفتوحة. لن تتمكن من حفظ الفاتورة حتى تفتح سنة مالية.</span>
                    </div>
                )}

                {/* Main Information */}
                <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4">
                    <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                        <Receipt className="w-4 h-4 text-emerald-400" />
                        بيانات الفاتورة الأساسية
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Supplier */}
                        <div>
                            <label className="block text-xs font-medium text-slate-300 mb-1.5">
                                المورد <span className="text-rose-400">*</span>
                            </label>
                            <select
                                value={data.contact_id}
                                onChange={(e) => setData('contact_id', e.target.value)}
                                className={`w-full px-3 py-2 bg-slate-950/50 border rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500/50 transition ${
                                    errors.contact_id ? 'border-rose-500' : 'border-slate-800'
                                }`}
                            >
                                <option value="">اختر المورد...</option>
                                {suppliers.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name} ({s.code || 'بدون كود'})
                                    </option>
                                ))}
                            </select>
                            {errors.contact_id && (
                                <p className="text-[11px] text-rose-400 mt-1">{errors.contact_id}</p>
                            )}
                        </div>

                        {/* Branch */}
                        <div>
                            <label className="block text-xs font-medium text-slate-300 mb-1.5">
                                الفرع <span className="text-rose-400">*</span>
                            </label>
                            <select
                                value={data.branch_id}
                                onChange={(e) => setData('branch_id', e.target.value)}
                                className={`w-full px-3 py-2 bg-slate-950/50 border rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500/50 transition ${
                                    errors.branch_id ? 'border-rose-500' : 'border-slate-800'
                                }`}
                            >
                                <option value="">اختر الفرع...</option>
                                {branches.map((b) => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                            {errors.branch_id && (
                                <p className="text-[11px] text-rose-400 mt-1">{errors.branch_id}</p>
                            )}
                        </div>

                        {/* Warehouse */}
                        <div>
                            <label className="block text-xs font-medium text-slate-300 mb-1.5">
                                المستودع المستلم <span className="text-rose-400">*</span>
                            </label>
                            <select
                                value={data.warehouse_id}
                                onChange={(e) => setData('warehouse_id', e.target.value)}
                                className={`w-full px-3 py-2 bg-slate-950/50 border rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500/50 transition ${
                                    errors.warehouse_id ? 'border-rose-500' : 'border-slate-800'
                                }`}
                            >
                                <option value="">اختر المستودع...</option>
                                {filteredWarehouses.map((w) => (
                                    <option key={w.id} value={w.id}>{w.name}</option>
                                ))}
                            </select>
                            {errors.warehouse_id && (
                                <p className="text-[11px] text-rose-400 mt-1">{errors.warehouse_id}</p>
                            )}
                        </div>

                        {/* Date */}
                        <div>
                            <label className="block text-xs font-medium text-slate-300 mb-1.5">
                                تاريخ الفاتورة <span className="text-rose-400">*</span>
                            </label>
                            <input
                                type="date"
                                value={data.date}
                                onChange={(e) => setData('date', e.target.value)}
                                className={`w-full px-3 py-2 bg-slate-950/50 border rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500/50 transition ${
                                    errors.date ? 'border-rose-500' : 'border-slate-800'
                                }`}
                            />
                            {errors.date && (
                                <p className="text-[11px] text-rose-400 mt-1">{errors.date}</p>
                            )}
                        </div>
                    </div>

                    {/* Auto Receive Checkbox */}
                    <div className="pt-2 border-t border-slate-800/60 flex items-center gap-3">
                        <label className="relative flex items-center gap-2 cursor-pointer text-xs text-slate-300 select-none">
                            <input
                                type="checkbox"
                                checked={data.auto_receive}
                                onChange={(e) => setData('auto_receive', e.target.checked)}
                                className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-emerald-600 focus:ring-0 focus:ring-offset-0"
                            />
                            <span className="font-medium text-white">استلام فوري إلى المخزن فور الحفظ</span>
                            <span className="text-slate-500 text-[11px]">(سيتم ترحيل الكميات مباشرة إلى رصيد المخزن)</span>
                        </label>
                    </div>
                </div>

                {/* Line Items */}
                <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                            <ShoppingBag className="w-4 h-4 text-emerald-400" />
                            بنود وأسطر المشتريات
                        </h2>
                        <button
                            type="button"
                            onClick={addLine}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-medium rounded-xl border border-slate-700 transition"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            إضافة صنف
                        </button>
                    </div>

                    {errors.lines && (
                        <p className="text-xs text-rose-400">{errors.lines}</p>
                    )}

                    <div className="overflow-x-auto">
                        <table className="w-full text-right text-xs">
                            <thead className="bg-slate-950/60 border-b border-slate-800/80 text-slate-400 font-medium">
                                <tr>
                                    <th className="py-2.5 px-3 w-4/12">المنتج</th>
                                    <th className="py-2.5 px-3 w-2/12">الكمية</th>
                                    <th className="py-2.5 px-3 w-2/12">سعر الوحدة</th>
                                    <th className="py-2.5 px-3 w-1/12">الخصم</th>
                                    <th className="py-2.5 px-3 w-1/12">الضريبة</th>
                                    <th className="py-2.5 px-3 w-2/12">الإجمالي</th>
                                    <th className="py-2.5 px-2 text-center w-12"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {data.lines.map((line, idx) => (
                                    <tr key={idx} className="hover:bg-slate-800/20 transition">
                                        <td className="py-2.5 px-3">
                                            <select
                                                value={line.product_id}
                                                onChange={(e) => handleProductChange(idx, e.target.value)}
                                                className="w-full px-2.5 py-1.5 bg-slate-950/70 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500/50 transition"
                                            >
                                                <option value="">اختر المنتج...</option>
                                                {products.map((p) => (
                                                    <option key={p.id} value={p.id}>
                                                        {p.name} {p.sku ? `(${p.sku})` : ''} {p.tracking_type === 'serial' ? '— سيريال' : ''}
                                                    </option>
                                                ))}
                                            </select>
                                            {line.tracking_type === 'serial' && (
                                                <div className="mt-1 flex items-center gap-1 text-[11px] text-teal-400">
                                                    <Barcode className="w-3 h-3" />
                                                    <span>منتج يتطلب أرقام تسلسلية عند الاستلام</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-2.5 px-3">
                                            <input
                                                type="number"
                                                min="0.001"
                                                step="any"
                                                value={line.quantity}
                                                onChange={(e) => handleLineChange(idx, 'quantity', e.target.value)}
                                                className="w-full px-2.5 py-1.5 bg-slate-950/70 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500/50 transition"
                                            />
                                        </td>
                                        <td className="py-2.5 px-3">
                                            <input
                                                type="number"
                                                min="0"
                                                step="any"
                                                value={line.unit_cost}
                                                onChange={(e) => handleLineChange(idx, 'unit_cost', e.target.value)}
                                                className="w-full px-2.5 py-1.5 bg-slate-950/70 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500/50 transition"
                                            />
                                        </td>
                                        <td className="py-2.5 px-3">
                                            <input
                                                type="number"
                                                min="0"
                                                step="any"
                                                value={line.discount_amount}
                                                onChange={(e) => handleLineChange(idx, 'discount_amount', e.target.value)}
                                                className="w-full px-2.5 py-1.5 bg-slate-950/70 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500/50 transition"
                                            />
                                        </td>
                                        <td className="py-2.5 px-3">
                                            <span className="text-slate-300 font-mono">
                                                {formatCurrency(line.tax_amount)}
                                            </span>
                                        </td>
                                        <td className="py-2.5 px-3 font-semibold text-emerald-400 font-mono">
                                            {formatCurrency(line.total_amount)}
                                        </td>
                                        <td className="py-2.5 px-2 text-center">
                                            <button
                                                type="button"
                                                onClick={() => removeLine(idx)}
                                                disabled={data.lines.length <= 1}
                                                className="p-1 text-slate-500 hover:text-rose-400 disabled:opacity-30 transition"
                                                title="حذف السطر"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Bottom Section: Notes & Summary */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Notes & Shipping */}
                    <div className="lg:col-span-2 bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4">
                        <h3 className="text-xs font-semibold text-slate-300">ملاحظات ومصاريف إضافية</h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                                    مصاريف الشحن / التوصيل
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="any"
                                    value={data.shipping_amount}
                                    onChange={(e) => setData('shipping_amount', e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-950/50 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500/50 transition"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5">
                                ملاحظات الفاتورة أو شروط التوريد
                            </label>
                            <textarea
                                rows={3}
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                                className="w-full px-3 py-2 bg-slate-950/50 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500/50 transition"
                                placeholder="اكتب أي شروط أو تفاصيل تخص أمر الشراء هنا..."
                            />
                        </div>
                    </div>

                    {/* Financial Summary Card */}
                    <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-3">
                        <h3 className="text-sm font-semibold text-white border-b border-slate-800/80 pb-2">
                            الملخص المالي للفاتورة
                        </h3>

                        <div className="space-y-2 text-xs">
                            <div className="flex items-center justify-between text-slate-400">
                                <span>الإجمالي قبل الخصم:</span>
                                <span className="font-mono text-slate-200">{formatCurrency(subtotal)}</span>
                            </div>

                            <div className="flex items-center justify-between text-slate-400">
                                <span>إجمالي الخصومات:</span>
                                <span className="font-mono text-rose-400">-{formatCurrency(totalDiscounts)}</span>
                            </div>

                            <div className="flex items-center justify-between text-slate-400">
                                <span>ضريبة القيمة المضافة (15%):</span>
                                <span className="font-mono text-amber-400">+{formatCurrency(totalTax)}</span>
                            </div>

                            <div className="flex items-center justify-between text-slate-400">
                                <span>مصاريف الشحن:</span>
                                <span className="font-mono text-slate-200">+{formatCurrency(shipping)}</span>
                            </div>

                            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-sm font-bold text-white">
                                <span>الصافي النهائي:</span>
                                <span className="font-mono text-emerald-400 text-base">{formatCurrency(netTotal)}</span>
                            </div>
                        </div>

                        <div className="pt-3">
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-emerald-500/20 transition disabled:opacity-50"
                            >
                                {processing ? 'جارٍ الحفظ...' : 'اعتماد وحفظ أمر الشراء'}
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </AppLayout>
    );
}
