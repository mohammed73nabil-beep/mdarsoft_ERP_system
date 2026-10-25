import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    CornerUpLeft,
    Printer,
    ArrowRight,
    Building2,
    Calendar,
    FileText,
    Hash,
    CheckCircle2,
} from 'lucide-react';

export default function SaleReturnShow({ saleReturn }) {
    const formatCurrency = (val) => {
        return Number(val || 0).toLocaleString('ar-SA', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }) + ' ر.س';
    };

    return (
        <AppLayout title={`مرتجع مبيعات ${saleReturn.return_number}`}>
            <Head title={`مرتجع مبيعات ${saleReturn.return_number}`} />

            <div className="p-6 max-w-4xl mx-auto space-y-6">
                {/* Actions & Navigation (Hidden on Print) */}
                <div className="flex items-center justify-between print:hidden">
                    <Link
                        href="/sales/returns"
                        className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors"
                    >
                        <ArrowRight className="w-4 h-4" />
                        العودة لقائمة المرتجعات
                    </Link>

                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-blue-900/30 transition-colors"
                    >
                        <Printer className="w-4 h-4" />
                        طباعة إشعار الدائن
                    </button>
                </div>

                {/* Printable Container */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6 shadow-2xl print:bg-white print:text-black print:border-none print:p-0">
                    <div className="flex justify-between items-start border-b border-slate-800 pb-6 print:border-black">
                        <div>
                            <span className="text-xs uppercase tracking-wider text-amber-400 font-bold block mb-1">
                                إشعار دائن (مرتجع مبيعات)
                            </span>
                            <h1 className="text-2xl font-black text-white print:text-black flex items-center gap-2">
                                <CornerUpLeft className="w-7 h-7 text-amber-500 print:text-black" />
                                {saleReturn.return_number}
                            </h1>
                            <p className="text-slate-400 print:text-gray-600 text-xs mt-1">
                                تاريخ المرتجع: <span className="font-semibold text-white print:text-black">{saleReturn.date}</span>
                            </p>
                        </div>

                        <div className="text-left sm:text-right">
                            <span className="text-xs text-slate-400 print:text-gray-600 block">الفاتورة الأصلية</span>
                            <Link
                                href={`/sales/${saleReturn.original_sale?.id}`}
                                className="font-bold text-sm text-emerald-400 hover:underline print:text-black print:no-underline block mt-0.5"
                            >
                                {saleReturn.original_sale?.order_number}
                            </Link>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-800/40 print:bg-gray-50 border border-slate-800/80 print:border-gray-200 text-xs">
                        <div>
                            <span className="text-slate-400 print:text-gray-500 block">العميل</span>
                            <span className="font-bold text-white print:text-black text-sm block mt-0.5">
                                {saleReturn.contact?.name || 'عميل نقدي'}
                            </span>
                        </div>

                        <div>
                            <span className="text-slate-400 print:text-gray-500 block">الفرع</span>
                            <span className="font-bold text-white print:text-black text-sm block mt-0.5">
                                {saleReturn.branch?.name}
                            </span>
                        </div>

                        <div>
                            <span className="text-slate-400 print:text-gray-500 block">المستودع المستلم</span>
                            <span className="font-bold text-white print:text-black text-sm block mt-0.5">
                                {saleReturn.warehouse?.name}
                            </span>
                        </div>

                        <div>
                            <span className="text-slate-400 print:text-gray-500 block">طريقة الرد</span>
                            <span className="font-bold text-white print:text-black text-sm block mt-0.5">
                                {saleReturn.refund_method === 'cash' ? 'نقداً' : saleReturn.refund_method === 'credit' ? 'رصيد حساب' : 'استبدال'}
                            </span>
                        </div>
                    </div>

                    {/* Lines Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-right text-sm">
                            <thead className="bg-slate-800/80 print:bg-gray-100 text-slate-400 print:text-black text-xs font-semibold uppercase border-b border-slate-700 print:border-black">
                                <tr>
                                    <th className="px-3 py-2.5">#</th>
                                    <th className="px-3 py-2.5">المنتج / الصنف المرتجع</th>
                                    <th className="px-3 py-2.5">الكمية</th>
                                    <th className="px-3 py-2.5">سعر الوحدة</th>
                                    <th className="px-3 py-2.5">الإجمالي المسترد</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800 print:divide-gray-200">
                                {saleReturn.lines?.map((line, idx) => (
                                    <tr key={line.id} className="text-slate-200 print:text-black">
                                        <td className="px-3 py-3 text-xs text-slate-500 font-mono">{idx + 1}</td>
                                        <td className="px-3 py-3">
                                            <span className="font-bold block text-white print:text-black">{line.product?.name}</span>

                                            {line.serials && line.serials.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5 mt-1.5">
                                                    {line.serials.map((s) => (
                                                        <span
                                                            key={s.id}
                                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-amber-950/60 print:bg-gray-100 text-amber-300 print:text-black border border-amber-800/60 print:border-gray-300"
                                                        >
                                                            <Hash className="w-3 h-3 text-amber-500 print:hidden" />
                                                            SN: {s.serial?.serial_number}
                                                            {s.serial?.imei1 && ` | IMEI: ${s.serial.imei1}`}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-3 py-3 font-medium">
                                            {line.quantity} {line.product?.unit?.name || 'قطعة'}
                                        </td>
                                        <td className="px-3 py-3">{formatCurrency(line.unit_price)}</td>
                                        <td className="px-3 py-3 font-bold text-amber-400 print:text-black">{formatCurrency(line.total_amount)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Total Summary */}
                    <div className="flex justify-between items-center border-t border-slate-800 print:border-black pt-4">
                        <span className="text-slate-400 print:text-gray-600 text-xs">
                            تم استرجاع البضاعة لمخزون المستودع وتحديث دفتر الأستاذ المساعد.
                        </span>

                        <div className="text-left sm:text-right">
                            <span className="text-xs text-slate-400 print:text-gray-600 block">إجمالي مبلغ المرتجع</span>
                            <span className="text-xl font-black text-amber-400 print:text-black">
                                {formatCurrency(saleReturn.total_amount)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
