import React, { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    Building2,
    Plus,
    Edit3,
    Trash2,
    Users,
    Percent,
    Tag,
    X,
    Save,
    AlertCircle
} from 'lucide-react';

export default function Index({ groups, sellingPriceGroups }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState(null);

    const { data, setData, post, put, reset, processing, errors, clearErrors } = useForm({
        name: '',
        type: 'customer',
        discount_percent: '0.00',
        selling_price_group_id: '',
    });

    const openCreateModal = () => {
        clearErrors();
        reset();
        setEditingGroup(null);
        setIsModalOpen(true);
    };

    const openEditModal = (group) => {
        clearErrors();
        setEditingGroup(group);
        setData({
            name: group.name || '',
            type: group.type || 'customer',
            discount_percent: group.discount_percent || '0.00',
            selling_price_group_id: group.selling_price_group_id || '',
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingGroup(null);
        reset();
        clearErrors();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingGroup) {
            put(`/contacts/customer-groups/${editingGroup.id}`, {
                onSuccess: () => closeModal(),
            });
        } else {
            post('/contacts/customer-groups', {
                onSuccess: () => closeModal(),
            });
        }
    };

    const handleDelete = (id, name) => {
        if (confirm(`هل أنت متأكد من حذف المجموعة "${name}"؟`)) {
            router.delete(`/contacts/customer-groups/${id}`);
        }
    };

    return (
        <AppLayout title="مجموعات جهات التعامل">
            <Head title="مجموعات جهات التعامل" />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
                        <Link href="/contacts" className="hover:text-white transition">جهات الاتصال</Link>
                        <span>/</span>
                        <span className="text-white font-bold">مجموعات العملاء والموردين</span>
                    </div>
                    <h2 className="text-2xl font-black text-white flex items-center gap-2">
                        <Building2 className="text-purple-500" size={26} />
                        <span>مجموعات جهات التعامل</span>
                    </h2>
                </div>

                <button
                    type="button"
                    onClick={openCreateModal}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-lg shadow-purple-600/30 transition"
                >
                    <Plus size={18} />
                    <span>إضافة مجموعة جديدة</span>
                </button>
            </div>

            {/* Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-right text-sm text-slate-300">
                        <thead className="bg-slate-950/60 text-slate-400 font-bold border-b border-slate-800 text-xs uppercase">
                            <tr>
                                <th className="px-5 py-4">اسم المجموعة</th>
                                <th className="px-5 py-4">النوع</th>
                                <th className="px-5 py-4 text-center">نسبة الخصم التلقائية</th>
                                <th className="px-5 py-4">فئة سعر البيع المربوطة</th>
                                <th className="px-5 py-4 text-center">عدد جهات التعامل</th>
                                <th className="px-5 py-4 text-center">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                            {groups?.data?.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-5 py-12 text-center text-slate-500 font-bold">
                                        لا توجد مجموعات مسجلة بعد.
                                    </td>
                                </tr>
                            ) : (
                                groups?.data?.map((g) => (
                                    <tr key={g.id} className="hover:bg-slate-800/40 transition">
                                        <td className="px-5 py-4 font-bold text-white flex items-center gap-2">
                                            <Building2 size={16} className="text-purple-400" />
                                            <span>{g.name}</span>
                                        </td>
                                        <td className="px-5 py-4 text-xs font-bold">
                                            <span className={`px-2.5 py-1 rounded-full border ${
                                                g.type === 'supplier'
                                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                    : g.type === 'customer'
                                                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                                    : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                            }`}>
                                                {g.type === 'supplier' ? 'موردين' : g.type === 'customer' ? 'عملاء' : 'مشترك (عملاء وموردين)'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-center font-mono font-bold text-emerald-400">
                                            {parseFloat(g.discount_percent || 0).toFixed(2)}%
                                        </td>
                                        <td className="px-5 py-4 text-slate-300 text-xs">
                                            {g.selling_price_group?.name || '—'}
                                        </td>
                                        <td className="px-5 py-4 text-center font-mono font-bold text-slate-200">
                                            {g.contacts_count || 0}
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => openEditModal(g)}
                                                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                                                    title="تعديل"
                                                >
                                                    <Edit3 size={15} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(g.id, g.name)}
                                                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                                                    title="حذف"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {groups?.links?.length > 3 && (
                    <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                        <div>
                            عرض {groups?.from || 0} إلى {groups?.to || 0} من أصل {groups?.total || 0} مجموعة
                        </div>
                        <div className="flex gap-1">
                            {groups?.links?.map((link, idx) => (
                                <Link
                                    key={idx}
                                    href={link.url || '#'}
                                    preserveScroll
                                    preserveState
                                    className={`px-3 py-1.5 rounded-lg font-bold transition ${
                                        link.active
                                            ? 'bg-purple-600 text-white'
                                            : !link.url
                                            ? 'text-slate-600 cursor-not-allowed'
                                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
                        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
                            <h3 className="text-lg font-black text-white flex items-center gap-2">
                                <Building2 size={20} className="text-purple-400" />
                                <span>{editingGroup ? 'تعديل مجموعة' : 'إضافة مجموعة جديدة'}</span>
                            </h3>
                            <button
                                type="button"
                                onClick={closeModal}
                                className="text-slate-400 hover:text-white transition p-1"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {Object.keys(errors).length > 0 && (
                            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                                <ul className="list-disc list-inside space-y-1">
                                    {Object.values(errors).map((err, i) => (
                                        <li key={i}>{err}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-1.5">
                                    اسم المجموعة <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="مثال: تجار الجملة VIP"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-1.5">
                                    نوع المجموعة
                                </label>
                                <select
                                    value={data.type}
                                    onChange={(e) => setData('type', e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-purple-500 font-bold"
                                >
                                    <option value="customer">عملاء فقط</option>
                                    <option value="supplier">موردين فقط</option>
                                    <option value="both">مشترك (عملاء وموردين)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-1.5">
                                    نسبة الخصم التلقائية (%)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    value={data.discount_percent}
                                    onChange={(e) => setData('discount_percent', e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-purple-500 font-mono"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-1.5">
                                    فئة سعر البيع المربوطة
                                </label>
                                <select
                                    value={data.selling_price_group_id}
                                    onChange={(e) => setData('selling_price_group_id', e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
                                >
                                    <option value="">بدون فئة خاصة (الافتراضي)</option>
                                    {sellingPriceGroups?.map((sp) => (
                                        <option key={sp.id} value={sp.id}>{sp.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition"
                                >
                                    إلغاء
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-lg shadow-purple-600/30 transition disabled:opacity-50"
                                >
                                    <Save size={16} />
                                    <span>{processing ? 'جاري الحفظ...' : 'حفظ'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
