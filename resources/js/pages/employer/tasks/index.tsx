import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    BriefcaseBusiness,
    ClipboardPlus,
    MapPin,
    Pencil,
    Send,
    Users,
    WalletCards,
} from 'lucide-react';

type TaskStatus =
    | 'draft'
    | 'pending_review'
    | 'published'
    | 'rejected'
    | 'closed'
    | 'in_progress'
    | 'completed'
    | 'cancelled';

type Task = {
    id: number;
    title: string;
    category: string | null;
    status: TaskStatus;
    statusLabel: string;
    locationAddress: string | null;
    workerQuota: number | null;
    wageAmount: number | null;
    createdAt: string | null;
    applicationDeadline: string | null;
    adminNote: string | null;
    canEdit: boolean;
    canSubmit: boolean;
};

type Props = {
    tasks: Task[];
};

function rupiah(value: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(value);
}

function statusClass(status: TaskStatus): string {
    switch (status) {
        case 'published':
            return 'bg-emerald-100 text-emerald-700';
        case 'pending_review':
            return 'bg-sky-100 text-sky-700';
        case 'rejected':
            return 'bg-red-100 text-red-700';
        case 'completed':
            return 'bg-violet-100 text-violet-700';
        case 'cancelled':
            return 'bg-slate-200 text-slate-700';
        default:
            return 'bg-amber-100 text-amber-700';
    }
}

export default function EmployerTasksIndex({ tasks }: Props) {
    function submitTask(task: Task): void {
        const confirmed = window.confirm(
            `Ajukan tugas "${task.title}" untuk ditinjau admin?`,
        );

        if (!confirmed) return;

        router.patch(
            `/employer/tasks/${task.id}/submit`,
            {},
            {
                preserveScroll: true,
                onError: (errors) => {
                    window.alert(
                        Object.values(errors).join('\n') ||
                            'Tugas belum siap diajukan. Periksa kembali data dan jadwal.',
                    );
                },
            },
        );
    }

    return (
        <>
            <Head title="Kelola Tugas UMKM" />

            <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
                <div className="mx-auto max-w-6xl space-y-6">
                    <Link
                        href="/employer/dashboard"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700"
                    >
                        <ArrowLeft className="size-4" />
                        Kembali ke Dashboard
                    </Link>

                    <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-[var(--karsa-deep-navy)] p-7 text-white">
                        <div>
                            <h1 className="text-2xl font-extrabold">
                                Kelola Tugas
                            </h1>
                            <p className="mt-2 text-sm text-white/70">
                                Buat tugas, ajukan kepada admin, dan pantau
                                status peninjauannya.
                            </p>
                        </div>

                        <Link
                            href="/employer/tasks/create"
                            className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-900"
                        >
                            <ClipboardPlus className="size-4" />
                            Buat Tugas Baru
                        </Link>
                    </header>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                        <p className="text-sm text-slate-500">
                            Total tugas yang dibuat
                        </p>
                        <p className="mt-1 text-3xl font-extrabold">
                            {tasks.length}
                        </p>
                    </div>

                    {tasks.length === 0 ? (
                        <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                            <BriefcaseBusiness className="mx-auto size-12 text-slate-400" />
                            <h2 className="mt-4 text-lg font-bold">
                                Belum ada tugas
                            </h2>
                            <p className="mt-2 text-sm text-slate-500">
                                Mulai dengan membuat tugas harian pertama.
                            </p>
                        </section>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            {tasks.map((task) => (
                                <article
                                    key={task.id}
                                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-xs font-semibold text-blue-700">
                                            {task.category ||
                                                'Belum ada kategori'}
                                        </span>

                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass(task.status)}`}
                                        >
                                            {task.statusLabel}
                                        </span>
                                    </div>

                                    <h2 className="mt-4 text-lg font-bold text-slate-900">
                                        {task.title}
                                    </h2>

                                    <div className="mt-5 space-y-3 text-sm text-slate-600">
                                        <div className="flex items-start gap-2">
                                            <MapPin className="mt-0.5 size-4 shrink-0" />
                                            {task.locationAddress ||
                                                'Lokasi belum diisi'}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Users className="size-4" />
                                            {task.workerQuota ?? '-'} pekerja
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <WalletCards className="size-4" />
                                            {task.wageAmount === null
                                                ? 'Upah belum diisi'
                                                : rupiah(task.wageAmount)}
                                        </div>
                                    </div>

                                    {task.status === 'pending_review' && (
                                        <div className="mt-5 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-800">
                                            Tugas sedang ditinjau admin.
                                            Informasi tugas belum tampil kepada
                                            pencari kerja.
                                        </div>
                                    )}

                                    {task.status === 'rejected' && (
                                        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4">
                                            <p className="text-sm font-bold text-red-800">
                                                Tugas ditolak admin
                                            </p>
                                            <p className="mt-1 text-sm leading-6 text-red-700">
                                                {task.adminNote ||
                                                    'Admin tidak memberikan catatan tambahan.'}
                                            </p>
                                        </div>
                                    )}

                                    {task.canEdit && (
                                        <div className="mt-5 space-y-2">
                                            <div className="flex flex-wrap gap-2">
                                                <Link
                                                    href={`/employer/tasks/${task.id}/edit`}
                                                    className="inline-flex items-center gap-2 rounded-xl border border-blue-700 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
                                                >
                                                    <Pencil className="size-4" />
                                                    Edit Tugas
                                                </Link>

                                                <button
                                                    type="button"
                                                    disabled={!task.canSubmit}
                                                    onClick={() =>
                                                        submitTask(task)
                                                    }
                                                    className="inline-flex items-center gap-2 rounded-xl bg-[var(--karsa-deep-navy)] px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    <Send className="size-4" />
                                                    Ajukan ke Admin
                                                </button>
                                            </div>

                                            {!task.canSubmit && (
                                                <p className="text-xs text-amber-700">
                                                    Tugas belum dapat diajukan.
                                                    Edit dan periksa kembali
                                                    data serta jadwalnya.
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    <p className="mt-5 border-t border-slate-100 pt-4 text-xs text-slate-400">
                                        Dibuat: {task.createdAt || '-'}
                                    </p>
                                </article>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </>
    );
}
