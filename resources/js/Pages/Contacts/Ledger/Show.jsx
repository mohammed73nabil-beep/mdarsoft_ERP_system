import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    FileText,
    Printer,
    ArrowRight,
    Calendar,
    Filter,
    RotateCcw,
    Building2,
    Phone,
    Receipt,
    Wallet,
    ArrowDownLeft,
    ArrowUpRight
} from 'lucide-react';

export default function Show({ contact, entries, summary, filters }) {
    const [dateFrom, setDateFrom] = useState(filters?.date_from || '');
    const [dateTo, setDateTo] = useState(filters?.date_to || '');

    const applyFilters = () => {
        router.get(`/contacts/${contact.id}/ledger`, {
            date_from: dateFrom,
            date_to: dateTo,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const resetFilters = () => {
        setDateFrom('');
        setDateTo('');
        router.get(`/contacts/${contact.id}/ledger`);
    };

    const handlePrint = () => {
        window.print();
    };

    const isSupplier = contact.type === 'supplier';
    const isCustomer = contact.type === 'customer';

    return (
        <AppLayout title={`كشف حساب: ${contact.name}`}>
            <Head title={`كشف حساب - ${contact.name}`} />

            {/* Screen Actions (Hidden on Print) */}
            <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
                        <Link href="/contacts" className="hover:text-white transition">جهات الاتصال</Link>
                        <span>/</span>
                        <Link
                            href={isSupplier ? '/contacts/suppliers' : '/contacts/customers'}
                            className="hover:text-white transition"
                        >
                            {isSupplier ? 'الموردين' : 'العملاء'}
                        </Link>
                        <span>/</span>
                        <span className="text-white font-bold">كشف الحساب</span>
                    </div>
                    <h2 className="text-2xl font-black text-white flex items-center gap-2">
                        <FileText className="text-emerald-500" size={26} />
                        <span>كشف حساب تفصيلي: {contact.name}</span>
                    </h2>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handlePrint}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm shadow-lg transition border border-slate-700"
                    >
                        <Printer size={18} />
                        <span>طباعة كشف الحساب</span>
                    </button>

                    <Link
                        href={isSupplier ? `/contacts/suppliers/${contact.id}` : `/contacts/customers/${contact.id}`}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition border border-slate-700"
                    >
                        <ArrowRight size={18} />
                        <span>العودة لملف جهة التعامل</span>
                    </Link>
                </div>
            </div>

            {/* Filter Controls (Hidden on Print) */}
            <div className="print:hidden bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6 shadow-xl">
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-300 mb-1.5 flex items-center gap-2">
                            <Calendar size={16} className="text-slate-400" />
                            <span>من تاريخ</span>
                        </label>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-300 mb-1.5 flex items-center gap-2">
                            <Calendar size={16} className="text-slate-400" />
                            <span>إلى تاريخ</span>
                        </label>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                        />
                    </div>

                    <div className="flex items-end gap-2 lg:col-span-2">
                        <button
                            type="button"
                            onClick={applyFilters}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30"
                        >
                            <Filter size={16} />
                            <span>عرض الكشف</span>
                        </button>
                        <button
                            type="button"
                            onClick={resetFilters}
                            className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white transition border border-slate-800"
                            title="إعادة تعيين"
                        >
                            <RotateCcw size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Printable Statement Document Container */}
            <div className="bg-slate-900 print:bg-white border border-slate-800 print:border-none rounded-2xl p-6 sm:p-8 shadow-2xl print:shadow-none text-slate-200 print:text-black">
                {/* Header Information for Statement */}
                <div className="border-b border-slate-800 print:border-slate-300 pb-6 mb-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div>
                            <h1 className="text-2xl font-black text-white print:text-black mb-1">
                                كشف حساب تفصيلي (Statement of Account)
                            </h1>
                            <p className="text-sm text-slate-400 print:text-slate-600">
                                سجل حركات دفتر الأستاذ المساعد (Sub-Ledger)
                            </p>
                        </div>
                        <div className="text-left font-mono text-xs text-slate-400 print:text-slate-700">
                            <div>تاريخ التقرير: {new Date().toISOString().split('T')[0]}</div>
                            {dateFrom && <div>الفترة من: {dateFrom}</div>}
                            {dateTo && <div>إلى: {dateTo}</div>}
                        </div>
                    </div>

                    {/* Contact Profile Box */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 p-4 rounded-xl bg-slate-950/70 print:bg-slate-100 border border-slate-800/80 print:border-slate-200 text-xs">
                        <div>
                            <span className="text-slate-400 print:text-slate-600 block mb-1">اسم جهة التعامل:</span>
                            <span className="font-bold text-white print:text-black text-sm">{contact.name}</span>
                        </div>
                        <div>
                            <span className="text-slate-400 print:text-slate-600 block mb-1">الكود / الرمز:</span>
                            <span className="font-bold font-mono text-emerald-400 print:text-black">{contact.code || `#${contact.id}`}</span>
                        </div>
                        <div>
                            <span className="text-slate-400 print:text-slate-600 block mb-1">الرقم الضريبي:</span>
                            <span className="font-mono font-bold text-slate-300 print:text-black">{contact.tax_number || '—'}</span>
                        </div>
                        <div>
                            <span className="text-slate-400 print:text-slate-600 block mb-1">الهاتف:</span>
                            <span dir="ltr" className="font-mono text-slate-300 print:text-black">{contact.phone || '—'}</span>
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="bg-slate-950 print:bg-slate-50 border border-slate-800 print:border-slate-200 rounded-xl p-4">
                        <span className="text-xs font-bold text-slate-400 print:text-slate-600 block mb-1">رصيد أول المدة</span>
                        <div className="text-lg font-black font-mono text-white print:text-black">
                            {summary?.opening_balance?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs text-slate-500">ر.س</span>
                        </div>
                    </div>

                    <div className="bg-slate-950 print:bg-slate-50 border border-slate-800 print:border-slate-200 rounded-xl p-4">
                        <span className="text-xs font-bold text-slate-400 print:text-slate-600 block mb-1">إجمالي الحركات المدين</span>
                        <div className="text-lg font-black font-mono text-amber-400 print:text-black">
                            {summary?.period_debit?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs text-slate-500">ر.س</span>
                        </div>
                    </div>

                    <div className="bg-slate-950 print:bg-slate-50 border border-slate-800 print:border-slate-200 rounded-xl p-4">
                        <span className="text-xs font-bold text-slate-400 print:text-slate-600 block mb-1">إجمالي الحركات الدائن</span>
                        <div className="text-lg font-black font-mono text-blue-400 print:text-black">
                            {summary?.period_credit?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs text-slate-500">ر.س</span>
                        </div>
                    </div>

                    <div className="bg-slate-950 print:bg-slate-50 border border-slate-800 print:border-slate-200 rounded-xl p-4">
                        <span className="text-xs font-bold text-slate-400 print:text-slate-600 block mb-1">الرصيد الختامي</span>
                        <div className="text-lg font-black font-mono text-emerald-400 print:text-black">
                            {summary?.closing_balance?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs text-slate-500">ر.س</span>
                        </div>
                    </div>
                </div>

                {/* Ledger Transactions Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs">
                        <thead className="bg-slate-950 print:bg-slate-200 text-slate-400 print:text-black font-bold border-b border-slate-800 print:border-slate-300 uppercase">
                            <tr>
                                <th className="px-4 py-3">#</th>
                                <th className="px-4 py-3">التاريخ</th>
                                <th className="px-4 py-3">نوع الحركة / المرجع</th>
                                <th className="px-4 py-3">البيان والتفاصيل</th>
                                <th className="px-4 py-3 text-left">مدين (+)</th>
                                <th className="px-4 py-3 text-left">دائن (-)</th>
                                <th className="px-4 py-3 text-left">الرصيد التراكمي</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 print:divide-slate-200">
                            {/* Opening balance row if filtered */}
                            {filters?.date_from && (
                                <tr className="bg-slate-950/40 print:bg-slate-100 font-bold">
                                    <td className="px-4 py-3 text-slate-500">—</td>
                                    <td className="px-4 py-3 font-mono text-slate-400">{filters.date_from}</td>
                                    <td className="px-4 py-3 text-slate-400">رصيد سابق</td>
                                    <td className="px-4 py-3 text-slate-300">الرصيد الافتتاحي المنقول قبل تاريخ {filters.date_from}</td>
                                    <td className="px-4 py-3 text-left font-mono">—</td>
                                    <td className="px-4 py-3 text-left font-mono">—</td>
                                    <td className="px-4 py-3 text-left font-mono text-emerald-400 print:text-black">
                                        {summary?.opening_balance?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            )}

                            {entries?.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-4 py-10 text-center text-slate-500 font-bold">
                                        لا توجد حركات مسجلة خلال الفترة المحددة.
                                    </td>
                                </tr>
                            ) : (
                                entries?.map((entry, idx) => (
                                    <tr key={entry.id} className="hover:bg-slate-800/30 print:hover:bg-transparent transition">
                                        <td className="px-4 py-3 font-mono text-slate-500">{idx + 1}</td>
                                        <td className="px-4 py-3 font-mono text-slate-300 print:text-black">{entry.date}</td>
                                        <td className="px-4 py-3 font-mono text-slate-400 print:text-black text-[11px]">
                                            {entry.reference_type ? (
                                                <span className="px-2 py-0.5 rounded bg-slate-800 print:bg-slate-200 text-slate-300 print:text-black">
                                                    {entry.reference_type} #{entry.reference_id || ''}
                                                </span>
                                            ) : '—'}
                                        </td>
                                        <td className="px-4 py-3 text-slate-200 print:text-black">
                                            {entry.description || '—'}
                                        </td>
                                        <td className="px-4 py-3 text-left font-mono font-bold text-amber-400 print:text-black">
                                            {parseFloat(entry.debit) > 0 ? parseFloat(entry.debit).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
                                        </td>
                                        <td className="px-4 py-3 text-left font-mono font-bold text-blue-400 print:text-black">
                                            {parseFloat(entry.credit) > 0 ? parseFloat(entry.credit).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
                                        </td>
                                        <td className="px-4 py-3 text-left font-mono font-black text-white print:text-black text-sm">
                                            {parseFloat(entry.running_balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        <tfoot className="bg-slate-950 print:bg-slate-200 font-bold border-t-2 border-slate-700 print:border-black text-xs">
                            <tr>
                                <td colSpan="4" className="px-4 py-3 text-white print:text-black">إجمالي الفترة</td>
                                <td className="px-4 py-3 text-left font-mono text-amber-400 print:text-black">
                                    {summary?.period_debit?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="px-4 py-3 text-left font-mono text-blue-400 print:text-black">
                                    {summary?.period_credit?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="px-4 py-3 text-left font-mono text-emerald-400 print:text-black text-sm">
                                    {summary?.closing_balance?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Footer notes on print */}
                <div className="mt-12 pt-6 border-t border-slate-800 print:border-slate-300 flex justify-between text-xs text-slate-500">
                    <div>تم استخراج كشف الحساب من النظام المحاسبي الآلي.</div>
                    <div className="flex gap-16">
                        <div>توقيع المحاسب: ___________________</div>
                        <div>توقيع المدير المالي: ___________________</div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
