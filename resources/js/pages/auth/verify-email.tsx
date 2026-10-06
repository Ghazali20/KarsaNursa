import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { logout } from '@/routes';
import { send } from '@/routes/verification';
import { Form, Head } from '@inertiajs/react';
import { Check, MailCheck, ShieldCheck } from 'lucide-react';

export default function VerifyEmail({ status }: { status?: string }) {
    const linkSent = status === 'verification-link-sent';

    return (
        <>
            <Head title="Verifikasi Email" />

            <div className="mb-6 flex flex-col items-center text-center">
                <span className="grid h-14 w-14 place-items-center rounded-[15px] bg-[var(--karsa-sky-pale)] text-[var(--karsa-primary)]">
                    <MailCheck size={27} />
                </span>

                <p className="mt-4 max-w-[360px] text-[9px] leading-[1.7] text-[var(--karsa-muted)]">
                    Periksa kotak masuk dan folder spam pada email yang
                    digunakan saat mendaftar.
                </p>
            </div>

            {linkSent && (
                <div className="mb-5 flex items-start gap-2 rounded-[9px] bg-[#ecfdf5] p-3 text-left text-[8px] leading-[1.6] text-[#047857]">
                    <Check size={15} className="mt-0.5 shrink-0" />
                    Link verifikasi baru telah dikirim ke alamat email Anda.
                </div>
            )}

            <Form {...send.form()} className="space-y-5 text-center">
                {({ processing }) => (
                    <>
                        <Button
                            type="submit"
                            disabled={processing}
                            className="karsa-auth-submit w-full"
                        >
                            {processing && <Spinner />}
                            {processing
                                ? 'Mengirim ulang...'
                                : 'Kirim Ulang Email Verifikasi'}
                        </Button>

                        <TextLink
                            href={logout()}
                            className="mx-auto block w-fit text-[9px]"
                        >
                            Keluar dari akun
                        </TextLink>
                    </>
                )}
            </Form>

            <div className="mt-6 flex items-start gap-2 rounded-[9px] bg-[var(--karsa-background)] p-3 text-[7px] leading-[1.6] text-[var(--karsa-subtle)]">
                <ShieldCheck
                    size={14}
                    className="mt-0.5 shrink-0 text-[var(--karsa-primary)]"
                />
                Verifikasi email membantu melindungi akun dan mencegah
                penggunaan alamat email tanpa izin.
            </div>
        </>
    );
}

VerifyEmail.layout = {
    title: 'Verifikasi alamat email',
    description:
        'Klik link yang telah kami kirimkan untuk mengaktifkan akun Anda.',
};
