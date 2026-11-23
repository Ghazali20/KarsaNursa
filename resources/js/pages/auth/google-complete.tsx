import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';

// ========================================
// TIPE DATA
// ========================================

type Props = {
    googleName: string;
    googleEmail: string;
};

type Role = 'worker' | 'employer';

type UploadField = 'worker_identity_document' | 'business_document';

// ========================================
// KONFIGURASI UPLOAD
// ========================================

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

const FILE_ERROR =
    'Format file harus PDF, JPG, atau PNG dengan ukuran maksimal 5 MB.';

// ========================================
// CSS RESPONSIVE
// ========================================

const inputClass = (hasError?: boolean) =>
    `mt-1.5 w-full min-w-0 rounded-lg border ${
        hasError
            ? 'border-red-300 bg-red-50/30 text-slate-900 focus:border-red-500 focus:ring-red-100'
            : 'border-slate-300 bg-white text-slate-900 focus:border-blue-500 focus:ring-blue-100'
    } px-3 py-2.5 text-sm outline-none transition focus:ring-2`;

const labelClass = 'block text-sm font-medium text-slate-700';

const uploadClass = (hasError?: boolean) =>
    `mt-1.5 block w-full min-w-0 cursor-pointer overflow-hidden rounded-lg border ${
        hasError ? 'border-red-300 bg-red-50/20' : 'border-slate-300 bg-white'
    } text-xs text-slate-600 file:mr-3 file:cursor-pointer file:border-0 file:border-r file:border-slate-200 file:bg-slate-50 file:px-3 file:py-3 file:text-xs file:font-semibold file:text-blue-700 hover:file:bg-blue-50 focus:outline-none`;

// ========================================
// KOMPONEN PESAN ERROR
// ========================================

function FieldError({ message }: { message?: string }) {
    if (!message) {
        return null;
    }

    return <p className="mt-1 text-xs text-red-600">{message}</p>;
}

// ========================================
// KOMPONEN UPLOAD DOKUMEN
// ========================================

