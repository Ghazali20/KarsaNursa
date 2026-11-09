import { Head, Link, usePage } from '@inertiajs/react';
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
import { KarsaBadge } from '@/components/karsa/karsa-ui';

type RecommendedTask = {
    id: number;
    title: string;
    category: string | null;
    businessName: string;
    locationAddress: string | null;
    wageAmount: number | null;
    workerQuota: number | null;
};

type WorkerDashboardProps = {
    recommendedTasks?: RecommendedTask[];
    pendingApplications?: number;
    activeAssignments?: number;
    pendingWages?: number;
    monthlyWages?: number;
};

function formatFirstName(name: string): string {
    return name.trim().split(/\s+/)[0] ?? name;
}

function formatRupiah(value: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(value);
}

export default function WorkerDashboard({
    recommendedTasks = [],
    pendingApplications = 0,
    activeAssignments = 0,
    pendingWages = 0,
    monthlyWages = 0,
}: WorkerDashboardProps) {
    const { auth } = usePage().props;
    const user = auth.user;

    return (
        <>
            <Head title="Dashboard Pencari Kerja" />

            <main className="flex flex-1 flex-col bg-slate-50/70">
                <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                    {/* HEADER */}
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
                                    Selamat datang di Website KarsaNusa
                                </p>

                                <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
                                    Halo, {formatFirstName(user.name)}
                                </h1>

                                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">
                                    Temukan tugas harian yang tersedia dan
                                    pantau seluruh aktivitas pekerjaan dalam
                                    satu tempat.
                                </p>
                            </div>

                            <Link
                                href="/worker/tasks"
                                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[var(--karsa-deep-navy)] transition hover:bg-slate-100"
                            >
                                <Search className="size-4" />
                                Cari tugas
                            </Link>
                        </div>
                    </header>

                    {/* RINGKASAN AKTIVITAS */}
                    <section aria-labelledby="worker-summary-heading">
                        <div className="mb-4">
                            <h2
                                id="worker-summary-heading"
                                className="text-lg font-bold text-slate-950"
                            >
                                Ringkasan aktivitas
                            </h2>

                            <Link
                                href="/worker/applications"
                                className="mt-3 inline-flex text-sm font-bold text-blue-700 hover:underline"
                            >
                                Lihat riwayat lamaran
                            </Link>

                            <p className="mt-1 text-sm text-slate-500">
                                Pantau perkembangan lamaran dan aktivitas
                                pekerjaan Anda.
                            </p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            <DashboardStatCard
                                label="Lamaran aktif"
                                value={pendingApplications}
                                description="Lamaran yang sedang menunggu proses seleksi."
                                icon={ClipboardList}
                                tone="blue"
                            />

                            <DashboardStatCard
                                label="Tugas diterima"
                                value={activeAssignments}
                                description="Tugas diterima dengan upah yang masih menunggu pembayaran."
                                icon={BriefcaseBusiness}
                                tone="green"
                            />

                            <DashboardStatCard
                                label="Upah menunggu"
                                value={formatRupiah(pendingWages)}
                                description="Upah pekerjaan diterima yang belum dibayar UMKM."
                                icon={Clock3}
                                tone="amber"
                            />

                            <DashboardStatCard
                                label="Upah bulan ini"
                                value={formatRupiah(monthlyWages)}
                                description="Total upah yang dibayar pada bulan berjalan."
                                icon={WalletCards}
                                tone="violet"
                            />
                        </div>
                    </section>

                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.75fr)]">
                        {/* TUGAS TERSEDIA */}
                        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-950">
                                        Tugas terbaru tersedia
                                    </h2>

                                    <p className="mt-1 text-sm text-slate-500">
                                        Pekerjaan terbaru yang dipublikasikan
                                        oleh UMKM.
                                    </p>
                                </div>

                                <Link
                                    href="/worker/tasks"
                                    className="text-sm font-bold text-blue-700 hover:underline"
                                >
                                    Lihat semua tugas
                                </Link>
                            </div>

                            {recommendedTasks.length === 0 ? (
                                <div className="mt-8 flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
                                    <div className="flex size-14 items-center justify-center rounded-2xl bg-white text-slate-500 shadow-sm">
                                        <Search className="size-6" />
                                    </div>

                                    <h3 className="mt-5 font-bold text-slate-950">
                                        Belum ada tugas tersedia
                                    </h3>

                                    <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                                        Tugas yang telah dipublikasikan UMKM dan
                                        masih menerima lamaran akan muncul di
                                        sini.
                                    </p>
                                </div>
                            ) : (
                                <div className="mt-6 space-y-4">
                                    {recommendedTasks.map((task) => (
                                        <article
                                            key={task.id}
                                            className="rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:border-blue-300 hover:bg-white"
                                        >
                                            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                                                {task.category || 'Lainnya'}
                                            </span>

                                            <h3 className="mt-3 text-lg font-bold text-slate-950">
                                                {task.title}
                                            </h3>

                                            <p className="mt-1 text-sm font-semibold text-blue-700">
                                                {task.businessName}
                                            </p>

                                            <div className="mt-4 space-y-2 text-sm text-slate-600">
                                                <div className="flex items-start gap-2">
                                                    <MapPin className="mt-0.5 size-4 shrink-0" />
                                                    <span>
                                                        {task.locationAddress ||
                                                            'Lokasi belum tersedia'}
                                                    </span>
                                                </div>

                                                <div>
                                                    Kuota:{' '}
                                                    {task.workerQuota ?? '-'}{' '}
                                                    pekerja
                                                </div>

                                                <div className="font-bold text-emerald-700">
                                                    {task.wageAmount === null
                                                        ? 'Upah belum tersedia'
                                                        : formatRupiah(
                                                              task.wageAmount,
                                                          )}
                                                </div>
                                            </div>

                                            <Link
                                                href={`/worker/tasks/${task.id}`}
                                                className="mt-4 inline-flex rounded-xl bg-[var(--karsa-deep-navy)] px-4 py-2.5 text-sm font-bold text-white hover:opacity-90"
                                            >
                                                Lihat Detail Tugas
                                            </Link>
                                        </article>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* LANGKAH BERIKUTNYA */}
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
                                            lokasi Anda sesuai.
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
                                            Cari pekerjaan yang sesuai dengan
                                            kebutuhan Anda.
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
                                            Lamar tugas dan pantau proses
                                            seleksi UMKM.
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
