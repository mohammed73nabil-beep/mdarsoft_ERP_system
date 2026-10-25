import React, { useState, useMemo } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
    LayoutDashboard,
    ShoppingCart,
    ShoppingBag,
    Warehouse,
    Users,
    Contact,
    Package,
    Factory,
    Wrench,
    Receipt,
    Target,
    ArrowDownRight,
    BookOpen,
    Calculator,
    FileSpreadsheet,
    BarChart3,
    HardHat,
    BellRing,
    Settings,
    Landmark,
    HeartHandshake,
    UserCheck,
    FolderKanban,
    ChevronDown,
    ChevronLeft,
    Search,
    Menu,
    FileDown
} from 'lucide-react';
import { menuConfig, filterMenuByPermissions } from '../config/menu.config';

// خريطة أيقونات Lucide
const iconMap = {
    LayoutDashboard,
    ShoppingCart,
    ShoppingBag,
    Warehouse,
    Users,
    Contact,
    Package,
    Factory,
    Wrench,
    Receipt,
    Target,
    ArrowDownRight,
    BookOpen,
    Calculator,
    FileSpreadsheet,
    BarChart3,
    HardHat,
    BellRing,
    Settings,
    Landmark,
    HeartHandshake,
    UserCheck,
    FolderKanban
};

