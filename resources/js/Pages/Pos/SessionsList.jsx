import React, { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    Monitor,
    Clock,
    CheckCircle2,
    XCircle,
    Building2,
    Warehouse,
    Landmark,
    DollarSign,
    PowerOff,
    Eye,
    Search,
    Filter,
    ChevronLeft,
    ChevronRight,
    ShoppingCart,
    Plus,
} from 'lucide-react';

const STATUS_LABELS = {
    open:   { label: 'مفتوحة', color: '#16a34a', bg: '#dcfce7' },
    closed: { label: 'مغلقة',  color: '#6b7280', bg: '#f3f4f6' },
};

export default function PosSessionsList({
    sessions,
    openSession = null,
    filters = {},
    branches = [],
}) {
    const [status, setStatus] = useState(filters.status || '');
    const [branchId, setBranchId] = useState(filters.branch_id || '');

    // Close session form
    const { data: closeData, setData: setCloseData, post: closePost, processing: closing, errors: closeErrors } = useForm({
        actual_closing: openSession ? String(openSession.opening_balance || '0') : '0',
        notes: '',
    });

    const [showCloseForm, setShowCloseForm] = useState(false);

    const handleFilter = (e) => {
        if (e) e.preventDefault();
        router.get('/sales/pos-list', { status, branch_id: branchId }, { preserveState: true, replace: true });
    };

    const handleClose = (e) => {
        e.preventDefault();
        closePost(`/sales/pos/${openSession.id}/close`, {
            onSuccess: () => setShowCloseForm(false),
        });
    };

    const fmt = (val) => Number(val || 0).toFixed(2);

    return (
        <AppLayout>
            <Head title="جلسات نقطة البيع" />

            <div style={{ padding: '24px' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <div style={{
                        width: '44px', height: '44px', borderRadius: '10px',
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Monitor size={22} color="#fff" />
                    </div>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#1e293b' }}>سجل جلسات نقطة البيع</h1>
                        <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
                            إجمالي الجلسات: {sessions?.total || 0}
                        </p>
                    </div>
                    <Link
                        href="/sales/pos"
                        style={{
                            marginRight: 'auto', padding: '10px 18px', borderRadius: '8px',
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            color: '#fff', fontWeight: 600, fontSize: '14px',
                            textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px',
                        }}
                    >
                        <Monitor size={16} />
                        فتح نقطة البيع
                    </Link>
                </div>

                {/* Open Session Banner */}
                {openSession && (
                    <div style={{
                        background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)',
                        border: '2px solid #86efac', borderRadius: '14px',
                        padding: '20px 24px', marginBottom: '20px',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <CheckCircle2 size={20} color="#16a34a" />
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '16px', color: '#15803d' }}>
                                        جلسة مفتوحة: {openSession.session_number}
                                    </div>
                                    <div style={{ fontSize: '13px', color: '#166534' }}>
                                        {openSession.branch?.name} · {openSession.warehouse?.name} · فُتحت: {new Date(openSession.opened_at).toLocaleTimeString('ar-SA')}
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <Link
                                    href="/sales/create"
                                    style={{
                                        padding: '8px 16px', borderRadius: '8px', textDecoration: 'none',
                                        background: '#16a34a', color: '#fff', fontSize: '14px',
                                        display: 'flex', alignItems: 'center', gap: '6px',
                                    }}
                                >
                                    <ShoppingCart size={15} />
                                    بيع جديد
                                </Link>
                                <button
                                    onClick={() => setShowCloseForm(!showCloseForm)}
                                    style={{
                                        padding: '8px 16px', borderRadius: '8px',
                                        background: '#fff', border: '1px solid #ef4444',
                                        color: '#ef4444', fontSize: '14px', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', gap: '6px',
                                    }}
                                >
                                    <PowerOff size={15} />
                                    إغلاق الجلسة
                                </button>
                            </div>
                        </div>

                        {/* Close Form */}
                        {showCloseForm && (
                            <form onSubmit={handleClose} style={{
                                marginTop: '16px', padding: '16px',
                                background: '#fff', borderRadius: '10px',
                                border: '1px solid #d1fae5',
                            }}>
                                <p style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                                    إغلاق الجلسة — أدخل الرصيد الفعلي في الخزينة
                                </p>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
                                            الرصيد الفعلي (ر.س) <span style={{ color: '#ef4444' }}>*</span>
                                        </label>
                                        <input
                                            type="number" min="0" step="0.01"
                                            value={closeData.actual_closing}
                                            onChange={e => setCloseData('actual_closing', e.target.value)}
                                            style={{
                                                width: '100%', padding: '8px 12px', borderRadius: '7px', fontSize: '14px',
                                                border: closeErrors.actual_closing ? '1px solid #ef4444' : '1px solid #d1d5db',
                                                boxSizing: 'border-box',
                                            }}
                                        />
                                        {closeErrors.actual_closing && <p style={{ color: '#ef4444', fontSize: '12px', margin: '3px 0 0' }}>{closeErrors.actual_closing}</p>}
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
                                            ملاحظات الإغلاق
                                        </label>
                                        <input
                                            type="text"
                                            value={closeData.notes}
                                            onChange={e => setCloseData('notes', e.target.value)}
                                            placeholder="ملاحظات (اختياري)"
                                            style={{
                                                width: '100%', padding: '8px 12px', borderRadius: '7px', fontSize: '14px',
                                                border: '1px solid #d1d5db', boxSizing: 'border-box',
                                            }}
                                        />
                                    </div>
                                </div>
                                <div style={{ marginTop: '12px', display: 'flex', gap: '10px' }}>
                                    <button
                                        type="submit"
                                        disabled={closing}
                                        style={{
                                            padding: '9px 20px', borderRadius: '8px',
                                            background: closing ? '#fca5a5' : '#ef4444',
                                            color: '#fff', fontWeight: 600, fontSize: '14px',
                                            border: 'none', cursor: closing ? 'not-allowed' : 'pointer',
                                        }}
                                    >
                                        {closing ? 'جارٍ الإغلاق...' : 'تأكيد الإغلاق'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowCloseForm(false)}
                                        style={{
                                            padding: '9px 20px', borderRadius: '8px',
                                            background: '#f1f5f9', color: '#475569',
                                            fontSize: '14px', border: 'none', cursor: 'pointer',
                                        }}
                                    >
                                        إلغاء
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                )}

                {/* Filters */}
                <form onSubmit={handleFilter} style={{
                    background: '#fff', border: '1px solid #e2e8f0',
                    borderRadius: '12px', padding: '16px', marginBottom: '20px',
                    display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end',
                }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>الحالة</label>
                        <select
                            value={status}
                            onChange={e => setStatus(e.target.value)}
                            style={{ padding: '8px 12px', borderRadius: '7px', border: '1px solid #d1d5db', fontSize: '14px' }}
                        >
                            <option value="">الكل</option>
                            <option value="open">مفتوحة</option>
                            <option value="closed">مغلقة</option>
                        </select>
                    </div>
                    {branches.length > 1 && (
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>الفرع</label>
                            <select
                                value={branchId}
                                onChange={e => setBranchId(e.target.value)}
                                style={{ padding: '8px 12px', borderRadius: '7px', border: '1px solid #d1d5db', fontSize: '14px' }}
                            >
                                <option value="">الكل</option>
                                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                        </div>
                    )}
                    <button type="submit" style={{
                        padding: '9px 18px', borderRadius: '8px',
                        background: '#6366f1', color: '#fff',
                        fontSize: '14px', fontWeight: 600, border: 'none', cursor: 'pointer',
                    }}>
                        تصفية
                    </button>
                </form>

                {/* Sessions Table */}
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc' }}>
                                {['رقم الجلسة', 'الفرع', 'المستودع', 'الكاشير', 'وقت الفتح', 'وقت الإغلاق', 'الرصيد الافتتاحي', 'الرصيد الفعلي', 'الفرق', 'الحالة', ''].map(h => (
                                    <th key={h} style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 600, color: '#374151', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {sessions?.data?.length === 0 && (
                                <tr>
                                    <td colSpan="11" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '15px' }}>
                                        لا توجد جلسات مطابقة
                                    </td>
                                </tr>
                            )}
                            {sessions?.data?.map((session) => {
                                const s = STATUS_LABELS[session.status] || STATUS_LABELS.closed;
                                return (
                                    <tr key={session.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '12px 14px', fontWeight: 600, color: '#6366f1' }}>
                                            {session.session_number}
                                        </td>
                                        <td style={{ padding: '12px 14px', color: '#374151' }}>{session.branch?.name || '—'}</td>
                                        <td style={{ padding: '12px 14px', color: '#374151' }}>{session.warehouse?.name || '—'}</td>
                                        <td style={{ padding: '12px 14px', color: '#374151' }}>{session.user?.name || '—'}</td>
                                        <td style={{ padding: '12px 14px', color: '#64748b', fontSize: '13px' }}>
                                            {session.opened_at ? new Date(session.opened_at).toLocaleString('ar-SA') : '—'}
                                        </td>
                                        <td style={{ padding: '12px 14px', color: '#64748b', fontSize: '13px' }}>
                                            {session.closed_at ? new Date(session.closed_at).toLocaleString('ar-SA') : '—'}
                                        </td>
                                        <td style={{ padding: '12px 14px', color: '#374151' }}>{fmt(session.opening_balance)}</td>
                                        <td style={{ padding: '12px 14px', color: '#374151' }}>
                                            {session.actual_closing !== null ? fmt(session.actual_closing) : '—'}
                                        </td>
                                        <td style={{ padding: '12px 14px', color: session.difference > 0 ? '#16a34a' : session.difference < 0 ? '#ef4444' : '#374151' }}>
                                            {session.difference !== null ? fmt(session.difference) : '—'}
                                        </td>
                                        <td style={{ padding: '12px 14px' }}>
                                            <span style={{
                                                padding: '3px 10px', borderRadius: '20px', fontSize: '12px',
                                                fontWeight: 600, background: s.bg, color: s.color,
                                            }}>
                                                {s.label}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 14px' }}>
                                            <Link
                                                href={`/sales/pos/${session.id}`}
                                                style={{ color: '#6366f1', textDecoration: 'none', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                            >
                                                <Eye size={14} />
                                                تفاصيل
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    {sessions?.last_page > 1 && (
                        <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', background: '#fafafa' }}>
                            <span style={{ fontSize: '13px', color: '#64748b' }}>
                                عرض {sessions.from}–{sessions.to} من {sessions.total} جلسة
                            </span>
                            <div style={{ display: 'flex', gap: '6px' }}>
                                {sessions.links?.map((link, i) => (
                                    <button
                                        key={i}
                                        onClick={() => link.url && router.get(link.url)}
                                        disabled={!link.url}
                                        style={{
                                            padding: '5px 10px', borderRadius: '6px', fontSize: '13px',
                                            border: '1px solid #e2e8f0',
                                            background: link.active ? '#6366f1' : link.url ? '#fff' : '#f8fafc',
                                            color: link.active ? '#fff' : link.url ? '#374151' : '#94a3b8',
                                            cursor: link.url ? 'pointer' : 'default',
                                        }}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
