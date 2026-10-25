import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    CornerUpLeft,
    Printer,
    ArrowRight,
    ShoppingBag,
    UserCheck,
    Building2,
    Warehouse,
    Calendar,
    Barcode,
} from 'lucide-react';

export default function PurchaseReturnShow({ purchaseReturn }) {
    const printVoucher = () => {
        window.print();
    };

    const formatCurrency = (val) => {
        return Number(val || 0).toLocaleString('ar-SA', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }) + ' ر.س';
    };

    return (
        <AppLayout>
            <Head title={`سند مرتجع مشتريات #${purchaseReturn.return_number}`} />

            <div className="space-y-6">
                {/* Header (Hidden on print) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/purchases/returns"
                            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
                            title="العودة للمرتجعات"
                        >
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2.5">
                                <h1 className="text-xl font-bold text-white tracking-wide">
                                    سند مرتجع مشتريات #{purchaseReturn.return_number}
                                </h1>
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                    تم الإرجاع للمورد
                                </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">التاريخ: {purchaseReturn.date}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <button
                            type="button"
                            onClick={printVoucher}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition"
                        >
                            <Printer className="w-4 h-4 text-sky-400" />
                            طباعة السند
                        </button>
                    </div>
                </div>

                {/* Printable Return Voucher */}
                <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-sm space-y-6 print:border-none print:bg-white print:text-black print:p-0">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start border-b border-slate-800/80 print:border-gray-200 pb-6 gap-4">
                        <div>
                            <div className="text-2xl font-black text-rose-500 print:text-rose-700">سند مرتجع مشتريات</div>
                            <div className="text-xs text-slate-400 print:text-gray-600 font-mono mt-1">
                                رقم السند: {purchaseReturn.return_number}
                            </div>
                            <div className="text-xs text-slate-400 print:text-gray-600 mt-1">
                                التاريخ: {purchaseReturn.date}
                            </div>
                        </div>

                        <div className="text-left sm:text-right text-xs space-y-1 text-slate-300 print:text-gray-800">
                            <div className="font-semibold text-white print:text-black text-sm">
                                {purchaseReturn.branch?.name || 'الفرع الرئيسي'}
                            </div>
                            <div>المستودع: {purchaseReturn.warehouse?.name || 'المستودع الرئيسي'}</div>
                            <div>المسؤول: {purchaseReturn.user?.name || 'مدير النظام'}</div>
                        </div>
                    </div>

                    {/* Parties info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-950/40 print:bg-gray-50 border border-slate-800/60 print:border-gray-200 rounded-xl space-y-1">
                            <div className="text-xs font-semibold text-emerald-400 print:text-emerald-700 flex items-center gap-1.5">
                                <UserCheck className="w-3.5 h-3.5" />
                                بيانات المورد
                            </div>
                            <div className="text-sm font-bold text-white print:text-black">
                                {purchaseReturn.contact?.name || 'مورد عام'}
                            </div>
                            <div className="text-xs text-slate-400 print:text-gray-600">
                                هاتف: {purchaseReturn.contact?.phone || '—'}
                            </div>
                        </div>

                        <div className="p-4 bg-slate-950/40 print:bg-gray-50 border border-slate-800/60 print:border-gray-200 rounded-xl space-y-1">
                            <div className="text-xs font-semibold text-indigo-400 print:text-indigo-700 flex items-center gap-1.5">
                                <ShoppingBag className="w-3.5 h-3.5" />
                                الفاتورة الأصلية
                            </div>
                            <div className="text-sm font-bold text-white print:text-black font-mono">
                                {purchaseReturn.original_purchase?.order_number || '—'}
                            </div>
                            <div className="text-xs text-slate-400 print:text-gray-600">
                                تاريخ الفاتورة الأصلية: {purchaseReturn.original_purchase?.date || '—'}
                            </div>
                        </div>
                    </div>

                    {/* Lines Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-right text-xs">
                            <thead className="bg-slate-950/60 print:bg-gray-100 border-b border-slate-800/80 print:border-gray-200 text-slate-400 print:text-gray-700 font-medium">
                                <tr>
                                    <th className="py-2.5 px-3">#</th>
                                    <th className="py-2.5 px-3">المنتج المرتجع</th>
                                    <th className="py-2.5 px-3 text-center">الكمية</th>
                                    <th className="py-2.5 px-3">سعر الوحدة</th>
                                    <th className="py-2.5 px-3">الضريبة</th>
                                    <th className="py-2.5 px-3 text-left">إجمالي المرتجع</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50 print:divide-gray-200 text-slate-300 print:text-gray-800">
                                {purchaseReturn.lines?.map((line, idx) => (
                                    <tr key={line.id} className="hover:bg-slate-800/20 transition">
                                        <td className="py-3 px-3 text-slate-500 font-mono">{idx + 1}</td>
                                        <td className="py-3 px-3">
                                            <div className="font-semibold text-white print:text-black">
                                                {line.product?.name}
                                            </div>
                                            {line.serials && line.serials.length > 0 && (
                                                <div className="mt-1 flex flex-wrap gap-1">
                                                    {line.serials.map((s) => (
                                                        <span key={s.id} className="px-1.5 py-0.5 rounded bg-slate-800 print:bg-gray-200 text-rose-400 print:text-rose-800 text-[10px] font-mono">
                                                            {s.serial?.serial_number}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-3 px-3 text-center font-mono font-bold">
                                            {Number(line.quantity)}
                                        </td>
                                        <td className="py-3 px-3 font-mono">{formatCurrency(line.unit_cost)}</td>
                                        <td className="py-3 px-3 font-mono text-amber-400">{formatCurrency(line.tax_amount)}</td>
                                        <td className="py-3 px-3 text-left font-bold text-rose-400 font-mono">
                                            {formatCurrency(line.total_amount)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Summary row */}
                    <div className="flex justify-end pt-4 border-t border-slate-800/80 print:border-gray-200">
                        <div className="w-full sm:w-72 space-y-2 text-xs">
                            <div className="flex justify-between text-slate-400 print:text-gray-600">
                                <span>الضريبة المستردة:</span>
                                <span className="font-mono text-amber-400">{formatCurrency(purchaseReturn.tax_amount)}</span>
                            </div>
                            <div className="flex justify-between text-sm font-bold text-white print:text-black pt-2 border-t border-slate-800/80 print:border-gray-200">
                                <span>إجمالي قيمة المرتجع:</span>
                                <span className="font-mono text-rose-400 text-base">{formatCurrency(purchaseReturn.total_amount)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    {purchaseReturn.notes && (
                        <div className="p-3 bg-slate-950/40 print:bg-gray-50 border border-slate-800/60 print:border-gray-200 rounded-xl text-xs text-slate-400 print:text-gray-700">
                            <span className="font-semibold text-slate-300 print:text-black block mb-1">سبب المرتجع وملاحظات:</span>
                            {purchaseReturn.notes}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
