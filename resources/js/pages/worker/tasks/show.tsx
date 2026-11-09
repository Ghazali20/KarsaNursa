import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import {
    ArrowLeft,
    CalendarDays,
    MapPin,
    Users,
    WalletCards,
} from 'lucide-react';

type Task = {
    id: number;
    title: string;
    category: string | null;
    description: string | null;
    requirements: string | null;
    locationAddress: string | null;
    businessName: string;
    workerQuota: number | null;
    wageAmount: number;
    applicationDeadline: string | null;
    startsAt: string | null;
    endsAt: string | null;
};

type ApplicationStatus = 'pending' | 'accepted' | 'rejected';

type Props = {
    task: Task;
    applicationStatus?: ApplicationStatus | null;
};

export default function WorkerTaskShow({
    task,
    applicationStatus = null,
}: Props) {
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const rupiah = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(task.wageAmount);

    function submitApplication() {
        if (processing || applicationStatus !== null) {
            return;
        }

        setError(null);
        setProcessing(true);

        router.post(
            `/worker/tasks/${task.id}/applications`,
            {},
            {
                preserveScroll: true,
                onError: (errors) => {
                    setError(
                        errors.application ??
                            'Lamaran gagal dikirim. Silakan coba lagi.',
                    );
                },
                onFinish: () => {
                    setProcessing(false);
                },
            },
        );
    }

    function statusLabel(status: ApplicationStatus): string {
        if (status === 'accepted') {
            return 'Lamaran Diterima';
        }

        if (status === 'rejected') {
            return 'Lamaran Ditolak';
        }

        return 'Menunggu Seleksi';
    }

    return (
        <>
            <Head title={`${task.title} - KarsaNursa`} />

            <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
                <div className="mx-auto max-w-4xl space-y-6">
                    <Link
                        href="/worker/tasks"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700"
                    >
                        <ArrowLeft className="size-4" />
                        Kembali ke Cari Tugas
                    </Link>

                    <header className="rounded-3xl bg-[var(--karsa-deep-navy)] p-8 text-white">
                        <p className="text-sm text-white/70">
                            {task.category || 'Tugas Harian'}
                        </p>

                        <h1 className="mt-2 text-2xl font-extrabold">
                            {task.title}
                        </h1>

                        <p className="mt-3 text-sm text-white/80">
                            {task.businessName}
                        </p>
                    </header>

                    <section className="space-y-6 rounded-2xl border border-slate-200 bg-white p-7">
                        <div>
                            <h2 className="text-lg font-bold">
                                Deskripsi Pekerjaan
                            </h2>

                            <p className="mt-3 text-sm leading-7 whitespace-pre-wrap text-slate-600">
                                {task.description}
                            </p>
                        </div>

                        <div>
                            <h2 className="text-lg font-bold">Persyaratan</h2>

                            <p className="mt-3 text-sm leading-7 whitespace-pre-wrap text-slate-600">
                                {task.requirements ||
                                    'Tidak ada persyaratan khusus.'}
                            </p>
                        </div>

                        <div className="grid gap-5 border-t border-slate-100 pt-6 sm:grid-cols-2">
                            <div className="flex gap-3">
                                <MapPin className="size-5 text-blue-700" />
                                <div>
                                    <p className="font-semibold">Lokasi</p>
                                    <p className="text-sm text-slate-600">
                                        {task.locationAddress}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <WalletCards className="size-5 text-blue-700" />
                                <div>
                                    <p className="font-semibold">Upah</p>
                                    <p className="text-sm text-slate-600">
                                        {rupiah}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Users className="size-5 text-blue-700" />
                                <div>
                                    <p className="font-semibold">Kuota</p>
                                    <p className="text-sm text-slate-600">
                                        {task.workerQuota} pekerja
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <CalendarDays className="size-5 text-blue-700" />
                                <div>
                                    <p className="font-semibold">Jadwal</p>
                                    <p className="text-sm text-slate-600">
                                        {task.startsAt} - {task.endsAt}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500">
                                        Batas lamaran:{' '}
                                        {task.applicationDeadline}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* STATUS DAN TOMBOL LAMAR */}
                        <div className="border-t border-slate-100 pt-6">
                            {applicationStatus !== null ? (
                                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                                    <p className="text-sm font-bold text-blue-800">
                                        {statusLabel(applicationStatus)}
                                    </p>

                                    <p className="mt-1 text-sm text-blue-700">
                                        {applicationStatus === 'pending'
                                            ? 'Lamaranmu sudah dikirim dan sedang menunggu seleksi.'
                                            : 'Status lamaran telah diperbarui.'}
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <p className="mb-4 text-sm text-slate-500">
                                        Pastikan informasi pekerjaan sudah
                                        sesuai sebelum mengajukan lamaran.
                                    </p>

                                    <button
                                        type="button"
                                        disabled={processing}
                                        onClick={submitApplication}
                                        className="w-full rounded-xl bg-[var(--karsa-deep-navy)] px-6 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {processing
                                            ? 'Mengirim Lamaran...'
                                            : 'Lamar Tugas Sekarang'}
                                    </button>

                                    {error && (
                                        <p className="mt-3 text-sm font-medium text-red-600">
                                            {error}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </main>
        </>
    );
}
