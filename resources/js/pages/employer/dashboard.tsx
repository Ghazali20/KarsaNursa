import { Head, Link, usePage } from '@inertiajs/react';
import {
    BriefcaseBusiness,
    CircleCheckBig,
    ClipboardPlus,
    Clock3,
    Users,
    WalletCards,
} from 'lucide-react';

import { DashboardStatCard } from '@/components/dashboard/dashboard-stat-card';
import { KarsaBadge } from '@/components/karsa/karsa-ui';

type RecentTask = {
    id: number;
    title: string;
    category: string | null;
    status: 'draft' | 'published';
    workerQuota: number | null;
    wageAmount: number | null;
};

type EmployerDashboardProps = {
    stats: {
        activeTasks: number;
        pendingApplicants: number;
        pendingPayments: number;
        monthlyExpenses: number;
    };
    recentTasks: RecentTask[];
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

export default function EmployerDashboard({
    stats,
    recentTasks,
}: EmployerDashboardProps) {
    const { auth } = usePage().props;
    const user = auth.user;

    const activeTasks = stats?.activeTasks ?? 0;
    const pendingApplicants = stats?.pendingApplicants ?? 0;
    const pendingPayments = stats?.pendingPayments ?? 0;
    const monthlyExpenses = stats?.monthlyExpenses ?? 0;
    const safeRecentTasks = recentTasks ?? [];

    return (
        <>
            <Head title="Dashboard UMKM" />

            <main className="flex flex-1 flex-col bg-slate-50/70">
                <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                    {/* HEADER */}
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

                            <Link
                                href="/employer/tasks/create"
                                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[var(--karsa-deep-navy)] transition hover:bg-slate-100"
                            >
                                <ClipboardPlus className="size-4" />
                                Buat tugas baru
                            </Link>
                        </div>
                    </header>

                    {/* RINGKASAN OPERASIONAL */}
                    <section aria-labelledby="employer-summary-heading">
                        <div className="mb-4">
                            <h2
                                id="employer-summary-heading"
                                className="text-lg font-bold text-slate-950"
                            >
                                Ringkasan operasional
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Pantau perkembangan tugas dan aktivitas usaha
                                Anda melalui dashboard ini.
                            </p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            <DashboardStatCard
                                label="Tugas aktif"
                                value={activeTasks}
                                description="Postingan tugas yang masih menerima pelamar."
                                icon={BriefcaseBusiness}
                                tone="blue"
                            />

                            <DashboardStatCard
                                label="Pelamar baru"
                                value={pendingApplicants}
                                description="Lamaran yang belum diperiksa oleh UMKM."
                                icon={Users}
                                tone="green"
                            />

                            <DashboardStatCard
                                label="Menunggu pembayaran"
                                value={pendingPayments}
                                description="Upah pekerja diterima yang belum dicatat sebagai dibayar."
                                icon={Clock3}
                                tone="amber"
                            />

                            <DashboardStatCard
                                label="Pengeluaran bulan ini"
                                value={formatRupiah(monthlyExpenses)}
                                description="Total upah yang dicatat sudah dibayar pada bulan ini."
                                icon={WalletCards}
                                tone="violet"
                            />
                        </div>
                    </section>

                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.75fr)]">
                        {/* TUGAS TERBARU */}
                        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div>
                                <h2 className="text-lg font-bold text-slate-950">
                                    Tugas terbaru
                                </h2>

                                <Link
                                    href="/employer/tasks"
                                    className="mt-3 inline-flex text-sm font-bold text-blue-700 hover:underline"
                                >
                                    Lihat semua tugas
                                </Link>

                                <p className="mt-1 text-sm text-slate-500">
                                    Daftar tugas terbaru yang dibuat oleh usaha
                                    Anda.
                                </p>
                            </div>

                            {safeRecentTasks.length === 0 ? (
                                <div className="mt-8 flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
                                    <div className="flex size-14 items-center justify-center rounded-2xl bg-white text-slate-500 shadow-sm">
                                        <BriefcaseBusiness className="size-6" />
                                    </div>

                                    <h3 className="mt-5 font-bold text-slate-950">
                                        Belum ada tugas yang dibuat
                                    </h3>

                                    <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                                        Buat dan ajukan tugas harian pertama
                                        untuk menemukan pekerja yang sesuai.
                                    </p>

                                    <Link
                                        href="/employer/tasks/create"
                                        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[var(--karsa-deep-navy)] px-5 py-3 text-sm font-bold text-white transition hover:opacity-90"
                                    >
                                        <ClipboardPlus className="size-4" />
                                        Buat tugas pertama
                                    </Link>
                                </div>
                            ) : (
                                <div className="mt-6 space-y-3">
                                    {safeRecentTasks.map((task) => (
                                        <div
                                            key={task.id}
                                            className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-blue-200 hover:shadow-sm"
                                        >
                                            {/* STATUS DAN KATEGORI */}
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span
                                                    className={
                                                        task.status ===
                                                        'published'
                                                            ? 'rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700'
                                                            : 'rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700'
                                                    }
                                                >
                                                    {task.status === 'published'
                                                        ? 'Dipublikasikan'
                                                        : 'Draft'}
                                                </span>

                                                {task.category && (
                                                    <span className="text-xs text-slate-500">
                                                        {task.category}
                                                    </span>
                                                )}
                                            </div>

                                            {/* JUDUL TUGAS */}
                                            <h3 className="mt-3 text-base font-bold text-slate-950">
                                                {task.title}
                                            </h3>

                                            {/* INFORMASI KUOTA DAN UPAH */}
                                            <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-500">
                                                {task.workerQuota !== null && (
                                                    <span>
                                                        Kuota:{' '}
                                                        {task.workerQuota}{' '}
                                                        pekerja
                                                    </span>
                                                )}

                                                {task.wageAmount !== null && (
                                                    <span>
                                                        Upah:{' '}
                                                        {formatRupiah(
                                                            task.wageAmount,
                                                        )}
                                                    </span>
                                                )}
                                            </div>

                                            {/* TOMBOL KELOLA PELAMAR */}
                                            {task.status === 'published' && (
                                                <Link
                                                    href={`/employer/tasks/${task.id}/applications`}
                                                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2.5 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
                                                >
                                                    <Users className="size-4" />
                                                    Kelola Pelamar
                                                </Link>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* ALUR PENGGUNAAN */}
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
                                            Ajukan tugas
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
