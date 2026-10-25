import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    Truck,
    Plus,
    Filter,
    Search,
    RotateCcw,
    Eye,
    Edit3,
    Trash2,
    FileText,
    CheckCircle2,
    XCircle,
    Phone,
    Mail,
    Building2,
    CreditCard
} from 'lucide-react';

export default function Index({ suppliers, groups, filters }) {
    const { auth } = usePage().props;
    const userPermissions = auth?.user?.permissions || [];
    const isAdmin = auth?.user?.roles?.includes('مدير النظام') || auth?.user?.roles?.includes('admin');
    const canCreate = isAdmin || userPermissions.includes('contacts.suppliers.view') || userPermissions.includes('contacts.view');

    const [search, setSearch] = useState(filters?.search || '');
    const [groupId, setGroupId] = useState(filters?.contact_group_id || '');
    const [isActive, setIsActive] = useState(filters?.is_active ?? '');

    const applyFilters = () => {
        router.get('/contacts/suppliers', {
            search,
            contact_group_id: groupId,
            is_active: isActive,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const resetFilters = () => {
        setSearch('');
        setGroupId('');
        setIsActive('');
        router.get('/contacts/suppliers');
    };

    const handleDelete = (id, name) => {
        if (confirm(`هل أنت متأكد من رغبتك في حذف المورد "${name}"؟`)) {
            router.delete(`/contacts/${id}`);
        }
    };

    const handleToggleActive = (id) => {
        router.post(`/contacts/${id}/toggle-active`, {}, {
            preserveScroll: true,
        });
    };

    // Calculate totals for summary cards
    const totalCount = suppliers?.total || suppliers?.data?.length || 0;
    const totalPayable = suppliers?.data?.reduce((acc, s) => acc + (parseFloat(s.current_balance) || 0), 0) || 0;

    return (
        <AppLayout title="إدارة الموردين">
            <Head title="الموردين" />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
                        <Link href="/contacts" className="hover:text-white transition">جهات الاتصال</Link>
                        <span>/</span>
                        <span className="text-white font-bold">الموردين</span>
                    </div>
                    <h2 className="text-2xl font-black text-white flex items-center gap-2">
                        <Truck className="text-emerald-500" size={26} />
                        <span>قائمة الموردين</span>
                    </h2>
                </div>

                {canCreate && (
                    <Link
                        href="/contacts/suppliers/create"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition"
                    >
                        <Plus size={18} />
                        <span>إضافة مورد جديد</span>
                    </Link>
                )}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-slate-400">إجمالي الموردين</span>
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                            <Truck size={20} />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-white">{totalCount}</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-slate-400">إجمالي المستحق في الصفحة</span>
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                            <CreditCard size={20} />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-amber-400">
                        {totalPayable.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs text-slate-400 font-normal">ر.س</span>
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-slate-400">إدارة المجموعات</span>
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                            <Building2 size={20} />
                        </div>
                    </div>
                    <Link
                        href="/contacts/customer-groups"
                        className="text-sm font-bold text-blue-400 hover:text-blue-300 transition flex items-center gap-1 mt-2"
                    >
                        <span>عرض وتعديل المجموعات</span>
                        <span>←</span>
                    </Link>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6 shadow-xl">
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-300 mb-1.5 flex items-center gap-2">
                            <Search size={16} className="text-slate-400" />
                            <span>البحث (الاسم / الكود / الهاتف)</span>
                        </label>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                            placeholder="ابحث بالاسم، الكود، الهاتف، الضريبة..."
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-300 mb-1.5 flex items-center gap-2">
                            <Building2 size={16} className="text-slate-400" />
                            <span>المجموعة</span>
                        </label>
                        <select
                            value={groupId}
                            onChange={(e) => setGroupId(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                        >
                            <option value="">جميع المجموعات</option>
                            {groups?.map((g) => (
                                <option key={g.id} value={g.id}>{g.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-300 mb-1.5">الحالة</label>
                        <select
                            value={isActive}
                            onChange={(e) => setIsActive(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                        >
                            <option value="">جميع الحالات</option>
                            <option value="1">نشط</option>
                            <option value="0">معطل</option>
                        </select>
                    </div>

                    <div className="flex items-end gap-2">
                        <button
                            type="button"
                            onClick={applyFilters}
                            className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded-xl text-sm transition flex items-center justify-center gap-2 border border-slate-700"
                        >
                            <Filter size={16} />
                            <span>تطبيق</span>
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

            {/* Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-right text-sm text-slate-300">
                        <thead className="bg-slate-950/60 text-slate-400 font-bold border-b border-slate-800 text-xs uppercase">
                            <tr>
                                <th className="px-5 py-4">الرمز</th>
                                <th className="px-5 py-4">اسم المورد</th>
                                <th className="px-5 py-4">الهاتف / البريد</th>
                                <th className="px-5 py-4">المجموعة</th>
                                <th className="px-5 py-4 text-left">الرصيد المستحق</th>
                                <th className="px-5 py-4 text-center">الحالة</th>
                                <th className="px-5 py-4 text-center">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                            {suppliers?.data?.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-5 py-12 text-center text-slate-500 font-bold">
                                        لا يوجد موردين مطابقين للبحث.
                                    </td>
                                </tr>
                            ) : (
                                suppliers?.data?.map((s) => {
                                    const balance = parseFloat(s.current_balance) || 0;
                                    return (
                                        <tr key={s.id} className="hover:bg-slate-800/40 transition">
                                            <td className="px-5 py-4 font-mono font-bold text-emerald-400">
                                                {s.code || `SUP-${s.id}`}
                                            </td>
                                            <td className="px-5 py-4 font-bold text-white">
                                                <Link
                                                    href={`/contacts/suppliers/${s.id}`}
                                                    className="hover:text-emerald-400 transition"
                                                >
                                                    {s.name}
                                                </Link>
                                                {s.type === 'both' && (
                                                    <span className="mr-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                                        عميل ومورد
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4 text-slate-400 text-xs space-y-1">
                                                {s.phone && (
                                                    <div className="flex items-center gap-1.5 text-slate-300">
                                                        <Phone size={13} className="text-slate-500" />
                                                        <span dir="ltr">{s.phone}</span>
                                                    </div>
                                                )}
                                                {s.email && (
                                                    <div className="flex items-center gap-1.5 text-slate-400">
                                                        <Mail size={13} className="text-slate-500" />
                                                        <span>{s.email}</span>
                                                    </div>
                                                )}
                                                {!s.phone && !s.email && <span>—</span>}
                                            </td>
                                            <td className="px-5 py-4 text-slate-300 text-xs">
                                                {s.group?.name || '—'}
                                            </td>
                                            <td className="px-5 py-4 text-left font-mono font-bold">
                                                <span className={balance > 0 ? 'text-amber-400' : balance < 0 ? 'text-blue-400' : 'text-slate-400'}>
                                                    {balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                                <span className="text-xs text-slate-500 mr-1">ر.س</span>
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleActive(s.id)}
                                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition ${
                                                        s.is_active
                                                            ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                                                            : 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'
                                                    }`}
                                                >
                                                    {s.is_active ? (
                                                        <>
                                                            <CheckCircle2 size={13} />
                                                            <span>نشط</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <XCircle size={13} />
                                                            <span>معطل</span>
                                                        </>
                                                    )}
                                                </button>
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <Link
                                                        href={`/contacts/suppliers/${s.id}`}
                                                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                                                        title="عرض التفاصيل"
                                                    >
                                                        <Eye size={15} />
                                                    </Link>
                                                    <Link
                                                        href={`/contacts/${s.id}/ledger`}
                                                        className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition"
                                                        title="كشف الحساب"
                                                    >
                                                        <FileText size={15} />
                                                    </Link>
                                                    <Link
                                                        href={`/contacts/suppliers/${s.id}/edit`}
                                                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                                                        title="تعديل"
                                                    >
                                                        <Edit3 size={15} />
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(s.id, s.name)}
                                                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                                                        title="حذف"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {suppliers?.links?.length > 3 && (
                    <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                        <div>
                            عرض {suppliers?.from || 0} إلى {suppliers?.to || 0} من أصل {suppliers?.total || 0} مورد
                        </div>
                        <div className="flex gap-1">
                            {suppliers?.links?.map((link, idx) => (
                                <Link
                                    key={idx}
                                    href={link.url || '#'}
                                    preserveScroll
                                    preserveState
                                    className={`px-3 py-1.5 rounded-lg font-bold transition ${
                                        link.active
                                            ? 'bg-emerald-600 text-white'
                                            : !link.url
                                            ? 'text-slate-600 cursor-not-allowed'
                                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
