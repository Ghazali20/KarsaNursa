import { Head, Link, router } from '@inertiajs/react';
import {
    Check,
    Clock3,
    FileText,
    UsersRound,
    X,
} from 'lucide-react';
import { useState } from 'react';

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
    role: 'worker' | 'employer';
    documentId: number | null;
    documentType: string;
    documentsRemaining: number;
    createdLabel: string;
    downloadUrl: string | null;
};

type PaginatedQueue = {
    data: PendingUser[];
    current_page: number;
    last_page: number;
    total: number;
    prev_page_url: string | null;
    next_page_url: string | null;
};

type Props = {
    stats: Stats;
    queue: PaginatedQueue;
};

// ========================================
// KOMPONEN HALAMAN
// ========================================

export default function AdminUsers({ stats, queue }: Props) {
    const [rejecting, setRejecting] =
        useState<PendingUser | null>(null);

    const [reviewNotes, setReviewNotes] = useState('');

    const [processingId, setProcessingId] =
        useState<number | null>(null);

    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    // ========================================
    // VERIFIKASI DOKUMEN
    // ========================================

    function approveDocument(user: PendingUser) {
        if (
            processingId !== null ||
            user.documentId === null
        ) {
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
                    setNotice(
                        `Dokumen ${user.name} berhasil diverifikasi.`,
                    );
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
            setError(
                'Alasan penolakan minimal 5 karakter.',
            );
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
                    setNotice(
                        `Dokumen ${userName} berhasil ditolak.`,
                    );
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
            value:
                `${stats.verifiedDocuments.toLocaleString('id-ID')} Dokumen`,
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
                                Validasi dokumen identitas
                                pekerja dan legalitas usaha.
                            </p>
                        </div>

                        <span className="rounded-full bg-[#fff0c2] px-3 py-1.5 text-xs font-bold text-amber-700">
                            {stats.totalQueue.toLocaleString('id-ID')}{' '}
                            Menunggu
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
                        DAFTAR ANTREAN PENGGUNA
                    ==================================== */}

                    <section className="min-w-0 rounded-2xl border border-slate-200 bg-white px-4 py-7 shadow-sm sm:px-5 lg:px-6">

                        {/* KONDISI DATA KOSONG */}

                        {queue.data.length === 0 ? (
                            <div className="flex min-h-[230px] flex-col items-center justify-center text-center">
                                <Check
                                    size={32}
                                    className="text-emerald-500"
                                />

                                <h2 className="mt-3 text-base font-semibold text-slate-900">
                                    Tidak ada antrean pemeriksaan
                                </h2>

                                <p className="mt-2 text-sm text-slate-500">
                                    Belum ada dokumen pengguna
                                    yang menunggu verifikasi.
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-200">
                                {queue.data.map((user) => {
                                    const initials = user.name
                                        .trim()
                                        .split(/\s+/)
                                        .slice(0, 2)
                                        .map((word) => word.charAt(0))
                                        .join('')
                                        .toUpperCase();

                                    const isProcessing =
                                        processingId === user.documentId;

                                    return (
                                        <article
                                            key={user.id}
                                            className="flex flex-col gap-4 py-4 first:pt-2 last:pb-2 lg:flex-row lg:items-center lg:justify-between"
                                        >
                                            {/* INFORMASI PENGGUNA */}

                                            <div className="flex min-w-0 items-center gap-3">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#d4f1f7] text-xs font-bold text-slate-900">
                                                    {initials}
                                                </div>

                                                <div className="min-w-0">
                                                    <h3 className="truncate text-xs font-bold text-slate-950">
                                                        {user.name}
                                                    </h3>

                                                    <span
                                                        className={[
                                                            'mt-1 inline-flex',
                                                            'rounded-full px-2.5 py-1',
                                                            'text-[10px] font-semibold',
                                                            user.role ===
                                                            'worker'
                                                                ? 'bg-[#d4f1f7] text-slate-900'
                                                                : 'bg-[#dce9ff] text-slate-900',
                                                        ].join(' ')}
                                                    >
                                                        {user.role ===
                                                        'worker'
                                                            ? 'Pekerja'
                                                            : 'UMKM'}
                                                    </span>

                                                    <p className="mt-1 text-[11px] text-slate-600">
                                                        {user.documentType}
                                                    </p>

                                                    {user.documentsRemaining >
                                                        1 && (
                                                        <p className="mt-1 text-[10px] text-slate-500">
                                                            +
                                                            {user.documentsRemaining -
                                                                1}{' '}
                                                            dokumen lain
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* INFORMASI DAN TOMBOL */}

                                            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                                                <span className="mr-1 text-[10px] text-blue-500 sm:mr-3">
                                                    {user.createdLabel}
                                                </span>

                                                {/* LIHAT DOKUMEN */}

                                                {user.downloadUrl ? (
                                                    <a
                                                        href={
                                                            user.downloadUrl
                                                        }
                                                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-800 transition hover:bg-slate-50"
                                                    >
                                                        <FileText
                                                            size={16}
                                                        />
                                                        Lihat Dokumen
                                                    </a>
                                                ) : (
                                                    <span className="inline-flex min-h-10 items-center rounded-lg border border-slate-200 px-3 text-xs text-slate-400">
                                                        Dokumen tidak tersedia
                                                    </span>
                                                )}

                                                {/* TOLAK */}

                                                <button
                                                    type="button"
                                                    disabled={
                                                        processingId !==
                                                            null ||
                                                        user.documentId ===
                                                            null
                                                    }
                                                    onClick={() => {
                                                        setRejecting(user);
                                                        setReviewNotes('');
                                                        setError(null);
                                                    }}
                                                    className="min-h-10 rounded-xl bg-red-100 px-5 text-sm font-semibold text-red-700 transition hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    Tolak
                                                </button>

                                                {/* VERIFIKASI */}

                                                <button
                                                    type="button"
                                                    disabled={
                                                        processingId !==
                                                            null ||
                                                        user.documentId ===
                                                            null
                                                    }
                                                    onClick={() =>
                                                        approveDocument(
                                                            user,
                                                        )
                                                    }
                                                    className="min-h-10 rounded-xl bg-[#39C900] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#32B300] disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    {isProcessing
                                                        ? 'Memproses...'
                                                        : 'Verifikasi'}
                                                </button>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        )}

                        {/* ====================================
                            NAVIGASI HALAMAN
                        ==================================== */}

                        {queue.last_page > 1 && (
                            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5">
                                <p className="text-xs text-slate-500">
                                    Halaman {queue.current_page} dari{' '}
                                    {queue.last_page}
                                </p>

                                <div className="flex items-center gap-2">
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
                                    Berikan alasan penolakan
                                    untuk dokumen milik{' '}
                                    <strong>
                                        {rejecting.name}
                                    </strong>
                                    .
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
        </>
    );
}
