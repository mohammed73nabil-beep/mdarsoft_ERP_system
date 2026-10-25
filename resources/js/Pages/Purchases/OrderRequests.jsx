import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    FileCheck,
    Plus,
    ShoppingBag,
    Eye,
    Clock,
} from 'lucide-react';

export default function PurchaseOrderRequests({ requests }) {
    const formatCurrency = (val) => {
        return Number(val || 0).toLocaleString('ar-SA', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }) + ' ر.س';
    };

    return (
        <AppLayout>
            <Head title="طلبيات الشراء" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-400">
                            <FileCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white tracking-wide">طلبيات الشراء</h1>
                            <p className="text-xs text-slate-400">متابعة طلبات وأوامر الشراء المؤكدة وبانتظار الاستلام الفعلي</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <Link
                            href="/purchases/create"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-emerald-500/20 transition"
                        >
                            <Plus className="w-4 h-4" />
                            إضافة طلبية جديدة
                        </Link>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-right text-xs">
                            <thead className="bg-slate-950/60 border-b border-slate-800/80 text-slate-400 font-medium">
                                <tr>
                                    <th className="py-3 px-4">رقم الطلبية</th>
                                    <th className="py-3 px-4">التاريخ</th>
                                    <th className="py-3 px-4">المورد</th>
                                    <th className="py-3 px-4">الفرع</th>
                                    <th className="py-3 px-4">المستودع</th>
                                    <th className="py-3 px-4 text-center">عدد الأصناف</th>
                                    <th className="py-3 px-4">إجمالي القيمة</th>
                                    <th className="py-3 px-4 text-center">الحالة</th>
                                    <th className="py-3 px-4 text-center">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50 text-slate-300">
                                {requests.data && requests.data.length > 0 ? (
                                    requests.data.map((req) => (
                                        <tr key={req.id} className="hover:bg-slate-800/30 transition">
                                            <td className="py-3 px-4 font-semibold text-emerald-400">
                                                <Link href={`/purchases/${req.id}`} className="hover:underline">
                                                    {req.order_number}
                                                </Link>
                                            </td>
                                            <td className="py-3 px-4 text-slate-400">{req.date}</td>
                                            <td className="py-3 px-4 font-medium text-white">{req.contact?.name || 'مورد عام'}</td>
                                            <td className="py-3 px-4 text-slate-400">{req.branch?.name || '—'}</td>
                                            <td className="py-3 px-4 text-slate-400">{req.warehouse?.name || '—'}</td>
                                            <td className="py-3 px-4 text-center">
                                                <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[11px]">
                                                    {req.lines_count || 0}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 font-bold text-white font-mono">
                                                {formatCurrency(req.total_amount)}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    بانتظار الاستلام
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <Link
                                                    href={`/purchases/${req.id}`}
                                                    className="p-1.5 inline-flex bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition"
                                                    title="عرض الطلبية واستلامها"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={9} className="py-12 text-center text-slate-500">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <ShoppingBag className="w-8 h-8 text-slate-600" />
                                                <span>لا توجد طلبيات شراء معلقة حالياً</span>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
