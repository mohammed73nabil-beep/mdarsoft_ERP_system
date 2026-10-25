import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    Monitor,
    Building2,
    Warehouse,
    Landmark,
    DollarSign,
    Clock,
    ShoppingCart,
    CheckCircle2,
    XCircle,
    User,
    TrendingUp,
    Eye,
    CreditCard,
} from 'lucide-react';

const PAYMENT_STATUS = {
    paid:         { label: 'مدفوعة',   color: '#16a34a', bg: '#dcfce7' },
    unpaid:       { label: 'غير مدفوعة', color: '#dc2626', bg: '#fee2e2' },
    partial:      { label: 'جزئي',     color: '#d97706', bg: '#fef3c7' },
};

export default function PosSessionShow({
    session,
    sales = [],
    sessionMetrics = {},
}) {
    const fmt = (val) => Number(val || 0).toFixed(2);

    const isClosed = session.status === 'closed';

    return (
        <AppLayout>
            <Head title={`جلسة نقطة البيع — ${session.session_number}`} />

            <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <div style={{
                        width: '44px', height: '44px', borderRadius: '10px',
                        background: isClosed
                            ? 'linear-gradient(135deg, #6b7280, #4b5563)'
                            : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Monitor size={22} color="#fff" />
                    </div>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#1e293b' }}>
                            جلسة: {session.session_number}
                        </h1>
                        <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
                            {isClosed ? 'مغلقة' : 'مفتوحة'}
                            {' · '}
                            {session.branch?.name}
                        </p>
                    </div>
                    <Link
                        href="/sales/pos-list"
                        style={{
                            marginRight: 'auto', padding: '8px 16px', borderRadius: '8px',
                            background: '#f1f5f9', color: '#475569',
                            textDecoration: 'none', fontSize: '14px',
                        }}
                    >
                        ← سجل الجلسات
                    </Link>
                </div>

                {/* Session Info Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '16px', marginBottom: '24px' }}>
                    {[
                        { icon: <Building2 size={18} color="#6366f1" />, label: 'الفرع', value: session.branch?.name },
                        { icon: <Warehouse size={18} color="#6366f1" />, label: 'المستودع', value: session.warehouse?.name },
                        { icon: <Landmark size={18} color="#6366f1" />, label: 'الخزينة', value: session.treasury?.name },
                        { icon: <User size={18} color="#6366f1" />, label: 'الكاشير', value: session.user?.name },
                        { icon: <Clock size={18} color="#16a34a" />, label: 'وقت الفتح', value: session.opened_at ? new Date(session.opened_at).toLocaleString('ar-SA') : '—' },
                        { icon: <Clock size={18} color={isClosed ? '#6b7280' : '#d97706'} />, label: 'وقت الإغلاق', value: session.closed_at ? new Date(session.closed_at).toLocaleString('ar-SA') : 'لم تُغلق بعد' },
                    ].map((item, i) => (
                        <div key={i} style={{
                            background: '#fff', border: '1px solid #e2e8f0',
                            borderRadius: '12px', padding: '16px',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>
                                {item.icon}
                                {item.label}
                            </div>
                            <div style={{ fontWeight: 600, fontSize: '15px', color: '#1e293b' }}>{item.value || '—'}</div>
                        </div>
                    ))}
                </div>

                {/* Financial Summary */}
                <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))',
                    gap: '16px', marginBottom: '24px',
                }}>
                    {[
                        { label: 'رصيد الافتتاح', value: fmt(session.opening_balance), color: '#6366f1' },
                        { label: 'الرصيد المتوقع', value: fmt(session.expected_closing), color: '#2563eb' },
                        { label: 'الرصيد الفعلي', value: session.actual_closing !== null ? fmt(session.actual_closing) : '—', color: '#16a34a' },
                        {
                            label: 'الفرق',
                            value: session.difference !== null ? fmt(session.difference) : '—',
                            color: session.difference > 0 ? '#16a34a' : session.difference < 0 ? '#dc2626' : '#374151',
                        },
                        { label: 'إجمالي المبيعات', value: `${fmt(sessionMetrics.total_sales)} ر.س`, color: '#059669' },
                        { label: 'عدد الفواتير', value: String(sessionMetrics.invoices_count || 0), color: '#374151' },
                    ].map((card, i) => (
                        <div key={i} style={{
                            background: '#fff', border: '1px solid #e2e8f0',
                            borderRadius: '12px', padding: '16px', textAlign: 'center',
                        }}>
                            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>{card.label}</div>
                            <div style={{ fontSize: '20px', fontWeight: 700, color: card.color }}>{card.value}</div>
                        </div>
                    ))}
                </div>

                {/* Sales in this session */}
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ShoppingCart size={18} color="#6366f1" />
                        <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>
                            فواتير هذه الجلسة ({sales.length})
                        </h2>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc' }}>
                                {['رقم الفاتورة', 'التاريخ', 'العميل', 'الإجمالي', 'المدفوع', 'حالة السداد', ''].map(h => (
                                    <th key={h} style={{ padding: '11px 14px', textAlign: 'right', fontWeight: 600, color: '#374151', borderBottom: '1px solid #e2e8f0' }}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {sales.length === 0 && (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: '#94a3b8', fontSize: '15px' }}>
                                        لا توجد فواتير في هذه الجلسة
                                    </td>
                                </tr>
                            )}
                            {sales.map(sale => {
                                const ps = PAYMENT_STATUS[sale.payment_status] || PAYMENT_STATUS.unpaid;
                                return (
                                    <tr key={sale.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '11px 14px', fontWeight: 600, color: '#6366f1' }}>{sale.order_number}</td>
                                        <td style={{ padding: '11px 14px', color: '#64748b', fontSize: '13px' }}>
                                            {sale.date ? new Date(sale.date).toLocaleDateString('ar-SA') : '—'}
                                        </td>
                                        <td style={{ padding: '11px 14px', color: '#374151' }}>{sale.contact?.name || 'عميل نقدي'}</td>
                                        <td style={{ padding: '11px 14px', fontWeight: 600, color: '#1e293b' }}>{fmt(sale.total_amount)} ر.س</td>
                                        <td style={{ padding: '11px 14px', color: '#16a34a', fontWeight: 600 }}>{fmt(sale.paid_amount)} ر.س</td>
                                        <td style={{ padding: '11px 14px' }}>
                                            <span style={{
                                                padding: '3px 10px', borderRadius: '20px', fontSize: '12px',
                                                fontWeight: 600, background: ps.bg, color: ps.color,
                                            }}>
                                                {ps.label}
                                            </span>
                                        </td>
                                        <td style={{ padding: '11px 14px' }}>
                                            <Link
                                                href={`/sales/${sale.id}`}
                                                style={{ color: '#6366f1', textDecoration: 'none', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                            >
                                                <Eye size={14} />
                                                عرض
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Notes */}
                {session.notes && (
                    <div style={{
                        marginTop: '16px', background: '#fffbeb', border: '1px solid #fcd34d',
                        borderRadius: '10px', padding: '14px 18px',
                    }}>
                        <p style={{ margin: 0, fontSize: '14px', color: '#92400e' }}>
                            <strong>ملاحظات:</strong> {session.notes}
                        </p>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
