import React from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AppLayout from '../../../Layouts/AppLayout';
import {
    ArrowLeftRight,
    ArrowRight,
    Send,
    CheckCircle2,
    Warehouse as WarehouseIcon,
    Calendar,
    Clock,
    Smartphone,
    FileText,
    ArrowLeft
} from 'lucide-react';

export default function Show({ transfer }) {
    const { auth } = usePage().props;
    const userPermissions = auth?.user?.permissions || [];
    const isAdmin = auth?.user?.roles?.includes('مدير النظام') || auth?.user?.roles?.includes('admin');
    const canManage = isAdmin || userPermissions.includes('inventory.transfers_list.view');

    const handleSend = () => {
        if (confirm('هل أنت متأكد من رغبتك في إرسال التحويل؟ سيتم خصم الكميات من المستودع المصدر.')) {
            router.post(`/inventory/transfers/${transfer.id}/send`);
        }
    };

    const handleReceive = () => {
        if (confirm('هل أنت متأكد من استلام التحويل في المستودع الوجهة؟ سيتم إيداع الكميات في المخزن.')) {
            router.post(`/inventory/transfers/${transfer.id}/receive`);
        }
    };

    const totalQty = (transfer.lines || []).reduce((acc, l) => acc + (parseFloat(l.quantity) || 0), 0);
    const totalCost = (transfer.lines || []).reduce((acc, l) => {
        const q = parseFloat(l.quantity) || 0;
        const c = parseFloat(l.unit_cost) || 0;
        return acc + (q * c);
    }, 0);

    return (
        <AppLayout title={`تفاصيل التحويل المخزني ${transfer.transfer_number}`}>
            <Head title={`تحويل مخزون ${transfer.transfer_number}`} />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
                        <Link href="/inventory" className="hover:text-white transition">المخازن</Link>
                        <span>/</span>
                        <Link href="/inventory/transfers" className="hover:text-white transition">تحويلات المخزون</Link>
                        <span>/</span>
                        <span className="text-white font-bold">{transfer.transfer_number}</span>
                    </div>
                    <h2 className="text-2xl font-black text-white flex items-center gap-2">
                        <ArrowLeftRight className="text-cyan-500" size={26} />
                        <span>تحويل مخزني: {transfer.transfer_number}</span>
                    </h2>
                </div>

                <div className="flex items-center gap-2">
                    {transfer.status === 'draft' && canManage && (
                        <button
                            onClick={handleSend}
                            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm shadow-lg shadow-cyan-600/30 transition"
                        >
                            <Send size={16} />
                            <span>إرسال التحويل (خصم المصدر)</span>
                        </button>
                    )}

                    {transfer.status === 'sent' && canManage && (
                        <button
                            onClick={handleReceive}
                            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition"
                        >
                            <CheckCircle2 size={16} />
                            <span>تأكيد استلام التحويل (إيداع الوجهة)</span>
                        </button>
                    )}

                    <Link
                        href="/inventory/transfers"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition border border-slate-700"
                    >
                        <ArrowRight size={16} />
                        <span>العودة للقائمة</span>
                    </Link>
                </div>
            </div>

            {/* Header Box */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6 shadow-xl">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mb-4">
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                        <span className="text-slate-400 text-xs block mb-1">رقم التحويل:</span>
                        <span className="font-mono font-bold text-cyan-400 text-base">{transfer.transfer_number}</span>
                    </div>

                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                        <span className="text-slate-400 text-xs block mb-1">تاريخ التحويل:</span>
                        <span className="font-mono font-bold text-slate-200 text-base">
                            {transfer.date ? String(transfer.date).substring(0, 10) : '—'}
                        </span>
                    </div>

                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                        <span className="text-slate-400 text-xs block mb-1">المنشئ / المستلم:</span>
                        <span className="font-bold text-white block truncate">
                            {transfer.creator?.name || '—'}
                            {transfer.receiver && <span className="text-xs text-slate-400 block font-normal">استلم: {transfer.receiver.name}</span>}
                        </span>
                    </div>

                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                        <span className="text-slate-400 text-xs block mb-1">الحالة:</span>
                        {transfer.status === 'received' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 font-bold text-xs border border-emerald-500/20">
                                <CheckCircle2 size={14} />
                                <span>تم الاستلام بالوجهة</span>
                            </span>
                        ) : transfer.status === 'sent' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 font-bold text-xs border border-blue-500/20">
                                <Send size={14} />
                                <span>قيد النقل (مُرسل)</span>
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 font-bold text-xs border border-amber-500/20">
                                <Clock size={14} />
                                <span>مسودة</span>
                            </span>
                        )}
                    </div>
                </div>

                {/* Warehouse Transfer Pathway Box */}
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-slate-800 text-cyan-400 font-bold">
                            <WarehouseIcon size={20} />
                        </div>
                        <div>
                            <span className="text-xs text-slate-400 block">المستودع المصدر:</span>
                            <span className="font-bold text-white text-base">{transfer.from_warehouse?.name}</span>
                            <span className="text-xs text-slate-400 block">({transfer.from_warehouse?.branch?.name || 'الفرع الرئيسي'})</span>
                        </div>
                    </div>

                    <div className="hidden sm:flex items-center text-cyan-400 font-mono font-bold text-lg gap-2">
                        <span>───────</span>
                        <ArrowLeft size={20} />
                        <span>───────</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-slate-800 text-emerald-400 font-bold">
                            <WarehouseIcon size={20} />
                        </div>
                        <div>
                            <span className="text-xs text-slate-400 block">المستودع الوجهة:</span>
                            <span className="font-bold text-white text-base">{transfer.to_warehouse?.name}</span>
                            <span className="text-xs text-slate-400 block">({transfer.to_warehouse?.branch?.name || 'الفرع الرئيسي'})</span>
                        </div>
                    </div>
                </div>

                {transfer.notes && (
                    <div className="mt-4 p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-sm">
                        <span className="text-slate-400 block text-xs mb-1">ملاحظات:</span>
                        <span className="text-slate-300">{transfer.notes}</span>
                    </div>
                )}
            </div>

            {/* Line Items Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl mb-6">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                    <h3 className="font-bold text-white text-base flex items-center gap-2">
                        <FileText size={18} className="text-cyan-400" />
                        <span>الأصناف المحولة</span>
                    </h3>
                    <span className="text-sm font-mono text-slate-400 font-bold">
                        {transfer.lines?.length || 0} بنود
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse text-sm">
                        <thead>
                            <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 text-sm font-bold">
                                <th className="p-4">#</th>
                                <th className="p-4">المنتج / الصنف</th>
                                <th className="p-4">النوع</th>
                                <th className="p-4">الكمية</th>
                                <th className="p-4">تكلفة المصدر (ADR-25)</th>
                                <th className="p-4">إجمالي التكلفة</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                            {transfer.lines?.map((line, idx) => {
                                const qty = parseFloat(line.quantity) || 0;
                                const cost = parseFloat(line.unit_cost) || 0;
                                const total = qty * cost;

                                return (
                                    <tr key={line.id} className="hover:bg-slate-800/40 transition">
                                        <td className="p-4 font-mono text-slate-500">{idx + 1}</td>
                                        <td className="p-4">
                                            <span className="font-bold text-white block">{line.product?.name}</span>
                                            <span className="text-xs font-mono text-cyan-400">SKU: {line.product?.sku}</span>
                                            {line.serial && (
                                                <div className="mt-1 flex items-center gap-1.5 text-xs font-mono text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 w-fit">
                                                    <Smartphone size={12} />
                                                    <span>SN: {line.serial.serial_number}</span>
                                                    {line.serial.imei1 && <span>| IMEI1: {line.serial.imei1}</span>}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            {line.product?.tracking_type === 'serial' ? (
                                                <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
                                                    سيريال / IMEI
                                                </span>
                                            ) : (
                                                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                                                    كمية
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 font-mono font-bold text-white">
                                            {qty.toFixed(2)}
                                        </td>
                                        <td className="p-4 font-mono text-slate-200">
                                            {cost.toFixed(2)} ر.س
                                        </td>
                                        <td className="p-4 font-mono font-bold text-cyan-400">
                                            {total.toFixed(2)} ر.س
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot>
                            <tr className="bg-slate-950 font-bold text-white border-t border-slate-800">
                                <td colSpan="3" className="p-4 text-left">الإجمالي الكلي:</td>
                                <td className="p-4 font-mono text-cyan-400">{totalQty.toFixed(2)}</td>
                                <td className="p-4"></td>
                                <td className="p-4 font-mono text-cyan-400 text-base">{totalCost.toFixed(2)} ر.س</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
