import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    FileCode,
    Plus,
    Search,
    Trash2,
    ShoppingCart,
    ArrowRight,
} from 'lucide-react';

export default function DraftIndex({
    drafts,
    filters = {},
}) {
    const [search, setSearch] = useState(filters.search || '');

    const handleFilter = (e) => {
        if (e) e.preventDefault();
        router.get('/sales/drafts', { search }, { preserveState: true });
    };

    const handleDelete = (id, num) => {
        if (confirm(`هل أنت متأكد من حذف مسودة البيع رقم ${num}؟`)) {
            router.delete(`/sales/drafts/${id}`);
        }
    };

    const formatCurrency = (val) => {
        return Number(val || 0).toLocaleString('ar-SA', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }) + ' ر.س';
    };

    return (
        <AppLayout title="قائمة مسودات البيع">
            <Head title="قائمة مسودات البيع" />

            <div className="p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Link href="/sales/all" className="text-slate-400 hover:text-white text-xs flex items-center gap-1">
                                <ArrowRight className="w-3.5 h-3.5" />
                                المبيعات
                            </Link>
                        </div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            <FileCode className="w-7 h-7 text-purple-500" />
                            مسودات البيع غير المرحلة
                        </h1>
                        <p className="text-slate-400 text-sm mt-1">
                            فواتير محفوظة كمسودة لا تؤثر على المخزون أو الحسابات حتى يتم ترحيلها
                        </p>
                    </div>

                    <Link
                        href="/sales/drafts/create"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-purple-900/30 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        إضافة مسودة جديدة
                    </Link>
                </div>

                {/* Table */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-right text-sm">
                            <thead className="bg-slate-800/70 text-slate-400 text-xs font-medium uppercase border-b border-slate-800">
                                <tr>
                                    <th className="px-4 py-3">رقم المسودة</th>
                                    <th className="px-4 py-3">التاريخ</th>
                                    <th className="px-4 py-3">العميل</th>
                                    <th className="px-4 py-3">الفرع والمستودع</th>
                                    <th className="px-4 py-3">الأسطر</th>
                                    <th className="px-4 py-3">الإجمالي</th>
                                    <th className="px-4 py-3 text-center">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {drafts.data?.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-4 py-12 text-center text-slate-500">
                                            لا توجد مسودات بيع محفوظة
                                        </td>
                                    </tr>
                                ) : (
                                    drafts.data.map((d) => (
                                        <tr key={d.id} className="hover:bg-slate-800/30 transition-colors">
                                            <td className="px-4 py-3.5 font-semibold text-purple-400 font-mono">
                                                {d.draft_number}
                                            </td>
                                            <td className="px-4 py-3.5 text-slate-300">{d.date}</td>
                                            <td className="px-4 py-3.5 text-slate-200">{d.contact?.name || 'عميل نقدي'}</td>
                                            <td className="px-4 py-3.5 text-xs text-slate-400">
                                                <span className="block text-slate-200">{d.branch?.name}</span>
                                                <span className="block text-slate-500">{d.warehouse?.name}</span>
                                            </td>
                                            <td className="px-4 py-3.5 text-slate-300 font-medium">{d.lines_count}</td>
                                            <td className="px-4 py-3.5 font-bold text-white">{formatCurrency(d.total_amount)}</td>
                                            <td className="px-4 py-3.5 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <Link
                                                        href={`/sales/create?draft_id=${d.id}`}
                                                        className="p-1.5 text-slate-400 hover:text-emerald-400 bg-slate-800 hover:bg-slate-700/80 rounded border border-slate-700 transition-colors"
                                                        title="ترحيل وتحويل لفاتورة بيع"
                                                    >
                                                        <ShoppingCart className="w-4 h-4" />
                                                    </Link>

                                                    <button
                                                        onClick={() => handleDelete(d.id, d.draft_number)}
                                                        className="p-1.5 text-slate-400 hover:text-rose-400 bg-slate-800 hover:bg-slate-700/80 rounded border border-slate-700 transition-colors"
                                                        title="حذف المسودة"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
