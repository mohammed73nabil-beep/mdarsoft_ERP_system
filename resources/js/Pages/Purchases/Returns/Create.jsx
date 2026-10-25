import React, { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    CornerUpLeft,
    ArrowRight,
    ShoppingBag,
    Save,
    Calendar,
    Warehouse,
    AlertCircle,
    Barcode,
} from 'lucide-react';

export default function PurchaseReturnCreate({
    selectedOrder = null,
    orders = [],
}) {
    const today = new Date().toISOString().split('T')[0];

    const [selectedOrderId, setSelectedOrderId] = useState(selectedOrder?.id || '');

    const { data, setData, post, processing, errors } = useForm({
        original_purchase_id: selectedOrder?.id || '',
        branch_id: selectedOrder?.branch_id || '',
        warehouse_id: selectedOrder?.warehouse_id || '',
        date: today,
        notes: '',
        lines: selectedOrder
            ? selectedOrder.lines.map((line) => ({
                  original_line_id: line.id,
                  product_id: line.product_id,
                  variation_id: line.variation_id,
                  product_name: line.product?.name,
                  tracking_type: line.product?.tracking_type,
                  available_qty: line.available_return_qty || 0,
                  quantity: 0,
                  unit_cost: Number(line.unit_cost),
                  tax_rate: Number(line.tax_amount) / (Number(line.unit_cost) * Number(line.quantity) || 1),
                  tax_amount: 0,
                  total_amount: 0,
                  serials: line.serials || [],
                  serial_ids: [],
              }))
            : [],
    });

    const handleOrderSelect = (orderId) => {
        setSelectedOrderId(orderId);
        router.get('/purchases/returns/create', { order_id: orderId }, { preserveState: false });
    };

    const handleQuantityChange = (index, qtyVal) => {
        const qty = Number(qtyVal || 0);
        const updatedLines = [...data.lines];
        const line = updatedLines[index];

        const validQty = Math.max(0, Math.min(qty, line.available_qty));
        const subtotal = validQty * line.unit_cost;
        const taxAmt = Math.round(subtotal * (line.tax_rate || 0.15) * 100) / 100;

        updatedLines[index] = {
            ...line,
            quantity: validQty,
            tax_amount: taxAmt,
            total_amount: Math.round((subtotal + taxAmt) * 100) / 100,
        };

        setData('lines', updatedLines);
    };

    const handleSerialToggle = (lineIndex, serialId) => {
        const updatedLines = [...data.lines];
        const line = updatedLines[lineIndex];
        const currentSerials = line.serial_ids || [];

        let newSerials;
        if (currentSerials.includes(serialId)) {
            newSerials = currentSerials.filter((id) => id !== serialId);
        } else {
            newSerials = [...currentSerials, serialId];
        }

        updatedLines[lineIndex] = {
            ...line,
            serial_ids: newSerials,
            quantity: newSerials.length,
            total_amount: Math.round((newSerials.length * line.unit_cost * 1.15) * 100) / 100,
            tax_amount: Math.round((newSerials.length * line.unit_cost * 0.15) * 100) / 100,
        };

        setData('lines', updatedLines);
    };

    const activeLines = data.lines.filter((l) => Number(l.quantity) > 0);
    const totalReturnAmount = activeLines.reduce((acc, l) => acc + Number(l.total_amount || 0), 0);
    const totalTaxAmount = activeLines.reduce((acc, l) => acc + Number(l.tax_amount || 0), 0);

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/purchases/returns');
    };

    const formatCurrency = (val) => {
        return Number(val || 0).toLocaleString('ar-SA', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }) + ' ر.س';
    };

    return (
        <AppLayout>
            <Head title="إنشاء مرتجع مشتريات" />

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/purchases/returns"
                            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
                            title="العودة للمرتجعات"
                        >
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-white tracking-wide">إنشاء مرتجع مشتريات</h1>
                            <p className="text-xs text-slate-400">إرجاع بضاعة مستلمة إلى المورد وخفض الرصيد الدائن</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            href="/purchases/returns"
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition"
                        >
                            إلغاء
                        </Link>
                        <button
                            type="submit"
                            disabled={processing || activeLines.length === 0}
                            className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-rose-500/20 transition disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            {processing ? 'جارٍ الحفظ...' : 'تأكيد المرتجع'}
                        </button>
                    </div>
                </div>

                {/* Select Order */}
                <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4">
                    <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-rose-400" />
                        اختيار فاتورة الشراء الأصلية
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-300 mb-1.5">
                                فاتورة الشراء المستلمة *
                            </label>
                            <select
                                value={selectedOrderId}
                                onChange={(e) => handleOrderSelect(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-950/50 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500/50 transition"
                            >
                                <option value="">اختر فاتورة الشراء...</option>
                                {orders.map((o) => (
                                    <option key={o.id} value={o.id}>
                                        {o.order_number} — {o.contact?.name || 'مورد'} ({o.date})
                                    </option>
                                ))}
                            </select>
                            {errors.original_purchase_id && (
                                <p className="text-[11px] text-rose-400 mt-1">{errors.original_purchase_id}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-300 mb-1.5">
                                تاريخ المرتجع *
                            </label>
                            <input
                                type="date"
                                value={data.date}
                                onChange={(e) => setData('date', e.target.value)}
                                className="w-full px-3 py-2 bg-slate-950/50 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500/50 transition"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-300 mb-1.5">
                                المستودع المرتجع منه
                            </label>
                            <input
                                type="text"
                                readOnly
                                value={selectedOrder?.warehouse?.name || 'اختر فاتورة الشراء أولاً'}
                                className="w-full px-3 py-2 bg-slate-950/30 border border-slate-800/60 rounded-xl text-xs text-slate-400"
                            />
                        </div>
                    </div>
                </div>

                {/* Return Items Selection */}
                {selectedOrder && (
                    <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                                <CornerUpLeft className="w-4 h-4 text-rose-400" />
                                تحديد الأصناف والكميات المراد إرجاعها
                            </h2>
                            <span className="text-xs text-slate-400">
                                المورد: <span className="text-white font-medium">{selectedOrder.contact?.name}</span>
                            </span>
                        </div>

                        {errors.lines && (
                            <p className="text-xs text-rose-400">{errors.lines}</p>
                        )}

                        <div className="overflow-x-auto">
                            <table className="w-full text-right text-xs">
                                <thead className="bg-slate-950/60 border-b border-slate-800/80 text-slate-400 font-medium">
                                    <tr>
                                        <th className="py-2.5 px-3">المنتج</th>
                                        <th className="py-2.5 px-3 text-center">المتاح للإرجاع</th>
                                        <th className="py-2.5 px-3 text-center w-32">كمية المرتجع</th>
                                        <th className="py-2.5 px-3">سعر الشراء</th>
                                        <th className="py-2.5 px-3">الضريبة المستردة</th>
                                        <th className="py-2.5 px-3 text-left">إجمالي المرتجع</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                    {data.lines.map((line, idx) => (
                                        <tr key={idx} className="hover:bg-slate-800/20 transition">
                                            <td className="py-3 px-3">
                                                <div className="font-semibold text-white">
                                                    {line.product_name}
                                                </div>
                                                {line.tracking_type === 'serial' && line.serials && line.serials.length > 0 && (
                                                    <div className="mt-2 space-y-1">
                                                        <div className="text-[11px] text-teal-400 flex items-center gap-1">
                                                            <Barcode className="w-3 h-3" />
                                                            <span>اختر الأرقام التسلسلية للإرجاع:</span>
                                                        </div>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {line.serials.map((s) => {
                                                                const isChecked = line.serial_ids?.includes(s.serial?.id);
                                                                return (
                                                                    <button
                                                                        type="button"
                                                                        key={s.id}
                                                                        onClick={() => handleSerialToggle(idx, s.serial?.id)}
                                                                        className={`px-2 py-0.5 rounded text-[10px] font-mono border transition ${
                                                                            isChecked
                                                                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                                                                : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                                                                        }`}
                                                                    >
                                                                        {s.serial?.serial_number}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-3 px-3 text-center font-mono text-slate-300">
                                                {line.available_qty}
                                            </td>
                                            <td className="py-3 px-3 text-center">
                                                {line.tracking_type === 'serial' ? (
                                                    <span className="font-mono font-bold text-white">
                                                        {line.quantity}
                                                    </span>
                                                ) : (
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max={line.available_qty}
                                                        step="any"
                                                        value={line.quantity}
                                                        onChange={(e) => handleQuantityChange(idx, e.target.value)}
                                                        className="w-24 text-center px-2 py-1 bg-slate-950/70 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-rose-500/50"
                                                    />
                                                )}
                                            </td>
                                            <td className="py-3 px-3 font-mono text-slate-300">
                                                {formatCurrency(line.unit_cost)}
                                            </td>
                                            <td className="py-3 px-3 font-mono text-amber-400">
                                                {formatCurrency(line.tax_amount)}
                                            </td>
                                            <td className="py-3 px-3 text-left font-bold text-rose-400 font-mono">
                                                {formatCurrency(line.total_amount)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Notes and Totals */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800/80">
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                                    سبب الإرجاع أو ملاحظات
                                </label>
                                <textarea
                                    rows={3}
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    placeholder="اكتب سبب إرجاع البضاعة للمورد..."
                                    className="w-full px-3 py-2 bg-slate-950/50 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500/50 transition"
                                />
                            </div>

                            <div className="flex flex-col justify-end items-end space-y-2 text-xs">
                                <div className="text-slate-400">
                                    الضريبة المستردة: <span className="font-mono text-amber-400">{formatCurrency(totalTaxAmount)}</span>
                                </div>
                                <div className="text-base font-bold text-white">
                                    إجمالي المرتجع: <span className="font-mono text-rose-400">{formatCurrency(totalReturnAmount)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </form>
        </AppLayout>
    );
}
