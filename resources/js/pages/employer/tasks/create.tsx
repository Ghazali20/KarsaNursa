import { Head, Link, router } from '@inertiajs/react';
import { useState, type FormEvent } from 'react';
import { ArrowRight, ChevronDown, MapPin, ShieldCheck, X } from 'lucide-react';

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

const inputClass =
    'mt-1.5 block h-10 w-full rounded-[10px] border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#345eaa] focus:ring-2 focus:ring-blue-100';

const labelClass = 'block text-[12px] font-semibold text-[#172c4b]';

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

    // Usulan: pendaftaran ditutup satu jam sebelum pekerjaan mulai.
    date.setHours(date.getHours() - 1);
    return formatLocalDateTime(date);
}

function FieldError({ message }: { message?: string }) {
    if (!message) return null;

    return <p className="mt-1 text-xs font-medium text-red-600">{message}</p>;
}

export default function CreateTask() {
    const [form, setForm] = useState<TaskForm>({
        title: '',
        category: '',
        description: '',
        requirements: '',
        instructions: '',
        location_address: '',
        latitude: '',
        longitude: '',
        attendance_radius_meters: '100',
        application_deadline: '',
        work_date: '',
        work_time: '',
        duration_hours: '4',
        worker_quota: '2',
        wage_amount: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);
    const [advancedOpen, setAdvancedOpen] = useState(false);

    const startsAt =
        form.work_date && form.work_time
            ? `${form.work_date}T${form.work_time}`
            : '';

    const endsAt = calculateEnd(startsAt, form.duration_hours);
    const deadline = form.application_deadline || suggestDeadline(startsAt);

    function updateField<K extends keyof TaskForm>(key: K, value: TaskForm[K]) {
        setForm((current) => ({ ...current, [key]: value }));

        // Bersihkan pesan error field saat pengguna memperbaikinya.
        setErrors((current) => {
            if (!(key in current)) return current;
            const next = { ...current };
            delete next[key];
            return next;
        });
    }

    function submitTask(action: Action) {
        if (processing) return;

        // Saat publikasi, semua field wajib harus valid.
        // Draft tetap dikirim ke server sesuai aturan validasi Laravel.
        if (action === 'publish') {
            const nextErrors: Record<string, string> = {};

            if (!form.title.trim())
                nextErrors.title = 'Judul tugas wajib diisi.';
            if (!form.category)
                nextErrors.category = 'Pilih kategori pekerjaan.';
            if (form.description.trim().length < 20) {
                nextErrors.description = 'Deskripsi minimal 20 karakter.';
            }
            if (!startsAt)
                nextErrors.starts_at = 'Isi tanggal dan waktu mulai.';
            if (!endsAt) nextErrors.ends_at = 'Durasi pekerjaan harus valid.';
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
                nextErrors.wage_amount = 'Upah harus lebih dari Rp0.';
            }
            if (!form.latitude || !form.longitude) {
                if (!form.latitude)
                    nextErrors.latitude = 'Latitude wajib diisi.';
                if (!form.longitude)
                    nextErrors.longitude = 'Longitude wajib diisi.';
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
                if (
                    nextErrors.latitude ||
                    nextErrors.longitude ||
                    nextErrors.application_deadline
                ) {
                    setAdvancedOpen(true);
                }
                return;
            }
        }

        setErrors({});
        setProcessing(true);

        // Nama field tetap sama dengan yang dipakai Controller Laravel.
        router.post(
            '/employer/tasks',
            {
                title: form.title.trim(),
                category: form.category,
                description: form.description.trim(),
                requirements: form.requirements,
                instructions: form.instructions,
                location_address: form.location_address.trim(),
                latitude: form.latitude,
                longitude: form.longitude,
                attendance_radius_meters: form.attendance_radius_meters,
                application_deadline: deadline,
                starts_at: startsAt,
                ends_at: endsAt,
                worker_quota: form.worker_quota,
                wage_amount: form.wage_amount,
                action,
            },
            {
                preserveScroll: true,
                onError: (validationErrors) => {
                    setErrors(validationErrors);
                    if (
                        validationErrors.latitude ||
                        validationErrors.longitude ||
                        validationErrors.application_deadline ||
                        validationErrors.attendance_radius_meters
                    ) {
                        setAdvancedOpen(true);
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
            <Head title="Buat Micro-task - KarsaNursa" />

            {/* Overlay: halaman create ditampilkan sebagai modal sesuai Figma. */}
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d1930]/40 p-3 backdrop-blur-[3px] sm:p-6">
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="create-task-title"
                    className="flex max-h-[calc(100dvh-24px)] w-full max-w-[610px] flex-col overflow-hidden rounded-[19px] bg-white shadow-[0_24px_90px_rgba(15,23,42,0.3)] sm:max-h-[calc(100dvh-48px)]"
                >
                    {/* Header modal */}
                    <div className="flex shrink-0 items-start justify-between border-b border-slate-100 px-6 py-5 sm:px-7">
                        <div>
                            <span className="inline-flex rounded-full bg-[#e2f5fa] px-3 py-1 text-[10px] font-bold tracking-wide text-[#24527e]">
                                TUGAS BARU
                            </span>
                            <h1
                                id="create-task-title"
                                className="mt-2 text-[24px] font-bold tracking-tight text-[#192a46]"
                            >
                                Buat micro-task
                            </h1>
                            <p className="mt-1 text-[11px] text-slate-500">
                                Berikan rincian yang jelas agar pekerja memahami
                                tugas.
                            </p>
                        </div>

                        <Link
                            href="/employer/dashboard"
                            aria-label="Tutup dan kembali ke Dashboard"
                            className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100"
                        >
                            <X className="size-4" />
                        </Link>
                    </div>

                    {/* Konten modal dapat di-scroll pada layar kecil. */}
                    <form
                        id="create-microtask-form"
                        onSubmit={handleSubmit}
                        noValidate
                        className="min-h-0 flex-1 overflow-y-auto"
                    >
                        <div className="space-y-4 px-6 py-5 sm:px-7">
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

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div>
                                    <label
                                        htmlFor="task-category"
                                        className={labelClass}
                                    >
                                        Kategori *
                                    </label>
                                    <select
                                        id="task-category"
                                        value={form.category}
                                        onChange={(e) =>
                                            updateField(
                                                'category',
                                                e.target.value,
                                            )
                                        }
                                        className={inputClass}
                                    >
                                        <option value="">Pilih kategori</option>
                                        {categories.map((category) => (
                                            <option
                                                key={category}
                                                value={category}
                                            >
                                                {category}
                                            </option>
                                        ))}
                                    </select>
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
                                    />
                                    <FieldError message={errors.ends_at} />
                                </div>
                            </div>

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
                                                ? `Rp${Number(form.wage_amount).toLocaleString('id-ID')}`
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
                                        placeholder="Rp75.000"
                                    />
                                    <FieldError message={errors.wage_amount} />
                                </div>
                            </div>

                            <div>
                                <label
                                    htmlFor="task-description"
                                    className={labelClass}
                                >
                                    Deskripsi & tanggung jawab *
                                </label>
                                <textarea
                                    id="task-description"
                                    value={form.description}
                                    onChange={(e) =>
                                        updateField(
                                            'description',
                                            e.target.value,
                                        )
                                    }
                                    className={`${inputClass} h-16 resize-y py-3`}
                                    placeholder="Jelaskan aktivitas, kebutuhan, dan hasil yang diharapkan..."
                                />
                                <FieldError message={errors.description} />
                            </div>

                            {/* Field penting yang tidak tampak di Figma,
                                tetapi dibutuhkan backend dan fitur presensi. */}
                            <div className="rounded-lg border border-slate-200">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setAdvancedOpen((value) => !value)
                                    }
                                    aria-expanded={advancedOpen}
                                    className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs font-semibold text-[#254673] hover:bg-slate-50"
                                >
                                    <span className="flex items-center gap-2">
                                        <MapPin className="size-4" />
                                        Detail lokasi & pendaftaran
                                    </span>
                                    <ChevronDown
                                        className={`size-4 transition-transform ${
                                            advancedOpen ? 'rotate-180' : ''
                                        }`}
                                    />
                                </button>
                                {advancedOpen && (
                                    <div className="grid gap-3 border-t border-slate-200 p-3 sm:grid-cols-2">
                                        <div>
                                            <label
                                                htmlFor="latitude"
                                                className={labelClass}
                                            >
                                                Latitude *
                                            </label>
                                            <input
                                                id="latitude"
                                                type="number"
                                                step="any"
                                                value={form.latitude}
                                                onChange={(e) =>
                                                    updateField(
                                                        'latitude',
                                                        e.target.value,
                                                    )
                                                }
                                                className={inputClass}
                                                placeholder="-7.2575"
                                            />
                                            <FieldError
                                                message={errors.latitude}
                                            />
                                        </div>
                                        <div>
                                            <label
                                                htmlFor="longitude"
                                                className={labelClass}
                                            >
                                                Longitude *
                                            </label>
                                            <input
                                                id="longitude"
                                                type="number"
                                                step="any"
                                                value={form.longitude}
                                                onChange={(e) =>
                                                    updateField(
                                                        'longitude',
                                                        e.target.value,
                                                    )
                                                }
                                                className={inputClass}
                                                placeholder="112.7521"
                                            />
                                            <FieldError
                                                message={errors.longitude}
                                            />
                                        </div>
                                        <div className="sm:col-span-2">
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
                                            <p className="mt-1 text-[11px] text-slate-500">
                                                Awalnya disarankan 1 jam sebelum
                                                pekerjaan mulai. Bisa diubah.
                                            </p>
                                            <FieldError
                                                message={
                                                    errors.application_deadline
                                                }
                                            />
                                        </div>
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
                                                className={`${inputClass} flex items-center bg-slate-50`}
                                            >
                                                {endsAt
                                                    ? endsAt.replace('T', ' • ')
                                                    : '—'}
                                            </div>
                                        </div>
                                        <div className="sm:col-span-2">
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
                                                className={`${inputClass} h-auto py-3`}
                                                placeholder="Contoh: Teliti, disiplin, dan tepat waktu"
                                            />
                                            <FieldError
                                                message={errors.requirements}
                                            />
                                        </div>
                                        <div className="sm:col-span-2">
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
                                                className={`${inputClass} h-auto py-3`}
                                                placeholder="Contoh: Bawa pakaian kerja yang nyaman"
                                            />
                                            <FieldError
                                                message={errors.instructions}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-start gap-3 rounded-[11px] bg-[#eef7fa] px-4 py-3">
                                <ShieldCheck className="mt-0.5 size-[19px] shrink-0 text-[#21477f]" />
                                <div>
                                    <p className="text-[11px] font-bold text-[#1f416e]">
                                        Komitmen upah transparan
                                    </p>
                                    <p className="mt-0.5 text-[10px] leading-relaxed text-[#47678d]">
                                        Nominal di atas adalah upah bersih yang
                                        diterima pekerja tanpa potongan.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Footer selalu tampak di bagian bawah modal. */}
                        <div className="sticky bottom-0 flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4 sm:px-7">
                            <button
                                type="button"
                                onClick={() => submitTask('draft')}
                                disabled={processing}
                                className="rounded-lg px-4 py-2.5 text-sm font-semibold text-[#5e7090] hover:bg-slate-50 disabled:opacity-50"
                            >
                                Simpan Draft
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center gap-3 rounded-[10px] bg-[#21477f] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_6px_15px_rgba(33,71,127,0.18)] transition hover:bg-[#163963] disabled:opacity-50"
                            >
                                {processing
                                    ? 'Menyimpan...'
                                    : 'Publikasikan Tugas'}
                                <ArrowRight className="size-4" />
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
