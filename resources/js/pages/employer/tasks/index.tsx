import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Bell,
    Briefcase,
    ChevronDown,
    ChevronRight,
    ClipboardPlus,
    Clock,
    House,
    LayoutGrid,
    LogOut,
    MapPin,
    Menu,
    Pencil,
    Send,
    ShieldAlert,
    UserRound,
    Users,
    WalletCards,
    X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
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
// TIPE DATA TUGAS UMKM
// ==========================================

export type TaskItem = {
    id: number;
    title: string;
    category: string | null;
    status: string;
    statusLabel: string;
    uiStatus?: string;
    uiStatusLabel?: string;
    locationAddress: string | null;
    workerQuota: number | null;
    acceptedCount?: number;
    pendingCount?: number;
    wageAmount: number | null;
    startsAt: string | null;
    endsAt: string | null;
    scheduleDisplay?: string;
    createdAt: string | null;
    applicationDeadline: string | null;
    adminNote: string | null;
    description?: string | null;
    requirements?: string | null;
    instructions?: string | null;
    canEdit: boolean;
    canSubmit: boolean;
};

type Props = {
    tasks: TaskItem[];
};

// ==========================================
// HELPER FORMATTING & MAPPING
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

// Mapping status badge sesuai spesifikasi desain baru Karsa Nusa
function getTaskBadge(statusKey?: string, statusLabel?: string) {
    const key = (statusKey || '').toLowerCase();
    const label = (statusLabel || '').toLowerCase();

    if (key === 'in_progress' || label === 'berlangsung') {
        return {
            label: 'Berlangsung',
            className: 'bg-[#D8F1F6] text-[#173765]',
        };
    }
    if (
        key === 'published' ||
        key === 'open' ||
        label === 'mencari pekerja' ||
        label === 'dipublikasikan'
    ) {
        return {
            label: 'Mencari Pekerja',
            className: 'bg-[#FEF3C7] text-[#B45309]',
        };
    }
    if (
        key === 'pending_review' ||
        key === 'in_review' ||
        key === 'submitted' ||
        label === 'menunggu review' ||
        label === 'menunggu persetujuan'
    ) {
        return {
            label: 'Menunggu Review',
            className: 'bg-[#FFF4E8] text-[#D98A48]',
        };
    }
    if (
        key === 'rejected' ||
        label === 'ditolak' ||
        label === 'ditolak admin'
    ) {
        return {
            label: 'Ditolak',
            className: 'bg-[#FEE2E2] text-[#EF4444]',
        };
    }
    if (key === 'completed' || label === 'selesai') {
        return {
            label: 'Selesai',
            className: 'bg-[#DCFCE7] text-[#166534]',
        };
    }
    if (key === 'cancelled' || label === 'dibatalkan') {
        return {
            label: 'Dibatalkan',
            className: 'bg-[#F1F5F9] text-[#93A2B5]',
        };
    }
    return {
        label: 'Draft',
        className: 'bg-[#F1F5F9] text-[#607087]',
    };
}

// ==========================================
// KOMPONEN UTAMA KELOLA TUGAS
// ==========================================

