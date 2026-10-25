import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    Truck,
    ShoppingCart,
    Building2,
    User,
    Phone,
    Package,
    MapPin,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Edit,
    Save,
    X,
} from 'lucide-react';

const STATUS_MAP = {
    pending:   { label: 'معلقة',    color: '#d97706', bg: '#fef3c7' },
    shipped:   { label: 'مشحونة',   color: '#2563eb', bg: '#dbeafe' },
    delivered: { label: 'مسلّمة',   color: '#16a34a', bg: '#dcfce7' },
    returned:  { label: 'مرتجعة',   color: '#dc2626', bg: '#fee2e2' },
};

export default function ShipmentShow({ shipment, shippingCompanies = [] }) {
    const [editing, setEditing] = useState(false);

    const { data, setData, put, processing, errors, reset } = useForm({
        shipping_company_id: shipment.shipping_company_id || '',
        tracking_number:     shipment.tracking_number || '',
        shipped_at:          shipment.shipped_at ? shipment.shipped_at.slice(0, 10) : '',
        delivered_at:        shipment.delivered_at ? shipment.delivered_at.slice(0, 10) : '',
        shipping_cost:       String(shipment.shipping_cost || '0'),
        status:              shipment.status || 'pending',
        notes:               shipment.notes || '',
    });

    const handleUpdate = (e) => {
        e.preventDefault();
        put(`/sales/shipments/${shipment.id}`, {
            onSuccess: () => setEditing(false),
        });
    };

    const s = STATUS_MAP[shipment.status] || STATUS_MAP.pending;
    const fmt = (val) => Number(val || 0).toFixed(2);

    return (
        <AppLayout>
            <Head title={`شحنة #${shipment.id}`} />

            <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
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
                        <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#1e293b' }}>
                            شحنة #{shipment.id}
                        </h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                            <span style={{
                                padding: '2px 10px', borderRadius: '20px', fontSize: '12px',
                                fontWeight: 600, background: s.bg, color: s.color,
                            }}>
                                {s.label}
                            </span>
                            {shipment.tracking_number && (
                                <span style={{ fontSize: '13px', color: '#64748b', fontFamily: 'monospace' }}>
                                    {shipment.tracking_number}
                                </span>
                            )}
                        </div>
                    </div>
                    <div style={{ marginRight: 'auto', display: 'flex', gap: '10px' }}>
                        <Link
                            href="/sales/shipments"
                            style={{
                                padding: '8px 16px', borderRadius: '8px',
                                background: '#f1f5f9', color: '#475569',
                                textDecoration: 'none', fontSize: '14px',
                            }}
                        >
                            ← الشحنات
                        </Link>
                        {!editing && (
                            <button
                                onClick={() => setEditing(true)}
                                style={{
                                    padding: '8px 16px', borderRadius: '8px',
                                    background: '#0ea5e9', color: '#fff',
                                    fontSize: '14px', fontWeight: 600,
                                    border: 'none', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                }}
                            >
                                <Edit size={15} />
                                تعديل
                            </button>
                        )}
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                    {/* Sale Order Card */}
                    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                            <ShoppingCart size={18} color="#6366f1" />
                            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>فاتورة البيع</h2>
                        </div>
                        {shipment.sale_order ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div>
                                    <div style={{ fontSize: '12px', color: '#64748b' }}>رقم الفاتورة</div>
                                    <Link
                                        href={`/sales/${shipment.sale_order.id}`}
                                        style={{ fontWeight: 700, fontSize: '16px', color: '#6366f1', textDecoration: 'none' }}
                                    >
                                        {shipment.sale_order.order_number}
                                    </Link>
                                </div>
                                {shipment.sale_order.contact && (
                                    <div>
                                        <div style={{ fontSize: '12px', color: '#64748b' }}>العميل</div>
                                        <div style={{ fontWeight: 600, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <User size={14} color="#6366f1" />
                                            {shipment.sale_order.contact.name}
                                        </div>
                                        {shipment.sale_order.contact.phone && (
                                            <div style={{ fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                                <Phone size={12} />
                                                {shipment.sale_order.contact.phone}
                                            </div>
                                        )}
                                    </div>
                                )}
                                {shipment.sale_order.branch && (
                                    <div>
                                        <div style={{ fontSize: '12px', color: '#64748b' }}>الفرع</div>
                                        <div style={{ fontWeight: 600, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Building2 size={14} color="#6366f1" />
                                            {shipment.sale_order.branch.name}
                                        </div>
                                    </div>
                                )}

                                {/* Order Lines summary */}
                                {shipment.sale_order.lines && shipment.sale_order.lines.length > 0 && (
                                    <div style={{ marginTop: '8px' }}>
                                        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>أصناف الفاتورة</div>
                                        {shipment.sale_order.lines.slice(0, 5).map(line => (
                                            <div key={line.id} style={{
                                                display: 'flex', justifyContent: 'space-between',
                                                padding: '4px 0', borderBottom: '1px solid #f1f5f9', fontSize: '13px',
                                            }}>
                                                <span style={{ color: '#374151' }}>{line.product?.name || '—'}</span>
                                                <span style={{ color: '#64748b' }}>×{line.quantity}</span>
                                            </div>
                                        ))}
                                        {shipment.sale_order.lines.length > 5 && (
                                            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                                                +{shipment.sale_order.lines.length - 5} أصناف أخرى
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p style={{ color: '#94a3b8', fontSize: '14px' }}>لا توجد بيانات فاتورة</p>
                        )}
                    </div>

                    {/* Shipment Details Card */}
                    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                            <Truck size={18} color="#0ea5e9" />
                            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>تفاصيل الشحنة</h2>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {[
                                { label: 'شركة الشحن', value: shipment.shipping_company?.name || '—' },
                                { label: 'رقم التتبع', value: shipment.tracking_number || '—', mono: true },
                                { label: 'تكلفة الشحن', value: `${fmt(shipment.shipping_cost)} ر.س` },
                                { label: 'تاريخ الشحن', value: shipment.shipped_at ? new Date(shipment.shipped_at).toLocaleDateString('ar-SA') : '—' },
                                { label: 'تاريخ التسليم', value: shipment.delivered_at ? new Date(shipment.delivered_at).toLocaleDateString('ar-SA') : '—' },
                            ].map((item, i) => (
                                <div key={i}>
                                    <div style={{ fontSize: '12px', color: '#64748b' }}>{item.label}</div>
                                    <div style={{
                                        fontWeight: 600, fontSize: '15px', color: '#1e293b',
                                        fontFamily: item.mono ? 'monospace' : 'inherit',
                                    }}>
                                        {item.value}
                                    </div>
                                </div>
                            ))}
                        </div>
                        {shipment.notes && (
                            <div style={{ marginTop: '12px', padding: '10px', background: '#f8fafc', borderRadius: '8px', fontSize: '13px', color: '#374151' }}>
                                <strong>ملاحظات:</strong> {shipment.notes}
                            </div>
                        )}
                    </div>
                </div>

                {/* Edit Form */}
                {editing && (
                    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>تعديل بيانات الشحنة</h2>
                            <button
                                onClick={() => { setEditing(false); reset(); }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleUpdate}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                {/* Shipping Company */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>شركة الشحن</label>
                                    <select
                                        value={data.shipping_company_id}
                                        onChange={e => setData('shipping_company_id', e.target.value)}
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', boxSizing: 'border-box' }}
                                    >
                                        <option value="">بدون شركة شحن</option>
                                        {shippingCompanies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>

                                {/* Tracking Number */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>رقم التتبع</label>
                                    <input
                                        type="text"
                                        value={data.tracking_number}
                                        onChange={e => setData('tracking_number', e.target.value)}
                                        placeholder="رقم التتبع"
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', boxSizing: 'border-box' }}
                                    />
                                </div>

                                {/* Status */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                                        الحالة <span style={{ color: '#ef4444' }}>*</span>
                                    </label>
                                    <select
                                        value={data.status}
                                        onChange={e => setData('status', e.target.value)}
                                        style={{
                                            width: '100%', padding: '10px 12px', borderRadius: '8px', fontSize: '14px',
                                            border: errors.status ? '1px solid #ef4444' : '1px solid #d1d5db',
                                            boxSizing: 'border-box',
                                        }}
                                    >
                                        <option value="pending">معلقة</option>
                                        <option value="shipped">مشحونة</option>
                                        <option value="delivered">مسلّمة</option>
                                        <option value="returned">مرتجعة</option>
                                    </select>
                                    {errors.status && <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0' }}>{errors.status}</p>}
                                </div>

                                {/* Shipping Cost */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>تكلفة الشحن (ر.س)</label>
                                    <input
                                        type="number" min="0" step="0.01"
                                        value={data.shipping_cost}
                                        onChange={e => setData('shipping_cost', e.target.value)}
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', boxSizing: 'border-box' }}
                                    />
                                </div>

                                {/* Shipped At */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>تاريخ الشحن</label>
                                    <input
                                        type="date"
                                        value={data.shipped_at}
                                        onChange={e => setData('shipped_at', e.target.value)}
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', boxSizing: 'border-box' }}
                                    />
                                </div>

                                {/* Delivered At */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>تاريخ التسليم</label>
                                    <input
                                        type="date"
                                        value={data.delivered_at}
                                        onChange={e => setData('delivered_at', e.target.value)}
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', boxSizing: 'border-box' }}
                                    />
                                    {errors.delivered_at && <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0' }}>{errors.delivered_at}</p>}
                                </div>
                            </div>

                            {/* Notes */}
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>ملاحظات</label>
                                <textarea
                                    value={data.notes}
                                    onChange={e => setData('notes', e.target.value)}
                                    rows={3}
                                    placeholder="ملاحظات إضافية"
                                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', boxSizing: 'border-box', resize: 'vertical' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '6px',
                                        padding: '10px 22px', borderRadius: '9px',
                                        background: processing ? '#7dd3fc' : '#0ea5e9',
                                        color: '#fff', fontWeight: 700, fontSize: '14px',
                                        border: 'none', cursor: processing ? 'not-allowed' : 'pointer',
                                    }}
                                >
                                    <Save size={16} />
                                    {processing ? 'جارٍ الحفظ...' : 'حفظ التعديلات'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setEditing(false); reset(); }}
                                    style={{
                                        padding: '10px 18px', borderRadius: '9px',
                                        background: '#f1f5f9', color: '#475569',
                                        fontSize: '14px', border: 'none', cursor: 'pointer',
                                    }}
                                >
                                    إلغاء
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
