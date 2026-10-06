import { KarsaLogo } from '@/components/karsa/karsa-logo';
import { KarsaBadge } from '@/components/karsa/karsa-ui';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';
import { Link } from '@inertiajs/react';
import {
    ArrowLeft,
    BriefcaseBusiness,
    Check,
    ShieldCheck,
    Users,
    WalletCards,
} from 'lucide-react';

const benefits = [
    {
        icon: <Users size={17} />,
        label: 'Temukan peluang kerja lokal',
    },
    {
        icon: <BriefcaseBusiness size={17} />,
        label: 'Kelola tenaga kerja UMKM',
    },
    {
        icon: <WalletCards size={17} />,
        label: 'Upah dan pengeluaran transparan',
    },
];

export default function AuthSplitLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <main className="grid min-h-screen bg-white lg:grid-cols-[0.9fr_1.1fr]">
            <section className="relative hidden min-h-screen overflow-hidden bg-[var(--karsa-deep-navy)] p-10 text-white lg:flex lg:flex-col lg:justify-between xl:px-16 xl:py-12">
                <div className="absolute -bottom-28 -left-28 h-80 w-80 rounded-full bg-[var(--karsa-sky)]/10" />
                <div className="absolute -top-32 -right-28 h-80 w-80 rounded-full bg-[var(--karsa-amber)]/10" />

                <KarsaLogo
                    light
                    className="relative z-10 w-fit"
                    imageClassName="w-[88px]"
                />

                <div className="relative z-10 max-w-[540px]">
                    <KarsaBadge tone="blue">
                        <ShieldCheck size={13} />
                        Platform kerja lokal tepercaya
                    </KarsaBadge>

                    <h1 className="mt-6 text-[42px] leading-[1.14] font-extrabold tracking-[-0.045em] xl:text-[48px]">
                        Kesempatan lokal.
                        <br />
                        Dampak yang nyata.
                    </h1>

                    <p className="mt-5 max-w-[500px] text-[12px] leading-[1.8] text-[#b8cad8]">
                        Bergabung dalam ekosistem kerja yang aman, adil, dan
                        saling menguatkan untuk pekerja lokal dan pelaku UMKM.
                    </p>

                    <ul className="mt-8 grid gap-4">
                        {benefits.map((benefit) => (
                            <li
                                key={benefit.label}
                                className="flex items-center gap-3 text-[10px] font-semibold text-[#d9e5ee]"
                            >
                                <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-white/10 text-[var(--karsa-sky)]">
                                    {benefit.icon}
                                </span>
                                {benefit.label}
                            </li>
                        ))}
                    </ul>

                    <blockquote className="mt-10 border-l-2 border-[var(--karsa-sky)] pl-5 text-[11px] leading-[1.8] text-[#d9e5ee]">
                        “Saya bisa mengambil tugas di sela jadwal kuliah, dengan
                        upah yang jelas sejak awal.”
                        <span className="mt-2 block text-[8px] text-[#8da9bd]">
                            — Nadia, Mitra Lokal Surabaya
                        </span>
                    </blockquote>
                </div>

                <div className="relative z-10 flex items-center gap-2 text-[8px] text-[#8da9bd]">
                    <Check size={14} className="text-[var(--karsa-sky)]" />
                    KarsaNusa · Mendukung pekerjaan layak dan pertumbuhan
                    ekonomi
                </div>
            </section>

            <section className="relative flex min-h-screen items-center justify-center bg-white px-5 py-20 sm:px-8 lg:px-12">
                <Link
                    href={home()}
                    className="absolute top-6 left-5 inline-flex items-center gap-2 rounded-[9px] bg-[var(--karsa-background)] px-3 py-2 text-[9px] font-bold text-[var(--karsa-muted)] transition-colors hover:text-[var(--karsa-primary)] sm:left-8"
                >
                    <ArrowLeft size={15} />
                    Kembali ke beranda
                </Link>

                <div className="w-full max-w-[440px]">
                    <div className="mb-9 lg:hidden">
                        <KarsaLogo imageClassName="w-[92px]" />
                    </div>

                    <div className="mb-7">
                        <KarsaBadge tone="slate">AKUN KARSANUSA</KarsaBadge>
                        <h2 className="mt-4 text-[27px] leading-tight font-extrabold tracking-[-0.035em] text-[var(--karsa-deep-navy)]">
                            {title}
                        </h2>
                        <p className="mt-3 text-[10px] leading-[1.7] text-[var(--karsa-muted)]">
                            {description}
                        </p>
                    </div>

                    {children}

                    <div className="mt-8 flex items-center justify-center gap-2 text-[7px] text-[var(--karsa-subtle)]">
                        <ShieldCheck size={13} />
                        Data akun dilindungi dan setiap aktivitas tercatat
                        secara aman.
                    </div>
                </div>
            </section>
        </main>
    );
}
