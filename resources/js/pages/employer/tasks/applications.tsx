import { Head, Link, router, usePage } from "@inertiajs/react";
import {
    ArrowLeft,
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
    ShieldAlert,
    ShieldCheck,
    Star,
    UserCheck,
    UserRound,
    Users,
    WalletCards,
    X,
    XCircle,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

import karsaNusaLogo from "@/assets/karsanusa-logo.png";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ==========================================
// TIPE DATA
// ==========================================

export type ApplicationItem = {
    id: number;
    status: "pending" | "accepted" | "rejected";
    workerName: string;
    workerEmail: string;
    workerPhone?: string;
    isVerified?: boolean;
    rating?: string;
    completedTasks?: number;
    skills?: string[];
    appliedAt: string | null;
    appliedAtHuman?: string;
    reviewNotes: string | null;
    reviewedAt: string | null;
};

export type TaskSummary = {
    id: number;
    title: string;
    status: string;
    workerQuota: number | null;
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
    if (parts.length === 0) return "KN";
    return parts
        .slice(0, 2)
        .map((n) => n.charAt(0))
        .join("")
        .toUpperCase();
}

function formatFirstName(name: string): string {
    return name.trim().split(/\s+/)[0] ?? name;
}

function getTaskBadge(statusKey?: string) {
    const key = (statusKey || "").toLowerCase();

    if (key === "in_progress" || key === "berlangsung") {
        return {
            label: "Berlangsung",
            className: "bg-[#D8F1F6] text-[#173765]",
        };
    }
    if (
        key === "published" ||
        key === "open" ||
        key === "mencari pekerja" ||
        key === "dipublikasikan"
    ) {
        return {
            label: "Mencari Pekerja",
            className: "bg-[#FEF3C7] text-[#B45309]",
        };
    }
    if (
        key === "pending_review" ||
        key === "in_review" ||
        key === "submitted" ||
        key === "menunggu review"
    ) {
        return {
            label: "Menunggu Review",
            className: "bg-[#FFF4E8] text-[#D98A48]",
        };
    }
    if (key === "rejected" || key === "ditolak") {
        return {
            label: "Ditolak",
            className: "bg-[#FEE2E2] text-[#EF4444]",
        };
    }
    if (key === "completed" || key === "selesai") {
        return {
            label: "Selesai",
            className: "bg-[#DCFCE7] text-[#166534]",
        };
    }
    if (key === "cancelled" || key === "dibatalkan") {
        return {
            label: "Dibatalkan",
            className: "bg-[#F1F5F9] text-[#93A2B5]",
        };
    }
    return {
        label: "Draft",
        className: "bg-[#F1F5F9] text-[#607087]",
    };
}

// ==========================================
// KOMPONEN UTAMA DAFTAR PELAMAR PER TUGAS
// ==========================================

export default function EmployerTaskApplications({
    task,
    applications = [],
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
    const userName = authUser?.name || "Pemilik UMKM";
    const firstName = formatFirstName(userName);
    const userInitials = getInitials(userName);
    const businessName = authUser?.business?.name || `${firstName} Store`;

    const quota = task.workerQuota ?? 1;
    const quotaFull = task.acceptedCount >= quota;

    // State Lokal
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [processingId, setProcessingId] = useState<number | null>(null);

    // Modal Profil Detail
    const [profileTarget, setProfileTarget] = useState<ApplicationItem | null>(
        null,
    );

    // Modal Tolak Pelamar
    const [rejectTarget, setRejectTarget] = useState<ApplicationItem | null>(
        null,
    );
    const [rejectReason, setRejectReason] = useState(
        "Kualifikasi belum sesuai dengan kebutuhan tugas saat ini.",
    );
    const [rejectError, setRejectError] = useState<string | null>(null);

    // Flash message listener
    useEffect(() => {
        if (pageProps.flash?.success) {
            toast.success(pageProps.flash.success);
        }
        if (pageProps.flash?.error) {
            toast.error(pageProps.flash.error);
        }
    }, [pageProps.flash]);

    // Handler Terima Pelamar
    function handleAccept(application: ApplicationItem) {
        if (processingId !== null) return;
        setProcessingId(application.id);

        router.patch(
            `/employer/tasks/${task.id}/applications/${application.id}/decision`,
            {
                decision: "accepted",
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
                    router.reload({ only: ["task", "applications"] });
                },
                onError: (responseErrors) => {
                    toast.error(
                        responseErrors.application ||
                            responseErrors.review_notes ||
                            "Gagal menerima pelamar.",
                    );
                },
                onFinish: () => setProcessingId(null),
            },
        );
    }

    // Konfirmasi Kirim Tolak Pelamar
    function confirmReject() {
        if (!rejectTarget || processingId !== null) return;

        const reason = rejectReason.trim();
        if (reason.length < 5) {
            setRejectError("Alasan penolakan minimal 5 karakter.");
            return;
        }

        setProcessingId(rejectTarget.id);
        setRejectError(null);

        router.patch(
            `/employer/tasks/${task.id}/applications/${rejectTarget.id}/decision`,
            {
                decision: "rejected",
                review_notes: reason,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.error(
                        `Lamaran dari ${rejectTarget.workerName} ditolak.`,
                        {
                            description:
                                "Catatan penolakan telah diteruskan ke pekerja.",
                        },
                    );
                    setRejectTarget(null);
                    router.reload({ only: ["task", "applications"] });
                },
                onError: (responseErrors) => {
                    setRejectError(
                        responseErrors.review_notes ||
                            responseErrors.application ||
                            "Gagal menolak pelamar.",
                    );
                },
                onFinish: () => setProcessingId(null),
            },
        );
    }

    const taskBadge = getTaskBadge(task.status);

    return (
        <>
            <Head title={`Daftar Pelamar: ${task.title} - Karsa Nusa`}>
                <link
                    head-key="google-fonts-preconnect-1"
                    rel="preconnect"
                    href="https://fonts.googleapis.com"
                />
                <link
                    head-key="google-fonts-preconnect-2"
                    rel="preconnect"
                    href="https://fonts.gstatic.com"
                    crossOrigin="anonymous"
                />
                <link
                    head-key="plus-jakarta-sans"
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
                        mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
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
                                    className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-[#607087] transition-colors hover:bg-[#F7F9FB] hover:text-[#17233A]"
                                >
                                    <WalletCards className="size-4.5 text-[#607087]" />
                                    <span>Buku Pengeluaran</span>
                                </Link>
                            </nav>
                        </div>

                        {/* Tombol Kembali ke Beranda */}
                        <div className="pt-4 border-t border-[#DFE6ED]">
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
                <div className="flex flex-1 flex-col min-w-0 overflow-y-auto">
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
                                <h2 className="text-sm sm:text-base font-bold text-[#17233A]">
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
                                    className="w-56 border border-[#DFE6ED] bg-white p-1.5 shadow-lg rounded-xl"
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
                    <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 space-y-6 max-w-7xl w-full mx-auto">
                        {/* BREADCRUMB / KEMBALI KE KELOLA TUGAS */}
                        <div>
                            <Link
                                href="/employer/tasks"
                                className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#607087] transition hover:text-[#173765]"
                            >
                                <ArrowLeft className="size-4" />
                                <span>Kembali ke Kelola Tugas</span>
                            </Link>
                        </div>

                        {/* HEADER / BANNER TUGAS */}
                        <div className="relative overflow-hidden rounded-2xl bg-[#0D2445] p-6 text-white shadow-sm sm:p-8">
                            <div className="absolute -top-12 -right-12 size-40 rounded-full bg-[#21477F]/30 blur-2xl pointer-events-none" />

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="space-y-1.5">
                                    <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-[#7DD3E3]">
                                        APPLICANT MANAGEMENT
                                    </p>
                                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                                        Daftar Pelamar
                                    </h1>
                                    <div className="flex flex-wrap items-center gap-2 pt-1">
                                        <span className="text-sm sm:text-base font-semibold text-white/90">
                                            {task.title}
                                        </span>
                                        <span
                                            className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${taskBadge.className}`}
                                        >
                                            {taskBadge.label}
                                        </span>
                                    </div>
                                </div>

                                <Link
                                    href="/employer/tasks"
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white backdrop-blur-xs transition hover:bg-white/20 shrink-0"
                                >
                                    <Briefcase className="size-4" />
                                    <span>Lihat Semua Tugas</span>
                                </Link>
                            </div>
                        </div>

                        {/* 3 KARTU RINGKASAN (GRID 3 KOLOM) */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {/* Kartu 1: Total Pelamar */}
                            <div className="rounded-2xl border border-[#DFE6ED] bg-white p-5 shadow-xs flex items-center gap-4">
                                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#F0F8FB] text-[#173765]">
                                    <Users className="size-6" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-[#607087]">
                                        Total Pelamar
                                    </p>
                                    <p className="text-2xl sm:text-3xl font-extrabold text-[#17233A] mt-0.5">
                                        {applications.length}
                                    </p>
                                    <p className="text-[11px] text-[#93A2B5] mt-0.5">
                                        Lamaran masuk pada tugas ini
                                    </p>
                                </div>
                            </div>

                            {/* Kartu 2: Menunggu Seleksi */}
                            <div className="rounded-2xl border border-[#DFE6ED] bg-white p-5 shadow-xs flex items-center gap-4">
                                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#FFF4E8] text-[#D98A48]">
                                    <Clock className="size-6" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-[#607087]">
                                        Menunggu Seleksi
                                    </p>
                                    <p className="text-2xl sm:text-3xl font-extrabold text-[#D98A48] mt-0.5">
                                        {task.pendingCount}
                                    </p>
                                    <p className="text-[11px] text-[#93A2B5] mt-0.5">
                                        Perlu ditinjau UMKM
                                    </p>
                                </div>
                            </div>

                            {/* Kartu 3: Pekerja Diterima */}
                            <div className="rounded-2xl border border-[#DFE6ED] bg-white p-5 shadow-xs flex items-center gap-4">
                                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#F0FDF4] text-[#16A34A]">
                                    <CheckCircle2 className="size-6" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-[#607087]">
                                        Pekerja Diterima
                                    </p>
                                    <p className="text-2xl sm:text-3xl font-extrabold text-[#173765] mt-0.5">
                                        {task.acceptedCount}
                                        <span className="text-base font-normal text-[#93A2B5]">
                                            /{quota}
                                        </span>
                                    </p>
                                    <p className="text-[11px] text-[#93A2B5] mt-0.5">
                                        {quotaFull
                                            ? "Kuota terpenuhi"
                                            : `Sisa ${Math.max(0, quota - task.acceptedCount)} kuota lagi`}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* DAFTAR KARTU PELAMAR */}
                        {applications.length === 0 ? (
                            <section className="rounded-2xl border border-dashed border-[#DFE6ED] bg-white px-6 py-16 text-center">
                                <div className="flex size-14 items-center justify-center rounded-2xl bg-[#F0F8FB] text-[#173765] mx-auto">
                                    <Users className="size-7" />
                                </div>
                                <h3 className="mt-4 text-base font-bold text-[#17233A]">
                                    Belum ada pelamar
                                </h3>
                                <p className="mt-1 text-xs text-[#607087] max-w-sm mx-auto">
                                    Lamaran pekerja yang masuk untuk tugas "
                                    {task.title}" akan tampil di halaman ini.
                                </p>
                            </section>
                        ) : (
                            <div className="space-y-4">
                                {applications.map((application) => {
                                    const isPending =
                                        application.status === "pending";
                                    const isAccepted =
                                        application.status === "accepted";
                                    const isRejected =
                                        application.status === "rejected";
                                    const isProcessing =
                                        processingId === application.id;

                                    return (
                                        <article
                                            key={application.id}
                                            className="rounded-2xl border border-[#DFE6ED] bg-white p-5 sm:p-6 shadow-xs transition hover:border-[#BFE7EF]"
                                        >
                                            {/* BARIS ATAS: AVATAR, NAMA, BADGE STATUS */}
                                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
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
                                                                    "5.0"}
                                                            </span>
                                                            <span>•</span>
                                                            <span>
                                                                {application.completedTasks ??
                                                                    0}{" "}
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
                                                            Melamar:{" "}
                                                            {application.appliedAt ||
                                                                application.appliedAtHuman ||
                                                                "Baru saja"}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* STATUS PILL BADGE */}
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
                                                    <div className="mt-4 flex flex-wrap items-center gap-1.5 pt-3 border-t border-[#DFE6ED]/60">
                                                        <span className="text-[11px] font-semibold text-[#93A2B5] mr-1">
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

                                            {/* AKSI SELEKSI / INFO PENINJAUAN */}
                                            {isPending ? (
                                                <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#DFE6ED]">
                                                    <div>
                                                        {quotaFull && (
                                                            <p className="text-xs text-[#D98A48] font-medium">
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
                                                            className="rounded-xl border border-[#DFE6ED] px-3.5 py-2 text-xs font-bold text-[#173765] hover:bg-[#F7F9FB] transition cursor-pointer"
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
                                                                    "Kualifikasi belum sesuai dengan kebutuhan tugas saat ini.",
                                                                );
                                                                setRejectError(
                                                                    null,
                                                                );
                                                            }}
                                                            className="rounded-xl bg-[#FEE2E2] px-4 py-2 text-xs font-bold text-[#EF4444] hover:bg-red-100 transition cursor-pointer disabled:opacity-50"
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
                                                            className="rounded-xl bg-[#173765] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#21477F] transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                                                        >
                                                            {isProcessing
                                                                ? "Memproses..."
                                                                : "Terima"}
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="mt-4 rounded-xl bg-[#F7F9FB] border border-[#DFE6ED] p-3 text-xs text-[#607087] space-y-1">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-semibold text-[#17233A]">
                                                            Status Seleksi:{" "}
                                                            {isAccepted
                                                                ? "Diterima"
                                                                : "Ditolak"}
                                                        </span>
                                                        <span className="text-[#93A2B5]">
                                                            Diperiksa:{" "}
                                                            {application.reviewedAt ||
                                                                "-"}
                                                        </span>
                                                    </div>
                                                    {application.reviewNotes && (
                                                        <p className="text-[11px] text-[#607087] pt-1 border-t border-[#DFE6ED]/60">
                                                            <strong className="text-[#17233A]">
                                                                Catatan:
                                                            </strong>{" "}
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-5 animate-in fade-in-50 zoom-in-95">
                        <div className="flex items-center justify-between border-b border-[#DFE6ED] pb-3.5">
                            <h3 className="text-base font-bold text-[#17233A]">
                                Profil Pekerja
                            </h3>
                            <button
                                type="button"
                                onClick={() => setProfileTarget(null)}
                                className="rounded-lg p-1.5 text-[#607087] hover:bg-[#F7F9FB] transition"
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
                                <p className="text-xs text-[#607087] mt-0.5">
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
                        <div className="grid grid-cols-2 gap-3 rounded-xl bg-[#F7F9FB] p-3.5 border border-[#DFE6ED]">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-[#93A2B5]">
                                    Rating Platform
                                </p>
                                <p className="flex items-center gap-1 font-bold text-[#17233A] mt-0.5 text-sm">
                                    <Star className="size-4 fill-[#EAB308] text-[#EAB308]" />
                                    <span>{profileTarget.rating ?? "5.0"}</span>
                                </p>
                            </div>

                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-[#93A2B5]">
                                    Tugas Diselesaikan
                                </p>
                                <p className="font-bold text-[#173765] mt-0.5 text-sm">
                                    {profileTarget.completedTasks ?? 0} Tugas
                                </p>
                            </div>
                        </div>

                        {/* Keahlian */}
                        <div>
                            <p className="text-xs font-semibold text-[#17233A] mb-1.5">
                                Keahlian & Kualifikasi:
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {(profileTarget.skills &&
                                profileTarget.skills.length > 0
                                    ? profileTarget.skills
                                    : ["Ketelitian", "Operasional", "Kerja Tim"]
                                ).map((skill, idx) => (
                                    <span
                                        key={idx}
                                        className="rounded-lg bg-[#F0F8FB] border border-[#D8F1F6] px-2.5 py-1 text-xs font-medium text-[#173765]"
                                    >
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="pt-3 border-t border-[#DFE6ED] flex justify-end">
                            <button
                                type="button"
                                onClick={() => setProfileTarget(null)}
                                className="rounded-xl bg-[#173765] px-4 py-2 text-xs font-bold text-white hover:bg-[#21477F] transition"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================
                MODAL 2: TOLAK LAMARAN PEKERJA
            ======================================================== */}
            {rejectTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4 animate-in fade-in-50 zoom-in-95">
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
                                className="rounded-lg p-1.5 text-[#607087] hover:bg-[#F7F9FB] transition"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        <div>
                            <p className="text-xs text-[#607087]">
                                Anda akan menolak lamaran dari{" "}
                                <strong className="text-[#17233A]">
                                    {rejectTarget.workerName}
                                </strong>{" "}
                                untuk tugas{" "}
                                <strong className="text-[#17233A]">
                                    {task.title}
                                </strong>
                                .
                            </p>

                            <div className="mt-3">
                                <label className="block text-xs font-semibold text-[#17233A] mb-1">
                                    Alasan Penolakan{" "}
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

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#DFE6ED]">
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
                                    ? "Menyimpan..."
                                    : "Konfirmasi Tolak"}
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
