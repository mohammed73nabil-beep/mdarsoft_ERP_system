import React, { useState } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import { Ruler, Plus, Edit, Trash2, X, ArrowRight, Info } from 'lucide-react';

function AuxModal({ title, isOpen, onClose, children }) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                    <h3 className="text-base font-bold text-white">{title}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={18} /></button>
                </div>
                {children}
            </div>
        </div>
    );
}

export default function Units({ units }) {
    const { auth, flash } = usePage().props;
    const perms = auth?.user?.permissions || [];
    const isAdmin = auth?.user?.roles?.includes('مدير النظام') || auth?.user?.roles?.includes('admin');
    const canCreate = isAdmin || perms.includes('units.create');
    const canEdit   = isAdmin || perms.includes('units.edit');
    const canDelete = isAdmin || perms.includes('units.delete');

    const [isOpen, setIsOpen] = useState(false);
    const [editing, setEditing] = useState(null);

    const form = useForm({
        name: '', symbol: '', base_unit_id: '', operator: '*',
        operation_value: '', allow_decimal: true, is_active: true,
    });

    const openCreate = () => {
        setEditing(null);
        form.setData({ name: '', symbol: '', base_unit_id: '', operator: '*', operation_value: '', allow_decimal: true, is_active: true });
        setIsOpen(true);
    };

    const openEdit = (u) => {
        setEditing(u);
        form.setData({
            name: u.name, symbol: u.symbol || '', base_unit_id: u.base_unit_id || '',
            operator: u.operator || '*', operation_value: u.operation_value || '',
            allow_decimal: Boolean(u.allow_decimal), is_active: Boolean(u.is_active),
        });
        setIsOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editing) {
            form.put(`/products/units/${editing.id}`, { onSuccess: () => setIsOpen(false) });
        } else {
            form.post('/products/units', { onSuccess: () => setIsOpen(false) });
        }
    };

    const handleDelete = (id) => {
        if (confirm('هل أنت متأكد من حذف هذه الوحدة؟')) {
            form.delete(`/products/units/${id}`);
        }
    };

    const baseUnits = units ? units.filter(u => !u.base_unit_id) : [];

    return (
        <AppLayout title="إدارة وحدات القياس">
            <Head title="وحدات القياس" />

            {flash?.success && <div className="mb-4 p-4 rounded-xl bg-emerald-950/70 border border-emerald-800 text-emerald-200 text-sm font-bold">{flash.success}</div>}
            {flash?.error   && <div className="mb-4 p-4 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-200 text-sm font-bold">{flash.error}</div>}

            <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-black text-white flex items-center gap-2">
                        <Ruler className="text-violet-400" size={26} />
                        <span>وحدات القياس</span>
                    </h2>
                    <p className="text-sm text-slate-400 mt-1">مثال: قطعة، كرتون (كرتون = 12 × قطعة)</p>
                </div>
                <div className="flex items-center gap-2">
                    {canCreate && (
                        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-md transition">
                            <Plus size={18} /><span>إضافة وحدة</span>
                        </button>
                    )}
                    <Link href="/products" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition border border-slate-700">
                        <ArrowRight size={16} /><span>المنتجات</span>
                    </Link>
                </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
                <table className="w-full text-right text-sm">
                    <thead className="bg-slate-950/80 text-slate-400 font-bold border-b border-slate-800">
                        <tr>
                            <th className="py-3.5 px-4">اسم الوحدة</th>
                            <th className="py-3.5 px-4">الرمز</th>
                            <th className="py-3.5 px-4">الوحدة الأساسية</th>
                            <th className="py-3.5 px-4 text-center">معادلة التحويل</th>
                            <th className="py-3.5 px-4 text-center">كسور</th>
                            <th className="py-3.5 px-4 text-center">منتجات</th>
                            <th className="py-3.5 px-4 text-center">الحالة</th>
                            <th className="py-3.5 px-4 text-left">خيارات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                        {units && units.length > 0 ? units.map((u) => (
                            <tr key={u.id} className="hover:bg-slate-800/40 transition">
                                <td className="py-3 px-4 font-bold text-white">{u.name}</td>
                                <td className="py-3 px-4 text-slate-400 font-mono">{u.symbol || '—'}</td>
                                <td className="py-3 px-4 text-slate-300">{u.base_unit?.name || <span className="text-slate-500 italic text-sm">أساسية</span>}</td>
                                <td className="py-3 px-4 text-center font-mono text-amber-300 text-sm">
                                    {u.base_unit_id && u.operation_value
                                        ? `1 ${u.name} = ${u.operation_value} ${u.operator === '*' ? '×' : '÷'} ${u.base_unit?.name || '?'}`
                                        : '—'}
                                </td>
                                <td className="py-3 px-4 text-center">
                                    <span className={`px-2 py-0.5 rounded-full text-sm font-bold border ${u.allow_decimal ? 'bg-blue-950/50 text-blue-400 border-blue-800/40' : 'bg-slate-800/50 text-slate-400 border-slate-700/40'}`}>
                                        {u.allow_decimal ? 'نعم' : 'لا'}
                                    </span>
                                </td>
                                <td className="py-3 px-4 text-center font-mono font-bold text-cyan-400">{u.products_count || 0}</td>
                                <td className="py-3 px-4 text-center">
                                    <span className={`px-2.5 py-1 rounded-full text-sm font-bold border ${u.is_active ? 'bg-emerald-950/50 text-emerald-400 border-emerald-800/40' : 'bg-rose-950/50 text-rose-400 border-rose-800/40'}`}>
                                        {u.is_active ? 'نشطة' : 'معطلة'}
                                    </span>
                                </td>
                                <td className="py-3 px-4 text-left">
                                    <div className="flex items-center justify-end gap-1.5">
                                        {canEdit && <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 transition"><Edit size={16} /></button>}
                                        {canDelete && <button onClick={() => handleDelete(u.id)} className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/80 text-rose-400 transition"><Trash2 size={16} /></button>}
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan={8} className="py-12 text-center text-slate-500 text-sm">لا توجد وحدات قياس مسجلة.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            <AuxModal title={editing ? 'تعديل وحدة قياس' : 'إضافة وحدة قياس جديدة'} isOpen={isOpen} onClose={() => setIsOpen(false)}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-1">اسم الوحدة *</label>
                            <input type="text" required value={form.data.name} onChange={e => form.setData('name', e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
                            {form.errors.name && <div className="text-rose-400 text-sm mt-1">{form.errors.name}</div>}
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-1">الرمز (اختياري)</label>
                            <input type="text" value={form.data.symbol} onChange={e => form.setData('symbol', e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" placeholder="مثال: pcs, kg" />
                        </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                        <div className="flex items-center gap-1.5 text-slate-400 text-sm font-bold">
                            <Info size={14} /><span>التحويل من وحدة أساسية (اختياري)</span>
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">الوحدة الأساسية</label>
                            <select value={form.data.base_unit_id} onChange={e => form.setData('base_unit_id', e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
                                <option value="">— لا شيء (هذه الوحدة أساسية) —</option>
                                {baseUnits.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                        </div>
                        {form.data.base_unit_id && (
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">العملية</label>
                                    <select value={form.data.operator} onChange={e => form.setData('operator', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
                                        <option value="*">× ضرب</option>
                                        <option value="/">÷ قسمة</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">القيمة</label>
                                    <input type="number" step="0.0001" min="0.0001" value={form.data.operation_value}
                                        onChange={e => form.setData('operation_value', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                                        placeholder="مثال: 12" />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={form.data.allow_decimal} onChange={e => form.setData('allow_decimal', e.target.checked)}
                                className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-blue-600" />
                            <span className="text-sm font-bold text-slate-300">يسمح بالكسور</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={form.data.is_active} onChange={e => form.setData('is_active', e.target.checked)}
                                className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-blue-600" />
                            <span className="text-sm font-bold text-slate-300">نشطة</span>
                        </label>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                        <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-bold transition">إلغاء</button>
                        <button type="submit" disabled={form.processing} className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition disabled:opacity-50">
                            {form.processing ? 'جارِ الحفظ...' : 'حفظ'}
                        </button>
                    </div>
                </form>
            </AuxModal>
        </AppLayout>
    );
}
