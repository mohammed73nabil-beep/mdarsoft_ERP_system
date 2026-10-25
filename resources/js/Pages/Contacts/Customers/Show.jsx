import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    Users,
    ArrowRight,
    Edit3,
    FileText,
    CreditCard,
    Phone,
    Mail,
    MapPin,
    Receipt,
    Building2,
    CheckCircle2,
    XCircle,
    ArrowUpRight,
    Trash2,
    Tag,
    Wallet
} from 'lucide-react';

export default function Show({ contact, stats }) {
    const balance = stats?.current_balance || 0;

    const handleDelete = () => {
        if (confirm(`هل أنت متأكد من حذف العميل "${contact.name}"؟`)) {
            router.delete(`/contacts/${contact.id}`);
        }
    };

    const handleToggleActive = () => {
        router.post(`/contacts/${contact.id}/toggle-active`, {}, {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout title={`العميل: ${contact.name}`}>
            <Head title={`العميل: ${contact.name}`} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
                        <Link href="/contacts" className="hover:text-white transition">جهات الاتصال</Link>
                        <span>/</span>
                        <Link href="/contacts/customers" className="hover:text-white transition">العملاء</Link>
                        <span>/</span>
                        <span className="text-white font-bold">{contact.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-black text-white flex items-center gap-2">
                            <Users className="text-blue-500" size={26} />
                            <span>{contact.name}</span>
                        </h2>
                        <span className="font-mono text-sm px-3 py-1 rounded-lg bg-slate-800 text-blue-400 font-bold border border-slate-700">
                            {contact.code || `CUS-${contact.id}`}
                        </span>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                            contact.is_active
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}>
                            {contact.is_active ? 'نشط' : 'معطل'}
                        </span>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Link
                        href={`/contacts/${contact.id}/ledger`}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition"
                    >
                        <FileText size={16} />
                        <span>كشف الحساب التفصيلي</span>
                    </Link>

                    <Link
                        href={`/contacts/customers/${contact.id}/edit`}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition border border-slate-700"
                    >
                        <Edit3 size={16} />
                        <span>تعديل</span>
                    </Link>

                    <button
                        type="button"
                        onClick={handleToggleActive}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-bold border border-slate-700"
                    >
                        {contact.is_active ? 'تعطيل' : 'تفعيل'}
                    </button>

                    <button
                        type="button"
                        onClick={handleDelete}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-sm font-bold border border-rose-500/20"
                    >
                        <Trash2 size={16} />
                        <span>حذف</span>
                    </button>

                    <Link
                        href="/contacts/customers"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-bold text-sm transition border border-slate-700"
                    >
                        <ArrowRight size={16} />
                        <span>العودة</span>
                    </Link>
                </div>
            </div>

            {/* Financial Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-400">الرصيد المدين المستحق (لنا)</span>
                        <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                            <Wallet size={18} />
                        </div>
                    </div>
                    <div className={`text-2xl font-black font-mono ${balance > 0 ? 'text-amber-400' : balance < 0 ? 'text-emerald-400' : 'text-slate-300'}`}>
                        {balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs text-slate-400 font-normal">ر.س</span>
                    </div>
                    <span className="text-[11px] text-slate-500 mt-1 block">
                        {balance > 0 ? 'مبلغ مطلوب تحصيله من العميل' : balance < 0 ? 'رصيد دائن مدفوع مقدماً من العميل' : 'الحساب متوازن'}
                    </span>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-400">سقف الائتمان المسموح</span>
                        <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                            <CreditCard size={18} />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-purple-300 font-mono">
                        {(stats?.credit_limit || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs text-slate-400 font-normal">ر.س</span>
                    </div>
                    <span className="text-[11px] text-slate-500 mt-1 block">
                        الحد الأعلى لمبيعات الآجل
                    </span>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-400">الائتمان المتاح حالياً</span>
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                            <Building2 size={18} />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-emerald-400 font-mono">
                        {(stats?.credit_balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs text-slate-400 font-normal">ر.س</span>
                    </div>
                    <span className="text-[11px] text-slate-500 mt-1 block">المتبقي قبل بلوغ سقف الائتمان</span>
                </div>
            </div>

            {/* Profile Information Card & Ledger Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl lg:col-span-1">
                    <h3 className="text-base font-bold text-white mb-4 pb-3 border-b border-slate-800 flex items-center gap-2">
                        <Users className="text-blue-400" size={18} />
                        <span>بيانات العميل</span>
                    </h3>

                    <div className="space-y-4 text-sm">
                        <div className="flex items-center justify-between py-2 border-b border-slate-800/60">
                            <span className="text-slate-400">المجموعة:</span>
                            <span className="font-bold text-white">{contact.group?.name || '—'}</span>
                        </div>

                        <div className="flex items-center justify-between py-2 border-b border-slate-800/60">
                            <span className="text-slate-400">فئة سعر البيع:</span>
                            <span className="font-bold text-blue-400">{contact.selling_price_group?.name || 'الافتراضي'}</span>
                        </div>

                        <div className="flex items-center justify-between py-2 border-b border-slate-800/60">
                            <span className="text-slate-400">الرقم الضريبي:</span>
                            <span className="font-mono font-bold text-slate-200">{contact.tax_number || '—'}</span>
                        </div>

                        <div className="flex items-center justify-between py-2 border-b border-slate-800/60">
                            <span className="text-slate-400">الهاتف:</span>
                            <span dir="ltr" className="font-mono text-slate-200">{contact.phone || '—'}</span>
                        </div>

                        <div className="flex items-center justify-between py-2 border-b border-slate-800/60">
                            <span className="text-slate-400">هاتف بديل:</span>
                            <span dir="ltr" className="font-mono text-slate-200">{contact.phone_alt || '—'}</span>
                        </div>

                        <div className="flex items-center justify-between py-2 border-b border-slate-800/60">
                            <span className="text-slate-400">البريد الإلكتروني:</span>
                            <span className="text-slate-200">{contact.email || '—'}</span>
                        </div>

                        <div className="flex items-center justify-between py-2 border-b border-slate-800/60">
                            <span className="text-slate-400">المندوب:</span>
                            <span className="text-slate-200">{contact.representative?.name || '—'}</span>
                        </div>

                        <div className="py-2">
                            <span className="text-slate-400 block mb-1">العنوان:</span>
                            <span className="text-slate-200">{contact.address || '—'}</span>
                        </div>

                        {contact.notes && (
                            <div className="py-2 border-t border-slate-800/60">
                                <span className="text-slate-400 block mb-1">ملاحظات:</span>
                                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800">
                                    {contact.notes}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Statement / Ledger Preview */}
                <div className="lg:col-span-2">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                                <FileText className="text-blue-400" size={18} />
                                <span>آخر حركات كشف الحساب (Sub-Ledger)</span>
                            </h3>
                            <Link
                                href={`/contacts/${contact.id}/ledger`}
                                className="text-xs font-bold text-blue-400 hover:text-blue-300 transition flex items-center gap-1"
                            >
                                <span>عرض كشف الحساب كاملاً مع الطباعة</span>
                                <ArrowUpRight size={14} />
                            </Link>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-right text-xs text-slate-300">
                                <thead className="bg-slate-950/60 text-slate-400 font-bold border-b border-slate-800 uppercase">
                                    <tr>
                                        <th className="px-4 py-3">التاريخ</th>
                                        <th className="px-4 py-3">البيان</th>
                                        <th className="px-4 py-3">المرجع</th>
                                        <th className="px-4 py-3 text-left">مدين (مستحق عليه)</th>
                                        <th className="px-4 py-3 text-left">دائن (مسدد منه)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60">
                                    {contact.ledger_entries?.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="px-4 py-8 text-center text-slate-500 font-bold">
                                                لا توجد حركات مسجلة في كشف حساب العميل بعد.
                                            </td>
                                        </tr>
                                    ) : (
                                        contact.ledger_entries?.map((e) => (
                                            <tr key={e.id} className="hover:bg-slate-800/40 transition">
                                                <td className="px-4 py-2.5 font-mono text-slate-400">{e.date}</td>
                                                <td className="px-4 py-2.5 text-slate-200">{e.description || '—'}</td>
                                                <td className="px-4 py-2.5 font-mono text-slate-400 text-[11px]">
                                                    {e.reference_type ? `${e.reference_type} #${e.reference_id || ''}` : '—'}
                                                </td>
                                                <td className="px-4 py-2.5 text-left font-mono text-amber-400 font-bold">
                                                    {parseFloat(e.debit) > 0 ? parseFloat(e.debit).toFixed(2) : '—'}
                                                </td>
                                                <td className="px-4 py-2.5 text-left font-mono text-emerald-400">
                                                    {parseFloat(e.credit) > 0 ? parseFloat(e.credit).toFixed(2) : '—'}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
