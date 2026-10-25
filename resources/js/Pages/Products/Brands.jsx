import React, { useState } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import { Award, Plus, Edit, Trash2, X, ArrowRight } from 'lucide-react';

function AuxModal({ title, isOpen, onClose, children }) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                    <h3 className="text-base font-bold text-white">{title}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={18} /></button>
                </div>
                {children}
            </div>
        </div>
    );
}

export default function Brands({ brands }) {
    const { auth, flash } = usePage().props;
    const perms = auth?.user?.permissions || [];
    const isAdmin = auth?.user?.roles?.includes('مدير النظام') || auth?.user?.roles?.includes('admin');
    const canCreate = isAdmin || perms.includes('brands.create');
    const canEdit   = isAdmin || perms.includes('brands.edit');
    const canDelete = isAdmin || perms.includes('brands.delete');

    const [isOpen, setIsOpen]       = useState(false);
    const [editing, setEditing]     = useState(null);

    const form = useForm({ name: '', description: '', is_active: true });

    const openCreate = () => {
        setEditing(null);
        form.setData({ name: '', description: '', is_active: true });
        setIsOpen(true);
    };

    const openEdit = (b) => {
        setEditing(b);
        form.setData({ name: b.name, description: b.description || '', is_active: Boolean(b.is_active) });
        setIsOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editing) {
            form.put(`/products/brands/${editing.id}`, { onSuccess: () => setIsOpen(false) });
        } else {
            form.post('/products/brands', { onSuccess: () => setIsOpen(false) });
        }
    };

    const handleDelete = (id) => {
        if (confirm('هل أنت متأكد من حذف هذه العلامة التجارية؟')) {
            form.delete(`/products/brands/${id}`);
        }
    };

    return (
        <AppLayout title="إدارة العلامات التجارية">
            <Head title="العلامات التجارية" />
            {flash?.success && <div className="mb-4 p-4 rounded-xl bg-emerald-950/70 border border-emerald-800 text-emerald-200 text-sm font-bold">{flash.success}</div>}
            {flash?.error   && <div className="mb-4 p-4 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-200 text-sm font-bold">{flash.error}</div>}

            <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-black text-white flex items-center gap-2">
                        <Award className="text-amber-400" size={26} />
                        <span>العلامات التجارية (Brands)</span>
                    </h2>
                    <p className="text-sm text-slate-400 mt-1">إدارة ماركات المنتجات: Apple، Samsung، Anker...</p>
                </div>
                <div className="flex items-center gap-2">
                    {canCreate && (
                        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-md transition">
                            <Plus size={18} /><span>إضافة علامة</span>
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
                            <th className="py-3.5 px-4">اسم العلامة</th>
                            <th className="py-3.5 px-4">الوصف</th>
                            <th className="py-3.5 px-4 text-center">عدد المنتجات</th>
                            <th className="py-3.5 px-4 text-center">الحالة</th>
                            <th className="py-3.5 px-4 text-left">خيارات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                        {brands && brands.length > 0 ? brands.map((b) => (
                            <tr key={b.id} className="hover:bg-slate-800/40 transition">
                                <td className="py-3 px-4 font-bold text-white">{b.name}</td>
                                <td className="py-3 px-4 text-slate-400">{b.description || '—'}</td>
                                <td className="py-3 px-4 text-center font-mono font-bold text-cyan-400">{b.products_count || 0}</td>
                                <td className="py-3 px-4 text-center">
                                    <span className={`px-2.5 py-1 rounded-full text-sm font-bold border ${b.is_active ? 'bg-emerald-950/50 text-emerald-400 border-emerald-800/40' : 'bg-rose-950/50 text-rose-400 border-rose-800/40'}`}>
                                        {b.is_active ? 'نشطة' : 'معطلة'}
                                    </span>
                                </td>
                                <td className="py-3 px-4 text-left">
                                    <div className="flex items-center justify-end gap-1.5">
                                        {canEdit && <button onClick={() => openEdit(b)} className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 transition" title="تعديل"><Edit size={16} /></button>}
                                        {canDelete && <button onClick={() => handleDelete(b.id)} className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/80 text-rose-400 transition" title="حذف"><Trash2 size={16} /></button>}
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan={5} className="py-12 text-center text-slate-500 text-sm">لا توجد علامات تجارية مسجلة.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            <AuxModal title={editing ? 'تعديل علامة تجارية' : 'إضافة علامة تجارية جديدة'} isOpen={isOpen} onClose={() => setIsOpen(false)}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-300 mb-1">الاسم *</label>
                        <input type="text" required value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
                        {form.errors.name && <div className="text-rose-400 text-sm mt-1">{form.errors.name}</div>}
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-300 mb-1">الوصف</label>
                        <textarea rows={2} value={form.data.description} onChange={(e) => form.setData('description', e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-blue-500" />
                    </div>
                    <div className="flex items-center gap-2">
                        <input type="checkbox" id="brand_active" checked={form.data.is_active} onChange={(e) => form.setData('is_active', e.target.checked)} className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-blue-600" />
                        <label htmlFor="brand_active" className="text-sm font-bold text-slate-300 cursor-pointer">نشطة</label>
                    </div>
                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                        <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-bold transition">إلغاء</button>
                        <button type="submit" disabled={form.processing} className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition disabled:opacity-50">{form.processing ? 'جارِ الحفظ...' : 'حفظ'}</button>
                    </div>
                </form>
            </AuxModal>
        </AppLayout>
    );
}
