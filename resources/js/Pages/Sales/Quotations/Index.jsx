import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    FileText,
    Plus,
    Search,
    Filter,
    Calendar,
    Building2,
    Eye,
    ArrowRight,
    X,
} from 'lucide-react';

export default function QuotationIndex({
    quotations,
    filters = {},
    branches = [],
    customers = [],
}) {
    const [search, setSearch] = useState(filters.search || '');
    const [branchId, setBranchId] = useState(filters.branch_id || '');
    const [contactId, setContactId] = useState(filters.contact_id || '');
    const [status, setStatus] = useState(filters.status || '');

    const handleFilter = (e) => {
        if (e) e.preventDefault();
        router.get(
            '/sales/quotations',
            { search, branch_id: branchId, contact_id: contactId, status },
            { preserveState: true }
        );
    };

    const formatCurrency = (val) => {
        return Number(val || 0).toLocaleString('ar-SA', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }) + ' ر.س';
    };

    return (
        <AppLayout title="قائمة عروض الأسعار">
            <Head title="قائمة عروض الأسعار" />

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
                            <FileText className="w-7 h-7 text-blue-500" />
                            عروض وبيانات الأسعار
                        </h1>
                        <p className="text-slate-400 text-sm mt-1">
                            إدارة عروض الأسعار المقدمة للعملاء وتحويلها إلى فواتير مبيعات
                        </p>
                    </div>

                    <Link
                        href="/sales/quotations/create"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-blue-900/30 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        إضافة عرض سعر جديد
                    </Link>
                </div>

                {/* Filters */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <form onSubmit={handleFilter} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                        <div className="md:col-span-2">
                            <label className="text-xs text-slate-400 mb-1 block">بحث</label>
                            <div className="relative">
                                <Search className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="رقم العرض، اسم العميل..."
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pr-9 pl-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs text-slate-400 mb-1 block">الفرع</label>
                            <select
                                value={branchId}
                                onChange={(e) => setBranchId(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="">كل الفروع</option>
                                {branches.map((b) => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-xs text-slate-400 mb-1 block">العميل</label>
                            <select
                                value={contactId}
                                onChange={(e) => setContactId(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="">كل العملاء</option>
                                {customers.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-end gap-2">
                            <button
                                type="submit"
                                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1"
                            >
                                <Filter className="w-3.5 h-3.5" />
                                تصفية
                            </button>
                        </div>
                    </form>
                </div>

                {/* Table */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-right text-sm">
                            <thead className="bg-slate-800/70 text-slate-400 text-xs font-medium uppercase border-b border-slate-800">
                                <tr>
                                    <th className="px-4 py-3">رقم العرض</th>
                                    <th className="px-4 py-3">التاريخ</th>
                                    <th className="px-4 py-3">تاريخ الانتهاء</th>
                                    <th className="px-4 py-3">العميل</th>
                                    <th className="px-4 py-3">الفرع</th>
                                    <th className="px-4 py-3">الأسطر</th>
                                    <th className="px-4 py-3">المبلغ الإجمالي</th>
                                    <th className="px-4 py-3">الحالة</th>
                                    <th className="px-4 py-3 text-center">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {quotations.data?.length === 0 ? (
                                    <tr>
                                        <td colSpan="9" className="px-4 py-12 text-center text-slate-500">
                                            لا توجد عروض أسعار مسجلة
                                        </td>
                                    </tr>
                                ) : (
                                    quotations.data.map((q) => (
                                        <tr key={q.id} className="hover:bg-slate-800/30 transition-colors">
                                            <td className="px-4 py-3.5 font-semibold text-white">
                                                <Link
                                                    href={`/sales/quotations/${q.id}`}
                                                    className="text-blue-400 hover:underline flex items-center gap-1.5"
                                                >
                                                    <FileText className="w-4 h-4 text-blue-500" />
                                                    {q.quotation_number}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3.5 text-slate-300">{q.date}</td>
                                            <td className="px-4 py-3.5 text-slate-400">{q.expiry_date || '-'}</td>
                                            <td className="px-4 py-3.5 text-slate-200">{q.contact?.name || 'عميل محتمل'}</td>
                                            <td className="px-4 py-3.5 text-slate-400 text-xs">{q.branch?.name}</td>
                                            <td className="px-4 py-3.5 text-slate-300 font-medium">{q.lines_count}</td>
                                            <td className="px-4 py-3.5 font-bold text-white">{formatCurrency(q.total_amount)}</td>
                                            <td className="px-4 py-3.5 text-xs">
                                                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                                    {q.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5 text-center">
                                                <Link
                                                    href={`/sales/quotations/${q.id}`}
                                                    className="p-1.5 text-slate-400 hover:text-blue-400 bg-slate-800 hover:bg-slate-700/80 rounded border border-slate-700 transition-colors inline-block"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Link>
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
