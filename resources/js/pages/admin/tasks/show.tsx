import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    Building2,
    CalendarDays,
    CheckCircle2,
    MapPin,
    Users,
    WalletCards,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';

type ReviewStatus = 'pending_review' | 'published' | 'rejected';

type TaskDetail = {
    id: number;
    title: string;
    category: string;
    description: string;
    requirements: string | null;
    instructions: string | null;
    locationAddress: string;
    latitude: string;
    longitude: string;
    attendanceRadiusMeters: number;
    applicationDeadline: string | null;
    startsAt: string | null;
    endsAt: string | null;
    workerQuota: number;
    wageAmount: number;
    status: ReviewStatus;
    statusLabel: string;
    businessName: string;
    employerName: string;
    employerEmail: string;
    submittedAt: string | null;
    reviewedAt: string | null;
    reviewerName: string | null;
    adminNote: string | null;
};

type Props = {
    task: TaskDetail;
};

function rupiah(value: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(value);
}

function formatDate(value: string | null): string {
    if (!value) return '-';

    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'full',
        timeStyle: 'short',
    }).format(new Date(value));
}

function statusClass(status: ReviewStatus): string {
    switch (status) {
        case 'published':
            return 'bg-emerald-100 text-emerald-700';
        case 'rejected':
            return 'bg-red-100 text-red-700';
        default:
            return 'bg-sky-100 text-sky-700';
    }
}

