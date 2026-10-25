import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    Users,
    ArrowRight,
    Save,
    AlertCircle,
    User,
    Phone,
    Mail,
    MapPin,
    Receipt,
    Wallet,
    Tag,
    Building2
} from 'lucide-react';

export default function Create({ groups, sellingPriceGroups, representatives }) {
    const { data, setData, post, processing, errors } = useForm({
        type: 'customer',
        name: '',
        code: '',
        phone: '',
        phone_alt: '',
        email: '',
        address: '',
        tax_number: '',
        contact_group_id: '',
        selling_price_group_id: '',
        representative_id: '',
        credit_limit: '0.00',
        opening_balance: '0.00',
        opening_balance_type: 'debit', // debit for customers by default (they owe us)
        is_active: true,
        notes: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/contacts/customers');
    };

    return (
        <AppLayout title="إضافة عميل جديد">
            <Head title="إضافة عميل جديد" />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
                        <Link href="/contacts" className="hover:text-white transition">جهات الاتصال</Link>
                        <span>/</span>
                        <Link href="/contacts/customers" className="hover:text-white transition">العملاء</Link>
                        <span>/</span>
                        <span className="text-white font-bold">إضافة عميل</span>
                    </div>
                    <h2 className="text-2xl font-black text-white flex items-center gap-2">
                        <Users className="text-blue-500" size={26} />
                        <span>إضافة عميل جديد</span>
                    </h2>
                </div>

                <Link
                    href="/contacts/customers"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition border border-slate-700"
                >
                    <ArrowRight size={16} />
                    <span>العودة للقائمة</span>
                </Link>
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
                        <User className="text-blue-400" size={18} />
                        <span>البيانات الأساسية للعميل</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-2">
                                اسم العميل / الشركة <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="مثال: متجر الإلكترونيات المتقدمة"
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                            />
                            {errors.name && <p className="text-rose-400 text-xs mt-1">{errors.name}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-2">
                                كود العميل (اختياري)
                            </label>
                            <input
                                type="text"
                                value={data.code}
                                onChange={(e) => setData('code', e.target.value)}
                                placeholder="اتركه فارغاً للتوليد التلقائي (CUS-0001)"
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                            />
                            {errors.code && <p className="text-rose-400 text-xs mt-1">{errors.code}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-2">
                                مجموعة العميل
                            </label>
                            <select
                                value={data.contact_group_id}
                                onChange={(e) => setData('contact_group_id', e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                            >
                                <option value="">اختر المجموعة (افتراضي)</option>
                                {groups?.map((g) => (
                                    <option key={g.id} value={g.id}>{g.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-2">
                                فئة سعر البيع
                            </label>
                            <select
                                value={data.selling_price_group_id}
                                onChange={(e) => setData('selling_price_group_id', e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                            >
                                <option value="">سعر البيع الافتراضي</option>
                                {sellingPriceGroups?.map((sp) => (
                                    <option key={sp.id} value={sp.id}>{sp.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-2">
                                المندوب المسؤول
                            </label>
                            <select
                                value={data.representative_id}
                                onChange={(e) => setData('representative_id', e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                            >
                                <option value="">بدون مندوب محدد</option>
                                {representatives?.map((r) => (
                                    <option key={r.id} value={r.id}>{r.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-2">
                                تصنيف جهة التعامل
                            </label>
                            <select
                                value={data.type}
                                onChange={(e) => setData('type', e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 font-bold"
                            >
                                <option value="customer">عميل فقط</option>
                                <option value="both">عميل ومورد في نفس الوقت</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-2">
                                رقم الهاتف
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={data.phone}
                                    onChange={(e) => setData('phone', e.target.value)}
                                    placeholder="05XXXXXXXX"
                                    dir="ltr"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 pl-10 text-right font-mono"
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
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 pl-10 text-right font-mono"
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
                                    placeholder="client@domain.com"
                                    dir="ltr"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 pl-10 text-right"
                                />
                                <Mail size={16} className="absolute left-3 top-3 text-slate-500" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-2">
                                الرقم الضريبي للعميل
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={data.tax_number}
                                    onChange={(e) => setData('tax_number', e.target.value)}
                                    placeholder="3XXXXXXXXXXXXXX"
                                    dir="ltr"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 pl-10 text-right font-mono"
                                />
                                <Receipt size={16} className="absolute left-3 top-3 text-slate-500" />
                            </div>
                        </div>
                    </div>

                    <div className="mt-4">
                        <label className="block text-sm font-bold text-slate-300 mb-2">
                            العنوان الوطني / موقع التوصيل
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={data.address}
                                onChange={(e) => setData('address', e.target.value)}
                                placeholder="المدينة، الحي، الرمز البريدي..."
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 pl-10"
                            />
                            <MapPin size={16} className="absolute left-3 top-3 text-slate-500" />
                        </div>
                    </div>
                </div>

                {/* 2. Financial Settings & Opening Balance */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                    <h3 className="text-base font-bold text-white mb-4 pb-3 border-b border-slate-800 flex items-center gap-2">
                        <Wallet className="text-amber-400" size={18} />
                        <span>الإعدادات المالية وسقف الائتمان</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-2">
                                سقف الائتمان المسموح (ر.س)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={data.credit_limit}
                                onChange={(e) => setData('credit_limit', e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                            />
                            <span className="text-[11px] text-slate-500 mt-1 block">
                                أقصى مديونية آجل يسمح بها للعميل (0 = بلا سقف).
                            </span>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-2">
                                الرصيد الافتتاحي (ر.س)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={data.opening_balance}
                                onChange={(e) => setData('opening_balance', e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                            />
                            <span className="text-[11px] text-slate-500 mt-1 block">
                                يُقيد تلقائياً في دفتر الأستاذ المساعد للعميل.
                            </span>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-2">
                                نوع الرصيد الافتتاحي
                            </label>
                            <select
                                value={data.opening_balance_type}
                                onChange={(e) => setData('opening_balance_type', e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 font-bold"
                            >
                                <option value="debit">مدين (مستحق على العميل لصالحنا - الافتراضي)</option>
                                <option value="credit">دائن (رصيد مقدم مدفوع من العميل)</option>
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
                            placeholder="أي شروط تعامل أو ملاحظات إضافية..."
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                        />
                    </div>
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-end gap-3 pt-4">
                    <Link
                        href="/contacts/customers"
                        className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition"
                    >
                        إلغاء
                    </Link>
                    <button
                        type="submit"
                        disabled={processing}
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition disabled:opacity-50"
                    >
                        <Save size={18} />
                        <span>{processing ? 'جاري الحفظ...' : 'حفظ العميل'}</span>
                    </button>
                </div>
            </form>
        </AppLayout>
    );
}
