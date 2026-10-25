import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '../../../Layouts/AppLayout';
import {
    FileInput,
    ArrowRight,
    Plus,
    Trash2,
    Save,
    Send,
    Smartphone,
    Warehouse as WarehouseIcon,
    AlertCircle
} from 'lucide-react';

export default function ReceivingCreate({ warehouses, products }) {
    const today = new Date().toISOString().split('T')[0];

    const { data, setData, post, processing, errors, transform } = useForm({
        type: 'receiving_voucher',
        warehouse_id: warehouses?.[0]?.id || '',
        date: today,
        notes: '',
        auto_post: true,
        lines: [
            {
                product_id: '',
                variation_id: null,
                adjusted_quantity: 1,
                unit_cost: '0.00',
                serials_text: '',
                serials: [],
                tracking_type: 'none',
                notes: '',
            }
        ]
    });

    const addLine = () => {
        setData('lines', [
            ...data.lines,
            {
                product_id: '',
                variation_id: null,
                adjusted_quantity: 1,
                unit_cost: '0.00',
                serials_text: '',
                serials: [],
                tracking_type: 'none',
                notes: '',
            }
        ]);
    };

    const removeLine = (index) => {
        if (data.lines.length <= 1) return;
        const newLines = [...data.lines];
        newLines.splice(index, 1);
        setData('lines', newLines);
    };

    const handleProductChange = (index, productId) => {
        const product = products.find((p) => p.id === parseInt(productId));
        const newLines = [...data.lines];
        if (product) {
            newLines[index].product_id = product.id;
            newLines[index].unit_cost = product.cost_price || '0.00';
            newLines[index].tracking_type = product.tracking_type;
            if (product.tracking_type === 'serial') {
                newLines[index].adjusted_quantity = newLines[index].serials.length || 1;
            }
        } else {
            newLines[index].product_id = '';
            newLines[index].tracking_type = 'none';
        }
        setData('lines', newLines);
    };

    const handleSerialsTextChange = (index, text) => {
        const newLines = [...data.lines];
        newLines[index].serials_text = text;

        const lines = text.trim().split('\n');
        const parsed = [];
        lines.forEach((line) => {
            const trimmed = line.trim();
            if (!trimmed) return;
            const parts = trimmed.split(/[\t,;]+/).map((p) => p.trim());
            parsed.push({
                serial_number: parts[0] || '',
                imei1: parts[1] || null,
                imei2: parts[2] || null,
                cost_price: parts[3] ? parseFloat(parts[3]) : parseFloat(newLines[index].unit_cost || 0),
            });
        });

        newLines[index].serials = parsed;
        if (parsed.length > 0) {
            newLines[index].adjusted_quantity = parsed.length;
        }
        setData('lines', newLines);
    };

    const handleLineChange = (index, field, value) => {
        const newLines = [...data.lines];
        newLines[index][field] = value;
        setData('lines', newLines);
    };

    const handleSubmit = (autoPost = true) => {
        transform((prevData) => ({
            ...prevData,
            auto_post: autoPost,
        }));
        post('/inventory/vouchers/receiving');
    };

    const totalQty = data.lines.reduce((acc, l) => acc + (parseFloat(l.adjusted_quantity) || 0), 0);
    const totalCost = data.lines.reduce((acc, l) => {
        const q = parseFloat(l.adjusted_quantity) || 0;
        const c = parseFloat(l.unit_cost) || 0;
        return acc + (q * c);
    }, 0);

    return (
        <AppLayout title="إنشاء أذن إضافة مخزني">
            <Head title="إنشاء أذن إضافة" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
                        <Link href="/inventory" className="hover:text-white transition">المخازن</Link>
                        <span>/</span>
                        <Link href="/inventory/vouchers/receiving" className="hover:text-white transition">أذونات الإضافة</Link>
                        <span>/</span>
                        <span className="text-white font-bold">إذن جديد</span>
                    </div>
                    <h2 className="text-2xl font-black text-white flex items-center gap-2">
                        <FileInput className="text-emerald-500" size={26} />
                        <span>إنشاء أذن إضافة مخزني (إدخال بضاعة)</span>
                    </h2>
                </div>

                <Link
                    href="/inventory/vouchers/receiving"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition border border-slate-700"
                >
                    <ArrowRight size={16} />
                    <span>العودة للقائمة</span>
                </Link>
            </div>

            {Object.keys(errors).length > 0 && (
                <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
                    <div className="flex items-center gap-2 font-bold mb-1">
                        <AlertCircle size={18} />
                        <span>يرجى تصحيح الأخطاء التالية:</span>
                    </div>
                    <ul className="list-disc list-inside space-y-1 mr-4">
                        {Object.values(errors).map((err, i) => (
                            <li key={i}>{err}</li>
                        ))}
                    </ul>
                </div>
            )}

            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(true); }}>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6 shadow-xl">
                    <h3 className="text-base font-bold text-white mb-4 pb-3 border-b border-slate-800 flex items-center gap-2">
                        <WarehouseIcon className="text-emerald-400" size={18} />
                        <span>بيانات الإذن والمستودع الوجهة</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-2">
                                المستودع <span className="text-rose-500">*</span>
                            </label>
                            <select
                                value={data.warehouse_id}
                                onChange={(e) => setData('warehouse_id', e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 font-bold"
                                required
                            >
                                <option value="">اختر المستودع...</option>
                                {warehouses?.map((w) => (
                                    <option key={w.id} value={w.id}>{w.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-2">
                                تاريخ الإذن <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="date"
                                value={data.date}
                                onChange={(e) => setData('date', e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 font-mono font-bold"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-2">ملاحظات الإذن:</label>
                            <input
                                type="text"
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                                placeholder="سبب الإضافة، مرجع خارجي..."
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6 shadow-xl">
                    <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                            <span>البنود المضافة</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono">
                                {data.lines.length} أسطر
                            </span>
                        </h3>

                        <button
                            type="button"
                            onClick={addLine}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow transition"
                        >
                            <Plus size={16} />
                            <span>إضافة سطر</span>
                        </button>
                    </div>

                    <div className="space-y-4">
                        {data.lines.map((line, idx) => (
                            <div key={idx} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                                    <div className="sm:col-span-5">
                                        <label className="block text-xs font-bold text-slate-400 mb-1">المنتج:</label>
                                        <select
                                            value={line.product_id}
                                            onChange={(e) => handleProductChange(idx, e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-bold"
                                            required
                                        >
                                            <option value="">اختر المنتج...</option>
                                            {products?.map((p) => (
                                                <option key={p.id} value={p.id}>
                                                    {p.name} [{p.sku}] {p.tracking_type === 'serial' ? '(سيريال)' : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="sm:col-span-2">
                                        <label className="block text-xs font-bold text-slate-400 mb-1">
                                            {line.tracking_type === 'serial' ? 'الكمية (محسوبة):' : 'الكمية المضافة:'}
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0.01"
                                            value={line.adjusted_quantity}
                                            readOnly={line.tracking_type === 'serial'}
                                            onChange={(e) => handleLineChange(idx, 'adjusted_quantity', e.target.value)}
                                            className={`w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono font-bold text-white focus:outline-none ${
                                                line.tracking_type === 'serial' ? 'bg-slate-800/60 cursor-not-allowed text-emerald-400' : ''
                                            }`}
                                            required
                                        />
                                    </div>

                                    <div className="sm:col-span-2">
                                        <label className="block text-xs font-bold text-slate-400 mb-1">تكلفة الوحدة (ر.س):</label>
                                        <input
                                            type="number"
                                            step="0.0001"
                                            min="0"
                                            value={line.unit_cost}
                                            onChange={(e) => handleLineChange(idx, 'unit_cost', e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono font-bold text-white focus:outline-none focus:border-blue-500"
                                        />
                                    </div>

                                    <div className="sm:col-span-2">
                                        <label className="block text-xs font-bold text-slate-400 mb-1">الإجمالي:</label>
                                        <div className="px-3 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-sm font-mono font-bold text-emerald-400">
                                            {((parseFloat(line.adjusted_quantity) || 0) * (parseFloat(line.unit_cost) || 0)).toFixed(2)} ر.س
                                        </div>
                                    </div>

                                    <div className="sm:col-span-1 flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => removeLine(idx)}
                                            disabled={data.lines.length <= 1}
                                            className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition disabled:opacity-30 disabled:cursor-not-allowed"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>

                                {line.tracking_type === 'serial' && (
                                    <div className="p-3 bg-emerald-950/20 border border-emerald-900/40 rounded-xl">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                                                <Smartphone size={14} />
                                                <span>لصق سيريالات الأجهزة المضافة (سطر لكل جهاز: سيريال، IMEI1، IMEI2، تكلفة):</span>
                                            </span>
                                            <span className="text-xs font-mono text-emerald-400 font-bold">
                                                {line.serials.length} أجهزة
                                            </span>
                                        </div>
                                        <textarea
                                            rows={3}
                                            value={line.serials_text}
                                            onChange={(e) => handleSerialsTextChange(idx, e.target.value)}
                                            placeholder={"RCV10001, 860000000000001, 860000000000002, 1200\nRCV10002"}
                                            className="w-full bg-slate-950 border border-emerald-900/50 rounded-lg p-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-400"
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-6 text-sm">
                            <span className="text-slate-400 font-bold">
                                عدد البنود: <strong className="text-white font-mono">{data.lines.length}</strong>
                            </span>
                            <span className="text-slate-400 font-bold">
                                إجمالي الكميات: <strong className="text-white font-mono">{totalQty.toFixed(2)}</strong>
                            </span>
                            <span className="text-slate-400 font-bold">
                                إجمالي القيمة: <strong className="text-emerald-400 font-mono font-black">{totalCost.toFixed(2)} ر.س</strong>
                            </span>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                disabled={processing}
                                onClick={() => handleSubmit(false)}
                                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm border border-slate-700 transition flex items-center gap-2"
                            >
                                <Save size={16} />
                                <span>حفظ كمسودة</span>
                            </button>

                            <button
                                type="button"
                                disabled={processing}
                                onClick={() => handleSubmit(true)}
                                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition flex items-center gap-2"
                            >
                                <Send size={16} />
                                <span>حفظ وترحيل الإذن</span>
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </AppLayout>
    );
}
