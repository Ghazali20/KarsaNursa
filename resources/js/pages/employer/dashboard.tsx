import { Head, usePage } from '@inertiajs/react';
import {
    BriefcaseBusiness,
    CircleCheckBig,
    ClipboardPlus,
    Clock3,
    Users,
    WalletCards,
} from 'lucide-react';
import { DashboardStatCard } from '@/components/dashboard/dashboard-stat-card';
import { KarsaBadge, KarsaButton } from '@/components/karsa/karsa-ui';

function formatFirstName(name: string): string {
    return name.trim().split(/\s+/)[0] ?? name;
}

export default function EmployerDashboard() {
    const { auth } = usePage().props;
    const user = auth.user;

    return (
        <>
            <Head title="Dashboard UMKM" />

            <main className="flex flex-1 flex-col bg-slate-50/70">
                <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                    <header className="overflow-hidden rounded-3xl bg-[var(--karsa-deep-navy)] px-6 py-7 text-white shadow-sm sm:px-8 sm:py-8">
                        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
                            <div>
                                <div className="mb-4 flex flex-wrap items-center gap-2">
                                    <KarsaBadge tone="primary">
                                        Pemilik UMKM
                                    </KarsaBadge>

                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                                        <CircleCheckBig className="size-3.5" />
                                        Usaha terverifikasi
                                    </span>
                                </div>

                                <p className="text-sm font-medium text-white/70">
                                    Selamat datang kembali
                                </p>

                                <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
                                    Halo, {formatFirstName(user.name)}
                                </h1>

                                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">
                                    Kelola kebutuhan tenaga kerja harian, pantau
                                    pelamar, dan rekap pengeluaran usaha Anda.
                                </p>
                            </div>

                            <KarsaButton
                                disabled
                                className="shrink-0 disabled:cursor-not-allowed disabled:opacity-60"
                                icon={<ClipboardPlus className="size-4" />}
                            >
                                Buat tugas baru
                            </KarsaButton>
                        </div>
                    </header>

                    <section aria-labelledby="employer-summary-heading">
                        <div className="mb-4">
                            <h2
                                id="employer-summary-heading"
                                className="text-lg font-bold text-slate-950"
                            >
                                Ringkasan operasional
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Data akan tersedia setelah fitur publikasi tugas
                                dikembangkan.
                            </p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            <DashboardStatCard
                                label="Tugas aktif"
                                value={0}
                                description="Postingan tugas yang masih menerima pelamar."
                                icon={BriefcaseBusiness}
                                tone="blue"
                            />

                            <DashboardStatCard
                                label="Pelamar baru"
                                value={0}
                                description="Lamaran yang belum diperiksa oleh UMKM."
                                icon={Users}
                                tone="green"
                            />

                            <DashboardStatCard
                                label="Menunggu persetujuan"
                                value={0}
                                description="Bukti kerja yang perlu diperiksa."
                                icon={Clock3}
                                tone="amber"
                            />

                            <DashboardStatCard
                                label="Pengeluaran bulan ini"
                                value="Rp0"
                                description="Total upah pekerjaan yang telah disetujui."
                                icon={WalletCards}
                                tone="violet"
                            />
                        </div>
                    </section>

                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.75fr)]">
                        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div>
                                <h2 className="text-lg font-bold text-slate-950">
                                    Tugas terbaru
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Postingan tugas terbaru akan muncul di sini.
                                </p>
                            </div>

                            <div className="mt-8 flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
                                <div className="flex size-14 items-center justify-center rounded-2xl bg-white text-slate-500 shadow-sm">
                                    <BriefcaseBusiness className="size-6" />
                                </div>

                                <h3 className="mt-5 font-bold text-slate-950">
                                    Belum ada tugas yang dibuat
                                </h3>

                                <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                                    Setelah fitur publikasi micro-task tersedia,
                                    Anda dapat membuat dan mengelola tugas dari
                                    halaman ini.
                                </p>

                                <KarsaButton
                                    disabled
                                    className="mt-5 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    Buat tugas pertama
                                </KarsaButton>
                            </div>
                        </section>

                        <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="text-lg font-bold text-slate-950">
                                Alur penggunaan
                            </h2>

                            <div className="mt-5 space-y-4">
                                <div className="flex gap-3">
                                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                                        1
                                    </span>

                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">
                                            Publikasikan tugas
                                        </p>
                                        <p className="mt-1 text-xs leading-5 text-slate-500">
                                            Masukkan lokasi, jadwal, kuota, dan
                                            nominal upah.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                                        2
                                    </span>

                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">
                                            Seleksi pelamar
                                        </p>
                                        <p className="mt-1 text-xs leading-5 text-slate-500">
                                            Tinjau profil dan pilih pekerja yang
                                            sesuai.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-700">
                                        3
                                    </span>

                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">
                                            Verifikasi pekerjaan
                                        </p>
                                        <p className="mt-1 text-xs leading-5 text-slate-500">
                                            Periksa bukti kerja dan validasi
                                            upah pekerja.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </aside>
                    </div>
                </div>
            </main>
        </>
    );
}
