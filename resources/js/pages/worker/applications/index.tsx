import { Head, router, useForm } from '@inertiajs/react';
import {
    BriefcaseBusiness,
    CalendarDays,
    CheckCircle2,
    Clock3,
    MapPin,
    ShieldCheck,
    Upload,
    WalletCards,
    ImagePlus,
    LoaderCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';

type Application = {
    id: number;
    taskId: number;
    taskTitle: string;
    businessName: string;
    locationAddress: string | null;
    startsAt: string | null;
    endsAt: string | null;
    wageAmount: number;
    paymentStatus: string | null;
    paidAt: string | null;
    status: string;
    checkedInAt: string | null;
    checkedInIso: string | null;
    checkedOutAt: string | null;
    checkedOutIso: string | null;
    proofPhotoUrl: string | null;
    activityNotes: string | null;
    proofSubmittedAt: string | null;
};

type Props = {
    applications: Application[];
};

const rupiah = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
});

function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    return [hours, minutes, remainingSeconds]
        .map((value) => String(value).padStart(2, '0'))
        .join(':');
}

function getElapsedSeconds(start: string | null): number {
    if (!start) return 0;

    return Math.max(
        0,
        Math.floor((Date.now() - new Date(start).getTime()) / 1000),
    );
}

function ApplicationCard({ application }: { application: Application }) {
    const [elapsed, setElapsed] = useState(() =>
        getElapsedSeconds(application.checkedInIso),
    );

    const { data, setData, post, processing, errors, reset } = useForm<{
        proof_photo: File | null;
        activity_notes: string;
    }>({
        proof_photo: null,
        activity_notes: application.activityNotes ?? '',
    });

    useEffect(() => {
        if (!application.checkedInIso || application.checkedOutAt) {
            return;
        }

        const updateTimer = () => {
            setElapsed(getElapsedSeconds(application.checkedInIso));
        };

        updateTimer();

        const interval = window.setInterval(updateTimer, 1000);

        return () => window.clearInterval(interval);
    }, [application.checkedInIso, application.checkedOutAt]);

    const checkedIn = Boolean(application.checkedInAt);
    const checkedOut = Boolean(application.checkedOutAt);
    const proofSubmitted = Boolean(application.proofSubmittedAt);

    function handleCheckIn() {
        router.post(
            `/worker/applications/${application.id}/check-in`,
            {},
            {
                preserveScroll: true,
            },
        );
    }

    function handleCheckOut() {
        router.post(
            `/worker/applications/${application.id}/check-out`,
            {},
            {
                preserveScroll: true,
            },
        );
    }

    function handleSubmitProof(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        if (!data.proof_photo) {
            return;
        }

        post(`/worker/applications/${application.id}/submit-proof`, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => reset(),
        });
    }

    return (
        <div className="grid items-start gap-6 xl:grid-cols-2">
            {/* INFORMASI TUGAS DAN ABSENSI */}
            <section className="rounded-2xl border border-[#dce5f1] bg-white p-5 shadow-sm sm:p-6">
                {/* Lokasi kerja */}
                <div className="flex min-h-[145px] flex-col items-center justify-center rounded-xl bg-gradient-to-br from-[#d9f2f6] to-[#eff8fb] p-5 text-center">
                    <MapPin className="size-8 text-[#21477f]" />

                    <p className="mt-2 text-sm font-semibold text-[#172c4b]">
                        Lokasi Kerja
                    </p>

                    <p className="mt-1 text-xs text-[#7188a5]">
                        {application.locationAddress || 'Alamat belum tersedia'}
                    </p>
                </div>

                {/* Informasi pekerjaan */}
                <div className="mt-6 flex items-center gap-4">
                    <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-[#d9f2f6]">
                        <BriefcaseBusiness className="size-7 text-[#21477f]" />
                    </div>

                    <div className="min-w-0">
                        <p className="text-[10px] font-medium tracking-wide text-[#8194ad] uppercase">
                            TUGAS #{application.taskId}
                        </p>

                        <h2 className="mt-1 text-lg font-medium text-[#172c4b]">
                            {application.taskTitle}
                        </h2>

                        <p className="mt-1 text-xs text-[#7188a5]">
                            {application.businessName}
                        </p>
                    </div>
                </div>

                {/* Jadwal */}
                <div className="mt-5 flex items-start gap-3 border-t border-[#e1e9f2] pt-4">
                    <CalendarDays className="mt-0.5 size-4 shrink-0 text-[#21477f]" />

                    <div>
                        <p className="text-xs font-semibold text-[#172c4b]">
                            Jadwal Pekerjaan
                        </p>

                        <p className="mt-1 text-xs text-[#7188a5]">
                            Mulai: {application.startsAt || 'Belum tersedia'}
                        </p>

                        <p className="mt-1 text-xs text-[#7188a5]">
                            Selesai: {application.endsAt || 'Belum tersedia'}
                        </p>
                    </div>
                </div>

                {/* Timeline check-in dan check-out */}
                <div className="mt-5 space-y-5 border-t border-[#e1e9f2] pt-5">
                    <div className="flex items-start gap-3">
                        <div
                            className={`flex size-6 shrink-0 items-center justify-center rounded-full ${
                                checkedIn
                                    ? 'bg-[#21477f] text-white'
                                    : 'border-2 border-[#dce5f1] bg-white'
                            }`}
                        >
                            {checkedIn && <CheckCircle2 className="size-4" />}
                        </div>

                        <div>
                            <p className="text-xs font-semibold text-[#172c4b]">
                                Check-in
                            </p>

                            <p className="mt-1 text-[10px] text-[#8194ad]">
                                {application.checkedInAt || 'Belum dilakukan'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div
                            className={`flex size-6 shrink-0 items-center justify-center rounded-full ${
                                checkedOut
                                    ? 'bg-[#21477f] text-white'
                                    : 'border-2 border-[#dce5f1] bg-white'
                            }`}
                        >
                            {checkedOut && <CheckCircle2 className="size-4" />}
                        </div>

                        <div>
                            <p className="text-xs font-semibold text-[#172c4b]">
                                Check-out
                            </p>

                            <p className="mt-1 text-[10px] text-[#8194ad]">
                                {application.checkedOutAt || 'Belum dilakukan'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Timer */}
                <div className="mt-5 rounded-xl bg-[#f5f8fb] px-4 py-5 text-center">
                    <p className="text-[10px] font-medium text-[#8194ad]">
                        DURASI TERCATAT
                    </p>

                    <p className="mt-2 font-mono text-3xl font-bold tracking-[0.12em] text-[#172c4b]">
                        {formatDuration(elapsed)}
                    </p>

                    <p className="mt-2 text-xs text-[#7188a5]">
                        Upah disepakati: {rupiah.format(application.wageAmount)}
                    </p>
                </div>

                {/* Tombol absensi */}
                {!checkedIn ? (
                    <button
                        type="button"
                        onClick={handleCheckIn}
                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#21477f] px-4 py-4 text-sm font-bold text-white shadow-lg shadow-blue-900/10 transition hover:bg-[#173762]"
                    >
                        <CheckCircle2 className="size-4" />
                        Check-in Sekarang
                    </button>
                ) : !checkedOut ? (
                    <button
                        type="button"
                        onClick={handleCheckOut}
                        className="mt-4 w-full rounded-xl bg-[#21477f] px-4 py-4 text-sm font-bold text-white shadow-lg shadow-blue-900/10 transition hover:bg-[#173762]"
                    >
                        Check-out Sekarang
                    </button>
                ) : (
                    <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-emerald-50 px-4 py-4 text-sm font-semibold text-emerald-700">
                        <CheckCircle2 className="size-4" />
                        Absensi Selesai
                    </div>
                )}
            </section>

            {/* FORM BUKTI PENYELESAIAN */}
            <section className="rounded-2xl border border-[#dce5f1] bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-medium text-[#172c4b]">
                            Bukti penyelesaian tugas
                        </h2>

                        <p className="mt-1 text-[10px] leading-5 text-[#8194ad]">
                            Lengkapi laporan sebelum meminta persetujuan UMKM.
                        </p>
                    </div>

                    <span
                        className={`shrink-0 rounded-full px-3 py-2 text-[10px] font-bold ${
                            proofSubmitted
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-amber-100 text-amber-700'
                        }`}
                    >
                        {proofSubmitted ? 'Sudah Dikirim' : 'Belum Dikirim'}
                    </span>
                </div>

                <form onSubmit={handleSubmitProof} className="mt-6 space-y-5">
                    {/* Upload foto */}
                    <div>
                        <label className="mb-2 block text-xs font-semibold text-[#172c4b]">
                            Foto hasil kerja
                        </label>

                        <label
                            htmlFor={`proof-${application.id}`}
                            className="flex min-h-[135px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#91d5e9] bg-[#f0f8fb] p-4 text-center transition hover:bg-[#e8f5fa]"
                        >
                            {data.proof_photo ? (
                                <>
                                    <ImagePlus className="size-7 text-[#21477f]" />

                                    <p className="mt-2 text-xs font-semibold text-[#21477f]">
                                        {data.proof_photo.name}
                                    </p>

                                    <p className="mt-1 text-[10px] text-[#8194ad]">
                                        Klik untuk mengganti foto
                                    </p>
                                </>
                            ) : (
                                <>
                                    <Upload className="size-7 text-[#21477f]" />

                                    <p className="mt-2 text-xs font-semibold text-[#172c4b]">
                                        Unggah foto bukti
                                    </p>

                                    <p className="mt-1 text-[10px] text-[#7188a5]">
                                        JPG atau PNG, maksimal 5 MB
                                    </p>
                                </>
                            )}

                            <input
                                id={`proof-${application.id}`}
                                type="file"
                                accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                                className="hidden"
                                onChange={(e) => {
                                    setData(
                                        'proof_photo',
                                        e.target.files?.[0] ?? null,
                                    );
                                }}
                            />
                        </label>

                        {errors.proof_photo && (
                            <p className="mt-2 text-xs text-red-600">
                                {errors.proof_photo}
                            </p>
                        )}
                    </div>

                    {/* Preview foto sebelumnya */}
                    {application.proofPhotoUrl && (
                        <div>
                            <p className="mb-2 text-xs font-semibold text-[#172c4b]">
                                Bukti yang sudah dikirim
                            </p>

                            <img
                                src={application.proofPhotoUrl}
                                alt="Bukti penyelesaian pekerjaan"
                                className="max-h-52 w-full rounded-xl border border-[#dce5f1] object-contain"
                            />
                        </div>
                    )}

                    {/* Catatan aktivitas */}
                    <div>
                        <label
                            htmlFor={`notes-${application.id}`}
                            className="mb-2 block text-xs font-semibold text-[#172c4b]"
                        >
                            Catatan aktivitas
                        </label>

                        <textarea
                            id={`notes-${application.id}`}
                            value={data.activity_notes}
                            onChange={(e) =>
                                setData('activity_notes', e.target.value)
                            }
                            maxLength={1000}
                            rows={4}
                            placeholder="Contoh: Menyelesaikan packing 100 kotak dan membantu pengecekan pesanan..."
                            className="w-full resize-y rounded-xl border border-[#dce5f1] bg-white p-4 text-xs leading-6 text-[#243650] transition outline-none placeholder:text-[#91a0b4] focus:border-[#75cce2] focus:ring-2 focus:ring-[#75cce2]/20"
                        />

                        <p className="mt-1 text-right text-[10px] text-[#91a0b4]">
                            {data.activity_notes.length}/1000 karakter
                        </p>

                        {errors.activity_notes && (
                            <p className="mt-1 text-xs text-red-600">
                                {errors.activity_notes}
                            </p>
                        )}
                    </div>

                    {/* Pernyataan */}
                    <div className="flex items-start gap-3 rounded-xl bg-[#f5f8fb] p-3">
                        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#21477f]" />

                        <p className="text-[10px] leading-5 text-[#7188a5]">
                            Saya memastikan informasi dan bukti yang dikirim
                            sesuai dengan pekerjaan yang dilakukan.
                        </p>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={
                            processing || !checkedOut || !data.proof_photo
                        }
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#21477f] px-4 py-4 text-sm font-bold text-white shadow-lg shadow-blue-900/10 transition hover:bg-[#173762] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {processing ? (
                            <>
                                <LoaderCircle className="size-4 animate-spin" />
                                Mengirim Bukti...
                            </>
                        ) : proofSubmitted ? (
                            'Kirim Ulang Bukti'
                        ) : (
                            'Kirim untuk Persetujuan'
                        )}
                    </button>

                    {!checkedOut && (
                        <p className="text-center text-[10px] text-amber-600">
                            Lakukan check-out terlebih dahulu sebelum
                            mengirimkan bukti pekerjaan.
                        </p>
                    )}

                    {proofSubmitted && (
                        <p className="text-center text-[10px] text-emerald-700">
                            Bukti terakhir dikirim:{' '}
                            {application.proofSubmittedAt}
                        </p>
                    )}
                </form>
            </section>
        </div>
    );
}

