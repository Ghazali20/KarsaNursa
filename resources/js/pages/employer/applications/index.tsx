import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    Bell,
    Briefcase,
    Check,
    CheckCircle2,
    ChevronDown,
    ClipboardPlus,
    Clock,
    House,
    LayoutGrid,
    LogOut,
    Mail,
    MapPin,
    Menu,
    Phone,
    ShieldAlert,
    ShieldCheck,
    Star,
    UserCheck,
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
// TIPE DATA PELAMAR & STATISTIK
// ==========================================

export type ApplicationItem = {
    id: number;
    taskId: number;
    taskTitle: string;
    taskStatus: string;
    taskQuota: number;
    taskAcceptedCount: number;
    workerId: number;
    workerName: string;
    workerEmail: string;
    workerPhone?: string;
    workerInitials?: string;
    isVerified?: boolean;
    verificationStatus?: string;
    rating?: string;
    completedTasks?: number;
    skills?: string[];
    workerAddress?: string;
    workerIdentityType?: string;
    status: 'pending' | 'accepted' | 'rejected';
    message?: string | null;
    appliedAt: string | null;
    appliedAtHuman?: string;
    reviewedAt: string | null;
    reviewNotes: string | null;
    wageAmount: number;
    paymentStatus: 'pending' | 'paid' | 'cancelled' | null;
    paymentStatusLabel: string | null;
    paidAt: string | null;
};

type Props = {
    stats: {
        total: number;
        pending: number;
        accepted: number;
        rejected: number;
        pendingPayments: number;
    };
    applications: ApplicationItem[];
};

// ==========================================
// HELPER FORMATTING
// ==========================================

function formatFirstName(name: string): string {
    return name.trim().split(/\s+/)[0] ?? name;
}

function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'PK';
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
// KOMPONEN UTAMA KELOLA PELAMAR
// ==========================================

