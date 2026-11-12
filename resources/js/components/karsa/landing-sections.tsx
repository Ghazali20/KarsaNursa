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
} from 'lucide-react';
import type { ReactNode } from 'react';

const workerFeatures = [
    'Lowongan di sekitar lokasimu',
    'Jadwal fleksibel dan upah pasti',
    'Riwayat kerja terverifikasi',
];

const employerFeatures = [
    'Pilih dari pekerja terverifikasi',
    'Kelola absensi dan bukti kerja',
    'Pencatatan upah otomatis',
];

const workSteps = [
    {
        number: '01',
        title: 'Pasang atau pilih tugas',
        description:
            'UMKM pasang tugas lengkap dengan lokasi, jam, dan upah, pekerja memilih tugas yang sesuai lokasi.',
    },
    {
        number: '02',
        title: 'Sepakati dan mulai	',
        description:
            'Pencari kerja check-in di lokasi, dan upah yang disepakati langsung tercatat di platform.',
    },
    {
        number: '03',
        title: 'Kerjakan dan laporkan',
        description:
            'Unggah foto bukti dan catatan kerja, lalu check-out saat tugas selesai.',
    },
    {
        number: '04',
        title: 'Upah tercatat, saling menilai',
        description:
            'Hasil kerja dikonfirmasi, upah dicatat, lalu pencari kerja dan UMKM bisa saling memberi ulasan.',
    },
];

