import React, { useState } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import { Shield, Plus, Edit, Trash2, X, ArrowRight } from 'lucide-react';

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

function durationLabel(months) {
    if (!months && months !== 0) return '—';
    if (months === 0) return 'بلا ضمان';
    if (months < 12) return `${months} شهر`;
    const y = Math.floor(months / 12);
    const m = months % 12;
    return m > 0 ? `${y} سنة و${m} شهر` : `${y} سنة`;
}

export default function Warranties({ warranties }) {
    const { auth, flash } = usePage().props;
    const perms = auth?.user?.permissions || [];
    const isAdmin = auth?.user?.roles?.includes('مدير النظام') || auth?.user?.roles?.includes('admin');
    const canCreate = isAdmin || perms.includes('warranties.create');
    const canEdit   = isAdmin || perms.includes('warranties.edit');
    const canDelete = isAdmin || perms.includes('warranties.delete');

    const [isOpen, setIsOpen] = useState(false);
    const [editing, setEditing] = useState(null);

    const form = useForm({ name: '', duration_months: 12, terms: '' });

    const openCreate = () => {
        setEditing(null);
        form.setData({ name: '', duration_months: 12, terms: '' });
        setIsOpen(true);
    };

    const openEdit = (w) => {
        setEditing(w);
        form.setData({ name: w.name, duration_months: w.duration_months, terms: w.terms || '' });
        setIsOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editing) {
            form.put(`/products/warranties/${editing.id}`, { onSuccess: () => setIsOpen(false) });
        } else {
            form.post('/products/warranties', { onSuccess: () => setIsOpen(false) });
        }
    };

    const handleDelete = (id) => {
        if (confirm('هل أنت متأكد من حذف هذا الضمان؟')) {
            form.delete(`/products/warranties/${id}`);
        }
    };

    return (
        <AppLayout title="إدارة سياسات الضمان">
            <Head title="الضمانات" />

            {flash?.success && <div className="mb-4 p-4 rounded-xl bg-emerald-950/70 border border-emerald-800 text-emerald-200 text-sm font-bold">{flash.success}</div>}
            {flash?.error   && <div className="mb-4 p-4 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-200 text-sm font-bold">{flash.error}</div>}

            <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-black text-white flex items-center gap-2">
                        <Shield className="text-teal-400" size={26} />
                        <span>سياسات الضمان</span>
                    </h2>
                    <p className="text-sm text-slate-400 mt-1">تعريف مدد الضمان وشروطها المرتبطة بالمنتجات</p>
                </div>
                <div className="flex items-center gap-2">
                    {canCreate && (
                        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-md transition">
                            <Plus size={18} /><span>إضافة ضمان</span>
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
                            <th className="py-3.5 px-4">اسم الضمان</th>
                            <th className="py-3.5 px-4 text-center">المدة</th>
                            <th className="py-3.5 px-4">الشروط</th>
                            <th className="py-3.5 px-4 text-center">عدد المنتجات</th>
                            <th className="py-3.5 px-4 text-left">خيارات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                        {warranties && warranties.length > 0 ? warranties.map((w) => (
                            <tr key={w.id} className="hover:bg-slate-800/40 transition">
                                <td className="py-3 px-4 font-bold text-white">{w.name}</td>
                                <td className="py-3 px-4 text-center">
                                    <span className="px-2.5 py-1 rounded-full text-sm font-bold border bg-teal-950/50 text-teal-400 border-teal-800/40">
                                        {durationLabel(w.duration_months)}
                                    </span>
                                </td>
                                <td className="py-3 px-4 text-slate-400 max-w-xs truncate">{w.terms || '—'}</td>
                                <td className="py-3 px-4 text-center font-mono font-bold text-cyan-400">{w.products_count || 0}</td>
                                <td className="py-3 px-4 text-left">
                                    <div className="flex items-center justify-end gap-1.5">
                                        {canEdit && <button onClick={() => openEdit(w)} className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 transition"><Edit size={16} /></button>}
                                        {canDelete && <button onClick={() => handleDelete(w.id)} className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/80 text-rose-400 transition"><Trash2 size={16} /></button>}
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan={5} className="py-12 text-center text-slate-500 text-sm">لا توجد سياسات ضمان مسجلة.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            <AuxModal title={editing ? 'تعديل سياسة ضمان' : 'إضافة سياسة ضمان جديدة'} isOpen={isOpen} onClose={() => setIsOpen(false)}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-300 mb-1">اسم الضمان *</label>
                        <input type="text" required value={form.data.name} onChange={e => form.setData('name', e.target.value)}
                            placeholder="مثال: ضمان سنة كاملة"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
                        {form.errors.name && <div className="text-rose-400 text-sm mt-1">{form.errors.name}</div>}
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-300 mb-1">المدة (بالأشهر) *</label>
                        <input type="number" required min={0} value={form.data.duration_months}
                            onChange={e => form.setData('duration_months', parseInt(e.target.value) || 0)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
                        {form.data.duration_months > 0 && (
                            <div className="text-teal-400 text-sm mt-1">= {durationLabel(form.data.duration_months)}</div>
                        )}
                        {form.errors.duration_months && <div className="text-rose-400 text-sm mt-1">{form.errors.duration_months}</div>}
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-300 mb-1">الشروط والأحكام</label>
                        <textarea rows={3} value={form.data.terms} onChange={e => form.setData('terms', e.target.value)}
                            placeholder="اكتب شروط الضمان هنا..."
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-blue-500 resize-none" />
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
