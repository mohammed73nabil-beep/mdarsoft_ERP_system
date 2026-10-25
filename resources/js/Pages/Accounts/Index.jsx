import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import {
    BookOpen,
    Plus,
    ChevronDown,
    ChevronRight,
    Search,
    Folder,
    FileText,
    DollarSign,
    CheckCircle2,
    X,
    Filter,
    Layers,
    ArrowUpRight,
    ArrowDownLeft
} from 'lucide-react';

export default function AccountsIndex({ accountsTree, flatAccounts }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState('all');
    const [expandedNodes, setExpandedNodes] = useState({
        1: true,
        2: true,
        3: true,
        4: true,
        5: true,
        11: true,
        12: true,
        21: true,
        52: true,
    });
    const [isModalOpen, setIsModalOpen] = useState(false);

    // نموذج إضافة حساب جديد
    const { data, setData, post, processing, errors, reset } = useForm({
        code: '',
        name_ar: '',
        name_en: '',
        parent_id: '',
        type: 'asset',
        nature: 'debit',
        is_parent: false,
    });

    const toggleNode = (id) => {
        setExpandedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const expandAll = () => {
        const allIds = {};
        const collect = (nodes) => {
            nodes.forEach((n) => {
                allIds[n.id] = true;
                if (n.children && n.children.length > 0) collect(n.children);
            });
        };
        collect(accountsTree || []);
        setExpandedNodes(allIds);
    };

    const collapseAll = () => {
        setExpandedNodes({});
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/accounts', {
            onSuccess: () => {
                setIsModalOpen(false);
                reset();
            },
        });
    };

    // فلترة الحسابات
    const matchesFilter = (node) => {
        const matchesSearch =
            !searchTerm ||
            node.name_ar.includes(searchTerm) ||
            node.code.includes(searchTerm);
        const matchesType =
            selectedType === 'all' || node.type === selectedType;

        if (matchesSearch && matchesType) return true;

        if (node.children && node.children.length > 0) {
            return node.children.some(matchesFilter);
        }
        return false;
    };

    // مكوّن العرض الشجري التفاعلي
    const renderTree = (nodes, depth = 0) => {
        return nodes
            .filter(matchesFilter)
            .map((node) => {
                const hasChildren = node.children && node.children.length > 0;
                const isExpanded = expandedNodes[node.id];

                return (
                    <div key={node.id} className="select-none">
                        <div
                            className={`flex items-center justify-between py-2.5 px-3 rounded-xl transition duration-150 group border border-transparent ${
                                hasChildren
                                    ? 'hover:bg-slate-800/60 font-bold text-slate-200'
                                    : 'hover:bg-slate-800/40 text-slate-300'
                            }`}
                            style={{ paddingRight: `${depth * 24 + 12}px` }}
                        >
                            {/* معلومات الحساب والتوسيع */}
                            <div className="flex items-center gap-2.5 flex-1 overflow-hidden">
                                {hasChildren ? (
                                    <button
                                        type="button"
                                        onClick={() => toggleNode(node.id)}
                                        className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-700/60 transition"
                                    >
                                        {isExpanded ? (
                                            <ChevronDown size={16} />
                                        ) : (
                                            <ChevronRight size={16} />
                                        )}
                                    </button>
                                ) : (
                                    <div className="w-6 flex items-center justify-center">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-600"></div>
                                    </div>
                                )}

                                <div
                                    className={`p-1.5 rounded-lg ${
                                        hasChildren
                                            ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20'
                                            : 'bg-slate-800 text-slate-400'
                                    }`}
                                >
                                    {hasChildren ? <Folder size={15} /> : <FileText size={15} />}
                                </div>

                                <span className="font-mono text-sm font-bold text-sky-400 bg-sky-950/60 px-2 py-0.5 rounded border border-sky-800/40">
                                    {node.code}
                                </span>

                                <span className="truncate text-sm font-bold text-white group-hover:text-blue-300 transition">
                                    {node.name_ar}
                                </span>

                                {node.name_en && (
                                    <span className="text-sm text-slate-500 hidden md:inline">
                                        ({node.name_en})
                                    </span>
                                )}
                            </div>

                            {/* طبيعة الحساب والرصيد */}
                            <div className="flex items-center gap-4 text-sm shrink-0">
                                <span className="px-2 py-0.5 rounded text-sm font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                                    المستوى {node.level}
                                </span>

                                <span
                                    className={`text-sm font-bold px-2 py-0.5 rounded ${
                                        node.nature === 'debit'
                                            ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-800/30'
                                            : 'text-blue-400 bg-blue-950/40 border border-blue-800/30'
                                    }`}
                                >
                                    {node.nature === 'debit' ? 'مدين' : 'دائن'}
                                </span>

                                <div className="min-w-[120px] text-left">
                                    <span className={`text-sm font-bold px-2 py-0.5 rounded ${
                                        node.is_header
                                            ? 'text-amber-400 bg-amber-950/40 border border-amber-800/30'
                                            : 'text-slate-300 bg-slate-800 border border-slate-700'
                                    }`}>
                                        {node.is_header ? 'رئيسي (تجميعي)' : (node.is_system ? 'فرعي نظامي' : 'فرعي')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* الأبناء */}
                        {hasChildren && isExpanded && (
                            <div className="space-y-0.5">
                                {renderTree(node.children, depth + 1)}
                            </div>
                        )}
                    </div>
                );
            });
    };

    return (
        <AppLayout title="دليل الحسابات (شجرة الحسابات)">
            <Head title="دليل الحسابات" />

            {/* العنوان وأزرار التحكم */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-black text-white flex items-center gap-2">
                        <BookOpen className="text-blue-500" />
                        <span>دليل الحسابات المحاسبي (Chart of Accounts)</span>
                    </h2>
                    <p className="text-sm text-slate-400 mt-1">
                        إدارة الهيكل المالي الشجري والمستوى المحاسبي لجميع حسابات المؤسسة
                    </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={expandAll}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition"
                    >
                        توسيع الكل
                    </button>
                    <button
                        onClick={collapseAll}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition"
                    >
                        طي الكل
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition"
                    >
                        <Plus size={16} />
                        <span>إضافة حساب جديد</span>
                    </button>
                </div>
            </div>

            {/* أدوات البحث والفلترة */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-80">
                    <Search className="absolute right-3 top-2.5 text-slate-500" size={16} />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="ابحث بكود أو اسم الحساب..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    >
                    </input>
                </div>

                {/* أزرار الفلترة حسب النوع */}
                <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
                    {[
                        { id: 'all', label: 'الكل' },
                        { id: 'asset', label: '1 الأصول' },
                        { id: 'liability', label: '2 الخصوم' },
                        { id: 'equity', label: '3 حقوق الملكية' },
                        { id: 'revenue', label: '4 الإيرادات' },
                        { id: 'expense', label: '5 المصروفات' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setSelectedType(tab.id)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-bold transition whitespace-nowrap ${
                                selectedType === tab.id
                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                                    : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* شجرة الحسابات الرئيسية */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
                <div className="border-b border-slate-800 pb-3 mb-4 flex items-center justify-between text-sm font-bold text-slate-400">
                    <span>الشجرة المحاسبية</span>
                    <div className="flex items-center gap-8">
                        <span>المستوى / الطبيعة</span>
                        <span className="w-28 text-left">تصنيف الحساب</span>
                    </div>
                </div>

                <div className="space-y-1">
                    {accountsTree && accountsTree.length > 0 ? (
                        renderTree(accountsTree)
                    ) : (
                        <div className="text-center py-12 text-slate-500">
                            لا توجد حسابات مسجلة حالياً
                        </div>
                    )}
                </div>
            </div>

            {/* نافذة مودال: إضافة حساب جديد */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
                        <div className="flex items-center justify-between mb-5 border-b border-slate-800 pb-3">
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                                <Plus size={18} className="text-blue-500" />
                                <span>إضافة حساب محاسبي جديد</span>
                            </h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-slate-400 hover:text-white p-1 rounded-lg"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-1">
                                    الحساب الأب (المستوى الأعلى)
                                </label>
                                <select
                                    value={data.parent_id}
                                    onChange={(e) => {
                                        const pId = e.target.value;
                                        const parent = flatAccounts.find((a) => a.id == pId);
                                        setData({
                                            ...data,
                                            parent_id: pId,
                                            type: parent ? parent.type : data.type,
                                            nature: parent ? parent.nature : data.nature,
                                        });
                                    }}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                                >
                                    <option value="">-- حساب رئيسي (بدون أب) --</option>
                                    {(flatAccounts || []).map((acc) => (
                                        <option key={acc.id} value={acc.id}>
                                            {acc.code} - {acc.name_ar}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-300 mb-1">
                                        كود الحساب *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={data.code}
                                        onChange={(e) => setData('code', e.target.value)}
                                        placeholder="مثال: 110104"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-blue-500"
                                    />
                                    {errors.code && (
                                        <p className="text-sm text-rose-400 mt-1">{errors.code}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-300 mb-1">
                                        طبيعة الحساب *
                                    </label>
                                    <select
                                        value={data.nature}
                                        onChange={(e) => setData('nature', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                                    >
                                        <option value="debit">مدين (Debit)</option>
                                        <option value="credit">دائن (Credit)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-1">
                                    اسم الحساب بالعربية *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={data.name_ar}
                                    onChange={(e) => setData('name_ar', e.target.value)}
                                    placeholder="اسم الحساب بالعربي..."
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                                />
                                {errors.name_ar && (
                                    <p className="text-sm text-rose-400 mt-1">{errors.name_ar}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-1">
                                    اسم الحساب بالإنجليزية (اختياري)
                                </label>
                                <input
                                    type="text"
                                    value={data.name_en}
                                    onChange={(e) => setData('name_en', e.target.value)}
                                    placeholder="Account Name in English..."
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-300 mb-1">
                                        نوع الحساب *
                                    </label>
                                    <select
                                        value={data.type}
                                        onChange={(e) => setData('type', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                                    >
                                        <option value="asset">1 - أصول (Asset)</option>
                                        <option value="liability">2 - خصوم (Liability)</option>
                                        <option value="equity">3 - حقوق ملكية (Equity)</option>
                                        <option value="revenue">4 - إيرادات (Revenue)</option>
                                        <option value="expense">5 - مصروفات (Expense)</option>
                                    </select>
                                </div>

                                <div className="flex items-center gap-2 pt-6">
                                    <input
                                        type="checkbox"
                                        id="is_parent"
                                        checked={data.is_parent}
                                        onChange={(e) => setData('is_parent', e.target.checked)}
                                        className="rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-0"
                                    />
                                    <label htmlFor="is_parent" className="text-sm font-bold text-slate-300 cursor-pointer">
                                        حساب رئيسي (تندرج تحته فروع)
                                    </label>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition"
                                >
                                    إلغاء
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition disabled:opacity-50"
                                >
                                    {processing ? 'جاري الحفظ...' : 'حفظ الحساب'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
