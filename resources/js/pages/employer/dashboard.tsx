import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    ArrowUpRight,
    Bell,
    Briefcase,
    CheckCircle2,
    ChevronDown,
    ClipboardPlus,
    Clock,
    House,
    LayoutGrid,
    LogOut,
    Menu,
    Receipt,
    ShieldAlert,
    ShieldCheck,
    Star,
    TrendingDown,
    TrendingUp,
    UserRound,
    Users,
    WalletCards,
    X,
} from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';

import karsaNusaLogo from '@/assets/karsanusa-logo.png';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// ==========================================
// TIPE DATA DASHBOARD UMKM
// ==========================================

export type RecentTask = {
    id: number;
    title: string;
    category: string | null;
    status: string;
    workerQuota: number | null;
    wageAmount: number | null;
};

export type ChartMonthItem = {
    month: string;
    fullMonth: string;
    amount: number;
    active: boolean;
    heightPercent: number;
    label: string;
};

export type RecentApplicant = {
    id: number;
    taskId: number;
    taskTitle: string;
    name: string;
    email: string;
    initials: string;
    verified: boolean;
    rating: string;
    reviewsCount: number;
    completedTasks: number;
    appliedAt: string;
};

export type LedgerTransaction = {
    id: number;
    code: string;
    taskTitle: string;
    workerName: string;
    workerInitials: string;
    date: string;
    shortDate: string;
    hours: string;
    wage: number;
    status: string;
    period: string;
};

export type EmployerDashboardProps = {
    user?: {
        name: string;
        email: string;
        isVerified: boolean;
        verificationStatus: string;
        businessName: string;
        businessCategory?: string | null;
    };
    stats?: {
        activeTasks: number;
        pendingApplicants: number;
        completedThisMonth: number;
        completedPercentageChange: number;
        monthlyExpenses: number;
        currentMonthName: string;
        lastMonthName: string;
        expensePercentageChange: number;
    };
    chartData?: {
        items: ChartMonthItem[];
        totalAmount: number;
        totalAmountFormatted: string;
        growthPercent: number;
    };
    taskDistribution?: {
        total: number;
        completed: { count: number; percent: number };
        inProgress: { count: number; percent: number };
        waiting: { count: number; percent: number };
        cancelled: { count: number; percent: number };
    };
    recentApplicants?: RecentApplicant[];
    recentTransactions?: LedgerTransaction[];
    recentTasks?: RecentTask[];
};

// ==========================================
// HELPER FORMATTING
// ==========================================

function formatFirstName(name: string): string {
    return name.trim().split(/\s+/)[0] ?? name;
}

function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'KN';
    return parts
        .slice(0, 2)
        .map((n) => n.charAt(0))
        .join('')
        .toUpperCase();
}

function formatRupiah(value: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(value);
}

function formatCompactRupiah(value: number): string {
    if (value >= 1_000_000_000) {
        const billions = (value / 1_000_000_000)
            .toFixed(2)
            .replace(/\.00$/, '');
        return `Rp ${billions.replace('.', ',')} M`;
    }
    if (value >= 1_000_000) {
        const millions = (value / 1_000_000).toFixed(2).replace(/\.00$/, '');
        return `Rp ${millions.replace('.', ',')} jt`;
    }
    return formatRupiah(value);
}

// ==========================================
// KOMPONEN UTAMA DASHBOARD UMKM
// ==========================================

