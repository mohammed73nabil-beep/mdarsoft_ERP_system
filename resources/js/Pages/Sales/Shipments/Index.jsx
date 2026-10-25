import React, { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    Truck,
    Search,
    Eye,
    Package,
    CheckCircle2,
    Clock,
    XCircle,
    AlertCircle,
    Filter,
    Plus,
    Building2,
} from 'lucide-react';

const STATUS_MAP = {
    pending:   { label: 'معلقة',    color: '#d97706', bg: '#fef3c7' },
    shipped:   { label: 'مشحونة',   color: '#2563eb', bg: '#dbeafe' },
    delivered: { label: 'مسلّمة',   color: '#16a34a', bg: '#dcfce7' },
    returned:  { label: 'مرتجعة',   color: '#dc2626', bg: '#fee2e2' },
};

export default function ShipmentsIndex({
    shipments,
    metrics = {},
    filters = {},
    shippingCompanies = [],
}) {
    const [status, setStatus] = useState(filters.status || '');
    const [companyId, setCompanyId] = useState(filters.shipping_company_id || '');
    const [search, setSearch] = useState(filters.search || '');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');

    const handleFilter = (e) => {
        if (e) e.preventDefault();
        router.get('/sales/shipments', {
            status, shipping_company_id: companyId, search, date_from: dateFrom, date_to: dateTo,
        }, { preserveState: true, replace: true });
    };

    const fmt = (val) => Number(val || 0).toFixed(2);

    return (
        <AppLayout>
            <Head title="الشحنات" />

            <div style={{ padding: '24px' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <div style={{
                        width: '44px', height: '44px', borderRadius: '10px',
                        background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Truck size={22} color="#fff" />
                    </div>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#1e293b' }}>الشحنات</h1>
                        <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
                            إجمالي: {shipments?.total || 0} شحنة
                        </p>
                    </div>
                    <Link
                        href="/sales/all"
                        style={{
                            marginRight: 'auto', padding: '8px 16px', borderRadius: '8px',
                            background: '#f1f5f9', color: '#475569',
                            textDecoration: 'none', fontSize: '14px',
                        }}
                    >
                        فواتير المبيعات
                    </Link>
                </div>

                {/* Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '14px', marginBottom: '20px' }}>
                    {[
                        { label: 'الإجمالي', value: metrics.total || 0, color: '#374151', icon: <Package size={18} /> },
                        { label: 'معلقة', value: metrics.pending || 0, color: '#d97706', icon: <Clock size={18} /> },
                        { label: 'مشحونة', value: metrics.shipped || 0, color: '#2563eb', icon: <Truck size={18} /> },
                        { label: 'مسلّمة', value: metrics.delivered || 0, color: '#16a34a', icon: <CheckCircle2 size={18} /> },
                        { label: 'مرتجعة', value: metrics.returned || 0, color: '#dc2626', icon: <XCircle size={18} /> },
                    ].map((m, i) => (
                        <div key={i} style={{
                            background: '#fff', border: '1px solid #e2e8f0',
                            borderRadius: '12px', padding: '16px', textAlign: 'center',
                        }}>
                            <div style={{ color: m.color, marginBottom: '6px', display: 'flex', justifyContent: 'center' }}>{m.icon}</div>
                            <div style={{ fontSize: '24px', fontWeight: 700, color: m.color }}>{m.value}</div>
                            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{m.label}</div>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <form onSubmit={handleFilter} style={{
                    background: '#fff', border: '1px solid #e2e8f0',
                    borderRadius: '12px', padding: '16px', marginBottom: '20px',
                    display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end',
                }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>بحث</label>
                        <div style={{ position: 'relative' }}>
                            <Search size={15} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="رقم التتبع أو رقم الفاتورة"
                                style={{
                                    padding: '8px 34px 8px 12px', borderRadius: '7px', border: '1px solid #d1d5db',
                                    fontSize: '14px', width: '200px',
                                }}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>الحالة</label>
                        <select
                            value={status}
                            onChange={e => setStatus(e.target.value)}
                            style={{ padding: '8px 12px', borderRadius: '7px', border: '1px solid #d1d5db', fontSize: '14px' }}
                        >
                            <option value="">الكل</option>
                            <option value="pending">معلقة</option>
                            <option value="shipped">مشحونة</option>
                            <option value="delivered">مسلّمة</option>
                            <option value="returned">مرتجعة</option>
                        </select>
                    </div>

                    {shippingCompanies.length > 0 && (
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>شركة الشحن</label>
                            <select
                                value={companyId}
                                onChange={e => setCompanyId(e.target.value)}
                                style={{ padding: '8px 12px', borderRadius: '7px', border: '1px solid #d1d5db', fontSize: '14px' }}
                            >
                                <option value="">الكل</option>
                                {shippingCompanies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    )}

                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>من تاريخ</label>
                        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                            style={{ padding: '8px 12px', borderRadius: '7px', border: '1px solid #d1d5db', fontSize: '14px' }} />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>إلى تاريخ</label>
                        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                            style={{ padding: '8px 12px', borderRadius: '7px', border: '1px solid #d1d5db', fontSize: '14px' }} />
                    </div>

                    <button type="submit" style={{
                        padding: '9px 18px', borderRadius: '8px',
                        background: '#0ea5e9', color: '#fff',
                        fontSize: '14px', fontWeight: 600, border: 'none', cursor: 'pointer',
                    }}>
                        تصفية
                    </button>
                </form>

                {/* Table */}
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc' }}>
                                {['رقم الشحنة', 'فاتورة البيع', 'العميل', 'الفرع', 'شركة الشحن', 'رقم التتبع', 'تكلفة الشحن', 'تاريخ الشحن', 'الحالة', ''].map(h => (
                                    <th key={h} style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 600, color: '#374151', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {shipments?.data?.length === 0 && (
                                <tr>
                                    <td colSpan="10" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '15px' }}>
                                        لا توجد شحنات مطابقة
                                    </td>
                                </tr>
                            )}
                            {shipments?.data?.map(shipment => {
                                const s = STATUS_MAP[shipment.status] || STATUS_MAP.pending;
                                return (
                                    <tr key={shipment.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '12px 14px', fontWeight: 600, color: '#0ea5e9' }}>
                                            #{shipment.id}
                                        </td>
                                        <td style={{ padding: '12px 14px' }}>
                                            <Link
                                                href={`/sales/${shipment.sale_order?.id}`}
                                                style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 600 }}
                                            >
                                                {shipment.sale_order?.order_number || '—'}
                                            </Link>
                                        </td>
                                        <td style={{ padding: '12px 14px', color: '#374151' }}>
                                            {shipment.sale_order?.contact?.name || 'عميل نقدي'}
                                        </td>
                                        <td style={{ padding: '12px 14px', color: '#64748b', fontSize: '13px' }}>
                                            {shipment.sale_order?.branch?.name || '—'}
                                        </td>
                                        <td style={{ padding: '12px 14px', color: '#374151' }}>
                                            {shipment.shipping_company?.name || '—'}
                                        </td>
                                        <td style={{ padding: '12px 14px', color: '#64748b', fontFamily: 'monospace', fontSize: '13px' }}>
                                            {shipment.tracking_number || '—'}
                                        </td>
                                        <td style={{ padding: '12px 14px', color: '#374151' }}>
                                            {fmt(shipment.shipping_cost)} ر.س
                                        </td>
                                        <td style={{ padding: '12px 14px', color: '#64748b', fontSize: '13px' }}>
                                            {shipment.shipped_at ? new Date(shipment.shipped_at).toLocaleDateString('ar-SA') : '—'}
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
                                                href={`/sales/shipments/${shipment.id}`}
                                                style={{ color: '#0ea5e9', textDecoration: 'none', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}
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
                    {shipments?.last_page > 1 && (
                        <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', background: '#fafafa' }}>
                            <span style={{ fontSize: '13px', color: '#64748b' }}>
                                عرض {shipments.from}–{shipments.to} من {shipments.total} شحنة
                            </span>
                            <div style={{ display: 'flex', gap: '6px' }}>
                                {shipments.links?.map((link, i) => (
                                    <button
                                        key={i}
                                        onClick={() => link.url && router.get(link.url)}
                                        disabled={!link.url}
                                        style={{
                                            padding: '5px 10px', borderRadius: '6px', fontSize: '13px',
                                            border: '1px solid #e2e8f0',
                                            background: link.active ? '#0ea5e9' : link.url ? '#fff' : '#f8fafc',
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
