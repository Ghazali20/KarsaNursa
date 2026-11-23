import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Bell,
    Briefcase,
    ChevronDown,
    ClipboardPlus,
    Download,
    House,
    LayoutGrid,
    LogOut,
    Menu,
    Receipt,
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
// TIPE DATA BUKU PENGELUARAN
// ==========================================

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

export type PeriodOption = {
    key: string;
    label: string;
};

export type EmployerPaymentsProps = {
    stats: {
        monthlyExpense: number;
        expensePercentageChange: number;
        paidTasksCount: number;
        totalTasksCount: number;
        uniqueWorkersCount: number;
        averageRating?: string;
        selectedMonthKey: string;
        selectedMonthLabel: string;
        prevMonthLabel: string;
        pendingApplicants: number;
    };
    availablePeriods: PeriodOption[];
    transactions: LedgerTransaction[];
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

// ==========================================
// KOMPONEN UTAMA BUKU PENGELUARAN
// ==========================================

export default function EmployerPaymentsIndex({
    stats,
    availablePeriods,
    transactions,
}: EmployerPaymentsProps) {
    const pageProps = usePage().props as unknown as {
        auth?: {
            user?: {
                name: string;
                email: string;
                role?: string;
                business?: { name?: string };
                [key: string]: unknown;
            };
        };
    };

    const user = pageProps.auth?.user ?? { name: 'Pemilik UMKM', email: '' };
    const firstName = formatFirstName(user.name);
    const userInitials = getInitials(user.name);
    const businessName = user.business?.name || `${firstName} Official Store`;

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Fungsi Export CSV
    function exportToCSV() {
        if (transactions.length === 0) {
            toast.error('Tidak ada data transaksi untuk diunduh.');
            return;
        }

        const headers = [
            'ID',
            'Tugas',
            'Pekerja',
            'Tanggal',
            'Jam Kerja',
            'Upah',
            'Status',
        ];
        const rows = transactions.map((item) => [
            item.code,
            `"${item.taskTitle.replace(/"/g, '""')}"`,
            `"${item.workerName.replace(/"/g, '""')}"`,
            item.date,
            item.hours,
            item.wage,
            item.status,
        ]);

        const csvContent =
            'data:text/csv;charset=utf-8,\uFEFF' +
            [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute(
            'download',
            `buku-pengeluaran-${stats.selectedMonthKey}.csv`,
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success(
            `Data ${stats.selectedMonthLabel} berhasil diunduh sebagai CSV!`,
        );
    }

    // Filter Periode Bulan via Inertia
    function handlePeriodChange(monthKey: string) {
        router.get(
            '/employer/payments',
            { month: monthKey },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    }

    const pendingCount = stats?.pendingApplicants ?? 0;

    return (
        <>
            <Head>
                <title>Buku Pengeluaran - Karsa Nusa</title>
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
                    1. SIDEBAR KIRI (MENU BUKU PENGELUARAN AKTIF SOLID)
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
                                {/* Dashboard */}
                                <Link
                                    href="/employer/dashboard"
                                    className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-[#607087] transition-colors hover:bg-[#F7F9FB] hover:text-[#173765]"
                                >
                                    <LayoutGrid className="size-4.5 text-[#607087]" />
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
                                    {pendingCount > 0 && (
                                        <span className="rounded-full bg-[#FFF4E8] px-2 py-0.5 text-xs font-bold text-[#D98A48]">
                                            {pendingCount}
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

                                {/* Buku Pengeluaran (STATE AKTIF: SOLID BIRU GELAP #173765) */}
                                <Link
                                    href="/employer/payments"
                                    className="flex items-center gap-3 rounded-xl bg-[#173765] px-3.5 py-2.5 text-sm font-bold text-white shadow-xs transition-colors"
                                >
                                    <WalletCards className="size-4.5 text-white" />
                                    <span>Buku Pengeluaran</span>
                                </Link>
                            </nav>
                        </div>

                        {/* Tombol Kembali ke Beranda di Bagian Bawah */}
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
                    KONTEN UTAMA (HEADER BAR + HALAMAN BUKU PENGELUARAN)
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
                                {pendingCount > 0 && (
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
                                                {user.name}
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
                                            {user.name}
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
                        KONTEN BUKU PENGELUARAN
                    ======================================================== */}
                    <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                        {/* HEADER HALAMAN */}
                        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                            <div>
                                <p className="text-[10px] font-bold tracking-[0.14em] text-[#173765] uppercase">
                                    OPERATIONAL EXPENSE LEDGER
                                </p>
                                <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#17233A] sm:text-3xl">
                                    Buku pengeluaran tenaga kerja
                                </h1>
                                <p className="mt-1 text-xs text-[#607087] sm:text-sm">
                                    Rekap biaya harian dan bulanan untuk
                                    pembukuan internal usaha.
                                </p>
                            </div>

                            {/* Tombol Unduh CSV */}
                            <button
                                type="button"
                                onClick={exportToCSV}
                                className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#DFE6ED] bg-white px-4 py-2.5 text-xs font-bold text-[#17233A] shadow-xs transition hover:bg-[#F7F9FB] sm:text-sm"
                            >
                                <span>Unduh CSV</span>
                                <Download className="size-4 text-[#173765]" />
                            </button>
                        </div>

                        {/* 3 KARTU RINGKASAN KPI */}
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            {/* Kartu 1 — Biaya bulan ini (Dark Card #0D2445) */}
                            <div className="flex items-center gap-4 rounded-2xl bg-[#0D2445] p-5 text-white shadow-sm">
                                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white/[0.08] text-[#7DD3E3]">
                                    <WalletCards className="size-6" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-[#93A2B5]">
                                        Biaya bulan terpilih
                                    </p>
                                    <p className="mt-0.5 text-2xl font-bold tracking-tight text-white">
                                        {formatRupiah(stats.monthlyExpense)}
                                    </p>
                                    <p className="mt-0.5 text-[11px] text-[#93A2B5]">
                                        {stats.expensePercentageChange >= 0
                                            ? `+${stats.expensePercentageChange}%`
                                            : `${stats.expensePercentageChange}%`}{' '}
                                        dari {stats.prevMonthLabel}
                                    </p>
                                </div>
                            </div>

                            {/* Kartu 2 — Tugas dibayarkan (White Card) */}
                            <div className="flex items-center gap-4 rounded-2xl border border-[#DFE6ED] bg-white p-5 shadow-xs">
                                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#F0F8FB] text-[#173765]">
                                    <Briefcase className="size-6" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-[#607087]">
                                        Tugas dibayarkan
                                    </p>
                                    <p className="mt-0.5 text-2xl font-bold text-[#17233A]">
                                        {stats.paidTasksCount}
                                    </p>
                                    <p className="mt-0.5 text-[11px] text-[#93A2B5]">
                                        {stats.totalTasksCount} total tugas
                                    </p>
                                </div>
                            </div>

                            {/* Kartu 3 — Pekerja unik (White Card) */}
                            <div className="flex items-center gap-4 rounded-2xl border border-[#DFE6ED] bg-white p-5 shadow-xs">
                                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#F0F8FB] text-[#173765]">
                                    <Users className="size-6" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-[#607087]">
                                        Pekerja unik
                                    </p>
                                    <p className="mt-0.5 text-2xl font-bold text-[#17233A]">
                                        {stats.uniqueWorkersCount}
                                    </p>
                                    <p className="mt-0.5 text-[11px] text-[#93A2B5]">
                                        Rata-rata {stats.averageRating || '4.8'}{' '}
                                        bintang
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* SECTION TABEL "TRANSAKSI UPAH" */}
                        <div className="space-y-5 rounded-2xl border border-[#DFE6ED] bg-white p-6 shadow-xs">
                            {/* Header Card dengan Dropdown Filter Periode */}
                            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                                <div>
                                    <h3 className="text-base font-bold text-[#17233A]">
                                        Transaksi upah
                                    </h3>
                                    <p className="mt-0.5 text-xs text-[#93A2B5]">
                                        Semua pencatatan{' '}
                                        {stats.selectedMonthLabel}
                                    </p>
                                </div>

                                {/* Dropdown Filter Periode Bulan */}
                                <div className="relative">
                                    <select
                                        value={stats.selectedMonthKey}
                                        onChange={(e) =>
                                            handlePeriodChange(e.target.value)
                                        }
                                        className="cursor-pointer appearance-none rounded-xl border border-[#DFE6ED] bg-white px-3.5 py-2 pr-9 text-xs font-bold text-[#17233A] shadow-xs hover:bg-[#F7F9FB] focus:outline-none"
                                    >
                                        {availablePeriods.map((period) => (
                                            <option
                                                key={period.key}
                                                value={period.key}
                                            >
                                                {period.label}
                                            </option>
                                        ))}
                                        <option value="all">
                                            Semua Periode
                                        </option>
                                    </select>
                                    <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-[#607087]" />
                                </div>
                            </div>

                            {/* Tabel Transaksi Upah */}
                            {transactions.length === 0 ? (
                                <div className="flex flex-col items-center justify-center border-t border-[#DFE6ED] p-12 text-center">
                                    <div className="flex size-14 items-center justify-center rounded-2xl bg-[#F0F8FB] text-[#173765]">
                                        <Receipt className="size-7" />
                                    </div>
                                    <h4 className="mt-4 text-base font-bold text-[#17233A]">
                                        Belum ada transaksi upah
                                    </h4>
                                    <p className="mt-1 text-xs text-[#607087]">
                                        Tidak ditemukan catatan pembayaran upah
                                        pada periode {stats.selectedMonthLabel}.
                                    </p>
                                    {stats.selectedMonthKey !== 'all' && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handlePeriodChange('all')
                                            }
                                            className="mt-4 cursor-pointer rounded-xl bg-[#173765] px-4 py-2 text-xs font-bold text-white hover:bg-[#21477F]"
                                        >
                                            Tampilkan Semua Periode
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
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
                                                    JAM
                                                </th>
                                                <th className="rounded-r-lg px-4 py-3 text-right">
                                                    UPAH
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody className="divide-y divide-[#DFE6ED] text-xs">
                                            {transactions.map((row) => (
                                                <tr
                                                    key={row.id}
                                                    className="transition-colors hover:bg-[#F7F9FB]/60"
                                                >
                                                    <td className="px-4 py-3.5 font-bold text-[#17233A]">
                                                        <span className="block font-mono text-[10px] font-normal text-[#93A2B5]">
                                                            {row.code}
                                                        </span>
                                                        <span>
                                                            {row.taskTitle}
                                                        </span>
                                                    </td>

                                                    <td className="px-4 py-3.5 text-[#607087]">
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex size-6 items-center justify-center rounded-full bg-[#D8F1F6] text-[10px] font-bold text-[#173765]">
                                                                {
                                                                    row.workerInitials
                                                                }
                                                            </div>
                                                            <span>
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

                                                    <td className="px-4 py-3.5 text-right font-bold text-[#17233A]">
                                                        {formatRupiah(row.wage)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </main>
                </div>
            </div>
        </>
    );
}

// ==========================================
// MENGISOLASI LAYOUT KHUSUS
// ==========================================
function EmployerPaymentsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}

EmployerPaymentsIndex.layout = EmployerPaymentsLayout;
