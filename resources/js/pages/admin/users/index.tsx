import { Head, Link, router } from '@inertiajs/react';
import {
    Check,
    Clock3,
    Download,
    FileText,
    Search,
    UsersRound,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

// ========================================
// TIPE DATA
// ========================================

type Stats = {
    totalQueue: number;
    pendingWorkers: number;
    pendingEmployers: number;
    activeUsers: number;
    verifiedDocuments: number;
};

type PendingUser = {
    id: number;
    name: string;
    email: string;
    businessName: string | null;
    accountStatus: 'pending' | 'approved' | 'rejected';
    documentStatus: string;
    role: 'worker' | 'employer';
    documentId: number | null;
    documentType: string;
    documentsRemaining: number;
    createdLabel: string;
    downloadUrl: string | null;
    documentFileName?: string | null;
    documentMimeType?: string | null;
};

type PaginatedQueue = {
    data: PendingUser[];
    current_page: number;
    last_page: number;
    total: number;
    prev_page_url: string | null;
    next_page_url: string | null;
};

type AccountFilter = 'all' | 'pending' | 'approved' | 'rejected';

type Props = {
    stats: Stats;
    queue: PaginatedQueue;
    filters?: { search: string; status: AccountFilter };
};

// ========================================
// KOMPONEN HALAMAN
// ========================================

export default function AdminUsers({ stats, queue, filters }: Props) {
    const [search, setSearch] = useState(filters?.search ?? '');
    const [status, setStatus] = useState<AccountFilter>(
        filters?.status ?? 'all',
    );
    const initialized = useRef(false);

    // Query server-side: pencarian dan filter berlaku untuk SEMUA akun,
    // bukan hanya data di halaman pagination yang sedang dibuka.
    useEffect(() => {
        if (!initialized.current) {
            initialized.current = true;
            return;
        }

        const timeout = window.setTimeout(() => {
            router.get(
                '/admin/users',
                { search: search.trim(), status },
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                    only: ['queue', 'filters'],
                },
            );
        }, 350);

        return () => window.clearTimeout(timeout);
    }, [search, status]);

    const [rejecting, setRejecting] = useState<PendingUser | null>(null);
    const [previewUser, setPreviewUser] = useState<PendingUser | null>(null);

    const [reviewNotes, setReviewNotes] = useState('');

    const [processingId, setProcessingId] = useState<number | null>(null);

    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    function isImageFile(
        fileName?: string | null,
        mimeType?: string | null,
    ): boolean {
        if (mimeType && mimeType.startsWith('image/')) return true;
        if (fileName && /\.(jpe?g|png|webp|gif|svg)$/i.test(fileName))
            return true;
        return false;
    }

    function isPdfFile(
        fileName?: string | null,
        mimeType?: string | null,
    ): boolean {
        if (mimeType && mimeType === 'application/pdf') return true;
        if (fileName && /\.pdf$/i.test(fileName)) return true;
        return false;
    }

    // ========================================
    // VERIFIKASI DOKUMEN
    // ========================================

    function approveDocument(user: PendingUser) {
        if (processingId !== null || user.documentId === null) {
            return;
        }

        setError(null);
        setNotice(null);
        setProcessingId(user.documentId);

        router.patch(
            `/admin/users/documents/${user.documentId}/approve`,
            {},
            {
                preserveScroll: true,

                onSuccess: () => {
                    setNotice(`Dokumen ${user.name} berhasil diverifikasi.`);
                },

                onError: (errors) => {
                    setError(
                        Object.values(errors)[0] ??
                            'Gagal memverifikasi dokumen.',
                    );
                },

                onFinish: () => {
                    setProcessingId(null);
                },
            },
        );
    }

    // ========================================
    // TOLAK DOKUMEN
    // ========================================

    function rejectDocument() {
        if (
            rejecting === null ||
            rejecting.documentId === null ||
            processingId !== null
        ) {
            return;
        }

        const reason = reviewNotes.trim();

        if (reason.length < 5) {
            setError('Alasan penolakan minimal 5 karakter.');
            return;
        }

        const documentId = rejecting.documentId;
        const userName = rejecting.name;

        setError(null);
        setNotice(null);
        setProcessingId(documentId);

        router.patch(
            `/admin/users/documents/${documentId}/reject`,
            {
                review_notes: reason,
            },
            {
                preserveScroll: true,

                onSuccess: () => {
                    setRejecting(null);
                    setReviewNotes('');
                    setNotice(`Dokumen ${userName} berhasil ditolak.`);
                },

                onError: (errors) => {
                    setError(
                        errors.review_notes ??
                            errors.document ??
                            'Gagal menolak dokumen.',
                    );
                },

                onFinish: () => {
                    setProcessingId(null);
                },
            },
        );
    }

    const statistics = [
        {
            label: 'Total antrean',
            value: `${stats.totalQueue.toLocaleString('id-ID')} Akun`,
            description:
                `${stats.pendingEmployers} UMKM · ` +
                `${stats.pendingWorkers} Pekerja`,
            icon: Clock3,
            iconClass: 'bg-sky-50 text-[#21477F]',
        },
        {
            label: 'Total Akun Aktif',
            value: `${stats.activeUsers.toLocaleString('id-ID')} Akun`,
            description: 'Worker & UMKM Aktif',
            icon: UsersRound,
            iconClass: 'bg-orange-50 text-orange-500',
        },
        {
            label: 'Dokumen Terverifikasi',
            value: `${stats.verifiedDocuments.toLocaleString('id-ID')} Dokumen`,
            description: 'Dokumen yang dinyatakan valid',
            icon: Check,
            iconClass: 'bg-sky-50 text-[#21477F]',
        },
    ];

    return (
        <>
            <Head title="Manajemen Akun - KarsaNursa" />

            <main className="min-h-[calc(100svh-70px)] w-full bg-[#21477F] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
                <div className="mx-auto max-w-[1440px] space-y-5">
                    {/* ====================================
                        HEADER HALAMAN
                    ==================================== */}

                    <header className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-medium tracking-tight text-white sm:text-[28px]">
                                Manajemen akun pengguna
                            </h1>

                            <p className="mt-2 text-xs leading-relaxed text-white/80">
                                Validasi dokumen identitas pekerja dan legalitas
                                usaha.
                            </p>
                        </div>

                        <span className="rounded-full bg-[#fff0c2] px-3 py-1.5 text-xs font-bold text-amber-700">
                            {stats.totalQueue.toLocaleString('id-ID')} Menunggu
                        </span>
                    </header>

                    {/* ====================================
                        TIGA KARTU STATISTIK
                    ==================================== */}

                    <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        {statistics.map((stat) => {
                            const Icon = stat.icon;

                            return (
                                <article
                                    key={stat.label}
                                    className="flex min-h-[100px] items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                                >
                                    <span
                                        className={[
                                            'flex h-11 w-11 shrink-0',
                                            'items-center justify-center',
                                            'rounded-xl',
                                            stat.iconClass,
                                        ].join(' ')}
                                    >
                                        <Icon size={21} />
                                    </span>

                                    <div className="min-w-0">
                                        <p className="text-xs text-slate-600">
                                            {stat.label}
                                        </p>

                                        <p className="mt-1 text-xl font-bold tracking-tight text-slate-950 tabular-nums">
                                            {stat.value}
                                        </p>

                                        <p className="mt-2 text-[11px] leading-relaxed text-blue-600">
                                            {stat.description}
                                        </p>
                                    </div>
                                </article>
                            );
                        })}
                    </section>

                    {/* PESAN BERHASIL */}

                    {notice && (
                        <div
                            role="status"
                            className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
                        >
                            {notice}
                        </div>
                    )}

                    {/* PESAN ERROR */}

                    {error && rejecting === null && (
                        <div
                            role="alert"
                            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                        >
                            {error}
                        </div>
                    )}

                    {/* ====================================
                        PENCARIAN & DAFTAR SEMUA AKUN
                    ==================================== */}

                    <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <div className="relative min-w-0 flex-1">
                                <Search
                                    size={19}
                                    aria-hidden="true"
                                    className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-slate-500"
                                />
                                <input
                                    aria-label="Cari akun"
                                    type="search"
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    placeholder="Cari ID, nama, email, atau nama UMKM..."
                                    className="h-12 w-full rounded-xl border border-slate-200 bg-white pr-4 pl-12 text-sm text-[#142b4d] outline-none placeholder:text-[#9aaec9] focus:border-[#21477F] focus:ring-2 focus:ring-blue-100"
                                />
                            </div>
                            <select
                                aria-label="Filter status akun"
                                value={status}
                                onChange={(event) =>
                                    setStatus(
                                        event.target.value as AccountFilter,
                                    )
                                }
                                className="h-12 min-w-[185px] rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-[#142b4d] outline-none focus:border-[#21477F] focus:ring-2 focus:ring-blue-100"
                            >
                                <option value="all">Semua</option>
                                <option value="pending">Menunggu</option>
                                <option value="approved">Disetujui</option>
                                <option value="rejected">Ditolak</option>
                            </select>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                            <div>
                                <h2 className="text-sm font-semibold text-[#172b49]">
                                    Daftar akun Worker & UMKM
                                </h2>
                                <p className="mt-0.5 text-xs text-slate-500">
                                    Cari akun, periksa status, dan tinjau
                                    dokumen yang menunggu.
                                </p>
                            </div>
                            <span className="text-xs font-medium text-slate-500">
                                {queue.total.toLocaleString('id-ID')} akun
                                ditemukan
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[850px] border-collapse text-left">
                                <thead>
                                    <tr className="border-b border-slate-200 text-[11px] font-semibold tracking-wide text-[#7790b0] uppercase">
                                        <th className="px-2 py-4">
                                            Akun / Pengajuan
                                        </th>
                                        <th className="px-2 py-4">Status</th>
                                        <th className="px-2 py-4">Dokumen</th>
                                        <th className="px-2 py-4">
                                            Waktu Didaftarkan
                                        </th>
                                        <th className="px-2 py-4 text-right">
                                            Tindakan
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {queue.data.map((user) => {
                                        const initials = user.name
                                            .trim()
                                            .split(/\s+/)
                                            .slice(0, 2)
                                            .map((word) => word.charAt(0))
                                            .join('')
                                            .toUpperCase();
                                        const isProcessing =
                                            processingId === user.documentId &&
                                            user.documentId !== null;

                                        const statusLabel =
                                            user.accountStatus === 'approved'
                                                ? 'Disetujui'
                                                : user.accountStatus ===
                                                    'rejected'
                                                  ? 'Ditolak'
                                                  : 'Menunggu';

                                        const badgeClass =
                                            user.accountStatus === 'approved'
                                                ? 'bg-emerald-100 text-emerald-800'
                                                : user.accountStatus ===
                                                    'rejected'
                                                  ? 'bg-red-100 text-red-700'
                                                  : 'bg-amber-100 text-amber-700';

                                        return (
                                            <tr
                                                key={user.id}
                                                className="align-middle hover:bg-slate-50/80"
                                            >
                                                <td className="px-2 py-4">
                                                    <div className="flex min-w-0 items-center gap-3">
                                                        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#d4f1f7] text-xs font-bold text-[#172b49]">
                                                            {initials}
                                                        </span>
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-bold text-slate-900">
                                                                {user.name}
                                                            </p>
                                                            <p className="mt-0.5 text-[11px] text-slate-500">
                                                                ID #{user.id} ·{' '}
                                                                {user.email}
                                                            </p>
                                                            <p className="mt-0.5 text-[11px] text-[#21477F]">
                                                                {user.role ===
                                                                'employer'
                                                                    ? `UMKM${user.businessName ? ` · ${user.businessName}` : ''}`
                                                                    : 'Pencari Kerja'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-2 py-4">
                                                    <span
                                                        className={`inline-flex rounded-full px-3 py-1.5 text-[11px] font-bold ${badgeClass}`}
                                                    >
                                                        {statusLabel}
                                                    </span>
                                                </td>
                                                <td className="px-2 py-4 text-xs text-slate-600">
                                                    <p className="font-semibold text-slate-800">
                                                        {user.documentType}
                                                    </p>
                                                    <p className="mt-1 text-[11px] text-slate-500">
                                                        {user.documentStatus ===
                                                        'approved'
                                                            ? 'Dokumen disetujui'
                                                            : user.documentStatus ===
                                                                'rejected'
                                                              ? 'Dokumen ditolak'
                                                              : user.documentStatus ===
                                                                  'pending'
                                                                ? 'Menunggu pemeriksaan'
                                                                : 'Belum ada dokumen'}
                                                    </p>
                                                    {user.documentsRemaining >
                                                        1 && (
                                                        <p className="mt-1 text-[10px] text-slate-500">
                                                            +
                                                            {user.documentsRemaining -
                                                                1}{' '}
                                                            dokumen menunggu
                                                            lainnya
                                                        </p>
                                                    )}
                                                </td>
                                                <td className="px-2 py-4 text-xs text-slate-500">
                                                    {user.createdLabel}
                                                </td>
                                                <td className="px-2 py-4">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {user.downloadUrl && (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setPreviewUser(
                                                                        user,
                                                                    )
                                                                }
                                                                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-semibold text-slate-700 shadow-xs transition hover:bg-slate-100"
                                                            >
                                                                <FileText
                                                                    size={15}
                                                                />{' '}
                                                                Dokumen
                                                            </button>
                                                        )}
                                                        {user.documentId !==
                                                            null && (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    disabled={
                                                                        processingId !==
                                                                        null
                                                                    }
                                                                    onClick={() => {
                                                                        setRejecting(
                                                                            user,
                                                                        );
                                                                        setReviewNotes(
                                                                            '',
                                                                        );
                                                                        setError(
                                                                            null,
                                                                        );
                                                                    }}
                                                                    className="min-h-9 rounded-lg bg-red-100 px-3 text-[11px] font-bold text-red-700 hover:bg-red-200 disabled:opacity-50"
                                                                >
                                                                    Tolak
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    disabled={
                                                                        processingId !==
                                                                        null
                                                                    }
                                                                    onClick={() =>
                                                                        approveDocument(
                                                                            user,
                                                                        )
                                                                    }
                                                                    className="min-h-9 rounded-lg bg-[#39C900] px-3 text-[11px] font-bold text-white hover:bg-[#32B300] disabled:opacity-50"
                                                                >
                                                                    {isProcessing
                                                                        ? 'Memproses...'
                                                                        : 'Verifikasi'}
                                                                </button>
                                                            </>
                                                        )}
                                                        {user.documentId ===
                                                            null &&
                                                            !user.downloadUrl && (
                                                                <span className="text-[11px] text-slate-400">
                                                                    Tidak ada
                                                                    aksi
                                                                </span>
                                                            )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>

                            {queue.data.length === 0 && (
                                <div className="flex min-h-[190px] flex-col items-center justify-center text-center">
                                    <Search
                                        size={28}
                                        className="text-slate-400"
                                    />
                                    <p className="mt-3 text-sm font-medium text-slate-600">
                                        Tidak ada akun yang cocok dengan
                                        pencarian atau filter.
                                    </p>
                                </div>
                            )}
                        </div>

                        {queue.last_page > 1 && (
                            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
                                <p className="text-xs text-slate-500">
                                    Halaman {queue.current_page} dari{' '}
                                    {queue.last_page}
                                </p>
                                <div className="flex gap-2">
                                    {queue.prev_page_url ? (
                                        <Link
                                            href={queue.prev_page_url}
                                            preserveScroll
                                            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                        >
                                            Sebelumnya
                                        </Link>
                                    ) : (
                                        <span className="rounded-lg border border-slate-100 px-3 py-2 text-xs text-slate-300">
                                            Sebelumnya
                                        </span>
                                    )}
                                    {queue.next_page_url ? (
                                        <Link
                                            href={queue.next_page_url}
                                            preserveScroll
                                            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                        >
                                            Berikutnya
                                        </Link>
                                    ) : (
                                        <span className="rounded-lg border border-slate-100 px-3 py-2 text-xs text-slate-300">
                                            Berikutnya
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                    </section>
                </div>
            </main>

            {/* ====================================
                MODAL PENOLAKAN DOKUMEN
            ==================================== */}

            {rejecting && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="reject-dialog-title"
                        className="w-full max-w-md rounded-2xl bg-white p-6 text-slate-900 shadow-2xl"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h2
                                    id="reject-dialog-title"
                                    className="text-lg font-bold"
                                >
                                    Tolak Dokumen
                                </h2>

                                <p className="mt-2 text-sm text-slate-500">
                                    Berikan alasan penolakan untuk dokumen milik{' '}
                                    <strong>{rejecting.name}</strong>.
                                </p>
                            </div>

                            <button
                                type="button"
                                aria-label="Tutup"
                                disabled={processingId !== null}
                                onClick={() => {
                                    setRejecting(null);
                                    setError(null);
                                }}
                                className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <label
                            htmlFor="review-notes"
                            className="mt-5 block text-sm font-semibold"
                        >
                            Alasan penolakan
                        </label>

                        <textarea
                            id="review-notes"
                            rows={4}
                            maxLength={1000}
                            value={reviewNotes}
                            onChange={(event) =>
                                setReviewNotes(event.target.value)
                            }
                            placeholder="Contoh: Dokumen tidak terbaca atau identitas tidak sesuai."
                            className="mt-2 w-full rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-[#21477F]"
                        />

                        {error && (
                            <p
                                role="alert"
                                className="mt-3 text-sm text-red-600"
                            >
                                {error}
                            </p>
                        )}

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                disabled={processingId !== null}
                                onClick={() => {
                                    setRejecting(null);
                                    setError(null);
                                }}
                                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700"
                            >
                                Batal
                            </button>

                            <button
                                type="button"
                                disabled={
                                    processingId !== null ||
                                    reviewNotes.trim().length < 5
                                }
                                onClick={rejectDocument}
                                className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {processingId !== null
                                    ? 'Memproses...'
                                    : 'Tolak Dokumen'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================
                MODAL PRATINJAU DOKUMEN (POPUP)
            ======================================== */}
            {previewUser && previewUser.downloadUrl && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs"
                    onClick={() => setPreviewUser(null)}
                >
                    <div
                        className="flex max-h-[92vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl transition-all"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header Modal */}
                        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <h3 className="truncate text-base font-bold text-slate-900">
                                        Pratinjau Dokumen {previewUser.documentType}
                                    </h3>
                                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
                                        {previewUser.role === 'employer'
                                            ? 'UMKM'
                                            : 'Pencari Kerja'}
                                    </span>
                                </div>
                                <p className="mt-0.5 truncate text-xs text-slate-500">
                                    {previewUser.name}{' '}
                                    {previewUser.businessName
                                        ? `(${previewUser.businessName})`
                                        : ''}{' '}
                                    · ID #{previewUser.id} · {previewUser.email}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setPreviewUser(null)}
                                className="ml-3 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                                title="Tutup"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Konten Dokumen */}
                        <div className="flex-1 overflow-auto p-6">
                            {isImageFile(
                                previewUser.documentFileName,
                                previewUser.documentMimeType,
                            ) ? (
                                <div className="flex max-h-[62vh] min-h-[300px] items-center justify-center overflow-auto rounded-xl bg-slate-100/80 p-3">
                                    <img
                                        src={previewUser.downloadUrl}
                                        alt={`Dokumen ${previewUser.name}`}
                                        className="max-h-[58vh] w-auto max-w-full rounded-lg object-contain shadow-sm"
                                    />
                                </div>
                            ) : isPdfFile(
                                  previewUser.documentFileName,
                                  previewUser.documentMimeType,
                              ) ? (
                                <div className="h-[62vh] w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                                    <iframe
                                        src={previewUser.downloadUrl}
                                        title={`Dokumen ${previewUser.name}`}
                                        className="h-full w-full border-0"
                                    />
                                </div>
                            ) : (
                                <div className="flex max-h-[62vh] min-h-[300px] flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-8 text-center">
                                    <FileText
                                        size={48}
                                        className="text-slate-400"
                                    />
                                    <p className="mt-3 text-sm font-semibold text-slate-800">
                                        {previewUser.documentFileName ||
                                            `Dokumen_${previewUser.documentType}`}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500">
                                        Format file tidak mendukung pratinjau
                                        langsung di peramban. Silakan klik
                                        tombol unduh di bawah untuk melihat isi
                                        dokumen.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Footer Modal */}
                        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/50 px-6 py-4">
                            <a
                                href={`${previewUser.downloadUrl}?download=1`}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100"
                            >
                                <Download size={15} />
                                Unduh File
                            </a>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPreviewUser(null)}
                                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100"
                                >
                                    Tutup
                                </button>

                                {previewUser.documentId !== null && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const target = previewUser;
                                                setPreviewUser(null);
                                                setRejecting(target);
                                                setReviewNotes('');
                                                setError(null);
                                            }}
                                            className="rounded-lg bg-red-100 px-4 py-2 text-xs font-bold text-red-700 transition hover:bg-red-200"
                                        >
                                            Tolak
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const target = previewUser;
                                                setPreviewUser(null);
                                                approveDocument(target);
                                            }}
                                            className="rounded-lg bg-[#39C900] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#32B300]"
                                        >
                                            Verifikasi
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
