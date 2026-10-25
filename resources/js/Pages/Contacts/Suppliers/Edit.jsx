import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    Truck,
    ArrowRight,
    Save,
    AlertCircle,
    Building2,
    Phone,
    Mail,
    MapPin,
    Receipt,
    Wallet
} from 'lucide-react';

export default function Edit({ contact, groups, representatives }) {
    const { data, setData, put, processing, errors } = useForm({
        type: contact.type || 'supplier',
        name: contact.name || '',
        code: contact.code || '',
        phone: contact.phone || '',
        phone_alt: contact.phone_alt || '',
        email: contact.email || '',
        address: contact.address || '',
        tax_number: contact.tax_number || '',
        contact_group_id: contact.contact_group_id || '',
        representative_id: contact.representative_id || '',
        credit_limit: contact.credit_limit || '0.00',
        opening_balance: contact.opening_balance || '0.00',
        opening_balance_type: contact.opening_balance_type || 'credit',
        is_active: Boolean(contact.is_active),
        notes: contact.notes || '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(`/contacts/suppliers/${contact.id}`);
    };

    return (
        <AppLayout title={`تعديل المورد: ${contact.name}`}>
            <Head title={`تعديل المورد: ${contact.name}`} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
                        <Link href="/contacts" className="hover:text-white transition">جهات الاتصال</Link>
                        <span>/</span>
                        <Link href="/contacts/suppliers" className="hover:text-white transition">الموردين</Link>
                        <span>/</span>
                        <span className="text-white font-bold">{contact.name}</span>
                    </div>
                    <h2 className="text-2xl font-black text-white flex items-center gap-2">
                        <Truck className="text-emerald-500" size={26} />
                        <span>تعديل بيانات المورد</span>
                    </h2>
                </div>

                <div className="flex items-center gap-2">
                    <Link
                        href={`/contacts/suppliers/${contact.id}`}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition border border-slate-700"
                    >
                        <span>عرض المورد</span>
                    </Link>
                    <Link
                        href="/contacts/suppliers"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition border border-slate-700"
                    >
                        <ArrowRight size={16} />
                        <span>القائمة</span>
                    </Link>
                </div>
            </div>

            {/* Errors Banner */}
            {Object.keys(errors).length > 0 && (
                <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
                    <div className="flex items-center gap-2 font-bold mb-1">
                        <AlertCircle size={18} />
                        <span>يرجى مراجعة الأخطاء التالية:</span>
                    </div>
                    <ul className="list-disc list-inside space-y-1 mr-4">
                        {Object.values(errors).map((err, i) => (
                            <li key={i}>{err}</li>
                        ))}
                    </ul>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* 1. Basic Information */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                    <h3 className="text-base font-bold text-white mb-4 pb-3 border-b border-slate-800 flex items-center gap-2">
                        <Building2 className="text-emerald-400" size={18} />
                        <span>البيانات الأساسية للمورد</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-2">
                                اسم المورد / المنشأة <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                            />
                            {errors.name && <p className="text-rose-400 text-xs mt-1">{errors.name}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-2">
                                كود المورد
                            </label>
                            <input
                                type="text"
                                value={data.code}
                                onChange={(e) => setData('code', e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                            />
                            {errors.code && <p className="text-rose-400 text-xs mt-1">{errors.code}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-2">
                                مجموعة المورد
                            </label>
                            <select
                                value={data.contact_group_id}
                                onChange={(e) => setData('contact_group_id', e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                            >
                                <option value="">اختر المجموعة (افتراضي)</option>
                                {groups?.map((g) => (
                                    <option key={g.id} value={g.id}>{g.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-2">
                                رقم الهاتف الرئيسي
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={data.phone}
                                    onChange={(e) => setData('phone', e.target.value)}
                                    dir="ltr"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 pl-10 text-right"
                                />
                                <Phone size={16} className="absolute left-3 top-3 text-slate-500" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-2">
                                هاتف إضافي
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={data.phone_alt}
                                    onChange={(e) => setData('phone_alt', e.target.value)}
                                    dir="ltr"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 pl-10 text-right"
                                />
                                <Phone size={16} className="absolute left-3 top-3 text-slate-500" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-2">
                                البريد الإلكتروني
                            </label>
                            <div className="relative">
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    dir="ltr"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 pl-10 text-right"
                                />
                                <Mail size={16} className="absolute left-3 top-3 text-slate-500" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-2">
                                الرقم الضريبي
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={data.tax_number}
                                    onChange={(e) => setData('tax_number', e.target.value)}
                                    dir="ltr"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 pl-10 text-right font-mono"
                                />
                                <Receipt size={16} className="absolute left-3 top-3 text-slate-500" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-2">
                                تصنيف جهة التعامل
                            </label>
                            <select
                                value={data.type}
                                onChange={(e) => setData('type', e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 font-bold"
                            >
                                <option value="supplier">مورد فقط</option>
                                <option value="both">مورد وعميل في نفس الوقت</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-2">
                                المندوب المسؤول
                            </label>
                            <select
                                value={data.representative_id}
                                onChange={(e) => setData('representative_id', e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                            >
                                <option value="">بدون مندوب محدد</option>
                                {representatives?.map((r) => (
                                    <option key={r.id} value={r.id}>{r.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="mt-4">
                        <label className="block text-sm font-bold text-slate-300 mb-2">
                            العنوان الوطني / المستودع
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={data.address}
                                onChange={(e) => setData('address', e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 pl-10"
                            />
                            <MapPin size={16} className="absolute left-3 top-3 text-slate-500" />
                        </div>
                    </div>
                </div>

                {/* 2. Financial Settings */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                    <h3 className="text-base font-bold text-white mb-4 pb-3 border-b border-slate-800 flex items-center gap-2">
                        <Wallet className="text-amber-400" size={18} />
                        <span>الإعدادات المالية</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-2">
                                حد الائتمان (ر.س)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={data.credit_limit}
                                onChange={(e) => setData('credit_limit', e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-2">
                                حالة جهة التعامل
                            </label>
                            <select
                                value={data.is_active ? '1' : '0'}
                                onChange={(e) => setData('is_active', e.target.value === '1')}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 font-bold"
                            >
                                <option value="1">نشط</option>
                                <option value="0">معطل</option>
                            </select>
                        </div>
                    </div>

                    <div className="mt-4">
                        <label className="block text-sm font-bold text-slate-300 mb-2">
                            ملاحظات
                        </label>
                        <textarea
                            rows={3}
                            value={data.notes}
                            onChange={(e) => setData('notes', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                        />
                    </div>
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-end gap-3 pt-4">
                    <Link
                        href={`/contacts/suppliers/${contact.id}`}
                        className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition"
                    >
                        إلغاء
                    </Link>
                    <button
                        type="submit"
                        disabled={processing}
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition disabled:opacity-50"
                    >
                        <Save size={18} />
                        <span>{processing ? 'جاري الحفظ...' : 'حفظ التعديلات'}</span>
                    </button>
                </div>
            </form>
        </AppLayout>
    );
}
