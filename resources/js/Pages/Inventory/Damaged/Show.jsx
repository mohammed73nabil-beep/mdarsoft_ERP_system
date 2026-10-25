import React from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import AppLayout from '../../../Layouts/AppLayout';
import {
    AlertTriangle,
    ArrowRight,
    CheckCircle2,
    Clock,
    Warehouse as WarehouseIcon,
    Calendar,
    DollarSign,
    FileText,
    Barcode
} from 'lucide-react';

export default function Show({ damagedStock }) {
    const { auth } = usePage().props;
    const userPermissions = auth?.user?.permissions || [];
    const isAdmin = auth?.user?.roles?.includes('مدير النظام') || auth?.user?.roles?.includes('admin');
    const canPost = isAdmin || userPermissions.includes('inventory.damaged.post');

    const postForm = useForm({});

    const handlePost = (e) => {
        e.preventDefault();
        if (confirm('هل أنت متأكد من ترحيل إذن التالف؟ لا يمكن التراجع بعد الترحيل وسيتم خصم الكميات وإهلاك السيريالات.')) {
            postForm.post(`/inventory/damaged/${damagedStock.id}/post`);
        }
    };

    return (
        <AppLayout title={`تفاصيل إذن التالف ${damagedStock.reference_number || damagedStock.id}`}>
            <Head title={`إذن تالف ${damagedStock.reference_number || damagedStock.id}`} />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
                        <Link href="/inventory" className="hover:text-white transition">المخازن</Link>
                        <span>/</span>
                        <Link href="/inventory/damaged" className="hover:text-white transition">المخزون التالف</Link>
                        <span>/</span>
                        <span className="text-white font-bold">{damagedStock.reference_number || `#${damagedStock.id}`}</span>
                    </div>
                    <h2 className="text-2xl font-black text-white flex items-center gap-2">
                        <AlertTriangle className="text-rose-500" size={26} />
                        <span>تفاصيل إذن التالف {damagedStock.reference_number}</span>
                    </h2>
                </div>

                <div className="flex items-center gap-2">
                    {damagedStock.status === 'draft' && canPost && (
                        <button
                            type="button"
                            onClick={handlePost}
                            disabled={postForm.processing}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-600/20 transition disabled:opacity-50"
                        >
                            <CheckCircle2 size={18} />
                            <span>ترحيل وإهلاك التالف</span>
                        </button>
                    )}
                    <Link
                        href="/inventory/damaged"
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition"
                    >
                        <ArrowRight size={18} />
                        <span>رجوع للقائمة</span>
                    </Link>
                </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                    <span className="text-xs text-slate-400 block mb-1">حالة المستند</span>
                    {damagedStock.status === 'posted' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 size={14} />
                            <span>مرحّل (مخصوم ومستهلك)</span>
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <Clock size={14} />
                            <span>مسودة (Draft)</span>
                        </span>
                    )}
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                    <span className="text-xs text-slate-400 block mb-1">المستودع</span>
                    <div className="flex items-center gap-2 text-white font-bold text-sm">
                        <WarehouseIcon size={16} className="text-blue-400" />
                        <span>{damagedStock.warehouse?.name || '-'}</span>
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                    <span className="text-xs text-slate-400 block mb-1">تاريخ التسجيل</span>
                    <div className="flex items-center gap-2 text-white font-bold text-sm">
                        <Calendar size={16} className="text-amber-400" />
                        <span>{damagedStock.date}</span>
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                    <span className="text-xs text-slate-400 block mb-1">إجمالي تكلفة التالف</span>
                    <div className="flex items-center gap-1 text-rose-400 font-black text-lg">
                        <span>{Number(damagedStock.total_cost || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        <span className="text-xs font-normal text-slate-400">SAR</span>
                    </div>
                </div>
            </div>

            {damagedStock.notes && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6">
                    <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                        <FileText size={14} />
                        <span>ملاحظات وسبب التلف</span>
                    </div>
                    <p className="text-slate-200 text-sm">{damagedStock.notes}</p>
                </div>
            )}

            {/* Lines Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="p-4 border-b border-slate-800">
                    <h3 className="font-bold text-white text-base">الأصناف التالفة المدرجة</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-right text-sm">
                        <thead className="bg-slate-950/60 text-slate-400 text-xs font-bold border-b border-slate-800">
                            <tr>
                                <th className="p-4">#</th>
                                <th className="p-4">الصنف</th>
                                <th className="p-4">تتبع السيريال</th>
                                <th className="p-4">الكمية</th>
                                <th className="p-4">تكلفة الوحدة</th>
                                <th className="p-4">إجمالي التكلفة</th>
                                <th className="p-4">الأرقام التسلسلية التالفة</th>
                                <th className="p-4">سبب التلف</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-slate-200">
                            {damagedStock.lines?.map((line, idx) => (
                                <tr key={line.id || idx} className="hover:bg-slate-800/30">
                                    <td className="p-4 text-slate-500 font-mono">{idx + 1}</td>
                                    <td className="p-4">
                                        <div className="font-bold text-white">{line.product?.name}</div>
                                        <div className="text-xs text-slate-400 font-mono">{line.product?.sku}</div>
                                    </td>
                                    <td className="p-4">
                                        {line.product?.tracking_type === 'serial' ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                                <Barcode size={12} />
                                                سيريال
                                            </span>
                                        ) : (
                                            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-800 text-slate-400">
                                                كمية
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4 font-mono font-bold text-white">{line.quantity}</td>
                                    <td className="p-4 font-mono">
                                        {Number(line.unit_cost || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} SAR
                                    </td>
                                    <td className="p-4 font-mono font-bold text-rose-400">
                                        {Number(line.total_cost || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} SAR
                                    </td>
                                    <td className="p-4">
                                        {line.serials && line.serials.length > 0 ? (
                                            <div className="flex flex-wrap gap-1 max-w-xs">
                                                {line.serials.map((s, sIdx) => (
                                                    <span key={sIdx} className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-mono">
                                                        {s.serial_number || s}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-slate-500 text-xs">-</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-xs text-slate-400">{line.notes || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
