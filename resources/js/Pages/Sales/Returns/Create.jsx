import React, { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    CornerUpLeft,
    Save,
    ArrowRight,
    Building2,
    Calendar,
    FileText,
    Hash,
    CheckCircle2,
    AlertCircle,
} from 'lucide-react';

export default function SaleReturnCreate({
    sales = [],
    selectedSale = null,
}) {
    const [currentSale, setCurrentSale] = useState(selectedSale);

    const { data, setData, post, processing, errors } = useForm({
        original_sale_id: selectedSale?.id ?? '',
        date: new Date().toISOString().split('T')[0],
        refund_method: 'cash',
        accept_into_stock: true,
        notes: '',
        lines: selectedSale ? selectedSale.lines.map((l) => ({
            original_line_id: l.id,
            product_id: l.product_id,
            variation_id: l.variation_id,
            unit_id: l.unit_id,
            product_name: l.product?.name,
            tracking_type: l.product?.tracking_type,
            sold_quantity: Number(l.quantity),
            quantity: 0,
            unit_price: Number(l.unit_price),
            tax_amount: 0,
            total_amount: 0,
            sold_serials: l.serials || [],
            serial_ids: [],
        })) : [],
    });

    const handleSelectSale = (saleId) => {
        if (!saleId) {
            setCurrentSale(null);
            setData('lines', []);
            return;
        }

        router.get('/sales/returns/create', { sale_id: saleId }, {
            preserveState: true,
            onSuccess: (page) => {
                const s = page.props.selectedSale;
                setCurrentSale(s);
                if (s) {
                    setData({
                        ...data,
                        original_sale_id: s.id,
                        lines: s.lines.map((l) => ({
                            original_line_id: l.id,
                            product_id: l.product_id,
                            variation_id: l.variation_id,
                            unit_id: l.unit_id,
                            product_name: l.product?.name,
                            tracking_type: l.product?.tracking_type,
                            sold_quantity: Number(l.quantity),
                            quantity: 0,
                            unit_price: Number(l.unit_price),
                            tax_amount: 0,
                            total_amount: 0,
                            sold_serials: l.serials || [],
                            serial_ids: [],
                        })),
                    });
                }
            },
        });
    };

    const handleQuantityChange = (idx, qty) => {
        const updated = [...data.lines];
        const numQty = Math.max(0, Math.min(Number(qty || 0), updated[idx].sold_quantity));
        updated[idx].quantity = numQty;
        updated[idx].total_amount = numQty * updated[idx].unit_price;
        setData('lines', updated);
    };

    const handleSerialToggle = (lineIdx, serialId) => {
        const updated = [...data.lines];
        const currentSerials = updated[lineIdx].serial_ids || [];

        if (currentSerials.includes(serialId)) {
            updated[lineIdx].serial_ids = currentSerials.filter((id) => id !== serialId);
        } else {
            updated[lineIdx].serial_ids = [...currentSerials, serialId];
        }

        updated[lineIdx].quantity = updated[lineIdx].serial_ids.length;
        updated[lineIdx].total_amount = updated[lineIdx].quantity * updated[lineIdx].unit_price;
        setData('lines', updated);
    };

    const returnTotal = data.lines.reduce((sum, l) => sum + Number(l.total_amount || 0), 0);

    const handleSubmit = (e) => {
        e.preventDefault();

        // Filter only lines with return quantity > 0
        const activeLines = data.lines.filter((l) => Number(l.quantity) > 0);

        if (activeLines.length === 0) {
            alert('يجب تحديد كمية أكبر من صفر لسطر واحد على الأقل للإرجاع.');
            return;
        }

        post('/sales/returns', {
            data: {
                ...data,
                lines: activeLines,
            },
        });
    };

    return (
        <AppLayout title="تسجيل مرتجع مبيعات">
            <Head title="تسجيل مرتجع مبيعات" />

            <div className="p-6 max-w-5xl mx-auto space-y-6">
                <div>
                    <Link
                        href="/sales/returns"
                        className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-sm mb-2 transition-colors"
                    >
                        <ArrowRight className="w-4 h-4" />
                        العودة لقائمة المرتجعات
                    </Link>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <CornerUpLeft className="w-7 h-7 text-amber-500" />
                        تسجيل مرتجع مبيعات من عميل
                    </h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Invoice Selection & Details */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
                        <h2 className="text-sm font-semibold text-white border-b border-slate-800 pb-2 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-amber-400" />
                            بيانات فاتورة البيع الأصلية
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="text-xs text-slate-400 mb-1 block">اختر فاتورة البيع *</label>
                                <select
                                    value={data.original_sale_id}
                                    onChange={(e) => handleSelectSale(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                                >
                                    <option value="">اختر الفاتورة...</option>
                                    {sales.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.order_number} ({s.date}) - إجمالي: {Number(s.total_amount).toFixed(2)} ر.س
                                        </option>
                                    ))}
                                </select>
                                {errors.original_sale_id && <p className="text-rose-500 text-xs mt-1">{errors.original_sale_id}</p>}
                            </div>

                            <div>
                                <label className="text-xs text-slate-400 mb-1 block">تاريخ المرتجع *</label>
                                <input
                                    type="date"
                                    value={data.date}
                                    onChange={(e) => setData('date', e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                                />
                                {errors.date && <p className="text-rose-500 text-xs mt-1">{errors.date}</p>}
                            </div>

                            <div>
                                <label className="text-xs text-slate-400 mb-1 block">طريقة رد المبلغ</label>
                                <select
                                    value={data.refund_method}
                                    onChange={(e) => setData('refund_method', e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                                >
                                    <option value="cash">نقداً (رد من الصندوق)</option>
                                    <option value="credit">رصيد حساب (تقليل مديونية العميل)</option>
                                    <option value="replacement">استبدال بجهاز آخر</option>
                                </select>
                            </div>
                        </div>

                        {/* Accept into stock toggle */}
                        <div className="pt-2">
                            <label className="inline-flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={data.accept_into_stock}
                                    onChange={(e) => setData('accept_into_stock', e.target.checked)}
                                    className="rounded border-slate-700 bg-slate-800 text-amber-600 focus:ring-amber-500"
                                />
                                <span className="text-xs text-slate-300">
                                    قبول البضاعة المسترجعة وإعادتها فوراً لمخزون المستودع بتكلفتها الأصلية (ADR-14/17)
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* Return Lines */}
                    {currentSale && (
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
                            <h2 className="text-sm font-semibold text-white border-b border-slate-800 pb-2">
                                تحديد الكميات والأجهزة المرتجعة
                            </h2>

                            {errors.lines && <p className="text-rose-500 text-xs">{errors.lines}</p>}

                            <div className="space-y-4">
                                {data.lines.map((line, idx) => (
                                    <div key={line.original_line_id} className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 space-y-3">
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                                            <div className="md:col-span-5">
                                                <span className="font-bold text-white text-sm block">{line.product_name}</span>
                                                <span className="text-xs text-slate-400 block mt-0.5">
                                                    الكمية المباعة أصلاً: {line.sold_quantity} قطعة | سعر الوحدة: {line.unit_price} ر.س
                                                </span>
                                            </div>

                                            <div className="md:col-span-3">
                                                <label className="text-xs text-slate-400 mb-1 block">الكمية المراد إرجاعها</label>
                                                <input
                                                    type="number"
                                                    step="any"
                                                    min="0"
                                                    max={line.sold_quantity}
                                                    readOnly={line.tracking_type === 'serial'}
                                                    value={line.quantity}
                                                    onChange={(e) => handleQuantityChange(idx, e.target.value)}
                                                    className={`w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                                                        line.tracking_type === 'serial' ? 'bg-slate-950 text-slate-400 cursor-not-allowed' : ''
                                                    }`}
                                                />
                                            </div>

                                            <div className="md:col-span-4 text-left">
                                                <span className="text-xs text-slate-400 block">إجمالي قيمة المرتجع</span>
                                                <span className="text-base font-bold text-amber-400 block mt-0.5">
                                                    {Number(line.total_amount).toFixed(2)} ر.س
                                                </span>
                                            </div>
                                        </div>

                                        {/* Serial selector if serial product */}
                                        {line.tracking_type === 'serial' && line.sold_serials?.length > 0 && (
                                            <div className="pt-2 border-t border-slate-700/60 bg-slate-900/60 p-3 rounded-lg space-y-2">
                                                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                                                    <Hash className="w-3.5 h-3.5" />
                                                    اختر الأجهزة المسترجعة من العميل:
                                                </span>
                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                    {line.sold_serials.map((s) => {
                                                        const isSelected = line.serial_ids.includes(s.serial_id);
                                                        return (
                                                            <button
                                                                key={s.id}
                                                                type="button"
                                                                onClick={() => handleSerialToggle(idx, s.serial_id)}
                                                                className={`px-3 py-1.5 text-xs rounded border text-right transition-colors ${
                                                                    isSelected
                                                                        ? 'bg-amber-900/50 border-amber-500 text-amber-200 font-semibold'
                                                                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                                                                }`}
                                                            >
                                                                <div className="font-mono">{s.serial?.serial_number}</div>
                                                                {s.serial?.imei1 && <div className="text-[10px] text-slate-400 font-mono">IMEI: {s.serial.imei1}</div>}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Total & Submit */}
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
                                <div>
                                    <span className="text-xs text-slate-400 block">إجمالي مبلغ المرتجع للعميل</span>
                                    <span className="text-xl font-black text-amber-400">
                                        {returnTotal.toFixed(2)} ر.س
                                    </span>
                                </div>

                                <button
                                    type="submit"
                                    disabled={processing || returnTotal <= 0}
                                    className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold rounded-lg shadow-lg shadow-amber-900/30 transition-colors flex items-center gap-2"
                                >
                                    <Save className="w-4 h-4" />
                                    {processing ? 'جاري الحفظ...' : 'تأكيد وحفظ مرتجع المبيعات'}
                                </button>
                            </div>
                        </div>
                    )}
                </form>
            </div>
        </AppLayout>
    );
}
