import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PasswordInput from '@/components/password-input';
import { Spinner } from '@/components/ui/spinner';
import { login } from '@/routes';
import { store } from '@/routes/register';
import { Form, Head } from '@inertiajs/react';
import { BriefcaseBusiness, FileUp, ShieldCheck, Users } from 'lucide-react';
import { useState } from 'react';

type Props = {
    passwordRules: string;
};

type RegistrationRole = 'worker' | 'employer';

export default function Register({ passwordRules }: Props) {
    const [role, setRole] = useState<RegistrationRole>('worker');

    const [selectedFileName, setSelectedFileName] = useState('');

    const isWorker = role === 'worker';

    return (
        <>
            <Head title="Daftar" />

            <Form
                {...store.form()}
                resetOnSuccess={['password', 'password_confirmation']}
                disableWhileProcessing
                className="flex flex-col gap-5"
            >
                {({ processing, errors }) => (
                    <>
                        <input type="hidden" name="role" value={role} />

                        <div className="grid grid-cols-2 gap-1 rounded-[11px] bg-[var(--karsa-background)] p-1">
                            <button
                                type="button"
                                onClick={() => {
                                    setRole('worker');
                                    setSelectedFileName('');
                                }}
                                className={
                                    isWorker
                                        ? 'flex min-h-11 items-center justify-center gap-2 rounded-[9px] bg-white px-3 text-[9px] font-bold text-[var(--karsa-primary)] shadow-sm'
                                        : 'flex min-h-11 items-center justify-center gap-2 rounded-[9px] px-3 text-[9px] font-bold text-[var(--karsa-muted)] transition-colors hover:text-[var(--karsa-primary)]'
                                }
                                aria-pressed={isWorker}
                            >
                                <Users size={16} />
                                Pekerja Harian
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setRole('employer');
                                    setSelectedFileName('');
                                }}
                                className={
                                    !isWorker
                                        ? 'flex min-h-11 items-center justify-center gap-2 rounded-[9px] bg-white px-3 text-[9px] font-bold text-[var(--karsa-primary)] shadow-sm'
                                        : 'flex min-h-11 items-center justify-center gap-2 rounded-[9px] px-3 text-[9px] font-bold text-[var(--karsa-muted)] transition-colors hover:text-[var(--karsa-primary)]'
                                }
                                aria-pressed={!isWorker}
                            >
                                <BriefcaseBusiness size={16} />
                                Pelaku UMKM
                            </button>
                        </div>

                        <InputError message={errors.role} />

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="name">
                                    {isWorker ? 'Nama lengkap' : 'Nama pemilik'}
                                </Label>
                                <Input
                                    id="name"
                                    type="text"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="name"
                                    name="name"
                                    placeholder={
                                        isWorker
                                            ? 'Nama sesuai identitas'
                                            : 'Nama pemilik usaha'
                                    }
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="phone">Nomor telepon</Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    required
                                    tabIndex={2}
                                    autoComplete="tel"
                                    name="phone"
                                    placeholder="08xxxxxxxxxx"
                                />
                                <InputError message={errors.phone} />
                            </div>
                        </div>

                        {!isWorker && (
                            <div className="grid gap-2">
                                <Label htmlFor="business_name">
                                    Nama usaha
                                </Label>
                                <Input
                                    id="business_name"
                                    type="text"
                                    required
                                    tabIndex={3}
                                    name="business_name"
                                    placeholder="Contoh: Dapur Bu Sari"
                                />
                                <InputError message={errors.business_name} />
                            </div>
                        )}

                        <div className="grid gap-2">
                            <Label htmlFor="email">Alamat email</Label>
                            <Input
                                id="email"
                                type="email"
                                required
                                tabIndex={4}
                                autoComplete="email"
                                name="email"
                                placeholder="nama@email.com"
                            />
                            <InputError message={errors.email} />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="password">Kata sandi</Label>
                                <PasswordInput
                                    id="password"
                                    required
                                    tabIndex={5}
                                    autoComplete="new-password"
                                    name="password"
                                    placeholder="Minimal 8 karakter"
                                    passwordrules={passwordRules}
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password_confirmation">
                                    Konfirmasi kata sandi
                                </Label>
                                <PasswordInput
                                    id="password_confirmation"
                                    required
                                    tabIndex={6}
                                    autoComplete="new-password"
                                    name="password_confirmation"
                                    placeholder="Ulangi kata sandi"
                                    passwordrules={passwordRules}
                                />
                                <InputError
                                    message={errors.password_confirmation}
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-[150px_1fr]">
                            <div className="grid gap-2">
                                <Label
                                    htmlFor={
                                        isWorker
                                            ? 'identity_type'
                                            : 'business_document_type'
                                    }
                                >
                                    Jenis dokumen
                                </Label>

                                {isWorker ? (
                                    <select
                                        id="identity_type"
                                        name="identity_type"
                                        defaultValue="ktp"
                                        className="h-10 rounded-[9px] border border-[var(--karsa-border)] bg-white px-3 text-[9px] text-[var(--karsa-slate)] outline-none focus:border-[var(--karsa-sky)]"
                                    >
                                        <option value="ktp">KTP</option>
                                        <option value="ktm">KTM</option>
                                    </select>
                                ) : (
                                    <select
                                        id="business_document_type"
                                        name="business_document_type"
                                        defaultValue="nib"
                                        className="h-10 rounded-[9px] border border-[var(--karsa-border)] bg-white px-3 text-[9px] text-[var(--karsa-slate)] outline-none focus:border-[var(--karsa-sky)]"
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

                            <div className="grid gap-2">
                                <Label htmlFor="verification_document">
                                    Unggah dokumen verifikasi
                                </Label>

                                <label
                                    htmlFor="verification_document"
                                    className="flex min-h-10 cursor-pointer items-center gap-3 rounded-[9px] border border-dashed border-[var(--karsa-border)] bg-[var(--karsa-background)] px-3 py-2 transition-colors hover:border-[var(--karsa-sky)] hover:bg-[var(--karsa-sky-pale)]"
                                >
                                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[7px] bg-white text-[var(--karsa-primary)]">
                                        <FileUp size={15} />
                                    </span>

                                    <span className="min-w-0">
                                        <strong className="block truncate text-[8px] text-[var(--karsa-slate)]">
                                            {selectedFileName ||
                                                (isWorker
                                                    ? 'Pilih KTP atau KTM'
                                                    : 'Pilih NIB atau surat usaha')}
                                        </strong>
                                        <small className="mt-0.5 block text-[7px] text-[var(--karsa-subtle)]">
                                            PDF, JPG atau PNG · Maks. 5 MB
                                        </small>
                                    </span>
                                </label>

                                <input
                                    id="verification_document"
                                    name="verification_document"
                                    type="file"
                                    required
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    className="sr-only"
                                    onChange={(event) =>
                                        setSelectedFileName(
                                            event.target.files?.[0]?.name ?? '',
                                        )
                                    }
                                />

                                <InputError
                                    message={errors.verification_document}
                                />
                            </div>
                        </div>

                        <div className="flex items-start gap-2 rounded-[9px] bg-[var(--karsa-sky-pale)] p-3 text-[7px] leading-[1.6] text-[var(--karsa-muted)]">
                            <ShieldCheck
                                size={15}
                                className="mt-0.5 shrink-0 text-[var(--karsa-primary)]"
                            />
                            Dokumen disimpan secara private dan hanya dapat
                            diakses administrator untuk proses verifikasi.
                        </div>

                        <Button
                            type="submit"
                            className="karsa-auth-submit w-full"
                            tabIndex={7}
                            disabled={processing}
                            data-test="register-user-button"
                        >
                            {processing && <Spinner />}
                            {processing
                                ? 'Membuat akun...'
                                : 'Daftar dan Lanjutkan'}
                        </Button>

                        <div className="text-center text-[9px] text-[var(--karsa-muted)]">
                            Sudah memiliki akun?{' '}
                            <TextLink href={login()} tabIndex={8}>
                                Masuk di sini
                            </TextLink>
                        </div>
                    </>
                )}
            </Form>
        </>
    );
}

Register.layout = {
    title: 'Buat akun KarsaNusa',
    description: 'Pilih peran dan lengkapi data verifikasi untuk memulai.',
};
