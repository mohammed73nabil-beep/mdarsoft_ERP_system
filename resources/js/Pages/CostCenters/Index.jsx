import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import { Target, Plus, Search, Folder, FileText, X, ChevronRight, ChevronDown } from 'lucide-react';

export default function CostCentersIndex({ costCentersTree, flatCenters }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        code: '',
        name: '',
        parent_id: '',
        description: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/cost-centers', {
            onSuccess: () => {
                setIsModalOpen(false);
                reset();
            },
        });
    };

    const renderTree = (centers, depth = 0) => {
        return centers
            .filter((c) => !searchTerm || c.name.includes(searchTerm) || c.code.includes(searchTerm))
            .map((c) => {
                const hasChildren = c.children && c.children.length > 0;
                return (
                    <div key={c.id}>
                        <div
                            className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-slate-800/60 transition group border border-transparent"
                            style={{ paddingRight: `${depth * 24 + 12}px` }}
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-1.5 rounded-lg bg-indigo-600/20 text-indigo-400">
                                    <Target size={15} />
                                </div>
                                <span className="font-mono text-sm font-bold text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/40">
                                    {c.code}
                                </span>
                                <span className="text-sm font-bold text-white group-hover:text-indigo-300 transition">
                                    {c.name}
                                </span>
                                {c.description && (
                                    <span className="text-sm text-slate-500 hidden sm:inline">
                                        ({c.description})
                                    </span>
                                )}
                            </div>
                            <span className="px-2 py-0.5 rounded text-sm font-semibold bg-emerald-950/40 text-emerald-400 border border-emerald-800/30">
                                نشط
                            </span>
                        </div>
                        {hasChildren && <div className="space-y-0.5">{renderTree(c.children, depth + 1)}</div>}
                    </div>
                );
            });
    };

    return (
        <AppLayout title="مراكز التكلفة">
            <Head title="مراكز التكلفة" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-black text-white flex items-center gap-2">
                        <Target className="text-indigo-500" />
                        <span>مراكز التكلفة (Cost Centers)</span>
                    </h2>
                    <p className="text-sm text-slate-400 mt-1">
                        توزيع وتوجيه المصروفات والإيرادات على المشاريع والفروع والأقسام
                    </p>
                </div>

                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition self-start"
                >
                    <Plus size={16} />
                    <span>إضافة مركز تكلفة جديد</span>
                </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6">
                <div className="relative w-full md:w-80">
                    <Search className="absolute right-3 top-2.5 text-slate-500" size={16} />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="بحث في مراكز التكلفة..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                <div className="space-y-1">
                    {costCentersTree && costCentersTree.length > 0 ? (
                        renderTree(costCentersTree)
                    ) : (
                        <div className="text-center py-12 text-slate-500">
                            لا توجد مراكز تكلفة مسجلة حالياً
                        </div>
                    )}
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
                        <div className="flex items-center justify-between mb-5 border-b border-slate-800 pb-3">
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                                <Plus size={18} className="text-indigo-500" />
                                <span>إضافة مركز تكلفة جديد</span>
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-1">
                                    المركز الرئيسي (الأب)
                                </label>
                                <select
                                    value={data.parent_id}
                                    onChange={(e) => setData('parent_id', e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                                >
                                    <option value="">-- مركز رئيسي --</option>
                                    {(flatCenters || []).map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.code} - {c.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-1">
                                    كود مركز التكلفة *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={data.code}
                                    onChange={(e) => setData('code', e.target.value)}
                                    placeholder="مثال: 104"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-1">
                                    اسم مركز التكلفة *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="مثال: مشروع مجمع النور"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-1">
                                    الوصف أو الملاحظات
                                </label>
                                <textarea
                                    rows="3"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="وصف مختصر للمركز..."
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                                ></textarea>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold"
                                >
                                    إلغاء
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 disabled:opacity-50"
                                >
                                    {processing ? 'جاري الحفظ...' : 'حفظ المركز'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
