import { KarsaBadge } from '@/components/karsa/karsa-ui';
import { home, logout } from '@/routes';
import type { Auth } from '@/types/auth';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Clock,
    FileCheck,
    Home,
    LogOut,
    RefreshCw,
    ShieldAlert,
    ShieldCheck,
} from 'lucide-react';
import { useEffect } from 'react';

export default function VerificationPending() {
    const { auth } = usePage<{ auth: Auth }>().props;

    const user = auth.user;

    const status = user.verification_status;

    const approved = status === 'approved';
    const rejected = status === 'rejected';

    // ========================================
    // PEMERIKSAAN STATUS OTOMATIS
    // ========================================


    useEffect(() => {
        if (approved) {
            router.visit('/dashboard', {
                replace: true,
            });
            return;
        }

        // Pemeriksaan otomatis setiap 10 detik.
        const interval = window.setInterval(() => {
            router.reload();
        }, 10000);

        return () => {
            window.clearInterval(interval);
        };
    }, [approved]);


    // ========================================
    // PEMERIKSAAN STATUS MANUAL
    // ========================================

    function checkStatus() {
        router.reload();
    }

    return (
        <>
            <Head
                title={
                    approved
                        ? 'Verifikasi Berhasil'
                        : rejected
                            ? 'Verifikasi Ditolak'
                            : 'Menunggu Verifikasi'
                }
            />

            {/* ====================================
                INFORMASI STATUS
            ==================================== */}

            <div className="text-center">
                <span
                    className={
                        rejected
                            ? 'mx-auto grid h-16 w-16 place-items-center rounded-[18px] bg-[#fef2f2] text-[#b91c1c]'
                            : approved
                                ? 'mx-auto grid h-16 w-16 place-items-center rounded-[18px] bg-[#ecfdf5] text-[#047857]'
                                : 'mx-auto grid h-16 w-16 place-items-center rounded-[18px] bg-[var(--karsa-sky-pale)] text-[var(--karsa-primary)]'
                    }
                >
                    {rejected ? (
                        <ShieldAlert size={30} />
                    ) : approved ? (
                        <ShieldCheck size={30} />
                    ) : (
                        <Clock size={30} />
                    )}
                </span>

                <KarsaBadge
                    tone={
                        rejected
                            ? 'danger'
                            : approved
                                ? 'primary'
                                : 'amber'
                    }
                    className="mt-5"
                >
                    {rejected
                        ? 'PERLU PERBAIKAN'
                        : approved
                            ? 'AKUN DISETUJUI'
                            : 'SEDANG DITINJAU'}
                </KarsaBadge>

                <h3 className="mt-4 text-[22px] font-extrabold tracking-[-0.03em] text-[var(--karsa-deep-navy)]">
                    {rejected
                        ? 'Dokumen belum dapat disetujui'
                        : approved
                            ? 'Verifikasi akun berhasil!'
                            : 'Dokumen Anda sedang diverifikasi'}
                </h3>

                <p className="mx-auto mt-3 max-w-[370px] text-[9px] leading-[1.8] text-[var(--karsa-muted)]">
                    {rejected
                        ? 'Silakan hubungi tim KarsaNursa untuk mengetahui dokumen yang perlu diperbaiki.'
                        : approved
                            ? 'Akun Anda sudah disetujui. Anda akan diarahkan ke Dashboard sesuai role yang didaftarkan.'
                            : 'Tim KarsaNursa sedang memeriksa dokumen Anda. Setelah seluruh dokumen disetujui, akun akan aktif dan dapat mengakses Dashboard.'}
                </p>
            </div>

            {/* ====================================
                PROGRES VERIFIKASI
            ==================================== */}

            <div className="mt-7 grid gap-3">
                <StatusItem
                    icon={<FileCheck size={17} />}
                    title="Dokumen berhasil diterima"
                    description="File tersimpan secara privat dan aman."
                    done
                />

                <StatusItem
                    icon={<ShieldCheck size={17} />}
                    title="Pemeriksaan administrator"
                    description={
                        rejected
                            ? 'Dokumen memerlukan perbaikan.'
                            : approved
                                ? 'Dokumen telah disetujui.'
                                : 'Sedang menunggu keputusan administrator.'
                    }
                    done={approved}
                    warning={rejected}
                />
            </div>

            {/* ====================================
                TOMBOL CEK STATUS
            ==================================== */}

            {!approved && (
                <button
                    type="button"
                    onClick={checkStatus}
                    className="karsa-btn karsa-btn-primary mt-7 w-full"
                >
                    <RefreshCw size={16} />
                    Periksa Status Sekarang
                </button>
            )}

            {/* ====================================
                NAVIGASI
            ==================================== */}

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <Link
                    href={home()}
                    className="karsa-btn karsa-btn-secondary"
                >
                    <Home size={15} />
                    Kembali ke Beranda
                </Link>

                {approved ? (
                    <Link
                        href="/dashboard"
                        className="karsa-btn karsa-btn-secondary"
                    >
                        <ShieldCheck size={15} />
                        Buka Dashboard
                    </Link>
                ) : (
                    <Link
                        href={logout()}
                        method="post"
                        as="button"
                        className="karsa-btn karsa-btn-ghost"
                    >
                        <LogOut size={15} />
                        Keluar dari Akun
                    </Link>
                )}
            </div>
        </>
    );
}

// ========================================
// KOMPONEN STATUS VERIFIKASI
// ========================================

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

// ========================================
// AUTH LAYOUT
// ========================================

VerificationPending.layout = {
    title: 'Status verifikasi akun',
    description:
        'Akun akan aktif setelah seluruh dokumen disetujui administrator.',
};