export function LandingSections() {
    return (
        <>
            <section
                id="solusi"
                className="mx-auto w-full max-w-[1440px] px-4 py-16 sm:px-7 sm:py-20 lg:px-6 lg:py-24 xl:px-4"
            >
                <SectionHeading
                    eyebrow="SATU PLATFORM, DUA MANFAAT"
                    title="Saling bantu, sama-sama bertumbuh"
                    description="Dibuat untuk kerja harian dan tugas singkat, bukan proyek panjang yang rumit."
                />

                <div className="mt-10 grid gap-5 lg:mt-12 lg:grid-cols-2">
                    <RoleCard
                        icon={<Users size={28} />}
                        badge="Untuk Pencari Kerja"
                        title="Cari penghasilan tambahan di sekitar anda"
                        description="Pilih tugas yang pas dengan jadwal dan lokasimu. Upah sudah jelas sejak awal."
                        features={workerFeatures}
                        href={login()}
                        action="Jelajahi tugas"
                        tone="worker"
                    />

                    <RoleCard
                        icon={<BriefcaseBusiness size={28} />}
                        badge="Untuk Pemilik Usaha (UMKM)"
                        title="Cari tenaga saat usahamu butuh bantuan"
                        description="Pasang tugas dadakan dan temukan pekerja lokal dalam hitungan jam."
                        features={employerFeatures}
                        href={register()}
                        action="Pasang Lowongan"
                        tone="employer"
                    />
                </div>
            </section>

            <section
                id="cara-kerja"
                className="bg-[var(--karsa-deep-navy)] px-5 py-24 text-white lg:px-8"
            >
                <div className="mx-auto w-full max-w-[1440px]">
                    <div className="mx-auto max-w-[900px] text-center">
                        <span className="text-[16px] font-extrabold tracking-[0.18em] text-[var(--karsa-sky)]">
                            CARA KERJA
                        </span>
                        <h2 className="mt-4 text-center text-[clamp(1.6rem,2.8vw,2.6rem)] leading-tight font-extrabold tracking-[-0.02em] text-balance">
                            Dari pasang tugas hingga upah tercatat
                        </h2>
                        <p className="mx-auto mt-4 max-w-[650px] text-[14px] leading-[1.8] text-[#b8cad8]">
                            Setiap langkah tercatat, supaya aman dan adil untuk
                            pencari kerja maupun pemilik usaha.
                        </p>
                    </div>

                    <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {workSteps.map((step, index) => (
                            <article
                                key={step.number}
                                className="relative rounded-[16px] border border-white/10 bg-white/[0.055] p-6"
                            >
                                <span className="text-[14px] font-extrabold tracking-[0.12em] text-[var(--karsa-sky)]">
                                    {step.number}
                                </span>

                                <span className="mt-5 grid h-11 w-11 place-items-center rounded-[12px] bg-white/10 text-[var(--karsa-sky)]">
                                    {index === 0 && <Store size={21} />}
                                    {index === 1 && <MapPin size={21} />}
                                    {index === 2 && <Clock size={21} />}
                                    {index === 3 && <ShieldCheck size={21} />}
                                </span>

                                <h3 className="mt-5 text-[16px] font-bold">
                                    {step.title}
                                </h3>
                                <p className="mt-3 text-[16px] leading-[1.7] text-[#b8cad8]">
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
                className="mx-auto w-full max-w-[1440px] px-4 py-16 sm:px-7 sm:py-20 lg:px-6 lg:py-24 xl:px-4"
            >
                <div className="grid items-center gap-12 rounded-[24px] bg-[var(--karsa-sky-pale)] p-7 sm:p-10 lg:grid-cols-[1.05fr_0.95fr] lg:p-14">
                    <div>
                        <KarsaBadge tone="amber">
                            <HeartHandshake size={14} />
                            Mendukung SDG 8
                        </KarsaBadge>

                        <h2 className="mt-5 max-w-[560px] text-[clamp(1.85rem,3.1vw,2.9rem)] leading-[1.2] font-extrabold tracking-[-0.035em] text-[var(--karsa-deep-navy)]">
                            Kerja layak dimulai dari lingkungan terdekat.
                        </h2>

                        <p className="mt-5 max-w-[600px] text-[15px] leading-[1.8] text-[var(--karsa-muted)]">
                            KarsaNusa mendukung pertumbuhan ekonomi lokal lewat
                            pekerjaan harian yang layak, upah yang jelas, dan
                            kesempatan yang setara bagi pencari kerja maupun
                            UMKM.
                        </p>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <ImpactStat
                            value="8 dari 10"
                            label="responden uji coba menilai pencarian lebih cepat"
                        />
                        <ImpactStat value="0%" label="potongan upah pekerja" />
                        <ImpactStat value="100%" label="kesepakatan tercatat" />
                    </div>
                </div>
            </section>

            <footer className="bg-[var(--karsa-deep-navy)] px-4 py-12 text-white sm:px-7 lg:px-6 xl:px-4">
                <div className="mx-auto grid w-full max-w-[1440px] items-center gap-7 text-center md:grid-cols-[auto_1fr_auto] md:text-left">
                    <KarsaLogo
                        light
                        className="mx-auto md:mx-0"
                        imageClassName="w-[110px]"
                    />

                    <p className="text-[16px] leading-relaxed text-[#b8cad8]">
                        Mendorong kemandirian ekonomi lokal,
                        <br className="hidden md:block" /> dari daerah untuk
                        Indonesia.
                    </p>

                    <div className="text-[14px] leading-relaxed text-[#8da9bd] md:text-right">
                        <span className="block">© 2026 KarsaNusa</span>
                        <span>
                            Platform Kerja Harian untuk UMKM & Pencari Kerja
                            Lokal
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
                <span className="text-[16px] font-extrabold tracking-[0.18em] text-[var(--karsa-primary)]">
                    {eyebrow}
                </span>
                <h2 className="mt-4 text-[30px] leading-tight font-extrabold tracking-[-0.035em] text-[var(--karsa-deep-navy)] sm:text-[38px]">
                    {title}
                </h2>
            </div>

            <p className="text-[15px] leading-[1.8] text-[var(--karsa-muted)] lg:text-right">
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
                        ? 'mt-5 text-[23px] leading-tight font-extrabold tracking-[-0.025em] text-white'
                        : 'mt-5 text-[23px] leading-tight font-extrabold tracking-[-0.025em] text-[var(--karsa-deep-navy)]'
                }
            >
                {title}
            </h3>

            <p
                className={
                    employer
                        ? 'mt-4 text-[16px] leading-[1.8] text-[#b8cad8]'
                        : 'mt-4 text-[16px] leading-[1.8] text-[var(--karsa-muted)]'
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
                                ? 'flex items-center gap-3 text-[16px] font-semibold text-[#d9e5ee]'
                                : 'flex items-center gap-3 text-[16px] font-semibold text-[var(--karsa-slate)]'
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
            <strong className="block text-[22px] font-extrabold text-[var(--karsa-primary)] sm:text-[27px]">
                {value}
            </strong>
            <span className="mt-2 block text-[14px] leading-[1.5] text-[var(--karsa-muted)] sm:text-[14px]">
                {label}
            </span>
        </div>
    );
}
