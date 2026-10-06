import { KarsaLogo } from '@/components/karsa/karsa-logo';
import { KarsaBadge } from '@/components/karsa/karsa-ui';
import { login, register } from '@/routes';
import { Link } from '@inertiajs/react';
import {
    ArrowRight,
    BriefcaseBusiness,
    Check,
    ChevronRight,
    Clock,
    HeartHandshake,
    MapPin,
    ShieldCheck,
    Store,
    Users,
    WalletCards,
} from 'lucide-react';
import type { ReactNode } from 'react';

const workerFeatures = [
    'Lowongan berbasis radius lokasi',
    'Jadwal fleksibel dan upah pasti',
    'Portofolio kerja terverifikasi',
];

const employerFeatures = [
    'Seleksi pekerja terverifikasi',
    'Kelola absensi dan bukti kerja',
    'Pembukuan upah otomatis',
];

const workSteps = [
    {
        number: '01',
        title: 'Buat atau pilih tugas',
        description:
            'UMKM mempublikasikan kebutuhan, pekerja memilih tugas yang sesuai lokasi.',
    },
    {
        number: '02',
        title: 'Mulai dengan aman',
        description:
            'Check-in tervalidasi lokasi dan kesepakatan upah tercatat secara digital.',
    },
    {
        number: '03',
        title: 'Selesaikan dan laporkan',
        description:
            'Unggah bukti kerja, catatan aktivitas, lalu selesaikan proses check-out.',
    },
    {
        number: '04',
        title: 'Upah dan reputasi tercatat',
        description:
            'Hasil divalidasi, upah dicatat, dan kedua pihak saling memberikan ulasan.',
    },
];