export default function EmployerDashboard({
    user: propUser,
    stats,
    chartData,
    taskDistribution,
    recentApplicants = [],
    recentTransactions = [],
}: EmployerDashboardProps) {
    const pageAuth = usePage().props as unknown as {
        auth?: {
            user?: {
                name: string;
                email: string;
                role?: string;
                business?: { name?: string };
                verification_status?: string;
                [key: string]: unknown;
            };
        };
    };

    const authUser = pageAuth?.auth?.user;
    const userName = propUser?.name || authUser?.name || 'Pemilik UMKM';
    const userEmail = propUser?.email || authUser?.email || '';
    const firstName = formatFirstName(userName);
    const userInitials = getInitials(userName);
    const businessName =
        propUser?.businessName ||
        authUser?.business?.name ||
        `${firstName} Official Store`;
    const isVerified =
        propUser?.isVerified ?? authUser?.verification_status === 'approved';

    // Metrik dari Backend
    const activeTasks = stats?.activeTasks ?? 0;
    const pendingApplicants = stats?.pendingApplicants ?? 0;
    const completedThisMonth = stats?.completedThisMonth ?? 0;
    const completedChange = stats?.completedPercentageChange ?? 0;
    const monthlyExpenses = stats?.monthlyExpenses ?? 0;
    const currentMonthName = stats?.currentMonthName ?? 'Bulan Ini';
    const lastMonthName = stats?.lastMonthName ?? 'Bulan Lalu';
    const expenseChange = stats?.expensePercentageChange ?? 0;

    // State Lokal UI
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [chartPeriod, setChartPeriod] = useState('6 Bulan');
    const [applicantDecisions, setApplicantDecisions] = useState<
        Record<number, 'accepted' | 'rejected'>
    >({});
    const [processingId, setProcessingId] = useState<number | null>(null);

    // State Modal Penolakan Pelamar
    const [rejectTarget, setRejectTarget] = useState<RecentApplicant | null>(
        null,
    );
    const [rejectReason, setRejectReason] = useState(
        'Kualifikasi belum sesuai dengan kebutuhan tugas saat ini.',
    );
    const [rejectError, setRejectError] = useState<string | null>(null);

    // Handler Terima Pelamar (Sinkron ke API Backend)
    const handleAcceptApplicant = (applicant: RecentApplicant) => {
        if (processingId !== null) return;
        setProcessingId(applicant.id);

        router.patch(
            `/employer/tasks/${applicant.taskId}/applications/${applicant.id}/decision`,
            {
                decision: 'accepted',
                review_notes: null,
                return_to: 'inbox',
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setApplicantDecisions((prev) => ({
                        ...prev,
                        [applicant.id]: 'accepted',
                    }));
                    toast.success(
                        `Pelamar ${applicant.name} berhasil diterima!`,
                        {
                            description:
                                'Pemberitahuan telah diteruskan kepada pekerja.',
                        },
                    );
                    router.reload({
                        only: [
                            'stats',
                            'recentApplicants',
                            'taskDistribution',
                            'ledgerTransactions',
                            'recentTransactions',
                        ],
                    });
                },
                onError: (errors) => {
                    const errorMsg =
                        errors.application ||
                        errors.review_notes ||
                        'Gagal menerima pelamar. Silakan coba lagi.';
                    toast.error('Gagal Memproses Lamaran', {
                        description: String(errorMsg),
                    });
                },
                onFinish: () => {
                    setProcessingId(null);
                },
            },
        );
    };

    // Handler Tolak Pelamar (Sinkron ke API Backend dengan catatan)
    const handleConfirmReject = () => {
        if (!rejectTarget || processingId !== null) return;

        if (!rejectReason || rejectReason.trim().length < 5) {
            setRejectError('Alasan penolakan minimal 5 karakter.');
            return;
        }

        setProcessingId(rejectTarget.id);
        setRejectError(null);

        router.patch(
            `/employer/tasks/${rejectTarget.taskId}/applications/${rejectTarget.id}/decision`,
            {
                decision: 'rejected',
                review_notes: rejectReason.trim(),
                return_to: 'inbox',
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setApplicantDecisions((prev) => ({
                        ...prev,
                        [rejectTarget.id]: 'rejected',
                    }));
                    toast.error(`Lamaran dari ${rejectTarget.name} ditolak.`, {
                        description: 'Status lamaran telah diperbarui.',
                    });
                    setRejectTarget(null);
                    router.reload({
                        only: ['stats', 'recentApplicants', 'taskDistribution'],
                    });
                },
                onError: (errors) => {
                    const errorMsg =
                        errors.application ||
                        errors.review_notes ||
                        'Gagal menolak pelamar. Silakan coba lagi.';
                    setRejectError(String(errorMsg));
                },
                onFinish: () => {
                    setProcessingId(null);
                },
            },
        );
    };

    // Data Chart 6 Bulan Terakhir dari Backend
    const chartItems = chartData?.items ?? [
        {
            month: 'Bulan Ini',
            fullMonth: currentMonthName,
            amount: monthlyExpenses,
            active: true,
            heightPercent: monthlyExpenses > 0 ? 80 : 10,
            label: formatCompactRupiah(monthlyExpenses),
        },
    ];
    const chartTotal =
        chartData?.totalAmountFormatted ?? formatCompactRupiah(monthlyExpenses);
    const chartGrowth = chartData?.growthPercent ?? expenseChange;

    // Data Donut Chart dari Backend
    const donutTotal = taskDistribution?.total ?? 0;
    const pCompleted = taskDistribution?.completed.percent ?? 0;
    const pInProgress = taskDistribution?.inProgress.percent ?? 0;
    const pWaiting = taskDistribution?.waiting.percent ?? 0;
    const pCancelled = taskDistribution?.cancelled.percent ?? 0;

    return (
        <>
            <Head>
                <title>Dashboard UMKM - Karsa Nusa</title>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link
                    rel="preconnect"
                    href="https://fonts.gstatic.com"
                    crossOrigin="anonymous"
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
                    rel="stylesheet"
                />
            </Head>

            {/* WRAPPER UTAMA */}
            <div
                className="flex min-h-screen bg-[#F7F9FB] text-[#17233A] antialiased"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
                {/* ========================================================
                    1. SIDEBAR KIRI (DESKTOP & RESPONSIVE MOBILE DRAWER)
                ======================================================== */}
                {mobileMenuOpen && (
                    <div
                        className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
                        onClick={() => setMobileMenuOpen(false)}
                    />
                )}

                <aside
                    className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-[#DFE6ED] bg-white transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
                        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
                >
                    {/* Header Sidebar: Brand Logo */}
                    <div className="flex h-[72px] items-center justify-between border-b border-[#DFE6ED] px-6">
                        <Link
                            href="/employer/dashboard"
                            className="flex cursor-pointer items-center gap-2.5"
                        >
                            <img
                                src={karsaNusaLogo}
                                alt="Karsa Nusa"
                                className="h-7 w-auto object-contain"
                            />
                        </Link>

                        <button
                            type="button"
                            onClick={() => setMobileMenuOpen(false)}
                            className="rounded-lg p-1.5 text-[#607087] hover:bg-[#F7F9FB] lg:hidden"
                            aria-label="Tutup menu"
                        >
                            <X className="size-5" />
                        </button>
                    </div>

                    {/* Menu Navigasi Sidebar */}
                    <div className="flex flex-1 flex-col justify-between overflow-y-auto px-4 py-5">
                        <div>
                            <p className="px-3 text-[10px] font-bold tracking-[0.14em] text-[#93A2B5] uppercase">
                                DASHBOARD UMKM
                            </p>

                            <nav className="mt-3 space-y-1">
                                {/* Dashboard / Overview (AKTIF SOLID #21477F) */}
                                <Link
                                    href="/employer/dashboard"
                                    className="flex w-full items-center gap-3 rounded-xl bg-[#21477F] px-3.5 py-2.5 text-sm font-bold text-white transition-colors"
                                >
                                    <LayoutGrid className="size-4.5 text-white" />
                                    <span>Dashboard</span>
                                </Link>

                                {/* Buat Tugas */}
                                <Link
                                    href="/employer/tasks/create"
                                    className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-[#607087] transition-colors hover:bg-[#F7F9FB] hover:text-[#173765]"
                                >
                                    <ClipboardPlus className="size-4.5 text-[#607087]" />
                                    <span>Buat Tugas</span>
                                </Link>

                                {/* Kelola Pelamar */}
                                <Link
                                    href="/employer/applications"
                                    className="flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium text-[#607087] transition-colors hover:bg-[#F7F9FB] hover:text-[#173765]"
                                >
                                    <div className="flex items-center gap-3">
                                        <Users className="size-4.5 text-[#607087]" />
                                        <span>Kelola Pelamar</span>
                                    </div>
                                    {pendingApplicants > 0 && (
                                        <span className="rounded-full bg-[#FFF4E8] px-2 py-0.5 text-xs font-bold text-[#D98A48]">
                                            {pendingApplicants}
                                        </span>
                                    )}
                                </Link>

                                {/* Kelola Tugas */}
                                <Link
                                    href="/employer/tasks"
                                    className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-[#607087] transition-colors hover:bg-[#F7F9FB] hover:text-[#173765]"
                                >
                                    <Briefcase className="size-4.5 text-[#607087]" />
                                    <span>Kelola Tugas</span>
                                </Link>

                                {/* Buku Pengeluaran */}
                                <Link
                                    href="/employer/payments"
                                    className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-[#607087] transition-colors hover:bg-[#F7F9FB] hover:text-[#173765]"
                                >
                                    <WalletCards className="size-4.5 text-[#607087]" />
                                    <span>Buku Pengeluaran</span>
                                </Link>
                            </nav>
                        </div>

                        {/* Tombol Kembali ke Beranda */}
                        <div className="border-t border-[#DFE6ED] pt-4">
                            <Link
                                href="/"
                                className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-[#607087] transition-colors hover:bg-[#F7F9FB] hover:text-[#173765]"
                            >
                                <House className="size-4.5" />
                                <span>Kembali ke Beranda</span>
                            </Link>
                        </div>
                    </div>
                </aside>

                {/* ========================================================
                    KONTEN UTAMA (HEADER BAR + BODY)
                ======================================================== */}
                <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
                    {/* Top Header Bar */}
                    <header className="sticky top-0 z-30 flex h-[72px] shrink-0 items-center justify-between border-b border-[#DFE6ED] bg-white px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center gap-3 sm:gap-4">
                            <button
                                type="button"
                                onClick={() => setMobileMenuOpen(true)}
                                className="rounded-lg p-2 text-[#607087] hover:bg-[#F7F9FB] lg:hidden"
                                aria-label="Buka menu navigasi"
                            >
                                <Menu className="size-5" />
                            </button>

                            <div>
                                <p className="text-[11px] font-medium text-[#93A2B5]">
                                    Dashboard UMKM
                                </p>
                                <h2 className="text-sm font-bold text-[#17233A] sm:text-base">
                                    Kelola operasional usahamu
                                </h2>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 sm:gap-4">
                            <Link
                                href="/employer/applications"
                                className="relative flex size-10 items-center justify-center rounded-xl text-[#607087] transition hover:bg-[#F7F9FB] hover:text-[#17233A]"
                                aria-label="Notifikasi"
                            >
                                <Bell className="size-5" />
                                {pendingApplicants > 0 && (
                                    <span className="absolute top-2 right-2 size-2 rounded-full bg-[#D98A48]" />
                                )}
                            </Link>

                            <div className="h-7 w-px bg-[#DFE6ED]" />

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        type="button"
                                        className="flex items-center gap-2.5 rounded-xl p-1.5 transition hover:bg-[#F7F9FB] focus-visible:outline-2 focus-visible:outline-[#173765]"
                                    >
                                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#D8F1F6] text-xs font-bold text-[#173765]">
                                            {userInitials}
                                        </div>

                                        <div className="hidden text-left sm:block">
                                            <p className="max-w-[140px] truncate text-xs font-bold text-[#17233A]">
                                                {userName}
                                            </p>
                                            <div className="flex items-center gap-1 text-[11px] text-[#607087]">
                                                <span className="max-w-[120px] truncate">
                                                    {businessName}
                                                </span>
                                                <ChevronDown className="size-3.5 text-[#93A2B5]" />
                                            </div>
                                        </div>
                                    </button>
                                </DropdownMenuTrigger>

                                <DropdownMenuContent
                                    align="end"
                                    sideOffset={8}
                                    className="w-56 rounded-xl border border-[#DFE6ED] bg-white p-1.5 shadow-lg"
                                >
                                    <div className="mb-1 border-b border-[#DFE6ED] px-3 py-2 sm:hidden">
                                        <p className="text-xs font-bold text-[#17233A]">
                                            {userName}
                                        </p>
                                        <p className="text-[11px] text-[#607087]">
                                            {businessName}
                                        </p>
                                    </div>

                                    <DropdownMenuItem asChild>
                                        <Link
                                            href="/settings/profile"
                                            className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-[#17233A] hover:bg-[#F7F9FB]"
                                        >
                                            <UserRound className="size-4 text-[#607087]" />
                                            <span>Profil Usaha</span>
                                        </Link>
                                    </DropdownMenuItem>

                                    <DropdownMenuItem asChild>
                                        <Link
                                            href="/employer/tasks"
                                            className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-[#17233A] hover:bg-[#F7F9FB]"
                                        >
                                            <Briefcase className="size-4 text-[#607087]" />
                                            <span>Daftar Tugas</span>
                                        </Link>
                                    </DropdownMenuItem>

                                    <DropdownMenuSeparator className="my-1 bg-[#DFE6ED]" />

                                    <DropdownMenuItem asChild>
                                        <Link
                                            href="/logout"
                                            method="post"
                                            as="button"
                                            className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-[#EF4444] hover:bg-red-50"
                                        >
                                            <LogOut className="size-4 text-[#EF4444]" />
                                            <span>Keluar Akun</span>
                                        </Link>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </header>

                    {/* ========================================================
                        KONTEN UTAMA (DASHBOARD OVERVIEW)
                    ======================================================== */}
                    <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                        {/* HERO GREETING SECTION */}
                        <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                            <div>
                                {isVerified ? (
                                    <div className="inline-flex items-center gap-1.5 rounded-full border border-[#D8F1F6] bg-[#F0F8FB] px-3 py-1 text-xs font-bold text-[#173765]">
                                        <ShieldCheck className="size-3.5 text-[#173765]" />
                                        <span>Usaha Terverifikasi</span>
                                    </div>
                                ) : (
                                    <div className="inline-flex items-center gap-1.5 rounded-full border border-[#FFE8D1] bg-[#FFF4E8] px-3 py-1 text-xs font-bold text-[#D98A48]">
                                        <ShieldAlert className="size-3.5 text-[#D98A48]" />
                                        <span>Menunggu Verifikasi</span>
                                    </div>
                                )}

                                <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#17233A] sm:text-3xl">
                                    Selamat datang, {firstName}!
                                </h1>

                                <p className="mt-1 text-sm text-[#607087]">
                                    Berikut ringkasan operasional{' '}
                                    <strong className="font-semibold text-[#17233A]">
                                        {businessName}
                                    </strong>{' '}
                                    hari ini.
                                </p>
                            </div>

                            <Link
                                href="/employer/tasks/create"
                                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#173765] px-5 py-2.5 text-sm font-bold text-white shadow-xs transition hover:bg-[#21477F]"
                            >
                                <ClipboardPlus className="size-4" />
                                <span>Buat Tugas Baru +</span>
                            </Link>
                        </section>

                        {/* 4 KARTU RINGKASAN KPI */}
                        <section
                            aria-label="Ringkasan KPI"
                            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
                        >
                            {/* Kartu 1: Tugas Aktif */}
                            <div className="rounded-2xl border border-[#DFE6ED] bg-white p-5 shadow-xs transition hover:border-[#BFE7EF]">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-semibold text-[#607087]">
                                        Tugas aktif
                                    </p>
                                    <div className="flex size-9 items-center justify-center rounded-xl bg-[#F0F8FB] text-[#173765]">
                                        <Briefcase className="size-4.5" />
                                    </div>
                                </div>
                                <p className="mt-2 text-3xl font-extrabold text-[#17233A]">
                                    {activeTasks}
                                </p>
                                <p className="mt-3 flex items-center gap-1 text-xs text-[#93A2B5]">
                                    <span
                                        className={`size-1.5 rounded-full ${activeTasks > 0 ? 'bg-[#55BDD3]' : 'bg-[#DFE6ED]'}`}
                                    />
                                    {activeTasks > 0
                                        ? 'Sedang menerima pekerja'
                                        : 'Belum ada tugas aktif'}
                                </p>
                            </div>

                            {/* Kartu 2: Pelamar Baru */}
                            <div className="rounded-2xl border border-[#DFE6ED] bg-white p-5 shadow-xs transition hover:border-[#D98A48]/40">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-semibold text-[#607087]">
                                        Pelamar baru
                                    </p>
                                    <div className="flex size-9 items-center justify-center rounded-xl bg-[#FFF4E8] text-[#D98A48]">
                                        <Users className="size-4.5" />
                                    </div>
                                </div>
                                <p className="mt-2 text-3xl font-extrabold text-[#17233A]">
                                    {pendingApplicants}
                                </p>
                                <p className="mt-3 flex items-center gap-1 text-xs font-semibold text-[#D98A48]">
                                    <span
                                        className={`size-1.5 rounded-full ${pendingApplicants > 0 ? 'bg-[#D98A48]' : 'bg-[#DFE6ED]'}`}
                                    />
                                    {pendingApplicants > 0
                                        ? 'Perlu tinjauan seleksi'
                                        : 'Semua pelamar tertinjau'}
                                </p>
                            </div>

                            {/* Kartu 3: Selesai Bulan Ini */}
                            <div className="rounded-2xl border border-[#DFE6ED] bg-white p-5 shadow-xs transition hover:border-[#BFE7EF]">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-semibold text-[#607087]">
                                        Selesai bulan ini
                                    </p>
                                    <div className="flex size-9 items-center justify-center rounded-xl bg-[#F0F8FB] text-[#173765]">
                                        <CheckCircle2 className="size-4.5" />
                                    </div>
                                </div>
                                <p className="mt-2 text-3xl font-extrabold text-[#17233A]">
                                    {completedThisMonth}
                                </p>
                                <div className="mt-3 flex items-center gap-1.5">
                                    <span className="inline-flex items-center gap-0.5 rounded-md bg-[#F0F8FB] px-1.5 py-0.5 text-xs font-bold text-[#173765]">
                                        {completedChange >= 0 ? (
                                            <TrendingUp className="size-3 text-[#173765]" />
                                        ) : (
                                            <TrendingDown className="size-3 text-[#EF4444]" />
                                        )}
                                        {completedChange >= 0
                                            ? `+${completedChange}%`
                                            : `${completedChange}%`}
                                    </span>
                                    <span className="text-xs text-[#93A2B5]">
                                        dari bulan lalu
                                    </span>
                                </div>
                            </div>

                            {/* Kartu 4: Biaya Tenaga Kerja (Dark Card #0D2445) */}
                            <div className="relative overflow-hidden rounded-2xl bg-[#0D2445] p-5 text-white shadow-md">
                                <div className="pointer-events-none absolute -top-12 -right-12 size-32 rounded-full bg-[#21477F]/30 blur-xl" />

                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-semibold text-white/80">
                                        Biaya tenaga kerja
                                    </p>
                                    <div className="flex size-9 items-center justify-center rounded-xl bg-white/10 text-white">
                                        <WalletCards className="size-4.5" />
                                    </div>
                                </div>
                                <p className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                                    {formatCompactRupiah(monthlyExpenses)}
                                </p>
                                <p className="mt-3 flex items-center gap-1.5 text-xs text-white/70">
                                    <Clock className="size-3.5 text-white/60" />
                                    Periode {currentMonthName}
                                </p>
                            </div>
                        </section>

                        {/* SECTION GRAFIK & STATISTIK */}
                        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                            {/* Grafik Pengeluaran Tenaga Kerja (6 Bulan Terakhir) */}
                            <div className="rounded-2xl border border-[#DFE6ED] bg-white p-6 shadow-xs lg:col-span-2">
                                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                                    <div>
                                        <h3 className="text-base font-bold text-[#17233A]">
                                            Pengeluaran tenaga kerja
                                        </h3>
                                        <p className="text-xs text-[#607087]">
                                            Ringkasan biaya operasional 6 bulan
                                            terakhir
                                        </p>
                                    </div>

                                    <div className="relative">
                                        <select
                                            value={chartPeriod}
                                            onChange={(e) =>
                                                setChartPeriod(e.target.value)
                                            }
                                            className="cursor-pointer appearance-none rounded-lg border border-[#DFE6ED] bg-white px-3 py-1.5 pr-8 text-xs font-semibold text-[#17233A] shadow-xs hover:bg-[#F7F9FB] focus:outline-none"
                                        >
                                            <option value="6 Bulan">
                                                6 Bulan Terakhir
                                            </option>
                                        </select>
                                        <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-[#607087]" />
                                    </div>
                                </div>

                                <div className="mt-4 flex flex-wrap items-baseline justify-between gap-4 border-b border-[#DFE6ED] pb-4">
                                    <div className="flex items-baseline gap-2.5">
                                        <span className="text-2xl font-extrabold text-[#17233A]">
                                            {chartTotal}
                                        </span>
                                        <span className="inline-flex items-center gap-0.5 rounded-full bg-[#D8F1F6] px-2 py-0.5 text-xs font-bold text-[#173765]">
                                            {chartGrowth >= 0 ? (
                                                <ArrowUpRight className="size-3" />
                                            ) : (
                                                <TrendingDown className="size-3" />
                                            )}
                                            {chartGrowth >= 0
                                                ? `+${chartGrowth}%`
                                                : `${chartGrowth}%`}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 text-xs text-[#607087]">
                                        <span className="size-2.5 rounded-sm bg-[#173765]" />
                                        <span>Biaya upah</span>
                                    </div>
                                </div>

                                <div className="mt-6 pt-2">
                                    <div className="flex h-52 items-end justify-between gap-2 px-2 sm:gap-6 sm:px-4">
                                        {chartItems.map((item) => (
                                            <div
                                                key={item.month}
                                                className="group relative flex h-full flex-1 flex-col items-center justify-end"
                                            >
                                                {item.active && (
                                                    <div className="mb-2 flex flex-col items-center">
                                                        <div className="rounded-md bg-[#0D2445] px-2.5 py-1 text-[11px] font-bold whitespace-nowrap text-white shadow-md">
                                                            {item.label}
                                                        </div>
                                                        <div className="-mt-0.5 size-1.5 rotate-45 bg-[#0D2445]" />
                                                    </div>
                                                )}

                                                <div className="flex h-full w-full max-w-[42px] items-end rounded-t-lg bg-[#F7F9FB]">
                                                    <div
                                                        style={{
                                                            height: `${item.heightPercent}%`,
                                                        }}
                                                        className={`w-full rounded-t-lg transition-all duration-300 ${
                                                            item.active
                                                                ? 'bg-[#173765]'
                                                                : 'bg-[#BFE7EF] hover:bg-[#7DD3E3]'
                                                        }`}
                                                    />
                                                </div>

                                                <span
                                                    className={`mt-2 text-xs font-semibold ${
                                                        item.active
                                                            ? 'font-bold text-[#173765]'
                                                            : 'text-[#93A2B5]'
                                                    }`}
                                                >
                                                    {item.month}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Status Tugas (Donut Chart) */}
                            <div className="flex flex-col justify-between rounded-2xl border border-[#DFE6ED] bg-white p-6 shadow-xs">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-base font-bold text-[#17233A]">
                                            Status tugas
                                        </h3>
                                        <p className="text-xs text-[#607087]">
                                            Distribusi bulan ini
                                        </p>
                                    </div>
                                </div>

                                <div className="my-6 flex flex-col items-center justify-center">
                                    <div className="relative flex size-36 items-center justify-center">
                                        <svg
                                            className="size-full -rotate-90"
                                            viewBox="0 0 36 36"
                                        >
                                            {donutTotal === 0 ? (
                                                <circle
                                                    cx="18"
                                                    cy="18"
                                                    r="15"
                                                    fill="transparent"
                                                    stroke="#DFE6ED"
                                                    strokeWidth="4"
                                                />
                                            ) : (
                                                <>
                                                    {/* Selesai */}
                                                    {pCompleted > 0 && (
                                                        <circle
                                                            cx="18"
                                                            cy="18"
                                                            r="15"
                                                            fill="transparent"
                                                            stroke="#173765"
                                                            strokeWidth="4"
                                                            pathLength={100}
                                                            strokeDasharray={`${pCompleted} ${100 - pCompleted}`}
                                                            strokeDashoffset={0}
                                                        />
                                                    )}
                                                    {/* Berlangsung */}
                                                    {pInProgress > 0 && (
                                                        <circle
                                                            cx="18"
                                                            cy="18"
                                                            r="15"
                                                            fill="transparent"
                                                            stroke="#7DD3E3"
                                                            strokeWidth="4"
                                                            pathLength={100}
                                                            strokeDasharray={`${pInProgress} ${100 - pInProgress}`}
                                                            strokeDashoffset={
                                                                -pCompleted
                                                            }
                                                        />
                                                    )}
                                                    {/* Menunggu pekerja */}
                                                    {pWaiting > 0 && (
                                                        <circle
                                                            cx="18"
                                                            cy="18"
                                                            r="15"
                                                            fill="transparent"
                                                            stroke="#D98A48"
                                                            strokeWidth="4"
                                                            pathLength={100}
                                                            strokeDasharray={`${pWaiting} ${100 - pWaiting}`}
                                                            strokeDashoffset={
                                                                -(
                                                                    pCompleted +
                                                                    pInProgress
                                                                )
                                                            }
                                                        />
                                                    )}
                                                    {/* Dibatalkan */}
                                                    {pCancelled > 0 && (
                                                        <circle
                                                            cx="18"
                                                            cy="18"
                                                            r="15"
                                                            fill="transparent"
                                                            stroke="#DFE6ED"
                                                            strokeWidth="4"
                                                            pathLength={100}
                                                            strokeDasharray={`${pCancelled} ${100 - pCancelled}`}
                                                            strokeDashoffset={
                                                                -(
                                                                    pCompleted +
                                                                    pInProgress +
                                                                    pWaiting
                                                                )
                                                            }
                                                        />
                                                    )}
                                                </>
                                            )}
                                        </svg>

                                        <div className="absolute text-center">
                                            <span className="text-2xl font-extrabold text-[#17233A]">
                                                {donutTotal}
                                            </span>
                                            <p className="text-[10px] font-bold tracking-wider text-[#93A2B5] uppercase">
                                                Total tugas
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2.5 border-t border-[#DFE6ED] pt-2">
                                    <div className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2">
                                            <span className="size-2 rounded-full bg-[#173765]" />
                                            <span className="font-medium text-[#607087]">
                                                Selesai
                                            </span>
                                        </div>
                                        <span className="font-bold text-[#17233A]">
                                            {taskDistribution?.completed
                                                .count ?? 0}{' '}
                                            <span className="font-normal text-[#93A2B5]">
                                                ({pCompleted}%)
                                            </span>
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2">
                                            <span className="size-2 rounded-full bg-[#7DD3E3]" />
                                            <span className="font-medium text-[#607087]">
                                                Berlangsung
                                            </span>
                                        </div>
                                        <span className="font-bold text-[#17233A]">
                                            {taskDistribution?.inProgress
                                                .count ?? 0}{' '}
                                            <span className="font-normal text-[#93A2B5]">
                                                ({pInProgress}%)
                                            </span>
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2">
                                            <span className="size-2 rounded-full bg-[#D98A48]" />
                                            <span className="font-medium text-[#607087]">
                                                Menunggu pekerja
                                            </span>
                                        </div>
                                        <span className="font-bold text-[#17233A]">
                                            {taskDistribution?.waiting.count ??
                                                0}{' '}
                                            <span className="font-normal text-[#93A2B5]">
                                                ({pWaiting}%)
                                            </span>
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2">
                                            <span className="size-2 rounded-full bg-[#DFE6ED]" />
                                            <span className="font-medium text-[#607087]">
                                                Dibatalkan
                                            </span>
                                        </div>
                                        <span className="font-bold text-[#17233A]">
                                            {taskDistribution?.cancelled
                                                .count ?? 0}{' '}
                                            <span className="font-normal text-[#93A2B5]">
                                                ({pCancelled}%)
                                            </span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* SECTION PELAMAR PERLU DITINJAU */}
                        <section className="rounded-2xl border border-[#DFE6ED] bg-white p-6 shadow-xs">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-base font-bold text-[#17233A]">
                                        Pelamar perlu ditinjau
                                    </h3>
                                    <p className="text-xs text-[#607087]">
                                        Tinjau dan seleksi kandidat pekerja
                                        terbaik untuk tugas usahamu
                                    </p>
                                </div>

                                <Link
                                    href="/employer/applications"
                                    className="flex items-center gap-1 text-xs font-bold text-[#173765] hover:underline"
                                >
                                    <span>Lihat semua pelamar</span>
                                    <ArrowRight className="size-3.5" />
                                </Link>
                            </div>

                            <div className="mt-5 space-y-3">
                                {recentApplicants.length === 0 ? (
                                    <div className="rounded-xl border border-dashed border-[#DFE6ED] p-8 text-center">
                                        <div className="mx-auto flex size-11 items-center justify-center rounded-xl bg-[#F0F8FB] text-[#173765]">
                                            <Users className="size-5" />
                                        </div>
                                        <p className="mt-3 text-sm font-bold text-[#17233A]">
                                            Belum ada pelamar baru
                                        </p>
                                        <p className="mt-1 text-xs text-[#607087]">
                                            Lamaran yang masuk pada tugas
                                            aktifmu akan muncul di sini.
                                        </p>
                                    </div>
                                ) : (
                                    recentApplicants.map((applicant) => {
                                        const decision =
                                            applicantDecisions[applicant.id];
                                        const isProcessing =
                                            processingId === applicant.id;

                                        return (
                                            <div
                                                key={applicant.id}
                                                className="flex flex-col justify-between gap-4 rounded-xl border border-[#DFE6ED] bg-[#FFFFFF] p-4 transition hover:border-[#BFE7EF] sm:flex-row sm:items-center"
                                            >
                                                <div className="flex min-w-[240px] items-center gap-3.5">
                                                    <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#D8F1F6] text-sm font-bold text-[#173765]">
                                                        {applicant.initials}
                                                    </div>

                                                    <div>
                                                        <div className="flex items-center gap-1.5">
                                                            <h4 className="text-sm font-bold text-[#17233A]">
                                                                {applicant.name}
                                                            </h4>
                                                            {applicant.verified && (
                                                                <CheckCircle2 className="size-3.5 text-[#173765]" />
                                                            )}
                                                        </div>

                                                        <div className="mt-0.5 flex items-center gap-2 text-xs text-[#607087]">
                                                            <span className="flex items-center gap-1 font-semibold text-[#D98A48]">
                                                                <Star className="size-3 fill-[#D98A48] text-[#D98A48]" />
                                                                {
                                                                    applicant.rating
                                                                }
                                                            </span>
                                                            <span className="text-[#93A2B5]">
                                                                •
                                                            </span>
                                                            <span>
                                                                {
                                                                    applicant.completedTasks
                                                                }{' '}
                                                                tugas selesai
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <p className="text-[10px] font-bold tracking-wider text-[#93A2B5] uppercase">
                                                        MELAMAR UNTUK
                                                    </p>
                                                    <p className="mt-0.5 truncate text-xs font-semibold text-[#17233A] sm:text-sm">
                                                        {applicant.taskTitle}
                                                    </p>
                                                </div>

                                                <div className="flex shrink-0 items-center gap-2">
                                                    {decision ? (
                                                        <span
                                                            className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                                                                decision ===
                                                                'accepted'
                                                                    ? 'bg-[#D8F1F6] text-[#173765]'
                                                                    : 'bg-red-50 text-[#EF4444]'
                                                            }`}
                                                        >
                                                            {decision ===
                                                            'accepted'
                                                                ? 'Disetujui ✓'
                                                                : 'Ditolak ✕'}
                                                        </span>
                                                    ) : (
                                                        <>
                                                            <button
                                                                type="button"
                                                                disabled={
                                                                    isProcessing
                                                                }
                                                                onClick={() => {
                                                                    setRejectTarget(
                                                                        applicant,
                                                                    );
                                                                    setRejectError(
                                                                        null,
                                                                    );
                                                                }}
                                                                className="cursor-pointer rounded-lg px-3.5 py-1.5 text-xs font-semibold text-[#607087] transition hover:bg-red-50 hover:text-[#EF4444] disabled:opacity-50"
                                                            >
                                                                Tolak
                                                            </button>

                                                            <button
                                                                type="button"
                                                                disabled={
                                                                    isProcessing
                                                                }
                                                                onClick={() =>
                                                                    handleAcceptApplicant(
                                                                        applicant,
                                                                    )
                                                                }
                                                                className="cursor-pointer rounded-lg bg-[#173765] px-4 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#21477F] disabled:opacity-50"
                                                            >
                                                                {isProcessing
                                                                    ? 'Memproses...'
                                                                    : 'Terima'}
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </section>

                        {/* SECTION BUKU PENGELUARAN OTOMATIS (RINGKAS) */}
                        <section
                            id="buku-pengeluaran"
                            className="scroll-mt-24 rounded-2xl border border-[#DFE6ED] bg-white p-6 shadow-xs"
                        >
                            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                                <div>
                                    <h3 className="text-base font-bold text-[#17233A]">
                                        Buku pengeluaran otomatis
                                    </h3>
                                    <p className="text-xs text-[#607087]">
                                        Pencatatan real-time upah tenaga kerja
                                        yang telah diverifikasi
                                    </p>
                                </div>

                                <Link
                                    href="/employer/payments"
                                    className="inline-flex w-fit cursor-pointer items-center gap-1.5 rounded-lg border border-[#DFE6ED] px-3.5 py-1.5 text-xs font-bold text-[#173765] transition hover:bg-[#F7F9FB]"
                                >
                                    <span>Lihat Buku Lengkap</span>
                                    <ArrowRight className="size-3.5" />
                                </Link>
                            </div>

                            <div className="mt-5 overflow-x-auto">
                                {recentTransactions.length === 0 ? (
                                    <div className="rounded-xl border border-dashed border-[#DFE6ED] p-8 text-center">
                                        <div className="mx-auto flex size-11 items-center justify-center rounded-xl bg-[#F0F8FB] text-[#173765]">
                                            <Receipt className="size-5" />
                                        </div>
                                        <p className="mt-3 text-sm font-bold text-[#17233A]">
                                            Belum ada transaksi upah tercatat
                                        </p>
                                        <p className="mt-1 text-xs text-[#607087]">
                                            Pembayaran upah yang telah selesai
                                            dicatat akan tampil di sini.
                                        </p>
                                    </div>
                                ) : (
                                    <table className="w-full border-collapse text-left">
                                        <thead>
                                            <tr className="border-b border-[#DFE6ED] bg-[#F7F9FB] text-[11px] font-bold tracking-wider text-[#93A2B5] uppercase">
                                                <th className="rounded-l-lg px-4 py-3">
                                                    ID & TUGAS
                                                </th>
                                                <th className="px-4 py-3">
                                                    PEKERJA
                                                </th>
                                                <th className="px-4 py-3">
                                                    TANGGAL
                                                </th>
                                                <th className="px-4 py-3">
                                                    JAM KERJA
                                                </th>
                                                <th className="px-4 py-3">
                                                    UPAH
                                                </th>
                                                <th className="rounded-r-lg px-4 py-3">
                                                    STATUS
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody className="divide-y divide-[#DFE6ED] text-xs">
                                            {recentTransactions.map((row) => (
                                                <tr
                                                    key={row.id}
                                                    className="transition-colors hover:bg-[#F7F9FB]/60"
                                                >
                                                    <td className="px-4 py-3.5">
                                                        <span className="block font-mono text-[10px] text-[#93A2B5]">
                                                            {row.code}
                                                        </span>
                                                        <span className="font-bold text-[#17233A]">
                                                            {row.taskTitle}
                                                        </span>
                                                    </td>

                                                    <td className="px-4 py-3.5">
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex size-7 items-center justify-center rounded-full bg-[#D8F1F6] text-[10px] font-bold text-[#173765]">
                                                                {
                                                                    row.workerInitials
                                                                }
                                                            </div>
                                                            <span className="font-semibold text-[#17233A]">
                                                                {row.workerName}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    <td className="px-4 py-3.5 text-[#607087]">
                                                        {row.date}
                                                    </td>

                                                    <td className="px-4 py-3.5 text-[#607087]">
                                                        {row.hours}
                                                    </td>

                                                    <td className="px-4 py-3.5 font-bold text-[#17233A]">
                                                        {formatRupiah(row.wage)}
                                                    </td>

                                                    <td className="px-4 py-3.5">
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-[#D8F1F6] px-2.5 py-1 text-xs font-bold text-[#173765]">
                                                            <CheckCircle2 className="size-3 text-[#173765]" />
                                                            {row.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </section>
                    </main>
                </div>
            </div>

            {/* MODAL PENOLAKAN PELAMAR */}
            {rejectTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
                    <div className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-xl">
                        <div className="flex items-center justify-between border-b border-[#DFE6ED] pb-3">
                            <h3 className="text-base font-bold text-[#17233A]">
                                Tolak Lamaran Pekerja
                            </h3>
                            <button
                                type="button"
                                onClick={() => {
                                    setRejectTarget(null);
                                    setRejectError(null);
                                }}
                                className="rounded-lg p-1 text-[#607087] hover:bg-[#F7F9FB]"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        <div>
                            <p className="text-xs text-[#607087]">
                                Anda akan menolak lamaran dari{' '}
                                <strong className="text-[#17233A]">
                                    {rejectTarget.name}
                                </strong>{' '}
                                untuk tugas{' '}
                                <strong className="text-[#17233A]">
                                    {rejectTarget.taskTitle}
                                </strong>
                                .
                            </p>

                            <div className="mt-3">
                                <label className="mb-1 block text-xs font-semibold text-[#17233A]">
                                    Alasan Penolakan{' '}
                                    <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={rejectReason}
                                    onChange={(e) => {
                                        setRejectReason(e.target.value);
                                        if (rejectError) setRejectError(null);
                                    }}
                                    rows={3}
                                    className="w-full rounded-xl border border-[#DFE6ED] p-3 text-xs text-[#17233A] focus:border-[#173765] focus:outline-none"
                                    placeholder="Tuliskan alasan penolakan (minimal 5 karakter)..."
                                />
                                {rejectError && (
                                    <p className="mt-1 text-[11px] font-medium text-red-500">
                                        {rejectError}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 border-t border-[#DFE6ED] pt-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setRejectTarget(null);
                                    setRejectError(null);
                                }}
                                className="rounded-xl px-4 py-2 text-xs font-semibold text-[#607087] hover:bg-[#F7F9FB]"
                            >
                                Batal
                            </button>

                            <button
                                type="button"
                                disabled={processingId !== null}
                                onClick={handleConfirmReject}
                                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
                            >
                                {processingId !== null
                                    ? 'Menyimpan...'
                                    : 'Konfirmasi Tolak'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

// ==========================================
// MENGISOLASI LAYOUT KHUSUS DASHBOARD UMKM
// ==========================================
function EmployerDashboardLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}

EmployerDashboard.layout = EmployerDashboardLayout;
