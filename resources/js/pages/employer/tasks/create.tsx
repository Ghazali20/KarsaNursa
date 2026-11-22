import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowRight,
    Calendar,
    ChevronDown,
    Clock,
    FileText,
    Info,
    ShieldCheck,
    X,
} from 'lucide-react';
import React, { useState, type FormEvent } from 'react';
import { toast } from 'sonner';

// ==========================================
// TIPE & KONSTANTA
// ==========================================

type Action = 'draft' | 'publish';

type TaskForm = {
    title: string;
    category: string;
    description: string;
    requirements: string;
    instructions: string;
    location_address: string;
    latitude: string;
    longitude: string;
    attendance_radius_meters: string;
    application_deadline: string;
    work_date: string;
    work_time: string;
    duration_hours: string;
    worker_quota: string;
    wage_amount: string;
};

const categories = [
    'Katering',
    'Kuliner',
    'Retail',
    'Administrasi',
    'Logistik',
    'Lainnya',
];

// Fallback koordinat default di balik layar (tanpa input UI)
const DEFAULT_LATITUDE = '-6.2088';
const DEFAULT_LONGITUDE = '106.8456';

// Styling kelas input terstandar
const inputClass =
    'mt-1.5 block h-10 w-full rounded-xl border border-[#DFE6ED] bg-white px-3.5 text-xs sm:text-sm text-[#17233A] outline-none transition placeholder:text-[#93A2B5] focus:border-[#173765] focus:ring-2 focus:ring-[#173765]/10';

const labelClass = 'block text-xs font-semibold text-[#17233A]';

// ==========================================
// HELPER PERHITUNGAN WAKTU & TANGGAL
// ==========================================

