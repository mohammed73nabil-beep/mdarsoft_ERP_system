import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    FileCode,
    Plus,
    Trash2,
    Save,
    ArrowRight,
    Building2,
    Warehouse,
} from 'lucide-react';

export default function DraftCreate({
    customers = [],
    branches = [],
    warehouses = [],
    products = [],
    defaultBranchId = null,
}) {
    const { data, setData, post, processing, errors } = useForm({
        branch_id: defaultBranchId || (branches[0]?.id ?? ''),
        warehouse_id: warehouses[0]?.id ?? '',
        contact_id: '',
        date: new Date().toISOString().split('T')[0],
        discount_amount: 0,
        tax_amount: 0,
        notes: '',
        lines: [
            {
                product_id: '',
                quantity: 1,
                unit_price: 0,
                total_amount: 0,
            },
        ],
    });

    const handleProductChange = (index, productId) => {
        const prod = products.find((p) => p.id === Number(productId));
        const updated = [...data.lines];

        if (prod) {
            const price = Number(prod.selling_price || 0);
            const qty = Number(updated[index].quantity || 1);
            updated[index] = {
                ...updated[index],
                product_id: prod.id,
                unit_price: price,
                total_amount: price * qty,
            };
        }
        setData('lines', updated);
    };

    const handleLineChange = (index, field, value) => {
        const updated = [...data.lines];
        updated[index][field] = value;
        const qty = Number(updated[index].quantity || 0);
        const price = Number(updated[index].unit_price || 0);
        updated[index].total_amount = qty * price;
        setData('lines', updated);
    };

    const addLine = () => {
        setData('lines', [
            ...data.lines,
            { product_id: '', quantity: 1, unit_price: 0, total_amount: 0 },
        ]);
    };

    const removeLine = (index) => {
        if (data.lines.length === 1) return;
        setData('lines', data.lines.filter((_, i) => i !== index));
    };

    const grandTotal = data.lines.reduce((sum, l) => sum + Number(l.total_amount || 0), 0);

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/sales/drafts');
    };

    return (
        <AppLayout title="إضافة مسودة بيع جديدة">
            <Head title="إضافة مسودة بيع جديدة" />

            <div className="p-6 max-w-5xl mx-auto space-y-6">
                <div>
                    <Link
                        href="/sales/drafts"
                        className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-sm mb-2 transition-colors"
                    >
                        <ArrowRight className="w-4 h-4" />
                        العودة لقائمة المسودات
                    </Link>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <FileCode className="w-7 h-7 text-purple-500" />
                        حفظ مسودة بيع جديدة
                    </h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="text-xs text-slate-400 mb-1 block">الفرع *</label>
                            <select
                                value={data.branch_id}
                                onChange={(e) => setData('branch_id', e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                            >
                                {branches.map((b) => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-xs text-slate-400 mb-1 block">المستودع *</label>
                            <select
                                value={data.warehouse_id}
                                onChange={(e) => setData('warehouse_id', e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                            >
                                {warehouses.map((w) => (
                                    <option key={w.id} value={w.id}>{w.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-xs text-slate-400 mb-1 block">العميل</label>
                            <select
                                value={data.contact_id}
                                onChange={(e) => setData('contact_id', e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                            >
                                <option value="">عميل نقدي</option>
                                {customers.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-xs text-slate-400 mb-1 block">تاريخ المسودة *</label>
                            <input
                                type="date"
                                value={data.date}
                                onChange={(e) => setData('date', e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                            />
                        </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                            <h2 className="text-sm font-semibold text-white">البنود في المسودة</h2>
                            <button
                                type="button"
                                onClick={addLine}
                                className="text-xs px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded font-medium flex items-center gap-1"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                إضافة سطر
                            </button>
                        </div>

                        {data.lines.map((l, idx) => (
                            <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-slate-800/40 p-3 rounded-lg border border-slate-700/60">
                                <div className="md:col-span-6">
                                    <label className="text-xs text-slate-400 mb-1 block">المنتج</label>
                                    <select
                                        value={l.product_id}
                                        onChange={(e) => handleProductChange(idx, e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white"
                                    >
                                        <option value="">اختر المنتج...</option>
                                        {products.map((p) => (
                                            <option key={p.id} value={p.id}>{p.name} ({p.selling_price} ر.س)</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="text-xs text-slate-400 mb-1 block">الكمية</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={l.quantity}
                                        onChange={(e) => handleLineChange(idx, 'quantity', e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="text-xs text-slate-400 mb-1 block">السعر</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={l.unit_price}
                                        onChange={(e) => handleLineChange(idx, 'unit_price', e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white"
                                    />
                                </div>

                                <div className="md:col-span-1">
                                    <span className="text-xs text-slate-400 block mb-1">الإجمالي</span>
                                    <span className="text-sm font-bold text-white block py-1.5">
                                        {Number(l.total_amount).toFixed(2)}
                                    </span>
                                </div>

                                <div className="md:col-span-1 flex justify-center pb-1">
                                    <button
                                        type="button"
                                        onClick={() => removeLine(idx)}
                                        className="text-slate-500 hover:text-rose-400 p-1.5"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}

                        <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                            <div>
                                <span className="text-xs text-slate-400 block">إجمالي المسودة</span>
                                <span className="text-xl font-bold text-purple-400">
                                    {grandTotal.toFixed(2)} ر.س
                                </span>
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg shadow-lg shadow-purple-900/30 flex items-center gap-2"
                            >
                                <Save className="w-4 h-4" />
                                حفظ المسودة
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