export default function EmployerApplicationsIndex({
    stats,
    applications = [],
}: Props) {
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
        flash?: {
            success?: string;
            error?: string;
        };
    };

    const user = pageProps.auth?.user ?? { name: 'Pemilik UMKM', email: '' };
    const firstName = formatFirstName(user.name);
    const userInitials = getInitials(user.name);
    const businessName = user.business?.name || `${firstName} Official Store`;

    // State Lokal
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [processingId, setProcessingId] = useState<number | null>(null);

    // Modal Tolak State
    const [rejectTarget, setRejectTarget] = useState<ApplicationItem | null>(null);
    const [rejectReason, setRejectReason] = useState(
        'Kualifikasi pelamar belum sesuai dengan kebutuhan tugas saat ini.',
    );
    const [rejectError, setRejectError] = useState<string | null>(null);

    // Modal Profil Detail State
    const [profileTarget, setProfileTarget] = useState<ApplicationItem | null>(null);

    // Filter Status Aktif: default 'pending' (hanya pelamar yang perlu ditinjau)
    const [statusFilter, setStatusFilter] = useState<'pending' | 'all'>('pending');

    const pendingCount = stats?.pending ?? 0;

    // Flash message listener
    useEffect(() => {
        if (pageProps.flash?.success) {
            toast.success(pageProps.flash.success);
        }
        if (pageProps.flash?.error) {
            toast.error(pageProps.flash.error);
        }
    }, [pageProps.flash]);

    // Filter daftar pelamar
    const filteredApplications =
        statusFilter === 'pending'
            ? applications.filter((app) => app.status === 'pending')
            : applications;

    // Handler Terima Pelamar
    function handleAccept(application: ApplicationItem) {
        if (processingId !== null) return;
        setProcessingId(application.id);

        router.patch(
            `/employer/tasks/${application.taskId}/applications/${application.id}/decision`,
            {
                decision: 'accepted',
                review_notes: null,
                return_to: 'inbox',
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(`Pelamar ${application.workerName} diterima!`, {
                        description: `Kuota tugas "${application.taskTitle}" telah diperbarui.`,
                    });
                    router.reload({ only: ['applications', 'stats'] });
                },
                onError: (responseErrors) => {
                    toast.error(
                        responseErrors.application || responseErrors.review_notes || 'Gagal menerima pelamar.',
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
            setRejectError('Alasan penolakan minimal 5 karakter.');
            return;
        }

        setProcessingId(rejectTarget.id);
        setRejectError(null);

        router.patch(
            `/employer/tasks/${rejectTarget.taskId}/applications/${rejectTarget.id}/decision`,
            {
                decision: 'rejected',
                review_notes: reason,
                return_to: 'inbox',
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.error(`Lamaran dari ${rejectTarget.workerName} ditolak.`, {
                        description: 'Catatan penolakan telah diteruskan ke pekerja.',
                    });
                    setRejectTarget(null);
                    router.reload({ only: ['applications', 'stats'] });
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

    return (
        <>
            <Head>
                <title>Kelola Pelamar - Karsa Nusa</title>
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
                    1. SIDEBAR KIRI (DENGAN MENU "KELOLA PELAMAR" AKTIF SOLID)
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

                    {/* Kategori Label & Menu Navigasi */}
                    <div className="flex flex-1 flex-col justify-between overflow-y-auto px-4 py-5">
                        <div>
                            <p className="px-3 text-[10px] font-bold tracking-[0.14em] text-[#93A2B5] uppercase">
                                DASHBOARD UMKM
                            </p>

                            <nav className="mt-3 space-y-1">
                                {/* Overview */}
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

                                {/* Kelola Pelamar (STATE AKTIF: SOLID BIRU GELAP #173765) */}
                                <Link
                                    href="/employer/applications"
                                    className="flex items-center justify-between rounded-xl bg-[#173765] px-3.5 py-2.5 text-sm font-bold text-white shadow-xs transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <Users className="size-4.5 text-white" />
                                        <span>Kelola Pelamar</span>
                                    </div>
                                    {pendingCount > 0 && (
                                        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-[#173765]">
                                            {pendingCount}
                                        </span>
                                    )}
                                </Link>

                                {/* Kelola Tugas */}
                                <Link
                                    href="/employer/tasks"
                                    className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-[#607087] transition-colors hover:bg-[#F7F9FB] hover:text-[#17233A]"
                                >
                                    <Briefcase className="size-4.5 text-[#607087]" />
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

                        {/* Tombol Kembali ke Beranda di Bagian Bawah */}
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
                    KONTEN UTAMA (HEADER BAR + DAFTAR KELOLA PELAMAR)
                ======================================================== */}
                <div className="flex flex-1 flex-col min-w-0 overflow-y-auto">
                    {/* Top Header Bar */}
                    <header className="sticky top-0 z-30 flex h-[72px] shrink-0 items-center justify-between border-b border-[#DFE6ED] bg-white px-4 sm:px-6 lg:px-8">
                        {/* Kiri: Toggle Mobile & Subtitle/Title */}
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
                                    Kelola operasional usahamu
                                </h2>
                            </div>
                        </div>

                        {/* Kanan: Notifikasi & Akun Pengguna */}
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
                                    className="w-56 border border-[#DFE6ED] bg-white p-1.5 shadow-lg rounded-xl"
                                >
                                    <div className="px-3 py-2 sm:hidden border-b border-[#DFE6ED] mb-1">
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
                        AREA KONTEN: HALAMAN KELOLA PELAMAR
                    ======================================================== */}
                    <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 space-y-6 max-w-7xl w-full mx-auto">
                        {/* ========================================================
                            2. HEADER HALAMAN
                        ======================================================== */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-[#173765]">
                                    APPLICANT MANAGEMENT
                                </p>

                                <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-[#17233A]">
                                    Kelola pelamar
                                </h1>

                                <p className="mt-1 text-xs sm:text-sm text-[#607087]">
                                    Bandingkan profil, riwayat kerja, dan
                                    reputasi pekerja sebelum mengambil keputusan.
                                </p>
                            </div>

                            {/* Kanan: Badge Pill Status Antrean */}
                            <div className="flex items-center gap-3">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF4E8] px-3.5 py-1.5 text-xs font-bold text-[#D98A48] border border-[#D98A48]/20">
                                    <span className="size-1.5 rounded-full bg-[#D98A48]" />
                                    <span>{pendingCount} Perlu Ditinjau</span>
                                </span>
                            </div>
                        </div>

                        {/* Filter Tab Sederhana */}
                        <div className="flex items-center gap-2 border-b border-[#DFE6ED] pb-2 text-xs font-semibold">
                            <button
                                type="button"
                                onClick={() => setStatusFilter('pending')}
                                className={`rounded-lg px-3.5 py-1.5 transition cursor-pointer ${
                                    statusFilter === 'pending'
                                        ? 'bg-[#173765] text-white shadow-xs'
                                        : 'text-[#607087] hover:bg-white hover:text-[#17233A]'
                                }`}
                            >
                                Perlu Ditinjau ({pendingCount})
                            </button>
                            <button
                                type="button"
                                onClick={() => setStatusFilter('all')}
                                className={`rounded-lg px-3.5 py-1.5 transition cursor-pointer ${
                                    statusFilter === 'all'
                                        ? 'bg-[#173765] text-white shadow-xs'
                                        : 'text-[#607087] hover:bg-white hover:text-[#17233A]'
                                }`}
                            >
                                Semua Riwayat ({applications.length})
                            </button>
                        </div>

                        {/* ========================================================
                            3. CONTAINER & DAFTAR KARTU PELAMAR
                        ======================================================== */}
                        {filteredApplications.length === 0 ? (
                            /* 4. EMPTY STATE */
                            <div className="flex flex-col items-center justify-center rounded-2xl border border-[#DFE6ED] bg-white p-12 text-center shadow-xs">
                                <div className="flex size-14 items-center justify-center rounded-2xl bg-[#F0F8FB] text-[#173765]">
                                    <Users className="size-7" />
                                </div>
                                <h3 className="mt-4 text-base font-bold text-[#17233A]">
                                    {statusFilter === 'pending'
                                        ? 'Tidak ada pelamar yang perlu ditinjau'
                                        : 'Belum ada data pelamar'}
                                </h3>
                                <p className="mt-1 max-w-sm text-xs leading-relaxed text-[#607087]">
                                    {statusFilter === 'pending'
                                        ? 'Semua lamaran kerja yang masuk telah Anda tinjau. Pelamar baru akan muncul di sini secara otomatis.'
                                        : 'Pelamar yang mengajukan tugas UMKM Anda akan tampil di halaman ini.'}
                                </p>
                                <Link
                                    href="/employer/dashboard"
                                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#173765] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#21477F]"
                                >
                                    <span>Kembali ke Dashboard</span>
                                </Link>
                            </div>
                        ) : (
                            /* KARTU DAFTAR PELAMAR */
                            <div className="overflow-hidden rounded-2xl border border-[#DFE6ED] bg-white shadow-xs divide-y divide-[#DFE6ED]">
                                {filteredApplications.map((application) => {
                                    const isPending =
                                        application.status === 'pending';
                                    const isProcessingThis =
                                        processingId === application.id;

                                    const rating = application.rating || '4.9';
                                    const completed =
                                        application.completedTasks ?? 0;
                                    const skills =
                                        application.skills &&
                                        application.skills.length > 0
                                            ? application.skills
                                            : ['Ketelitian', 'Operasional', 'Kerja Tim'];
                                    const appliedTime =
                                        application.appliedAtHuman ||
                                        (application.appliedAt
                                            ? `Diajukan ${application.appliedAt}`
                                            : 'Baru saja');

                                    return (
                                        <div
                                            key={application.id}
                                            className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 p-5 sm:p-6 transition hover:bg-[#F7F9FB]/40"
                                        >
                                            {/* ========================================
                                                BAGIAN KIRI: IDENTITAS & REPUTASI
                                            ======================================== */}
                                            <div className="flex items-start gap-4 min-w-[280px]">
                                                {/* Avatar Inisial Lingkaran Soft Cyan */}
                                                <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#D8F1F6] text-sm font-bold text-[#173765]">
                                                    {application.workerInitials ||
                                                        getInitials(
                                                            application.workerName,
                                                        )}
                                                </div>

                                                <div className="space-y-1">
                                                    {/* Baris 1: Nama Lengkap + Ikon Centang Perisai */}
                                                    <div className="flex items-center gap-1.5">
                                                        <h3 className="text-sm sm:text-base font-bold text-[#17233A]">
                                                            {
                                                                application.workerName
                                                            }
                                                        </h3>
                                                        {application.isVerified && (
                                                            <ShieldCheck className="size-4 text-[#173765]" />
                                                        )}
                                                    </div>

                                                    {/* Baris 2: Bintang Oranye + Rating + Jumlah Tugas Selesai */}
                                                    <div className="flex items-center gap-2 text-xs text-[#607087]">
                                                        <span className="flex items-center gap-1 font-bold text-[#17233A]">
                                                            <Star className="size-3.5 fill-[#D98A48] text-[#D98A48]" />
                                                            {rating}
                                                        </span>
                                                        <span className="text-[#DFE6ED]">
                                                            •
                                                        </span>
                                                        <span>
                                                            {completed}{' '}
                                                            tugas selesai
                                                        </span>
                                                    </div>

                                                    {/* Baris 3: Daftar Keahlian */}
                                                    <p className="text-xs text-[#93A2B5] font-medium">
                                                        Keahlian:{' '}
                                                        <span className="text-[#607087]">
                                                            {skills.join(' · ')}
                                                        </span>
                                                    </p>
                                                </div>
                                            </div>

                                            {/* ========================================
                                                BAGIAN TENGAH: INFO TUGAS YANG DILAMAR
                                            ======================================== */}
                                            <div className="flex-1 lg:border-l lg:border-[#DFE6ED] lg:pl-6 space-y-1">
                                                <p className="text-[10px] font-bold tracking-wider uppercase text-[#93A2B5]">
                                                    MELAMAR UNTUK
                                                </p>
                                                <h4 className="text-xs sm:text-sm font-semibold text-[#17233A] line-clamp-1">
                                                    {application.taskTitle}
                                                </h4>
                                                <p className="text-xs text-[#93A2B5] flex items-center gap-1">
                                                    <Clock className="size-3 text-[#93A2B5]" />
                                                    {appliedTime}
                                                </p>
                                            </div>

                                            {/* ========================================
                                                BAGIAN KANAN: 3 TOMBOL AKSI HORIZONTAL
                                            ======================================== */}
                                            <div className="flex flex-wrap items-center gap-2.5 shrink-0 pt-2 lg:pt-0">
                                                {/* Tombol Lihat Profil */}
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setProfileTarget(
                                                            application,
                                                        )
                                                    }
                                                    className="rounded-xl px-3.5 py-2 text-xs font-semibold text-[#607087] transition hover:bg-[#F7F9FB] hover:text-[#17233A] cursor-pointer"
                                                >
                                                    Lihat Profil
                                                </button>

                                                {isPending ? (
                                                    <>
                                                        {/* Tombol Tolak */}
                                                        <button
                                                            type="button"
                                                            disabled={
                                                                isProcessingThis
                                                            }
                                                            onClick={() => {
                                                                setRejectTarget(
                                                                    application,
                                                                );
                                                                setRejectError(
                                                                    null,
                                                                );
                                                            }}
                                                            className="rounded-xl bg-[#FFF1F2] px-4 py-2 text-xs font-bold text-[#EF4444] transition hover:bg-[#FEE2E2] disabled:opacity-50 cursor-pointer"
                                                        >
                                                            Tolak
                                                        </button>

                                                        {/* Tombol Terima */}
                                                        <button
                                                            type="button"
                                                            disabled={
                                                                isProcessingThis
                                                            }
                                                            onClick={() =>
                                                                handleAccept(
                                                                    application,
                                                                )
                                                            }
                                                            className="inline-flex items-center gap-1.5 rounded-xl bg-[#173765] px-4.5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[#21477F] disabled:opacity-50 cursor-pointer"
                                                        >
                                                            <Check className="size-3.5" />
                                                            <span>
                                                                {isProcessingThis
                                                                    ? 'Memproses...'
                                                                    : 'Terima'}
                                                            </span>
                                                        </button>
                                                    </>
                                                ) : (
                                                    <span
                                                        className={`rounded-xl px-3.5 py-1.5 text-xs font-bold ${
                                                            application.status ===
                                                            'accepted'
                                                                ? 'bg-[#D8F1F6] text-[#173765]'
                                                                : 'bg-red-50 text-[#EF4444]'
                                                        }`}
                                                    >
                                                        {application.status ===
                                                        'accepted'
                                                            ? 'Disetujui ✓'
                                                            : 'Ditolak ✕'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </main>
                </div>
            </div>

            {/* ========================================================
                MODAL DETAIL PROFIL PELAMAR
            ======================================================== */}
            {profileTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl border border-[#DFE6ED] bg-white p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-[#DFE6ED] pb-3">
                            <h3 className="text-base font-bold text-[#17233A]">
                                Detail Profil Pelamar
                            </h3>
                            <button
                                type="button"
                                onClick={() => setProfileTarget(null)}
                                className="rounded-lg p-1 text-[#607087] hover:bg-[#F7F9FB]"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        {/* Profil Header */}
                        <div className="flex items-center gap-4">
                            <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-[#D8F1F6] text-base font-bold text-[#173765]">
                                {profileTarget.workerInitials ||
                                    getInitials(profileTarget.workerName)}
                            </div>
                            <div>
                                <div className="flex items-center gap-1.5">
                                    <h4 className="text-base font-bold text-[#17233A]">
                                        {profileTarget.workerName}
                                    </h4>
                                    {profileTarget.isVerified && (
                                        <ShieldCheck className="size-4 text-[#173765]" />
                                    )}
                                </div>
                                <div className="mt-0.5 space-y-0.5 text-xs text-[#607087]">
                                    <p className="flex items-center gap-1">
                                        <Mail className="size-3 text-[#93A2B5]" />
                                        <span>{profileTarget.workerEmail}</span>
                                    </p>
                                    {profileTarget.workerPhone && (
                                        <p className="flex items-center gap-1">
                                            <Phone className="size-3 text-[#93A2B5]" />
                                            <span>{profileTarget.workerPhone}</span>
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Kotak Rincian Profil */}
                        <div className="rounded-xl border border-[#DFE6ED] bg-[#F7F9FB] p-4 space-y-2.5 text-xs">
                            <div className="flex justify-between items-center">
                                <span className="text-[#93A2B5]">Reputasi Pekerja:</span>
                                <span className="font-bold text-[#17233A] flex items-center gap-1">
                                    <Star className="size-3.5 fill-[#D98A48] text-[#D98A48]" />
                                    {profileTarget.rating || '4.9'}
                                </span>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-[#93A2B5]">Tugas Terselesaikan:</span>
                                <span className="font-bold text-[#17233A]">
                                    {profileTarget.completedTasks ?? 0} tugas
                                </span>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-[#93A2B5]">Status Akun:</span>
                                <span className="font-semibold text-[#173765]">
                                    {profileTarget.isVerified
                                        ? 'Terverifikasi'
                                        : 'Menunggu Verifikasi'}
                                </span>
                            </div>

                            <div className="flex justify-between items-start gap-2">
                                <span className="text-[#93A2B5] shrink-0">Keahlian:</span>
                                <span className="font-bold text-[#17233A] text-right">
                                    {profileTarget.skills &&
                                    profileTarget.skills.length > 0
                                        ? profileTarget.skills.join(', ')
                                        : 'Ketelitian, Operasional'}
                                </span>
                            </div>

                            {profileTarget.workerAddress && (
                                <div className="flex justify-between items-start gap-2">
                                    <span className="text-[#93A2B5] shrink-0">Alamat:</span>
                                    <span className="font-medium text-[#17233A] text-right line-clamp-2">
                                        {profileTarget.workerAddress}
                                    </span>
                                </div>
                            )}

                            <div className="border-t border-[#DFE6ED] pt-2 flex justify-between items-center">
                                <span className="text-[#93A2B5]">Tugas yang Dilamar:</span>
                                <span className="font-bold text-[#17233A] text-right max-w-[200px] truncate">
                                    {profileTarget.taskTitle}
                                </span>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-[#93A2B5]">Upah Bersih:</span>
                                <span className="font-bold text-[#173765]">
                                    {formatRupiah(profileTarget.wageAmount)}
                                </span>
                            </div>
                        </div>

                        {/* Pesan Lamaran dari Pekerja jika ada */}
                        {profileTarget.message && (
                            <div>
                                <p className="text-[11px] font-bold text-[#17233A] mb-1">
                                    Pesan dari Pekerja:
                                </p>
                                <p className="text-xs text-[#607087] bg-white border border-[#DFE6ED] p-2.5 rounded-xl whitespace-pre-line leading-relaxed">
                                    {profileTarget.message}
                                </p>
                            </div>
                        )}

                        <div className="flex justify-end gap-2 pt-2 border-t border-[#DFE6ED]">
                            <button
                                type="button"
                                onClick={() => setProfileTarget(null)}
                                className="rounded-xl border border-[#DFE6ED] px-4 py-2 text-xs font-semibold text-[#607087] hover:bg-[#F7F9FB]"
                            >
                                Tutup
                            </button>
                            {profileTarget.status === 'pending' && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        const target = profileTarget;
                                        setProfileTarget(null);
                                        handleAccept(target);
                                    }}
                                    className="rounded-xl bg-[#173765] px-4 py-2 text-xs font-bold text-white hover:bg-[#21477F] shadow-xs cursor-pointer"
                                >
                                    Terima Pekerja
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================
                MODAL ALASAN PENOLAKAN PELAMAR
            ======================================================== */}
            {rejectTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl border border-[#DFE6ED] bg-white p-6 shadow-2xl space-y-4">
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
                                    {rejectTarget.workerName}
                                </strong>{' '}
                                untuk tugas{' '}
                                <strong className="text-[#17233A]">
                                    {rejectTarget.taskTitle}
                                </strong>.
                            </p>

                            <div className="mt-3">
                                <label className="block text-xs font-semibold text-[#17233A] mb-1">
                                    Alasan Penolakan <span className="text-red-500">*</span>
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
                                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50 cursor-pointer"
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
// MENGISOLASI LAYOUT KHUSUS
// ==========================================
function EmployerApplicationsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}

EmployerApplicationsIndex.layout = EmployerApplicationsLayout;
