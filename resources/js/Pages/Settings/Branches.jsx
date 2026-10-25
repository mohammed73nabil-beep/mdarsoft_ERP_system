import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    Building2,
    Plus,
    Warehouse,
    Phone,
    MapPin,
    X,
    CheckCircle2,
} from 'lucide-react';

export default function SettingsBranches({ branches = [] }) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        code: '',
        phone: '',
        address: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/settings/branches', {
            onSuccess: () => {
                setIsModalOpen(false);
                reset();
            },
        });
    };

    return (
        <AppLayout>
            <Head title="فروع النشاط والمستودعات" />

            <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginBottom: '28px',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{
                            width: '48px', height: '48px', borderRadius: '14px',
                            background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 6px 16px rgba(14, 165, 233, 0.25)',
                        }}>
                            <Building2 size={24} color="#fff" />
                        </div>
                        <div>
                            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>
                                فروع النشاط والمستودعات
                            </h1>
                            <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#64748b' }}>
                                إدارة الفروع، المستودعات التابعة، والخزائن النقدية
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsModalOpen(true)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '10px 18px', borderRadius: '10px', border: 'none',
                            background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                            color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer',
                        }}
                    >
                        <Plus size={16} />
                        إضافة فرع جديد
                    </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
                    {branches.map(b => (
                        <div
                            key={b.id}
                            style={{
                                background: '#fff', border: '1px solid #e2e8f0',
                                borderRadius: '16px', padding: '20px',
                                boxShadow: '0 4px 16px rgba(0,0,0,0.02)',
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#1e293b' }}>
                                        {b.name}
                                    </h3>
                                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
                                        رمز الفرع: {b.code}
                                    </span>
                                </div>

                                <span style={{
                                    padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
                                    background: b.is_active ? '#ecfdf5' : '#fef2f2',
                                    color: b.is_active ? '#047857' : '#b91c1c',
                                }}>
                                    {b.is_active ? 'نشط' : 'معطل'}
                                </span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#475569', marginBottom: '16px' }}>
                                {b.phone && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Phone size={14} color="#94a3b8" />
                                        <span>{b.phone}</span>
                                    </div>
                                )}
                                {b.address && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <MapPin size={14} color="#94a3b8" />
                                        <span>{b.address}</span>
                                    </div>
                                )}
                            </div>

                            <div style={{
                                borderTop: '1px dashed #e2e8f0', paddingTop: '12px',
                                display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#0284c7', fontWeight: 600,
                            }}>
                                <Warehouse size={14} />
                                <span>{b.warehouses_count || b.warehouses?.length || 0} مستودع مرتبط بهذا الفرع</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 50, backdropFilter: 'blur(4px)',
                }}>
                    <div style={{
                        background: '#fff', borderRadius: '18px', width: '90%', maxWidth: '480px',
                        padding: '24px', boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                                إضافة فرع نشاط جديد
                            </h3>
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                        اسم الفرع <span style={{ color: '#ef4444' }}>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="مثال: فرع الخبر"
                                        value={data.name}
                                        onChange={e => setData('name', e.target.value)}
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                                    />
                                    {errors.name && <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0' }}>{errors.name}</p>}
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                        كود الفرع <span style={{ color: '#ef4444' }}>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="مثال: KHB"
                                        value={data.code}
                                        onChange={e => setData('code', e.target.value)}
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                                    />
                                    {errors.code && <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0' }}>{errors.code}</p>}
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                        رقم الهاتف
                                    </label>
                                    <input
                                        type="text"
                                        value={data.phone}
                                        onChange={e => setData('phone', e.target.value)}
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                        العنوان
                                    </label>
                                    <input
                                        type="text"
                                        value={data.address}
                                        onChange={e => setData('address', e.target.value)}
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', color: '#475569', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}
                                >
                                    إلغاء
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    style={{
                                        flex: 1, padding: '10px 18px', borderRadius: '8px', border: 'none',
                                        background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                                        color: '#fff', fontWeight: 700, fontSize: '14px', cursor: 'pointer',
                                    }}
                                >
                                    {processing ? 'جاري الإنشاء...' : 'إنشاء الفرع وتجهيز المستودع'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
