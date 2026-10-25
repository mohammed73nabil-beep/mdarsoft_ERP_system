import React, { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    Percent,
    Plus,
    Trash2,
    Edit2,
    Save,
    ArrowRight,
    CheckCircle2,
    X,
} from 'lucide-react';

export default function Discounts({ discounts = [] }) {
    const [showModal, setShowModal] = useState(false);
    const [editingDiscount, setEditingDiscount] = useState(null);

    const { data, setData, post, put, processing, reset, errors } = useForm({
        name: '',
        type: 'percentage',
        value: 10,
        applies_to: 'all',
        target_id: '',
        start_date: '',
        end_date: '',
        min_amount: 0,
        is_active: true,
    });

    const openCreateModal = () => {
        setEditingDiscount(null);
        reset();
        setShowModal(true);
    };

    const openEditModal = (d) => {
        setEditingDiscount(d);
        setData({
            name: d.name,
            type: d.type,
            value: Number(d.value),
            applies_to: d.applies_to,
            target_id: d.target_id || '',
            start_date: d.start_date || '',
            end_date: d.end_date || '',
            min_amount: Number(d.min_amount || 0),
            is_active: Boolean(d.is_active),
        });
        setShowModal(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingDiscount) {
            put(`/sales/discounts/${editingDiscount.id}`, {
                onSuccess: () => {
                    setShowModal(false);
                    reset();
                },
            });
        } else {
            post('/sales/discounts', {
                onSuccess: () => {
                    setShowModal(false);
                    reset();
                },
            });
        }
    };

    const handleDelete = (id, name) => {
        if (confirm(`هل أنت متأكد من حذف الخصم "${name}"؟`)) {
            router.delete(`/sales/discounts/${id}`);
        }
    };

    return (
        <AppLayout title="إدارة الخصومات والعروض">
            <Head title="إدارة الخصومات والعروض" />

            <div className="p-6 max-w-6xl mx-auto space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Link href="/sales/all" className="text-slate-400 hover:text-white text-xs flex items-center gap-1">
                                <ArrowRight className="w-3.5 h-3.5" />
                                المبيعات
                            </Link>
                        </div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Percent className="w-7 h-7 text-emerald-500" />
                            إدارة الخصومات التلقائية
                        </h1>
                        <p className="text-slate-400 text-sm mt-1">
                            تعريف قواعد الخصم الثابتة والنسبية وتطبيقها التلقائي على الفواتير
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={openCreateModal}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-emerald-900/30 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        إضافة خصم جديد
                    </button>
                </div>

                {/* Table */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-right text-sm">
                            <thead className="bg-slate-800/70 text-slate-400 text-xs font-medium uppercase border-b border-slate-800">
                                <tr>
                                    <th className="px-4 py-3">اسم الخصم</th>
                                    <th className="px-4 py-3">النوع</th>
                                    <th className="px-4 py-3">القيمة</th>
                                    <th className="px-4 py-3">ينطبق على</th>
                                    <th className="px-4 py-3">الفترة</th>
                                    <th className="px-4 py-3">الحالة</th>
                                    <th className="px-4 py-3 text-center">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {discounts.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-4 py-12 text-center text-slate-500">
                                            لا توجد خصومات معرفة حالياً
                                        </td>
                                    </tr>
                                ) : (
                                    discounts.map((d) => (
                                        <tr key={d.id} className="hover:bg-slate-800/30 transition-colors">
                                            <td className="px-4 py-3.5 font-bold text-white">{d.name}</td>
                                            <td className="px-4 py-3.5 text-slate-300">
                                                {d.type === 'percentage' ? 'نسبة مئوية' : 'مبلغ ثابت'}
                                            </td>
                                            <td className="px-4 py-3.5 font-bold text-emerald-400">
                                                {d.type === 'percentage' ? `${d.value}%` : `${d.value} ر.س`}
                                            </td>
                                            <td className="px-4 py-3.5 text-slate-300 text-xs">
                                                <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                                                    {d.applies_to === 'all' ? 'جميع المنتجات' : d.applies_to === 'category' ? 'تصنيف محدد' : d.applies_to === 'product' ? 'منتج محدد' : 'مجموعة عملاء'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5 text-slate-400 text-xs">
                                                {d.start_date || d.end_date ? `${d.start_date || '-'} إلى ${d.end_date || '-'}` : 'دائم'}
                                            </td>
                                            <td className="px-4 py-3.5">
                                                {d.is_active ? (
                                                    <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium">
                                                        <CheckCircle2 className="w-3.5 h-3.5" /> نشط
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-slate-500">معطل</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3.5 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button
                                                        onClick={() => openEditModal(d)}
                                                        className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 transition-colors"
                                                    >
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(d.id, d.name)}
                                                        className="p-1.5 text-slate-400 hover:text-rose-400 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 transition-colors"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                    <Percent className="w-5 h-5 text-emerald-400" />
                                    {editingDiscount ? 'تعديل الخصم' : 'إضافة خصم جديد'}
                                </h3>
                                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="text-xs text-slate-400 mb-1 block">اسم الخصم *</label>
                                    <input
                                        type="text"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="مثال: خصم نهاية العام"
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                        required
                                    />
                                    {errors.name && <p className="text-rose-500 text-xs mt-1">{errors.name}</p>}
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs text-slate-400 mb-1 block">النوع *</label>
                                        <select
                                            value={data.type}
                                            onChange={(e) => setData('type', e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                        >
                                            <option value="percentage">نسبة مئوية (%)</option>
                                            <option value="fixed">مبلغ ثابت (ر.س)</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-xs text-slate-400 mb-1 block">القيمة *</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={data.value}
                                            onChange={(e) => setData('value', e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs text-slate-400 mb-1 block">ينطبق على *</label>
                                    <select
                                        value={data.applies_to}
                                        onChange={(e) => setData('applies_to', e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                    >
                                        <option value="all">جميع المنتجات والفواتير</option>
                                        <option value="category">تصنيف محدد</option>
                                        <option value="product">منتج محدد</option>
                                        <option value="contact_group">مجموعة عملاء محددة</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs text-slate-400 mb-1 block">تاريخ البدء</label>
                                        <input
                                            type="date"
                                            value={data.start_date}
                                            onChange={(e) => setData('start_date', e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-sm text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 mb-1 block">تاريخ الانتهاء</label>
                                        <input
                                            type="date"
                                            value={data.end_date}
                                            onChange={(e) => setData('end_date', e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-sm text-white"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="inline-flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={data.is_active}
                                            onChange={(e) => setData('is_active', e.target.checked)}
                                            className="rounded border-slate-700 bg-slate-800 text-emerald-600 focus:ring-emerald-500"
                                        />
                                        <span className="text-sm font-medium text-white">تفعيل الخصم</span>
                                    </label>
                                </div>

                                <div className="flex gap-2 pt-2 border-t border-slate-800">
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-sm"
                                    >
                                        {processing ? 'جاري الحفظ...' : editingDiscount ? 'حفظ التعديلات' : 'إضافة الخصم'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-lg"
                                    >
                                        إلغاء
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
