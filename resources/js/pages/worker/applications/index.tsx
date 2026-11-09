import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, ClipboardList } from 'lucide-react';

type Application = {
    id: number;
    taskTitle: string;
    businessName: string;
    status: 'pending' | 'accepted' | 'rejected';
    appliedAt: string | null;
    reviewNotes: string | null;
    reviewedAt: string | null;
};

type Props = {
    applications: Application[];
};

function statusLabel(status: Application['status']): string {
    if (status === 'accepted') return 'Diterima';
    if (status === 'rejected') return 'Ditolak';

    return 'Menunggu Seleksi';
}

function statusStyle(status: Application['status']): string {
    if (status === 'accepted') {
        return 'bg-emerald-100 text-emerald-700';
    }

    if (status === 'rejected') {
        return 'bg-red-100 text-red-700';
    }

    return 'bg-amber-100 text-amber-700';
}

export default function WorkerApplicationsIndex({ applications }: Props) {
    return (
        <>
            <Head title="Riwayat Lamaran - KarsaNursa" />

            <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
                <div className="mx-auto max-w-5xl space-y-6">
                    <Link
                        href="/worker/dashboard"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700"
                    >
                        <ArrowLeft className="size-4" />
                        Kembali ke Dashboard
                    </Link>

                    <header className="rounded-3xl bg-[var(--karsa-deep-navy)] p-7 text-white">
                        <div className="flex items-center gap-3">
                            <ClipboardList className="size-7" />
                            <div>
                                <h1 className="text-2xl font-extrabold">
                                    Riwayat Lamaran
                                </h1>
                                <p className="mt-2 text-sm text-white/70">
                                    Pantau seluruh pengajuan lamaran dan
                                    keputusan dari Pemilik UMKM.
                                </p>
                            </div>
                        </div>
                    </header>

                    {applications.length === 0 ? (
                        <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                            <ClipboardList className="mx-auto size-12 text-slate-400" />

                            <h2 className="mt-4 text-lg font-bold">
                                Belum ada lamaran
                            </h2>

                            <p className="mt-2 text-sm text-slate-500">
                                Cari tugas yang tersedia dan ajukan lamaran
                                untuk memulai.
                            </p>

                            <Link
                                href="/worker/tasks"
                                className="mt-5 inline-flex rounded-xl bg-[var(--karsa-deep-navy)] px-5 py-3 text-sm font-bold text-white"
                            >
                                Cari Tugas
                            </Link>
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
                                                {application.taskTitle}
                                            </h2>

                                            <p className="mt-1 text-sm font-semibold text-blue-700">
                                                {application.businessName}
                                            </p>

                                            <p className="mt-2 text-xs text-slate-500">
                                                Diajukan:{' '}
                                                {application.appliedAt ?? '-'}
                                            </p>
                                        </div>

                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-bold ${statusStyle(
                                                application.status,
                                            )}`}
                                        >
                                            {statusLabel(application.status)}
                                        </span>
                                    </div>

                                    {application.status === 'pending' ? (
                                        <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
                                            Lamaran sedang menunggu keputusan
                                            Pemilik UMKM.
                                        </p>
                                    ) : (
                                        <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
                                            <p>
                                                Keputusan:{' '}
                                                <strong>
                                                    {statusLabel(
                                                        application.status,
                                                    )}
                                                </strong>
                                            </p>

                                            <p className="mt-2 text-xs text-slate-500">
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
