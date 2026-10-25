import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    Briefcase,
    Plus,
    Edit2,
    Phone,
    Percent,
    UserCheck,
    X,
    User,
} from 'lucide-react';

export default function UsersRepresentatives({
    representatives,
    users = [],
}) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRep, setEditingRep] = useState(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        id: '',
        user_id: '',
        name: '',
        phone: '',
        commission_rate: '0',
        is_active: true,
    });

    const openCreateModal = () => {
        setEditingRep(null);
        reset();
        setData({
            id: '',
            user_id: '',
            name: '',
            phone: '',
            commission_rate: '0',
            is_active: true,
        });
        setIsModalOpen(true);
    };

    const openEditModal = (rep) => {
        setEditingRep(rep);
        setData({
            id: rep.id,
            user_id: rep.user_id || '',
            name: rep.name,
            phone: rep.phone || '',
            commission_rate: String(rep.commission_rate || 0),
            is_active: rep.is_active,
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/users/representatives', {
            onSuccess: () => setIsModalOpen(false),
        });
    };

    return (
        <AppLayout>
            <Head title="إدارة المناديب" />

            <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginBottom: '28px',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{
                            width: '48px', height: '48px', borderRadius: '14px',
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 6px 16px rgba(16, 185, 129, 0.25)',
                        }}>
                            <Briefcase size={24} color="#fff" />
                        </div>
                        <div>
                            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>
                                إدارة مناديب المبيعات
                            </h1>
                            <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#64748b' }}>
                                تحديد نسب العمولة وربط المناديب بحسابات المستخدمين والفروع
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={openCreateModal}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '10px 18px', borderRadius: '10px', border: 'none',
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer',
                        }}
                    >
                        <Plus size={16} />
                        إضافة مندوب جديد
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
                                <th style={{ padding: '14px 20px' }}>اسم المندوب</th>
                                <th style={{ padding: '14px 20px' }}>رقم الجوال</th>
                                <th style={{ padding: '14px 20px' }}>الحساب المرتبط</th>
                                <th style={{ padding: '14px 20px' }}>الفرع</th>
                                <th style={{ padding: '14px 20px' }}>نسبة العمولة</th>
                                <th style={{ padding: '14px 20px' }}>الحالة</th>
                                <th style={{ padding: '14px 20px', textAlign: 'left' }}>الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(representatives.data || []).map((rep, i) => (
                                <tr key={rep.id} style={{
                                    borderBottom: i === representatives.data.length - 1 ? 'none' : '1px solid #f1f5f9',
                                    fontSize: '14px',
                                }}>
                                    <td style={{ padding: '14px 20px', fontWeight: 700, color: '#1e293b' }}>
                                        {rep.name}
                                    </td>
                                    <td style={{ padding: '14px 20px', color: '#64748b' }}>
                                        {rep.phone || '—'}
                                    </td>
                                    <td style={{ padding: '14px 20px', color: '#475569' }}>
                                        {rep.user?.name ? (
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                <User size={14} color="#6366f1" />
                                                {rep.user.name}
                                            </span>
                                        ) : '—'}
                                    </td>
                                    <td style={{ padding: '14px 20px', color: '#64748b' }}>
                                        {rep.user?.branch?.name || 'عام'}
                                    </td>
                                    <td style={{ padding: '14px 20px', fontWeight: 700, color: '#059669' }}>
                                        {Number(rep.commission_rate).toFixed(2)}%
                                    </td>
                                    <td style={{ padding: '14px 20px' }}>
                                        <span style={{
                                            padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
                                            background: rep.is_active ? '#ecfdf5' : '#fef2f2',
                                            color: rep.is_active ? '#047857' : '#b91c1c',
                                        }}>
                                            {rep.is_active ? 'نشط' : 'معطل'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '14px 20px', textAlign: 'left' }}>
                                        <button
                                            type="button"
                                            onClick={() => openEditModal(rep)}
                                            style={{
                                                padding: '6px 10px', borderRadius: '8px', border: '1px solid #cbd5e1',
                                                background: '#fff', color: '#334155', cursor: 'pointer',
                                                fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px',
                                            }}
                                        >
                                            <Edit2 size={13} />
                                            تعديل
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {representatives.data?.length === 0 && (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                                        لا يوجد مناديب مسجلين حالياً.
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
                        background: '#fff', borderRadius: '18px', width: '90%', maxWidth: '480px',
                        padding: '24px', boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                                {editingRep ? 'تعديل بيانات المندوب' : 'إضافة مندوب جديد'}
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
                                        اسم المندوب <span style={{ color: '#ef4444' }}>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={data.name}
                                        onChange={e => setData('name', e.target.value)}
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                                    />
                                    {errors.name && <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0' }}>{errors.name}</p>}
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                        رقم الجوال
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
                                        ربط بحساب مستخدم (اختياري)
                                    </label>
                                    <select
                                        value={data.user_id}
                                        onChange={e => setData('user_id', e.target.value)}
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', background: '#fff' }}
                                    >
                                        <option value="">بدون ربط بمستخدم</option>
                                        {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                        نسبة العمولة (%) <span style={{ color: '#ef4444' }}>*</span>
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="100"
                                        required
                                        value={data.commission_rate}
                                        onChange={e => setData('commission_rate', e.target.value)}
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
                                        background: 'linear-gradient(135deg, #10b981, #059669)',
                                        color: '#fff', fontWeight: 700, fontSize: '14px', cursor: 'pointer',
                                    }}
                                >
                                    {processing ? 'جاري الحفظ...' : 'حفظ المندوب'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
