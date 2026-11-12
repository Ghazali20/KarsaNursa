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
        label: 'Upah dan pengeluaran transparan',
    },
];

// ========================================
// TEKS HEADER & FOOTER PER HALAMAN AUTH
// ========================================

const pageCopy: Record<string, { badge: string; footer: string | null }> = {
    'auth/login': {
        badge: 'MASUK AKUN',
        footer: 'Data kamu aman bersama kami.',
    },
    'auth/register': {
        badge: 'DAFTAR AKUN',
        // Form daftar sudah punya kotak privasi sendiri,
        // jadi teks keamanan di bawah tidak perlu diulang.
        footer: null,
    },
    'auth/google-complete': {
        badge: 'LENGKAPI DATA',
        footer: 'Data kamu aman bersama kami.',
    },
    'auth/forgot-password': {
        badge: 'LUPA KATA SANDI',
        footer: 'Data kamu aman bersama kami.',
    },
    'auth/reset-password': {
        badge: 'ATUR ULANG KATA SANDI',
        footer: 'Data kamu aman bersama kami.',
    },
};

const defaultCopy = {
    badge: 'AKUN KARSANUSA',
    footer: 'Data kamu aman bersama kami.',
};

// ========================================
// AUTH SPLIT LAYOUT RESPONSIVE
// ========================================

export default function AuthSplitLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    // Membaca nama halaman untuk menentukan teks badge dan footer.
    const { component } = usePage();

    // Halaman pendaftaran Google membutuhkan ruang formulir lebih luas.
    const isGoogleComplete = component === 'auth/google-complete';
    const copy = pageCopy[component] ?? defaultCopy;

    return (
        <main className="grid min-h-svh w-full grid-cols-1 overflow-x-hidden bg-white lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            {/* =====================================
                PANEL KIRI - INFORMASI KARSANUSA
                Ditampilkan pada laptop / desktop.
                Disembunyikan pada HP dan tablet kecil.
            ===================================== */}

            <section className="relative hidden h-svh min-h-[500px] flex-col justify-between self-start overflow-x-hidden overflow-y-auto bg-[var(--karsa-deep-navy)] px-7 py-8 text-white lg:sticky lg:top-0 lg:flex xl:px-10 xl:py-10 2xl:px-14 2xl:py-12">
                {/* DEKORASI BACKGROUND */}
                <div className="pointer-events-none absolute -bottom-28 -left-28 h-72 w-72 rounded-full bg-[var(--karsa-sky)]/10" />

                <div className="pointer-events-none absolute -top-32 -right-28 h-72 w-72 rounded-full bg-[var(--karsa-amber)]/10" />

                {/* LOGO */}
                <KarsaLogo
                    light
                    className="relative z-10 w-fit"
                    imageClassName="w-[76px] xl:w-[88px]"
                />

                {/* KONTEN UTAMA */}
                <div className="relative z-10 my-8 max-w-[470px]">
                    <KarsaBadge tone="blue">
                        <ShieldCheck size={13} />
                        Kerja fleksibel & lokal, untuk semua orang.
                    </KarsaBadge>

                    {/* HEADLINE */}
                    <h1 className="mt-5 text-[30px] leading-[1.16] font-extrabold tracking-[-0.045em] xl:text-[38px] 2xl:text-[44px]">
                        Cari kerja atau cari tenaga?
                        <span className="mt-1 block">Mulai dari sini.</span>
                    </h1>

                    {/* DESKRIPSI */}
                    <p className="mt-4 max-w-[450px] text-xs leading-relaxed text-[#b8cad8] xl:text-sm">
                        Hubungkan UMKM dengan pekerja lepas di sekitarmu, dengan
                        upah yang jelas sejak awal.
                    </p>

                    {/* BENEFIT PLATFORM */}
                    <ul className="mt-7 grid gap-3">
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

                    {/* TESTIMONI */}
                    <blockquote className="mt-8 border-l-2 border-[var(--karsa-sky)] pl-4 text-xs leading-relaxed text-[#d9e5ee]">
                        “Saya bisa mengambil tugas di sela jadwal kuliah, dengan
                        upah yang jelas sejak awal.”
                        <span className="mt-2 block text-[10px] text-[#8da9bd]">
                            — Nadia, Mitra Lokal Surabaya
                        </span>
                    </blockquote>
                </div>

                {/* FOOTER PANEL KIRI */}
                <div className="relative z-10 flex items-start gap-2 text-[10px] leading-relaxed text-[#8da9bd]">
                    <Check
                        size={14}
                        className="mt-0.5 shrink-0 text-[var(--karsa-sky)]"
                    />

                    <span>
                        KarsaNusa · Mendukung pekerjaan layak dan pertumbuhan
                        ekonomi
                    </span>
                </div>
            </section>

            {/* =====================================
                PANEL KANAN - FORM AUTENTIKASI
                RESPONSIVE SEMUA DEVICE
            ===================================== */}

            <section
                className={[
                    'relative flex min-h-svh min-w-0',
                    'flex-col items-center justify-center',
                    'bg-white px-4 pb-8 pt-20',
                    'sm:px-6 sm:pb-10',
                    'md:px-8',
                    'lg:px-8 lg:pb-10 lg:pt-16',
                    'xl:px-12',
                    '2xl:px-16',

                    // Halaman Google Complete dimulai dari atas agar
                    // form panjang tidak membuat ruang kosong berlebih.
                    isGoogleComplete ? 'lg:justify-start' : 'lg:justify-center',
                ].join(' ')}
            >
                {/* KEMBALI KE BERANDA */}
                <Link
                    href={home()}
                    className="absolute top-5 left-4 inline-flex items-center gap-2 rounded-lg bg-[var(--karsa-background)] px-3 py-2 text-xs font-semibold text-[var(--karsa-muted)] transition-colors hover:text-[var(--karsa-primary)] sm:left-6 lg:left-8 xl:left-12"
                >
                    <ArrowLeft size={15} />
                    Kembali ke beranda
                </Link>

                {/* CONTAINER FORM */}
                <div
                    className={[
                        'w-full min-w-0',

                        // Login dan register tetap ringkas.
                        // Google Complete lebih lebar agar
                        // field bisa tampil dua kolom.
                        isGoogleComplete ? 'max-w-[680px]' : 'max-w-[440px]',
                    ].join(' ')}
                >
                    {/* LOGO MOBILE */}
                    <div className="mb-6 lg:hidden">
                        <KarsaLogo imageClassName="w-[76px] sm:w-[88px]" />
                    </div>

                    {/* HEADER HALAMAN */}
                    <div className="mb-5">
                        <KarsaBadge tone="slate">{copy.badge}</KarsaBadge>

                        <h2 className="mt-3 text-[23px] leading-tight font-extrabold tracking-[-0.035em] text-[var(--karsa-deep-navy)] sm:text-[27px] lg:text-[25px] xl:text-[29px]">
                            {title}
                        </h2>

                        {description && (
                            <p className="mt-2 text-xs leading-relaxed text-[var(--karsa-muted)] sm:text-sm">
                                {description}
                            </p>
                        )}
                    </div>

                    {/* FORM LOGIN / REGISTER / GOOGLE */}
                    <div className="w-full min-w-0">{children}</div>

                    {/* FOOTER KEAMANAN */}
                    {copy.footer && (
                        <div className="mt-6 flex items-center justify-center gap-2 text-center text-[10px] leading-relaxed text-[var(--karsa-subtle)] sm:text-xs">
                            <ShieldCheck size={14} className="shrink-0" />
                            <span>{copy.footer}</span>
                        </div>
                    )}
                </div>
            </section>
        </main>
    );
}
