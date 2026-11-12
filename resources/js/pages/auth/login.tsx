import { Form, Head, usePage } from '@inertiajs/react';

import GoogleLoginButton from '@/components/google-login-button';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
};

type PageProps = {
    errors?: {
        google?: string;
    };
};

export default function Login({ status, canResetPassword }: Props) {
    const { errors: pageErrors } = usePage<PageProps>().props;

    return (
        <>
            <Head title="Masuk" />

            {/* PESAN BERHASIL */}
            {status && (
                <div className="mb-4 text-center text-sm font-medium text-green-600">
                    {status}
                </div>
            )}

            {/* FORM LOGIN MANUAL */}
            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-6">
                            {/* ALAMAT EMAIL */}
                            <div className="grid gap-2">
                                <Label htmlFor="email">Alamat email</Label>

                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="email"
                                    placeholder="nama@email.com"
                                />

                                <InputError message={errors.email} />
                            </div>

                            {/* KATA SANDI */}
                            <div className="grid gap-2">
                                <div className="flex items-center">
                                    <Label htmlFor="password">Kata sandi</Label>

                                    {canResetPassword && (
                                        <TextLink
                                            href={request()}
                                            className="ml-auto text-sm"
                                            tabIndex={5}
                                        >
                                            Lupa kata sandi?
                                        </TextLink>
                                    )}
                                </div>

                                <PasswordInput
                                    id="password"
                                    name="password"
                                    required
                                    tabIndex={2}
                                    autoComplete="current-password"
                                    placeholder="Masukkan kata sandi"
                                />

                                <InputError message={errors.password} />
                            </div>

                            {/* INGAT SAYA */}
                            <div className="flex items-center space-x-3">
                                <Checkbox
                                    id="remember"
                                    name="remember"
                                    tabIndex={3}
                                />

                                <Label htmlFor="remember">
                                    Tetap masuk di perangkat ini
                                </Label>
                            </div>

                            {/* TOMBOL LOGIN MANUAL */}
                            <Button
                                type="submit"
                                className="karsa-auth-submit mt-4 w-full"
                                tabIndex={4}
                                disabled={processing}
                                data-test="login-button"
                            >
                                {processing && <Spinner />}
                                Masuk
                            </Button>
                        </div>

                        {/* LINK REGISTRASI */}
                        <div className="text-center text-sm text-muted-foreground">
                            Belum memiliki akun?{' '}
                            <TextLink href={register()} tabIndex={5}>
                                Daftar gratis
                            </TextLink>
                        </div>
                    </>
                )}
            </Form>

            {/* PEMISAH LOGIN MANUAL DAN GOOGLE */}
            <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />

                <span className="text-sm text-muted-foreground">atau</span>

                <div className="h-px flex-1 bg-border" />
            </div>

            {/* LOGIN MENGGUNAKAN GOOGLE */}
            <div className="space-y-3">
                <GoogleLoginButton />

                {/* PESAN ERROR DARI GOOGLE OAUTH */}
                {pageErrors?.google && (
                    <div
                        role="alert"
                        className="rounded-lg bg-red-50 p-3 text-center text-sm text-red-700"
                    >
                        {pageErrors.google}
                    </div>
                )}
            </div>
        </>
    );
}

Login.layout = {
    title: 'Selamat datang di KarsaNusa',
    description: 'Masuk menggunakan email dan kata sandi atau akun Google',
};
