import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    Building2,
    Save,
    FileText,
    Phone,
    Mail,
    MapPin,
    Hash,
    Calculator,
    CheckCircle2,
} from 'lucide-react';

export default function SettingsBusiness({ business }) {
    const { data, setData, post, processing, errors } = useForm({
        name: business?.name || '',
        name_en: business?.name_en || '',
        tax_number: business?.tax_number || '',
        commercial_register: business?.commercial_register || '',
        phone: business?.phone || '',
        email: business?.email || '',
        address: business?.address || '',
        decimal_places: business?.decimal_places ?? 2,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/settings/business');
    };

    return (
        <AppLayout>
            <Head title="إعدادات الشركة والمنشأة" />

            <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '28px' }}>
                    <div style={{
                        width: '48px', height: '48px', borderRadius: '14px',
                        background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 6px 16px rgba(79, 70, 229, 0.25)',
                    }}>
                        <Building2 size={24} color="#fff" />
                    </div>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>
                            إعدادات المنشأة والنشاط
                        </h1>
                        <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#64748b' }}>
                            بيانات السجل التجاري، الرقم الضريبي، ومعلومات الفواتير المطبوعة
                        </p>
                    </div>
                </div>

                <div style={{
                    background: '#fff', border: '1px solid #e2e8f0',
                    borderRadius: '18px', padding: '32px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                }}>
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                    اسم المنشأة بالعربية <span style={{ color: '#ef4444' }}>*</span>
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
                                    اسم المنشأة بالإنجليزية
                                </label>
                                <input
                                    type="text"
                                    value={data.name_en}
                                    onChange={e => setData('name_en', e.target.value)}
                                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                    الرقم الضريبي (VAT Number)
                                </label>
                                <input
                                    type="text"
                                    value={data.tax_number}
                                    onChange={e => setData('tax_number', e.target.value)}
                                    placeholder="300000000000003"
                                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                    السجل التجاري (CR Number)
                                </label>
                                <input
                                    type="text"
                                    value={data.commercial_register}
                                    onChange={e => setData('commercial_register', e.target.value)}
                                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                    رقم الهاتف / الجوال
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
                                    البريد الإلكتروني
                                </label>
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={e => setData('email', e.target.value)}
                                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                                />
                            </div>

                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                    العنوان الوطني / المقر الرئيسي
                                </label>
                                <input
                                    type="text"
                                    value={data.address}
                                    onChange={e => setData('address', e.target.value)}
                                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                    الخانات العشرية للعملة
                                </label>
                                <select
                                    value={data.decimal_places}
                                    onChange={e => setData('decimal_places', Number(e.target.value))}
                                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', background: '#fff' }}
                                >
                                    <option value={2}>خانتيْن (0.00)</option>
                                    <option value={3}>ثلاث خانات (0.000)</option>
                                    <option value={4}>أربع خانات (0.0000)</option>
                                </select>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                padding: '12px 28px', borderRadius: '10px', border: 'none',
                                background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
                                color: '#fff', fontSize: '15px', fontWeight: 700, cursor: 'pointer',
                            }}
                        >
                            <Save size={18} />
                            {processing ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                        </button>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
