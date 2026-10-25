import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    Shield,
    CheckCircle2,
    Lock,
    Plus,
    Edit2,
    X,
    Users,
} from 'lucide-react';

export default function UsersRoles({
    roles = [],
    permissions = [],
    groupedPermissions = {},
}) {
    const [selectedRole, setSelectedRole] = useState(roles[0] || null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const { data, setData, post, processing, reset } = useForm({
        role_id: roles[0]?.id || '',
        name: roles[0]?.name || '',
        permissions: roles[0]?.permissions?.map(p => p.name) || [],
    });

    const handleSelectRole = (role) => {
        setSelectedRole(role);
        setData({
            role_id: role.id,
            name: role.name,
            permissions: role.permissions?.map(p => p.name) || [],
        });
    };

    const togglePermission = (permName) => {
        let perms = [...data.permissions];
        if (perms.includes(permName)) {
            perms = perms.filter(p => p !== permName);
        } else {
            perms.push(permName);
        }
        setData('permissions', perms);
    };

    const toggleModuleAll = (modulePerms) => {
        const names = modulePerms.map(p => p.name);
        const allSelected = names.every(n => data.permissions.includes(n));
        let perms = [...data.permissions];
        if (allSelected) {
            perms = perms.filter(p => !names.includes(p));
        } else {
            names.forEach(n => {
                if (!perms.includes(n)) perms.push(n);
            });
        }
        setData('permissions', perms);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/users/roles', {
            onSuccess: () => {
                setIsCreateModalOpen(false);
            },
        });
    };

    return (
        <AppLayout>
            <Head title="الأدوار والصلاحيات" />

            <div style={{ padding: '24px', maxWidth: '1280px', margin: '0 auto' }}>
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginBottom: '28px',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{
                            width: '48px', height: '48px', borderRadius: '14px',
                            background: 'linear-gradient(135deg, #0ea5e9, #38bdf8)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 6px 16px rgba(14, 165, 233, 0.25)',
                        }}>
                            <Shield size={24} color="#fff" />
                        </div>
                        <div>
                            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>
                                الأدوار والصلاحيات (RBAC)
                            </h1>
                            <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#64748b' }}>
                                إدارة مصفوفة الصلاحيات وتخصيص صلاحيات الوصول حسب الدور الوظيفي
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            setSelectedRole(null);
                            setData({ role_id: '', name: '', permissions: [] });
                            setIsCreateModalOpen(true);
                        }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '10px 18px', borderRadius: '10px', border: 'none',
                            background: '#0f172a', color: '#fff', fontSize: '14px',
                            fontWeight: 700, cursor: 'pointer',
                        }}
                    >
                        <Plus size={16} />
                        إضافة دور جديد
                    </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px', alignItems: 'start' }}>
                    {/* Roles List */}
                    <div style={{
                        background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px',
                        padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                    }}>
                        <h3 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: 700, color: '#334155' }}>
                            قائمة الأدوار المعتمدة
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {roles.map(r => {
                                const isSelected = selectedRole?.id === r.id;
                                return (
                                    <div
                                        key={r.id}
                                        onClick={() => handleSelectRole(r)}
                                        style={{
                                            padding: '12px 14px', borderRadius: '10px',
                                            border: '2px solid',
                                            borderColor: isSelected ? '#0ea5e9' : '#f1f5f9',
                                            background: isSelected ? '#f0f9ff' : '#fff',
                                            cursor: 'pointer', display: 'flex',
                                            justifyContent: 'space-between', alignItems: 'center',
                                        }}
                                    >
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: '14px', color: '#1e293b' }}>
                                                {r.name}
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                                                {r.permissions?.length || 0} صلاحية
                                            </div>
                                        </div>
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: '4px',
                                            fontSize: '12px', color: '#94a3b8',
                                        }}>
                                            <Users size={14} />
                                            {r.users_count || 0}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Permissions Matrix */}
                    <div style={{
                        background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px',
                        padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                    }}>
                        <form onSubmit={handleSubmit}>
                            <div style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #e2e8f0',
                            }}>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                                        صلاحيات: {data.name || 'دور جديد'}
                                    </h2>
                                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
                                        تم منح {data.permissions.length} من أصل {permissions.length} صلاحية
                                    </p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={processing}
                                    style={{
                                        padding: '10px 24px', borderRadius: '10px', border: 'none',
                                        background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                                        color: '#fff', fontWeight: 700, fontSize: '14px',
                                        cursor: processing ? 'not-allowed' : 'pointer',
                                    }}
                                >
                                    {processing ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                                </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {Object.entries(groupedPermissions).map(([mod, perms]) => {
                                    const allChecked = perms.every(p => data.permissions.includes(p.name));
                                    return (
                                        <div key={mod} style={{
                                            border: '1px solid #e2e8f0', borderRadius: '12px',
                                            padding: '16px', background: '#f8fafc',
                                        }}>
                                            <div style={{
                                                display: 'flex', justifyContent: 'space-between',
                                                alignItems: 'center', marginBottom: '12px',
                                            }}>
                                                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>
                                                    موديول: {mod.toUpperCase()}
                                                </h4>
                                                <button
                                                    type="button"
                                                    onClick={() => toggleModuleAll(perms)}
                                                    style={{
                                                        fontSize: '12px', color: '#0284c7', background: 'transparent',
                                                        border: 'none', cursor: 'pointer', fontWeight: 600,
                                                    }}
                                                >
                                                    {allChecked ? 'إلغاء تحديد الكل' : 'تحديد كل المجموعة'}
                                                </button>
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
                                                {perms.map(p => {
                                                    const isChecked = data.permissions.includes(p.name);
                                                    return (
                                                        <label
                                                            key={p.id}
                                                            style={{
                                                                display: 'flex', alignItems: 'center', gap: '8px',
                                                                fontSize: '13px', color: '#334155', cursor: 'pointer',
                                                                background: '#fff', padding: '8px 10px', borderRadius: '6px',
                                                                border: '1px solid #e2e8f0',
                                                            }}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={isChecked}
                                                                onChange={() => togglePermission(p.name)}
                                                                style={{ width: '16px', height: '16px', accentColor: '#0ea5e9' }}
                                                            />
                                                            <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{p.name}</span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
