import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    Truck,
    Plus,
    Edit2,
    Phone,
    X,
    CheckCircle2,
} from 'lucide-react';

export default function SettingsShippingCompanies({ companies = [] }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCompany, setEditingCompany] = useState(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        id: '',
        name: '',
        phone: '',
        is_active: true,
    });

    const openCreateModal = () => {
        setEditingCompany(null);
        reset();
        setData({ id: '', name: '', phone: '', is_active: true });
        setIsModalOpen(true);
    };

    const openEditModal = (comp) => {
        setEditingCompany(comp);
        setData({
            id: comp.id,
            name: comp.name,
            phone: comp.phone || '',
            is_active: comp.is_active,
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/settings/shipping-companies', {
            onSuccess: () => setIsModalOpen(false),
        });
    };

    return (
        <AppLayout>
            <Head title="شركات الشحن والتوصيل" />

            <div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto' }}>
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginBottom: '28px',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{
                            width: '48px', height: '48px', borderRadius: '14px',
                            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 6px 16px rgba(245, 158, 11, 0.25)',
                        }}>
                            <Truck size={24} color="#fff" />
                        </div>
                        <div>
                            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>
                                شركات الشحن والتوصيل
                            </h1>
                            <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#64748b' }}>
                                إدارة مزودي خدمات النقل والشحن وربط بوالص الشحن بالفواتير
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={openCreateModal}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '10px 18px', borderRadius: '10px', border: 'none',
                            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                            color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer',
                        }}
                    >
                        <Plus size={16} />
                        إضافة شركة شحن
                    </button>
                </div>

                <div style={{
                    background: '#fff', border: '1px solid #e2e8f0',
                    borderRadius: '16px', overflow: 'hidden',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.02)',
                }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '13px', fontWeight: 700 }}>
                                <th style={{ padding: '14px 20px' }}>شركة الشحن</th>
                                <th style={{ padding: '14px 20px' }}>رقم خدمة العملاء</th>
                                <th style={{ padding: '14px 20px' }}>الحالة</th>
                                <th style={{ padding: '14px 20px', textAlign: 'left' }}>الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {companies.map((c, i) => (
                                <tr key={c.id} style={{
                                    borderBottom: i === companies.length - 1 ? 'none' : '1px solid #f1f5f9',
                                    fontSize: '14px',
                                }}>
                                    <td style={{ padding: '14px 20px', fontWeight: 700, color: '#1e293b' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <Truck size={18} color="#d97706" />
                                            <span>{c.name}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '14px 20px', color: '#64748b' }}>
                                        {c.phone || '—'}
                                    </td>
                                    <td style={{ padding: '14px 20px' }}>
                                        <span style={{
                                            padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
                                            background: c.is_active ? '#ecfdf5' : '#fef2f2',
                                            color: c.is_active ? '#047857' : '#b91c1c',
                                        }}>
                                            {c.is_active ? 'مفعل' : 'معطل'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '14px 20px', textAlign: 'left' }}>
                                        <button
                                            type="button"
                                            onClick={() => openEditModal(c)}
                                            style={{
                                                padding: '6px 12px', borderRadius: '8px', border: '1px solid #cbd5e1',
                                                background: '#fff', color: '#334155', cursor: 'pointer',
                                                fontSize: '12px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px',
                                            }}
                                        >
                                            <Edit2 size={13} />
                                            تعديل
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {companies.length === 0 && (
                                <tr>
                                    <td colSpan="4" style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                                        لا توجد شركات شحن مسجلة حالياً.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
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
                        background: '#fff', borderRadius: '18px', width: '90%', maxWidth: '440px',
                        padding: '24px', boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                                {editingCompany ? 'تعديل شركة الشحن' : 'إضافة شركة شحن جديدة'}
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
                                        اسم الشركة <span style={{ color: '#ef4444' }}>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="مثال: أرامكس، سمسا، سبل"
                                        value={data.name}
                                        onChange={e => setData('name', e.target.value)}
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                                    />
                                    {errors.name && <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0' }}>{errors.name}</p>}
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                        رقم الهاتف / الدعم
                                    </label>
                                    <input
                                        type="text"
                                        value={data.phone}
                                        onChange={e => setData('phone', e.target.value)}
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: '#334155', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={data.is_active}
                                            onChange={e => setData('is_active', e.target.checked)}
                                            style={{ width: '16px', height: '16px', accentColor: '#d97706' }}
                                        />
                                        <span>تفعيل الشركة للعمليات</span>
                                    </label>
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
                                        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                        color: '#fff', fontWeight: 700, fontSize: '14px', cursor: 'pointer',
                                    }}
                                >
                                    {processing ? 'جاري الحفظ...' : 'حفظ البيانات'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