export default function EmployerTasksIndex({ tasks }: Props) {
    const pageProps = usePage().props as unknown as {
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
        flash?: {
            success?: string;
            error?: string;
        };
    };

    const user = pageProps.auth?.user ?? { name: 'Pemilik UMKM', email: '' };
    const firstName = formatFirstName(user.name);
    const userInitials = getInitials(user.name);
    const businessName = user.business?.name || `${firstName} Official Store`;

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [submittingId, setSubmittingId] = useState<number | null>(null);
    const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);

    // Flash message listener
    useEffect(() => {
        if (pageProps.flash?.success) {
            toast.success(pageProps.flash.success);
        }
        if (pageProps.flash?.error) {
            toast.error(pageProps.flash.error);
        }
    }, [pageProps.flash]);

    // Handler Ajukan Tugas Draft ke Admin
    function submitTask(task: TaskItem): void {
        if (submittingId !== null) return;

        const confirmed = window.confirm(
            `Ajukan tugas "${task.title}" untuk ditinjau admin?`,
        );

        if (!confirmed) return;

        setSubmittingId(task.id);

        router.patch(
            `/employer/tasks/${task.id}/submit`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Tugas berhasil diajukan ke admin!', {
                        description: 'Admin akan memeriksa rincian tugas Anda.',
                    });
                    if (selectedTask?.id === task.id) {
                        setSelectedTask(null);
                    }
                },
                onError: (errors) => {
                    toast.error(
                        Object.values(errors).join('\n') ||
                            'Tugas belum siap diajukan. Periksa kembali kelengkapan data.',
                    );
                },
                onFinish: () => setSubmittingId(null),
            },
        );
    }

    return (
        <>
            <Head>
                <title>Tugas Saya - Karsa Nusa</title>
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
                    1. SIDEBAR KIRI (MENU "KELOLA TUGAS" AKTIF SOLID #173765)
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
                            className="flex items-center gap-2.5"
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
                                    className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-[#607087] transition-colors hover:bg-[#F7F9FB] hover:text-[#17233A]"
                                >
                                    <LayoutGrid className="size-4.5 text-[#607087]" />
                                    <span>Dashboard</span>
                                </Link>

                                {/* Buat Tugas */}
                                <Link
                                    href="/employer/tasks/create"
                                    className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-[#607087] transition-colors hover:bg-[#F7F9FB] hover:text-[#17233A]"
                                >
                                    <ClipboardPlus className="size-4.5 text-[#607087]" />
                                    <span>Buat Tugas</span>
                                </Link>

                                {/* Kelola Pelamar */}
                                <Link
                                    href="/employer/applications"
                                    className="flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium text-[#607087] transition-colors hover:bg-[#F7F9FB] hover:text-[#17233A]"
                                >
                                    <div className="flex items-center gap-3">
                                        <Users className="size-4.5 text-[#607087]" />
                                        <span>Kelola Pelamar</span>
                                    </div>
                                </Link>

                                {/* Tugas Saya / Kelola Tugas (STATE AKTIF SOLID #173765) */}
                                <Link
                                    href="/employer/tasks"
                                    className="flex items-center gap-3 rounded-xl bg-[#173765] px-3.5 py-2.5 text-sm font-bold text-white shadow-xs transition-colors"
                                >
                                    <Briefcase className="size-4.5 text-white" />
                                    <span>Kelola Tugas</span>
                                </Link>

                                {/* Buku Pengeluaran */}
                                <Link
                                    href="/employer/payments"
                                    className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-[#607087] transition-colors hover:bg-[#F7F9FB] hover:text-[#17233A]"
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
                    KONTEN UTAMA (HEADER BAR + GRID TUGAS)
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
                                            href="/employer/applications"
                                            className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-[#17233A] hover:bg-[#F7F9FB]"
                                        >
                                            <Users className="size-4 text-[#607087]" />
                                            <span>Kelola Pelamar</span>
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
                        AREA KONTEN: HALAMAN KELOLA TUGAS
                    ======================================================== */}
                    <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                        {/* HEADER HALAMAN */}
                        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                            <div>
                                <p className="text-[10px] font-bold tracking-[0.14em] text-[#173765] uppercase">
                                    TASK MANAGEMENT
                                </p>

                                <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#17233A] sm:text-3xl">
                                    Kelola Tugas
                                </h1>

                                <p className="mt-1 text-xs text-[#607087] sm:text-sm">
                                    Pantau status publikasi, kuota, pelamar, dan
                                    progres seluruh micro-task usahamu.
                                </p>
                            </div>

                            <Link
                                href="/employer/tasks/create"
                                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#173765] px-5 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#21477F] sm:text-sm"
                            >
                                <ClipboardPlus className="size-4" />
                                <span>Buat Tugas Baru +</span>
                            </Link>
                        </div>

                        {/* GRID KARTU TUGAS */}
                        {tasks.length === 0 ? (
                            <div className="flex flex-col items-center justify-center rounded-2xl border border-[#DFE6ED] bg-white p-12 text-center shadow-xs">
                                <div className="flex size-14 items-center justify-center rounded-2xl bg-[#F0F8FB] text-[#173765]">
                                    <Briefcase className="size-7" />
                                </div>
                                <h3 className="mt-4 text-base font-bold text-[#17233A]">
                                    Belum ada tugas yang dibuat
                                </h3>
                                <p className="mt-1 max-w-sm text-xs leading-relaxed text-[#607087]">
                                    Mulai publikasikan micro-task harian pertama
                                    untuk menemukan pekerja lepas yang siap
                                    membantu operasional usahamu.
                                </p>
                                <Link
                                    href="/employer/tasks/create"
                                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#173765] px-4.5 py-2.5 text-xs font-bold text-white transition hover:bg-[#21477F]"
                                >
                                    <ClipboardPlus className="size-4" />
                                    <span>Buat Tugas Pertama +</span>
                                </Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                {tasks.map((task) => {
                                    const badge = getTaskBadge(
                                        task.uiStatus || task.status,
                                        task.uiStatusLabel || task.statusLabel,
                                    );
                                    const isSubmitting =
                                        submittingId === task.id;

                                    const quota = task.workerQuota ?? 1;
                                    const accepted = task.acceptedCount ?? 0;

                                    return (
                                        <article
                                            key={task.id}
                                            className="group flex flex-col justify-between rounded-2xl border border-[#DFE6ED] bg-white p-5 shadow-xs transition duration-200 hover:border-[#BFE7EF] hover:shadow-md"
                                        >
                                            <div>
                                                {/* BARIS ATAS: IKON & BADGE STATUS */}
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="flex size-10 items-center justify-center rounded-xl bg-[#D8F1F6] text-[#173765]">
                                                        <Briefcase className="size-4.5" />
                                                    </div>

                                                    <span
                                                        className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${badge.className}`}
                                                    >
                                                        {badge.label}
                                                    </span>
                                                </div>

                                                {/* BAGIAN TENGAH: JUDUL & INFO JADWAL / KUOTA TERISI */}
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setSelectedTask(task)
                                                    }
                                                    className="mt-4 block w-full cursor-pointer text-left"
                                                >
                                                    <h3 className="line-clamp-2 text-sm font-bold text-[#17233A] transition-colors group-hover:text-[#173765]">
                                                        {task.title}
                                                    </h3>
                                                </button>

                                                <div className="mt-3.5 space-y-1.5 text-xs text-[#607087]">
                                                    {/* Jadwal Pelaksanaan */}
                                                    <div className="flex items-center gap-1.5">
                                                        <Clock className="size-3.5 shrink-0 text-[#93A2B5]" />
                                                        <span className="truncate">
                                                            {task.scheduleDisplay ??
                                                                (task.startsAt
                                                                    ? task.startsAt
                                                                    : task.createdAt
                                                                      ? `Dibuat · ${task.createdAt}`
                                                                      : 'Belum dijadwalkan')}
                                                        </span>
                                                    </div>

                                                    {/* Kuota Pekerja Terisi (jumlah_diterima / kuota) */}
                                                    <div className="flex items-center gap-1.5">
                                                        <Users className="size-3.5 shrink-0 text-[#93A2B5]" />
                                                        <span className="font-medium text-[#17233A]">
                                                            {accepted}/{quota}{' '}
                                                            <span className="font-normal text-[#607087]">
                                                                pekerja terisi
                                                            </span>
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Catatan Admin Jika Ditolak */}
                                                {task.status === 'rejected' &&
                                                    task.adminNote && (
                                                        <p className="mt-2 line-clamp-2 rounded-lg bg-red-50 p-2 text-[11px] text-[#EF4444]">
                                                            Catatan:{' '}
                                                            {task.adminNote}
                                                        </p>
                                                    )}

                                                {/* Tombol Ajukan ke Admin untuk Draft */}
                                                {task.canSubmit && (
                                                    <div className="mt-3 pt-2">
                                                        <button
                                                            type="button"
                                                            disabled={
                                                                isSubmitting
                                                            }
                                                            onClick={() =>
                                                                submitTask(task)
                                                            }
                                                            className="inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-[#173765] py-1.5 text-[11px] font-bold text-white transition hover:bg-[#21477F] disabled:opacity-50"
                                                        >
                                                            <Send className="size-3" />
                                                            <span>
                                                                {isSubmitting
                                                                    ? 'Mengajukan...'
                                                                    : 'Ajukan ke Admin'}
                                                            </span>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {/* BARIS BAWAH: UPAH & TOMBOL PANAH > */}
                                            <div className="mt-4 flex items-center justify-between border-t border-[#DFE6ED] pt-3.5">
                                                <div>
                                                    <p className="text-[10px] font-bold tracking-wider text-[#93A2B5] uppercase">
                                                        Upah Bersih
                                                    </p>
                                                    <p className="text-sm font-bold text-[#17233A]">
                                                        {task.wageAmount !==
                                                        null
                                                            ? formatRupiah(
                                                                  task.wageAmount,
                                                              )
                                                            : '—'}
                                                    </p>
                                                </div>

                                                {/* Tombol Panah Kanan > Membuka Detail Tugas */}
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setSelectedTask(task)
                                                    }
                                                    aria-label={`Buka detail tugas ${task.title}`}
                                                    className="flex size-8 cursor-pointer items-center justify-center rounded-lg border border-[#DFE6ED] bg-[#F7F9FB] text-[#173765] transition hover:bg-[#D8F1F6]"
                                                >
                                                    <ChevronRight className="size-4 stroke-[2.5]" />
                                                </button>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        )}
                    </main>
                </div>
            </div>

            {/* ========================================================
                MODAL DETAIL TUGAS
            ======================================================== */}
            {selectedTask && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 antialiased backdrop-blur-xs">
                    <div className="flex max-h-[calc(100dvh-40px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[#DFE6ED] bg-white shadow-2xl">
                        {/* Header Modal Detail */}
                        <div className="flex items-start justify-between border-b border-[#DFE6ED] px-6 py-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span
                                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                            getTaskBadge(
                                                selectedTask.uiStatus ||
                                                    selectedTask.status,
                                                selectedTask.uiStatusLabel ||
                                                    selectedTask.statusLabel,
                                            ).className
                                        }`}
                                    >
                                        {
                                            getTaskBadge(
                                                selectedTask.uiStatus ||
                                                    selectedTask.status,
                                                selectedTask.uiStatusLabel ||
                                                    selectedTask.statusLabel,
                                            ).label
                                        }
                                    </span>
                                    <span className="text-xs font-semibold text-[#93A2B5]">
                                        {selectedTask.category || 'Tugas Mikro'}
                                    </span>
                                </div>
                                <h3 className="mt-1 text-lg font-bold text-[#17233A]">
                                    {selectedTask.title}
                                </h3>
                            </div>

                            <button
                                type="button"
                                onClick={() => setSelectedTask(null)}
                                className="rounded-lg p-1 text-[#607087] transition hover:bg-[#F7F9FB]"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        {/* Isi Modal Detail */}
                        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4 text-xs">
                            {/* Grid Info Ringkas */}
                            <div className="grid grid-cols-2 gap-3 rounded-xl border border-[#DFE6ED] bg-[#F7F9FB] p-3.5">
                                <div>
                                    <p className="text-[10px] font-bold tracking-wider text-[#93A2B5] uppercase">
                                        Jadwal Pelaksanaan
                                    </p>
                                    <p className="mt-0.5 font-semibold text-[#17233A]">
                                        {selectedTask.startsAt ||
                                            selectedTask.scheduleDisplay ||
                                            '—'}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-[10px] font-bold tracking-wider text-[#93A2B5] uppercase">
                                        Upah per Pekerja
                                    </p>
                                    <p className="mt-0.5 text-sm font-bold text-[#173765]">
                                        {selectedTask.wageAmount
                                            ? formatRupiah(
                                                  selectedTask.wageAmount,
                                              )
                                            : '—'}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-[10px] font-bold tracking-wider text-[#93A2B5] uppercase">
                                        Kuota Pekerja
                                    </p>
                                    <p className="mt-0.5 font-semibold text-[#17233A]">
                                        {selectedTask.acceptedCount ?? 0} dari{' '}
                                        {selectedTask.workerQuota ?? 1} terisi
                                    </p>
                                </div>

                                <div>
                                    <p className="text-[10px] font-bold tracking-wider text-[#93A2B5] uppercase">
                                        Batas Lamaran
                                    </p>
                                    <p className="mt-0.5 font-semibold text-[#17233A]">
                                        {selectedTask.applicationDeadline ||
                                            '—'}
                                    </p>
                                </div>
                            </div>

                            {/* Alamat Lokasi */}
                            <div>
                                <p className="mb-1 flex items-center gap-1.5 font-bold text-[#17233A]">
                                    <MapPin className="size-3.5 text-[#173765]" />
                                    <span>Alamat Lokasi Tugas</span>
                                </p>
                                <p className="rounded-xl border border-[#DFE6ED] bg-white p-2.5 leading-relaxed text-[#607087]">
                                    {selectedTask.locationAddress ||
                                        'Alamat belum ditentukan.'}
                                </p>
                            </div>

                            {/* Deskripsi */}
                            <div>
                                <p className="mb-1 font-bold text-[#17233A]">
                                    Deskripsi & Tanggung Jawab
                                </p>
                                <p className="rounded-xl border border-[#DFE6ED] bg-white p-2.5 leading-relaxed whitespace-pre-line text-[#607087]">
                                    {selectedTask.description ||
                                        'Tidak ada deskripsi.'}
                                </p>
                            </div>

                            {/* Persyaratan */}
                            {selectedTask.requirements && (
                                <div>
                                    <p className="mb-1 font-bold text-[#17233A]">
                                        Persyaratan Pekerja
                                    </p>
                                    <p className="rounded-xl border border-[#DFE6ED] bg-white p-2.5 leading-relaxed whitespace-pre-line text-[#607087]">
                                        {selectedTask.requirements}
                                    </p>
                                </div>
                            )}

                            {/* Instruksi Tambahan */}
                            {selectedTask.instructions && (
                                <div>
                                    <p className="mb-1 font-bold text-[#17233A]">
                                        Instruksi Tambahan
                                    </p>
                                    <p className="rounded-xl border border-[#DFE6ED] bg-white p-2.5 leading-relaxed whitespace-pre-line text-[#607087]">
                                        {selectedTask.instructions}
                                    </p>
                                </div>
                            )}

                            {/* Catatan Admin Jika Ditolak */}
                            {selectedTask.status === 'rejected' &&
                                selectedTask.adminNote && (
                                    <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                                        <p className="flex items-center gap-1 font-bold text-red-700">
                                            <ShieldAlert className="size-3.5" />
                                            Catatan dari Admin
                                        </p>
                                        <p className="mt-1 text-red-600">
                                            {selectedTask.adminNote}
                                        </p>
                                    </div>
                                )}
                        </div>

                        {/* Footer Action Buttons Modal */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#DFE6ED] bg-white px-6 py-3.5">
                            <button
                                type="button"
                                onClick={() => setSelectedTask(null)}
                                className="rounded-xl px-3.5 py-2 text-xs font-semibold text-[#607087] hover:bg-[#F7F9FB]"
                            >
                                Tutup
                            </button>

                            <div className="flex items-center gap-2">
                                {selectedTask.canEdit && (
                                    <Link
                                        href={`/employer/tasks/${selectedTask.id}/edit`}
                                        className="inline-flex items-center gap-1.5 rounded-xl border border-[#DFE6ED] px-3.5 py-2 text-xs font-bold text-[#17233A] hover:bg-[#F7F9FB]"
                                    >
                                        <Pencil className="size-3.5" />
                                        <span>Edit Tugas</span>
                                    </Link>
                                )}

                                <Link
                                    href={`/employer/tasks/${selectedTask.id}/applications`}
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#173765] px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[#21477F]"
                                >
                                    <Users className="size-3.5" />
                                    <span>
                                        Kelola Pelamar (
                                        {selectedTask.acceptedCount ?? 0}/
                                        {selectedTask.workerQuota ?? 1})
                                    </span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

// ==========================================
// MENGISOLASI LAYOUT KHUSUS
// ==========================================
function EmployerTasksLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}

EmployerTasksIndex.layout = EmployerTasksLayout;
