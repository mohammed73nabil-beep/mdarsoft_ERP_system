import React, { useState, useEffect } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '../../../Layouts/AppLayout';
import {
    ArrowLeftRight,
    ArrowRight,
    Plus,
    Trash2,
    Save,
    Send,
    Smartphone,
    Warehouse as WarehouseIcon,
    AlertCircle,
    Check
} from 'lucide-react';

export default function Create({ fromWarehouses, toWarehouses, products }) {
    const today = new Date().toISOString().split('T')[0];

    const { data, setData, post, processing, errors, transform } = useForm({
        from_warehouse_id: fromWarehouses?.[0]?.id || '',
        to_warehouse_id: toWarehouses?.[1]?.id || toWarehouses?.[0]?.id || '',
        date: today,
        notes: '',
        action: 'send', // save | send
        lines: [
            {
                product_id: '',
                variation_id: null,
                quantity: 1,
                serial_id: null,
                serial_ids: [],
                tracking_type: 'none',
                notes: '',
            }
        ]
    });

    const [warehouseSerials, setWarehouseSerials] = useState({});

    useEffect(() => {
        if (!data.from_warehouse_id) return;
        fetch(`/products/serials?warehouse_id=${data.from_warehouse_id}&status=in_stock`, {
            headers: { 'Accept': 'application/json' }
        })
        .then((res) => res.json())
        .then((json) => {
            const list = json.data || json || [];
            const grouped = {};
            list.forEach((s) => {
                if (!grouped[s.product_id]) grouped[s.product_id] = [];
                grouped[s.product_id].push(s);
            });
            setWarehouseSerials(grouped);
        })
        .catch(() => {});
    }, [data.from_warehouse_id]);

    const addLine = () => {
        setData('lines', [
            ...data.lines,
            {
                product_id: '',
                variation_id: null,
                quantity: 1,
                serial_id: null,
                serial_ids: [],
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
            newLines[index].tracking_type = product.tracking_type;
            newLines[index].serial_ids = [];
            newLines[index].serial_id = null;
            if (product.tracking_type === 'serial') {
                newLines[index].quantity = 0;
            }
        } else {
            newLines[index].product_id = '';
            newLines[index].tracking_type = 'none';
        }
        setData('lines', newLines);
    };

    const handleSerialToggle = (index, serialId) => {
        const newLines = [...data.lines];
        const currentIds = [...(newLines[index].serial_ids || [])];
        const existsIdx = currentIds.indexOf(serialId);

        if (existsIdx > -1) {
            currentIds.splice(existsIdx, 1);
        } else {
            currentIds.push(serialId);
        }

        newLines[index].serial_ids = currentIds;
        newLines[index].quantity = currentIds.length;
        newLines[index].serial_id = currentIds[0] || null;

        setData('lines', newLines);
    };

    const handleLineChange = (index, field, value) => {
        const newLines = [...data.lines];
        newLines[index][field] = value;
        setData('lines', newLines);
    };

    const handleSubmit = (actionType = 'send') => {
        transform((prevData) => ({
            ...prevData,
            action: actionType,
        }));
        post('/inventory/transfers');
    };

    const totalQty = data.lines.reduce((acc, l) => acc + (parseFloat(l.quantity) || 0), 0);

    return (
        <AppLayout title="إضافة تحويل مخزون">
            <Head title="تحويل مخزون جديد" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
                        <Link href="/inventory" className="hover:text-white transition">المخازن</Link>
                        <span>/</span>
                        <Link href="/inventory/transfers" className="hover:text-white transition">تحويلات المخزون</Link>
                        <span>/</span>
                        <span className="text-white font-bold">تحويل جديد</span>
                    </div>
                    <h2 className="text-2xl font-black text-white flex items-center gap-2">
                        <ArrowLeftRight className="text-cyan-500" size={26} />
                        <span>إنشاء تحويل مخزون بين المستودعات</span>
                    </h2>
                </div>

                <Link
                    href="/inventory/transfers"
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

            <form onSubmit={(e) => { e.preventDefault(); handleSubmit('send'); }}>
                {/* Header Info */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6 shadow-xl">
                    <h3 className="text-base font-bold text-white mb-4 pb-3 border-b border-slate-800 flex items-center gap-2">
                        <WarehouseIcon className="text-cyan-400" size={18} />
                        <span>بيانات المستودعات والتحويل</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-2">
                                من مستودع (المصدر) <span className="text-rose-500">*</span>
                            </label>
                            <select
                                value={data.from_warehouse_id}
                                onChange={(e) => setData('from_warehouse_id', e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 font-bold"
                                required
                            >
                                <option value="">اختر المستودع المصدر...</option>
                                {fromWarehouses?.map((w) => (
                                    <option key={w.id} value={w.id}>{w.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-2">
                                إلى مستودع (الوجهة) <span className="text-rose-500">*</span>
                            </label>
                            <select
                                value={data.to_warehouse_id}
                                onChange={(e) => setData('to_warehouse_id', e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 font-bold"
                                required
                            >
                                <option value="">اختر المستودع الوجهة...</option>
                                {toWarehouses?.map((w) => (
                                    <option key={w.id} value={w.id} disabled={w.id === parseInt(data.from_warehouse_id)}>
                                        {w.name} {w.id === parseInt(data.from_warehouse_id) ? '(المصدر الحالي)' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-2">
                                تاريخ التحويل <span className="text-rose-500">*</span>
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
                            <label className="block text-sm font-bold text-slate-300 mb-2">ملاحظات التحويل:</label>
                            <input
                                type="text"
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                                placeholder="سبب النقل، السائق..."
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Lines Box */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6 shadow-xl">
                    <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                            <span>الأصناف المحولة</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 font-mono">
                                {data.lines.length} أسطر
                            </span>
                        </h3>

                        <button
                            type="button"
                            onClick={addLine}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm shadow transition"
                        >
                            <Plus size={16} />
                            <span>إضافة صنف</span>
                        </button>
                    </div>

                    <div className="space-y-4">
                        {data.lines.map((line, idx) => {
                            const availableSerials = (warehouseSerials[line.product_id] || []);

                            return (
                                <div key={idx} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                                        <div className="sm:col-span-8">
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

                                        <div className="sm:col-span-3">
                                            <label className="block text-xs font-bold text-slate-400 mb-1">
                                                {line.tracking_type === 'serial' ? 'الكمية (المحددة بالسيريال):' : 'الكمية المحولة:'}
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0.01"
                                                value={line.quantity}
                                                readOnly={line.tracking_type === 'serial'}
                                                onChange={(e) => handleLineChange(idx, 'quantity', e.target.value)}
                                                className={`w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono font-bold text-white focus:outline-none ${
                                                    line.tracking_type === 'serial' ? 'bg-slate-800/60 cursor-not-allowed text-cyan-400' : ''
                                                }`}
                                                required
                                            />
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

                                    {/* Serial selection from available in-stock in source warehouse */}
                                    {line.tracking_type === 'serial' && (
                                        <div className="p-3 bg-cyan-950/20 border border-cyan-900/40 rounded-xl">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                                                    <Smartphone size={14} />
                                                    <span>اختر الأجهزة المراد نقلها من المستودع المصدر:</span>
                                                </span>
                                                <span className="text-xs font-mono text-cyan-400 font-bold">
                                                    {line.serial_ids?.length || 0} أجهزة محددة
                                                </span>
                                            </div>

                                            {availableSerials.length === 0 ? (
                                                <div className="text-xs text-slate-500 py-2">
                                                    لا توجد أجهزة متوفرة في المستودع المصدر لهذا المنتج.
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-36 overflow-y-auto p-1">
                                                    {availableSerials.map((s) => {
                                                        const isSelected = (line.serial_ids || []).includes(s.id);
                                                        return (
                                                            <button
                                                                type="button"
                                                                key={s.id}
                                                                onClick={() => handleSerialToggle(idx, s.id)}
                                                                className={`p-2 rounded-lg text-right border text-xs font-mono transition flex items-center justify-between ${
                                                                    isSelected
                                                                        ? 'bg-cyan-600/20 border-cyan-500 text-cyan-300 font-bold'
                                                                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                                                                }`}
                                                            >
                                                                <span className="truncate">{s.serial_number}</span>
                                                                {isSelected && <Check size={14} className="text-cyan-400 shrink-0 mr-1" />}
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

                    <div className="mt-6 pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-6 text-sm">
                            <span className="text-slate-400 font-bold">
                                عدد البنود: <strong className="text-white font-mono">{data.lines.length}</strong>
                            </span>
                            <span className="text-slate-400 font-bold">
                                إجمالي الكميات: <strong className="text-cyan-400 font-mono font-bold">{totalQty.toFixed(2)}</strong>
                            </span>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                disabled={processing}
                                onClick={() => handleSubmit('save')}
                                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm border border-slate-700 transition flex items-center gap-2"
                            >
                                <Save size={16} />
                                <span>حفظ كمسودة</span>
                            </button>

                            <button
                                type="button"
                                disabled={processing}
                                onClick={() => handleSubmit('send')}
                                className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm shadow-lg shadow-cyan-600/30 transition flex items-center gap-2"
                            >
                                <Send size={16} />
                                <span>حفظ وإرسال التحويل</span>
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </AppLayout>
    );
}
