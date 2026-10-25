import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    Users,
    UserPlus,
    Search,
    Shield,
    Building2,
    Mail,
    CheckCircle2,
    XCircle,
    Edit2,
    X,
    Filter,
    Key,
    Phone,
} from 'lucide-react';

export default function UsersIndex({
    users,
    roles = [],
    branches = [],
    filters = {},
}) {
    const [search, setSearch] = useState(filters.search || '');
    const [branchFilter, setBranchFilter] = useState(filters.branch_id || '');
    const [roleFilter, setRoleFilter] = useState(filters.role || '');

    // Modal state for create/edit
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        branch_id: '',
        role: roles[0]?.name || '',
        is_active: true,
    });

    const handleFilter = (e) => {
        e.preventDefault();
        router.get('/users/list', {
            search,
            branch_id: branchFilter,
            role: roleFilter,
        }, { preserveState: true });
    };

    const openCreateModal = () => {
        setEditingUser(null);
        reset();
        setData({
            name: '',
            email: '',
            password: '',
            branch_id: branches[0]?.id || '',
            role: roles[0]?.name || '',
            is_active: true,
        });
        setIsModalOpen(true);
    };

    const openEditModal = (user) => {
        setEditingUser(user);
        setData({
            name: user.name,
            email: user.email,
            password: '',
            branch_id: user.branch_id || '',
            role: user.roles[0]?.name || '',
            is_active: user.is_active,
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingUser) {
            put(`/users/${editingUser.id}`, {
                onSuccess: () => setIsModalOpen(false),
            });
        } else {
            post('/users', {
                onSuccess: () => setIsModalOpen(false),
            });
        }
    };

    const toggleActive = (user) => {
        if (confirm(`هل أنت متأكد من تغيير حالة تفعيل المستخدم "${user.name}"؟`)) {
            router.post(`/users/${user.id}/toggle-active`);
        }
    };

    return (
        <AppLayout>
            <Head title="إدارة المستخدمين" />

            <div style={{ padding: '24px', maxWidth: '1280px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginBottom: '28px', flexWrap: 'wrap', gap: '16px',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{
                            width: '48px', height: '48px', borderRadius: '14px',
                            background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 6px 16px rgba(79, 70, 229, 0.25)',
                        }}>
                            <Users size={24} color="#fff" />
                        </div>
                        <div>
                            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>
                                إدارة المستخدمين
                            </h1>
                            <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#64748b' }}>
                                التحكم بحسابات مستخدمي النظام، الفروع، وتعيين الصلاحيات
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={openCreateModal}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '10px 20px', borderRadius: '10px', border: 'none',
                            background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
                            color: '#fff', fontSize: '14px', fontWeight: 700,
                            cursor: 'pointer', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
                        }}
                    >
                        <UserPlus size={18} />
                        إضافة مستخدم جديد
                    </button>
                </div>

                {/* Filters */}
                <form onSubmit={handleFilter} style={{
                    background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px',
                    padding: '16px 20px', marginBottom: '24px', display: 'flex',
                    alignItems: 'center', gap: '12px', flexWrap: 'wrap',
                }}>
                    <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="ابحث بالاسم أو البريد..."
                            style={{
                                width: '100%', padding: '9px 12px 9px 36px', borderRadius: '8px',
                                border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box',
                            }}
                        />
                        <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                    </div>

                    <select
                        value={branchFilter}
                        onChange={e => setBranchFilter(e.target.value)}
                        style={{
                            padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1',
                            fontSize: '13px', background: '#fff', minWidth: '160px',
                        }}
                    >
                        <option value="">جميع الفروع</option>
                        {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>

                    <select
                        value={roleFilter}
                        onChange={e => setRoleFilter(e.target.value)}
                        style={{
                            padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1',
                            fontSize: '13px', background: '#fff', minWidth: '150px',
                        }}
                    >
                        <option value="">جميع الأدوار</option>
                        {roles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                    </select>

                    <button
                        type="submit"
                        style={{
                            padding: '9px 18px', borderRadius: '8px', border: 'none',
                            background: '#0f172a', color: '#fff', fontSize: '13px',
                            fontWeight: 600, cursor: 'pointer', display: 'flex',
                            alignItems: 'center', gap: '6px',
                        }}
                    >
                        <Filter size={14} />
                        تصفية
                    </button>
                </form>

                {/* Users Table */}
                <div style={{
                    background: '#fff', border: '1px solid #e2e8f0',
                    borderRadius: '16px', overflow: 'hidden',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.02)',
                }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '13px', fontWeight: 700 }}>
                                <th style={{ padding: '14px 20px' }}>المستخدم</th>
                                <th style={{ padding: '14px 20px' }}>البريد الإلكتروني</th>
                                <th style={{ padding: '14px 20px' }}>الدور والصلاحية</th>
                                <th style={{ padding: '14px 20px' }}>الفرع</th>
                                <th style={{ padding: '14px 20px' }}>الحالة</th>
                                <th style={{ padding: '14px 20px', textAlign: 'left' }}>الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(users.data || []).map((u, i) => (
                                <tr key={u.id} style={{
                                    borderBottom: i === users.data.length - 1 ? 'none' : '1px solid #f1f5f9',
                                    fontSize: '14px',
                                }}>
                                    <td style={{ padding: '14px 20px', fontWeight: 700, color: '#1e293b' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{
                                                width: '36px', height: '36px', borderRadius: '10px',
                                                background: '#eef2ff', color: '#4f46e5',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontWeight: 800, fontSize: '14px',
                                            }}>
                                                {u.name.substring(0, 2)}
                                            </div>
                                            <span>{u.name}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '14px 20px', color: '#64748b' }}>
                                        {u.email}
                                    </td>
                                    <td style={{ padding: '14px 20px' }}>
                                        <span style={{
                                            padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700,
                                            background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0',
                                        }}>
                                            {u.roles[0]?.name || 'مستخدم عادي'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '14px 20px', color: '#475569', fontWeight: 500 }}>
                                        {u.branch?.name || 'كافة الفروع (عام)'}
                                    </td>
                                    <td style={{ padding: '14px 20px' }}>
                                        <span style={{
                                            padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
                                            background: u.is_active ? '#ecfdf5' : '#fef2f2',
                                            color: u.is_active ? '#047857' : '#b91c1c',
                                        }}>
                                            {u.is_active ? 'نشط' : 'معطل'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '14px 20px', textAlign: 'left' }}>
                                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                                            <button
                                                type="button"
                                                onClick={() => openEditModal(u)}
                                                style={{
                                                    padding: '6px 10px', borderRadius: '8px', border: '1px solid #cbd5e1',
                                                    background: '#fff', color: '#334155', cursor: 'pointer',
                                                    fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px',
                                                }}
                                            >
                                                <Edit2 size={13} />
                                                تعديل
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => toggleActive(u)}
                                                style={{
                                                    padding: '6px 10px', borderRadius: '8px', border: 'none',
                                                    background: u.is_active ? '#fee2e2' : '#dcfce7',
                                                    color: u.is_active ? '#b91c1c' : '#15803d',
                                                    cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                                                }}
                                            >
                                                {u.is_active ? 'تعطيل' : 'تفعيل'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
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
                        background: '#fff', borderRadius: '18px', width: '90%', maxWidth: '520px',
                        padding: '24px', boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                                {editingUser ? 'تعديل بيانات المستخدم' : 'إضافة مستخدم جديد'}
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
                                        الاسم الكامل <span style={{ color: '#ef4444' }}>*</span>
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
                                        البريد الإلكتروني <span style={{ color: '#ef4444' }}>*</span>
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={data.email}
                                        onChange={e => setData('email', e.target.value)}
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                                    />
                                    {errors.email && <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0' }}>{errors.email}</p>}
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                        كلمة المرور {editingUser ? '(اتركها فارغة للإبقاء على الحالية)' : <span style={{ color: '#ef4444' }}>*</span>}
                                    </label>
                                    <input
                                        type="password"
                                        required={!editingUser}
                                        value={data.password}
                                        onChange={e => setData('password', e.target.value)}
                                        placeholder={editingUser ? '••••••••' : ''}
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                                    />
                                    {errors.password && <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0' }}>{errors.password}</p>}
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                            الدور / الصلاحية <span style={{ color: '#ef4444' }}>*</span>
                                        </label>
                                        <select
                                            value={data.role}
                                            onChange={e => setData('role', e.target.value)}
                                            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', background: '#fff' }}
                                        >
                                            {roles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                                        </select>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                            الفرع التابع له
                                        </label>
                                        <select
                                            value={data.branch_id}
                                            onChange={e => setData('branch_id', e.target.value)}
                                            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', background: '#fff' }}
                                        >
                                            <option value="">كافة الفروع (عام)</option>
                                            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                        </select>
                                    </div>
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
                                        background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
                                        color: '#fff', fontWeight: 700, fontSize: '14px', cursor: 'pointer',
                                    }}
                                >
                                    {processing ? 'جاري الحفظ...' : (editingUser ? 'تحديث البيانات' : 'حفظ المستخدم')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
