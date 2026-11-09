import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    BriefcaseBusiness,
    MapPin,
    Users,
    WalletCards,
} from 'lucide-react';

type Task = {
    id: number;
    title: string;
    category: string | null;
    description: string | null;
    locationAddress: string | null;
    workerQuota: number | null;
    wageAmount: number | null;
    businessName: string;
    applicationDeadline: string | null;
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

export default function WorkerTasksIndex({ tasks }: Props) {
    return (
        <>
            <Head title="Cari Tugas - KarsaNursa" />

            <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
                <div className="mx-auto max-w-6xl space-y-6">
                    <Link
                        href="/worker/dashboard"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700"
                    >
                        <ArrowLeft className="size-4" />
                        Kembali ke Dashboard
                    </Link>

                    <header className="rounded-3xl bg-[var(--karsa-deep-navy)] p-8 text-white">
                        <h1 className="text-2xl font-extrabold">
                            Cari Tugas Harian
                        </h1>
                        <p className="mt-2 text-sm text-white/70">
                            Temukan pekerjaan yang dipublikasikan oleh Pemilik
                            UMKM.
                        </p>
                    </header>

                    <div>
                        <h2 className="text-lg font-bold text-slate-950">
                            Tugas Tersedia
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            {tasks.length} pekerjaan tersedia
                        </p>
                    </div>

                    {tasks.length === 0 ? (
                        <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                            <BriefcaseBusiness className="mx-auto size-12 text-slate-400" />
                            <h3 className="mt-4 font-bold">
                                Belum ada tugas tersedia
                            </h3>
                            <p className="mt-2 text-sm text-slate-500">
                                Tugas yang dipublikasikan UMKM akan muncul di
                                halaman ini.
                            </p>
                        </section>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            {tasks.map((task) => (
                                <article
                                    key={task.id}
                                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                                >
                                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                                        {task.category || 'Lainnya'}
                                    </span>

                                    <h3 className="mt-4 text-lg font-bold text-slate-950">
                                        {task.title}
                                    </h3>

                                    <p className="mt-1 text-sm font-semibold text-blue-700">
                                        {task.businessName}
                                    </p>

                                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
                                        {task.description}
                                    </p>

                                    <div className="mt-5 space-y-3 text-sm text-slate-600">
                                        <div className="flex items-start gap-2">
                                            <MapPin className="mt-0.5 size-4 shrink-0" />
                                            {task.locationAddress}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Users className="size-4" />
                                            Kuota {task.workerQuota} pekerja
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <WalletCards className="size-4" />
                                            {task.wageAmount === null
                                                ? 'Upah belum tersedia'
                                                : rupiah(task.wageAmount)}
                                        </div>
                                    </div>

                                    <Link
                                        href={`/worker/tasks/${task.id}`}
                                        className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-[var(--karsa-deep-navy)] px-5 py-3 text-sm font-bold text-white hover:opacity-90"
                                    >
                                        Lihat Detail Tugas
                                    </Link>
                                </article>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </>
    );
}
