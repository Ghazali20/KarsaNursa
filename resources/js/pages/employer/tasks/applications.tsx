import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import {
    ArrowLeft,
    CheckCircle2,
    ClipboardList,
    Users,
    XCircle,
} from 'lucide-react';

type Application = {
    id: number;
    status: 'pending' | 'accepted' | 'rejected';
    workerName: string;
    workerEmail: string;
    appliedAt: string | null;
    reviewedAt: string | null;
    reviewNotes: string | null;
};

type TaskSummary = {
    id: number;
    title: string;
    status: string;
    workerQuota: number | null;
    acceptedCount: number;
    pendingCount: number;
};

type Props = {
    task: TaskSummary;
    applications: Application[];
};

export default function EmployerApplications({ task, applications }: Props) {
    const [processingId, setProcessingId] = useState<number | null>(null);

    const [notes, setNotes] = useState<Record<number, string>>({});
    const [errors, setErrors] = useState<Record<number, string>>({});

    const quota = task.workerQuota ?? 0;
    const quotaFull = task.acceptedCount >= quota;

    function decide(applicationId: number, decision: 'accepted' | 'rejected') {
        if (processingId !== null) return;

        const reason = notes[applicationId]?.trim() ?? '';

        if (decision === 'rejected' && reason.length < 5) {
            setErrors((current) => ({
                ...current,
                [applicationId]: 'Alasan penolakan minimal 5 karakter.',
            }));

            return;
        }

        setErrors((current) => ({
            ...current,
            [applicationId]: '',
        }));

        setProcessingId(applicationId);

        router.patch(
            `/employer/tasks/${task.id}/applications/${applicationId}/decision`,
            {
                decision,
                review_notes: decision === 'rejected' ? reason : null,
            },
            {
                preserveScroll: true,
                onError: (validationErrors) => {
                    setErrors((current) => ({
                        ...current,
                        [applicationId]:
                            validationErrors.application ??
                            validationErrors.review_notes ??
                            validationErrors.decision ??
                            'Keputusan gagal disimpan.',
                    }));
                },
                onFinish: () => {
                    setProcessingId(null);
                },
            },
        );
    }

    function statusLabel(status: Application['status']) {
        if (status === 'accepted') return 'Diterima';
        if (status === 'rejected') return 'Ditolak';

        return 'Menunggu Seleksi';
    }

    return (
        <>
            <Head title="Daftar Pelamar - KarsaNursa" />

            <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
                <div className="mx-auto max-w-6xl space-y-6">
                    <Link
                        href="/employer/tasks"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700"
                    >
                        <ArrowLeft className="size-4" />
                        Kembali ke Kelola Tugas
                    </Link>

                    <header className="rounded-3xl bg-[var(--karsa-deep-navy)] p-7 text-white">
                        <div className="flex items-center gap-3">
                            <ClipboardList className="size-7" />

                            <div>
                                <h1 className="text-2xl font-extrabold">
                                    Daftar Pelamar
                                </h1>

                                <p className="mt-2 text-sm text-white/70">
                                    {task.title}
                                </p>
                            </div>
                        </div>
                    </header>

                    <div className="grid gap-4 sm:grid-cols-3">
                        <div className="rounded-2xl border border-slate-200 bg-white p-5">
                            <p className="text-sm text-slate-500">
                                Total Pelamar
                            </p>
                            <p className="mt-2 text-3xl font-extrabold">
                                {applications.length}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-5">
                            <p className="text-sm text-slate-500">
                                Menunggu Seleksi
                            </p>
                            <p className="mt-2 text-3xl font-extrabold text-amber-600">
                                {task.pendingCount}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-5">
                            <p className="text-sm text-slate-500">
                                Pekerja Diterima
                            </p>
                            <p className="mt-2 text-3xl font-extrabold text-emerald-700">
                                {task.acceptedCount}
                                <span className="text-lg text-slate-400">
                                    /{quota}
                                </span>
                            </p>
                        </div>
                    </div>

                    {applications.length === 0 ? (
                        <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                            <Users className="mx-auto size-12 text-slate-400" />
                            <h2 className="mt-4 text-lg font-bold">
                                Belum ada pelamar
                            </h2>
                            <p className="mt-2 text-sm text-slate-500">
                                Lamaran Pencari Kerja akan muncul di halaman
                                ini.
                            </p>
                        </section>
                    ) : (
                        <div className="space-y-4">
                            {applications.map((application) => (
                                <article
                                    key={application.id}
                                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <h2 className="text-lg font-bold text-slate-950">
                                                {application.workerName}
                                            </h2>

                                            <p className="mt-1 text-sm text-slate-500">
                                                {application.workerEmail}
                                            </p>

                                            <p className="mt-2 text-xs text-slate-400">
                                                Melamar:{' '}
                                                {application.appliedAt ?? '-'}
                                            </p>
                                        </div>

                                        <span
                                            className={
                                                application.status ===
                                                'accepted'
                                                    ? 'rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700'
                                                    : application.status ===
                                                        'rejected'
                                                      ? 'rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700'
                                                      : 'rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700'
                                            }
                                        >
                                            {statusLabel(application.status)}
                                        </span>
                                    </div>

                                    {application.status === 'pending' ? (
                                        <div className="mt-5 border-t border-slate-100 pt-5">
                                            <label
                                                htmlFor={`reason-${application.id}`}
                                                className="text-sm font-semibold text-slate-700"
                                            >
                                                Alasan penolakan (wajib jika
                                                ditolak)
                                            </label>

                                            <textarea
                                                id={`reason-${application.id}`}
                                                rows={2}
                                                value={
                                                    notes[application.id] ?? ''
                                                }
                                                onChange={(event) =>
                                                    setNotes((current) => ({
                                                        ...current,
                                                        [application.id]:
                                                            event.target.value,
                                                    }))
                                                }
                                                className="mt-2 w-full rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-blue-600"
                                                placeholder="Contoh: Kualifikasi belum sesuai."
                                            />

                                            {errors[application.id] && (
                                                <p className="mt-2 text-sm text-red-600">
                                                    {errors[application.id]}
                                                </p>
                                            )}

                                            <div className="mt-4 flex flex-wrap gap-3">
                                                <button
                                                    type="button"
                                                    disabled={
                                                        processingId !== null ||
                                                        quotaFull ||
                                                        task.status !==
                                                            'published'
                                                    }
                                                    onClick={() =>
                                                        decide(
                                                            application.id,
                                                            'accepted',
                                                        )
                                                    }
                                                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    <CheckCircle2 className="size-4" />
                                                    Terima
                                                </button>

                                                <button
                                                    type="button"
                                                    disabled={
                                                        processingId !== null
                                                    }
                                                    onClick={() =>
                                                        decide(
                                                            application.id,
                                                            'rejected',
                                                        )
                                                    }
                                                    className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    <XCircle className="size-4" />
                                                    Tolak
                                                </button>
                                            </div>

                                            {quotaFull && (
                                                <p className="mt-3 text-xs text-amber-700">
                                                    Kuota pekerja sudah
                                                    terpenuhi. Pelamar lain
                                                    masih dapat ditolak.
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                                            <p>
                                                Status:{' '}
                                                <strong>
                                                    {statusLabel(
                                                        application.status,
                                                    )}
                                                </strong>
                                            </p>

                                            <p className="mt-1">
                                                Diperiksa:{' '}
                                                {application.reviewedAt ?? '-'}
                                            </p>

                                            {application.reviewNotes && (
                                                <p className="mt-2">
                                                    Catatan:{' '}
                                                    {application.reviewNotes}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </article>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </>
    );
}
