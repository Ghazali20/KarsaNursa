import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

// ========================================
// DEFINISI TIPE DATA
// ========================================

type VerificationStatus = 'pending' | 'approved' | 'rejected';

type Filter = VerificationStatus | 'all';

type VerificationDocument = {
    id: number;
    name: string;
    type: string;
    status: string;
    reviewNotes: string | null;
    url: string;
};

type VerificationUser = {
    id: number;
    name: string;
    email: string;
    role: 'worker' | 'employer';
    verificationStatus: VerificationStatus;
    profileLabel: string | null;
    documents: VerificationDocument[];
};

type Props = {
    stats: Record<VerificationStatus, number>;
    users: VerificationUser[];
};

const labels: Record<VerificationStatus, string> = {
    pending: 'Menunggu',
    approved: 'Disetujui',
    rejected: 'Ditolak',
};

// ========================================
// KOMPONEN DASHBOARD ADMIN
// ========================================

export default function AdminDashboard({ stats, users }: Props) {
    const [filter, setFilter] = useState<Filter>('pending');

    const [notes, setNotes] = useState<Record<number, string>>({});

    const [processingId, setProcessingId] = useState<number | null>(null);

    const [error, setError] = useState<string | null>(null);

    const [success, setSuccess] = useState<string | null>(null);

    // Filter daftar pengguna berdasarkan status.
    const filteredUsers = users.filter(
        (user) => filter === 'all' || user.verificationStatus === filter,
    );

    // ========================================
    // PROSES APPROVE DAN REJECT
    // ========================================

    function decide(user: VerificationUser, action: 'approve' | 'reject') {
        if (processingId !== null) {
            return;
        }

        if (action === 'reject' && (notes[user.id] ?? '').trim().length < 5) {
            setError('Alasan penolakan minimal 5 karakter.');
            return;
        }

        setError(null);
        setSuccess(null);
        setProcessingId(user.id);

        const data =
            action === 'reject' ? { review_notes: notes[user.id] ?? '' } : {};

        router.post(`/admin/verifications/${user.id}/${action}`, data, {
            preserveScroll: true,

            onSuccess: () => {
                setSuccess(
                    action === 'approve'
                        ? `Akun ${user.name} berhasil disetujui.`
                        : `Akun ${user.name} berhasil ditolak.`,
                );
            },

            onError: (errors) => {
                setError(
                    Object.values(errors)[0] ?? 'Gagal memproses verifikasi.',
                );
            },

            onFinish: () => {
                setProcessingId(null);
            },
        });
    }

    // ========================================
    // TAMPILAN HALAMAN
    // ========================================

    return (
        <>
            <Head title="Verifikasi Akun - Admin KarsaNursa" />

            <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-8">
                <div className="mx-auto max-w-6xl space-y-6">
                    {/* HEADER DASHBOARD */}
                    <div>
                        <p className="text-sm font-semibold text-blue-700">
                            KarsaNursa · Admin
                        </p>

                        <h1 className="mt-1 text-3xl font-bold">
                            Verifikasi Akun
                        </h1>

                        <p className="mt-2 text-sm text-slate-600">
                            Tinjau pendaftaran Pencari Kerja dan Pemilik UMKM
                            beserta dokumennya.
                        </p>
                    </div>

                    {/* KARTU STATISTIK */}
                    <div className="grid gap-4 sm:grid-cols-3">
                        {(['pending', 'approved', 'rejected'] as const).map(
                            (status) => (
                                <div
                                    key={status}
                                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                                >
                                    <p className="text-sm text-slate-500">
                                        {labels[status]}
                                    </p>

                                    <p className="mt-2 text-3xl font-bold">
                                        {stats[status]}
                                    </p>
                                </div>
                            ),
                        )}
                    </div>

                    {/* DAFTAR PENGGUNA */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        {/* HEADER DAFTAR */}
                        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                            <h2 className="text-xl font-bold">
                                Daftar Pendaftaran
                            </h2>

                            <label className="flex items-center gap-2 text-sm">
                                <span className="text-slate-600">Status</span>

                                <select
                                    value={filter}
                                    onChange={(event) =>
                                        setFilter(event.target.value as Filter)
                                    }
                                    className="rounded-lg border border-slate-300 bg-white px-3 py-2"
                                >
                                    <option value="pending">Menunggu</option>
                                    <option value="approved">Disetujui</option>
                                    <option value="rejected">Ditolak</option>
                                    <option value="all">Semua</option>
                                </select>
                            </label>
                        </div>

                        {/* PESAN ERROR */}
                        {error && (
                            <p
                                role="alert"
                                className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"
                            >
                                {error}
                            </p>
                        )}

                        {/* PESAN BERHASIL */}
                        {success && (
                            <p
                                role="status"
                                className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700"
                            >
                                {success}
                            </p>
                        )}

                        {/* KONDISI DATA KOSONG */}
                        {filteredUsers.length === 0 ? (
                            <p className="rounded-xl bg-slate-50 p-8 text-center text-sm text-slate-500">
                                Belum ada akun dengan status ini.
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {filteredUsers.map((user) => (
                                    <article
                                        key={user.id}
                                        className="rounded-xl border border-slate-200 p-5"
                                    >
                                        {/* INFORMASI PENGGUNA */}
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div>
                                                <h3 className="text-lg font-bold">
                                                    {user.name}
                                                </h3>

                                                <p className="text-sm text-slate-600">
                                                    {user.email}
                                                </p>

                                                <p className="mt-2 text-sm">
                                                    {user.role === 'employer'
                                                        ? 'Pemilik UMKM'
                                                        : 'Pencari Kerja'}

                                                    {user.profileLabel
                                                        ? ` · ${user.profileLabel}`
                                                        : ''}
                                                </p>
                                            </div>

                                            {/* STATUS AKUN */}
                                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">
                                                {
                                                    labels[
                                                        user.verificationStatus
                                                    ]
                                                }
                                            </span>
                                        </div>

                                        {/* DOKUMEN VERIFIKASI */}
                                        <div className="mt-4 border-t border-slate-100 pt-3">
                                            <p className="text-sm font-semibold">
                                                Dokumen verifikasi
                                            </p>

                                            {user.documents.length === 0 ? (
                                                <p className="mt-1 text-sm text-slate-500">
                                                    Dokumen belum tersedia.
                                                </p>
                                            ) : (
                                                <div className="mt-2 space-y-2">
                                                    {user.documents.map(
                                                        (document) => (
                                                            <div
                                                                key={
                                                                    document.id
                                                                }
                                                                className="flex flex-wrap items-center gap-3 text-sm"
                                                            >
                                                                <a
                                                                    href={
                                                                        document.url
                                                                    }
                                                                    className="font-medium text-blue-700 underline"
                                                                >
                                                                    Unduh:{' '}
                                                                    {
                                                                        document.name
                                                                    }
                                                                </a>

                                                                <span className="text-slate-500">
                                                                    (
                                                                    {
                                                                        document.type
                                                                    }
                                                                    {' · '}
                                                                    {
                                                                        document.status
                                                                    }
                                                                    )
                                                                </span>

                                                                {document.reviewNotes && (
                                                                    <span className="text-slate-600">
                                                                        Catatan:{' '}
                                                                        {
                                                                            document.reviewNotes
                                                                        }
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ),
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* AKSI VERIFIKASI */}
                                        {user.verificationStatus ===
                                            'pending' && (
                                            <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                                                {/* ALASAN PENOLAKAN */}
                                                <label
                                                    className="block text-sm font-semibold"
                                                    htmlFor={`notes-${user.id}`}
                                                >
                                                    Alasan penolakan (wajib jika
                                                    Reject)
                                                </label>

                                                <textarea
                                                    id={`notes-${user.id}`}
                                                    value={notes[user.id] ?? ''}
                                                    onChange={(event) =>
                                                        setNotes(
                                                            (previous) => ({
                                                                ...previous,
                                                                [user.id]:
                                                                    event.target
                                                                        .value,
                                                            }),
                                                        )
                                                    }
                                                    maxLength={1000}
                                                    rows={2}
                                                    className="w-full rounded-lg border border-slate-300 p-3 text-sm"
                                                    placeholder="Contoh: Dokumen identitas tidak terbaca."
                                                />

                                                {/* TOMBOL AKSI */}
                                                <div className="flex flex-wrap gap-3">
                                                    <button
                                                        type="button"
                                                        disabled={
                                                            processingId !==
                                                                null ||
                                                            user.documents
                                                                .length === 0
                                                        }
                                                        onClick={() =>
                                                            decide(
                                                                user,
                                                                'approve',
                                                            )
                                                        }
                                                        className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        {processingId ===
                                                        user.id
                                                            ? 'Memproses...'
                                                            : 'Approve Akun'}
                                                    </button>

                                                    <button
                                                        type="button"
                                                        disabled={
                                                            processingId !==
                                                                null ||
                                                            (
                                                                notes[
                                                                    user.id
                                                                ] ?? ''
                                                            ).trim().length <
                                                                5 ||
                                                            user.documents
                                                                .length === 0
                                                        }
                                                        onClick={() =>
                                                            decide(
                                                                user,
                                                                'reject',
                                                            )
                                                        }
                                                        className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        {processingId ===
                                                        user.id
                                                            ? 'Memproses...'
                                                            : 'Reject Akun'}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </article>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </>
    );
}
