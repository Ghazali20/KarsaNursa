import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    Building2,
    CalendarClock,
    ChevronRight,
    ClipboardCheck,
    Users,
    WalletCards,
} from 'lucide-react';
import { useState } from 'react';

type ReviewStatus = 'pending_review' | 'published' | 'rejected';
type Filter = ReviewStatus | 'all';

type ReviewTask = {
    id: number;
    title: string;
    category: string;
    status: ReviewStatus;
    statusLabel: string;
    businessName: string;
    employerName: string;
    wageAmount: number;
    workerQuota: number;
    submittedAt: string | null;
    reviewedAt: string | null;
    reviewerName: string | null;
    adminNote: string | null;
};

type Props = {
    stats: {
        pendingReview: number;
        published: number;
        rejected: number;
    };
    tasks: ReviewTask[];
};

const statusLabels: Record<ReviewStatus, string> = {
    pending_review: 'Menunggu Peninjauan',
    published: 'Dipublikasikan',
    rejected: 'Ditolak',
};

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

function rupiah(value: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(value);
}

export default function AdminTaskIndex({ stats, tasks }: Props) {
    const [filter, setFilter] = useState<Filter>('pending_review');

    const filteredTasks = tasks.filter(
        (task) => filter === 'all' || task.status === filter,
    );

    return (
        <>
            <Head title="Persetujuan Tugas - Admin KarsaNursa" />

            <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-8">
                <div className="mx-auto max-w-6xl space-y-6">
                    <Link
                        href="/admin"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-900"
                    >
                        <ArrowLeft className="size-4" />
                        Kembali ke Verifikasi Akun
                    </Link>

                    <header className="rounded-3xl bg-[var(--karsa-deep-navy)] p-7 text-white shadow-sm">
                        <div className="flex items-start gap-4">
                            <div className="rounded-2xl bg-white/10 p-3">
                                <ClipboardCheck className="size-7" />
                            </div>

                            <div>
                                <p className="text-sm font-semibold text-sky-200">
                                    KarsaNursa · Admin
                                </p>
                                <h1 className="mt-1 text-3xl font-extrabold">
                                    Persetujuan Tugas
                                </h1>
                                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/70">
                                    Periksa tugas yang diajukan UMKM sebelum
                                    ditampilkan kepada Pencari Kerja.
                                </p>
                            </div>
                        </div>
                    </header>

                    <section className="grid gap-4 sm:grid-cols-3">
                        <button
                            type="button"
                            onClick={() => setFilter('pending_review')}
                            className={`rounded-2xl border bg-white p-5 text-left shadow-sm transition ${
                                filter === 'pending_review'
                                    ? 'border-sky-500 ring-2 ring-sky-100'
                                    : 'border-slate-200'
                            }`}
                        >
                            <p className="text-sm text-slate-500">
                                Menunggu Peninjauan
                            </p>
                            <p className="mt-2 text-3xl font-extrabold text-sky-700">
                                {stats.pendingReview}
                            </p>
                        </button>

                        <button
                            type="button"
                            onClick={() => setFilter('published')}
                            className={`rounded-2xl border bg-white p-5 text-left shadow-sm transition ${
                                filter === 'published'
                                    ? 'border-emerald-500 ring-2 ring-emerald-100'
                                    : 'border-slate-200'
                            }`}
                        >
                            <p className="text-sm text-slate-500">
                                Disetujui dan Terbit
                            </p>
                            <p className="mt-2 text-3xl font-extrabold text-emerald-700">
                                {stats.published}
                            </p>
                        </button>

                        <button
                            type="button"
                            onClick={() => setFilter('rejected')}
                            className={`rounded-2xl border bg-white p-5 text-left shadow-sm transition ${
                                filter === 'rejected'
                                    ? 'border-red-500 ring-2 ring-red-100'
                                    : 'border-slate-200'
                            }`}
                        >
                            <p className="text-sm text-slate-500">Ditolak</p>
                            <p className="mt-2 text-3xl font-extrabold text-red-700">
                                {stats.rejected}
                            </p>
                        </button>
                    </section>

                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h2 className="text-xl font-bold">
                                    Daftar Pengajuan Tugas
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    {filteredTasks.length} tugas ditemukan.
                                </p>
                            </div>

                            <label className="flex items-center gap-2 text-sm">
                                <span className="text-slate-600">Status</span>
                                <select
                                    value={filter}
                                    onChange={(event) =>
                                        setFilter(event.target.value as Filter)
                                    }
                                    className="rounded-lg border border-slate-300 bg-white px-3 py-2"
                                >
                                    <option value="pending_review">
                                        Menunggu Peninjauan
                                    </option>
                                    <option value="published">
                                        Dipublikasikan
                                    </option>
                                    <option value="rejected">Ditolak</option>
                                    <option value="all">Semua</option>
                                </select>
                            </label>
                        </div>

                        {filteredTasks.length === 0 ? (
                            <div className="rounded-xl bg-slate-50 px-6 py-14 text-center">
                                <ClipboardCheck className="mx-auto size-11 text-slate-300" />
                                <p className="mt-3 font-semibold text-slate-700">
                                    Tidak ada tugas dengan status ini
                                </p>
                                <p className="mt-1 text-sm text-slate-500">
                                    Pengajuan tugas baru akan muncul di halaman
                                    ini.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredTasks.map((task) => (
                                    <article
                                        key={task.id}
                                        className="rounded-2xl border border-slate-200 p-5 transition hover:border-slate-300 hover:shadow-sm"
                                    >
                                        <div className="flex flex-wrap items-start justify-between gap-4">
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span
                                                        className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass(task.status)}`}
                                                    >
                                                        {
                                                            statusLabels[
                                                                task.status
                                                            ]
                                                        }
                                                    </span>
                                                    <span className="text-xs font-semibold text-blue-700">
                                                        {task.category}
                                                    </span>
                                                </div>

                                                <h3 className="mt-3 text-lg font-bold">
                                                    {task.title}
                                                </h3>

                                                <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                                                    <Building2 className="size-4" />
                                                    {task.businessName} ·{' '}
                                                    {task.employerName}
                                                </div>
                                            </div>

                                            <Link
                                                href={`/admin/tasks/${task.id}`}
                                                className="inline-flex items-center gap-2 rounded-xl bg-[var(--karsa-deep-navy)] px-4 py-2 text-sm font-bold text-white"
                                            >
                                                Tinjau Detail
                                                <ChevronRight className="size-4" />
                                            </Link>
                                        </div>

                                        <div className="mt-5 grid gap-3 border-t border-slate-100 pt-4 text-sm text-slate-600 sm:grid-cols-3">
                                            <div className="flex items-center gap-2">
                                                <WalletCards className="size-4 text-blue-700" />
                                                {rupiah(task.wageAmount)}
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Users className="size-4 text-blue-700" />
                                                {task.workerQuota} pekerja
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <CalendarClock className="size-4 text-blue-700" />
                                                Diajukan:{' '}
                                                {task.submittedAt ?? '-'}
                                            </div>
                                        </div>

                                        {task.status === 'rejected' &&
                                            task.adminNote && (
                                                <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                                                    Alasan: {task.adminNote}
                                                </p>
                                            )}
                                    </article>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </>
    );
}
