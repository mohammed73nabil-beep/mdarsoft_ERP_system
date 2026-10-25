import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import {
    Plus,
    Search,
    Filter,
    SlidersHorizontal,
    QrCode,
    Smartphone,
    Layers,
    Package,
    Edit,
    Trash2,
    Eye,
    Copy,
    Power,
    CheckCircle,
    XCircle,
    AlertTriangle,
    FileSpreadsheet,
    Printer,
    ChevronDown,
    X,
    Calendar,
    Warehouse as WarehouseIcon,
    ArrowUpDown,
    RotateCcw
} from 'lucide-react';

export default function Index({ products, filters, categories, brands, units, warehouses }) {
    const { auth, flash } = usePage().props;
    const userPermissions = auth?.user?.permissions || [];
    const isAdmin = auth?.user?.roles?.includes('مدير النظام') || auth?.user?.roles?.includes('admin');

    const canCreate = isAdmin || userPermissions.includes('products.create');
    const canEdit = isAdmin || userPermissions.includes('products.edit');
    const canDelete = isAdmin || userPermissions.includes('products.delete');

    // Local filter state
    const [search, setSearch] = useState(filters?.search || '');
    const [categoryId, setCategoryId] = useState(filters?.category_id || '');
    const [brandId, setBrandId] = useState(filters?.brand_id || '');
    const [trackingType, setTrackingType] = useState(filters?.tracking_type || '');
    const [warehouseId, setWarehouseId] = useState(filters?.warehouse_id || '');
    const [isActive, setIsActive] = useState(filters?.is_active ?? '');
    const [lowStock, setLowStock] = useState(Boolean(filters?.low_stock));
    const [perPage, setPerPage] = useState(filters?.per_page || 25);
    const [sortBy, setSortBy] = useState(filters?.sort_by || 'id');
    const [sortDirection, setSortDirection] = useState(filters?.sort_direction || 'desc');

    // Modals
    const [showFilters, setShowFilters] = useState(false);
    const [isQuickQueryOpen, setIsQuickQueryOpen] = useState(false);
    const [quickQueryInput, setQuickQueryInput] = useState('');
    const [quickQueryResult, setQuickQueryResult] = useState(null);
    const [isQuerying, setIsQuerying] = useState(false);
    const [deleteModalProduct, setDeleteModalProduct] = useState(null);

    const applyFilters = (overrides = {}) => {
        const queryParams = {
            search,
            category_id: categoryId,
            brand_id: brandId,
            tracking_type: trackingType,
            warehouse_id: warehouseId,
            is_active: isActive,
            low_stock: lowStock ? 1 : 0,
            per_page: perPage,
            sort_by: sortBy,
            sort_direction: sortDirection,
            ...overrides,
        };

        // Remove empty keys
        Object.keys(queryParams).forEach((k) => {
            if (queryParams[k] === '' || queryParams[k] === null || queryParams[k] === undefined) {
                delete queryParams[k];
            }
        });

        router.get('/products', queryParams, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleSort = (field) => {
        const newDirection = sortBy === field && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortBy(field);
        setSortDirection(newDirection);
        applyFilters({ sort_by: field, sort_direction: newDirection });
    };

    const handleResetFilters = () => {
        setSearch('');
        setCategoryId('');
        setBrandId('');
        setTrackingType('');
        setWarehouseId('');
        setIsActive('');
        setLowStock(false);
        setPerPage(25);
        setSortBy('id');
        setSortDirection('desc');
        router.get('/products');
    };

    const handleQuickQuery = async (e) => {
        e?.preventDefault();
        if (!quickQueryInput.trim()) return;

        setIsQuerying(true);
        setQuickQueryResult(null);

        try {
            const res = await fetch(`/products/quick-query?query=${encodeURIComponent(quickQueryInput.trim())}`, {
                headers: { Accept: 'application/json' },
            });
            const data = await res.json();
            setQuickQueryResult(data);
        } catch {
            setQuickQueryResult({ found: false, message: 'تعذر الاتصال بالخادم.' });
        } finally {
            setIsQuerying(false);
        }
    };

    const handleToggleActive = (productId) => {
        router.post(`/products/${productId}/toggle-active`, {}, {
            preserveScroll: true,
        });
    };

    const handleDeleteProduct = () => {
        if (!deleteModalProduct) return;
        router.delete(`/products/${deleteModalProduct.id}`, {
            preserveScroll: true,
            onFinish: () => setDeleteModalProduct(null),
        });
    };

    return (
        <AppLayout title="إدارة المنتجات">
            <Head title="قائمة المنتجات" />

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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-black text-white flex items-center gap-2">
                        <Package className="text-blue-500" size={26} />
                        <span>إدارة المنتجات والأصناف</span>
                    </h2>
                    <p className="text-sm text-slate-400 mt-1">
                        دليل المنتجات، الأجهزة الذكية، الأرقام التسلسلية IMEI، ومستويات المخزون
                    </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={() => {
                            setQuickQueryInput('');
                            setQuickQueryResult(null);
                            setIsQuickQueryOpen(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 font-bold text-sm shadow-md transition"
                    >
                        <QrCode size={18} />
                        <span>شاشة استعلامات سريعة</span>
                    </button>

                    {canCreate && (
                        <Link
                            href="/products/create"
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition"
                        >
                            <Plus size={18} />
                            <span>إضافة منتج جديد</span>
                        </Link>
                    )}
                </div>
            </div>

            {/* Search & Actions Bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6 shadow-xl space-y-4">
                <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            applyFilters();
                        }}
                        className="relative w-full md:w-96"
                    >
                        <Search className="absolute right-3.5 top-3 text-slate-500" size={18} />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="بحث بالاسم، SKU، الباركود، أو IMEI..."
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-10 pl-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                        />
                    </form>

                    <div className="flex items-center gap-2 w-full md:w-auto flex-wrap justify-end">
                        <button
                            type="button"
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition ${
                                showFilters
                                    ? 'bg-blue-600 text-white border-blue-500'
                                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                            }`}
                        >
                            <Filter size={16} />
                            <span>التصفية والفلترة</span>
                        </button>

                        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-slate-400 text-sm">
                            <button
                                disabled
                                title="قريباً"
                                className="px-2.5 py-1.5 rounded-lg opacity-50 cursor-not-allowed hover:bg-slate-900 flex items-center gap-1"
                            >
                                <FileSpreadsheet size={15} />
                                <span className="text-sm">Excel</span>
                            </button>
                            <button
                                disabled
                                title="قريباً"
                                className="px-2.5 py-1.5 rounded-lg opacity-50 cursor-not-allowed hover:bg-slate-900 flex items-center gap-1"
                            >
                                <FileSpreadsheet size={15} />
                                <span className="text-sm">CSV</span>
                            </button>
                            <button
                                disabled
                                title="قريباً"
                                className="px-2.5 py-1.5 rounded-lg opacity-50 cursor-not-allowed hover:bg-slate-900 flex items-center gap-1"
                            >
                                <Printer size={15} />
                                <span className="text-sm">طباعة</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Collapsible Filter Bar */}
                {showFilters && (
                    <div className="pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                        {/* Category */}
                        <div>
                            <label className="block text-sm font-bold text-slate-400 mb-1">الصنف</label>
                            <select
                                value={categoryId}
                                onChange={(e) => setCategoryId(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                            >
                                <option value="">كل الأصناف</option>
                                {categories.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Brand */}
                        <div>
                            <label className="block text-sm font-bold text-slate-400 mb-1">العلامة التجارية</label>
                            <select
                                value={brandId}
                                onChange={(e) => setBrandId(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                            >
                                <option value="">كل العلامات</option>
                                {brands.map((b) => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Tracking Type */}
                        <div>
                            <label className="block text-sm font-bold text-slate-400 mb-1">نوع التتبع</label>
                            <select
                                value={trackingType}
                                onChange={(e) => setTrackingType(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                            >
                                <option value="">الكل</option>
                                <option value="none">كمية فقط (none)</option>
                                <option value="serial">سيريال / IMEI (serial)</option>
                            </select>
                        </div>

                        {/* Warehouse */}
                        <div>
                            <label className="block text-sm font-bold text-slate-400 mb-1">المستودع</label>
                            <select
                                value={warehouseId}
                                onChange={(e) => setWarehouseId(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                            >
                                <option value="">كل المستودعات المتاحة</option>
                                {warehouses.map((w) => (
                                    <option key={w.id} value={w.id}>{w.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Status */}
                        <div>
                            <label className="block text-sm font-bold text-slate-400 mb-1">الحالة</label>
                            <select
                                value={isActive}
                                onChange={(e) => setIsActive(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                            >
                                <option value="">الكل</option>
                                <option value="1">نشط</option>
                                <option value="0">غير نشط</option>
                            </select>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col justify-end gap-2">
                            <label className="flex items-center gap-2 cursor-pointer pb-2">
                                <input
                                    type="checkbox"
                                    checked={lowStock}
                                    onChange={(e) => setLowStock(e.target.checked)}
                                    className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-0"
                                />
                                <span className="text-sm font-bold text-amber-400">مخزون منخفض فقط</span>
                            </label>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => applyFilters()}
                                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-xl text-sm transition"
                                >
                                    تطبيق
                                </button>
                                <button
                                    type="button"
                                    onClick={handleResetFilters}
                                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
                                    title="إعادة تعيين"
                                >
                                    <RotateCcw size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Products Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden mb-6">
                <div className="overflow-x-auto">
                    <table className="w-full text-right text-sm">
                        <thead className="bg-slate-950/80 text-slate-400 font-bold border-b border-slate-800">
                            <tr>
                                <th className="py-3.5 px-4 text-center w-16">صورة</th>
                                <th
                                    onClick={() => handleSort('name')}
                                    className="py-3.5 px-4 cursor-pointer hover:text-white transition"
                                >
                                    <div className="flex items-center gap-1.5">
                                        <span>اسم المنتج</span>
                                        <ArrowUpDown size={14} />
                                    </div>
                                </th>
                                <th
                                    onClick={() => handleSort('sku')}
                                    className="py-3.5 px-4 cursor-pointer hover:text-white transition"
                                >
                                    <div className="flex items-center gap-1.5">
                                        <span>رمز SKU</span>
                                        <ArrowUpDown size={14} />
                                    </div>
                                </th>
                                <th className="py-3.5 px-4">الباركود</th>
                                <th className="py-3.5 px-4">الصنف</th>
                                <th className="py-3.5 px-4">العلامة</th>
                                <th className="py-3.5 px-4">نوع التتبع</th>
                                <th
                                    onClick={() => handleSort('cost_price')}
                                    className="py-3.5 px-4 cursor-pointer hover:text-white transition"
                                >
                                    <div className="flex items-center gap-1.5">
                                        <span>سعر الشراء</span>
                                        <ArrowUpDown size={14} />
                                    </div>
                                </th>
                                <th
                                    onClick={() => handleSort('selling_price')}
                                    className="py-3.5 px-4 cursor-pointer hover:text-white transition"
                                >
                                    <div className="flex items-center gap-1.5">
                                        <span>سعر البيع</span>
                                        <ArrowUpDown size={14} />
                                    </div>
                                </th>
                                <th
                                    onClick={() => handleSort('current_stock')}
                                    className="py-3.5 px-4 cursor-pointer hover:text-white transition"
                                >
                                    <div className="flex items-center gap-1.5">
                                        <span>المخزون الحالي</span>
                                        <ArrowUpDown size={14} />
                                    </div>
                                </th>
                                <th className="py-3.5 px-4 text-center">الحالة</th>
                                <th className="py-3.5 px-4 text-left">خيارات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                            {products.data && products.data.length > 0 ? (
                                products.data.map((item) => {
                                    const stockNum = Number(item.current_stock || 0);
                                    const isLow = stockNum <= Number(item.reorder_level || 0);

                                    return (
                                        <tr key={item.id} className="hover:bg-slate-800/40 transition">
                                            {/* Image */}
                                            <td className="py-3 px-4 text-center">
                                                {item.image ? (
                                                    <img
                                                        src={item.image}
                                                        alt={item.name}
                                                        className="w-10 h-10 rounded-lg object-cover mx-auto border border-slate-700"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700/60 flex items-center justify-center text-slate-500 mx-auto">
                                                        <Package size={18} />
                                                    </div>
                                                )}
                                            </td>

                                            {/* Name */}
                                            <td className="py-3 px-4">
                                                <div className="font-bold text-white text-sm">{item.name}</div>
                                                <div className="text-slate-400 text-sm mt-0.5">
                                                    {item.type === 'variable' && (
                                                        <span className="text-amber-400 font-medium">منتج متغير ({item.variations?.length || 0} تباين)</span>
                                                    )}
                                                    {item.type === 'service' && (
                                                        <span className="text-sky-400 font-medium">خدمة</span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* SKU */}
                                            <td className="py-3 px-4 font-mono text-sm font-bold text-blue-400">
                                                {item.sku}
                                            </td>

                                            {/* Barcode */}
                                            <td className="py-3 px-4 font-mono text-sm text-slate-300">
                                                {item.barcode || '—'}
                                            </td>

                                            {/* Category */}
                                            <td className="py-3 px-4 text-sm text-slate-300">
                                                {item.category?.name || '—'}
                                            </td>

                                            {/* Brand */}
                                            <td className="py-3 px-4 text-sm text-slate-300">
                                                {item.brand?.name || '—'}
                                            </td>

                                            {/* Tracking Type */}
                                            <td className="py-3 px-4">
                                                {item.tracking_type === 'serial' ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-bold bg-cyan-950/60 text-cyan-300 border border-cyan-800/40">
                                                        <Smartphone size={13} />
                                                        <span>سيريال / IMEI</span>
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-bold bg-slate-800 text-slate-300 border border-slate-700">
                                                        <Layers size={13} />
                                                        <span>كمية</span>
                                                    </span>
                                                )}
                                            </td>

                                            {/* Cost Price */}
                                            <td className="py-3 px-4 font-mono text-sm text-slate-200">
                                                {Number(item.cost_price).toFixed(2)} <span className="text-slate-500">ر.س</span>
                                            </td>

                                            {/* Selling Price */}
                                            <td className="py-3 px-4 font-mono text-sm font-bold text-emerald-400">
                                                {Number(item.selling_price).toFixed(2)} <span className="text-slate-500">ر.س</span>
                                            </td>

                                            {/* Current Stock */}
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-2">
                                                    <span className={`font-mono text-sm font-black ${isLow ? 'text-rose-400' : 'text-white'}`}>
                                                        {item.tracking_type === 'serial'
                                                            ? Math.round(stockNum)
                                                            : stockNum.toFixed(2)}
                                                    </span>
                                                    <span className="text-slate-400 text-sm">{item.unit?.symbol || item.unit?.name}</span>
                                                    {isLow && (
                                                        <span title="مخزون منخفض أقل من أو يساوي حد الطلب">
                                                            <AlertTriangle size={15} className="text-amber-400 inline" />
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Status Toggle */}
                                            <td className="py-3 px-4 text-center">
                                                <button
                                                    onClick={() => canEdit && handleToggleActive(item.id)}
                                                    disabled={!canEdit}
                                                    className={`px-2.5 py-1 rounded-full text-sm font-bold border transition ${
                                                        item.is_active
                                                            ? 'bg-emerald-950/50 text-emerald-400 border-emerald-800/40 hover:bg-emerald-900/50'
                                                            : 'bg-rose-950/50 text-rose-400 border-rose-800/40 hover:bg-rose-900/50'
                                                    }`}
                                                >
                                                    {item.is_active ? 'نشط' : 'معطل'}
                                                </button>
                                            </td>

                                            {/* Options */}
                                            <td className="py-3 px-4 text-left">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Link
                                                        href={`/products/${item.id}`}
                                                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                                                        title="عرض التفاصيل"
                                                    >
                                                        <Eye size={16} />
                                                    </Link>

                                                    {canEdit && (
                                                        <Link
                                                            href={`/products/${item.id}/edit`}
                                                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 transition"
                                                            title="تعديل المنتج"
                                                        >
                                                            <Edit size={16} />
                                                        </Link>
                                                    )}

                                                    {canDelete && (
                                                        <button
                                                            onClick={() => setDeleteModalProduct(item)}
                                                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/80 text-rose-400 hover:text-rose-300 transition"
                                                            title="حذف"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={12} className="py-12 text-center text-slate-500 text-sm">
                                        لا توجد منتجات مسجلة تطابق شروط البحث الحالية.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {products.links && products.links.length > 3 && (
                    <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-sm text-slate-400">
                            عرض {products.from || 0} إلى {products.to || 0} من أصل {products.total || 0} منتج
                        </div>

                        <div className="flex items-center gap-1">
                            {products.links.map((link, idx) => (
                                <Link
                                    key={idx}
                                    href={link.url || '#'}
                                    preserveScroll
                                    className={`px-3 py-1.5 rounded-lg text-sm font-bold transition ${
                                        link.active
                                            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
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

            {/* Quick Query Modal */}
            {isQuickQueryOpen && (
                <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                            <h3 className="text-lg font-black text-white flex items-center gap-2">
                                <QrCode className="text-cyan-400" size={20} />
                                <span>شاشة الاستعلام السريع عن المنتجات والأجهزة</span>
                            </h3>
                            <button
                                onClick={() => setIsQuickQueryOpen(false)}
                                className="text-slate-400 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleQuickQuery} className="mb-6">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    autoFocus
                                    value={quickQueryInput}
                                    onChange={(e) => setQuickQueryInput(e.target.value)}
                                    placeholder="امسح بالباركود أو اكتب SKU أو رقم السيريال أو IMEI..."
                                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                                />
                                <button
                                    type="submit"
                                    disabled={isQuerying}
                                    className="px-6 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm shadow-lg shadow-cyan-600/30 transition disabled:opacity-50"
                                >
                                    {isQuerying ? 'جارِ البحث...' : 'استعلام'}
                                </button>
                            </div>
                        </form>

                        {/* Query Results */}
                        {quickQueryResult && (
                            <div className="space-y-4">
                                {quickQueryResult.found ? (
                                    <>
                                        {/* Product Info */}
                                        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                                            <div className="flex items-center justify-between mb-3">
                                                <h4 className="font-bold text-white text-base">
                                                    {quickQueryResult.product.name}
                                                </h4>
                                                <span className="px-2.5 py-1 rounded-full text-sm font-bold bg-blue-950 text-blue-400 border border-blue-800">
                                                    {quickQueryResult.type === 'serial' ? 'جهاز بسيريال' : 'منتج بكمية'}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                                                <div>
                                                    <span className="text-slate-400 block text-sm">رمز SKU:</span>
                                                    <span className="font-mono font-bold text-slate-200">{quickQueryResult.product.sku}</span>
                                                </div>
                                                <div>
                                                    <span className="text-slate-400 block text-sm">الباركود:</span>
                                                    <span className="font-mono text-slate-200">{quickQueryResult.product.barcode || '—'}</span>
                                                </div>
                                                <div>
                                                    <span className="text-slate-400 block text-sm">سعر البيع:</span>
                                                    <span className="font-mono font-bold text-emerald-400">{quickQueryResult.product.selling_price} ر.س</span>
                                                </div>
                                                <div>
                                                    <span className="text-slate-400 block text-sm">الصنف:</span>
                                                    <span className="text-slate-200">{quickQueryResult.product.category || '—'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* If Serial Device */}
                                        {quickQueryResult.type === 'serial' && quickQueryResult.serial && (
                                            <div className="p-4 rounded-xl bg-slate-950 border border-cyan-900/40">
                                                <h5 className="text-sm font-bold text-cyan-400 mb-3 flex items-center gap-1.5">
                                                    <Smartphone size={16} />
                                                    <span>بيانات الجهاز الفردي</span>
                                                </h5>

                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mb-4">
                                                    <div>
                                                        <span className="text-slate-400 block text-sm">رقم السيريال:</span>
                                                        <span className="font-mono font-bold text-white">{quickQueryResult.serial.serial_number}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-400 block text-sm">IMEI 1:</span>
                                                        <span className="font-mono text-slate-200">{quickQueryResult.serial.imei1 || '—'}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-400 block text-sm">الحالة الحالية:</span>
                                                        <span className="font-bold text-amber-400">{quickQueryResult.serial.status}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-400 block text-sm">المستودع الحالي:</span>
                                                        <span className="text-slate-200">{quickQueryResult.serial.warehouse?.name || '—'}</span>
                                                    </div>
                                                </div>

                                                {/* Serial History Events */}
                                                {quickQueryResult.events && quickQueryResult.events.length > 0 && (
                                                    <div>
                                                        <h6 className="text-sm font-bold text-slate-300 mb-2">سجل حركات وتتبع الجهاز (Timeline):</h6>
                                                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                                            {quickQueryResult.events.map((ev) => (
                                                                <div key={ev.id} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-sm flex items-center justify-between">
                                                                    <div>
                                                                        <span className="font-bold text-white">{ev.event_type}</span>
                                                                        <span className="text-slate-400 text-sm mr-2">({ev.from_status || 'البداية'} ← {ev.to_status})</span>
                                                                        {ev.notes && <div className="text-slate-500 text-sm mt-0.5">{ev.notes}</div>}
                                                                    </div>
                                                                    <div className="text-left text-sm text-slate-400 font-mono">
                                                                        <div>{ev.created_at}</div>
                                                                        <div className="text-slate-500">{ev.created_by}</div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Balances across warehouses */}
                                        {quickQueryResult.product.balances && (
                                            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                                                <h5 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-1.5">
                                                    <WarehouseIcon size={16} className="text-blue-400" />
                                                    <span>الأرصدة في المستودعات (إجمالي: {quickQueryResult.product.total_stock})</span>
                                                </h5>
                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                                                    {quickQueryResult.product.balances.map((b, i) => (
                                                        <div key={i} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                                                            <span className="text-slate-300 font-bold">{b.warehouse_name}:</span>
                                                            <span className="font-mono font-black text-emerald-400">{b.quantity}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-sm text-center">
                                        {quickQueryResult.message}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteModalProduct && (
                <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative text-center">
                        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
                            <Trash2 size={28} />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">تأكيد حذف المنتج</h3>
                        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                            هل أنت متأكد من رغبتك في حذف المنتج <span className="font-bold text-white font-mono">"{deleteModalProduct.name}"</span>؟
                            <br />
                            <span className="text-amber-400 text-sm mt-1 block">تنبيه: سيتم منع الحذف إذا كان للمنتج أي حركات مخزنية سابقة.</span>
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={handleDeleteProduct}
                                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm transition shadow-lg shadow-rose-600/30"
                            >
                                نعم، احذف المنتج
                            </button>
                            <button
                                onClick={() => setDeleteModalProduct(null)}
                                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition border border-slate-700"
                            >
                                إلغاء
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
