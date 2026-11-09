import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { CheckCircle2, Users, WalletCards, XCircle } from 'lucide-react';

type Application = {
    id: number;
    taskId: number;
    taskTitle: string;
    taskStatus: string;
    taskQuota: number;
    taskAcceptedCount: number;
    workerName: string;
    workerEmail: string;
    status: 'pending' | 'accepted' | 'rejected';
    appliedAt: string | null;
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
    applications: Application[];
};

function formatRupiah(value: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(value);
}

export default function EmployerApplicationsIndex({
    stats,
    applications,
}: Props) {
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [notes, setNotes] = useState<Record<number, string>>({});
    const [errors, setErrors] = useState<Record<number, string>>({});

    function decide(
        application: Application,
        decision: 'accepted' | 'rejected',
    ) {
        if (processingId !== null) return;

        const reason = notes[application.id]?.trim() ?? '';

        if (decision === 'rejected' && reason.length < 5) {
            setErrors((current) => ({
                ...current,
                [application.id]: 'Alasan penolakan minimal 5 karakter.',
            }));
            return;
        }

        setProcessingId(application.id);

        router.patch(
            `/employer/tasks/${application.taskId}/applications/${application.id}/decision`,
            {
                decision,
                review_notes: decision === 'rejected' ? reason : null,
                return_to: 'inbox',
            },
            {
                preserveScroll: true,
                onError: (responseErrors) => {
                    setErrors((current) => ({
                        ...current,
                        [application.id]:
                            responseErrors.application ??
                            responseErrors.review_notes ??
                            'Gagal memproses lamaran.',
                    }));
                },
                onFinish: () => setProcessingId(null),
            },
        );
    }

    function markPaid(application: Application): void {
        if (processingId !== null) return;

        const confirmed = window.confirm(
            `Catat upah ${application.workerName} sebesar ${formatRupiah(
                application.wageAmount,
            )} sebagai sudah dibayar?`,
        );

        if (!confirmed) return;

        setProcessingId(application.id);

        router.patch(
            `/employer/applications/${application.id}/mark-paid`,
            {},
            {
                preserveScroll: true,
                onError: (responseErrors) => {
                    setErrors((current) => ({
                        ...current,
                        [application.id]:
                            responseErrors.payment ??
                            'Gagal mencatat pembayaran upah.',
                    }));
                },
                onFinish: () => setProcessingId(null),
            },
        );
    }

    return (
        <>
            <Head title="Menerima Pelamar - KarsaNursa" />

            <main className="min-h-screen bg-slate-50 px-4 py-8">
                <div className="mx-auto max-w-6xl space-y-6">
                    <header className="rounded-3xl bg-[var(--karsa-deep-navy)] p-7 text-white">
                        <h1 className="text-2xl font-bold">Menerima Pelamar</h1>
                        <p className="mt-2 text-sm text-white/70">
                            Daftar lamaran dari semua tugas UMKM Anda.
                        </p>
                    </header>

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                        {[
                            ['Total Pelamar', stats.total],
                            ['Menunggu Seleksi', stats.pending],
                            ['Diterima', stats.accepted],
                            ['Ditolak', stats.rejected],
                            ['Menunggu Pembayaran', stats.pendingPayments],
                        ].map(([label, value]) => (
                            <div
                                key={label}
                                className="rounded-xl border bg-white p-5"
                            >
                                <p className="text-sm text-slate-500">
                                    {label}
                                </p>
                                <p className="mt-2 text-2xl font-bold">
                                    {value}
                                </p>
                            </div>
                        ))}
                    </div>

                    {applications.length === 0 ? (
                        <div className="rounded-2xl border bg-white p-10 text-center">
                            <Users className="mx-auto size-10 text-slate-400" />
                            <h2 className="mt-3 font-bold">
                                Belum ada pelamar
                            </h2>
                            <p className="mt-2 text-sm text-slate-500">
                                Lamaran pekerja akan tampil di sini.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {applications.map((application) => {
                                const canAccept =
                                    application.status === 'pending' &&
                                    application.taskStatus === 'published' &&
                                    application.taskQuota > 0 &&
                                    application.taskAcceptedCount <
                                        application.taskQuota;

                                return (
                                    <article
                                        key={application.id}
                                        className="rounded-2xl border bg-white p-6 shadow-sm"
                                    >
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            <div>
                                                <h2 className="text-lg font-bold">
                                                    {application.workerName}
                                                </h2>
                                                <p className="text-sm text-slate-500">
                                                    {application.workerEmail}
                                                </p>
                                            </div>
                                            <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-slate-700">
                                                {application.status ===
                                                'pending'
                                                    ? 'Menunggu Seleksi'
                                                    : application.status ===
                                                        'accepted'
                                                      ? 'Diterima'
                                                      : 'Ditolak'}
                                            </span>
                                        </div>

                                        <p className="mt-4 text-sm font-semibold text-blue-700">
                                            Tugas: {application.taskTitle}
                                        </p>
                                        <p className="mt-1 text-sm text-slate-500">
                                            Melamar:{' '}
                                            {application.appliedAt ?? '-'}
                                        </p>
                                        <p className="mt-1 text-sm text-slate-500">
                                            Kuota diterima:{' '}
                                            {application.taskAcceptedCount}/
                                            {application.taskQuota}
                                        </p>

                                        <Link
                                            href={`/employer/tasks/${application.taskId}/applications`}
                                            className="mt-3 inline-flex text-sm font-semibold text-blue-700 hover:underline"
                                        >
                                            Lihat detail pelamar
                                        </Link>

                                        {application.status === 'pending' ? (
                                            <div className="mt-5 space-y-3 border-t pt-5">
                                                <label
                                                    htmlFor={`reason-${application.id}`}
                                                    className="text-sm font-semibold"
                                                >
                                                    Alasan penolakan
                                                </label>

                                                <textarea
                                                    id={`reason-${application.id}`}
                                                    value={
                                                        notes[application.id] ??
                                                        ''
                                                    }
                                                    onChange={(event) =>
                                                        setNotes((current) => ({
                                                            ...current,
                                                            [application.id]:
                                                                event.target
                                                                    .value,
                                                        }))
                                                    }
                                                    placeholder="Wajib diisi jika menolak."
                                                    className="w-full rounded-xl border border-slate-300 p-3 text-sm"
                                                    rows={2}
                                                />

                                                {errors[application.id] && (
                                                    <p className="text-sm text-red-600">
                                                        {errors[application.id]}
                                                    </p>
                                                )}

                                                <div className="flex flex-wrap gap-3">
                                                    <button
                                                        type="button"
                                                        disabled={
                                                            !canAccept ||
                                                            processingId !==
                                                                null
                                                        }
                                                        onClick={() =>
                                                            decide(
                                                                application,
                                                                'accepted',
                                                            )
                                                        }
                                                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
                                                    >
                                                        <CheckCircle2 className="size-4" />
                                                        Terima
                                                    </button>

                                                    <button
                                                        type="button"
                                                        disabled={
                                                            processingId !==
                                                            null
                                                        }
                                                        onClick={() =>
                                                            decide(
                                                                application,
                                                                'rejected',
                                                            )
                                                        }
                                                        className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
                                                    >
                                                        <XCircle className="size-4" />
                                                        Tolak
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm">
                                                <p>
                                                    Diperiksa:{' '}
                                                    {application.reviewedAt ??
                                                        '-'}
                                                </p>
                                                {application.reviewNotes && (
                                                    <p className="mt-2">
                                                        Catatan:{' '}
                                                        {
                                                            application.reviewNotes
                                                        }
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                        {application.status === 'accepted' && (
                                            <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50 p-4">
                                                <div className="flex flex-wrap items-center justify-between gap-3">
                                                    <div>
                                                        <p className="flex items-center gap-2 text-sm font-bold text-violet-900">
                                                            <WalletCards className="size-4" />
                                                            Upah{' '}
                                                            {formatRupiah(
                                                                application.wageAmount,
                                                            )}
                                                        </p>
                                                        <p className="mt-1 text-xs text-violet-700">
                                                            {application.paymentStatusLabel ??
                                                                'Catatan pembayaran belum tersedia'}
                                                            {application.paidAt
                                                                ? ` · ${application.paidAt}`
                                                                : ''}
                                                        </p>
                                                    </div>

                                                    {application.paymentStatus ===
                                                        'pending' && (
                                                        <button
                                                            type="button"
                                                            disabled={
                                                                processingId !==
                                                                null
                                                            }
                                                            onClick={() =>
                                                                markPaid(
                                                                    application,
                                                                )
                                                            }
                                                            className="rounded-xl bg-violet-700 px-4 py-2 text-sm font-bold text-white hover:bg-violet-800 disabled:opacity-50"
                                                        >
                                                            {processingId ===
                                                            application.id
                                                                ? 'Memproses...'
                                                                : 'Tandai Sudah Dibayar'}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>
        </>
    );
}
