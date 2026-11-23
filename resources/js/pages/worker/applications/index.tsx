import { Head, Link, router } from '@inertiajs/react';
import {
    Briefcase,
    Check,
    CheckCircle2,
    FileCheck2,
    ImagePlus,
    MapPin,
    Search,
    Trash2,
    WalletCards,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

type Application = {
    id: number;
    taskTitle: string;
    businessName: string;
    status: 'pending' | 'accepted' | 'rejected';
    appliedAt: string | null;
    reviewNotes: string | null;
    reviewedAt: string | null;
    wageAmount: number;
    paymentStatus: 'pending' | 'paid' | 'cancelled' | null;
    paidAt: string | null;
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

function formatRupiah(value: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(value);
}

function formatDuration(totalSeconds: number): string {
    const safeSeconds = Math.max(0, totalSeconds);
    const hrs = Math.floor(safeSeconds / 3600);
    const mins = Math.floor((safeSeconds % 3600) / 60);
    const secs = safeSeconds % 60;
    return [hrs, mins, secs].map((n) => String(n).padStart(2, '0')).join(':');
}

function statusLabel(status: Application['status']): string {
    if (status === 'accepted') return 'Diterima';
    if (status === 'rejected') return 'Ditolak';
    return 'Menunggu Seleksi';
}

function statusStyle(status: Application['status']): string {
    if (status === 'accepted') return 'bg-emerald-100 text-emerald-700';
    if (status === 'rejected') return 'bg-rose-100 text-rose-700';
    return 'bg-amber-100 text-amber-700';
}

export default function WorkerApplicationsIndex({ applications }: Props) {
    const activeApplication = useMemo(
        () =>
            applications.find(
                (app) =>
                    app.status === 'accepted' && app.paymentStatus !== 'paid',
            ) ?? null,
        [applications],
    );

    const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
    const [attendanceProcessing, setAttendanceProcessing] = useState(false);

    // State bukti penyelesaian tugas
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [proofPreview, setProofPreview] = useState<string | null>(
        activeApplication?.proofPhotoUrl ?? null,
    );
    const [activityNotes, setActivityNotes] = useState(
        activeApplication?.activityNotes ?? '',
    );
    const [isConfirmed, setIsConfirmed] = useState(
        Boolean(activeApplication?.proofSubmittedAt),
    );
    const [submittingProof, setSubmittingProof] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    // Sinkronkan data dari database saat halaman dimuat atau diperbarui
    useEffect(() => {
        if (activeApplication?.proofPhotoUrl && !proofFile) {
            setProofPreview(activeApplication.proofPhotoUrl);
        }
        if (activeApplication?.activityNotes) {
            setActivityNotes(activeApplication.activityNotes);
        }
        if (activeApplication?.proofSubmittedAt) {
            setIsConfirmed(true);
        }
    }, [
        activeApplication?.id,
        activeApplication?.proofPhotoUrl,
        activeApplication?.activityNotes,
        activeApplication?.proofSubmittedAt,
        proofFile,
    ]);

    // Hitung durasi kerja dari timestamp check-in & check-out di database
    useEffect(() => {
        if (!activeApplication?.checkedInIso) {
            setElapsedSeconds(0);
            return;
        }

        const startMs = new Date(activeApplication.checkedInIso).getTime();

        if (activeApplication.checkedOutIso) {
            const endMs = new Date(activeApplication.checkedOutIso).getTime();
            setElapsedSeconds(Math.floor((endMs - startMs) / 1000));
            return;
        }

        const updateTick = () => {
            setElapsedSeconds(Math.floor((Date.now() - startMs) / 1000));
        };
        updateTick();

        const timer = window.setInterval(updateTick, 1000);
        return () => window.clearInterval(timer);
    }, [activeApplication?.checkedInIso, activeApplication?.checkedOutIso]);

    const handleCheckInOut = () => {
        if (!activeApplication || attendanceProcessing) return;

        if (!activeApplication.checkedInAt) {
            setFormError(null);
            setAttendanceProcessing(true);
            router.post(
                `/worker/applications/${activeApplication.id}/check-in`,
                {},
                {
                    preserveScroll: true,
                    onError: (errors) => {
                        setFormError(
                            Object.values(errors)[0] ??
                                'Gagal melakukan Check-in.',
                        );
                    },
                    onFinish: () => setAttendanceProcessing(false),
                },
            );
            return;
        }

        if (!activeApplication.checkedOutAt) {
            if (!proofFile && !activeApplication.proofPhotoUrl) {
                setFormError(
                    'Unggah foto bukti hasil kerja terlebih dahulu sebelum Check-out.',
                );
                return;
            }

            setFormError(null);
            setAttendanceProcessing(true);
            router.post(
                `/worker/applications/${activeApplication.id}/check-out`,
                {},
                {
                    preserveScroll: true,
                    onError: (errors) => {
                        setFormError(
                            Object.values(errors)[0] ??
                                'Gagal melakukan Check-out.',
                        );
                    },
                    onFinish: () => setAttendanceProcessing(false),
                },
            );
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            setFormError('Ukuran foto maksimal 5 MB.');
            return;
        }

        setFormError(null);
        setProofFile(file);
        setProofPreview(URL.createObjectURL(file));
    };

    const handleRemoveFile = () => {
        setProofFile(null);
        setProofPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmitProof = (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeApplication || submittingProof) return;

        if (!proofFile && !activeApplication.proofPhotoUrl) {
            setFormError(
                'Silakan unggah foto bukti hasil kerja terlebih dahulu.',
            );
            return;
        }

        if (!isConfirmed) {
            setFormError('Centang pernyataan konfirmasi sebelum mengirim.');
            return;
        }

        setFormError(null);
        setSubmittingProof(true);

        const payload: Record<string, string | File> = {
            activity_notes: activityNotes,
        };
        if (proofFile) {
            payload.proof_photo = proofFile;
        }

        router.post(
            `/worker/applications/${activeApplication.id}/submit-proof`,
            payload,
            {
                forceFormData: true,
                preserveScroll: true,
                onError: (errors) => {
                    setFormError(
                        errors.proof_photo ??
                            Object.values(errors)[0] ??
                            'Gagal mengirim bukti penyelesaian tugas.',
                    );
                },
                onSuccess: () => {
                    setProofFile(null);
                },
                onFinish: () => setSubmittingProof(false),
            },
        );
    };

    const isSubmitted = Boolean(activeApplication?.proofSubmittedAt);

    return (
        <>
            <Head title="Tugas Aktif - KarsaNursa" />

            <main className="mx-auto w-full max-w-7xl space-y-8 px-4 py-6 sm:px-8 sm:py-8">
                {/* HEADER HALAMAN */}
                <section className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                            PELAKSANAAN TUGAS
                        </p>
                        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                            Tugas aktif
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Pantau kehadiran, durasi, dan kirim bukti
                            penyelesaian kerja.
                        </p>
                    </div>

                    {activeApplication && (
                        <span className="inline-flex items-center rounded-full bg-[#E3EEFD] px-4 py-1.5 text-xs font-bold text-[#1E4479]">
                            {isSubmitted
                                ? 'Menunggu Persetujuan UMKM'
                                : !activeApplication.checkedInAt
                                  ? 'Menunggu Check-in'
                                  : activeApplication.checkedOutAt
                                    ? 'Selesai Bekerja'
                                    : 'Sedang Berlangsung'}
                        </span>
                    )}
                </section>

                {/* KONTEN UTAMA */}
                {activeApplication ? (
                    <section className="grid gap-6 lg:grid-cols-2">
                        {/* KOLOM KIRI: LOKASI, CHECK-IN/OUT & DURASI */}
                        <div className="flex flex-col justify-between rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xs sm:p-7">
                            <div className="space-y-6">
                                {/* BANNER VALIDASI LOKASI */}
                                <div className="flex flex-col items-center justify-center rounded-2xl bg-[#EEF6F7] px-6 py-9 text-center">
                                    <div className="flex size-10 items-center justify-center rounded-full bg-white text-[#1E4479] shadow-2xs">
                                        <MapPin className="size-5" />
                                    </div>
                                    <p className="mt-3 text-sm font-bold text-slate-900">
                                        Lokasi Anda tervalidasi
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500">
                                        Berada di area lokasi{' '}
                                        {activeApplication.businessName}
                                    </p>
                                </div>

                                {/* DETAIL TUGAS */}
                                <div className="flex items-start gap-4 border-b border-slate-100 pb-6">
                                    <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#EAF1FA] text-[#1E4479]">
                                        <Briefcase className="size-6" />
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                                            TUGAS #KN-2409{activeApplication.id}
                                        </p>
                                        <h2 className="mt-0.5 text-lg font-extrabold text-slate-900">
                                            {activeApplication.taskTitle}
                                        </h2>
                                        <p className="mt-1 text-xs text-slate-500">
                                            {activeApplication.businessName}
                                        </p>
                                    </div>
                                </div>

                                {/* TIMELINE CHECK-IN & CHECK-OUT */}
                                <div className="space-y-4 border-b border-slate-100 pb-6">
                                    <div className="flex items-start gap-3.5">
                                        <div
                                            className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full ${
                                                activeApplication.checkedInAt
                                                    ? 'bg-[#0D254C] text-white'
                                                    : 'border-2 border-slate-300 bg-white'
                                            }`}
                                        >
                                            {activeApplication.checkedInAt && (
                                                <Check className="size-3.5 stroke-[3]" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">
                                                Check-in
                                            </p>
                                            <p className="mt-0.5 text-xs text-slate-400">
                                                {activeApplication.checkedInAt ??
                                                    'Belum dilakukan'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3.5">
                                        <div
                                            className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full ${
                                                activeApplication.checkedOutAt
                                                    ? 'bg-[#0D254C] text-white'
                                                    : 'border-2 border-slate-300 bg-white'
                                            }`}
                                        >
                                            {activeApplication.checkedOutAt && (
                                                <Check className="size-3.5 stroke-[3]" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">
                                                Check-out
                                            </p>
                                            <p className="mt-0.5 text-xs text-slate-400">
                                                {activeApplication.checkedOutAt ??
                                                    'Belum dilakukan'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* TIMER & TOMBOL CHECK-IN / CHECK-OUT */}
                            <div className="pt-6 text-center">
                                <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                                    DURASI TERCATAT
                                </p>
                                <p className="mt-1.5 font-mono text-3xl font-extrabold tracking-wider text-slate-900">
                                    {formatDuration(elapsedSeconds)}
                                </p>
                                <p className="mt-1.5 text-xs text-slate-500">
                                    Upah disepakati:{' '}
                                    <strong className="font-bold text-slate-800">
                                        {formatRupiah(
                                            activeApplication.wageAmount,
                                        )}
                                    </strong>
                                </p>

                                <button
                                    type="button"
                                    onClick={handleCheckInOut}
                                    disabled={
                                        Boolean(
                                            activeApplication.checkedOutAt,
                                        ) || attendanceProcessing
                                    }
                                    className={`mt-6 w-full rounded-xl px-5 py-3.5 text-sm font-bold text-white transition ${
                                        activeApplication.checkedOutAt
                                            ? 'cursor-not-allowed bg-slate-300 text-slate-600'
                                            : 'bg-[#1E4479] hover:bg-[#163561]'
                                    }`}
                                >
                                    {!activeApplication.checkedInAt
                                        ? 'Check-in Sekarang'
                                        : !activeApplication.checkedOutAt
                                          ? 'Check-out Sekarang'
                                          : 'Check-out Selesai'}
                                </button>
                            </div>
                        </div>

                        {/* KOLOM KANAN: BUKTI PENYELESAIAN TUGAS */}
                        <form
                            onSubmit={handleSubmitProof}
                            className="flex flex-col justify-between rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xs sm:p-7"
                        >
                            <div className="space-y-5">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <h2 className="text-lg font-extrabold text-slate-900">
                                            Bukti penyelesaian tugas
                                        </h2>
                                        <p className="mt-0.5 text-xs text-slate-400">
                                            Lengkapi laporan sebelum meminta
                                            persetujuan UMKM.
                                        </p>
                                    </div>

                                    <span
                                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                                            isSubmitted
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : 'bg-[#FEF3C7] text-[#B45309]'
                                        }`}
                                    >
                                        {isSubmitted
                                            ? 'Terkirim'
                                            : 'Belum Dikirim'}
                                    </span>
                                </div>

                                {/* UPLOAD FOTO HASIL KERJA */}
                                <div>
                                    <label className="mb-2 block text-xs font-bold text-slate-700">
                                        Foto hasil kerja
                                    </label>

                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/png,image/jpeg,image/jpg"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />

                                    {proofPreview ? (
                                        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                                            <img
                                                src={proofPreview}
                                                alt="Preview bukti kerja"
                                                className="h-44 w-full object-cover"
                                            />
                                            <div className="flex items-center justify-between bg-white px-4 py-2.5 text-xs">
                                                <span className="truncate font-medium text-slate-700">
                                                    {proofFile?.name ??
                                                        'Foto bukti tersimpan'}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={handleRemoveFile}
                                                    className="inline-flex items-center gap-1 font-semibold text-rose-600 hover:underline"
                                                >
                                                    <Trash2 className="size-3.5" />
                                                    Ganti Foto
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                fileInputRef.current?.click()
                                            }
                                            className="flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#BBD4F5] bg-[#F4F8FE] px-6 py-10 text-center transition hover:border-[#1E4479] hover:bg-[#EAF2FD]"
                                        >
                                            <ImagePlus className="size-6 text-[#1E4479]" />
                                            <p className="mt-2.5 text-sm font-bold text-slate-800">
                                                Unggah foto bukti
                                            </p>
                                            <p className="mt-1 text-xs text-slate-400">
                                                JPG atau PNG, maksimal 5 MB
                                            </p>
                                        </button>
                                    )}
                                </div>

                                {/* CATATAN AKTIVITAS */}
                                <div>
                                    <label
                                        htmlFor="activityNotes"
                                        className="mb-2 block text-xs font-bold text-slate-700"
                                    >
                                        Catatan aktivitas
                                    </label>
                                    <textarea
                                        id="activityNotes"
                                        rows={4}
                                        value={activityNotes}
                                        onChange={(e) =>
                                            setActivityNotes(e.target.value)
                                        }
                                        placeholder="Contoh: Menyelesaikan packing 100 kotak dan membantu pengecekan pesanan..."
                                        className="w-full rounded-2xl border border-slate-200 bg-white p-3.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#1E4479] focus:ring-2 focus:ring-[#1E4479]/15 focus:outline-none"
                                    />
                                </div>
                            </div>

                            {/* KONFIRMASI & SUBMIT */}
                            <div className="mt-6 space-y-4">
                                <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-600">
                                    <input
                                        type="checkbox"
                                        checked={isConfirmed}
                                        onChange={(e) =>
                                            setIsConfirmed(e.target.checked)
                                        }
                                        className="size-4 rounded border-slate-300 text-[#1E4479] focus:ring-[#1E4479]"
                                    />
                                    <span>
                                        Saya memastikan informasi dan bukti yang
                                        dikirim sesuai dengan pekerjaan yang
                                        dilakukan.
                                    </span>
                                </label>

                                {formError && (
                                    <p className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-600">
                                        {formError}
                                    </p>
                                )}

                                {isSubmitted && (
                                    <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-xs font-semibold text-emerald-700">
                                        <CheckCircle2 className="size-4 shrink-0" />
                                        <span>
                                            Bukti penyelesaian dikirim pada{' '}
                                            {activeApplication.proofSubmittedAt}{' '}
                                            dan sudah tersimpan ke sistem.
                                        </span>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={submittingProof}
                                    className="w-full rounded-xl bg-[#1E4479] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#163561] disabled:opacity-60"
                                >
                                    {submittingProof
                                        ? 'Mengirim Bukti...'
                                        : isSubmitted
                                          ? 'Perbarui Bukti Penyelesaian'
                                          : 'Kirim untuk Persetujuan'}
                                </button>
                            </div>
                        </form>
                    </section>
                ) : (
                    <section className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-2xs">
                        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#EAF1FA] text-[#1E4479]">
                            <FileCheck2 className="size-7" />
                        </div>
                        <h2 className="mt-4 text-lg font-extrabold text-slate-900">
                            Belum ada tugas aktif saat ini
                        </h2>
                        <p className="mx-auto mt-1.5 max-w-md text-sm text-slate-500">
                            Tugas yang lamarannya sudah diterima oleh UMKM akan
                            muncul di halaman ini agar kamu bisa melakukan
                            check-in dan mengunggah bukti kerja.
                        </p>
                        <Link
                            href="/worker/tasks"
                            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#1E4479] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#163561]"
                        >
                            <Search className="size-4" />
                            <span>Cari Tugas & Lamar</span>
                        </Link>
                    </section>
                )}

                {/* DAFTAR STATUS LAMARAN LAINNYA */}
                {applications.length > 0 && (
                    <section className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xs sm:p-7">
                        <div className="flex items-center justify-between gap-2">
                            <div>
                                <h2 className="text-base font-extrabold text-slate-900">
                                    Semua pengajuan lamaran
                                </h2>
                                <p className="mt-0.5 text-xs text-slate-400">
                                    Daftar seluruh lamaran yang pernah kamu
                                    ajukan ke UMKM.
                                </p>
                            </div>
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                                {applications.length} lamaran
                            </span>
                        </div>

                        <div className="mt-5 divide-y divide-slate-100">
                            {applications.map((application) => (
                                <div
                                    key={application.id}
                                    className="flex flex-col justify-between gap-3 py-4 sm:flex-row sm:items-center"
                                >
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">
                                            {application.taskTitle}
                                        </p>
                                        <p className="mt-0.5 text-xs text-slate-500">
                                            {application.businessName} •
                                            Diajukan{' '}
                                            {application.appliedAt ?? '-'}
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-3">
                                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700">
                                            <WalletCards className="size-3.5 text-slate-400" />
                                            {formatRupiah(
                                                application.wageAmount,
                                            )}
                                        </span>

                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-bold ${statusStyle(
                                                application.status,
                                            )}`}
                                        >
                                            {statusLabel(application.status)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </main>
        </>
    );
}
