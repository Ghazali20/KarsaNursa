import { Link, router, usePage } from '@inertiajs/react';
import {
    Bell,
    Briefcase,
    CheckCircle2,
    ChevronDown,
    Clock,
    History,
    Home,
    LayoutGrid,
    LogOut,
    Menu,
    Search,
    Settings,
    Wallet,
    X,
    XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type NavItem = {
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    matchPrefix?: string;
};

type WorkerNotificationItem = {
    id: string;
    type: 'accepted' | 'rejected' | 'proof' | 'paid';
    title: string;
    description: string;
    timeLabel: string;
    href: string;
};

const navItems: NavItem[] = [
    {
        label: 'Dashboard',
        href: '/worker/dashboard',
        icon: LayoutGrid,
    },
    {
        label: 'Cari Tugas & Lamar',
        href: '/worker/tasks',
        icon: Search,
        matchPrefix: '/worker/tasks',
    },
    {
        label: 'Tugas Aktif',
        href: '/worker/applications',
        icon: Clock,
        matchPrefix: '/worker/applications',
    },
    {
        label: 'Pendapatan',
        href: '/worker/earnings',
        icon: Wallet,
        matchPrefix: '/worker/earnings',
    },
    {
        label: 'Riwayat Kerja',
        href: '/worker/history',
        icon: History,
        matchPrefix: '/worker/history',
    },
];

function getInitials(name: string): string {
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('');
}

function NotificationIcon({ type }: { type: WorkerNotificationItem['type'] }) {
    if (type === 'paid') {
        return (
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <Wallet className="size-4" />
            </div>
        );
    }
    if (type === 'accepted') {
        return (
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[#1E4479]">
                <CheckCircle2 className="size-4" />
            </div>
        );
    }
    if (type === 'rejected') {
        return (
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                <XCircle className="size-4" />
            </div>
        );
    }
    return (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <Clock className="size-4" />
        </div>
    );
}

export default function WorkerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const page = usePage();
    const pageProps = page.props as {
        auth: { user: { id?: number; name: string; email?: string } };
        workerNotifications?: WorkerNotificationItem[];
    };
    const user = pageProps.auth.user;
    const notifications = pageProps.workerNotifications ?? [];
    const currentUrl = page.url;

    const readStorageKey = `karsanusa_read_notifs_${user?.id ?? 'guest'}`;

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [readIds, setReadIds] = useState<string[]>(() => {
        if (typeof window === 'undefined') return [];
        try {
            const raw = window.localStorage.getItem(readStorageKey);
            const parsed = raw ? JSON.parse(raw) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    });

    useEffect(() => {
        try {
            window.localStorage.setItem(
                readStorageKey,
                JSON.stringify(readIds),
            );
        } catch {
            // Abaikan error penyimpanan browser
        }
    }, [readIds, readStorageKey]);

    const unreadCount = useMemo(
        () => notifications.filter((item) => !readIds.includes(item.id)).length,
        [notifications, readIds],
    );

    const markAllAsRead = () => {
        const allIds = notifications.map((item) => item.id);
        setReadIds((prev) => Array.from(new Set([...prev, ...allIds])));
    };

    const markSingleAsRead = (id: string) => {
        setReadIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
        setNotifOpen(false);
    };

    const isActive = (item: NavItem, index: number) => {
        if (index === 0) {
            return currentUrl === '/worker/dashboard';
        }
        if (index === 1) {
            return currentUrl.startsWith('/worker/tasks');
        }
        if (index === 2) {
            return currentUrl.startsWith('/worker/applications');
        }
        if (index === 3) {
            return currentUrl.startsWith('/worker/earnings');
        }
        if (index === 4) {
            return currentUrl.startsWith('/worker/history');
        }
        return false;
    };

    const handleLogout = () => {
        router.post('/logout');
    };

    return (
        <div className="flex min-h-screen bg-[#F8FAFC] text-slate-900">
            {/* OVERLAY MOBILE */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* SIDEBAR */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200/80 bg-white transition-transform duration-200 lg:static lg:translate-x-0 ${
                    mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                {/* LOGO BRAND */}
                <div className="flex items-center justify-between px-6 pt-6 pb-5">
                    <Link
                        href="/worker/dashboard"
                        className="flex flex-col items-start gap-1"
                    >
                        <div className="flex items-center gap-2.5">
                            <div className="flex size-9 items-center justify-center rounded-xl bg-[#1E4479] text-white shadow-xs">
                                <Briefcase className="size-5" />
                            </div>
                            <span className="text-lg font-extrabold tracking-tight text-[#1E4479]">
                                karsa Nusa
                            </span>
                        </div>
                    </Link>

                    <button
                        type="button"
                        onClick={() => setMobileMenuOpen(false)}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
                        aria-label="Tutup menu"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                {/* SECTION TITLE */}
                <div className="px-6 pt-2 pb-2">
                    <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                        Dashboard Pekerja
                    </p>
                </div>

                {/* MENU NAVIGASI */}
                <nav className="flex-1 space-y-1.5 px-4 py-2">
                    {navItems.map((item, idx) => {
                        const Icon = item.icon;
                        const active = isActive(item, idx);

                        return (
                            <Link
                                key={item.label}
                                href={item.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                                    active
                                        ? 'bg-[#1E4479] text-white shadow-sm'
                                        : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                                }`}
                            >
                                <Icon
                                    className={`size-4.5 shrink-0 ${
                                        active ? 'text-white' : 'text-slate-500'
                                    }`}
                                />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* FOOTER SIDEBAR */}
                <div className="border-t border-slate-100 p-4">
                    <Link
                        href="/"
                        className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                    >
                        <Home className="size-4.5 shrink-0 text-slate-400" />
                        <span>Kembali ke Beranda</span>
                    </Link>
                </div>
            </aside>

            {/* MAIN CONTENT WRAPPER */}
            <div className="flex min-w-0 flex-1 flex-col">
                {/* TOP HEADER */}
                <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-xs sm:px-8">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setMobileMenuOpen(true)}
                            className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 lg:hidden"
                            aria-label="Buka menu"
                        >
                            <Menu className="size-5" />
                        </button>

                        <div>
                            <p className="text-xs font-medium text-slate-400">
                                Dashboard Pekerja
                            </p>
                            <h2 className="text-sm font-bold text-slate-900 sm:text-base">
                                Temukan peluang di dekatmu
                            </h2>
                        </div>
                    </div>

                    {/* KANAN: NOTIFIKASI & PROFIL */}
                    <div className="flex items-center gap-3 sm:gap-5">
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => {
                                    setNotifOpen((prev) => !prev);
                                    setProfileMenuOpen(false);
                                }}
                                className="relative flex size-10 items-center justify-center rounded-full border border-slate-200/80 bg-white text-slate-600 transition hover:bg-slate-50"
                                aria-label="Notifikasi"
                            >
                                <Bell className="size-4.5" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-2 right-2 size-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
                                )}
                            </button>

                            {notifOpen && (
                                <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl sm:w-96">
                                    <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-extrabold text-slate-900">
                                                Notifikasi
                                            </span>
                                            {unreadCount > 0 && (
                                                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-600">
                                                    {unreadCount} baru
                                                </span>
                                            )}
                                        </div>
                                        {unreadCount > 0 && (
                                            <button
                                                type="button"
                                                onClick={markAllAsRead}
                                                className="text-xs font-semibold text-[#1E4479] hover:underline"
                                            >
                                                Tandai dibaca
                                            </button>
                                        )}
                                    </div>

                                    <div className="max-h-80 divide-y divide-slate-100 overflow-y-auto py-1">
                                        {notifications.length === 0 ? (
                                            <div className="px-4 py-8 text-center">
                                                <p className="text-xs font-bold text-slate-700">
                                                    Belum ada notifikasi
                                                </p>
                                                <p className="mt-1 text-[11px] text-slate-400">
                                                    Update lamaran, bukti kerja,
                                                    dan pembayaran upah akan
                                                    muncul di sini.
                                                </p>
                                            </div>
                                        ) : (
                                            notifications.map((notif) => {
                                                const isUnread =
                                                    !readIds.includes(notif.id);
                                                return (
                                                    <Link
                                                        key={notif.id}
                                                        href={notif.href}
                                                        onClick={() =>
                                                            markSingleAsRead(
                                                                notif.id,
                                                            )
                                                        }
                                                        className={`flex items-start gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-slate-50 ${
                                                            isUnread
                                                                ? 'bg-blue-50/40'
                                                                : ''
                                                        }`}
                                                    >
                                                        <NotificationIcon
                                                            type={notif.type}
                                                        />
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center justify-between gap-2">
                                                                <p className="truncate text-xs font-bold text-slate-900">
                                                                    {
                                                                        notif.title
                                                                    }
                                                                </p>
                                                                {isUnread && (
                                                                    <span className="size-2 shrink-0 rounded-full bg-rose-500" />
                                                                )}
                                                            </div>
                                                            <p className="mt-0.5 line-clamp-2 text-[11px] text-slate-500">
                                                                {
                                                                    notif.description
                                                                }
                                                            </p>
                                                            <p className="mt-1 text-[10px] font-medium text-slate-400">
                                                                {
                                                                    notif.timeLabel
                                                                }
                                                            </p>
                                                        </div>
                                                    </Link>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="h-7 w-px bg-slate-200" />

                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => {
                                    setProfileMenuOpen((prev) => !prev);
                                    setNotifOpen(false);
                                }}
                                className="flex items-center gap-3 rounded-xl py-1.5 pr-2 pl-1.5 text-left transition hover:bg-slate-50"
                            >
                                <div className="flex size-10 items-center justify-center rounded-full bg-[#E6EEF8] text-xs font-bold text-[#1E4479]">
                                    {getInitials(user.name)}
                                </div>
                                <div className="hidden sm:block">
                                    <p className="text-sm leading-tight font-bold text-slate-900">
                                        {user.name}
                                    </p>
                                    <p className="mt-0.5 text-xs text-slate-400">
                                        Mitra Lokal
                                    </p>
                                </div>
                                <ChevronDown className="size-4 text-slate-400" />
                            </button>

                            {profileMenuOpen && (
                                <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-lg">
                                    <Link
                                        href="/settings/profile"
                                        onClick={() =>
                                            setProfileMenuOpen(false)
                                        }
                                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                                    >
                                        <Settings className="size-4 text-slate-500" />
                                        Pengaturan Profil
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={handleLogout}
                                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50"
                                    >
                                        <LogOut className="size-4" />
                                        Keluar
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* ISI HALAMAN */}
                <div className="flex-1">{children}</div>
            </div>
        </div>
    );
}
