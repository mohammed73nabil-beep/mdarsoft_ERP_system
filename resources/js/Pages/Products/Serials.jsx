import React, { useState } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import {
    Smartphone,
    Search,
    Filter,
    Plus,
    History,
    RefreshCw,
    X,
    CheckCircle,
    AlertCircle,
    ArrowRight,
    Warehouse,
    Package,
    RotateCcw
} from 'lucide-react';

export default function Serials({ serials, filters, products, warehouses, statuses }) {
    const { auth, flash } = usePage().props;
    const userPermissions = auth?.user?.permissions || [];
    const isAdmin = auth?.user?.roles?.includes('مدير النظام') || auth?.user?.roles?.includes('admin');
    const canAcceptReturn = isAdmin || userPermissions.includes('serials.accept_return');

    const [search, setSearch] = useState(filters?.search || '');
    const [productId, setProductId] = useState(filters?.product_id || '');
    const [warehouseId, setWarehouseId] = useState(filters?.warehouse_id || '');
    const [status, setStatus] = useState(filters?.status || '');

    // Modals
    const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
    const [selectedSerialForEvents, setSelectedSerialForEvents] = useState(null);
    const [transitionSerial, setTransitionSerial] = useState(null);

    // Batch Entry Form
    const batchForm = useForm({
        product_id: products?.[0]?.id || '',
        warehouse_id: warehouses?.[0]?.id || '',
        serials_text: '', // Paste text: serial, imei1, imei2, cost (each line)
        serials: [],
    });

    // Status transition form
    const transitionForm = useForm({
        to_status: '',
        warehouse_id: '',
        notes: '',
    });

    const applyFilters = () => {
        router.get('/products/serials', {
            search,
            product_id: productId,
            warehouse_id: warehouseId,
            status,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleBatchSubmit = (e) => {
        e.preventDefault();
        // Parse lines
        const lines = batchForm.data.serials_text.trim().split('\n');
        const parsed = [];

        lines.forEach((line) => {
            const trimmed = line.trim();
            if (!trimmed) return;
            // Split by comma or tab or space
            const parts = trimmed.split(/[\t,;]+/).map((p) => p.trim());
            parsed.push({
                serial_number: parts[0] || '',
                imei1: parts[1] || null,
                imei2: parts[2] || null,
                cost_price: parts[3] ? parseFloat(parts[3]) : null,
            });
        });

        if (parsed.length === 0) {
            alert('يرجى إدخال رقم تسلسلي واحد على الأقل.');
            return;
        }

        router.post('/products/serials/batch', {
            product_id: batchForm.data.product_id,
            warehouse_id: batchForm.data.warehouse_id,
            serials: parsed,
        }, {
            onSuccess: () => {
                setIsBatchModalOpen(false);
                batchForm.reset();
            },
        });
    };

    const handleTransitionSubmit = (e) => {
        e.preventDefault();
        if (!transitionSerial) return;

        transitionForm.post(`/products/serials/${transitionSerial.id}/transition`, {
            onSuccess: () => {
                setTransitionSerial(null);
                transitionForm.reset();
            },
        });
    };

    return (
        <AppLayout title="تتبع الأرقام التسلسلية (IMEI / Serials)">
            <Head title="تتبع السيريال و IMEI" />

            {/* Flash Messages */}
            {flash?.success && (
                <div className="mb-4 p-4 rounded-xl bg-emerald-950/70 border border-emerald-800 text-emerald-200 text-sm font-bold flex items-center justify-between">
                    <span>{flash.success}</span>
                </div>
            )}
            {flash?.error && (
                <div className="mb-4 p-4 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-200 text-sm font-bold flex items-center justify-between">
                    <span>{flash.error}</span>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-black text-white flex items-center gap-2">
                        <Smartphone className="text-cyan-400" size={26} />
                        <span>تتبع الأرقام التسلسلية وأجهزة IMEI</span>
                    </h2>
                    <p className="text-sm text-slate-400 mt-1">
                        إدارة دورة حياة الجهاز الذكي (in_stock, sold, returned, damaged, transferred) وسجل الأحداث
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsBatchModalOpen(true)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm shadow-lg shadow-cyan-600/30 transition"
                    >
                        <Plus size={18} />
                        <span>إدخال دفعة أجهزة جديدة</span>
                    </button>
                    <Link
                        href="/products"
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition border border-slate-700"
                    >
                        <ArrowRight size={16} />
                        <span>قائمة المنتجات</span>
                    </Link>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6 shadow-xl space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    <div className="relative">
                        <Search className="absolute right-3.5 top-3 text-slate-500" size={16} />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                            placeholder="ابحث برقم السيريال أو IMEI..."
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-10 pl-3 py-2.5 text-sm text-white placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-500"
                        />
                    </div>

                    <div>
                        <select
                            value={productId}
                            onChange={(e) => setProductId(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                        >
                            <option value="">كل المنتجات المتتبعة</option>
                            {products.map((p) => (
                                <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <select
                            value={warehouseId}
                            onChange={(e) => setWarehouseId(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                        >
                            <option value="">كل المستودعات</option>
                            {warehouses.map((w) => (
                                <option key={w.id} value={w.id}>{w.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                        >
                            <option value="">كل الحالات</option>
                            {statuses.map((s) => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={applyFilters}
                            className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2.5 rounded-xl text-sm transition"
                        >
                            تصفية
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setSearch('');
                                setProductId('');
                                setWarehouseId('');
                                setStatus('');
                                router.get('/products/serials');
                            }}
                            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
                            title="إعادة ضبط"
                        >
                            <RotateCcw size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Serials Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden mb-6">
                <div className="overflow-x-auto">
                    <table className="w-full text-right text-sm">
                        <thead className="bg-slate-950/80 text-slate-400 font-bold border-b border-slate-800">
                            <tr>
                                <th className="py-3.5 px-4">رقم السيريال (Serial)</th>
                                <th className="py-3.5 px-4">IMEI 1</th>
                                <th className="py-3.5 px-4">IMEI 2</th>
                                <th className="py-3.5 px-4">اسم المنتج</th>
                                <th className="py-3.5 px-4">المستودع الحالي</th>
                                <th className="py-3.5 px-4">التكلفة</th>
                                <th className="py-3.5 px-4 text-center">الحالة</th>
                                <th className="py-3.5 px-4 text-left">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                            {serials.data && serials.data.length > 0 ? (
                                serials.data.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-800/40 transition">
                                        <td className="py-3 px-4 font-mono font-bold text-white text-sm">
                                            {item.serial_number}
                                        </td>
                                        <td className="py-3 px-4 font-mono text-slate-300 text-sm">
                                            {item.imei1 || '—'}
                                        </td>
                                        <td className="py-3 px-4 font-mono text-slate-400 text-sm">
                                            {item.imei2 || '—'}
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="font-bold text-white text-sm">{item.product?.name}</div>
                                            <div className="font-mono text-slate-500 text-sm">{item.product?.sku}</div>
                                        </td>
                                        <td className="py-3 px-4 text-slate-300 text-sm">
                                            {item.warehouse?.name || '—'}
                                        </td>
                                        <td className="py-3 px-4 font-mono text-slate-200 text-sm">
                                            {Number(item.cost_price).toFixed(2)} ر.س
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <span className={`px-2.5 py-1 rounded-full text-sm font-bold border ${
                                                item.status === 'in_stock'
                                                    ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40'
                                                    : item.status === 'sold'
                                                    ? 'bg-blue-950/60 text-blue-400 border-blue-800/40'
                                                    : item.status === 'damaged'
                                                    ? 'bg-rose-950/60 text-rose-400 border-rose-800/40'
                                                    : item.status === 'returned'
                                                    ? 'bg-amber-950/60 text-amber-400 border-amber-800/40'
                                                    : item.status === 'transferred'
                                                    ? 'bg-purple-950/60 text-purple-400 border-purple-800/40'
                                                    : 'bg-slate-800 text-slate-300 border-slate-700'
                                            }`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-left">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    onClick={() => setSelectedSerialForEvents(item)}
                                                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 transition"
                                                    title="عرض سجل الحركات (Timeline)"
                                                >
                                                    <History size={16} />
                                                </button>

                                                <button
                                                    onClick={() => {
                                                        setTransitionSerial(item);
                                                        transitionForm.setData({
                                                            to_status: '',
                                                            warehouse_id: item.warehouse_id,
                                                            notes: '',
                                                        });
                                                    }}
                                                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 transition"
                                                    title="تغيير حالة السيريال"
                                                >
                                                    <RefreshCw size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={8} className="py-12 text-center text-slate-500 text-sm">
                                        لا توجد أجهزة مطابقة لخيارات البحث.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {serials.links && serials.links.length > 3 && (
                    <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between">
                        <div className="text-sm text-slate-400">
                            عرض {serials.from || 0} إلى {serials.to || 0} من أصل {serials.total || 0} جهاز
                        </div>
                        <div className="flex items-center gap-1">
                            {serials.links.map((link, idx) => (
                                <Link
                                    key={idx}
                                    href={link.url || '#'}
                                    preserveScroll
                                    className={`px-3 py-1.5 rounded-lg text-sm font-bold transition ${
                                        link.active
                                            ? 'bg-cyan-600 text-white'
                                            : !link.url
                                            ? 'text-slate-600 cursor-not-allowed'
                                            : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal: Batch Entry */}
            {isBatchModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl relative">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Plus className="text-cyan-400" size={20} />
                                <span>إدخال دفعة أجهزة / سيريال معاً</span>
                            </h3>
                            <button
                                onClick={() => setIsBatchModalOpen(false)}
                                className="text-slate-400 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleBatchSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-300 mb-1">المنتج المتتبع</label>
                                    <select
                                        required
                                        value={batchForm.data.product_id}
                                        onChange={(e) => batchForm.setData('product_id', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                                    >
                                        {products.map((p) => (
                                            <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-300 mb-1">المستودع المستلم</label>
                                    <select
                                        required
                                        value={batchForm.data.warehouse_id}
                                        onChange={(e) => batchForm.setData('warehouse_id', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                                    >
                                        {warehouses.map((w) => (
                                            <option key={w.id} value={w.id}>{w.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="text-sm font-bold text-slate-300">
                                        بيانات الأجهزة (سطر لكل جهاز)
                                    </label>
                                    <span className="text-sm text-slate-400">التنسيق: Serial, IMEI1, IMEI2, Cost</span>
                                </div>
                                <textarea
                                    rows={6}
                                    required
                                    value={batchForm.data.serials_text}
                                    onChange={(e) => batchForm.setData('serials_text', e.target.value)}
                                    placeholder="SN10001, 356789012345671, 356789012345672, 1200&#10;SN10002, 356789012345673, 356789012345674, 1200&#10;SN10003"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white font-mono placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                                />
                                <p className="text-sm text-slate-400 mt-1">
                                    يمكنك لصق عدة أسطر مباشرة من Excel أو ماسح الباركود. يتم التحقق من عدم تكرار أي رقم ورفض الدفعة كاملة إذا وُجد تكرار (معاملة ذرية).
                                </p>
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setIsBatchModalOpen(false)}
                                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-bold transition"
                                >
                                    إلغاء
                                </button>
                                <button
                                    type="submit"
                                    disabled={batchForm.processing}
                                    className="px-6 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold shadow-lg shadow-cyan-600/30 transition disabled:opacity-50"
                                >
                                    {batchForm.processing ? 'جارِ الإدخال...' : 'حفظ الدفعة وتحديث المخزون'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Events History Timeline */}
            {selectedSerialForEvents && (
                <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative max-h-[85vh] overflow-y-auto">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                                <History className="text-cyan-400" size={18} />
                                <span>سجل حركات الجهاز: {selectedSerialForEvents.serial_number}</span>
                            </h3>
                            <button
                                onClick={() => setSelectedSerialForEvents(null)}
                                className="text-slate-400 hover:text-white"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-3">
                            {selectedSerialForEvents.events && selectedSerialForEvents.events.length > 0 ? (
                                selectedSerialForEvents.events.map((ev) => (
                                    <div key={ev.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-sm">
                                        <div className="flex items-center justify-between font-bold text-white mb-1">
                                            <span>{ev.event_type}</span>
                                            <span className="text-sm font-normal text-slate-400">{ev.created_at}</span>
                                        </div>
                                        <div className="text-sm text-slate-300">
                                            من: <span className="font-mono text-amber-400">{ev.from_status || 'البداية'}</span> إلى:{' '}
                                            <span className="font-mono text-emerald-400">{ev.to_status}</span>
                                        </div>
                                        {ev.notes && <div className="text-sm text-slate-400 mt-1">{ev.notes}</div>}
                                        <div className="text-sm text-slate-500 mt-1">المستخدم: {ev.creator?.name || 'النظام'}</div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-6 text-center text-slate-500 text-sm">لا توجد حركات مسجلة.</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Status Transition */}
            {transitionSerial && (
                <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                                <RefreshCw className="text-amber-400" size={18} />
                                <span>تحديث حالة الجهاز: {transitionSerial.serial_number}</span>
                            </h3>
                            <button
                                onClick={() => setTransitionSerial(null)}
                                className="text-slate-400 hover:text-white"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleTransitionSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-400 mb-1">الحالة الحالية</label>
                                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 font-bold text-amber-400 font-mono text-sm">
                                    {transitionSerial.status}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-1">الانتقال إلى الحالة الجديدة</label>
                                <select
                                    required
                                    value={transitionForm.data.to_status}
                                    onChange={(e) => transitionForm.setData('to_status', e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                                >
                                    <option value="">اختر الحالة المسموحة...</option>
                                    {transitionSerial.status === 'in_stock' && (
                                        <>
                                            <option value="sold">تم البيع (sold)</option>
                                            <option value="damaged">تالف (damaged)</option>
                                            <option value="transferred">تحويل مخزني (transferred)</option>
                                            <option value="returned_to_supplier">مرتجع لمورد (returned_to_supplier)</option>
                                        </>
                                    )}
                                    {transitionSerial.status === 'sold' && (
                                        <option value="returned">مرتجع من عميل (returned)</option>
                                    )}
                                    {transitionSerial.status === 'returned' && (
                                        <>
                                            {canAcceptReturn && <option value="in_stock">قبول بالمخزن (in_stock)</option>}
                                            <option value="returned_to_supplier">مرتجع للمورد (returned_to_supplier)</option>
                                        </>
                                    )}
                                    {transitionSerial.status === 'damaged' && (
                                        <option value="in_stock">إعادة تأهيل للمخزن (in_stock)</option>
                                    )}
                                    {transitionSerial.status === 'transferred' && (
                                        <option value="in_stock">استلام في المخزن الوجهة (in_stock)</option>
                                    )}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-1">ملاحظات وسبب الانتقال</label>
                                <textarea
                                    rows={2}
                                    value={transitionForm.data.notes}
                                    onChange={(e) => transitionForm.setData('notes', e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setTransitionSerial(null)}
                                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-bold transition"
                                >
                                    إلغاء
                                </button>
                                <button
                                    type="submit"
                                    disabled={transitionForm.processing}
                                    className="px-6 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold shadow-lg shadow-amber-600/30 transition disabled:opacity-50"
                                >
                                    {transitionForm.processing ? 'جارِ التحويل...' : 'تأكيد الانتقال'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