export function LandingSections() {
    return (
        <>
            <section
                id="solusi"
                className="mx-auto w-full max-w-[1180px] px-5 py-24 lg:px-8"
            >
                <SectionHeading
                    eyebrow="SATU PLATFORM, DUA PELUANG"
                    title="Saling bantu, sama-sama bertumbuh"
                    description="Dibangun khusus untuk kebutuhan kerja operasional harian, bukan proyek panjang yang rumit."
                />

                <div className="mt-12 grid gap-5 lg:grid-cols-2">
                    <RoleCard
                        icon={<Users size={28} />}
                        badge="Untuk Pekerja Lokal"
                        title="Temukan penghasilan di sekitar Anda"
                        description="Pilih tugas yang cocok dengan waktu dan lokasi Anda. Semua upah tercatat jelas sejak awal."
                        features={workerFeatures}
                        href={login()}
                        action="Jelajahi tugas"
                        tone="worker"
                    />

                    <RoleCard
                        icon={<BriefcaseBusiness size={28} />}
                        badge="Untuk Pelaku UMKM"
                        title="Dapatkan bantuan, tepat saat dibutuhkan"
                        description="Publikasikan tugas mendadak dan temukan pekerja lokal tepercaya hanya dalam hitungan jam."
                        features={employerFeatures}
                        href={register()}
                        action="Buka lowongan UMKM"
                        tone="employer"
                    />
                </div>
            </section>

            <section
                id="cara-kerja"
                className="bg-[var(--karsa-deep-navy)] px-5 py-24 text-white lg:px-8"
            >
                <div className="mx-auto w-full max-w-[1180px]">
                    <div className="mx-auto max-w-[650px] text-center">
                        <span className="text-[10px] font-extrabold tracking-[0.18em] text-[var(--karsa-sky)]">
                            MUDAH & TERSTRUKTUR
                        </span>
                        <h2 className="mt-4 text-[30px] leading-tight font-extrabold tracking-[-0.035em] sm:text-[38px]">
                            Dari kebutuhan hingga tuntas
                        </h2>
                        <p className="mt-4 text-[12px] leading-[1.8] text-[#b8cad8]">
                            Setiap tahap tercatat untuk menjaga keamanan dan
                            keadilan kedua pihak.
                        </p>
                    </div>

                    <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {workSteps.map((step, index) => (
                            <article
                                key={step.number}
                                className="relative rounded-[16px] border border-white/10 bg-white/[0.055] p-6"
                            >
                                <span className="text-[12px] font-extrabold tracking-[0.12em] text-[var(--karsa-sky)]">
                                    {step.number}
                                </span>

                                <span className="mt-5 grid h-11 w-11 place-items-center rounded-[12px] bg-white/10 text-[var(--karsa-sky)]">
                                    {index === 0 && <Store size={21} />}
                                    {index === 1 && <MapPin size={21} />}
                                    {index === 2 && <Clock size={21} />}
                                    {index === 3 && <ShieldCheck size={21} />}
                                </span>

                                <h3 className="mt-5 text-[13px] font-bold">
                                    {step.title}
                                </h3>
                                <p className="mt-3 text-[9px] leading-[1.7] text-[#b8cad8]">
                                    {step.description}
                                </p>

                                {index < workSteps.length - 1 && (
                                    <ChevronRight
                                        size={18}
                                        className="absolute top-1/2 -right-4 hidden -translate-y-1/2 text-[var(--karsa-sky)] lg:block"
                                    />
                                )}
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section
                id="dampak"
                className="mx-auto w-full max-w-[1180px] px-5 py-24 lg:px-8"
            >
                <div className="grid items-center gap-12 rounded-[24px] bg-[var(--karsa-sky-pale)] p-7 sm:p-10 lg:grid-cols-[1.05fr_0.95fr] lg:p-14">
                    <div>
                        <KarsaBadge tone="amber">
                            <HeartHandshake size={14} />
                            Mendukung SDG 8
                        </KarsaBadge>

                        <h2 className="mt-5 max-w-[560px] text-[30px] leading-[1.2] font-extrabold tracking-[-0.035em] text-[var(--karsa-deep-navy)] sm:text-[38px]">
                            Kerja layak dimulai dari lingkungan terdekat.
                        </h2>

                        <p className="mt-5 max-w-[600px] text-[11px] leading-[1.8] text-[var(--karsa-muted)]">
                            KarsaNusa membantu menciptakan pertumbuhan ekonomi
                            yang inklusif melalui pekerjaan produktif, upah yang
                            adil, dan kesempatan yang setara.
                        </p>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <ImpactStat
                            value="80%"
                            label="lebih cepat menemukan pekerja"
                        />
                        <ImpactStat value="0%" label="potongan upah pekerja" />
                        <ImpactStat value="100%" label="kesepakatan tercatat" />
                    </div>
                </div>
            </section>

            <footer className="bg-[var(--karsa-deep-navy)] px-5 py-12 text-white lg:px-8">
                <div className="mx-auto grid w-full max-w-[1180px] items-center gap-7 text-center md:grid-cols-[auto_1fr_auto] md:text-left">
                    <KarsaLogo
                        light
                        className="mx-auto md:mx-0"
                        imageClassName="w-[86px]"
                    />

                    <p className="text-[10px] leading-relaxed text-[#b8cad8]">
                        Mendorong kemandirian ekonomi lokal,
                        <br className="hidden md:block" /> dari daerah untuk
                        Indonesia.
                    </p>

                    <div className="text-[8px] leading-relaxed text-[#8da9bd] md:text-right">
                        <span className="block">© 2026 KarsaNusa</span>
                        <span>
                            Platform Pemberdayaan UMKM & Tenaga Kerja Lokal
                        </span>
                    </div>
                </div>
            </footer>
        </>
    );
}

function SectionHeading({
    eyebrow,
    title,
    description,
}: {
    eyebrow: string;
    title: string;
    description: string;
}) {
    return (
        <div className="grid items-end gap-6 lg:grid-cols-[1fr_390px]">
            <div>
                <span className="text-[10px] font-extrabold tracking-[0.18em] text-[var(--karsa-primary)]">
                    {eyebrow}
                </span>
                <h2 className="mt-4 text-[30px] leading-tight font-extrabold tracking-[-0.035em] text-[var(--karsa-deep-navy)] sm:text-[38px]">
                    {title}
                </h2>
            </div>

            <p className="text-[11px] leading-[1.8] text-[var(--karsa-muted)] lg:text-right">
                {description}
            </p>
        </div>
    );
}

function RoleCard({
    icon,
    badge,
    title,
    description,
    features,
    href,
    action,
    tone,
}: {
    icon: ReactNode;
    badge: string;
    title: string;
    description: string;
    features: string[];
    href: string | ReturnType<typeof login>;
    action: string;
    tone: 'worker' | 'employer';
}) {
    const employer = tone === 'employer';

    return (
        <article
            className={
                employer
                    ? 'rounded-[20px] border border-[var(--karsa-border)] bg-[var(--karsa-deep-navy)] p-7 text-white shadow-[var(--karsa-shadow)] sm:p-9'
                    : 'rounded-[20px] border border-[var(--karsa-border)] bg-white p-7 shadow-[var(--karsa-shadow)] sm:p-9'
            }
        >
            <span
                className={
                    employer
                        ? 'grid h-14 w-14 place-items-center rounded-[15px] bg-white/10 text-[var(--karsa-sky)]'
                        : 'grid h-14 w-14 place-items-center rounded-[15px] bg-[var(--karsa-sky-pale)] text-[var(--karsa-primary)]'
                }
            >
                {icon}
            </span>

            <KarsaBadge tone={employer ? 'blue' : 'primary'} className="mt-6">
                {badge}
            </KarsaBadge>

            <h3
                className={
                    employer
                        ? 'mt-5 text-[22px] leading-tight font-extrabold tracking-[-0.025em] text-white'
                        : 'mt-5 text-[22px] leading-tight font-extrabold tracking-[-0.025em] text-[var(--karsa-deep-navy)]'
                }
            >
                {title}
            </h3>

            <p
                className={
                    employer
                        ? 'mt-4 text-[10px] leading-[1.8] text-[#b8cad8]'
                        : 'mt-4 text-[10px] leading-[1.8] text-[var(--karsa-muted)]'
                }
            >
                {description}
            </p>

            <ul className="mt-6 grid gap-3">
                {features.map((feature) => (
                    <li
                        key={feature}
                        className={
                            employer
                                ? 'flex items-center gap-3 text-[9px] font-semibold text-[#d9e5ee]'
                                : 'flex items-center gap-3 text-[9px] font-semibold text-[var(--karsa-slate)]'
                        }
                    >
                        <span
                            className={
                                employer
                                    ? 'grid h-6 w-6 place-items-center rounded-full bg-white/10 text-[var(--karsa-sky)]'
                                    : 'grid h-6 w-6 place-items-center rounded-full bg-[var(--karsa-sky-pale)] text-[var(--karsa-primary)]'
                            }
                        >
                            <Check size={14} />
                        </span>
                        {feature}
                    </li>
                ))}
            </ul>

            <Link
                href={href}
                className={
                    employer
                        ? 'karsa-btn mt-8 border-white/15 bg-white text-[var(--karsa-deep-navy)] hover:bg-[var(--karsa-sky-pale)]'
                        : 'karsa-btn karsa-btn-secondary mt-8'
                }
            >
                {action}
                <ArrowRight size={16} />
            </Link>
        </article>
    );
}

function ImpactStat({ value, label }: { value: string; label: string }) {
    return (
        <div className="rounded-[15px] border border-white bg-white p-4 text-center shadow-[var(--karsa-shadow)] sm:p-5">
            <strong className="block text-[20px] font-extrabold text-[var(--karsa-primary)] sm:text-[25px]">
                {value}
            </strong>
            <span className="mt-2 block text-[7px] leading-[1.5] text-[var(--karsa-muted)] sm:text-[8px]">
                {label}
            </span>
        </div>
    );
}
