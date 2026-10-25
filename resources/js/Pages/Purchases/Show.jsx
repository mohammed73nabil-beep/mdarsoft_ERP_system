import React, { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    ShoppingBag,
    Printer,
    DollarSign,
    CornerUpLeft,
    CheckCircle2,
    Clock,
    AlertCircle,
    UserCheck,
    Building2,
    Warehouse,
    Calendar,
    ArrowRight,
    Plus,
    Trash2,
    Barcode,
    FileText,
    CreditCard,
    X,
} from 'lucide-react';

export default function PurchaseShow({
    order,
    paymentMethods = [],
    treasuries = [],
    bankAccounts = [],
}) {
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showReceiveModal, setShowReceiveModal] = useState(false);

    const remainingDue = Math.max(0, Number(order.total_amount) - Number(order.paid_amount));

    // Form for recording payment
    const paymentForm = useForm({
        date: new Date().toISOString().split('T')[0],
        amount: remainingDue > 0 ? remainingDue : 0,
        payment_method_id: paymentMethods[0]?.id || '',
        treasury_id: treasuries[0]?.id || '',
        bank_account_id: bankAccounts[0]?.id || '',
        reference: '',
        notes: '',
    });

    const handlePaymentSubmit = (e) => {
        e.preventDefault();
        paymentForm.post(`/purchases/${order.id}/payments`, {
            onSuccess: () => {
                setShowPaymentModal(false);
                paymentForm.reset();
            },
        });
    };

    const handleDeletePayment = (paymentId) => {
        if (confirm('هل أنت متأكد من إلغاء وحذف هذه الدفعة؟')) {
            router.delete(`/purchases/payments/${paymentId}`);
        }
    };

    const handleReceiveOrder = () => {
        if (confirm('هل أنت متأكد من استلام بضاعة أمر الشراء وتوريدها إلى المخزن؟')) {
            router.post(`/purchases/${order.id}/receive`, {}, {
                onSuccess: () => setShowReceiveModal(false),
            });
        }
    };

    const formatCurrency = (val) => {
        return Number(val || 0).toLocaleString('ar-SA', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }) + ' ر.س';
    };

    const printInvoice = () => {
        window.print();
    };

    return (
        <AppLayout>
            <Head title={`فاتورة مشتريات #${order.order_number}`} />

            <div className="space-y-6">
                {/* Screen Header (Hidden on print) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/purchases/list"
                            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
                            title="العودة للقائمة"
                        >
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2.5">
                                <h1 className="text-xl font-bold text-white tracking-wide">
                                    فاتورة مشتريات #{order.order_number}
                                </h1>
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    order.status === 'received'
                                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                }`}>
                                    {order.status === 'received' ? 'مستلم بالمخزن' : 'بانتظار الاستلام'}
                                </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">تاريخ الفاتورة: {order.date}</p>
                        </div>
                    </div>

                    <div className="flex items-center flex-wrap gap-2.5">
                        <button
                            type="button"
                            onClick={printInvoice}
                            className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition"
                        >
                            <Printer className="w-4 h-4 text-sky-400" />
                            طباعة الفاتورة
                        </button>

                        {order.status === 'confirmed' && (
                            <button
                                type="button"
                                onClick={handleReceiveOrder}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-emerald-500/20 transition"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                استلام البضاعة
                            </button>
                        )}

                        {order.status === 'received' && (
                            <Link
                                href={`/purchases/returns/create?order_id=${order.id}`}
                                className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition"
                            >
                                <CornerUpLeft className="w-4 h-4 text-rose-400" />
                                إنشاء مرتجع
                            </Link>
                        )}

                        {remainingDue > 0 && (
                            <button
                                type="button"
                                onClick={() => setShowPaymentModal(true)}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-500/20 transition"
                            >
                                <DollarSign className="w-4 h-4" />
                                تسجيل سداد
                            </button>
                        )}
                    </div>
                </div>

                {/* Printable Invoice Container */}
                <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-sm space-y-6 print:border-none print:bg-white print:text-black print:p-0">
                    {/* Invoice Printable Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start border-b border-slate-800/80 print:border-gray-200 pb-6 gap-4">
                        <div>
                            <div className="text-2xl font-black text-white print:text-black">فاتورة مشتريات</div>
                            <div className="text-xs text-slate-400 print:text-gray-600 font-mono mt-1">
                                رقم: {order.order_number}
                            </div>
                            <div className="text-xs text-slate-400 print:text-gray-600 mt-1">
                                التاريخ: {order.date}
                            </div>
                        </div>

                        <div className="text-left sm:text-right text-xs space-y-1 text-slate-300 print:text-gray-800">
                            <div className="font-semibold text-white print:text-black text-sm">
                                {order.branch?.name || 'الفرع الرئيسي'}
                            </div>
                            <div>المستودع: {order.warehouse?.name || 'المستودع الرئيسي'}</div>
                            <div>المسؤول: {order.user?.name || 'مدير النظام'}</div>
                        </div>
                    </div>

                    {/* Parties info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-950/40 print:bg-gray-50 border border-slate-800/60 print:border-gray-200 rounded-xl space-y-1.5">
                            <div className="text-xs font-semibold text-emerald-400 print:text-emerald-700 flex items-center gap-1.5">
                                <UserCheck className="w-3.5 h-3.5" />
                                بيانات المورد
                            </div>
                            <div className="text-sm font-bold text-white print:text-black">
                                {order.contact?.name || 'مورد عام'}
                            </div>
                            <div className="text-xs text-slate-400 print:text-gray-600">
                                هاتف: {order.contact?.phone || '—'}
                            </div>
                            <div className="text-xs text-slate-400 print:text-gray-600">
                                الرقم الضريبي: {order.contact?.tax_number || '—'}
                            </div>
                        </div>

                        <div className="p-4 bg-slate-950/40 print:bg-gray-50 border border-slate-800/60 print:border-gray-200 rounded-xl space-y-1.5">
                            <div className="text-xs font-semibold text-indigo-400 print:text-indigo-700 flex items-center gap-1.5">
                                <CreditCard className="w-3.5 h-3.5" />
                                الحالة المالية للفاتورة
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-400 print:text-gray-600">إجمالي الفاتورة:</span>
                                <span className="font-bold text-white print:text-black font-mono">{formatCurrency(order.total_amount)}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-400 print:text-gray-600">المسدد للمورد:</span>
                                <span className="font-semibold text-emerald-400 print:text-emerald-600 font-mono">{formatCurrency(order.paid_amount)}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-400 print:text-gray-600">المتبقي المطلوب:</span>
                                <span className="font-bold text-amber-400 print:text-amber-600 font-mono">{formatCurrency(remainingDue)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-right text-xs">
                            <thead className="bg-slate-950/60 print:bg-gray-100 border-b border-slate-800/80 print:border-gray-200 text-slate-400 print:text-gray-700 font-medium">
                                <tr>
                                    <th className="py-2.5 px-3">#</th>
                                    <th className="py-2.5 px-3">الصنف / المنتج</th>
                                    <th className="py-2.5 px-3 text-center">الكمية</th>
                                    <th className="py-2.5 px-3 text-center">المستلم</th>
                                    <th className="py-2.5 px-3">سعر الوحدة</th>
                                    <th className="py-2.5 px-3">الخصم</th>
                                    <th className="py-2.5 px-3">الضريبة</th>
                                    <th className="py-2.5 px-3 text-left">الإجمالي</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50 print:divide-gray-200 text-slate-300 print:text-gray-800">
                                {order.lines?.map((line, index) => (
                                    <tr key={line.id} className="hover:bg-slate-800/20 transition">
                                        <td className="py-3 px-3 text-slate-500 font-mono">{index + 1}</td>
                                        <td className="py-3 px-3">
                                            <div className="font-semibold text-white print:text-black">
                                                {line.product?.name || 'صنف'}
                                            </div>
                                            {line.variation && (
                                                <div className="text-[11px] text-slate-400 print:text-gray-600">
                                                    السمة: {line.variation.name}
                                                </div>
                                            )}
                                            {line.serials && line.serials.length > 0 && (
                                                <div className="mt-1 flex flex-wrap gap-1">
                                                    {line.serials.map((s) => (
                                                        <span key={s.id} className="px-1.5 py-0.5 rounded bg-slate-800 print:bg-gray-200 text-teal-400 print:text-teal-800 text-[10px] font-mono">
                                                            {s.serial?.serial_number}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-3 px-3 text-center font-mono">
                                            {Number(line.quantity)} {line.unit?.name || ''}
                                        </td>
                                        <td className="py-3 px-3 text-center font-mono">
                                            <span className={`px-2 py-0.5 rounded-full text-[11px] ${
                                                order.status === 'received' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                                            }`}>
                                                {order.status === 'received' ? Number(line.quantity) : 0}
                                            </span>
                                        </td>
                                        <td className="py-3 px-3 font-mono">{formatCurrency(line.unit_cost)}</td>
                                        <td className="py-3 px-3 font-mono text-rose-400">
                                            {Number(line.discount_amount) > 0 ? `-${formatCurrency(line.discount_amount)}` : '—'}
                                        </td>
                                        <td className="py-3 px-3 font-mono text-slate-400">{formatCurrency(line.tax_amount)}</td>
                                        <td className="py-3 px-3 text-left font-bold text-white print:text-black font-mono">
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
                                <span>المجموع الفرعي:</span>
                                <span className="font-mono text-white print:text-black">{formatCurrency(order.subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-slate-400 print:text-gray-600">
                                <span>إجمالي الخصومات:</span>
                                <span className="font-mono text-rose-400">-{formatCurrency(order.discount_amount)}</span>
                            </div>
                            <div className="flex justify-between text-slate-400 print:text-gray-600">
                                <span>ضريبة القيمة المضافة:</span>
                                <span className="font-mono text-amber-400">+{formatCurrency(order.tax_amount)}</span>
                            </div>
                            <div className="flex justify-between text-slate-400 print:text-gray-600">
                                <span>مصاريف الشحن:</span>
                                <span className="font-mono text-white print:text-black">+{formatCurrency(order.shipping_amount)}</span>
                            </div>
                            <div className="flex justify-between text-sm font-bold text-white print:text-black pt-2 border-t border-slate-800/80 print:border-gray-200">
                                <span>الصافي النهائي:</span>
                                <span className="font-mono text-emerald-400 print:text-emerald-700 text-base">{formatCurrency(order.total_amount)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    {order.notes && (
                        <div className="p-3 bg-slate-950/40 print:bg-gray-50 border border-slate-800/60 print:border-gray-200 rounded-xl text-xs text-slate-400 print:text-gray-700">
                            <span className="font-semibold text-slate-300 print:text-black block mb-1">ملاحظات:</span>
                            {order.notes}
                        </div>
                    )}
                </div>

                {/* Payments Section (Hidden on print) */}
                <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4 print:hidden">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-emerald-400" />
                            سجل الدفعات وسندات السداد المسجلة
                        </h2>
                        {remainingDue > 0 && (
                            <button
                                type="button"
                                onClick={() => setShowPaymentModal(true)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-medium rounded-xl border border-slate-700 transition"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                إضافة دفعة
                            </button>
                        )}
                    </div>

                    {order.payments && order.payments.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-right text-xs">
                                <thead className="bg-slate-950/60 border-b border-slate-800/80 text-slate-400 font-medium">
                                    <tr>
                                        <th className="py-2.5 px-3">التاريخ</th>
                                        <th className="py-2.5 px-3">المبلغ</th>
                                        <th className="py-2.5 px-3">طريقة الدفع</th>
                                        <th className="py-2.5 px-3">الخزينة / الحساب البنكي</th>
                                        <th className="py-2.5 px-3">المرجع</th>
                                        <th className="py-2.5 px-3">المسؤول</th>
                                        <th className="py-2.5 px-2 text-center w-12"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50 text-slate-300">
                                    {order.payments.map((payment) => (
                                        <tr key={payment.id} className="hover:bg-slate-800/20 transition">
                                            <td className="py-2.5 px-3 text-slate-400">{payment.date}</td>
                                            <td className="py-2.5 px-3 font-bold text-emerald-400 font-mono">
                                                {formatCurrency(payment.amount)}
                                            </td>
                                            <td className="py-2.5 px-3 font-medium">
                                                {payment.payment_method?.name || 'نقدي'}
                                            </td>
                                            <td className="py-2.5 px-3 text-slate-400">
                                                {payment.treasury?.name || payment.bank_account?.bank_name || '—'}
                                            </td>
                                            <td className="py-2.5 px-3 text-slate-400 font-mono">
                                                {payment.reference || '—'}
                                            </td>
                                            <td className="py-2.5 px-3 text-slate-400">
                                                {payment.creator?.name || '—'}
                                            </td>
                                            <td className="py-2.5 px-2 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeletePayment(payment.id)}
                                                    className="p-1 text-slate-500 hover:text-rose-400 transition"
                                                    title="حذف الدفعة"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="py-6 text-center text-slate-500 text-xs">
                            لم يتم تسجيل أي دفعات سداد لهذه الفاتورة حتى الآن.
                        </div>
                    )}
                </div>

                {/* Returns Section (Hidden on print) */}
                {order.returns && order.returns.length > 0 && (
                    <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4 print:hidden">
                        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                            <CornerUpLeft className="w-4 h-4 text-rose-400" />
                            مرتجعات المشتريات المرتبطة بهذه الفاتورة
                        </h2>

                        <div className="overflow-x-auto">
                            <table className="w-full text-right text-xs">
                                <thead className="bg-slate-950/60 border-b border-slate-800/80 text-slate-400 font-medium">
                                    <tr>
                                        <th className="py-2.5 px-3">رقم المرتجع</th>
                                        <th className="py-2.5 px-3">التاريخ</th>
                                        <th className="py-2.5 px-3">إجمالي المرتجع</th>
                                        <th className="py-2.5 px-3">الضريبة المستردة</th>
                                        <th className="py-2.5 px-3 text-center">الإجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50 text-slate-300">
                                    {order.returns.map((ret) => (
                                        <tr key={ret.id} className="hover:bg-slate-800/20 transition">
                                            <td className="py-2.5 px-3 font-semibold text-rose-400">
                                                {ret.return_number}
                                            </td>
                                            <td className="py-2.5 px-3 text-slate-400">{ret.date}</td>
                                            <td className="py-2.5 px-3 font-bold text-white font-mono">
                                                {formatCurrency(ret.total_amount)}
                                            </td>
                                            <td className="py-2.5 px-3 text-slate-400 font-mono">
                                                {formatCurrency(ret.tax_amount)}
                                            </td>
                                            <td className="py-2.5 px-3 text-center">
                                                <Link
                                                    href={`/purchases/returns/${ret.id}`}
                                                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] transition"
                                                >
                                                    عرض التفاصيل
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Payment Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-emerald-400" />
                                تسجيل دفعة سداد للمورد
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowPaymentModal(false)}
                                className="text-slate-400 hover:text-white transition"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handlePaymentSubmit} className="space-y-3.5 text-xs">
                            <div>
                                <label className="block text-slate-300 mb-1">المبلغ المدفوع (ر.س) *</label>
                                <input
                                    type="number"
                                    min="0.01"
                                    step="any"
                                    max={remainingDue}
                                    value={paymentForm.data.amount}
                                    onChange={(e) => paymentForm.setData('amount', e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500/50"
                                />
                                {paymentForm.errors.amount && (
                                    <p className="text-[11px] text-rose-400 mt-1">{paymentForm.errors.amount}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-slate-300 mb-1">تاريخ السداد *</label>
                                <input
                                    type="date"
                                    value={paymentForm.data.date}
                                    onChange={(e) => paymentForm.setData('date', e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500/50"
                                />
                            </div>

                            <div>
                                <label className="block text-slate-300 mb-1">طريقة السداد *</label>
                                <select
                                    value={paymentForm.data.payment_method_id}
                                    onChange={(e) => paymentForm.setData('payment_method_id', e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500/50"
                                >
                                    {paymentMethods.map((pm) => (
                                        <option key={pm.id} value={pm.id}>{pm.name}</option>
                                    ))}
                                </select>
                            </div>

                            {treasuries.length > 0 && (
                                <div>
                                    <label className="block text-slate-300 mb-1">الخزينة (الصندوق)</label>
                                    <select
                                        value={paymentForm.data.treasury_id}
                                        onChange={(e) => paymentForm.setData('treasury_id', e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500/50"
                                    >
                                        <option value="">بدون خزينة</option>
                                        {treasuries.map((t) => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-slate-300 mb-1">رقم المرجع أو الإيصال</label>
                                <input
                                    type="text"
                                    value={paymentForm.data.reference}
                                    onChange={(e) => paymentForm.setData('reference', e.target.value)}
                                    placeholder="رقم التحويل أو الشيك..."
                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500/50"
                                />
                            </div>

                            <div className="pt-2 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowPaymentModal(false)}
                                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
                                >
                                    إلغاء
                                </button>
                                <button
                                    type="submit"
                                    disabled={paymentForm.processing}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl transition disabled:opacity-50"
                                >
                                    {paymentForm.processing ? 'جارٍ الحفظ...' : 'تأكيد السداد'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
