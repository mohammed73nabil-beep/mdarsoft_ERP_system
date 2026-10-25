import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    FileText,
    Printer,
    ArrowRight,
    Building2,
    Calendar,
    ShoppingCart,
} from 'lucide-react';

export default function QuotationShow({ quotation }) {
    const formatCurrency = (val) => {
        return Number(val || 0).toLocaleString('ar-SA', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }) + ' ر.س';
    };

    return (
        <AppLayout title={`عرض سعر ${quotation.quotation_number}`}>
            <Head title={`عرض سعر ${quotation.quotation_number}`} />

            <div className="p-6 max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between print:hidden">
                    <Link
                        href="/sales/quotations"
                        className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors"
                    >
                        <ArrowRight className="w-4 h-4" />
                        العودة لقائمة عروض الأسعار
                    </Link>

                    <div className="flex gap-2">
                        <Link
                            href={`/sales/create?quotation_id=${quotation.id}`}
                            className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-emerald-900/30 transition-colors"
                        >
                            <ShoppingCart className="w-4 h-4" />
                            تحويل إلى فاتورة بيع
                        </Link>

                        <button
                            type="button"
                            onClick={() => window.print()}
                            className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-blue-900/30 transition-colors"
                        >
                            <Printer className="w-4 h-4" />
                            طباعة عرض السعر
                        </button>
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6 shadow-2xl print:bg-white print:text-black print:border-none print:p-0">
                    <div className="flex justify-between items-start border-b border-slate-800 pb-6 print:border-black">
                        <div>
                            <span className="text-xs uppercase tracking-wider text-blue-400 font-bold block mb-1">
                                عرض سعر مبدئي (Quotation)
                            </span>
                            <h1 className="text-2xl font-black text-white print:text-black flex items-center gap-2">
                                <FileText className="w-7 h-7 text-blue-500 print:text-black" />
                                {quotation.quotation_number}
                            </h1>
                            <p className="text-slate-400 print:text-gray-600 text-xs mt-1">
                                تاريخ العرض: <span className="font-semibold text-white print:text-black">{quotation.date}</span>
                                {quotation.expiry_date && ` | صالح حتى: ${quotation.expiry_date}`}
                            </p>
                        </div>

                        <span className="font-bold text-sm px-3 py-1 rounded-full bg-slate-800 print:bg-gray-100 print:text-black">
                            {quotation.status}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-800/40 print:bg-gray-50 border border-slate-800/80 print:border-gray-200 text-xs">
                        <div>
                            <span className="text-slate-400 print:text-gray-500 block">العميل</span>
                            <span className="font-bold text-white print:text-black text-sm block mt-0.5">
                                {quotation.contact?.name || 'عميل محتمل'}
                            </span>
                        </div>
                        <div>
                            <span className="text-slate-400 print:text-gray-500 block">الفرع</span>
                            <span className="font-bold text-white print:text-black text-sm block mt-0.5">
                                {quotation.branch?.name}
                            </span>
                        </div>
                        <div>
                            <span className="text-slate-400 print:text-gray-500 block">المسؤول</span>
                            <span className="font-bold text-white print:text-black text-sm block mt-0.5">
                                {quotation.user?.name || '-'}
                            </span>
                        </div>
                    </div>

                    {/* Table */}
                    <table className="w-full text-right text-sm">
                        <thead className="bg-slate-800/80 print:bg-gray-100 text-slate-400 print:text-black text-xs font-semibold uppercase border-b border-slate-700 print:border-black">
                            <tr>
                                <th className="px-3 py-2.5">#</th>
                                <th className="px-3 py-2.5">المنتج / الصنف</th>
                                <th className="px-3 py-2.5">الكمية</th>
                                <th className="px-3 py-2.5">السعر</th>
                                <th className="px-3 py-2.5">الإجمالي</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 print:divide-gray-200">
                            {quotation.lines?.map((line, idx) => (
                                <tr key={line.id} className="text-slate-200 print:text-black">
                                    <td className="px-3 py-3 text-xs text-slate-500 font-mono">{idx + 1}</td>
                                    <td className="px-3 py-3 font-bold text-white print:text-black">{line.product?.name}</td>
                                    <td className="px-3 py-3">{line.quantity} {line.product?.unit?.name || 'قطعة'}</td>
                                    <td className="px-3 py-3">{formatCurrency(line.unit_price)}</td>
                                    <td className="px-3 py-3 font-bold text-white print:text-black">{formatCurrency(line.total_amount)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="flex justify-end border-t border-slate-800 print:border-black pt-4">
                        <div className="text-left sm:text-right">
                            <span className="text-xs text-slate-400 print:text-gray-600 block">المبلغ الإجمالي للعرض</span>
                            <span className="text-xl font-black text-blue-400 print:text-black">
                                {formatCurrency(quotation.total_amount)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
