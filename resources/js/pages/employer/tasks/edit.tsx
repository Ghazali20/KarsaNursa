import { Head, Link, router } from '@inertiajs/react';
import { useState, type FormEvent } from 'react';
import {
    ArrowLeft,
    BriefcaseBusiness,
    CalendarDays,
    ClipboardPlus,
    MapPin,
    WalletCards,
} from 'lucide-react';

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
    starts_at: string;
    ends_at: string;
    worker_quota: string;
    wage_amount: string;
};

const inputClass =
    'mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100';

const labelClass = 'block text-sm font-semibold text-slate-700';

function ErrorMessage({ message }: { message?: string }) {
    if (!message) return null;

    return <p className="mt-1 text-xs font-medium text-red-600">{message}</p>;
}

type EditTaskProps = { task: TaskForm & { id: number } };

export default function EditTask({ task }: EditTaskProps) {
    const [form, setForm] = useState<TaskForm>({
        title: task.title ?? '',
        category: task.category ?? '',
        description: task.description ?? '',
        requirements: task.requirements ?? '',
        instructions: task.instructions ?? '',
        location_address: task.location_address ?? '',
        latitude: task.latitude ?? '',
        longitude: task.longitude ?? '',
        attendance_radius_meters: task.attendance_radius_meters ?? '',
        application_deadline: task.application_deadline ?? '',
        starts_at: task.starts_at ?? '',
        ends_at: task.ends_at ?? '',
        worker_quota: task.worker_quota ?? '',
        wage_amount: task.wage_amount ?? '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    function updateField<K extends keyof TaskForm>(
        field: K,
        value: TaskForm[K],
    ) {
        setForm((current) => ({
            ...current,
            [field]: value,
        }));
    }

    function saveDraft() {
        if (processing) return;

        setErrors({});
        setProcessing(true);

        router.patch(
            `/employer/tasks/${task.id}`,
            { ...form },
            {
                preserveScroll: true,
                onError: (validationErrors) => {
                    setErrors(validationErrors);
                },
                onFinish: () => {
                    setProcessing(false);
                },
            },
        );
    }

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        saveDraft();
    }

    return (
        <>
            <Head title="Edit Draft - KarsaNursa" />

            <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
                <div className="mx-auto max-w-5xl space-y-6">
                    <Link
                        href="/employer/tasks"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-900"
                    >
                        <ArrowLeft className="size-4" />
                        Kembali ke Kelola Tugas
                    </Link>

                    <header className="rounded-3xl bg-[var(--karsa-deep-navy)] p-7 text-white shadow-sm">
                        <div className="flex items-center gap-3">
                            <ClipboardPlus className="size-7" />
                            <div>
                                <h1 className="text-2xl font-extrabold">
                                    Edit Draft Tugas
                                </h1>
                                <p className="mt-1 text-sm text-white/70">
                                    Perbarui informasi dan jadwal tugas sebelum
                                    diajukan kembali kepada admin.
                                </p>
                            </div>
                        </div>
                    </header>

                    <form
                        onSubmit={handleSubmit}
                        noValidate
                        className="space-y-6"
                    >
                        {/* INFORMASI TUGAS */}
                        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="mb-6 flex items-center gap-3">
                                <BriefcaseBusiness className="size-5 text-blue-700" />
                                <h2 className="text-lg font-bold">
                                    Informasi Pekerjaan
                                </h2>
                            </div>

                            <div className="space-y-5">
                                <div>
                                    <label
                                        htmlFor="title"
                                        className={labelClass}
                                    >
                                        Judul Tugas *
                                    </label>
                                    <input
                                        id="title"
                                        value={form.title}
                                        onChange={(e) =>
                                            updateField('title', e.target.value)
                                        }
                                        className={inputClass}
                                        placeholder="Contoh: Membantu pengemasan pesanan"
                                    />
                                    <ErrorMessage message={errors.title} />
                                </div>

                                <div>
                                    <label
                                        htmlFor="category"
                                        className={labelClass}
                                    >
                                        Kategori Pekerjaan
                                    </label>
                                    <select
                                        id="category"
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
                                        <option value="Kuliner">Kuliner</option>
                                        <option value="Retail">Retail</option>
                                        <option value="Administrasi">
                                            Administrasi
                                        </option>
                                        <option value="Logistik">
                                            Logistik
                                        </option>
                                        <option value="Lainnya">Lainnya</option>
                                    </select>
                                    <ErrorMessage message={errors.category} />
                                </div>

                                <div>
                                    <label
                                        htmlFor="description"
                                        className={labelClass}
                                    >
                                        Deskripsi Tugas
                                    </label>
                                    <textarea
                                        id="description"
                                        rows={5}
                                        value={form.description}
                                        onChange={(e) =>
                                            updateField(
                                                'description',
                                                e.target.value,
                                            )
                                        }
                                        className={inputClass}
                                        placeholder="Jelaskan pekerjaan yang harus dilakukan..."
                                    />
                                    <ErrorMessage
                                        message={errors.description}
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="requirements"
                                        className={labelClass}
                                    >
                                        Persyaratan Pekerja
                                    </label>
                                    <textarea
                                        id="requirements"
                                        rows={3}
                                        value={form.requirements}
                                        onChange={(e) =>
                                            updateField(
                                                'requirements',
                                                e.target.value,
                                            )
                                        }
                                        className={inputClass}
                                        placeholder="Contoh: Teliti, disiplin, dan dapat bekerja sama."
                                    />
                                    <ErrorMessage
                                        message={errors.requirements}
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="instructions"
                                        className={labelClass}
                                    >
                                        Instruksi Tambahan
                                    </label>
                                    <textarea
                                        id="instructions"
                                        rows={3}
                                        value={form.instructions}
                                        onChange={(e) =>
                                            updateField(
                                                'instructions',
                                                e.target.value,
                                            )
                                        }
                                        className={inputClass}
                                        placeholder="Informasi tambahan untuk pekerja..."
                                    />
                                    <ErrorMessage
                                        message={errors.instructions}
                                    />
                                </div>
                            </div>
                        </section>

                        {/* LOKASI */}
                        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="mb-6 flex items-center gap-3">
                                <MapPin className="size-5 text-blue-700" />
                                <h2 className="text-lg font-bold">
                                    Lokasi Pekerjaan
                                </h2>
                            </div>

                            <div className="space-y-5">
                                <div>
                                    <label
                                        htmlFor="address"
                                        className={labelClass}
                                    >
                                        Alamat Pekerjaan
                                    </label>
                                    <textarea
                                        id="address"
                                        rows={2}
                                        value={form.location_address}
                                        onChange={(e) =>
                                            updateField(
                                                'location_address',
                                                e.target.value,
                                            )
                                        }
                                        className={inputClass}
                                        placeholder="Masukkan alamat lengkap lokasi kerja"
                                    />
                                    <ErrorMessage
                                        message={errors.location_address}
                                    />
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label
                                            htmlFor="latitude"
                                            className={labelClass}
                                        >
                                            Latitude
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
                                            placeholder="-7.545"
                                        />
                                        <ErrorMessage
                                            message={errors.latitude}
                                        />
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="longitude"
                                            className={labelClass}
                                        >
                                            Longitude
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
                                            placeholder="112.230"
                                        />
                                        <ErrorMessage
                                            message={errors.longitude}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label
                                        htmlFor="radius"
                                        className={labelClass}
                                    >
                                        Radius Presensi (Meter)
                                    </label>
                                    <input
                                        id="radius"
                                        type="number"
                                        min="50"
                                        value={form.attendance_radius_meters}
                                        onChange={(e) =>
                                            updateField(
                                                'attendance_radius_meters',
                                                e.target.value,
                                            )
                                        }
                                        className={inputClass}
                                    />
                                    <ErrorMessage
                                        message={
                                            errors.attendance_radius_meters
                                        }
                                    />
                                </div>
                            </div>
                        </section>

                        {/* JADWAL */}
                        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="mb-6 flex items-center gap-3">
                                <CalendarDays className="size-5 text-blue-700" />
                                <h2 className="text-lg font-bold">
                                    Jadwal Pekerjaan
                                </h2>
                            </div>

                            <div className="grid gap-5 sm:grid-cols-2">
                                <div>
                                    <label
                                        htmlFor="deadline"
                                        className={labelClass}
                                    >
                                        Batas Waktu Lamaran
                                    </label>
                                    <input
                                        id="deadline"
                                        type="datetime-local"
                                        value={form.application_deadline}
                                        onChange={(e) =>
                                            updateField(
                                                'application_deadline',
                                                e.target.value,
                                            )
                                        }
                                        className={inputClass}
                                    />
                                    <ErrorMessage
                                        message={errors.application_deadline}
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="starts_at"
                                        className={labelClass}
                                    >
                                        Waktu Mulai Pekerjaan
                                    </label>
                                    <input
                                        id="starts_at"
                                        type="datetime-local"
                                        value={form.starts_at}
                                        onChange={(e) =>
                                            updateField(
                                                'starts_at',
                                                e.target.value,
                                            )
                                        }
                                        className={inputClass}
                                    />
                                    <ErrorMessage message={errors.starts_at} />
                                </div>

                                <div>
                                    <label
                                        htmlFor="ends_at"
                                        className={labelClass}
                                    >
                                        Waktu Selesai Pekerjaan
                                    </label>
                                    <input
                                        id="ends_at"
                                        type="datetime-local"
                                        value={form.ends_at}
                                        onChange={(e) =>
                                            updateField(
                                                'ends_at',
                                                e.target.value,
                                            )
                                        }
                                        className={inputClass}
                                    />
                                    <ErrorMessage message={errors.ends_at} />
                                </div>
                            </div>
                        </section>

                        {/* KUOTA DAN UPAH */}
                        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="mb-6 flex items-center gap-3">
                                <WalletCards className="size-5 text-blue-700" />
                                <h2 className="text-lg font-bold">
                                    Kebutuhan Pekerja dan Upah
                                </h2>
                            </div>

                            <div className="grid gap-5 sm:grid-cols-2">
                                <div>
                                    <label
                                        htmlFor="quota"
                                        className={labelClass}
                                    >
                                        Jumlah Pekerja
                                    </label>
                                    <input
                                        id="quota"
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
                                        placeholder="Contoh: 3"
                                    />
                                    <ErrorMessage
                                        message={errors.worker_quota}
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="wage"
                                        className={labelClass}
                                    >
                                        Upah per Pekerja (Rp)
                                    </label>
                                    <input
                                        id="wage"
                                        type="number"
                                        min="1"
                                        value={form.wage_amount}
                                        onChange={(e) =>
                                            updateField(
                                                'wage_amount',
                                                e.target.value,
                                            )
                                        }
                                        className={inputClass}
                                        placeholder="Contoh: 100000"
                                    />
                                    <ErrorMessage
                                        message={errors.wage_amount}
                                    />
                                </div>
                            </div>
                        </section>

                        {/* SUBMIT */}
                        <div className="flex flex-wrap justify-end gap-3 rounded-2xl border border-slate-200 bg-white p-5">
                            <Link
                                href="/employer/tasks"
                                className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                            >
                                Batal
                            </Link>

                            <button
                                type="submit"
                                disabled={processing}
                                className="rounded-xl bg-[var(--karsa-deep-navy)] px-5 py-3 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
                            >
                                {processing
                                    ? 'Menyimpan...'
                                    : 'Simpan Perubahan Draft'}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </>
    );
}
