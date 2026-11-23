import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    Bell,
    Briefcase,
    CheckCircle2,
    ChevronDown,
    ClipboardPlus,
    Clock,
    Coins,
    Eye,
    FileCheck,
    House,
    LayoutGrid,
    LogOut,
    Maximize2,
    Menu,
    MessageSquare,
    ShieldCheck,
    Star,
    Users,
    WalletCards,
    X,
    XCircle,
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
// TIPE DATA
// ==========================================

export type ApplicationPayment = {
    status: string;
    amount: number;
    paidAt?: string | null;
};

export type ApplicationItem = {
    id: number;
    status: 'pending' | 'accepted' | 'rejected';
    workerName: string;
    workerEmail: string;
    workerPhone?: string;
    isVerified?: boolean;
    rating?: string;
    completedTasks?: number;
    skills?: string[];
    appliedAt: string | null;
    appliedAtHuman?: string;
    applicantNote?: string | null;
    qualificationDocumentUrl?: string | null;
    reviewNotes: string | null;
    reviewedAt: string | null;
    checkedInAt?: string | null;
    checkedOutAt?: string | null;
    proofPhotoUrl?: string | null;
    activityNotes?: string | null;
    proofSubmittedAt?: string | null;
    payment?: ApplicationPayment;
};

export type TaskSummary = {
    id: number;
    title: string;
    status: string;
    workerQuota: number | null;
    wageAmount?: number | null;
    acceptedCount: number;
    pendingCount: number;
    isFull?: boolean;
    remainingQuota?: number;
};

export type EmployerTaskApplicationsProps = {
    task: TaskSummary;
    applications: ApplicationItem[];
};

// ==========================================
// HELPER FORMATTING & BADGES
// ==========================================

function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'KN';
    return parts
        .slice(0, 2)
        .map((n) => n.charAt(0))
        .join('')
        .toUpperCase();
}

function formatFirstName(name: string): string {
    return name.trim().split(/\s+/)[0] ?? name;
}

function formatRupiah(value: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(value);
}

