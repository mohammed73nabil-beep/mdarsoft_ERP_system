import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    Percent,
    Plus,
    Edit2,
    X,
    CheckCircle2,
    Receipt,
} from 'lucide-react';

export default function SettingsTaxRates({ taxes = [] }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTax, setEditingTax] = useState(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        id: '',
        name: '',
        rate: '',
        type: 'percentage',
        tax_type: 'vat_output',
        is_active: true,
    });

    const openCreateModal = () => {
        setEditingTax(null);
        reset();
        setData({ id: '', name: '', rate: '', type: 'percentage', tax_type: 'vat_output', is_active: true });
        setIsModalOpen(true);
    };

    const openEditModal = (tax) => {
        setEditingTax(tax);
        setData({
            id: tax.id,
            name: tax.name,
            rate: String(tax.rate),
            type: tax.type,
            tax_type: tax.tax_type || 'vat_output',
            is_active: tax.is_active,
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/settings/tax-rates', {
            onSuccess: () => setIsModalOpen(false),
        });
    };

    return (
        <AppLayout>
            <Head title="معدلات الضرائب" />

            <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
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
                            <Percent size={24} color="#fff" />
                        </div>
                        <div>
                            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>
                                معدلات الضرائب (Taxes)
                            </h1>
                            <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#64748b' }}>
                                تهيئة ضريبة القيمة المضافة ومعدلات الضرائب المطبقة على المبيعات والمشتريات
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
                        إضافة معدل ضريبة
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
                                <th style={{ padding: '14px 20px' }}>مسمى الضريبة</th>
                                <th style={{ padding: '14px 20px' }}>النسبة / القيمة</th>
                                <th style={{ padding: '14px 20px' }}>النوع</th>
                                <th style={{ padding: '14px 20px' }}>الحالة</th>
                                <th style={{ padding: '14px 20px', textAlign: 'left' }}>الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {taxes.map((t, i) => (
                                <tr key={t.id} style={{
                                    borderBottom: i === taxes.length - 1 ? 'none' : '1px solid #f1f5f9',
                                    fontSize: '14px',
                                }}>
                                    <td style={{ padding: '14px 20px', fontWeight: 700, color: '#1e293b' }}>
                                        {t.name}
                                    </td>
                                    <td style={{ padding: '14px 20px', fontWeight: 800, color: '#059669', fontSize: '15px' }}>
                                        {Number(t.rate).toFixed(2)}%
                                    </td>
                                    <td style={{ padding: '14px 20px', color: '#64748b' }}>
                                        {t.type === 'percentage' ? 'نسبة مئوية' : 'مبلغ ثابت'}
                                    </td>
                                    <td style={{ padding: '14px 20px' }}>
                                        <span style={{
                                            padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
                                            background: t.is_active ? '#ecfdf5' : '#fef2f2',
                                            color: t.is_active ? '#047857' : '#b91c1c',
                                        }}>
                                            {t.is_active ? 'نشط' : 'معطل'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '14px 20px', textAlign: 'left' }}>
                                        <button
                                            type="button"
                                            onClick={() => openEditModal(t)}
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
                                {editingTax ? 'تعديل معدل الضريبة' : 'إضافة معدل ضريبة جديد'}
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
                                        مسمى الضريبة <span style={{ color: '#ef4444' }}>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="مثال: ضريبة القيمة المضافة 15%"
                                        value={data.name}
                                        onChange={e => setData('name', e.target.value)}
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                                    />
                                    {errors.name && <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0' }}>{errors.name}</p>}
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                        النسبة المئوية (%) <span style={{ color: '#ef4444' }}>*</span>
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="100"
                                        required
                                        placeholder="15.00"
                                        value={data.rate}
                                        onChange={e => setData('rate', e.target.value)}
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                                    />
                                    {errors.rate && <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0' }}>{errors.rate}</p>}
                                </div>

                                <div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: '#334155', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={data.is_active}
                                            onChange={e => setData('is_active', e.target.checked)}
                                            style={{ width: '16px', height: '16px', accentColor: '#10b981' }}
                                        />
                                        <span>تفعيل الضريبة للفواتير</span>
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
                                        background: 'linear-gradient(135deg, #10b981, #059669)',
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
