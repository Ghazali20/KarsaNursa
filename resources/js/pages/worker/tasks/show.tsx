import { Head, Link, useForm } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    BriefcaseBusiness,
    CalendarDays,
    CheckCircle2,
    Clock3,
    FileText,
    MapPin,
    ShieldCheck,
    Users,
    WalletCards,
    X,
    XCircle,
} from 'lucide-react';
import React, { useState } from 'react';

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

type ApplyFormData = {
    applicant_note: string;
    qualification_document: File | null;
    schedule_confirmed: boolean;
    application?: string;
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
    const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

    const { data, setData, post, processing, errors, reset, clearErrors } =
        useForm<ApplyFormData>({
            applicant_note: '',
            qualification_document: null,
            schedule_confirmed: false,
        });

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

    function handleApplySubmit(e: React.FormEvent) {
        e.preventDefault();
        post(`/worker/tasks/${task.id}/applications`, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setIsApplyModalOpen(false);
                reset();
            },
        });
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
                                        onClick={() =>
                                            setIsApplyModalOpen(true)
                                        }
                                        disabled={!canApply}
                                        className="w-full rounded-xl bg-[#21477f] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#163762] disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {canApply
                                            ? 'Lamar Tugas Sekarang'
                                            : 'Lamaran Tidak Tersedia'}
                                    </button>
                                </div>
                            )}
                        </aside>
                    </div>
                </div>
            </main>

            {/* ========================================
                MODAL QUICK APPLY (FORM PENGAJUAN)
            ======================================== */}
            {isApplyModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs"
                    onClick={() => {
                        if (!processing) {
                            setIsApplyModalOpen(false);
                        }
                    }}
                >
                    <div
                        className="flex max-h-[92vh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-2xl transition-all"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header Modal */}
                        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                            <div>
                                <h3 className="text-base font-bold text-[#172c4b]">
                                    Lamar Tugas Sekarang
                                </h3>
                                <p className="mt-0.5 text-xs text-slate-500">
                                    {task.title} · {task.businessName}
                                </p>
                            </div>
                            <button
                                type="button"
                                disabled={processing}
                                onClick={() => setIsApplyModalOpen(false)}
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Form Pengajuan */}
                        <form
                            onSubmit={handleApplySubmit}
                            className="flex flex-1 flex-col overflow-auto p-6"
                        >
                            <div className="space-y-4">
                                {/* Upah & Jadwal Singkat */}
                                <div className="space-y-1 rounded-xl bg-[#f4f7fb] p-3.5 text-xs text-slate-600">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">
                                            Upah Pekerjaan:
                                        </span>
                                        <span className="font-bold text-[#21477f]">
                                            {rupiah.format(task.wageAmount)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">
                                            Jadwal:
                                        </span>
                                        <span className="font-medium text-slate-800">
                                            {task.startsAt || 'Fleksibel'}
                                        </span>
                                    </div>
                                </div>

                                {/* 1. Catatan Singkat / Pesan Pengajuan (Wajib) */}
                                <div>
                                    <label
                                        htmlFor="applicant_note"
                                        className="block text-xs font-bold text-slate-800"
                                    >
                                        Pesan Pengajuan Kerja{' '}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <p className="mt-0.5 text-[11px] text-slate-500">
                                        Ceritakan singkat pengalaman, dan
                                        keahlian Anda untuk tugas ini.
                                    </p>
                                    <textarea
                                        id="applicant_note"
                                        required
                                        rows={3}
                                        minLength={10}
                                        maxLength={500}
                                        value={data.applicant_note}
                                        onChange={(e) => {
                                            setData(
                                                'applicant_note',
                                                e.target.value,
                                            );
                                            if (errors.applicant_note)
                                                clearErrors('applicant_note');
                                        }}
                                        placeholder="Ceritakan singkat pengalaman"
                                        className={`mt-1.5 w-full rounded-xl border p-3 text-xs transition outline-none focus:ring-2 ${
                                            errors.applicant_note
                                                ? 'border-red-300 bg-red-50/20 focus:border-red-500 focus:ring-red-100'
                                                : 'border-slate-300 focus:border-[#21477f] focus:ring-blue-100'
                                        }`}
                                    />
                                    <div className="mt-1 flex items-center justify-between text-[10px]">
                                        {errors.applicant_note ? (
                                            <span className="text-red-600">
                                                {errors.applicant_note}
                                            </span>
                                        ) : (
                                            <span className="text-slate-400">
                                                Minimal 10 karakter
                                            </span>
                                        )}
                                        <span
                                            className={
                                                data.applicant_note.length > 500
                                                    ? 'text-red-500'
                                                    : 'text-slate-400'
                                            }
                                        >
                                            {data.applicant_note.length}/500
                                        </span>
                                    </div>
                                </div>

                                {/* 2. Upload Dokumen Pendukung / Bukti Kualifikasi (Opsional) */}
                                <div>
                                    <label
                                        htmlFor="qualification_document"
                                        className="block text-xs font-bold text-slate-800"
                                    >
                                        Dokumen Pendukung{' '}
                                        <span className="font-normal text-slate-400">
                                            (Opsional)
                                        </span>
                                    </label>
                                    <p className="mt-0.5 text-[11px] text-slate-500">
                                        Tambahkan file agar UMKM lebih mengenal
                                        keahlian Anda. Format JPG, PNG, atau
                                        PDF. Maksimal 5 MB.
                                    </p>

                                    <div className="mt-1.5">
                                        <input
                                            id="qualification_document"
                                            type="file"
                                            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                                            onChange={(e) => {
                                                const file =
                                                    e.target.files?.[0] || null;
                                                setData(
                                                    'qualification_document',
                                                    file,
                                                );
                                                if (
                                                    errors.qualification_document
                                                )
                                                    clearErrors(
                                                        'qualification_document',
                                                    );
                                            }}
                                            className="block w-full text-xs text-slate-500 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-[#21477f] hover:file:bg-blue-100"
                                        />
                                        {data.qualification_document && (
                                            <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                                                <FileText size={13} />
                                                File terpilih:{' '}
                                                {
                                                    data.qualification_document
                                                        .name
                                                }
                                            </p>
                                        )}
                                        {errors.qualification_document && (
                                            <p className="mt-1 text-[11px] text-red-600">
                                                {errors.qualification_document}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* 3. Checkbox Konfirmasi Jadwal & Persyaratan (Wajib) */}
                                <div className="rounded-xl border border-slate-200 bg-[#f8fafc] p-3.5">
                                    <label className="flex cursor-pointer items-start gap-2.5">
                                        <input
                                            type="checkbox"
                                            required
                                            checked={data.schedule_confirmed}
                                            onChange={(e) => {
                                                setData(
                                                    'schedule_confirmed',
                                                    e.target.checked,
                                                );
                                                if (errors.schedule_confirmed)
                                                    clearErrors(
                                                        'schedule_confirmed',
                                                    );
                                            }}
                                            className="mt-0.5 size-4 rounded border-slate-300 text-[#21477f] focus:ring-[#21477f]"
                                        />
                                        <span className="text-xs leading-relaxed font-medium text-slate-700">
                                            Saya sanggup hadir sesuai jadwal
                                            pelaksanaan dan memenuhi seluruh
                                            persyaratan pekerjaan.{' '}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </span>
                                    </label>
                                    {errors.schedule_confirmed && (
                                        <p className="mt-1.5 text-[11px] text-red-600">
                                            {errors.schedule_confirmed}
                                        </p>
                                    )}
                                </div>

                                {errors.application && (
                                    <div className="rounded-lg bg-red-50 p-3 text-xs text-red-700">
                                        {errors.application}
                                    </div>
                                )}
                            </div>

                            {/* Tombol Aksi */}
                            <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                                <button
                                    type="button"
                                    disabled={processing}
                                    onClick={() => setIsApplyModalOpen(false)}
                                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={
                                        processing ||
                                        !data.schedule_confirmed ||
                                        data.applicant_note.trim().length < 10
                                    }
                                    className="rounded-xl bg-[#21477f] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[#163762] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {processing
                                        ? 'Mengirim Lamaran...'
                                        : 'Kirim Lamaran'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