function formatLocalDateTime(date: Date): string {
    const two = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${two(date.getMonth() + 1)}-${two(date.getDate())}T${two(date.getHours())}:${two(date.getMinutes())}`;
}

function calculateEnd(startAt: string, durationHours: string): string {
    if (!startAt || !durationHours) return '';

    const hours = Number(durationHours);
    const end = new Date(startAt);

    if (!Number.isFinite(hours) || hours <= 0 || Number.isNaN(end.getTime())) {
        return '';
    }

    end.setMinutes(end.getMinutes() + Math.round(hours * 60));
    return formatLocalDateTime(end);
}

function suggestDeadline(startAt: string): string {
    if (!startAt) return '';

    const date = new Date(startAt);
    if (Number.isNaN(date.getTime())) return '';

    // Rekomendasi awal: batas lamaran ditutup 1 jam sebelum tugas mulai
    date.setHours(date.getHours() - 1);
    return formatLocalDateTime(date);
}

function formatEndDisplay(dateTimeStr: string): string {
    if (!dateTimeStr) return '—';
    try {
        const d = new Date(dateTimeStr);
        if (Number.isNaN(d.getTime())) return '—';
        return d.toLocaleString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return dateTimeStr.replace('T', ' • ');
    }
}

function FieldError({ message }: { message?: string }) {
    if (!message) return null;
    return <p className="mt-1 text-xs font-medium text-[#EF4444]">{message}</p>;
}

// ==========================================
// KOMPONEN UTAMA MODAL BUAT TUGAS
// ==========================================

export default function CreateTask() {
    const [form, setForm] = useState<TaskForm>({
        title: '',
        category: '',
        description: '',
        requirements: '',
        instructions: '',
        location_address: '',
        latitude: DEFAULT_LATITUDE,
        longitude: DEFAULT_LONGITUDE,
        attendance_radius_meters: '100',
        application_deadline: '',
        work_date: '',
        work_time: '',
        duration_hours: '1',
        worker_quota: '2',
        wage_amount: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);
    const [detailsOpen, setDetailsOpen] = useState(false);

    const startsAt =
        form.work_date && form.work_time
            ? `${form.work_date}T${form.work_time}`
            : '';

    const endsAt = calculateEnd(startsAt, form.duration_hours);
    const deadline = form.application_deadline || suggestDeadline(startsAt);

    function updateField<K extends keyof TaskForm>(key: K, value: TaskForm[K]) {
        setForm((current) => ({ ...current, [key]: value }));

        setErrors((current) => {
            if (!(key in current)) return current;
            const next = { ...current };
            delete next[key];
            return next;
        });
    }

    function submitTask(action: Action) {
        if (processing) return;

        // Validasi client-side saat mempublikasikan tugas
        if (action === 'publish') {
            const nextErrors: Record<string, string> = {};

            if (!form.title.trim()) {
                nextErrors.title = 'Judul tugas wajib diisi.';
            }
            if (!form.category) {
                nextErrors.category = 'Pilih kategori pekerjaan.';
            }
            if (form.description.trim().length < 20) {
                nextErrors.description = 'Deskripsi minimal 20 karakter.';
            }
            if (!startsAt) {
                nextErrors.starts_at = 'Isi tanggal dan waktu mulai.';
            }
            if (!endsAt) {
                nextErrors.ends_at = 'Durasi pekerjaan harus valid.';
            }
            if (!form.location_address.trim()) {
                nextErrors.location_address = 'Alamat lokasi wajib diisi.';
            }
            if (
                Number(form.worker_quota) < 1 ||
                Number(form.worker_quota) > 100
            ) {
                nextErrors.worker_quota = 'Kuota harus 1–100 pekerja.';
            }
            if (Number(form.wage_amount) < 1) {
                nextErrors.wage_amount = 'Upah harus lebih dari Rp 0.';
            }
            if (!deadline || new Date(deadline).getTime() <= Date.now()) {
                nextErrors.application_deadline =
                    'Batas lamaran harus setelah waktu sekarang.';
            }
            if (
                startsAt &&
                deadline &&
                new Date(deadline).getTime() >= new Date(startsAt).getTime()
            ) {
                nextErrors.application_deadline =
                    'Batas lamaran harus sebelum pekerjaan dimulai.';
            }
            if (startsAt && new Date(startsAt).getTime() <= Date.now()) {
                nextErrors.starts_at = 'Jadwal mulai harus di masa depan.';
            }

            if (Object.keys(nextErrors).length > 0) {
                setErrors(nextErrors);
                const firstMsg = Object.values(nextErrors)[0];
                toast.error('Periksa Formulir', {
                    description: firstMsg,
                });
                if (
                    nextErrors.application_deadline ||
                    nextErrors.attendance_radius_meters
                ) {
                    setDetailsOpen(true);
                }
                return;
            }
        }

        setErrors({});
        setProcessing(true);

        // Kirim request ke backend Laravel (/employer/tasks POST)
        // action dipetakan ke 'submit' (jika publish) atau 'draft' sesuai aturan validasi backend
        router.post(
            '/employer/tasks',
            {
                title: form.title.trim(),
                category: form.category,
                description: form.description.trim(),
                requirements: form.requirements,
                instructions: form.instructions,
                location_address: form.location_address.trim(),
                // Nilai fallback latitude & longitude dikirim otomatis di balik layar
                latitude: form.latitude?.trim() || DEFAULT_LATITUDE,
                longitude: form.longitude?.trim() || DEFAULT_LONGITUDE,
                attendance_radius_meters: form.attendance_radius_meters,
                application_deadline: deadline,
                starts_at: startsAt,
                ends_at: endsAt,
                worker_quota: form.worker_quota,
                wage_amount: form.wage_amount,
                action: action === 'publish' ? 'submit' : 'draft',
            },
            {
                preserveScroll: true,
                onError: (validationErrors) => {
                    setErrors(validationErrors);
                    const firstMsg = Object.values(validationErrors)[0];
                    if (firstMsg) {
                        toast.error('Gagal Menyimpan Tugas', {
                            description: String(firstMsg),
                        });
                    }
                    if (
                        validationErrors.application_deadline ||
                        validationErrors.attendance_radius_meters
                    ) {
                        setDetailsOpen(true);
                    }
                },
                onFinish: () => setProcessing(false),
            },
        );
    }

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        submitTask('publish');
    }

    return (
        <>
            <Head>
                <title>Buat Micro-task - Karsa Nusa</title>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link
                    rel="preconnect"
                    href="https://fonts.gstatic.com"
                    crossOrigin="anonymous"
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
                    rel="stylesheet"
                />
            </Head>

            {/* CONTAINER OVERLAY MODAL */}
            <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 antialiased backdrop-blur-sm sm:p-6"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
                {/* KARTU MODAL */}
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="create-task-title"
                    className="flex max-h-[calc(100dvh-28px)] w-full max-w-[640px] flex-col overflow-hidden rounded-2xl border border-[#DFE6ED] bg-white shadow-2xl sm:max-h-[calc(100dvh-48px)]"
                >
                    {/* ========================================================
                        HEADER MODAL
                    ======================================================== */}
                    <div className="flex shrink-0 items-start justify-between border-b border-[#DFE6ED] px-6 py-5 sm:px-7">
                        <div>
                            {/* Badge Pill TUGAS BARU */}
                            <span className="inline-flex rounded-full bg-[#D8F1F6] px-3 py-1 text-[10px] font-bold tracking-wider text-[#173765] uppercase">
                                TUGAS BARU
                            </span>

                            {/* Judul Besar */}
                            <h1
                                id="create-task-title"
                                className="mt-2 text-2xl font-bold tracking-tight text-[#17233A]"
                            >
                                Buat micro-task
                            </h1>

                            {/* Subjudul */}
                            <p className="mt-1 text-xs text-[#607087]">
                                Berikan rincian yang jelas agar pekerja memahami
                                tugas.
                            </p>
                        </div>

                        {/* Tombol Close X */}
                        <button
                            type="button"
                            onClick={() => {
                                if (window.history.length > 1) {
                                    window.history.back();
                                } else {
                                    router.visit('/employer/tasks');
                                }
                            }}
                            aria-label="Tutup dan kembali"
                            className="cursor-pointer rounded-xl border border-[#DFE6ED] p-2 text-[#607087] transition hover:bg-[#F7F9FB] hover:text-[#17233A]"
                        >
                            <X className="size-4.5" />
                        </button>
                    </div>

                    {/* ========================================================
                        FORM BODY (RESPONSIF & DAPAT DI-SCROLL)
                    ======================================================== */}
                    <form
                        id="create-microtask-form"
                        onSubmit={handleSubmit}
                        noValidate
                        className="min-h-0 flex-1 overflow-y-auto"
                    >
                        <div className="space-y-4 px-6 py-5 sm:px-7">
                            {/* 1. Judul Tugas (Full Width) */}
                            <div>
                                <label
                                    htmlFor="task-title"
                                    className={labelClass}
                                >
                                    Judul tugas *
                                </label>
                                <input
                                    id="task-title"
                                    value={form.title}
                                    onChange={(e) =>
                                        updateField('title', e.target.value)
                                    }
                                    className={inputClass}
                                    placeholder="Contoh: Bantu packing 100 kotak pesanan"
                                    maxLength={150}
                                />
                                <FieldError message={errors.title} />
                            </div>

                            {/* 2. Grid 2 Kolom: Kategori & Tanggal Pelaksanaan */}
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div>
                                    <label
                                        htmlFor="task-category"
                                        className={labelClass}
                                    >
                                        Kategori *
                                    </label>
                                    <div className="relative">
                                        <select
                                            id="task-category"
                                            value={form.category}
                                            onChange={(e) =>
                                                updateField(
                                                    'category',
                                                    e.target.value,
                                                )
                                            }
                                            className={`${inputClass} cursor-pointer appearance-none pr-8`}
                                        >
                                            <option value="">
                                                Pilih kategori
                                            </option>
                                            {categories.map((category) => (
                                                <option
                                                    key={category}
                                                    value={category}
                                                >
                                                    {category}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-[#93A2B5]" />
                                    </div>
                                    <FieldError message={errors.category} />
                                </div>

                                <div>
                                    <label
                                        htmlFor="work-date"
                                        className={labelClass}
                                    >
                                        Tanggal pelaksanaan *
                                    </label>
                                    <input
                                        id="work-date"
                                        type="date"
                                        value={form.work_date}
                                        onChange={(e) =>
                                            updateField(
                                                'work_date',
                                                e.target.value,
                                            )
                                        }
                                        className={inputClass}
                                    />
                                    <FieldError message={errors.starts_at} />
                                </div>
                            </div>

                            {/* 3. Grid 2 Kolom: Waktu Mulai & Durasi (jam) */}
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div>
                                    <label
                                        htmlFor="work-time"
                                        className={labelClass}
                                    >
                                        Waktu mulai *
                                    </label>
                                    <input
                                        id="work-time"
                                        type="time"
                                        value={form.work_time}
                                        onChange={(e) =>
                                            updateField(
                                                'work_time',
                                                e.target.value,
                                            )
                                        }
                                        className={inputClass}
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="duration"
                                        className={labelClass}
                                    >
                                        Durasi (jam) *
                                    </label>
                                    <input
                                        id="duration"
                                        type="number"
                                        min="1"
                                        max="24"
                                        step="1"
                                        value={form.duration_hours}
                                        onChange={(e) =>
                                            updateField(
                                                'duration_hours',
                                                e.target.value,
                                            )
                                        }
                                        className={inputClass}
                                        placeholder="4"
                                    />
                                    <FieldError message={errors.ends_at} />
                                </div>
                            </div>

                            {/* 4. Alamat Lokasi (Full Width) */}
                            <div>
                                <label
                                    htmlFor="task-address"
                                    className={labelClass}
                                >
                                    Alamat lokasi *
                                </label>
                                <input
                                    id="task-address"
                                    value={form.location_address}
                                    onChange={(e) =>
                                        updateField(
                                            'location_address',
                                            e.target.value,
                                        )
                                    }
                                    className={inputClass}
                                    placeholder="Alamat lengkap tempat tugas"
                                    maxLength={1000}
                                />
                                <FieldError message={errors.location_address} />
                            </div>

                            {/* 5. Grid 2 Kolom: Kuota Pekerja & Upah Bersih */}
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div>
                                    <label
                                        htmlFor="task-quota"
                                        className={labelClass}
                                    >
                                        Kuota pekerja *
                                    </label>
                                    <input
                                        id="task-quota"
                                        type="number"
                                        min="1"
                                        max="100"
                                        value={form.worker_quota}
                                        onChange={(e) =>
                                            updateField(
                                                'worker_quota',
                                                e.target.value,
                                            )
                                        }
                                        className={inputClass}
                                        placeholder="2"
                                    />
                                    <FieldError message={errors.worker_quota} />
                                </div>

                                <div>
                                    <label
                                        htmlFor="task-wage"
                                        className={labelClass}
                                    >
                                        Upah bersih / pekerja *
                                    </label>
                                    <input
                                        id="task-wage"
                                        type="text"
                                        inputMode="numeric"
                                        value={
                                            form.wage_amount
                                                ? `Rp ${Number(form.wage_amount).toLocaleString('id-ID')}`
                                                : ''
                                        }
                                        onChange={(e) =>
                                            updateField(
                                                'wage_amount',
                                                e.target.value.replace(
                                                    /\D/g,
                                                    '',
                                                ),
                                            )
                                        }
                                        className={inputClass}
                                        placeholder="Rp 75.000"
                                    />
                                    <FieldError message={errors.wage_amount} />
                                </div>
                            </div>

                            {/* 6. Deskripsi & Tanggung Jawab (Full Width) */}
                            <div>
                                <label
                                    htmlFor="task-description"
                                    className={labelClass}
                                >
                                    Deskripsi & tanggung jawab *
                                </label>
                                <textarea
                                    id="task-description"
                                    rows={3}
                                    value={form.description}
                                    onChange={(e) =>
                                        updateField(
                                            'description',
                                            e.target.value,
                                        )
                                    }
                                    className={`${inputClass} h-auto resize-y py-2.5 leading-relaxed`}
                                    placeholder="Jelaskan aktivitas, kebutuhan, dan hasil yang diharapkan..."
                                />
                                <FieldError message={errors.description} />
                            </div>

                            {/* ========================================================
                                7. SECTION TAMBAHAN — DETAIL PENDAFTARAN
                                (TANPA INPUT MANUAL LATITUDE & LONGITUDE)
                            ======================================================== */}
                            <div className="overflow-hidden rounded-xl border border-[#DFE6ED] bg-white">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setDetailsOpen((value) => !value)
                                    }
                                    aria-expanded={detailsOpen}
                                    className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-xs font-semibold text-[#173765] transition hover:bg-[#F7F9FB]"
                                >
                                    <span className="flex items-center gap-2">
                                        <FileText className="size-4 text-[#173765]" />
                                        <span>Detail pendaftaran</span>
                                    </span>
                                    <ChevronDown
                                        className={`size-4 text-[#607087] transition-transform duration-200 ${
                                            detailsOpen ? 'rotate-180' : ''
                                        }`}
                                    />
                                </button>

                                {detailsOpen && (
                                    <div className="space-y-3.5 border-t border-[#DFE6ED] bg-[#F7F9FB]/50 p-4">
                                        {/* Batas Penerimaan Lamaran */}
                                        <div>
                                            <label
                                                htmlFor="deadline"
                                                className={labelClass}
                                            >
                                                Batas penerimaan lamaran *
                                            </label>
                                            <input
                                                id="deadline"
                                                type="datetime-local"
                                                value={deadline}
                                                onChange={(e) =>
                                                    updateField(
                                                        'application_deadline',
                                                        e.target.value,
                                                    )
                                                }
                                                className={inputClass}
                                            />
                                            <p className="mt-1 text-[11px] text-[#607087]">
                                                Awalnya disarankan 1 jam sebelum
                                                pekerjaan mulai. Bisa diubah.
                                            </p>
                                            <FieldError
                                                message={
                                                    errors.application_deadline
                                                }
                                            />
                                        </div>

                                        {/* Grid 2 Kolom: Radius Presensi & Perkiraan Selesai */}
                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                            <div>
                                                <label
                                                    htmlFor="radius"
                                                    className={labelClass}
                                                >
                                                    Radius presensi (meter)
                                                </label>
                                                <input
                                                    id="radius"
                                                    type="number"
                                                    min="50"
                                                    max="10000"
                                                    value={
                                                        form.attendance_radius_meters
                                                    }
                                                    onChange={(e) =>
                                                        updateField(
                                                            'attendance_radius_meters',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className={inputClass}
                                                    placeholder="100"
                                                />
                                                <FieldError
                                                    message={
                                                        errors.attendance_radius_meters
                                                    }
                                                />
                                            </div>

                                            <div>
                                                <label className={labelClass}>
                                                    Perkiraan selesai
                                                </label>
                                                <div
                                                    className={`${inputClass} flex cursor-not-allowed items-center bg-[#F7F9FB] font-medium text-[#607087]`}
                                                >
                                                    {formatEndDisplay(endsAt)}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Persyaratan Pekerja (Opsional) */}
                                        <div>
                                            <label
                                                htmlFor="requirements"
                                                className={labelClass}
                                            >
                                                Persyaratan pekerja (opsional)
                                            </label>
                                            <textarea
                                                id="requirements"
                                                rows={2}
                                                value={form.requirements}
                                                onChange={(e) =>
                                                    updateField(
                                                        'requirements',
                                                        e.target.value,
                                                    )
                                                }
                                                className={`${inputClass} h-auto resize-y py-2.5`}
                                                placeholder="Contoh: Teliti, disiplin, dan tepat waktu"
                                            />
                                            <FieldError
                                                message={errors.requirements}
                                            />
                                        </div>

                                        {/* Instruksi Tambahan (Opsional) */}
                                        <div>
                                            <label
                                                htmlFor="instructions"
                                                className={labelClass}
                                            >
                                                Instruksi tambahan (opsional)
                                            </label>
                                            <textarea
                                                id="instructions"
                                                rows={2}
                                                value={form.instructions}
                                                onChange={(e) =>
                                                    updateField(
                                                        'instructions',
                                                        e.target.value,
                                                    )
                                                }
                                                className={`${inputClass} h-auto resize-y py-2.5`}
                                                placeholder="Contoh: Bawa pakaian kerja yang nyaman"
                                            />
                                            <FieldError
                                                message={errors.instructions}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* ========================================================
                                8. BANNER KOMITMEN UPAH TRANSPARAN
                            ======================================================== */}
                            <div className="flex items-start gap-3 rounded-xl border border-[#DFE6ED] bg-[#F0F8FB] px-4 py-3">
                                <ShieldCheck className="mt-0.5 size-5 shrink-0 text-[#173765]" />
                                <div>
                                    <p className="text-xs font-bold text-[#173765]">
                                        Komitmen upah transparan
                                    </p>
                                    <p className="mt-0.5 text-[11px] leading-relaxed text-[#607087]">
                                        Nominal di atas adalah upah bersih yang
                                        diterima pekerja tanpa potongan.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* ========================================================
                            9. FOOTER ACTION BUTTONS (RATA KANAN)
                        ======================================================== */}
                        <div className="sticky bottom-0 flex flex-wrap items-center justify-end gap-3 border-t border-[#DFE6ED] bg-white px-6 py-4 sm:px-7">
                            <button
                                type="button"
                                onClick={() => submitTask('draft')}
                                disabled={processing}
                                className="rounded-xl px-4 py-2.5 text-xs font-bold text-[#17233A] transition hover:bg-[#F7F9FB] disabled:opacity-50"
                            >
                                Simpan Draft
                            </button>

                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center gap-2 rounded-xl bg-[#173765] px-5 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#21477F] disabled:opacity-50"
                            >
                                <span>
                                    {processing
                                        ? 'Menyimpan...'
                                        : 'Publikasikan Tugas'}
                                </span>
                                <ArrowRight className="size-4" />
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}

// ==========================================
// MENGISOLASI LAYOUT MODAL
// (Agar modal muncul langsung dengan backdrop tanpa tertimpa layout global)
// ==========================================
function CreateTaskLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}

CreateTask.layout = CreateTaskLayout;