export default function AppLayout({ children, title = 'نظام ERP المحاسبي' }) {
    const { url, props } = usePage();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [openSubmenus, setOpenSubmenus] = useState({});

    // صلاحيات المستخدم (افتراضياً * لمدير النظام)
    const userPermissions = props?.auth?.permissions || ['*'];

    // تصفية القائمة بالصلاحيات والوحدات المفعّلة
    const activeMenuItems = useMemo(() => {
        return filterMenuByPermissions(menuConfig, userPermissions);
    }, [userPermissions]);

    const toggleSubmenu = (key) => {
        setOpenSubmenus(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const filteredMenu = activeMenuItems.filter(item =>
        item.label.includes(searchTerm) || (item.children && item.children.some(s => s.label.includes(searchTerm)))
    );

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Cairo'] text-sm">
            {/* الشريط العلوي Top Navigation Bar */}
            <header className="h-16 bg-slate-900 border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md bg-opacity-90">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            if (window.innerWidth < 1024) {
                                setMobileOpen(!mobileOpen);
                            } else {
                                setSidebarOpen(!sidebarOpen);
                            }
                        }}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                        title="تبديل القائمة"
                    >
                        <Menu size={20} />
                    </button>

                    <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 font-black text-white text-base">
                            E
                        </div>
                        <div className="hidden sm:block">
                            <h1 className="text-sm font-bold text-white tracking-wide">نظام ERP المحاسبي المتكامل</h1>
                            <span className="text-sm text-blue-400 font-medium">Ultra Soft ERP Cloud v6</span>
                        </div>
                    </div>
                </div>

                {/* أزرار الإجراءات السريعة في الهيدر */}
                <div className="flex items-center gap-2 sm:gap-3">
                    <button className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-sm font-semibold transition">
                        <FileSpreadsheet size={16} />
                        <span>تصدير Excel</span>
                    </button>
                    <button className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 text-sm font-semibold transition">
                        <FileDown size={16} />
                        <span>تصدير PDF</span>
                    </button>
                    <div className="h-6 w-px bg-slate-800 mx-1 hidden sm:block"></div>

                    {/* المستخدم */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 pr-2 border-r border-slate-800">
                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm text-white">
                                مد
                            </div>
                            <div className="hidden lg:block text-right">
                                <p className="text-sm font-bold text-slate-200">مدير النظام</p>
                                <p className="text-sm text-emerald-400">السنة المالية 2026</p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* القائمة الجانبية Desktop Sidebar */}
                <aside
                    className={`bg-slate-900 border-l border-slate-800 transition-all duration-300 flex flex-col shrink-0 ${
                        sidebarOpen ? 'w-72' : 'w-20'
                    } hidden lg:flex`}
                >
                    {/* حقل البحث داخل القائمة */}
                    {sidebarOpen && (
                        <div className="p-3 border-b border-slate-800/80">
                            <div className="relative">
                                <Search className="absolute right-3 top-2.5 text-slate-500" size={16} />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="بحث في القائمة..."
                                    className="w-full bg-slate-950/60 border border-slate-800 rounded-lg pr-9 pl-3 py-1.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                                />
                            </div>
                        </div>
                    )}

                    {/* قائمة الوحدات المفعّلة وقوائمها الفرعية */}
                    <nav className="flex-1 overflow-y-auto p-2 space-y-1.5 scrollbar-thin">
                        {filteredMenu.map((item) => {
                            const Icon = iconMap[item.icon] || LayoutDashboard;
                            const hasChildren = item.children && item.children.length > 0;
                            const isChildActive = hasChildren && item.children.some(c => url === c.href);
                            const isActive = url === item.href || isChildActive;
                            const isOpen = openSubmenus[item.key] ?? isChildActive;

                            return (
                                <div key={item.key} className="space-y-1">
                                    <div
                                        onClick={() => {
                                            if (hasChildren && sidebarOpen) {
                                                toggleSubmenu(item.key);
                                            }
                                        }}
                                        className={`group relative flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 cursor-pointer ${
                                            isActive
                                                ? 'bg-gradient-to-r from-blue-700 to-blue-600 text-white shadow-lg shadow-blue-700/25 border-r-4 border-sky-300'
                                                : 'text-slate-300 hover:bg-gradient-to-r hover:from-slate-800 hover:to-blue-950/40 hover:text-white'
                                        }`}
                                    >
                                        <Link
                                            href={hasChildren ? '#' : item.href}
                                            onClick={(e) => {
                                                if (hasChildren) e.preventDefault();
                                            }}
                                            className="flex items-center gap-3 flex-1 overflow-hidden"
                                        >
                                            <div className={`p-1.5 rounded-lg ${isActive ? 'bg-white/10' : 'bg-slate-800/80 group-hover:bg-blue-600/20 text-blue-400 group-hover:text-blue-300'}`}>
                                                <Icon size={20} />
                                            </div>
                                            {sidebarOpen && (
                                                <span className="truncate text-sm font-bold">{item.label}</span>
                                            )}
                                        </Link>

                                        {sidebarOpen && hasChildren && (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleSubmenu(item.key);
                                                }}
                                                className="text-slate-400 group-hover:text-white"
                                            >
                                                {isOpen ? <ChevronDown size={16} /> : <ChevronLeft size={16} />}
                                            </button>
                                        )}
                                    </div>

                                    {/* القوائم الفرعية */}
                                    {sidebarOpen && hasChildren && isOpen && (
                                        <div className="pr-8 pl-2 py-1 space-y-1 border-r border-slate-800/80 mr-4">
                                            {item.children.map((sub) => {
                                                const subActive = url === sub.href;
                                                return (
                                                    <Link
                                                        key={sub.key}
                                                        href={sub.href}
                                                        className={`block px-3 py-1.5 rounded-lg text-sm transition ${
                                                            subActive
                                                                ? 'bg-blue-600/30 text-blue-300 font-bold border border-blue-500/30'
                                                                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                                                        }`}
                                                    >
                                                        {sub.label}
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </nav>

                    {/* فوتر القائمة الجانبية */}
                    <div className="p-3 border-t border-slate-800/80 text-center">
                        {sidebarOpen ? (
                            <div className="text-sm text-slate-500">
                                <p className="font-semibold text-slate-400">ERP System v6.0</p>
                                <p>متوافق مع المعايير المحاسبية</p>
                            </div>
                        ) : (
                            <span className="text-sm text-blue-400 font-bold">ERP</span>
                        )}
                    </div>
                </aside>

                {/* المحتوى الرئيسي Main Content Area */}
                <main className="flex-1 overflow-y-auto bg-slate-950 p-4 sm:p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
