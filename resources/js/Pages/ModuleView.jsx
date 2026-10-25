import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AppLayout from '../Layouts/AppLayout';
import {
    Layers,
    FileSpreadsheet,
    ChevronLeft,
    Clock,
    Info,
    FolderKanban
} from 'lucide-react';

export default function ModuleView({ title, href, keyName, category, description }) {
    const { url } = usePage();
    const currentPath = href || url;

    return (
        <AppLayout title={title}>
            <Head title={title} />

            {/* ترويسة الموديول مع مسار التنقل */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <div className="flex items-center gap-2 text-sm font-bold text-blue-400 mb-1">
                        <Link href="/" className="hover:underline">الرئيسية</Link>
                        <ChevronLeft size={16} />
                        <span>{category || 'الموديولات'}</span>
                        <ChevronLeft size={16} />
                        <span className="text-white">{title}</span>
                    </div>
                    <h2 className="text-2xl font-black text-white">{title}</h2>
                    <p className="text-sm text-slate-400 mt-1">
                        {description || `شاشة إدارة وعمليات: ${title}`}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-semibold flex items-center gap-1.5">
                        <Info size={16} />
                        <span>واجهة تمهيدية (Placeholder)</span>
                    </span>
                </div>
            </div>

            {/* تفاصيل مسار الشاشة وهوية الموديول */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl mb-6">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                        <FolderKanban size={24} />
                    </div>
                    <div className="space-y-2 flex-1">
                        <h3 className="text-lg font-bold text-white">معلومات العنصر ومسار الرابط</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm pt-2">
                            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                                <span className="text-slate-400 block text-sm mb-1">اسم الشاشة (العنوان):</span>
                                <span className="font-bold text-white text-base">{title}</span>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                                <span className="text-slate-400 block text-sm mb-1">المسار (URL Route):</span>
                                <code className="font-mono font-bold text-sky-400 text-sm">{currentPath}</code>
                            </div>
                            {keyName && (
                                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                                    <span className="text-slate-400 block text-sm mb-1">المفتاح الفريد (Key):</span>
                                    <code className="font-mono text-emerald-400 text-sm">{keyName}</code>
                                </div>
                            )}
                            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                                <span className="text-slate-400 block text-sm mb-1">الحالة البرمجية:</span>
                                <span className="text-amber-300 font-bold text-sm">مسار مسجل وجاهز لبناء منطق الأعمال</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* بطاقة توضيحية لبيئة التطوير */}
            <div className="bg-slate-900/60 border border-dashed border-slate-800 rounded-2xl p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-4">
                    <Layers size={32} />
                </div>
                <h4 className="text-base font-bold text-white mb-2">تم ربط هذا المسار بنجاح في القائمة وشجرة التوجيه</h4>
                <p className="text-sm text-slate-400 max-w-xl mx-auto mb-6 leading-relaxed">
                    هذه الصفحة هي واجهة مؤقتة وموحدة تعرض الاسم والمسار المحدد. يتم تفعيل واجهات الإدخال والتقارير والجداول المخصصة تباعاً وفق خطة بناء النظام المعتمدة لمحل الجوالات.
                </p>
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition"
                >
                    <span>العودة للرئيسية</span>
                    <ChevronLeft size={16} />
                </Link>
            </div>
        </AppLayout>
    );
}
