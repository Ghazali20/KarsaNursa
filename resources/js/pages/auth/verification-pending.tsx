import { KarsaBadge } from '@/components/karsa/karsa-ui';
import { home, logout } from '@/routes';
import type { Auth } from '@/types/auth';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    Clock,
    FileCheck,
    Home,
    LogOut,
    ShieldAlert,
    ShieldCheck,
} from 'lucide-react';

export default function VerificationPending() {
    const { auth } = usePage<{ auth: Auth }>().props;
    const user = auth.user;
    const rejected = user.verification_status === 'rejected';

    return (
        <>
            <Head
                title={rejected ? 'Verifikasi Ditolak' : 'Menunggu Verifikasi'}
            />

            <div className="text-center">
                <span
                    className={
                        rejected
                            ? 'mx-auto grid h-16 w-16 place-items-center rounded-[18px] bg-[#fef2f2] text-[#b91c1c]'
                            : 'mx-auto grid h-16 w-16 place-items-center rounded-[18px] bg-[var(--karsa-sky-pale)] text-[var(--karsa-primary)]'
                    }
                >
                    {rejected ? <ShieldAlert size={30} /> : <Clock size={30} />}
                </span>

                <KarsaBadge
                    tone={rejected ? 'danger' : 'amber'}
                    className="mt-5"
                >
                    {rejected ? 'PERLU PERBAIKAN' : 'SEDANG DITINJAU'}
                </KarsaBadge>

                <h3 className="mt-4 text-[22px] font-extrabold tracking-[-0.03em] text-[var(--karsa-deep-navy)]">
                    {rejected
                        ? 'Dokumen belum dapat disetujui'
                        : 'Dokumen Anda sedang diverifikasi'}
                </h3>

                <p className="mx-auto mt-3 max-w-[370px] text-[9px] leading-[1.8] text-[var(--karsa-muted)]">
                    {rejected
                        ? 'Silakan periksa pemberitahuan atau hubungi tim KarsaNusa untuk mengetahui dokumen yang perlu diperbaiki.'
                        : 'Tim KarsaNusa sedang memeriksa identitas dan dokumen yang Anda unggah. Proses biasanya selesai dalam 1–2 hari kerja.'}
                </p>
            </div>

            <div className="mt-7 grid gap-3">
                <StatusItem
                    icon={<FileCheck size={17} />}
                    title="Dokumen berhasil diterima"
                    description="File tersimpan secara private dan aman."
                    done
                />

                <StatusItem
                    icon={<ShieldCheck size={17} />}
                    title="Pemeriksaan administrator"
                    description={
                        rejected
                            ? 'Dokumen memerlukan pembaruan.'
                            : 'Sedang menunggu tinjauan tim KarsaNusa.'
                    }
                    done={rejected}
                    warning={rejected}
                />
            </div>

            <div className="mt-7 grid gap-2 sm:grid-cols-2">
                <Link href={home()} className="karsa-btn karsa-btn-secondary">
                    <Home size={15} />
                    Kembali ke Beranda
                </Link>

                <Link
                    href={logout()}
                    method="post"
                    as="button"
                    className="karsa-btn karsa-btn-ghost"
                >
                    <LogOut size={15} />
                    Keluar dari Akun
                </Link>
            </div>
        </>
    );
}

function StatusItem({
    icon,
    title,
    description,
    done = false,
    warning = false,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
    done?: boolean;
    warning?: boolean;
}) {
    return (
        <div className="flex items-start gap-3 rounded-[11px] border border-[var(--karsa-border)] p-4 text-left">
            <span
                className={
                    warning
                        ? 'grid h-9 w-9 shrink-0 place-items-center rounded-[9px] bg-[#fef2f2] text-[#b91c1c]'
                        : done
                          ? 'grid h-9 w-9 shrink-0 place-items-center rounded-[9px] bg-[#ecfdf5] text-[#047857]'
                          : 'grid h-9 w-9 shrink-0 place-items-center rounded-[9px] bg-[var(--karsa-background)] text-[var(--karsa-subtle)]'
                }
            >
                {icon}
            </span>

            <div>
                <strong className="block text-[9px] text-[var(--karsa-slate)]">
                    {title}
                </strong>
                <span className="mt-1 block text-[7px] leading-[1.6] text-[var(--karsa-muted)]">
                    {description}
                </span>
            </div>
        </div>
    );
}

VerificationPending.layout = {
    title: 'Status verifikasi akun',
    description: 'Akun akan aktif setelah dokumen disetujui administrator.',
};
