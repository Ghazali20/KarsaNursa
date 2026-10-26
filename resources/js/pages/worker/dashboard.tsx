import { Head, usePage } from '@inertiajs/react';
import {
    BriefcaseBusiness,
    CircleCheckBig,
    ClipboardList,
    Clock3,
    MapPin,
    Search,
    WalletCards,
} from 'lucide-react';
import { DashboardStatCard } from '@/components/dashboard/dashboard-stat-card';
import { KarsaBadge, KarsaButton } from '@/components/karsa/karsa-ui';

function formatFirstName(name: string): string {
    return name.trim().split(/\s+/)[0] ?? name;
}

export default function WorkerDashboard() {
    const { auth } = usePage().props;
    const user = auth.user;

    return (
        <>
            <Head title="Dashboard Pekerja" />

            <main className="flex flex-1 flex-col bg-slate-50/70">
                <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                    <header className="overflow-hidden rounded-3xl bg-[var(--karsa-deep-navy)] px-6 py-7 text-white shadow-sm sm:px-8 sm:py-8">
                        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
                            <div>
                                <div className="mb-4 flex flex-wrap items-center gap-2">
                                    <KarsaBadge tone="primary">
                                        Pencari Kerja
                                    </KarsaBadge>

                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                                        <CircleCheckBig className="size-3.5" />
                                        Akun terverifikasi
                                    </span>
                                </div>

                                <p className="text-sm font-medium text-white/70">
                                    Selamat datang kembali
                                </p>

                                <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
                                    Halo, {formatFirstName(user.name)}
                                </h1>

                                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">
                                    Temukan tugas harian di sekitar Anda dan
                                    pantau seluruh aktivitas pekerjaan dalam
                                    satu tempat.
                                </p>
                            </div>

                            <KarsaButton
                                disabled
                                className="shrink-0 disabled:cursor-not-allowed disabled:opacity-60"
                                icon={<Search className="size-4" />}
                            >
                                Cari tugas
                            </KarsaButton>
                        </div>
                    </header>

                    <section aria-labelledby="worker-summary-heading">
                        <div className="mb-4 flex items-end justify-between gap-4">
                            <div>
                                <h2
                                    id="worker-summary-heading"
                                    className="text-lg font-bold text-slate-950"
                                >
                                    Ringkasan aktivitas
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Data akan diperbarui setelah fitur tugas
                                    tersedia.
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            <DashboardStatCard
                                label="Lamaran aktif"
                                value={0}
                                description="Lamaran yang sedang menunggu proses seleksi."
                                icon={ClipboardList}
                                tone="blue"
                            />

                            <DashboardStatCard
                                label="Tugas berjalan"
                                value={0}
                                description="Tugas yang telah diterima dan belum selesai."
                                icon={BriefcaseBusiness}
                                tone="green"
                            />

                            <DashboardStatCard
                                label="Menunggu persetujuan"
                                value={0}
                                description="Bukti kerja yang sedang ditinjau UMKM."
                                icon={Clock3}
                                tone="amber"
                            />

                            <DashboardStatCard
                                label="Total upah"
                                value="Rp0"
                                description="Upah dari pekerjaan yang sudah disetujui."
                                icon={WalletCards}
                                tone="violet"
                            />
                        </div>
                    </section>

                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.75fr)]">
                        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-950">
                                        Tugas di sekitar Anda
                                    </h2>

                                    <p className="mt-1 text-sm text-slate-500">
                                        Rekomendasi tugas berdasarkan lokasi
                                        akan muncul di sini.
                                    </p>
                                </div>

                                <div className="flex size-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                                    <MapPin className="size-5" />
                                </div>
                            </div>

                            <div className="mt-8 flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
                                <div className="flex size-14 items-center justify-center rounded-2xl bg-white text-slate-500 shadow-sm">
                                    <Search className="size-6" />
                                </div>

                                <h3 className="mt-5 font-bold text-slate-950">
                                    Belum ada rekomendasi tugas
                                </h3>

                                <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                                    Rekomendasi akan tersedia setelah fitur
                                    publikasi dan eksplorasi micro-task selesai
                                    dikembangkan.
                                </p>
                            </div>
                        </section>

                        <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="text-lg font-bold text-slate-950">
                                Langkah berikutnya
                            </h2>

                            <div className="mt-5 space-y-4">
                                <div className="flex gap-3">
                                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                                        1
                                    </span>

                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">
                                            Lengkapi profil
                                        </p>
                                        <p className="mt-1 text-xs leading-5 text-slate-500">
                                            Pastikan informasi kemampuan dan
                                            lokasi Anda sudah sesuai.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                                        2
                                    </span>

                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">
                                            Temukan tugas
                                        </p>
                                        <p className="mt-1 text-xs leading-5 text-slate-500">
                                            Cari tugas berdasarkan kategori,
                                            jadwal, upah, dan jarak.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-700">
                                        3
                                    </span>

                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">
                                            Ajukan lamaran
                                        </p>
                                        <p className="mt-1 text-xs leading-5 text-slate-500">
                                            Pantau hasil seleksi langsung dari
                                            dashboard Anda.
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
