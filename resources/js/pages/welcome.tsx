import { KarsaLogo } from '@/components/karsa/karsa-logo';
import { LandingSections } from '@/components/karsa/landing-sections';
import { KarsaBadge } from '@/components/karsa/karsa-ui';
import { dashboard, login, register } from '@/routes';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    BriefcaseBusiness,
    Check,
    MapPin,
    ShieldCheck,
    Star,
    WalletCards,
} from 'lucide-react';

const heroPhoto =
    'https://images.unsplash.com/photo-1599549211246-7065b775aa7b?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=1200';

export default function Welcome() {
    const { auth } = usePage().props;

    return (
        <>
            <Head title="KarsaNusa — Kerja Lokal, Usaha Bertumbuh" />

            <main className="min-h-screen overflow-hidden bg-white text-[var(--karsa-slate)]">
                <nav className="mx-auto flex h-[76px] w-full max-w-[1180px] items-center justify-between px-5 lg:px-8">
                    <KarsaLogo imageClassName="w-[86px]" />

                    <div className="hidden items-center gap-9 text-[12px] font-semibold text-[var(--karsa-muted)] md:flex">
                        <a
                            href="#cara-kerja"
                            className="transition-colors hover:text-[var(--karsa-primary)]"
                        >
                            Cara Kerja
                        </a>
                        <a
                            href="#solusi"
                            className="transition-colors hover:text-[var(--karsa-primary)]"
                        >
                            Solusi
                        </a>
                        <a
                            href="#dampak"
                            className="transition-colors hover:text-[var(--karsa-primary)]"
                        >
                            Dampak
                        </a>
                    </div>

                    <div className="flex items-center gap-2">
                        {auth.user ? (
                            <Link
                                href={dashboard()}
                                className="karsa-btn karsa-btn-primary"
                            >
                                Buka Dashboard
                                <ArrowRight size={16} />
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={login()}
                                    className="karsa-btn karsa-btn-ghost hidden sm:inline-flex"
                                >
                                    Masuk
                                </Link>
                                <Link
                                    href={register()}
                                    className="karsa-btn karsa-btn-primary"
                                >
                                    Daftar Gratis
                                </Link>
                            </>
                        )}
                    </div>
                </nav>

                <section className="mx-auto grid min-h-[610px] w-full max-w-[1180px] items-center gap-12 px-5 py-14 lg:grid-cols-[1.02fr_0.98fr] lg:px-8 lg:py-16">
                    <div className="max-w-[620px]">
                        <KarsaBadge>
                            Platform micro-task lokal #UntukNusantara
                        </KarsaBadge>

                        <h1 className="mt-6 text-[43px] leading-[1.08] font-extrabold tracking-[-0.045em] text-[var(--karsa-deep-navy)] sm:text-[54px] lg:text-[62px]">
                            Kerja lebih dekat.
                            <br />
                            <span className="text-[var(--karsa-primary)]">
                                Usaha tumbuh lebih cepat.
                            </span>
                        </h1>

                        <p className="mt-6 max-w-[590px] text-[15px] leading-[1.8] text-[var(--karsa-muted)]">
                            KarsaNusa mempertemukan UMKM yang butuh bantuan
                            operasional dengan tenaga kerja lokal
                            tepercaya—cepat, adil, dan transparan.
                        </p>

                        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                            <Link
                                href={login()}
                                className="karsa-btn karsa-btn-primary min-h-[48px] px-5"
                            >
                                Cari Pekerjaan Harian
                                <ArrowRight size={17} />
                            </Link>

                            <Link
                                href={register()}
                                className="karsa-btn karsa-btn-secondary min-h-[48px] px-5"
                            >
                                Buka Lowongan UMKM
                            </Link>
                        </div>

                        <div className="mt-8 flex items-center gap-4">
                            <div className="flex -space-x-2">
                                {['RS', 'BA', 'MP'].map((initials) => (
                                    <span
                                        key={initials}
                                        className="grid h-9 w-9 place-items-center rounded-full border-2 border-white bg-[var(--karsa-sky-soft)] text-[9px] font-extrabold text-[var(--karsa-primary-dark)]"
                                    >
                                        {initials}
                                    </span>
                                ))}
                            </div>

                            <div className="text-[10px] leading-relaxed text-[var(--karsa-muted)]">
                                <strong className="block text-[var(--karsa-slate)]">
                                    1.200+ mitra lokal
                                </strong>
                                telah bergabung bersama kami
                            </div>
                        </div>
                    </div>

                    <div className="relative mx-auto h-[460px] w-full max-w-[520px] lg:h-[520px]">
                        <div className="absolute inset-x-7 top-0 bottom-7 overflow-hidden rounded-[30px] bg-[var(--karsa-sky-pale)]">
                            <img
                                src={heroPhoto}
                                alt="Pelaku usaha lokal sedang menyiapkan produk"
                                className="h-full w-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[rgba(13,36,69,0.18)] via-transparent to-transparent" />
                        </div>

                        <span className="absolute top-5 right-5 h-3 w-3 rounded-full bg-[var(--karsa-primary)]" />
                        <span className="absolute bottom-1 left-4 h-2.5 w-2.5 rounded-full bg-[var(--karsa-amber)]" />

                        <div className="absolute top-[68px] left-0 flex min-w-[205px] items-center gap-3 rounded-[14px] border border-white/70 bg-white/95 p-4 shadow-[var(--karsa-shadow-lg)] backdrop-blur">
                            <span className="grid h-10 w-10 place-items-center rounded-[10px] bg-[var(--karsa-sky-soft)] text-[var(--karsa-primary)]">
                                <BriefcaseBusiness size={20} />
                            </span>
                            <div>
                                <small className="block text-[7px] font-semibold text-[var(--karsa-subtle)]">
                                    Lowongan terdekat
                                </small>
                                <strong className="mt-1 block text-[10px] text-[var(--karsa-slate)]">
                                    Bantu Packing Pesanan
                                </strong>
                                <span className="mt-1 block text-[8px] text-[var(--karsa-muted)]">
                                    1,2 km · Rp 80.000
                                </span>
                            </div>
                        </div>

                        <div className="absolute right-0 bottom-[58px] flex min-w-[220px] items-center gap-3 rounded-[14px] border border-white/70 bg-white/95 p-4 shadow-[var(--karsa-shadow-lg)] backdrop-blur">
                            <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--karsa-primary)] text-white">
                                <Check size={18} strokeWidth={2.4} />
                            </span>
                            <div>
                                <strong className="block text-[10px] text-[var(--karsa-slate)]">
                                    Upah diterima penuh
                                </strong>
                                <span className="mt-1 block text-[8px] text-[var(--karsa-muted)]">
                                    Tanpa potongan tersembunyi
                                </span>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="border-y border-[var(--karsa-border)] bg-[var(--karsa-background)]">
                    <div className="mx-auto flex w-full max-w-[1180px] flex-col items-center justify-between gap-5 px-5 py-6 lg:flex-row lg:px-8">
                        <span className="text-[9px] font-bold tracking-[0.16em] text-[var(--karsa-subtle)] uppercase">
                            Dirancang untuk ekosistem kerja yang
                        </span>

                        <div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-4 lg:w-auto lg:gap-8">
                            <TrustItem
                                icon={<ShieldCheck size={18} />}
                                label="Terverifikasi"
                            />
                            <TrustItem
                                icon={<WalletCards size={18} />}
                                label="Upah Transparan"
                            />
                            <TrustItem
                                icon={<MapPin size={18} />}
                                label="Berbasis Lokasi"
                            />
                            <TrustItem
                                icon={<Star size={18} />}
                                label="Reputasi Dua Arah"
                            />
                        </div>
                    </div>
                </section>

                <LandingSections />
            </main>
        </>
    );
}

function TrustItem({ icon, label }: { icon: React.ReactNode; label: string }) {
    return (
        <span className="flex items-center justify-center gap-2 text-[9px] font-bold text-[var(--karsa-primary-dark)]">
            {icon}
            {label}
        </span>
    );
}
