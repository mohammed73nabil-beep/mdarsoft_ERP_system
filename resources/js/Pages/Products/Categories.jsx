import React, { useState } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import {
    FolderTree,
    Plus,
    Edit,
    Trash2,
    X,
    ArrowRight,
    Package
} from 'lucide-react';

export default function Categories({ categories }) {
    const { auth, flash } = usePage().props;
    const userPermissions = auth?.user?.permissions || [];
    const isAdmin = auth?.user?.roles?.includes('مدير النظام') || auth?.user?.roles?.includes('admin');
    const canCreate = isAdmin || userPermissions.includes('categories.create');
    const canEdit = isAdmin || userPermissions.includes('categories.edit');
    const canDelete = isAdmin || userPermissions.includes('categories.delete');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);

    const form = useForm({
        name: '',
        parent_id: '',
        description: '',
    });

    const openCreateModal = () => {
        setEditingCategory(null);
        form.setData({ name: '', parent_id: '', description: '' });
        setIsModalOpen(true);
    };

    const openEditModal = (cat) => {
        setEditingCategory(cat);
        form.setData({
            name: cat.name || '',
            parent_id: cat.parent_id || '',
            description: cat.description || '',
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingCategory) {
            form.put(`/products/categories/${editingCategory.id}`, {
                onSuccess: () => setIsModalOpen(false),
            });
        } else {
            form.post('/products/categories', {
                onSuccess: () => setIsModalOpen(false),
            });
        }
    };

    const handleDelete = (id) => {
        if (confirm('هل أنت متأكد من رغبتك في حذف هذا الصنف؟')) {
            form.delete(`/products/categories/${id}`);
        }
    };

    return (
        <AppLayout title="إدارة الأصناف (Categories)">
            <Head title="أصناف المنتجات" />

            {flash?.success && (
                <div className="mb-4 p-4 rounded-xl bg-emerald-950/70 border border-emerald-800 text-emerald-200 text-sm font-bold">
                    {flash.success}
                </div>
            )}
            {flash?.error && (
                <div className="mb-4 p-4 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-200 text-sm font-bold">
                    {flash.error}
                </div>
            )}

            <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-black text-white flex items-center gap-2">
                        <FolderTree className="text-blue-500" size={26} />
                        <span>أصناف المنتجات (Categories)</span>
                    </h2>
                    <p className="text-sm text-slate-400 mt-1">الهيكل الشجري للأصناف والتصنيفات الفرعية</p>
                </div>

                <div className="flex items-center gap-2">
                    {canCreate && (
                        <button
                            onClick={openCreateModal}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-md transition"
                        >
                            <Plus size={18} />
                            <span>إضافة صنف جديد</span>
                        </button>
                    )}
                    <Link
                        href="/products"
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition border border-slate-700"
                    >
                        <ArrowRight size={16} />
                        <span>قائمة المنتجات</span>
                    </Link>
                </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
                <table className="w-full text-right text-sm">
                    <thead className="bg-slate-950/80 text-slate-400 font-bold border-b border-slate-800">
                        <tr>
                            <th className="py-3.5 px-4">اسم الصنف</th>
                            <th className="py-3.5 px-4">الصنف الأب (الرئيسي)</th>
                            <th className="py-3.5 px-4">الوصف</th>
                            <th className="py-3.5 px-4 text-center">عدد المنتجات</th>
                            <th className="py-3.5 px-4 text-left">خيارات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                        {categories && categories.length > 0 ? (
                            categories.map((c) => (
                                <tr key={c.id} className="hover:bg-slate-800/40 transition">
                                    <td className="py-3 px-4 font-bold text-white text-sm">{c.name}</td>
                                    <td className="py-3 px-4 text-slate-300 text-sm">{c.parent?.name || '— صنف رئيسي —'}</td>
                                    <td className="py-3 px-4 text-slate-400 text-sm">{c.description || '—'}</td>
                                    <td className="py-3 px-4 text-center">
                                        <span className="font-mono font-bold text-cyan-400 text-sm">{c.products_count || 0}</span>
                                    </td>
                                    <td className="py-3 px-4 text-left">
                                        <div className="flex items-center justify-end gap-1.5">
                                            {canEdit && (
                                                <button
                                                    onClick={() => openEditModal(c)}
                                                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 transition"
                                                    title="تعديل"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                            )}
                                            {canDelete && (
                                                <button
                                                    onClick={() => handleDelete(c.id)}
                                                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/80 text-rose-400 hover:text-rose-300 transition"
                                                    title="حذف"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="py-12 text-center text-slate-500 text-sm">
                                    لا توجد أصناف مسجلة حالياً.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                            <h3 className="text-base font-bold text-white">
                                {editingCategory ? 'تعديل صنف' : 'إضافة صنف جديد'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-1">اسم الصنف *</label>
                                <input
                                    type="text"
                                    required
                                    value={form.data.name}
                                    onChange={(e) => form.setData('name', e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                                />
                                {form.errors.name && <div className="text-rose-400 text-sm mt-1">{form.errors.name}</div>}
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-1">الصنف الأب (للتصنيف الفرعي)</label>
                                <select
                                    value={form.data.parent_id}
                                    onChange={(e) => form.setData('parent_id', e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                                >
                                    <option value="">— صنف رئيسي (بدون أب) —</option>
                                    {categories
                                        .filter((c) => !editingCategory || c.id !== editingCategory.id)
                                        .map((c) => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                </select>
                                {form.errors.parent_id && <div className="text-rose-400 text-sm mt-1">{form.errors.parent_id}</div>}
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-1">الوصف</label>
                                <textarea
                                    rows={2}
                                    value={form.data.description}
                                    onChange={(e) => form.setData('description', e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-bold transition"
                                >
                                    إلغاء
                                </button>
                                <button
                                    type="submit"
                                    disabled={form.processing}
                                    className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition disabled:opacity-50"
                                >
                                    {form.processing ? 'جارِ الحفظ...' : 'حفظ'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