export default function AdminTaskShow({ task }: Props) {
    const [adminNote, setAdminNote] = useState('');
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function approveTask(): void {
        if (processing) return;

        const confirmed = window.confirm(
            `Setujui dan publikasikan tugas "${task.title}"?`,
        );

        if (!confirmed) return;

        setProcessing(true);
        setError(null);

        router.patch(
            `/admin/tasks/${task.id}/approve`,
            {},
            {
                onError: (errors) => {
                    setError(
                        Object.values(errors)[0] ?? 'Tugas gagal disetujui.',
                    );
                },
                onFinish: () => {
                    setProcessing(false);
                },
            },
        );
    }

    function rejectTask(): void {
        if (processing) return;

        if (adminNote.trim().length < 5) {
            setError('Alasan penolakan minimal 5 karakter.');
            return;
        }

        const confirmed = window.confirm(`Tolak tugas "${task.title}"?`);

        if (!confirmed) return;

        setProcessing(true);
        setError(null);

        router.patch(
            `/admin/tasks/${task.id}/reject`,
            {
                admin_note: adminNote,
            },
            {
                onError: (errors) => {
                    setError(
                        Object.values(errors)[0] ?? 'Tugas gagal ditolak.',
                    );
                },
                onFinish: () => {
                    setProcessing(false);
                },
            },
        );
    }

    return (
        <>
            <Head title={`Tinjau ${task.title} - Admin KarsaNursa`} />

            <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-8">
                <div className="mx-auto max-w-5xl space-y-6">
                    <Link
                        href="/admin/tasks"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-900"
                    >
                        <ArrowLeft className="size-4" />
                        Kembali ke Persetujuan Tugas
                    </Link>

                    <header className="rounded-3xl bg-[var(--karsa-deep-navy)] p-7 text-white shadow-sm">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold">
                                        {task.category}
                                    </span>
                                    <span
                                        className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass(task.status)}`}
                                    >
                                        {task.statusLabel}
                                    </span>
                                </div>

                                <h1 className="mt-4 text-3xl font-extrabold">
                                    {task.title}
                                </h1>

                                <div className="mt-3 flex items-center gap-2 text-sm text-white/70">
                                    <Building2 className="size-4" />
                                    {task.businessName} · {task.employerName}
                                </div>
                            </div>

                            <div className="rounded-2xl bg-white/10 px-5 py-4 text-right">
                                <p className="text-xs text-white/60">
                                    Diajukan
                                </p>
                                <p className="mt-1 text-sm font-bold">
                                    {formatDate(task.submittedAt)}
                                </p>
                            </div>
                        </div>
                    </header>

                    <section className="grid gap-4 sm:grid-cols-3">
                        <div className="rounded-2xl border border-slate-200 bg-white p-5">
                            <WalletCards className="size-5 text-blue-700" />
                            <p className="mt-3 text-sm text-slate-500">
                                Upah per pekerja
                            </p>
                            <p className="mt-1 text-lg font-extrabold">
                                {rupiah(task.wageAmount)}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-5">
                            <Users className="size-5 text-blue-700" />
                            <p className="mt-3 text-sm text-slate-500">
                                Jumlah pekerja
                            </p>
                            <p className="mt-1 text-lg font-extrabold">
                                {task.workerQuota} orang
                            </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-5">
                            <CalendarDays className="size-5 text-blue-700" />
                            <p className="mt-3 text-sm text-slate-500">
                                Batas lamaran
                            </p>
                            <p className="mt-1 text-sm font-bold">
                                {formatDate(task.applicationDeadline)}
                            </p>
                        </div>
                    </section>

                    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="text-xl font-bold">Informasi Tugas</h2>

                        <div className="mt-6 space-y-6">
                            <div>
                                <h3 className="text-sm font-bold text-slate-700">
                                    Deskripsi pekerjaan
                                </h3>
                                <p className="mt-2 text-sm leading-7 whitespace-pre-line text-slate-600">
                                    {task.description}
                                </p>
                            </div>

                            {task.requirements && (
                                <div>
                                    <h3 className="text-sm font-bold text-slate-700">
                                        Persyaratan pekerja
                                    </h3>
                                    <p className="mt-2 text-sm leading-7 whitespace-pre-line text-slate-600">
                                        {task.requirements}
                                    </p>
                                </div>
                            )}

                            {task.instructions && (
                                <div>
                                    <h3 className="text-sm font-bold text-slate-700">
                                        Instruksi tambahan
                                    </h3>
                                    <p className="mt-2 text-sm leading-7 whitespace-pre-line text-slate-600">
                                        {task.instructions}
                                    </p>
                                </div>
                            )}
                        </div>
                    </section>

                    <section className="grid gap-6 lg:grid-cols-2">
                        <div className="rounded-2xl border border-slate-200 bg-white p-6">
                            <h2 className="flex items-center gap-2 text-lg font-bold">
                                <MapPin className="size-5 text-blue-700" />
                                Lokasi Pekerjaan
                            </h2>

                            <p className="mt-4 text-sm leading-7 text-slate-600">
                                {task.locationAddress}
                            </p>

                            <dl className="mt-4 space-y-2 text-sm">
                                <div className="flex justify-between gap-3">
                                    <dt className="text-slate-500">
                                        Koordinat
                                    </dt>
                                    <dd className="font-semibold">
                                        {task.latitude}, {task.longitude}
                                    </dd>
                                </div>

                                <div className="flex justify-between gap-3">
                                    <dt className="text-slate-500">
                                        Radius presensi
                                    </dt>
                                    <dd className="font-semibold">
                                        {task.attendanceRadiusMeters} meter
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-6">
                            <h2 className="flex items-center gap-2 text-lg font-bold">
                                <CalendarDays className="size-5 text-blue-700" />
                                Jadwal Pekerjaan
                            </h2>

                            <dl className="mt-4 space-y-3 text-sm">
                                <div>
                                    <dt className="text-slate-500">
                                        Batas lamaran
                                    </dt>
                                    <dd className="mt-1 font-semibold">
                                        {formatDate(task.applicationDeadline)}
                                    </dd>
                                </div>

                                <div>
                                    <dt className="text-slate-500">
                                        Waktu mulai
                                    </dt>
                                    <dd className="mt-1 font-semibold">
                                        {formatDate(task.startsAt)}
                                    </dd>
                                </div>

                                <div>
                                    <dt className="text-slate-500">
                                        Waktu selesai
                                    </dt>
                                    <dd className="mt-1 font-semibold">
                                        {formatDate(task.endsAt)}
                                    </dd>
                                </div>
                            </dl>
                        </div>
                    </section>

                    <section className="rounded-2xl border border-slate-200 bg-white p-6">
                        <h2 className="text-lg font-bold">Informasi UMKM</h2>

                        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                            <div>
                                <dt className="text-slate-500">Nama usaha</dt>
                                <dd className="mt-1 font-semibold">
                                    {task.businessName}
                                </dd>
                            </div>

                            <div>
                                <dt className="text-slate-500">Pemilik</dt>
                                <dd className="mt-1 font-semibold">
                                    {task.employerName}
                                </dd>
                            </div>

                            <div>
                                <dt className="text-slate-500">Email</dt>
                                <dd className="mt-1 font-semibold">
                                    {task.employerEmail}
                                </dd>
                            </div>
                        </dl>
                    </section>

                    {task.status === 'pending_review' && (
                        <section className="rounded-2xl border border-sky-200 bg-white p-6 shadow-sm">
                            <h2 className="text-xl font-bold">
                                Keputusan Admin
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Setujui tugas untuk memublikasikannya, atau
                                berikan alasan jika tugas perlu ditolak.
                            </p>

                            {error && (
                                <p
                                    role="alert"
                                    className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700"
                                >
                                    {error}
                                </p>
                            )}

                            <label
                                htmlFor="admin-note"
                                className="mt-5 block text-sm font-bold"
                            >
                                Alasan penolakan
                            </label>
                            <textarea
                                id="admin-note"
                                rows={4}
                                maxLength={1000}
                                value={adminNote}
                                onChange={(event) =>
                                    setAdminNote(event.target.value)
                                }
                                placeholder="Wajib diisi jika tugas ditolak, minimal 5 karakter."
                                className="mt-2 w-full rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                            />

                            <div className="mt-5 flex flex-wrap gap-3">
                                <button
                                    type="button"
                                    disabled={processing}
                                    onClick={approveTask}
                                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-50"
                                >
                                    <CheckCircle2 className="size-4" />
                                    {processing
                                        ? 'Memproses...'
                                        : 'Setujui dan Publikasikan'}
                                </button>

                                <button
                                    type="button"
                                    disabled={
                                        processing ||
                                        adminNote.trim().length < 5
                                    }
                                    onClick={rejectTask}
                                    className="inline-flex items-center gap-2 rounded-xl bg-red-700 px-5 py-3 text-sm font-bold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <XCircle className="size-4" />
                                    {processing
                                        ? 'Memproses...'
                                        : 'Tolak Tugas'}
                                </button>
                            </div>
                        </section>
                    )}

                    {task.status !== 'pending_review' && (
                        <section className="rounded-2xl border border-slate-200 bg-white p-6">
                            <h2 className="text-lg font-bold">
                                Hasil Peninjauan
                            </h2>

                            <dl className="mt-4 space-y-3 text-sm">
                                <div>
                                    <dt className="text-slate-500">
                                        Ditinjau oleh
                                    </dt>
                                    <dd className="mt-1 font-semibold">
                                        {task.reviewerName ?? '-'}
                                    </dd>
                                </div>

                                <div>
                                    <dt className="text-slate-500">
                                        Waktu peninjauan
                                    </dt>
                                    <dd className="mt-1 font-semibold">
                                        {formatDate(task.reviewedAt)}
                                    </dd>
                                </div>

                                {task.adminNote && (
                                    <div>
                                        <dt className="text-slate-500">
                                            Catatan admin
                                        </dt>
                                        <dd className="mt-1 rounded-xl bg-red-50 p-3 text-red-700">
                                            {task.adminNote}
                                        </dd>
                                    </div>
                                )}
                            </dl>
                        </section>
                    )}
                </div>
            </main>
        </>
    );
}
