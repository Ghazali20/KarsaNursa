import { Head, useForm } from '@inertiajs/react';
import type { CSSProperties, FormEvent } from 'react';

// ========================================
// TIPE DATA
// ========================================

type Props = {
    googleName: string;
    googleEmail: string;
};

type Role = 'worker' | 'employer';

// ========================================
// RESPONSIVE STYLING
// ========================================

const inputClass =
    'mt-1.5 w-full min-w-0 rounded-lg border border-slate-300 ' +
    'bg-white px-3 py-2.5 text-sm text-slate-900 ' +
    'outline-none transition focus:border-blue-500 ' +
    'focus:ring-2 focus:ring-blue-100';

const labelClass = 'block text-sm font-medium text-slate-700';

const fieldGrid: CSSProperties = {
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 205px), 1fr))',
};

function FieldError({ message }: { message?: string }) {
    if (!message) {
        return null;
    }

    return <p className="mt-1 text-xs text-red-600">{message}</p>;
}

// ========================================
// GOOGLE COMPLETE PAGE
// ========================================

export default function GoogleComplete({ googleName, googleEmail }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        role: 'worker' as Role,
        phone: '',

        // Profil Worker
        worker_identity_type: 'ktp',
        worker_date_of_birth: '',
        worker_address: '',
        worker_skills: '',

        // Profil UMKM
        business_name: '',
        business_document_type: 'nib',
        business_category: '',
        business_address: '',
    });

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        post('/auth/google/complete', {
            preserveScroll: true,
        });
    }

    return (
        <>
            <Head title="Lengkapi Pendaftaran Google" />

            <div className="mx-auto w-full max-w-2xl min-w-0">
                {/* INFORMASI GOOGLE */}
                <div className="mb-4 flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-lg font-bold shadow-sm">
                        <span className="text-blue-600">G</span>
                    </div>

                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-slate-500">
                            Terhubung dengan Google
                        </p>

                        <p className="truncate text-sm font-semibold text-slate-900">
                            {googleName}
                        </p>

                        <p className="text-xs break-all text-slate-600">
                            {googleEmail}
                        </p>
                    </div>

                    <span className="shrink-0 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                        Terhubung
                    </span>
                </div>

                {/* FORM PENDAFTARAN */}
                <form onSubmit={submit} className="space-y-4">
                    {/* INFORMASI DASAR */}
                    <div className="grid gap-3" style={fieldGrid}>
                        {/* PILIH ROLE */}
                        <div className="min-w-0">
                            <label htmlFor="role" className={labelClass}>
                                Daftar Sebagai
                            </label>

                            <select
                                id="role"
                                name="role"
                                value={data.role}
                                onChange={(event) =>
                                    setData('role', event.target.value as Role)
                                }
                                className={inputClass}
                            >
                                <option value="worker">Pencari Kerja</option>

                                <option value="employer">Pemilik UMKM</option>
                            </select>

                            <FieldError message={errors.role} />
                        </div>

                        {/* NOMOR TELEPON */}
                        <div className="min-w-0">
                            <label htmlFor="phone" className={labelClass}>
                                Nomor Telepon
                            </label>

                            <input
                                id="phone"
                                name="phone"
                                type="tel"
                                autoComplete="tel"
                                required
                                maxLength={20}
                                value={data.phone}
                                onChange={(event) =>
                                    setData('phone', event.target.value)
                                }
                                placeholder="08xxxxxxxxxx"
                                className={inputClass}
                            />

                            <FieldError message={errors.phone} />
                        </div>
                    </div>

                    {/* ===================================
                        PROFIL PENCARI KERJA
                    =================================== */}

                    {data.role === 'worker' && (
                        <section className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
                            <div className="mb-3">
                                <h2 className="text-base font-semibold text-slate-900">
                                    Profil Pencari Kerja
                                </h2>

                                <p className="text-xs text-slate-500">
                                    Lengkapi identitas dan informasi keahlian.
                                </p>
                            </div>

                            <div className="space-y-3">
                                {/* BARIS PERTAMA */}
                                <div className="grid gap-3" style={fieldGrid}>
                                    <div className="min-w-0">
                                        <label
                                            htmlFor="identity"
                                            className={labelClass}
                                        >
                                            Jenis Identitas
                                        </label>

                                        <select
                                            id="identity"
                                            name="worker_identity_type"
                                            value={data.worker_identity_type}
                                            onChange={(event) =>
                                                setData(
                                                    'worker_identity_type',
                                                    event.target.value,
                                                )
                                            }
                                            className={inputClass}
                                        >
                                            <option value="ktp">KTP</option>
                                        </select>

                                        <FieldError
                                            message={
                                                errors.worker_identity_type
                                            }
                                        />
                                    </div>

                                    <div className="min-w-0">
                                        <label
                                            htmlFor="birth"
                                            className={labelClass}
                                        >
                                            Tanggal Lahir
                                        </label>

                                        <input
                                            id="birth"
                                            name="worker_date_of_birth"
                                            type="date"
                                            required
                                            value={data.worker_date_of_birth}
                                            onChange={(event) =>
                                                setData(
                                                    'worker_date_of_birth',
                                                    event.target.value,
                                                )
                                            }
                                            className={inputClass}
                                        />

                                        <FieldError
                                            message={
                                                errors.worker_date_of_birth
                                            }
                                        />
                                    </div>
                                </div>

                                {/* BARIS KEDUA */}
                                <div className="grid gap-3" style={fieldGrid}>
                                    <div className="min-w-0">
                                        <label
                                            htmlFor="worker-address"
                                            className={labelClass}
                                        >
                                            Alamat Lengkap
                                        </label>

                                        <textarea
                                            id="worker-address"
                                            name="worker_address"
                                            required
                                            rows={2}
                                            value={data.worker_address}
                                            onChange={(event) =>
                                                setData(
                                                    'worker_address',
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="Alamat tempat tinggal"
                                            className={inputClass}
                                        />

                                        <FieldError
                                            message={errors.worker_address}
                                        />
                                    </div>

                                    <div className="min-w-0">
                                        <label
                                            htmlFor="skills"
                                            className={labelClass}
                                        >
                                            Keahlian
                                        </label>

                                        <textarea
                                            id="skills"
                                            name="worker_skills"
                                            rows={2}
                                            value={data.worker_skills}
                                            onChange={(event) =>
                                                setData(
                                                    'worker_skills',
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="Administrasi, Desain, Pengemasan"
                                            className={inputClass}
                                        />

                                        <FieldError
                                            message={errors.worker_skills}
                                        />

                                        <p className="mt-1 text-xs text-slate-500">
                                            Pisahkan dengan koma.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* ===================================
                        PROFIL PEMILIK UMKM
                    =================================== */}

                    {data.role === 'employer' && (
                        <section className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
                            <div className="mb-3">
                                <h2 className="text-base font-semibold text-slate-900">
                                    Profil Pemilik UMKM
                                </h2>

                                <p className="text-xs text-slate-500">
                                    Lengkapi informasi usaha yang dikelola.
                                </p>
                            </div>

                            <div className="space-y-3">
                                {/* BARIS PERTAMA */}
                                <div className="grid gap-3" style={fieldGrid}>
                                    <div className="min-w-0">
                                        <label
                                            htmlFor="business-name"
                                            className={labelClass}
                                        >
                                            Nama Usaha
                                        </label>

                                        <input
                                            id="business-name"
                                            name="business_name"
                                            type="text"
                                            required
                                            value={data.business_name}
                                            onChange={(event) =>
                                                setData(
                                                    'business_name',
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="Nama UMKM"
                                            className={inputClass}
                                        />

                                        <FieldError
                                            message={errors.business_name}
                                        />
                                    </div>

                                    <div className="min-w-0">
                                        <label
                                            htmlFor="category"
                                            className={labelClass}
                                        >
                                            Kategori Usaha
                                        </label>

                                        <input
                                            id="category"
                                            name="business_category"
                                            type="text"
                                            required
                                            value={data.business_category}
                                            onChange={(event) =>
                                                setData(
                                                    'business_category',
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="Contoh: Kuliner"
                                            className={inputClass}
                                        />

                                        <FieldError
                                            message={errors.business_category}
                                        />
                                    </div>
                                </div>

                                {/* BARIS KEDUA */}
                                <div className="grid gap-3" style={fieldGrid}>
                                    <div className="min-w-0">
                                        <label
                                            htmlFor="document-type"
                                            className={labelClass}
                                        >
                                            Jenis Dokumen Usaha
                                        </label>

                                        <select
                                            id="document-type"
                                            name="business_document_type"
                                            value={data.business_document_type}
                                            onChange={(event) =>
                                                setData(
                                                    'business_document_type',
                                                    event.target.value,
                                                )
                                            }
                                            className={inputClass}
                                        >
                                            <option value="nib">NIB</option>
                                        </select>

                                        <FieldError
                                            message={
                                                errors.business_document_type
                                            }
                                        />
                                    </div>

                                    <div className="min-w-0">
                                        <label
                                            htmlFor="business-address"
                                            className={labelClass}
                                        >
                                            Alamat Usaha
                                        </label>

                                        <textarea
                                            id="business-address"
                                            name="business_address"
                                            required
                                            rows={2}
                                            value={data.business_address}
                                            onChange={(event) =>
                                                setData(
                                                    'business_address',
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="Alamat lokasi usaha"
                                            className={inputClass}
                                        />

                                        <FieldError
                                            message={errors.business_address}
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* ERROR VALIDASI */}
                    {Object.keys(errors).length > 0 && (
                        <div
                            role="alert"
                            className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                        >
                            <p className="font-medium">
                                Periksa kembali data pendaftaran.
                            </p>
                        </div>
                    )}

                    {/* TOMBOL PENDAFTARAN */}
                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full rounded-lg bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {processing
                            ? 'Memproses Pendaftaran...'
                            : 'Selesaikan Pendaftaran'}
                    </button>

                    <p className="text-center text-xs text-slate-500">
                        Pastikan seluruh informasi yang diisi benar.
                    </p>
                </form>
            </div>
        </>
    );
}

// ========================================
// LAYOUT AUTHENTICATION KARSA NURSA
// ========================================

GoogleComplete.layout = {
    title: 'Lengkapi Pendaftaran Google',
    description:
        'Pilih peran dan lengkapi profil untuk melanjutkan ke KarsaNursa.',
};
