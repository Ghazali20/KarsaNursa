import { Head, Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    BriefcaseBusiness,
    CalendarDays,
    CheckCircle2,
    Clock3,
    MapPin,
    ShieldCheck,
    Users,
    WalletCards,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';

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
    status: string;
    acceptedCount: number;
    remainingQuota: number;
    isFull: boolean;
    canApply: boolean;
};

type ApplicationStatus = 'pending' | 'accepted' | 'rejected';

type Props = {
    task: Task;
    applicationStatus?: ApplicationStatus | null;
};

const rupiah = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
});

function statusLabel(status: ApplicationStatus): string {
    if (status === 'accepted') return 'Lamaran Diterima';
    if (status === 'rejected') return 'Lamaran Ditolak';
    return 'Menunggu Seleksi';
}

export default function WorkerTaskShow({
    task,
    applicationStatus = null,
}: Props) {
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const quota = Math.max(0, Number(task.workerQuota ?? 0));
    const accepted = Math.max(0, Number(task.acceptedCount ?? 0));
    const remaining = Math.max(
        0,
        Number(task.remainingQuota ?? quota - accepted),
    );
    const isFull =
        task.status === 'closed' || task.isFull || quota <= 0 || remaining <= 0;
    const canApply =
        task.canApply === true &&
        task.status === 'published' &&
        applicationStatus === null &&
        !isFull;

    function apply() {
        if (processing || !canApply) return;

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
                onFinish: () => setProcessing(false),
            },
        );
    }

    return (
        <>
            <Head title={`${task.title} - KarsaNursa`} />
            <main className="min-h-[calc(100svh-80px)] bg-[#f7f9fc] px-4 py-8 sm:px-6 xl:px-8">
                <div className="mx-auto max-w-[1150px] space-y-6">
                    <Link
                        href="/worker/tasks"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-[#21477f] hover:underline"
                    >
                        <ArrowLeft className="size-4" />
                        Kembali ke Cari Tugas & Lamar
                    </Link>

                    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
                        <div className="space-y-5">
                            <section className="rounded-2xl border border-[#dce5f1] bg-white p-6 shadow-sm sm:p-7">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <span className="rounded-lg bg-[#e9effb] px-3 py-1.5 text-xs font-semibold text-[#21477f]">
                                        {task.category || 'Lainnya'}
                                    </span>
                                    <span
                                        className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                                            isFull
                                                ? 'bg-rose-50 text-rose-700'
                                                : 'bg-emerald-50 text-emerald-700'
                                        }`}
                                    >
                                        {isFull
                                            ? 'Kuota Penuh'
                                            : 'Masih Tersedia'}
                                    </span>
                                </div>

                                <h1 className="mt-4 text-2xl font-semibold tracking-tight text-[#172c4b] sm:text-3xl">
                                    {task.title}
                                </h1>
                                <div className="mt-4 flex items-center gap-3">
                                    <div className="flex size-10 items-center justify-center rounded-xl bg-[#142d50] text-xs font-bold text-white">
                                        {task.businessName
                                            .split(/\s+/)
                                            .slice(0, 2)
                                            .map((word) => word.charAt(0))
                                            .join('')
                                            .toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-[#172c4b]">
                                            {task.businessName}
                                        </p>
                                        <p className="mt-0.5 flex items-center gap-1 text-xs text-[#21477f]">
                                            <ShieldCheck className="size-3.5" />
                                            UMKM Terverifikasi
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-6 grid gap-3 rounded-xl bg-[#f7f9fc] p-4 sm:grid-cols-2">
                                    <div className="flex gap-3">
                                        <MapPin className="mt-0.5 size-4 shrink-0 text-[#21477f]" />
                                        <div>
                                            <p className="text-xs text-[#8495ac]">
                                                Lokasi kerja
                                            </p>
                                            <p className="mt-1 text-sm font-medium text-[#243650]">
                                                {task.locationAddress ||
                                                    'Alamat belum tersedia'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <CalendarDays className="mt-0.5 size-4 shrink-0 text-[#21477f]" />
                                        <div>
                                            <p className="text-xs text-[#8495ac]">
                                                Jadwal pekerjaan
                                            </p>
                                            <p className="mt-1 text-sm font-medium text-[#243650]">
                                                {task.startsAt ||
                                                    'Belum tersedia'}
                                            </p>
                                            <p className="text-xs text-[#8393aa]">
                                                Selesai:{' '}
                                                {task.endsAt ||
                                                    'Belum tersedia'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <Users className="mt-0.5 size-4 shrink-0 text-[#21477f]" />
                                        <div>
                                            <p className="text-xs text-[#8495ac]">
                                                Kuota pekerja
                                            </p>
                                            <p className="mt-1 text-sm font-medium text-[#243650]">
                                                {accepted} dari {quota} pekerja
                                                diterima
                                            </p>
                                            <p className="text-xs text-[#8393aa]">
                                                Sisa {remaining} slot
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <WalletCards className="mt-0.5 size-4 shrink-0 text-[#21477f]" />
                                        <div>
                                            <p className="text-xs text-[#8495ac]">
                                                Upah bersih per pekerja
                                            </p>
                                            <p className="mt-1 text-lg font-bold text-[#21477f]">
                                                {rupiah.format(task.wageAmount)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section className="rounded-2xl border border-[#dce5f1] bg-white p-6 shadow-sm sm:p-7">
                                <h2 className="flex items-center gap-2 text-lg font-bold text-[#172c4b]">
                                    <BriefcaseBusiness className="size-5 text-[#21477f]" />
                                    Deskripsi Pekerjaan
                                </h2>
                                <p className="mt-4 text-sm leading-7 whitespace-pre-wrap text-[#586b85]">
                                    {task.description ||
                                        'Belum ada deskripsi pekerjaan.'}
                                </p>
                                <div className="mt-6 border-t border-[#e3eaf3] pt-5">
                                    <h3 className="font-semibold text-[#172c4b]">
                                        Persyaratan pekerja
                                    </h3>
                                    <p className="mt-3 text-sm leading-7 whitespace-pre-wrap text-[#586b85]">
                                        {task.requirements ||
                                            'Tidak ada persyaratan khusus.'}
                                    </p>
                                </div>
                            </section>
                        </div>

                        <aside className="self-start rounded-2xl border border-[#dce5f1] bg-white p-5 shadow-sm lg:sticky lg:top-6">
                            <h2 className="text-lg font-bold text-[#172c4b]">
                                Kirim Lamaran
                            </h2>
                            <p className="mt-2 text-xs leading-6 text-[#8798af]">
                                Pastikan jadwal dan persyaratan pekerjaan sesuai
                                sebelum melamar.
                            </p>
                            <div className="mt-4 rounded-xl bg-[#f4f7fb] px-3 py-3">
                                <div className="flex items-center gap-2 text-xs text-[#637894]">
                                    <Clock3 className="size-4" />
                                    Batas lamaran
                                </div>
                                <p className="mt-1 text-sm font-semibold text-[#172c4b]">
                                    {task.applicationDeadline ||
                                        'Belum tersedia'}
                                </p>
                            </div>
                            <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#e7edf5]">
                                <div
                                    className="h-full rounded-full bg-[#21477f]"
                                    style={{
                                        width: `${quota > 0 ? Math.min(100, (accepted / quota) * 100) : 0}%`,
                                    }}
                                />
                            </div>
                            <p className="mt-2 text-xs text-[#7e90aa]">
                                {remaining} dari {quota} slot masih tersedia
                            </p>

                            {applicationStatus !== null ? (
                                <div className="mt-5 space-y-3">
                                    <div
                                        className={`rounded-xl border p-3 ${
                                            applicationStatus === 'accepted'
                                                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                                : applicationStatus ===
                                                    'rejected'
                                                  ? 'border-red-200 bg-red-50 text-red-800'
                                                  : 'border-blue-200 bg-blue-50 text-blue-800'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 text-sm font-semibold">
                                            {applicationStatus ===
                                            'accepted' ? (
                                                <CheckCircle2 className="size-4" />
                                            ) : applicationStatus ===
                                              'rejected' ? (
                                                <XCircle className="size-4" />
                                            ) : (
                                                <Clock3 className="size-4" />
                                            )}
                                            {statusLabel(applicationStatus)}
                                        </div>
                                        <p className="mt-2 text-xs leading-5">
                                            {applicationStatus === 'pending'
                                                ? 'Lamaranmu sedang menunggu seleksi UMKM.'
                                                : applicationStatus ===
                                                    'accepted'
                                                  ? 'Lamaranmu telah diterima oleh UMKM.'
                                                  : 'Buka Lamaran Saya untuk melihat alasan penolakan.'}
                                        </p>
                                    </div>
                                    <Link
                                        href="/worker/applications"
                                        className="inline-flex w-full items-center justify-center rounded-xl border border-[#21477f] px-4 py-3 text-sm font-semibold text-[#21477f] hover:bg-[#f1f5fb]"
                                    >
                                        Lihat Lamaran Saya
                                    </Link>
                                </div>
                            ) : (
                                <div className="mt-5">
                                    {!canApply && (
                                        <p className="mb-3 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-700">
                                            <AlertCircle className="size-4 shrink-0" />
                                            {isFull
                                                ? 'Kuota sudah penuh. Pendaftaran ditutup.'
                                                : 'Tugas ini sedang tidak menerima lamaran.'}
                                        </p>
                                    )}
                                    <button
                                        type="button"
                                        onClick={apply}
                                        disabled={processing || !canApply}
                                        className="w-full rounded-xl bg-[#21477f] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#163762] disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {processing
                                            ? 'Mengirim Lamaran...'
                                            : canApply
                                              ? 'Lamar Tugas Sekarang'
                                              : 'Lamaran Tidak Tersedia'}
                                    </button>
                                    {error && (
                                        <p
                                            role="alert"
                                            className="mt-3 text-xs font-medium text-red-600"
                                        >
                                            {error}
                                        </p>
                                    )}
                                </div>
                            )}
                        </aside>
                    </div>
                </div>
            </main>
        </>
    );
}
