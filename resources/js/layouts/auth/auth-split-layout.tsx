import { KarsaLogo } from '@/components/karsa/karsa-logo';
import { KarsaBadge } from '@/components/karsa/karsa-ui';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    BriefcaseBusiness,
    Check,
    ShieldCheck,
    Users,
    WalletCards,
} from 'lucide-react';

// ========================================
// KEUNGGULAN PLATFORM KARSANUSA
// ========================================

const benefits = [
    {
        icon: <Users size={17} />,
        label: 'Temukan kerja freelance di dekatmu',
    },
    {
        icon: <BriefcaseBusiness size={17} />,
        label: 'Pasang lowongan & temukan pekerja untuk usahamu',
    },
    {
        icon: <WalletCards size={17} />,
        label: 'Upah jelas, tanpa biaya tersembunyi',
    },
];

// ========================================
// AUTH SPLIT LAYOUT RESPONSIVE
// ========================================

export default function AuthSplitLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    const { component } = usePage();

    // Register dan Google Complete menggunakan form lebih lebar.
    const isRegister = component === 'auth/register';

    const isGoogleComplete = component === 'auth/google-complete';

    const isWideForm = isRegister || isGoogleComplete;

    return (
        <main className="grid min-h-svh w-full grid-cols-1 bg-white lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            {/* =====================================
                PANEL KIRI - BRANDING KARSANUSA

                - Hanya tampil pada desktop
                - Tinggi mengikuti layar
                - Tidak memiliki scrollbar sendiri
                - Tetap pada posisi saat halaman digulir
            ===================================== */}

            <section
                className={[
                    'relative hidden min-w-0 overflow-hidden',
                    'bg-[var(--karsa-deep-navy)] text-white',

                    // Posisi panel kiri pada desktop.
                    'lg:sticky lg:top-0 lg:flex lg:h-svh',
                    'lg:self-start lg:flex-col',
                    'lg:justify-between',

                    // Jarak konten.
                    'lg:px-8 lg:py-6',
                    'xl:px-10 xl:py-8',
                    '2xl:px-14 2xl:py-10',
                ].join(' ')}
            >
                {/* =================================
                    DEKORASI BACKGROUND
                ================================= */}

                <div className="pointer-events-none absolute -bottom-28 -left-28 h-72 w-72 rounded-full bg-[var(--karsa-sky)]/10" />

                <div className="pointer-events-none absolute -top-32 -right-28 h-72 w-72 rounded-full bg-[var(--karsa-amber)]/10" />

                {/* =================================
                    LOGO KARSANUSA
                ================================= */}

                <KarsaLogo
                    light
                    className="relative z-10 w-fit shrink-0"
                    imageClassName="w-[72px] xl:w-[80px] 2xl:w-[88px] [@media(max-height:650px)]:w-[60px]"
                />

                {/* =================================
                    INFORMASI UTAMA PLATFORM
                ================================= */}

                <div className="relative z-10 my-4 max-w-[470px]">
                    {/* BADGE */}

                    <div className="[@media(max-height:520px)]:hidden">
                        <KarsaBadge tone="blue">
                            <ShieldCheck size={13} />
                            Kerja fleksibel & lokal, untuk semua orang
                        </KarsaBadge>
                    </div>

                    {/* HEADLINE */}

                    <h1 className="mt-4 text-[26px] leading-[1.16] font-extrabold tracking-[-0.04em] xl:text-[32px] 2xl:text-[38px] [@media(max-height:650px)]:text-[24px]">
                        Cari kerja atau cari tenaga?
                        <span className="mt-1 block">Mulai dari sini.</span>
                    </h1>

                    {/* DESKRIPSI */}

                    <p className="mt-4 max-w-[450px] text-xs leading-relaxed text-[#b8cad8] xl:text-sm [@media(max-height:560px)]:hidden">
                        Hubungkan UMKM dengan pekerja lepas di sekitarmu, dengan
                        upah yang jelas sejak awal.
                    </p>

                    {/* =================================
                        KEUNGGULAN PLATFORM

                        Pada laptop dengan tinggi layar
                        sangat pendek, bagian ini
                        disembunyikan agar tidak terpotong.
                    ================================= */}

                    <ul className="mt-5 grid gap-2.5 [@media(max-height:680px)]:hidden">
                        {benefits.map((benefit) => (
                            <li
                                key={benefit.label}
                                className="flex items-center gap-3 text-xs font-medium text-[#d9e5ee]"
                            >
                                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10 text-[var(--karsa-sky)]">
                                    {benefit.icon}
                                </span>

                                <span>{benefit.label}</span>
                            </li>
                        ))}
                    </ul>

                    {/* =================================
                        TESTIMONI

                        Disembunyikan pada viewport
                        dengan tinggi 800px atau kurang.
                    ================================= */}

                    <blockquote className="mt-4 border-l-2 border-[var(--karsa-sky)] pl-4 text-xs leading-relaxed text-[#d9e5ee] [@media(max-height:800px)]:hidden">
                        “Saya bisa mengambil tugas di sela jadwal kuliah, dengan
                        upah yang jelas sejak awal.”
                        <span className="mt-2 block text-[10px] text-[#8da9bd]">
                            — Nadia, Mitra Lokal Surabaya
                        </span>
                    </blockquote>
                </div>

                {/* =================================
                    FOOTER PANEL KIRI
                ================================= */}

                <div className="relative z-10 flex shrink-0 items-start gap-2 text-[10px] leading-relaxed text-[#8da9bd] [@media(max-height:480px)]:hidden">
                    <Check
                        size={14}
                        className="mt-0.5 shrink-0 text-[var(--karsa-sky)]"
                    />

                    <span>
                        KarsaNusa · Mendukung pekerjaan layak dan pertumbuhan
                        ekonomi (SDGs 8)
                    </span>
                </div>
            </section>

            {/* =====================================
                PANEL KANAN - AUTENTIKASI

                - Responsif di HP, tablet, dan desktop
                - Mengikuti panjang form
                - Login tetap ramping
                - Register dan Google Complete lebih lebar
            ===================================== */}

            <section
                className={[
                    'relative flex min-h-svh min-w-0 flex-col',
                    'items-center bg-white',

                    // Padding responsif.
                    'px-4 pb-8 pt-20',
                    'sm:px-6 sm:pb-10',
                    'md:px-8',
                    'lg:px-8 lg:pt-16',
                    'xl:px-10',
                    '2xl:px-14',

                    // Form panjang dimulai dari atas.
                    // Form Login tetap di tengah.
                    isWideForm ? 'justify-start' : 'justify-center',
                ].join(' ')}
            >
                {/* =================================
                    TOMBOL KEMBALI KE BERANDA
                ================================= */}

                <Link
                    href={home()}
                    className="absolute top-5 left-4 inline-flex items-center gap-2 rounded-lg bg-[var(--karsa-background)] px-3 py-2 text-xs font-semibold text-[var(--karsa-muted)] transition-colors hover:text-[var(--karsa-primary)] sm:left-6 lg:left-8"
                >
                    <ArrowLeft size={15} />
                    Kembali ke beranda
                </Link>

                {/* =================================
                    CONTAINER FORM RESPONSIVE
                ================================= */}

                <div
                    className={[
                        'w-full min-w-0',

                        // Lebar sesuai halaman.
                        isWideForm ? 'max-w-[720px]' : 'max-w-[440px]',
                    ].join(' ')}
                >
                    {/* LOGO PADA MOBILE */}

                    <div className="mb-5 lg:hidden">
                        <KarsaLogo imageClassName="w-[76px] sm:w-[88px]" />
                    </div>

                    {/* =================================
                        HEADER HALAMAN
                    ================================= */}

                    <div className={isWideForm ? 'mb-5' : 'mb-7'}>
                        <KarsaBadge tone="slate">
                            {isRegister
                                ? 'DAFTAR AKUN'
                                : isGoogleComplete
                                  ? 'LENGKAPI DATA'
                                  : 'MASUK AKUN'}
                        </KarsaBadge>

                        <h2 className="mt-3 text-[24px] leading-tight font-extrabold tracking-[-0.035em] text-[var(--karsa-deep-navy)] sm:text-[28px] xl:text-[31px]">
                            {title}
                        </h2>

                        {description && (
                            <p className="mt-2 text-sm leading-relaxed text-[var(--karsa-muted)]">
                                {description}
                            </p>
                        )}
                    </div>

                    {/* =================================
                        FORM LOGIN / REGISTER / GOOGLE
                    ================================= */}

                    <div className="w-full min-w-0">{children}</div>

                    {/* =================================
                        FOOTER KEAMANAN

                        Disembunyikan di halaman daftar,
                        karena form daftar sudah punya
                        kotak privasi sendiri.
                    ================================= */}

                    {!isRegister && (
                        <div className="mt-5 flex items-center justify-center gap-2 text-center text-[10px] leading-relaxed text-[var(--karsa-subtle)] sm:text-xs">
                            <ShieldCheck size={14} className="shrink-0" />
                            <span>Data kamu aman bersama kami.</span>
                        </div>
                    )}
                </div>
            </section>
        </main>
    );
}
