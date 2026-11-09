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

type Task = {
    id: number;
    title: string;
    category: string | null;
    status: 'draft' | 'published';
    locationAddress: string | null;
    workerQuota: number | null;
    wageAmount: number | null;
    createdAt: string | null;
    applicationDeadline: string | null;
    canPublish: boolean;
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

export default function EmployerTasksIndex({ tasks }: Props) {
    function publishTask(task: Task): void {
        if (!window.confirm(`Publikasikan tugas \"${task.title}\" sekarang?`)) return;

        router.patch(`/employer/tasks/${task.id}/publish`, {}, {
            preserveScroll: true,
            onError: (errors) => {
                window.alert(Object.values(errors).join('\n') || 'Draft belum siap dipublikasikan.');
            },
        });
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
                                Semua tugas yang dibuat oleh usaha Anda.
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
                                            className={
                                                task.status === 'published'
                                                    ? 'rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700'
                                                    : 'rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700'
                                            }
                                        >
                                            {task.status === 'published'
                                                ? 'Dipublikasikan'
                                                : 'Draft'}
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

                                    {task.status === 'draft' && (
                                        <div className="mt-4 space-y-2">
                                            <div className="flex flex-wrap gap-2">
                                                <Link
                                                    href={`/employer/tasks/${task.id}/edit`}
                                                    className="inline-flex items-center gap-2 rounded-xl border border-blue-700 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
                                                >
                                                    <Pencil className="size-4" />
                                                    Edit Draft
                                                </Link>

                                                <button
                                                    type="button"
                                                    disabled={!task.canPublish}
                                                    onClick={() => publishTask(task)}
                                                    className="inline-flex items-center gap-2 rounded-xl bg-[var(--karsa-deep-navy)] px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    <Send className="size-4" />
                                                    Publikasikan
                                                </button>
                                            </div>
                                            {!task.canPublish && (
                                                <p className="text-xs text-amber-700">
                                                    Draft belum dapat dipublikasikan. Edit dan periksa kembali data serta jadwal.
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
