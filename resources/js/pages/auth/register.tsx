import GoogleLoginButton from "@/components/google-login-button";
import InputError from "@/components/input-error";
import PasswordInput from "@/components/password-input";
import TextLink from "@/components/text-link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { login } from "@/routes";
import { store } from "@/routes/register";
import { Form, Head } from "@inertiajs/react";
import { BriefcaseBusiness, FileUp, ShieldCheck, Users } from "lucide-react";
import { useState } from "react";

type Props = {
    passwordRules: string;
};

type RegistrationRole = "worker" | "employer";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const inputGridClass = "grid grid-cols-1 gap-3 sm:grid-cols-2";

const fieldClass = "grid min-w-0 content-start gap-1.5";

const selectClass =
    "h-10 w-full min-w-0 rounded-lg border " +
    "border-[(--karsa-border)] bg-white px-3 " +
    "text-sm text-[(--karsa-slate)] outline-none " +
    "focus:border-[(--karsa-sky)]";

export default function Register({ passwordRules }: Props) {
    const [role, setRole] = useState<RegistrationRole>("worker");

    const [selectedFileName, setSelectedFileName] = useState("");

    const [fileError, setFileError] = useState("");

    const isWorker = role === "worker";

    function changeRole(nextRole: RegistrationRole) {
        setRole(nextRole);
        setSelectedFileName("");
        setFileError("");
    }

    function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.currentTarget.files?.[0];

        if (!file) {
            setSelectedFileName("");
            setFileError("");
            return;
        }

        const validExtension = /\.(pdf|jpg|jpeg|png)$/i.test(file.name);

        const validMimeType =
            file.type === "application/pdf" ||
            file.type === "image/jpeg" ||
            file.type === "image/png";

        if (!validExtension || !validMimeType) {
            event.currentTarget.value = "";
            setSelectedFileName("");
            setFileError("Dokumen harus berupa PDF, JPG, atau PNG.");
            return;
        }

        if (file.size > MAX_FILE_SIZE) {
            event.currentTarget.value = "";
            setSelectedFileName("");
            setFileError("Ukuran dokumen maksimal 5 MB.");
            return;
        }

        setSelectedFileName(file.name);
        setFileError("");
    }

    return (
        <>
            <Head title="Daftar" />

            <div className="w-full min-w-0 space-y-4">
                {/* =====================================
                    PENDAFTARAN DENGAN GOOGLE
                ===================================== */}

                <div className="space-y-2">
                    <GoogleLoginButton />

                    <p className="text-center text-xs text-[(--karsa-muted)]">
                        Gunakan akun Google untuk pendaftaran lebih cepat.
                    </p>
                </div>

                {/* PEMISAH */}

                <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-border" />

                    <span className="text-xs whitespace-nowrap text-muted-foreground">
                        atau daftar dengan email
                    </span>

                    <div className="h-px flex-1 bg-border" />
                </div>

                {/* =====================================
                    FORM PENDAFTARAN MANUAL
                ===================================== */}

                <Form
                    {...store.form()}
                    resetOnSuccess={["password", "password_confirmation"]}
                    disableWhileProcessing
                    className="flex flex-col gap-3.5"
                >
                    {({ processing, errors }) => (
                        <>
                            <input type="hidden" name="role" value={role} />

                            {/* PILIH ROLE */}

                            <div className="grid grid-cols-2 gap-1 rounded-xl bg-[(--karsa-background)] p-1">
                                <button
                                    type="button"
                                    onClick={() => changeRole("worker")}
                                    aria-pressed={isWorker}
                                    className={[
                                        "flex min-h-11 items-center",
                                        "justify-center gap-2 rounded-lg",
                                        "px-2 text-xs font-semibold",
                                        "transition-colors",
                                        isWorker
                                            ? "bg-white text-[(--karsa-primary)] shadow-sm"
                                            : "text-[(--karsa-muted)] hover:text-[(--karsa-primary)]",
                                    ].join(" ")}
                                >
                                    <Users size={17} className="shrink-0" />

                                    <span>Pencari Kerja</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => changeRole("employer")}
                                    aria-pressed={!isWorker}
                                    className={[
                                        "flex min-h-11 items-center",
                                        "justify-center gap-2 rounded-lg",
                                        "px-2 text-xs font-semibold",
                                        "transition-colors",
                                        !isWorker
                                            ? "bg-white text-[(--karsa-primary)] shadow-sm"
                                            : "text-[(--karsa-muted)] hover:text-[(--karsa-primary)]",
                                    ].join(" ")}
                                >
                                    <BriefcaseBusiness
                                        size={17}
                                        className="shrink-0"
                                    />

                                    <span>Pemilik UMKM</span>
                                </button>
                            </div>

                            <InputError message={errors.role} />

                            {/* =================================
                                DATA DASAR
                            ================================= */}

                            <div className={inputGridClass}>
                                {/* NAMA */}

                                <div className={fieldClass}>
                                    <Label htmlFor="name">
                                        {isWorker
                                            ? "Nama lengkap"
                                            : "Nama pemilik"}
                                    </Label>

                                    <Input
                                        id="name"
                                        name="name"
                                        type="text"
                                        required
                                        autoFocus
                                        tabIndex={1}
                                        autoComplete="name"
                                        placeholder={
                                            isWorker
                                                ? "Sesuai KTP atau KTM"
                                                : "Nama pemilik usaha"
                                        }
                                    />

                                    <InputError message={errors.name} />
                                </div>

                                {/* TELEPON */}

                                <div className={fieldClass}>
                                    <Label htmlFor="phone">Nomor telepon</Label>

                                    <Input
                                        id="phone"
                                        name="phone"
                                        type="tel"
                                        required
                                        tabIndex={2}
                                        autoComplete="tel"
                                        placeholder="08xxxxxxxxxx"
                                    />

                                    <InputError message={errors.phone} />
                                </div>
                            </div>

                            {/* NAMA USAHA KHUSUS UMKM */}

                            {!isWorker && (
                                <div className={fieldClass}>
                                    <Label htmlFor="business_name">
                                        Nama usaha
                                    </Label>

                                    <Input
                                        id="business_name"
                                        name="business_name"
                                        type="text"
                                        required
                                        tabIndex={3}
                                        placeholder="Contoh: Dapur Bu Sari"
                                    />

                                    <InputError
                                        message={errors.business_name}
                                    />
                                </div>
                            )}

                            {/* EMAIL */}

                            <div className={fieldClass}>
                                <Label htmlFor="email">Alamat email</Label>

                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    tabIndex={4}
                                    autoComplete="email"
                                    placeholder="nama@email.com"
                                />

                                <InputError message={errors.email} />
                            </div>

                            {/* =================================
                                PASSWORD
                            ================================= */}

                            <div className={inputGridClass}>
                                <div className={fieldClass}>
                                    <Label htmlFor="password">Kata sandi</Label>

                                    <PasswordInput
                                        id="password"
                                        name="password"
                                        required
                                        tabIndex={5}
                                        autoComplete="new-password"
                                        placeholder="Minimal 8 karakter"
                                        passwordrules={passwordRules}
                                    />

                                    <InputError message={errors.password} />
                                </div>

                                <div className={fieldClass}>
                                    <Label htmlFor="password_confirmation">
                                        Konfirmasi kata sandi
                                    </Label>

                                    <PasswordInput
                                        id="password_confirmation"
                                        name="password_confirmation"
                                        required
                                        tabIndex={6}
                                        autoComplete="new-password"
                                        placeholder="Ulangi kata sandi"
                                        passwordrules={passwordRules}
                                    />

                                    <InputError
                                        message={errors.password_confirmation}
                                    />
                                </div>
                            </div>

                            {/* =================================
                                DOKUMEN VERIFIKASI
                            ================================= */}

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,0.85fr)_minmax(0,1.5fr)]">
                                {/* JENIS DOKUMEN */}

                                <div className={fieldClass}>
                                    <Label
                                        htmlFor={
                                            isWorker
                                                ? "identity_type"
                                                : "business_document_type"
                                        }
                                    >
                                        Jenis dokumen
                                    </Label>

                                    {isWorker ? (
                                        <select
                                            id="identity_type"
                                            name="identity_type"
                                            defaultValue="ktp"
                                            className={selectClass}
                                        >
                                            <option value="ktp">KTP</option>

                                            <option value="ktm">KTM</option>
                                        </select>
                                    ) : (
                                        <select
                                            id="business_document_type"
                                            name="business_document_type"
                                            defaultValue="nib"
                                            className={selectClass}
                                        >
                                            <option value="nib">NIB</option>

                                            <option value="surat_usaha">
                                                Surat Usaha
                                            </option>
                                        </select>
                                    )}

                                    <InputError
                                        message={
                                            isWorker
                                                ? errors.identity_type
                                                : errors.business_document_type
                                        }
                                    />
                                </div>

                                {/* UPLOAD DOKUMEN */}

                                <div className={fieldClass}>
                                    <Label htmlFor="verification_document">
                                        Unggah dokumen
                                    </Label>

                                    <label
                                        htmlFor="verification_document"
                                        className="flex min-h-11 min-w-0 cursor-pointer items-center gap-3 rounded-lg border border-dashed border-[(--karsa-border)] bg-[(--karsa-background)] px-3 py-2 transition-colors hover:border-[(--karsa-sky)] hover:bg-[(--karsa-sky-pale)]"
                                    >
                                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-[(--karsa-primary)]">
                                            <FileUp size={17} />
                                        </span>

                                        <span className="min-w-0 flex-1">
                                            <strong className="block truncate text-xs font-medium text-[(--karsa-slate)]">
                                                {selectedFileName ||
                                                    (isWorker
                                                        ? "Pilih KTP atau KTM"
                                                        : "Pilih NIB atau Surat Usaha")}
                                            </strong>

                                            <small className="mt-0.5 block text-[10px] text-[(--karsa-subtle)]">
                                                PDF, JPG, PNG · Maks. 5 MB
                                            </small>
                                        </span>
                                    </label>

                                    <input
                                        key={role}
                                        id="verification_document"
                                        name="verification_document"
                                        type="file"
                                        required
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        className="sr-only"
                                        onChange={handleFileChange}
                                    />

                                    {fileError && (
                                        <p
                                            role="alert"
                                            className="text-xs text-red-600"
                                        >
                                            {fileError}
                                        </p>
                                    )}

                                    <InputError
                                        message={errors.verification_document}
                                    />
                                </div>
                            </div>

                            {/* =================================
                                INFORMASI KEAMANAN
                            ================================= */}

                            <div className="flex items-start gap-2 rounded-lg bg-[(--karsa-sky-pale)] px-3 py-2.5">
                                <ShieldCheck
                                    size={16}
                                    className="mt-0.5 shrink-0 text-[(--karsa-primary)]"
                                />

                                <p className="text-xs leading-relaxed text-[(--karsa-muted)]">
                                    Dokumen disimpan secara privat dan hanya
                                    dapat diakses petugas berwenang.
                                </p>
                            </div>

                            {/* =================================
                                TOMBOL DAFTAR
                            ================================= */}

                            <Button
                                type="submit"
                                className="karsa-auth-submit mt-1 w-full"
                                tabIndex={7}
                                disabled={processing}
                                data-test="register-user-button"
                            >
                                {processing && <Spinner />}

                                {processing
                                    ? "Membuat akun..."
                                    : "Daftar dan Lanjutkan"}
                            </Button>

                            {/* LINK LOGIN */}

                            <p className="text-center text-sm text-[(--karsa-muted)]">
                                Sudah memiliki akun?{" "}
                                <TextLink href={login()} tabIndex={8}>
                                    Masuk di sini
                                </TextLink>
                            </p>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}

// ========================================
// KONFIGURASI AUTH LAYOUT
// ========================================

Register.layout = {
    title: "Buat akun KarsaNusa",
    description: "Pilih peran dan lengkapi data pendaftaran untuk memulai.",
};
