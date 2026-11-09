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
    Menu,
    ShieldCheck,
    Star,
    WalletCards,
    X,
} from 'lucide-react';
import { useState } from 'react';

const heroPhoto =
    'https://images.unsplash.com/photo-1599549211246-7065b775aa7b?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=1200';

export default function Welcome() {
    const { auth } = usePage().props;
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <>
            <Head title="KarsaNusa — Kerja Lokal, Usaha Bertumbuh" />

            <main className="karsa-landing min-h-screen overflow-x-clip bg-white text-[var(--karsa-slate)]">
                <nav className="relative z-30 mx-auto flex h-[82px] w-full max-w-[1440px] items-center justify-between px-4 sm:px-7 lg:h-[100px] lg:px-6 xl:px-4">
                    <KarsaLogo imageClassName="w-[94px] sm:w-[108px] lg:w-[114px]" />

                    <div className="hidden items-center gap-9 text-[15px] font-semibold text-[var(--karsa-muted)] lg:flex xl:gap-12">
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

                    <div className="flex items-center gap-2 sm:gap-3">
                        {auth.user ? (
                            <Link
                                href={dashboard()}
                                className="karsa-btn karsa-btn-primary hidden sm:inline-flex"
                            >
                                Buka Dashboard
                                <ArrowRight size={18} />
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={login()}
                                    className="karsa-btn karsa-btn-ghost hidden lg:inline-flex"
                                >
                                    Masuk
                                </Link>
                                <Link
                                    href={register()}
                                    className="karsa-btn karsa-btn-primary hidden sm:inline-flex"
                                >
                                    Daftar Gratis
                                </Link>
                            </>
                        )}

                        <button
                            type="button"
                            className="inline-flex size-11 items-center justify-center rounded-xl border border-[var(--karsa-border)] bg-white text-[var(--karsa-primary)] lg:hidden"
                            aria-label={
                                mobileMenuOpen
                                    ? 'Tutup menu navigasi'
                                    : 'Buka menu navigasi'
                            }
                            aria-expanded={mobileMenuOpen}
                            aria-controls="karsa-mobile-menu"
                            onClick={() =>
                                setMobileMenuOpen((current) => !current)
                            }
                        >
                            {mobileMenuOpen ? (
                                <X size={23} />
                            ) : (
                                <Menu size={23} />
                            )}
                        </button>
                    </div>

                    {mobileMenuOpen && (
                        <div
                            id="karsa-mobile-menu"
                            className="absolute top-[calc(100%-4px)] right-4 left-4 z-40 flex flex-col gap-1 rounded-2xl border border-[var(--karsa-border)] bg-white p-3 text-sm font-semibold shadow-[var(--karsa-shadow-lg)] sm:right-7 sm:left-7 lg:hidden"
                        >
                            {[
                                { label: 'Cara Kerja', href: '#cara-kerja' },
                                { label: 'Solusi', href: '#solusi' },
                                { label: 'Dampak', href: '#dampak' },
                            ].map((item) => (
                                <a
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="rounded-xl px-4 py-3 text-[var(--karsa-slate)] hover:bg-[var(--karsa-sky-pale)]"
                                >
                                    {item.label}
                                </a>
                            ))}
                            {auth.user ? (
                                <Link
                                    href={dashboard()}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="rounded-xl px-4 py-3 text-[var(--karsa-primary)] hover:bg-[var(--karsa-sky-pale)]"
                                >
                                    Buka Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={login()}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="rounded-xl px-4 py-3 text-[var(--karsa-primary)] hover:bg-[var(--karsa-sky-pale)]"
                                    >
                                        Masuk
                                    </Link>
                                    <Link
                                        href={register()}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="rounded-xl bg-[var(--karsa-primary)] px-4 py-3 text-white sm:hidden"
                                    >
                                        Daftar Gratis
                                    </Link>
                                </>
                            )}
                        </div>
                    )}
                </nav>

                <section className="mx-auto grid w-full max-w-[1440px] items-center gap-10 px-4 pt-10 pb-16 sm:px-7 sm:pt-14 lg:min-h-[780px] lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-8 lg:px-6 lg:pt-16 lg:pb-20 xl:gap-12 xl:px-4">
                    <div className="min-w-0 lg:max-w-[750px]">
                        <KarsaBadge>
                            Platform micro-task lokal #UntukNusantara
                        </KarsaBadge>

                        <h1 className="mt-7 max-w-[780px] text-[clamp(2.55rem,5.15vw,5.25rem)] leading-[1.065] font-extrabold tracking-[-0.055em] text-[var(--karsa-deep-navy)]">
                            Kerja lebih dekat.
                            <br className="hidden sm:block" />
                            <span className="text-[var(--karsa-primary)]">
                                Usaha tumbuh lebih cepat.
                            </span>
                        </h1>

                        <p className="mt-7 max-w-[690px] text-[15px] leading-[1.8] text-[var(--karsa-muted)] sm:text-[17px] lg:text-[18px]">
                            KarsaNusa mempertemukan UMKM yang butuh bantuan
                            operasional dengan tenaga kerja lokal
                            tepercaya—cepat, adil, dan transparan.
                        </p>

                        <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                            <Link
                                href={login()}
                                className="karsa-btn karsa-btn-primary min-h-[50px] px-5 sm:px-6"
                            >
                                Cari Pekerjaan Harian
                                <ArrowRight size={17} />
                            </Link>

                            <Link
                                href={register()}
                                className="karsa-btn karsa-btn-secondary min-h-[50px] px-5 sm:px-6"
                            >
                                Buka Lowongan UMKM
                            </Link>
                        </div>

                        <div className="mt-9 flex items-center gap-4">
                            <div className="flex -space-x-2">
                                {['RS', 'BA', 'MP'].map((initials) => (
                                    <span
                                        key={initials}
                                        className="grid h-10 w-10 place-items-center rounded-full border-2 border-white bg-[var(--karsa-sky-soft)] text-[11px] font-extrabold text-[var(--karsa-primary-dark)]"
                                    >
                                        {initials}
                                    </span>
                                ))}
                            </div>

                            <div className="text-[12px] leading-relaxed text-[var(--karsa-muted)] sm:text-[13px]">
                                <strong className="block text-[var(--karsa-slate)]">
                                    1.200+ mitra lokal
                                </strong>
                                telah bergabung bersama kami
                            </div>
                        </div>
                    </div>

                    <div className="relative mx-auto mt-2 h-[390px] w-full max-w-[650px] sm:h-[530px] lg:mt-0 lg:h-[clamp(500px,42vw,640px)]">
                        <div className="absolute inset-x-3 top-0 bottom-6 overflow-hidden rounded-[28px] bg-[var(--karsa-sky-pale)] sm:inset-x-6 sm:rounded-[34px]">
                            <img
                                src={heroPhoto}
                                alt="Pelaku usaha lokal sedang menyiapkan produk"
                                className="h-full w-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[rgba(13,36,69,0.18)] via-transparent to-transparent" />
                        </div>

                        <span className="absolute top-5 right-1 h-3 w-3 rounded-full bg-[var(--karsa-primary)] sm:right-3" />
                        <span className="absolute bottom-1 left-1 h-2.5 w-2.5 rounded-full bg-[var(--karsa-amber)] sm:left-3" />

                        <div className="absolute top-[45px] left-0 flex min-w-[195px] items-center gap-2.5 rounded-[16px] border border-white/70 bg-white/95 p-3 shadow-[var(--karsa-shadow-lg)] backdrop-blur sm:top-[86px] sm:min-w-[250px] sm:gap-3 sm:p-5">
                            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[11px] bg-[var(--karsa-sky-soft)] text-[var(--karsa-primary)] sm:h-12 sm:w-12">
                                <BriefcaseBusiness size={20} />
                            </span>
                            <div>
                                <small className="block text-[10px] font-semibold text-[var(--karsa-subtle)] sm:text-[11px]">
                                    Lowongan terdekat
                                </small>
                                <strong className="mt-1 block text-[11px] font-bold text-[var(--karsa-slate)] sm:text-[13px]">
                                    Bantu Packing Pesanan
                                </strong>
                                <span className="mt-1 block text-[10px] text-[var(--karsa-muted)] sm:text-[11px]">
                                    1,2 km · Rp 80.000
                                </span>
                            </div>
                        </div>

                        <div className="absolute right-0 bottom-[45px] flex min-w-[200px] items-center gap-3 rounded-[16px] border border-white/70 bg-white/95 p-3 shadow-[var(--karsa-shadow-lg)] backdrop-blur sm:bottom-[70px] sm:min-w-[270px] sm:p-5">
                            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--karsa-primary)] text-white sm:h-12 sm:w-12">
                                <Check size={18} strokeWidth={2.4} />
                            </span>
                            <div>
                                <strong className="block text-[11px] font-bold text-[var(--karsa-slate)] sm:text-[13px]">
                                    Upah diterima penuh
                                </strong>
                                <span className="mt-1 block text-[10px] text-[var(--karsa-muted)] sm:text-[11px]">
                                    Tanpa potongan tersembunyi
                                </span>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="border-y border-[var(--karsa-border)] bg-[var(--karsa-background)]">
                    <div className="mx-auto flex w-full max-w-[1440px] flex-col items-center justify-between gap-5 px-4 py-6 sm:px-7 lg:flex-row lg:px-6 xl:px-4">
                        <span className="text-center text-[11px] font-bold tracking-[0.16em] text-[var(--karsa-subtle)] uppercase lg:text-left">
                            Dirancang untuk ekosistem kerja yang
                        </span>

                        <div className="grid w-full grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-4 lg:w-auto lg:gap-8">
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
        <span className="flex items-center justify-center gap-2 text-[11px] font-bold text-[var(--karsa-primary-dark)] sm:text-[13px]">
            {icon}
            {label}
        </span>
    );
}