export default function WorkerApplicationsIndex({ applications }: Props) {
    const activeApplications = applications.filter(
        (application) => application.status === 'accepted',
    );

    return (
        <>
            <Head title="Tugas Aktif - KarsaNusa" />

            <main className="min-h-screen bg-[#f7f9fc] px-4 py-7 sm:px-6 xl:px-8">
                <div className="mx-auto max-w-[1400px]">
                    {/* Header */}
                    <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h1 className="text-2xl font-medium tracking-tight text-[#172c4b]">
                                Tugas aktif
                            </h1>

                            <p className="mt-2 text-xs text-[#7188a5]">
                                Pantau kehadiran, durasi, dan kirim bukti
                                penyelesaian kerja.
                            </p>
                        </div>

                        <span className="rounded-full bg-blue-100 px-4 py-2 text-xs font-semibold text-blue-700">
                            {activeApplications.length > 0
                                ? 'Sedang Berlangsung'
                                : 'Tidak Ada Tugas Aktif'}
                        </span>
                    </div>

                    {/* Daftar tugas aktif */}
                    {activeApplications.length > 0 ? (
                        <div className="space-y-7">
                            {activeApplications.map((application) => (
                                <ApplicationCard
                                    key={application.id}
                                    application={application}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-[#dce5f1] bg-white px-6 py-16 text-center shadow-sm">
                            <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-[#eaf3fa]">
                                <BriefcaseBusiness className="size-8 text-[#21477f]" />
                            </div>

                            <h2 className="mt-5 text-lg font-semibold text-[#172c4b]">
                                Belum ada tugas aktif
                            </h2>

                            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#8194ad]">
                                Tugas yang sudah diterima oleh UMKM akan muncul
                                di halaman ini.
                            </p>

                            <a
                                href="/worker/tasks"
                                className="mt-6 inline-flex items-center justify-center rounded-xl bg-[#21477f] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#173762]"
                            >
                                Cari Tugas
                            </a>
                        </div>
                    )}
                </div>
            </main>
        </>
    );
}
