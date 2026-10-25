import React, { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    ShoppingCart,
    Printer,
    CornerUpLeft,
    Plus,
    Calendar,
    Building2,
    Warehouse,
    UserCheck,
    CreditCard,
    DollarSign,
    CheckCircle2,
    Clock,
    FileText,
    Trash2,
    X,
    Hash,
    ArrowRight,
} from 'lucide-react';

export default function SaleShow({
    sale,
    paymentMethods = [],
    treasuries = [],
    bankAccounts = [],
}) {
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    const { data: paymentData, setData: setPaymentData, post: postPayment, processing: paymentProcessing, reset: resetPayment, errors: paymentErrors } = useForm({
        date: new Date().toISOString().split('T')[0],
        amount: Math.max(0, Number(sale.total_amount || 0) - Number(sale.paid_amount || 0)),
        payment_method_id: paymentMethods[0]?.id ?? '',
        treasury_id: treasuries[0]?.id ?? '',
        bank_account_id: bankAccounts[0]?.id ?? '',
        reference: '',
        notes: '',
    });

    const handleRecordPayment = (e) => {
        e.preventDefault();
        postPayment(`/sales/${sale.id}/payments`, {
            onSuccess: () => {
                setShowPaymentModal(false);
                resetPayment();
            },
        });
    };

    const handleDeletePayment = (paymentId) => {
        if (confirm('هل أنت متأكد من حذف هذه الدفعة؟ سيتم تعديل رصيد الفاتورة والعميل تلقائياً.')) {
            router.delete(`/sales/payments/${paymentId}`);
        }
    };

    const formatCurrency = (val) => {
        return Number(val || 0).toLocaleString('ar-SA', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }) + ' ر.س';
    };

    const remainingAmount = Math.max(0, Number(sale.total_amount || 0) - Number(sale.paid_amount || 0));

    return (
        <AppLayout title={`فاتورة مبيعات ${sale.order_number}`}>
            <Head title={`فاتورة مبيعات ${sale.order_number}`} />

            <div className="p-6 max-w-6xl mx-auto space-y-6">
                {/* Actions & Navigation (Hidden on Print) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
                    <Link
                        href="/sales/all"
                        className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors"
                    >
                        <ArrowRight className="w-4 h-4" />
                        العودة لقائمة المبيعات
                    </Link>

                    <div className="flex items-center gap-2">
                        <Link
                            href={`/sales/returns/create?sale_id=${sale.id}`}
                            className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 text-sm font-medium rounded-lg border border-slate-700 transition-colors"
                        >
                            <CornerUpLeft className="w-4 h-4" />
                            إنشاء مرتجع للفاتورة
                        </Link>

                        {remainingAmount > 0 && (
                            <button
                                type="button"
                                onClick={() => setShowPaymentModal(true)}
                                className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-emerald-900/30 transition-colors"
                            >
                                <CreditCard className="w-4 h-4" />
                                تسجيل دفعة / تحصيل
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={() => window.print()}
                            className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-blue-900/30 transition-colors"
                        >
                            <Printer className="w-4 h-4" />
                            طباعة الفاتورة
                        </button>
                    </div>
                </div>

                {/* Printable Invoice Container */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl print:bg-white print:text-black print:border-none print:p-0 print:shadow-none">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start border-b border-slate-800 pb-6 print:border-black gap-4">
                        <div>
                            <span className="text-xs uppercase tracking-wider text-emerald-400 font-bold block mb-1">
                                فاتورة ضريبية مبسطة
                            </span>
                            <h1 className="text-2xl font-black text-white print:text-black flex items-center gap-2">
                                <FileText className="w-7 h-7 text-emerald-500 print:text-black" />
                                {sale.order_number}
                            </h1>
                            <p className="text-slate-400 print:text-gray-600 text-xs mt-1">
                                تاريخ الإصدار: <span className="font-semibold text-white print:text-black">{sale.date}</span>
                            </p>
                        </div>

                        <div className="text-left sm:text-right">
                            <span className="text-xs text-slate-400 print:text-gray-600 block">حالة السداد</span>
                            <span className="inline-block mt-1 font-bold text-sm px-3 py-1 rounded-full bg-slate-800 print:bg-gray-100 print:text-black">
                                {sale.payment_status === 'paid' ? 'مدفوعة بالكامل' : sale.payment_status === 'partial' ? 'مدفوعة جزئياً' : 'آجلة (غير مدفوعة)'}
                            </span>
                        </div>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-800/40 print:bg-gray-50 border border-slate-800/80 print:border-gray-200 text-xs">
                        <div>
                            <span className="text-slate-400 print:text-gray-500 block">العميل</span>
                            <span className="font-bold text-white print:text-black text-sm block mt-0.5">
                                {sale.contact?.name || 'عميل نقدي'}
                            </span>
                            {sale.contact?.phone && <span className="text-slate-500 print:text-gray-500">{sale.contact.phone}</span>}
                        </div>

                        <div>
                            <span className="text-slate-400 print:text-gray-500 block">الفرع</span>
                            <span className="font-bold text-white print:text-black text-sm block mt-0.5">
                                {sale.branch?.name}
                            </span>
                        </div>

                        <div>
                            <span className="text-slate-400 print:text-gray-500 block">المستودع المصدر</span>
                            <span className="font-bold text-white print:text-black text-sm block mt-0.5">
                                {sale.warehouse?.name}
                            </span>
                        </div>

                        <div>
                            <span className="text-slate-400 print:text-gray-500 block">المسؤول / البائع</span>
                            <span className="font-bold text-white print:text-black text-sm block mt-0.5">
                                {sale.user?.name || '-'}
                            </span>
                        </div>
                    </div>

                    {/* Line Items Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-right text-sm">
                            <thead className="bg-slate-800/80 print:bg-gray-100 text-slate-400 print:text-black text-xs font-semibold uppercase border-b border-slate-700 print:border-black">
                                <tr>
                                    <th className="px-3 py-2.5">#</th>
                                    <th className="px-3 py-2.5">المنتج / الصنف</th>
                                    <th className="px-3 py-2.5">الكمية</th>
                                    <th className="px-3 py-2.5">سعر الوحدة</th>
                                    <th className="px-3 py-2.5">الخصم</th>
                                    <th className="px-3 py-2.5">الضريبة</th>
                                    <th className="px-3 py-2.5">الإجمالي</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800 print:divide-gray-200">
                                {sale.lines?.map((line, idx) => (
                                    <tr key={line.id} className="text-slate-200 print:text-black">
                                        <td className="px-3 py-3 text-xs text-slate-500 font-mono">{idx + 1}</td>
                                        <td className="px-3 py-3">
                                            <span className="font-bold block text-white print:text-black">{line.product?.name}</span>
                                            {line.variation && (
                                                <span className="text-xs text-slate-400 print:text-gray-600 block">
                                                    النوع: {line.variation.name}
                                                </span>
                                            )}

                                            {/* Serial Badges */}
                                            {line.serials && line.serials.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5 mt-1.5">
                                                    {line.serials.map((s) => (
                                                        <span
                                                            key={s.id}
                                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-950/60 print:bg-gray-100 text-emerald-300 print:text-black border border-emerald-800/60 print:border-gray-300"
                                                        >
                                                            <Hash className="w-3 h-3 text-emerald-500 print:hidden" />
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
                                        <td className="px-3 py-3 text-amber-400 print:text-black">
                                            {line.discount_amount > 0 ? `-${formatCurrency(line.discount_amount)}` : '0'}
                                        </td>
                                        <td className="px-3 py-3 text-slate-400 print:text-black">{formatCurrency(line.tax_amount)}</td>
                                        <td className="px-3 py-3 font-bold text-white print:text-black">{formatCurrency(line.total_amount)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Summary Totals */}
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-t border-slate-800 print:border-black pt-4">
                        <div className="text-xs text-slate-400 print:text-gray-600 max-w-sm">
                            {sale.notes && (
                                <p className="mb-2">
                                    <span className="font-semibold text-white print:text-black">ملاحظات: </span>
                                    {sale.notes}
                                </p>
                            )}
                            <p>فاتورة مبيعات رسمية خاضعة للضريبة ومحدثة في نظام المحاسبة.</p>
                        </div>

                        <div className="w-full sm:w-72 space-y-2 text-sm bg-slate-800/50 print:bg-gray-50 p-4 rounded-xl border border-slate-700/50 print:border-gray-200">
                            <div className="flex justify-between text-slate-400 print:text-gray-600">
                                <span>المجموع الفرعي:</span>
                                <span className="font-semibold text-white print:text-black">{formatCurrency(sale.subtotal)}</span>
                            </div>

                            {sale.discount_amount > 0 && (
                                <div className="flex justify-between text-amber-400 print:text-black">
                                    <span>إجمالي الخصم:</span>
                                    <span className="font-semibold">-{formatCurrency(sale.discount_amount)}</span>
                                </div>
                            )}

                            {sale.tax_amount > 0 && (
                                <div className="flex justify-between text-slate-400 print:text-gray-600">
                                    <span>ضريبة القيمة المضافة:</span>
                                    <span className="font-semibold text-white print:text-black">+{formatCurrency(sale.tax_amount)}</span>
                                </div>
                            )}

                            {sale.shipping_amount > 0 && (
                                <div className="flex justify-between text-slate-400 print:text-gray-600">
                                    <span>رسوم الشحن والتوصيل:</span>
                                    <span className="font-semibold text-white print:text-black">+{formatCurrency(sale.shipping_amount)}</span>
                                </div>
                            )}

                            <div className="flex justify-between text-base font-bold text-white print:text-black border-t border-slate-700 print:border-black pt-2">
                                <span className="text-emerald-400 print:text-black">الإجمالي النهائي:</span>
                                <span className="text-emerald-400 print:text-black">{formatCurrency(sale.total_amount)}</span>
                            </div>

                            <div className="flex justify-between text-xs text-emerald-400 print:text-black">
                                <span>المسدد:</span>
                                <span>{formatCurrency(sale.paid_amount)}</span>
                            </div>

                            <div className="flex justify-between text-xs font-bold text-rose-400 print:text-black">
                                <span>المتبقي المستحق:</span>
                                <span>{formatCurrency(remainingAmount)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Payments History Table */}
                    <div className="pt-6 border-t border-slate-800 print:hidden space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                <CreditCard className="w-4 h-4 text-emerald-400" />
                                سجل دفعات ومقبوضات الفاتورة
                            </h3>

                            {remainingAmount > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setShowPaymentModal(true)}
                                    className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
                                >
                                    + تسجيل دفعة جديدة
                                </button>
                            )}
                        </div>

                        {sale.payments?.length === 0 ? (
                            <p className="text-xs text-slate-500 py-3 bg-slate-800/30 rounded-lg text-center">
                                لم يتم تسجيل أي دفعات لهذه الفاتورة بعد.
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-right text-xs">
                                    <thead className="bg-slate-800/60 text-slate-400 border-b border-slate-800">
                                        <tr>
                                            <th className="px-3 py-2">التاريخ</th>
                                            <th className="px-3 py-2">المبلغ</th>
                                            <th className="px-3 py-2">طريقة الدفع</th>
                                            <th className="px-3 py-2">المرجع</th>
                                            <th className="px-3 py-2">المسجل</th>
                                            <th className="px-3 py-2 text-center">حذف</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800 text-slate-300">
                                        {sale.payments.map((p) => (
                                            <tr key={p.id}>
                                                <td className="px-3 py-2">{p.date}</td>
                                                <td className="px-3 py-2 font-bold text-emerald-400">{formatCurrency(p.amount)}</td>
                                                <td className="px-3 py-2">{p.payment_method?.name}</td>
                                                <td className="px-3 py-2 font-mono text-slate-400">{p.reference || '-'}</td>
                                                <td className="px-3 py-2">{p.creator?.name || '-'}</td>
                                                <td className="px-3 py-2 text-center">
                                                    <button
                                                        onClick={() => handleDeletePayment(p.id)}
                                                        className="text-slate-500 hover:text-rose-400 transition-colors"
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
                        )}
                    </div>
                </div>

                {/* Add Payment Modal */}
                {showPaymentModal && (
                    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                    <CreditCard className="w-5 h-5 text-emerald-400" />
                                    تسجيل دفعة جديدة
                                </h3>
                                <button
                                    onClick={() => setShowPaymentModal(false)}
                                    className="text-slate-400 hover:text-white"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleRecordPayment} className="space-y-4">
                                <div>
                                    <label className="text-xs text-slate-400 mb-1 block">تاريخ الدفعة *</label>
                                    <input
                                        type="date"
                                        value={paymentData.date}
                                        onChange={(e) => setPaymentData('date', e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                        required
                                    />
                                    {paymentErrors.date && <p className="text-rose-500 text-xs mt-1">{paymentErrors.date}</p>}
                                </div>

                                <div>
                                    <label className="text-xs text-slate-400 mb-1 block">المبلغ (المتبقي: {formatCurrency(remainingAmount)}) *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        max={remainingAmount}
                                        value={paymentData.amount}
                                        onChange={(e) => setPaymentData('amount', e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                        required
                                    />
                                    {paymentErrors.amount && <p className="text-rose-500 text-xs mt-1">{paymentErrors.amount}</p>}
                                </div>

                                <div>
                                    <label className="text-xs text-slate-400 mb-1 block">طريقة الدفع *</label>
                                    <select
                                        value={paymentData.payment_method_id}
                                        onChange={(e) => setPaymentData('payment_method_id', e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                        required
                                    >
                                        {paymentMethods.map((pm) => (
                                            <option key={pm.id} value={pm.id}>{pm.name}</option>
                                        ))}
                                    </select>
                                    {paymentErrors.payment_method_id && <p className="text-rose-500 text-xs mt-1">{paymentErrors.payment_method_id}</p>}
                                </div>

                                <div>
                                    <label className="text-xs text-slate-400 mb-1 block">رقم المرجع / الإيصال</label>
                                    <input
                                        type="text"
                                        value={paymentData.reference}
                                        onChange={(e) => setPaymentData('reference', e.target.value)}
                                        placeholder="رقم الحوالة، إيصال الشبكة..."
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                    />
                                </div>

                                <div className="flex gap-2 pt-2 border-t border-slate-800">
                                    <button
                                        type="submit"
                                        disabled={paymentProcessing}
                                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition-colors"
                                    >
                                        {paymentProcessing ? 'جاري الحفظ...' : 'تأكيد وحفظ الدفعة'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowPaymentModal(false)}
                                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-lg transition-colors"
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