function DocumentUpload({
    id,
    file,
    error,
    onChange,
}: {
    id: string;
    file: File | null;
    error?: string;
    onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
    return (
        <div className="min-w-0">
            <label htmlFor={id} className={labelClass}>
                Upload Dokumen
                <span className="ml-1 text-red-600">*</span>
            </label>

            <input
                id={id}
                name={id}
                type="file"
                required={!file}
                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                onChange={onChange}
                className={uploadClass(Boolean(error))}
            />

            <p className="mt-1 text-xs text-slate-500">
                PDF, JPG, atau PNG. Maksimal 5 MB.
            </p>

            {file && (
                <p className="mt-1 text-xs font-medium break-all text-green-700">
                    File dipilih: {file.name}
                </p>
            )}

            <FieldError message={error} />
        </div>
    );
}

// ========================================
// HALAMAN GOOGLE COMPLETE
// ========================================

export default function GoogleComplete({ googleName, googleEmail }: Props) {
    const { data, setData, post, processing, errors, clearErrors } = useForm({
        role: 'worker' as Role,
        phone: '',

        // Data Pencari Kerja
        worker_identity_type: 'ktp',
        worker_identity_document: null as File | null,
        worker_address: '',

        // Data Pemilik UMKM
        business_name: '',
        business_document_type: 'nib',
        business_document: null as File | null,
        business_category: '',
        business_address: '',
    });

    // Error file dari validasi browser
    const [workerFileError, setWorkerFileError] = useState('');
    const [businessFileError, setBusinessFileError] = useState('');

    const errMap = errors as Record<string, string | undefined>;

    const roleError = errMap.role;
    const phoneError = errMap.phone;

    // Worker errors
    const workerIdentityTypeError =
        errMap.worker_identity_type || errMap.identity_type;
    const workerIdentityDocumentError =
        workerFileError ||
        errMap.worker_identity_document ||
        errMap.document ||
        errMap.verification_document;
    const workerAddressError = errMap.worker_address || errMap.address;

    // Employer errors
    const businessNameError = errMap.business_name;
    const businessCategoryError = errMap.business_category;
    const businessDocumentTypeError =
        errMap.business_document_type ||
        errMap.document_type ||
        errMap.identity_type;
    const businessDocumentError =
        businessFileError ||
        errMap.business_document ||
        errMap.document ||
        errMap.verification_document;
    const businessAddressError = errMap.business_address || errMap.address;

    // Kumpulan field yang sedang aktif di layar formulir
    const activeFieldKeys = new Set(
        data.role === 'worker'
            ? [
                  'phone',
                  'role',
                  'worker_identity_type',
                  'identity_type',
                  'worker_identity_document',
                  'document',
                  'verification_document',
                  'worker_address',
                  'address',
              ]
            : [
                  'phone',
                  'role',
                  'business_name',
                  'business_category',
                  'business_document_type',
                  'document_type',
                  'identity_type',
                  'business_document',
                  'document',
                  'verification_document',
                  'business_address',
                  'address',
              ],
    );

    // Error yang tidak terikat pada input formulir yang aktif di layar (misal sesi Google berakhir atau error umum)
    const unboundErrors = Object.entries(errors).filter(
        ([key]) => !activeFieldKeys.has(key),
    );

    // ========================================
    // PILIH ROLE
    // ========================================

    function changeRole(role: Role) {
        setData('role', role);

        clearErrors();
        setWorkerFileError('');
        setBusinessFileError('');
    }

    // ========================================
    // VALIDASI UPLOAD FILE
    // ========================================

    function handleFileChange(
        event: ChangeEvent<HTMLInputElement>,
        field: UploadField,
    ) {
        const file = event.currentTarget.files?.[0] ?? null;

        const setFileError =
            field === 'worker_identity_document'
                ? setWorkerFileError
                : setBusinessFileError;

        if (!file) {
            setData(field, null);
            setFileError('');
            return;
        }

        // Periksa ekstensi dan tipe file
        const extensionValid = /\.(pdf|jpe?g|png)$/i.test(file.name);

        const mimeValid =
            file.type === '' || ALLOWED_MIME_TYPES.includes(file.type);

        if (!extensionValid || !mimeValid) {
            setData(field, null);
            setFileError(FILE_ERROR);
            event.currentTarget.value = '';
            return;
        }

        // Maksimal 5 MB
        if (file.size > MAX_FILE_SIZE) {
            setData(field, null);
            setFileError('Ukuran dokumen tidak boleh melebihi 5 MB.');
            event.currentTarget.value = '';
            return;
        }

        // File valid
        setData(field, file);
        setFileError('');
        clearErrors(field);
    }

    // ========================================
    // SUBMIT PENDAFTARAN
    // ========================================

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (data.role === 'worker' && !data.worker_identity_document) {
            setWorkerFileError('Dokumen KTP atau KTM wajib diunggah.');
            return;
        }

        if (data.role === 'employer' && !data.business_document) {
            setBusinessFileError(
                'Dokumen NIB atau Surat Usaha wajib diunggah.',
            );
            return;
        }

        post('/auth/google/complete', {
            forceFormData: true,
            preserveScroll: true,
        });
    }

    // ========================================
    // TAMPILAN
    // ========================================

    return (
        <>
            <Head title="Lengkapi Pendaftaran Google" />

            <div className="mx-auto w-full max-w-2xl min-w-0">
                {/* INFORMASI AKUN GOOGLE */}

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

                <form
                    onSubmit={submit}
                    encType="multipart/form-data"
                    className="space-y-4"
                >
                    {/* INFORMASI DASAR */}

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                                    changeRole(event.target.value as Role)
                                }
                                className={inputClass(Boolean(roleError))}
                            >
                                <option value="worker">Pencari Kerja</option>

                                <option value="employer">Pemilik UMKM</option>
                            </select>

                            <FieldError message={roleError} />
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
                                onChange={(event) => {
                                    setData('phone', event.target.value);
                                    if (errors.phone) clearErrors('phone');
                                }}
                                placeholder="08xxxxxxxxxx"
                                className={inputClass(Boolean(phoneError))}
                            />

                            <FieldError message={phoneError} />
                        </div>
                    </div>

                    {/* =====================================
                        PROFIL PENCARI KERJA
                    ===================================== */}

                    {data.role === 'worker' && (
                        <section className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
                            <div className="mb-3">
                                <h2 className="text-base font-semibold text-slate-900">
                                    Profil Pencari Kerja
                                </h2>

                                <p className="text-xs text-slate-500">
                                    Lengkapi identitas dan unggah dokumen.
                                </p>
                            </div>

                            <div className="space-y-3">
                                {/* JENIS IDENTITAS + UPLOAD */}

                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div className="min-w-0">
                                        <label
                                            htmlFor="worker-identity"
                                            className={labelClass}
                                        >
                                            Jenis Identitas
                                        </label>

                                        <select
                                            id="worker-identity"
                                            name="worker_identity_type"
                                            value={data.worker_identity_type}
                                            onChange={(event) => {
                                                setData(
                                                    'worker_identity_type',
                                                    event.target.value,
                                                );
                                                if (
                                                    errors.worker_identity_type
                                                ) {
                                                    clearErrors(
                                                        'worker_identity_type',
                                                    );
                                                }
                                            }}
                                            className={inputClass(
                                                Boolean(
                                                    workerIdentityTypeError,
                                                ),
                                            )}
                                        >
                                            <option value="ktp">KTP</option>

                                            <option value="ktm">KTM</option>
                                        </select>

                                        <FieldError
                                            message={workerIdentityTypeError}
                                        />
                                    </div>

                                    <DocumentUpload
                                        id="worker_identity_document"
                                        file={data.worker_identity_document}
                                        error={workerIdentityDocumentError}
                                        onChange={(event) =>
                                            handleFileChange(
                                                event,
                                                'worker_identity_document',
                                            )
                                        }
                                    />
                                </div>

                                {/* ALAMAT LENGKAP */}

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
                                        onChange={(event) => {
                                            setData(
                                                'worker_address',
                                                event.target.value,
                                            );
                                            if (errors.worker_address) {
                                                clearErrors('worker_address');
                                            }
                                        }}
                                        placeholder="Alamat tempat tinggal"
                                        className={inputClass(
                                            Boolean(workerAddressError),
                                        )}
                                    />

                                    <FieldError message={workerAddressError} />
                                </div>
                            </div>
                        </section>
                    )}

                    {/* =====================================
                        PROFIL PEMILIK UMKM
                    ===================================== */}

                    {data.role === 'employer' && (
                        <section className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
                            <div className="mb-3">
                                <h2 className="text-base font-semibold text-slate-900">
                                    Profil Pemilik UMKM
                                </h2>

                                <p className="text-xs text-slate-500">
                                    Lengkapi informasi usaha dan unggah dokumen.
                                </p>
                            </div>

                            <div className="space-y-3">
                                {/* NAMA + KATEGORI USAHA */}

                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                                            onChange={(event) => {
                                                setData(
                                                    'business_name',
                                                    event.target.value,
                                                );
                                                if (errors.business_name) {
                                                    clearErrors(
                                                        'business_name',
                                                    );
                                                }
                                            }}
                                            placeholder="Nama UMKM"
                                            className={inputClass(
                                                Boolean(businessNameError),
                                            )}
                                        />

                                        <FieldError
                                            message={businessNameError}
                                        />
                                    </div>

                                    <div className="min-w-0">
                                        <label
                                            htmlFor="business-category"
                                            className={labelClass}
                                        >
                                            Kategori Usaha
                                        </label>

                                        <input
                                            id="business-category"
                                            name="business_category"
                                            type="text"
                                            required
                                            value={data.business_category}
                                            onChange={(event) => {
                                                setData(
                                                    'business_category',
                                                    event.target.value,
                                                );
                                                if (errors.business_category) {
                                                    clearErrors(
                                                        'business_category',
                                                    );
                                                }
                                            }}
                                            placeholder="Contoh: Kuliner"
                                            className={inputClass(
                                                Boolean(businessCategoryError),
                                            )}
                                        />

                                        <FieldError
                                            message={businessCategoryError}
                                        />
                                    </div>
                                </div>

                                {/* JENIS DOKUMEN + UPLOAD */}

                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div className="min-w-0">
                                        <label
                                            htmlFor="business-document-type"
                                            className={labelClass}
                                        >
                                            Jenis Dokumen Usaha
                                        </label>

                                        <select
                                            id="business-document-type"
                                            name="business_document_type"
                                            value={data.business_document_type}
                                            onChange={(event) => {
                                                setData(
                                                    'business_document_type',
                                                    event.target.value,
                                                );
                                                if (
                                                    errors.business_document_type
                                                ) {
                                                    clearErrors(
                                                        'business_document_type',
                                                    );
                                                }
                                            }}
                                            className={inputClass(
                                                Boolean(
                                                    businessDocumentTypeError,
                                                ),
                                            )}
                                        >
                                            <option value="nib">NIB</option>

                                            <option value="surat_usaha">
                                                Surat Usaha
                                            </option>
                                        </select>

                                        <FieldError
                                            message={businessDocumentTypeError}
                                        />
                                    </div>

                                    <DocumentUpload
                                        id="business_document"
                                        file={data.business_document}
                                        error={businessDocumentError}
                                        onChange={(event) =>
                                            handleFileChange(
                                                event,
                                                'business_document',
                                            )
                                        }
                                    />
                                </div>

                                {/* ALAMAT USAHA */}

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
                                        onChange={(event) => {
                                            setData(
                                                'business_address',
                                                event.target.value,
                                            );
                                            if (errors.business_address) {
                                                clearErrors('business_address');
                                            }
                                        }}
                                        placeholder="Alamat lokasi usaha"
                                        className={inputClass(
                                            Boolean(businessAddressError),
                                        )}
                                    />

                                    <FieldError
                                        message={businessAddressError}
                                    />
                                </div>
                            </div>
                        </section>
                    )}

                    {/* ERROR VALIDASI */}

                    {Object.keys(errors).length > 0 && (
                        <div
                            role="alert"
                            className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                        >
                            <div className="flex items-start gap-2.5">
                                <svg
                                    className="mt-0.5 h-5 w-5 shrink-0 text-red-500"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                                <div className="flex-1 space-y-1.5">
                                    <p className="font-semibold text-red-800">
                                        {unboundErrors.length > 0
                                            ? 'Pendaftaran belum dapat diproses:'
                                            : 'Periksa kembali data pendaftaran:'}
                                    </p>

                                    {unboundErrors.length > 0 && (
                                        <ul className="list-disc space-y-1 pl-4 text-xs text-red-700">
                                            {unboundErrors.map(([key, msg]) => (
                                                <li
                                                    key={key}
                                                    className="break-words"
                                                >
                                                    {msg}
                                                </li>
                                            ))}
                                        </ul>
                                    )}

                                    {Object.keys(errors).some((key) =>
                                        activeFieldKeys.has(key),
                                    ) && (
                                        <p className="text-xs text-red-600">
                                            {unboundErrors.length > 0
                                                ? 'Silakan periksa juga kolom input yang ditandai merah di bawah.'
                                                : 'Terdapat kesalahan pada isian formulir di bawah. Silakan periksa pesan error pada kolom yang bersangkutan.'}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TOMBOL DAFTAR */}

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
                        Pastikan informasi dan dokumen yang diunggah benar.
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