function getTaskBadge(statusKey?: string) {
    const key = (statusKey || '').toLowerCase();

    if (key === 'in_progress' || key === 'berlangsung') {
        return {
            label: 'Berlangsung',
            className: 'bg-[#D8F1F6] text-[#173765]',
        };
    }
    if (
        key === 'published' ||
        key === 'open' ||
        key === 'mencari pekerja' ||
        key === 'dipublikasikan'
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
        key === 'menunggu review'
    ) {
        return {
            label: 'Menunggu Review',
            className: 'bg-[#FFF4E8] text-[#D98A48]',
        };
    }
    if (key === 'rejected' || key === 'ditolak') {
        return {
            label: 'Ditolak',
            className: 'bg-[#FEE2E2] text-[#EF4444]',
        };
    }
    if (key === 'completed' || key === 'selesai') {
        return {
            label: 'Selesai',
            className: 'bg-[#DCFCE7] text-[#166534]',
        };
    }
    if (key === 'cancelled' || key === 'dibatalkan') {
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
// KOMPONEN UTAMA DAFTAR PELAMAR PER TUGAS
// ==========================================

export default function EmployerTaskApplications({
    task,
    applications,
}: EmployerTaskApplicationsProps) {
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

    const authUser = pageProps?.auth?.user;
    const userName = authUser?.name || 'Pemilik UMKM';
    const firstName = formatFirstName(userName);
    const userInitials = getInitials(userName);
    const businessName = authUser?.business?.name || `${firstName} Store`;

    const quota = task.workerQuota ?? 1;
    const quotaFull = task.acceptedCount >= quota;

    // State Navigasi & Action
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [approvingId, setApprovingId] = useState<number | null>(null);

    // Modal Profil Detail
    const [profileTarget, setProfileTarget] = useState<ApplicationItem | null>(
        null,
    );

    // Modal Tolak Pelamar
    const [rejectTarget, setRejectTarget] = useState<ApplicationItem | null>(
        null,
    );
    const [rejectReason, setRejectReason] = useState(
        'Kualifikasi belum sesuai dengan kebutuhan tugas saat ini.',
    );
    const [rejectError, setRejectError] = useState<string | null>(null);

    // Modal Preview Foto Bukti Ukuran Penuh
    const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);
    const [previewPhotoTitle, setPreviewPhotoTitle] = useState<string>('');

    // Modal Beri Saran / Catatan Perbaikan
    const [feedbackTarget, setFeedbackTarget] =
        useState<ApplicationItem | null>(null);
    const [feedbackNotes, setFeedbackNotes] = useState('');
    const [feedbackError, setFeedbackError] = useState<string | null>(null);
    const [feedbackProcessing, setFeedbackProcessing] = useState(false);

    // Flash message listener
    useEffect(() => {
        if (pageProps.flash?.success) {
            toast.success(pageProps.flash.success);
        }
        if (pageProps.flash?.error) {
            toast.error(pageProps.flash.error);
        }
    }, [pageProps.flash]);

    // Handler Terima Pelamar (Seleksi Awal)
    function handleAccept(application: ApplicationItem) {
        if (processingId !== null) return;
        setProcessingId(application.id);

        router.patch(
            `/employer/tasks/${task.id}/applications/${application.id}/decision`,
            {
                decision: 'accepted',
                review_notes: null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(
                        `Pelamar ${application.workerName} diterima!`,
                        {
                            description: `Kuota pekerja untuk tugas ini telah diperbarui.`,
                        },
                    );
                    router.reload({ only: ['task', 'applications'] });
                },
                onError: (responseErrors) => {
                    toast.error(
                        responseErrors.application ||
                            responseErrors.review_notes ||
                            'Gagal menerima pelamar.',
                    );
                },
                onFinish: () => setProcessingId(null),
            },
        );
    }

    // Konfirmasi Kirim Tolak Pelamar (Seleksi Awal)
    function confirmReject() {
        if (!rejectTarget || processingId !== null) return;

        const reason = rejectReason.trim();
        if (reason.length < 5) {
            setRejectError('Alasan penolakan minimal 5 karakter.');
            return;
        }

        setProcessingId(rejectTarget.id);
        setRejectError(null);

        router.patch(
            `/employer/tasks/${task.id}/applications/${rejectTarget.id}/decision`,
            {
                decision: 'rejected',
                review_notes: reason,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.error(
                        `Lamaran dari ${rejectTarget.workerName} ditolak.`,
                        {
                            description:
                                'Catatan penolakan telah diteruskan ke pekerja.',
                        },
                    );
                    setRejectTarget(null);
                    router.reload({ only: ['task', 'applications'] });
                },
                onError: (responseErrors) => {
                    setRejectError(
                        responseErrors.review_notes ||
                            responseErrors.application ||
                            'Gagal menolak pelamar.',
                    );
                },
                onFinish: () => setProcessingId(null),
            },
        );
    }

    // Handler Setujui Hasil Pekerjaan & Berikan Upah
    function handleApproveWork(application: ApplicationItem) {
        if (approvingId !== null) return;
        setApprovingId(application.id);

        router.patch(
            `/employer/tasks/${task.id}/applications/${application.id}/approve-work`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(
                        `Hasil pekerjaan ${application.workerName} disetujui!`,
                        {
                            description:
                                'Upah pekerja telah berhasil dicatat sebagai lunas.',
                        },
                    );
                    router.reload({ only: ['task', 'applications'] });
                },
                onError: (responseErrors) => {
                    const msg =
                        responseErrors.payment ||
                        responseErrors.application ||
                        'Gagal menyetujui hasil kerja.';
                    toast.error('Gagal Memproses Upah', {
                        description: String(msg),
                    });
                },
                onFinish: () => setApprovingId(null),
            },
        );
    }

    // Konfirmasi Kirim Saran / Catatan Perbaikan
    function handleSendFeedback() {
        if (!feedbackTarget || feedbackProcessing) return;

        const notes = feedbackNotes.trim();
        if (notes.length < 5) {
            setFeedbackError('Saran atau catatan minimal 5 karakter.');
            return;
        }

        setFeedbackProcessing(true);
        setFeedbackError(null);

        router.patch(
            `/employer/tasks/${task.id}/applications/${feedbackTarget.id}/feedback`,
            {
                notes,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Saran perbaikan berhasil dikirimkan!', {
                        description: `Pekerja ${feedbackTarget.workerName} telah diberitahu.`,
                    });
                    setFeedbackTarget(null);
                    setFeedbackNotes('');
                    router.reload({ only: ['task', 'applications'] });
                },
                onError: (errs) => {
                    const err = errs.notes || 'Gagal mengirimkan saran.';
                    setFeedbackError(String(err));
                },
                onFinish: () => setFeedbackProcessing(false),
            },
        );
    }

    const taskBadge = getTaskBadge(task.status);

    return (
        <>
            <Head
                title={`Daftar Pelamar: ${task?.title ?? 'Tugas'} - Karsa Nusa`}
            />

            {/* WRAPPER UTAMA */}
            <div
                className="flex min-h-screen bg-[#F7F9FB] text-[#17233A] antialiased"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
                {/* ========================================================
                    1. SIDEBAR KIRI (MENU KELOLA TUGAS AKTIF SOLID #173765)
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
                                    {task.pendingCount > 0 && (
                                        <span className="rounded-full bg-[#FFF4E8] px-2 py-0.5 text-xs font-bold text-[#D98A48]">
                                            {task.pendingCount}
                                        </span>
                                    )}
                                </Link>

                                {/* Kelola Tugas (STATE AKTIF SOLID #173765) */}
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
                    2. KONTEN UTAMA (HEADER BAR + DETAIL PELAMAR PER TUGAS)
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
                                    Daftar Pelamar Tugas
                                </h2>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 sm:gap-4">
                            <Link
                                href="/employer/applications"
                                className="relative flex size-10 items-center justify-center rounded-xl text-[#607087] transition hover:bg-[#F7F9FB] hover:text-[#17233A]"
                                aria-label="Notifikasi Pelamar"
                            >
                                <Bell className="size-5" />
                                {task.pendingCount > 0 && (
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
                                    <div className="px-3 py-2">
                                        <p className="text-xs font-bold text-[#17233A]">
                                            {userName}
                                        </p>
                                        <p className="truncate text-[11px] text-[#607087]">
                                            {businessName}
                                        </p>
                                    </div>

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

                    {/* MAIN CONTENT */}
                    <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                        {/* BREADCRUMB / KEMBALI KE KELOLA TUGAS */}
                        <div>
                            <Link
                                href="/employer/tasks"
                                className="inline-flex items-center gap-2 text-xs font-semibold text-[#607087] transition hover:text-[#173765] sm:text-sm"
                            >
                                <ArrowLeft className="size-4" />
                                <span>Kembali ke Kelola Tugas</span>
                            </Link>
                        </div>

                        {/* HEADER / BANNER TUGAS */}
                        <div className="relative overflow-hidden rounded-2xl bg-[#0D2445] p-6 text-white shadow-sm sm:p-8">
                            <div className="pointer-events-none absolute -top-12 -right-12 size-40 rounded-full bg-[#21477F]/30 blur-2xl" />

                            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                                <div className="space-y-1.5">
                                    <p className="text-[10px] font-bold tracking-[0.14em] text-[#7DD3E3] uppercase">
                                        APPLICANT MANAGEMENT
                                    </p>
                                    <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                                        Daftar Pelamar
                                    </h1>
                                    <div className="flex flex-wrap items-center gap-2 pt-1">
                                        <span className="text-sm font-semibold text-white/90 sm:text-base">
                                            {task.title}
                                        </span>
                                        <span
                                            className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${taskBadge.className}`}
                                        >
                                            {taskBadge.label}
                                        </span>
                                        {task.wageAmount !== null &&
                                            task.wageAmount !== undefined && (
                                                <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-bold text-white/90">
                                                    {formatRupiah(
                                                        task.wageAmount,
                                                    )}{' '}
                                                    / orang
                                                </span>
                                            )}
                                    </div>
                                </div>

                                <Link
                                    href="/employer/tasks"
                                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white backdrop-blur-xs transition hover:bg-white/20"
                                >
                                    <Briefcase className="size-4" />
                                    <span>Lihat Semua Tugas</span>
                                </Link>
                            </div>
                        </div>

                        {/* 3 KARTU RINGKASAN (GRID 3 KOLOM) */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            {/* Kartu 1: Total Pelamar */}
                            <div className="flex items-center gap-4 rounded-2xl border border-[#DFE6ED] bg-white p-5 shadow-xs">
                                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#F0F8FB] text-[#173765]">
                                    <Users className="size-6" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-[#607087]">
                                        Total Pelamar
                                    </p>
                                    <p className="mt-0.5 text-2xl font-extrabold text-[#17233A] sm:text-3xl">
                                        {applications.length}
                                    </p>
                                    <p className="mt-0.5 text-[11px] text-[#93A2B5]">
                                        Lamaran masuk pada tugas ini
                                    </p>
                                </div>
                            </div>

                            {/* Kartu 2: Menunggu Seleksi */}
                            <div className="flex items-center gap-4 rounded-2xl border border-[#DFE6ED] bg-white p-5 shadow-xs">
                                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#FFF4E8] text-[#D98A48]">
                                    <Clock className="size-6" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-[#607087]">
                                        Menunggu Seleksi
                                    </p>
                                    <p className="mt-0.5 text-2xl font-extrabold text-[#D98A48] sm:text-3xl">
                                        {task.pendingCount}
                                    </p>
                                    <p className="mt-0.5 text-[11px] text-[#93A2B5]">
                                        Perlu ditinjau UMKM
                                    </p>
                                </div>
                            </div>

                            {/* Kartu 3: Pekerja Diterima */}
                            <div className="flex items-center gap-4 rounded-2xl border border-[#DFE6ED] bg-white p-5 shadow-xs">
                                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#F0FDF4] text-[#16A34A]">
                                    <CheckCircle2 className="size-6" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-[#607087]">
                                        Pekerja Diterima
                                    </p>
                                    <p className="mt-0.5 text-2xl font-extrabold text-[#173765] sm:text-3xl">
                                        {task.acceptedCount}
                                        <span className="text-base font-normal text-[#93A2B5]">
                                            /{quota}
                                        </span>
                                    </p>
                                    <p className="mt-0.5 text-[11px] text-[#93A2B5]">
                                        {quotaFull
                                            ? 'Kuota terpenuhi'
                                            : `Sisa ${Math.max(0, quota - task.acceptedCount)} kuota lagi`}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* DAFTAR KARTU PELAMAR */}
                        {applications.length === 0 ? (
                            <section className="rounded-2xl border border-dashed border-[#DFE6ED] bg-white px-6 py-16 text-center">
                                <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#F0F8FB] text-[#173765]">
                                    <Users className="size-7" />
                                </div>
                                <h3 className="mt-4 text-base font-bold text-[#17233A]">
                                    Belum ada pelamar
                                </h3>
                                <p className="mx-auto mt-1 max-w-sm text-xs text-[#607087]">
                                    Lamaran pekerja yang masuk untuk tugas "
                                    {task.title}" akan tampil di halaman ini.
                                </p>
                            </section>
                        ) : (
                            <div className="space-y-5">
                                {applications.map((application) => {
                                    const isPending =
                                        application.status === 'pending';
                                    const isAccepted =
                                        application.status === 'accepted';
                                    const isRejected =
                                        application.status === 'rejected';
                                    const isProcessing =
                                        processingId === application.id;
                                    const isApproving =
                                        approvingId === application.id;

                                    const isPaid =
                                        application.payment?.status === 'paid';
                                    const wageAmount =
                                        application.payment?.amount ??
                                        task.wageAmount ??
                                        0;
                                    const hasSubmittedProof = Boolean(
                                        application.proofPhotoUrl,
                                    );

                                    return (
                                        <article
                                            key={application.id}
                                            className="rounded-2xl border border-[#DFE6ED] bg-white p-5 shadow-xs transition hover:border-[#BFE7EF] sm:p-6"
                                        >
                                            {/* BARIS ATAS: AVATAR, NAMA, BADGE STATUS SELEKSI */}
                                            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                                                <div className="flex items-start gap-3.5">
                                                    <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#D8F1F6] text-sm font-extrabold text-[#173765]">
                                                        {getInitials(
                                                            application.workerName,
                                                        )}
                                                    </div>

                                                    <div className="space-y-1">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <h3 className="text-base font-bold text-[#17233A]">
                                                                {
                                                                    application.workerName
                                                                }
                                                            </h3>

                                                            {application.isVerified && (
                                                                <span className="inline-flex items-center gap-1 rounded-full bg-[#D8F1F6] px-2 py-0.5 text-[10px] font-bold text-[#173765]">
                                                                    <ShieldCheck className="size-3 text-[#173765]" />
                                                                    <span>
                                                                        Terverifikasi
                                                                    </span>
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* RATING & COMPLETED TASKS */}
                                                        <div className="flex flex-wrap items-center gap-3 text-xs text-[#607087]">
                                                            <span className="flex items-center gap-1 font-semibold text-[#17233A]">
                                                                <Star className="size-3.5 fill-[#EAB308] text-[#EAB308]" />
                                                                {application.rating ??
                                                                    '5.0'}
                                                            </span>
                                                            <span>•</span>
                                                            <span>
                                                                {application.completedTasks ??
                                                                    0}{' '}
                                                                tugas selesai
                                                            </span>
                                                            <span>•</span>
                                                            <span className="text-[#93A2B5]">
                                                                {
                                                                    application.workerEmail
                                                                }
                                                            </span>
                                                        </div>

                                                        {/* WAKTU PENGAJUAN */}
                                                        <p className="text-[11px] text-[#93A2B5]">
                                                            Melamar:{' '}
                                                            {application.appliedAt ||
                                                                application.appliedAtHuman ||
                                                                'Baru saja'}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* STATUS PILL BADGE SELEKSI */}
                                                <div>
                                                    {isPending && (
                                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF4E8] px-3 py-1 text-xs font-bold text-[#D98A48]">
                                                            <Clock className="size-3 text-[#D98A48]" />
                                                            <span>
                                                                Menunggu Seleksi
                                                            </span>
                                                        </span>
                                                    )}
                                                    {isAccepted && (
                                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#DCFCE7] px-3 py-1 text-xs font-bold text-[#166534]">
                                                            <CheckCircle2 className="size-3 text-[#166534]" />
                                                            <span>
                                                                Diterima
                                                            </span>
                                                        </span>
                                                    )}
                                                    {isRejected && (
                                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FEE2E2] px-3 py-1 text-xs font-bold text-[#EF4444]">
                                                            <XCircle className="size-3 text-[#EF4444]" />
                                                            <span>Ditolak</span>
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* SKILLS CHIPS */}
                                            {application.skills &&
                                                application.skills.length >
                                                    0 && (
                                                    <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-[#DFE6ED]/60 pt-3">
                                                        <span className="mr-1 text-[11px] font-semibold text-[#93A2B5]">
                                                            Keahlian:
                                                        </span>
                                                        {application.skills.map(
                                                            (skill, idx) => (
                                                                <span
                                                                    key={idx}
                                                                    className="rounded-lg border border-[#DFE6ED] bg-[#F7F9FB] px-2.5 py-0.5 text-[11px] font-medium text-[#607087]"
                                                                >
                                                                    {skill}
                                                                </span>
                                                            ),
                                                        )}
                                                    </div>
                                                )}

                                            {/* CATATAN PENGAJUAN / PITCH & DOKUMEN KUALIFIKASI PELAMAR */}
                                            {(application.applicantNote ||
                                                application.qualificationDocumentUrl) && (
                                                <div className="mt-3.5 space-y-2.5 rounded-xl border border-[#D8F1F6] bg-[#F0F8FB]/70 p-3.5">
                                                    {application.applicantNote && (
                                                        <div>
                                                            <p className="mb-1 flex items-center gap-1.5 text-[11px] font-bold text-[#173765]">
                                                                <MessageSquare className="size-3.5 text-[#173765]" />
                                                                <span>
                                                                    Catatan
                                                                    Pengajuan
                                                                    Pelamar:
                                                                </span>
                                                            </p>
                                                            <p className="rounded-lg border border-[#DFE6ED] bg-white/80 p-2.5 text-xs leading-relaxed whitespace-pre-line text-[#21477F] italic">
                                                                "
                                                                {
                                                                    application.applicantNote
                                                                }
                                                                "
                                                            </p>
                                                        </div>
                                                    )}

                                                    {application.qualificationDocumentUrl && (
                                                        <div className="flex items-center justify-between gap-2 border-t border-[#D8F1F6] pt-1">
                                                            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-[#607087]">
                                                                <FileCheck className="size-3.5 text-[#173765]" />
                                                                <span>
                                                                    Dokumen /
                                                                    Portofolio
                                                                    Terlampir
                                                                </span>
                                                            </span>
                                                            <a
                                                                href={
                                                                    application.qualificationDocumentUrl
                                                                }
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1.5 rounded-lg border border-[#173765] bg-white px-2.5 py-1 text-[11px] font-bold text-[#173765] transition hover:bg-[#173765] hover:text-white"
                                                            >
                                                                <Eye className="size-3" />
                                                                <span>
                                                                    Lihat
                                                                    Dokumen
                                                                </span>
                                                            </a>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* ========================================================
                                                KONDISI 1: PELAMAR MASIH STATUS 'PENDING'
                                            ======================================================== */}
                                            {isPending && (
                                                <div className="mt-4 flex flex-col justify-between gap-3 border-t border-[#DFE6ED] pt-3 sm:flex-row sm:items-center">
                                                    <div>
                                                        {quotaFull && (
                                                            <p className="text-xs font-medium text-[#D98A48]">
                                                                * Kuota pekerja
                                                                tugas ini sudah
                                                                terpenuhi. Anda
                                                                masih dapat
                                                                menolak pelamar
                                                                ini.
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-2 self-end sm:self-auto">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setProfileTarget(
                                                                    application,
                                                                )
                                                            }
                                                            className="cursor-pointer rounded-xl border border-[#DFE6ED] px-3.5 py-2 text-xs font-bold text-[#173765] transition hover:bg-[#F7F9FB]"
                                                        >
                                                            Lihat Profil
                                                        </button>

                                                        <button
                                                            type="button"
                                                            disabled={
                                                                isProcessing
                                                            }
                                                            onClick={() => {
                                                                setRejectTarget(
                                                                    application,
                                                                );
                                                                setRejectReason(
                                                                    'Kualifikasi belum sesuai dengan kebutuhan tugas saat ini.',
                                                                );
                                                                setRejectError(
                                                                    null,
                                                                );
                                                            }}
                                                            className="cursor-pointer rounded-xl bg-[#FEE2E2] px-4 py-2 text-xs font-bold text-[#EF4444] transition hover:bg-red-100 disabled:opacity-50"
                                                        >
                                                            Tolak
                                                        </button>

                                                        <button
                                                            type="button"
                                                            disabled={
                                                                isProcessing ||
                                                                quotaFull
                                                            }
                                                            onClick={() =>
                                                                handleAccept(
                                                                    application,
                                                                )
                                                            }
                                                            className="cursor-pointer rounded-xl bg-[#173765] px-5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[#21477F] disabled:cursor-not-allowed disabled:opacity-50"
                                                        >
                                                            {isProcessing
                                                                ? 'Memproses...'
                                                                : 'Terima'}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* ========================================================
                                                KONDISI 2: PELAMAR STATUS 'ACCEPTED' (LAPORAN BUKTI & PENCAIRAN UPAH)
                                            ======================================================== */}
                                            {isAccepted && (
                                                <div className="mt-4 space-y-3 border-t border-[#DFE6ED] pt-3">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <FileCheck className="size-4 text-[#173765]" />
                                                            <h4 className="text-xs font-bold tracking-wider text-[#17233A] uppercase">
                                                                Laporan & Bukti
                                                                Pekerjaan
                                                            </h4>
                                                        </div>

                                                        <span className="text-[11px] text-[#93A2B5]">
                                                            Diterima:{' '}
                                                            {application.reviewedAt ||
                                                                application.appliedAt ||
                                                                '-'}
                                                        </span>
                                                    </div>

                                                    {/* JIKA BELUM MENGIRIM BUKTI FOTO & BELUM CHECK-OUT */}
                                                    {!hasSubmittedProof &&
                                                    !application.checkedOutAt ? (
                                                        <div className="flex flex-col justify-between gap-3 rounded-xl border border-[#DFE6ED] bg-[#F7F9FB] p-4 text-xs sm:flex-row sm:items-center">
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#FFF4E8] text-[#D98A48]">
                                                                    <Clock className="size-5" />
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-[#17233A]">
                                                                        Menunggu
                                                                        Penyelesaian
                                                                        Pekerjaan
                                                                    </p>
                                                                    <p className="text-[11px] text-[#607087]">
                                                                        Menunggu
                                                                        pekerja
                                                                        menyelesaikan
                                                                        tugas
                                                                        dan
                                                                        mengunggah
                                                                        foto
                                                                        bukti
                                                                        pekerjaan.
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            {application.checkedInAt ? (
                                                                <div className="shrink-0 self-start rounded-lg border border-[#DFE6ED] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#173765] sm:self-auto">
                                                                    Check-in:{' '}
                                                                    {
                                                                        application.checkedInAt
                                                                    }
                                                                </div>
                                                            ) : (
                                                                <div className="shrink-0 self-start rounded-lg border border-[#DFE6ED] bg-white px-3 py-1.5 text-[11px] text-[#93A2B5] sm:self-auto">
                                                                    Belum
                                                                    Check-in
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        /* JIKA PEKERJA SUDAH MENGUNGGAH BUKTI / CHECK-OUT */
                                                        <div className="space-y-4 rounded-2xl border border-[#DFE6ED] bg-[#F7F9FB] p-4 sm:p-5">
                                                            <div className="flex flex-col gap-4 sm:gap-6 md:flex-row">
                                                                {/* THUMBNAIL FOTO BUKTI */}
                                                                {application.proofPhotoUrl ? (
                                                                    <div className="group relative shrink-0">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setPreviewPhotoUrl(
                                                                                    application.proofPhotoUrl!,
                                                                                );
                                                                                setPreviewPhotoTitle(
                                                                                    application.workerName,
                                                                                );
                                                                            }}
                                                                            className="relative block h-36 w-full cursor-pointer overflow-hidden rounded-xl border border-[#DFE6ED] bg-white shadow-xs focus:ring-2 focus:ring-[#173765] focus:outline-none sm:w-48"
                                                                            title="Klik untuk melihat foto ukuran penuh"
                                                                        >
                                                                            <img
                                                                                src={
                                                                                    application.proofPhotoUrl
                                                                                }
                                                                                alt={`Bukti kerja ${application.workerName}`}
                                                                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                                            />
                                                                            <div className="absolute inset-0 flex items-center justify-center gap-1.5 bg-black/30 text-xs font-bold text-white opacity-0 backdrop-blur-[2px] transition-opacity group-hover:opacity-100">
                                                                                <Maximize2 className="size-4" />
                                                                                <span>
                                                                                    Perbesar
                                                                                </span>
                                                                            </div>
                                                                        </button>
                                                                        <span className="mt-1.5 block text-center text-[10px] font-medium text-[#93A2B5]">
                                                                            Klik
                                                                            foto
                                                                            untuk
                                                                            perbesar
                                                                        </span>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex h-36 w-full shrink-0 flex-col items-center justify-center rounded-xl border border-dashed border-[#DFE6ED] bg-white p-3 text-center sm:w-48">
                                                                        <Clock className="size-6 text-[#93A2B5]" />
                                                                        <span className="mt-1 text-[11px] font-semibold text-[#607087]">
                                                                            Foto
                                                                            belum
                                                                            diunggah
                                                                        </span>
                                                                    </div>
                                                                )}

                                                                {/* INFORMASI DETAIL PENGERJAAN & CATATAN */}
                                                                <div className="min-w-0 flex-1 space-y-3">
                                                                    {/* Waktu Presensi */}
                                                                    <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                                                                        <div className="rounded-xl border border-[#DFE6ED] bg-white p-2.5">
                                                                            <span className="block text-[10px] font-bold text-[#93A2B5] uppercase">
                                                                                Waktu
                                                                                Check-in
                                                                            </span>
                                                                            <span className="font-semibold text-[#17233A]">
                                                                                {application.checkedInAt ||
                                                                                    '—'}
                                                                            </span>
                                                                        </div>

                                                                        <div className="rounded-xl border border-[#DFE6ED] bg-white p-2.5">
                                                                            <span className="block text-[10px] font-bold text-[#93A2B5] uppercase">
                                                                                Waktu
                                                                                Check-out
                                                                            </span>
                                                                            <span className="font-semibold text-[#17233A]">
                                                                                {application.checkedOutAt ||
                                                                                    '—'}
                                                                            </span>
                                                                        </div>
                                                                    </div>

                                                                    {/* Catatan Pekerja */}
                                                                    <div className="rounded-xl border border-[#DFE6ED] bg-white p-3 text-xs">
                                                                        <span className="mb-1 block text-[10px] font-bold text-[#93A2B5] uppercase">
                                                                            Catatan
                                                                            Pekerja
                                                                        </span>
                                                                        <p className="text-[#17233A] italic">
                                                                            {application.activityNotes
                                                                                ? `"${application.activityNotes}"`
                                                                                : 'Tidak ada catatan aktivitas tambahan dari pekerja.'}
                                                                        </p>
                                                                        {application.proofSubmittedAt && (
                                                                            <span className="mt-1.5 block text-[10px] text-[#93A2B5]">
                                                                                Dikirim:{' '}
                                                                                {
                                                                                    application.proofSubmittedAt
                                                                                }
                                                                            </span>
                                                                        )}
                                                                    </div>

                                                                    {/* Catatan / Saran UMKM yang pernah dikirim */}
                                                                    {application.reviewNotes && (
                                                                        <div className="rounded-xl border border-[#FFE8D1] bg-[#FFF9F2] p-2.5 text-xs">
                                                                            <span className="mb-0.5 flex items-center gap-1 text-[10px] font-bold text-[#D98A48] uppercase">
                                                                                <MessageSquare className="size-3" />
                                                                                <span>
                                                                                    Saran
                                                                                    /
                                                                                    Catatan
                                                                                    UMKM
                                                                                </span>
                                                                            </span>
                                                                            <p className="text-xs text-[#17233A]">
                                                                                {
                                                                                    application.reviewNotes
                                                                                }
                                                                            </p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* ACTION BAR: PENCAIRAN UPAH & SARAN */}
                                                            <div className="flex flex-col justify-between gap-3 border-t border-[#DFE6ED] pt-3 sm:flex-row sm:items-center">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="flex size-8 items-center justify-center rounded-lg bg-[#EBF6F9] text-[#173765]">
                                                                        <Coins className="size-4" />
                                                                    </div>
                                                                    <div>
                                                                        <span className="block text-[10px] font-bold text-[#93A2B5] uppercase">
                                                                            Upah
                                                                            Pekerja
                                                                        </span>
                                                                        <span className="text-base font-extrabold text-[#173765]">
                                                                            {formatRupiah(
                                                                                wageAmount,
                                                                            )}
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center gap-2 self-end sm:self-auto">
                                                                    {isPaid ? (
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#DCFCE7] px-3.5 py-2 text-xs font-bold text-[#166534]">
                                                                                <CheckCircle2 className="size-4 text-[#166534]" />
                                                                                <span>
                                                                                    Upah
                                                                                    Telah
                                                                                    Dibayarkan
                                                                                </span>
                                                                            </span>
                                                                            {application
                                                                                .payment
                                                                                ?.paidAt && (
                                                                                <span className="hidden text-[11px] text-[#93A2B5] sm:inline">
                                                                                    (
                                                                                    {
                                                                                        application
                                                                                            .payment
                                                                                            .paidAt
                                                                                    }
                                                                                    )
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    ) : (
                                                                        <>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    setFeedbackTarget(
                                                                                        application,
                                                                                    );
                                                                                    setFeedbackNotes(
                                                                                        application.reviewNotes ||
                                                                                            '',
                                                                                    );
                                                                                    setFeedbackError(
                                                                                        null,
                                                                                    );
                                                                                }}
                                                                                className="cursor-pointer rounded-xl border border-[#DFE6ED] bg-white px-3.5 py-2 text-xs font-bold text-[#173765] transition hover:bg-[#F7F9FB]"
                                                                            >
                                                                                Beri
                                                                                Saran
                                                                            </button>

                                                                            <button
                                                                                type="button"
                                                                                disabled={
                                                                                    isApproving
                                                                                }
                                                                                onClick={() =>
                                                                                    handleApproveWork(
                                                                                        application,
                                                                                    )
                                                                                }
                                                                                className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#173765] px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[#21477F] disabled:opacity-50"
                                                                            >
                                                                                <CheckCircle2 className="size-4" />
                                                                                <span>
                                                                                    {isApproving
                                                                                        ? 'Memproses...'
                                                                                        : 'Setujui & Berikan Upah'}
                                                                                </span>
                                                                            </button>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* ========================================================
                                                KONDISI 3: PELAMAR STATUS 'REJECTED'
                                            ======================================================== */}
                                            {isRejected && (
                                                <div className="mt-4 space-y-1 rounded-xl border border-[#DFE6ED] bg-[#F7F9FB] p-3 text-xs text-[#607087]">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-semibold text-[#EF4444]">
                                                            Status: Lamaran
                                                            Ditolak
                                                        </span>
                                                        <span className="text-[#93A2B5]">
                                                            Diperiksa:{' '}
                                                            {application.reviewedAt ||
                                                                '-'}
                                                        </span>
                                                    </div>
                                                    {application.reviewNotes && (
                                                        <p className="border-t border-[#DFE6ED]/60 pt-1 text-[11px] text-[#607087]">
                                                            <strong className="text-[#17233A]">
                                                                Alasan:
                                                            </strong>{' '}
                                                            {
                                                                application.reviewNotes
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </article>
                                    );
                                })}
                            </div>
                        )}
                    </main>
                </div>
            </div>

            {/* ========================================================
                MODAL 1: LIHAT PROFIL PEKERJA
            ======================================================== */}
            {profileTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
                    <div className="w-full max-w-md animate-in space-y-5 rounded-2xl bg-white p-6 shadow-2xl fade-in-50 zoom-in-95">
                        <div className="flex items-center justify-between border-b border-[#DFE6ED] pb-3.5">
                            <h3 className="text-base font-bold text-[#17233A]">
                                Profil Pekerja
                            </h3>
                            <button
                                type="button"
                                onClick={() => setProfileTarget(null)}
                                className="rounded-lg p-1.5 text-[#607087] transition hover:bg-[#F7F9FB]"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-[#D8F1F6] text-lg font-extrabold text-[#173765]">
                                {getInitials(profileTarget.workerName)}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h4 className="text-base font-bold text-[#17233A]">
                                        {profileTarget.workerName}
                                    </h4>
                                    {profileTarget.isVerified && (
                                        <span className="rounded-full bg-[#D8F1F6] px-2 py-0.5 text-[10px] font-bold text-[#173765]">
                                            Terverifikasi
                                        </span>
                                    )}
                                </div>
                                <p className="mt-0.5 text-xs text-[#607087]">
                                    {profileTarget.workerEmail}
                                </p>
                                {profileTarget.workerPhone && (
                                    <p className="text-xs text-[#93A2B5]">
                                        {profileTarget.workerPhone}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Metrik Pekerja */}
                        <div className="grid grid-cols-2 gap-3 rounded-xl border border-[#DFE6ED] bg-[#F7F9FB] p-3.5">
                            <div>
                                <p className="text-[10px] font-bold tracking-wider text-[#93A2B5] uppercase">
                                    Rating Platform
                                </p>
                                <p className="mt-0.5 flex items-center gap-1 text-sm font-bold text-[#17233A]">
                                    <Star className="size-4 fill-[#EAB308] text-[#EAB308]" />
                                    <span>{profileTarget.rating ?? '5.0'}</span>
                                </p>
                            </div>

                            <div>
                                <p className="text-[10px] font-bold tracking-wider text-[#93A2B5] uppercase">
                                    Tugas Diselesaikan
                                </p>
                                <p className="mt-0.5 text-sm font-bold text-[#173765]">
                                    {profileTarget.completedTasks ?? 0} Tugas
                                </p>
                            </div>
                        </div>

                        {/* Keahlian */}
                        <div>
                            <p className="mb-1.5 text-xs font-semibold text-[#17233A]">
                                Keahlian & Kualifikasi:
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {(profileTarget.skills &&
                                profileTarget.skills.length > 0
                                    ? profileTarget.skills
                                    : ['Ketelitian', 'Operasional', 'Kerja Tim']
                                ).map((skill, idx) => (
                                    <span
                                        key={idx}
                                        className="rounded-lg border border-[#D8F1F6] bg-[#F0F8FB] px-2.5 py-1 text-xs font-medium text-[#173765]"
                                    >
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Catatan Pengajuan & Dokumen Kualifikasi */}
                        {(profileTarget.applicantNote ||
                            profileTarget.qualificationDocumentUrl) && (
                            <div className="space-y-2.5 rounded-xl border border-[#D8F1F6] bg-[#F0F8FB] p-3.5">
                                {profileTarget.applicantNote && (
                                    <div>
                                        <p className="mb-1 flex items-center gap-1.5 text-xs font-bold text-[#173765]">
                                            <MessageSquare className="size-3.5 text-[#173765]" />
                                            <span>
                                                Catatan Pengajuan Pelamar:
                                            </span>
                                        </p>
                                        <p className="rounded-lg border border-[#DFE6ED] bg-white p-2.5 text-xs leading-relaxed whitespace-pre-line text-[#21477F] italic">
                                            "{profileTarget.applicantNote}"
                                        </p>
                                    </div>
                                )}

                                {profileTarget.qualificationDocumentUrl && (
                                    <div className="flex items-center justify-between gap-2 border-t border-[#D8F1F6] pt-1.5">
                                        <span className="flex items-center gap-1.5 text-xs font-semibold text-[#607087]">
                                            <FileCheck className="size-4 text-[#173765]" />
                                            <span>
                                                Dokumen / Portofolio Pendukung
                                            </span>
                                        </span>
                                        <a
                                            href={
                                                profileTarget.qualificationDocumentUrl
                                            }
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#173765] bg-white px-3 py-1.5 text-xs font-bold text-[#173765] transition hover:bg-[#173765] hover:text-white"
                                        >
                                            <Eye className="size-3.5" />
                                            <span>Lihat Dokumen</span>
                                        </a>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex justify-end border-t border-[#DFE6ED] pt-3">
                            <button
                                type="button"
                                onClick={() => setProfileTarget(null)}
                                className="rounded-xl bg-[#173765] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#21477F]"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================
                MODAL 2: TOLAK LAMARAN PEKERJA (SELEKSI AWAL)
            ======================================================== */}
            {rejectTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
                    <div className="w-full max-w-md animate-in space-y-4 rounded-2xl bg-white p-6 shadow-2xl fade-in-50 zoom-in-95">
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
                                className="rounded-lg p-1.5 text-[#607087] transition hover:bg-[#F7F9FB]"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        <div>
                            <p className="text-xs text-[#607087]">
                                Anda akan menolak lamaran dari{' '}
                                <strong className="text-[#17233A]">
                                    {rejectTarget.workerName}
                                </strong>{' '}
                                untuk tugas{' '}
                                <strong className="text-[#17233A]">
                                    {task.title}
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
                                onClick={confirmReject}
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

            {/* ========================================================
                MODAL 3: PREVIEW FOTO BUKTI KERJA UKURAN PENUH
            ======================================================== */}
            {previewPhotoUrl && (
                <div
                    className="fixed inset-0 z-50 flex animate-in items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm duration-200 fade-in"
                    onClick={() => setPreviewPhotoUrl(null)}
                >
                    <div
                        className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-[#DFE6ED] bg-white shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-[#DFE6ED] bg-[#F7F9FB] px-5 py-3.5">
                            <div>
                                <h4 className="text-sm font-bold text-[#17233A]">
                                    Foto Bukti Hasil Kerja
                                </h4>
                                <p className="text-xs text-[#607087]">
                                    Pekerja:{' '}
                                    {previewPhotoTitle || 'Pekerja Karsa Nusa'}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setPreviewPhotoUrl(null)}
                                className="cursor-pointer rounded-lg p-1 text-[#607087] transition hover:bg-white"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        <div className="flex max-h-[75vh] items-center justify-center overflow-auto bg-slate-900/5 p-3">
                            <img
                                src={previewPhotoUrl}
                                alt="Foto Bukti Hasil Kerja Lengkap"
                                className="max-h-[70vh] w-auto max-w-full rounded-lg object-contain shadow-xs"
                            />
                        </div>

                        <div className="flex items-center justify-between border-t border-[#DFE6ED] bg-white px-5 py-3 text-xs">
                            <span className="text-[#607087]">
                                Tugas:{' '}
                                <strong className="text-[#17233A]">
                                    {task.title}
                                </strong>
                            </span>
                            <button
                                type="button"
                                onClick={() => setPreviewPhotoUrl(null)}
                                className="cursor-pointer rounded-xl bg-[#173765] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#21477F]"
                            >
                                Tutup Preview
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================
                MODAL 4: BERI SARAN / CATATAN PERBAIKAN
            ======================================================== */}
            {feedbackTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
                    <div className="w-full max-w-md animate-in space-y-4 rounded-2xl bg-white p-6 shadow-2xl fade-in-50 zoom-in-95">
                        <div className="flex items-center justify-between border-b border-[#DFE6ED] pb-3">
                            <div className="flex items-center gap-2">
                                <MessageSquare className="size-4 text-[#173765]" />
                                <h3 className="text-base font-bold text-[#17233A]">
                                    Beri Saran / Catatan Perbaikan
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setFeedbackTarget(null);
                                    setFeedbackError(null);
                                }}
                                className="cursor-pointer rounded-lg p-1.5 text-[#607087] transition hover:bg-[#F7F9FB]"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        <div>
                            <p className="text-xs text-[#607087]">
                                Tuliskan masukan atau hal yang perlu diperbaiki
                                oleh{' '}
                                <strong className="text-[#17233A]">
                                    {feedbackTarget.workerName}
                                </strong>{' '}
                                terkait penyelesaian tugas ini.
                            </p>

                            <div className="mt-3">
                                <label className="mb-1 block text-xs font-semibold text-[#17233A]">
                                    Catatan / Saran UMKM{' '}
                                    <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={feedbackNotes}
                                    onChange={(e) => {
                                        setFeedbackNotes(e.target.value);
                                        if (feedbackError)
                                            setFeedbackError(null);
                                    }}
                                    rows={4}
                                    className="w-full rounded-xl border border-[#DFE6ED] p-3 text-xs text-[#17233A] focus:border-[#173765] focus:outline-none"
                                    placeholder="Contoh: Hasil foto produk sudah baik, namun tolong rapikan background pencahayaannya agar lebih jelas..."
                                />
                                {feedbackError && (
                                    <p className="mt-1 text-[11px] font-medium text-red-500">
                                        {feedbackError}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 border-t border-[#DFE6ED] pt-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setFeedbackTarget(null);
                                    setFeedbackError(null);
                                }}
                                className="cursor-pointer rounded-xl px-4 py-2 text-xs font-semibold text-[#607087] hover:bg-[#F7F9FB]"
                            >
                                Batal
                            </button>

                            <button
                                type="button"
                                disabled={feedbackProcessing}
                                onClick={handleSendFeedback}
                                className="cursor-pointer rounded-xl bg-[#173765] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#21477F] disabled:opacity-50"
                            >
                                {feedbackProcessing
                                    ? 'Mengirim...'
                                    : 'Kirim Saran'}
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
function EmployerTaskApplicationsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}

EmployerTaskApplications.layout = EmployerTaskApplicationsLayout;
