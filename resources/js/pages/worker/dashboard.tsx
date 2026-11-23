import { Head, Link, usePage } from "@inertiajs/react";
import {
    ArrowRight,
    Briefcase,
    Calendar,
    ChevronRight,
    Clock,
    Heart,
    MapPin,
    Search,
    ShieldCheck,
    Star,
    Wallet,
} from "lucide-react";
import { useMemo, useState } from "react";

type ApplicationStatus = "pending" | "accepted" | "rejected" | null;

type RecommendedTask = {
    id: number;
    title: string;
    category: string | null;
    businessName: string;
    locationAddress: string | null;
    wageAmount: number | null;
    workerQuota: number | null;
    applicationStatus?: ApplicationStatus;
};

type ActiveTaskItem = {
    id: number;
    title: string;
    businessName: string;
    locationAddress: string;
    startedAgo: string;
    checkInTime: string;
    distanceText: string;
};

type WorkHistoryItem = {
    id: number;
    title: string;
    businessName: string;
    date: string;
    duration: string;
    wageAmount: number;
    rating: number;
};

type WorkerDashboardProps = {
    recommendedTasks?: RecommendedTask[];
    pendingApplications?: number;
    activeAssignments?: number;
    pendingWages?: number;
    monthlyWages?: number;
    monthlyHours?: number;
    ratingScore?: number;
    ratingCount?: number;
    activeTask?: ActiveTaskItem | null;
    recentHistory?: WorkHistoryItem[];
};

const CATEGORIES = [
    "Semua",
    "Katering",
    "Kuliner",
    "Retail",
    "Administrasi",
    "Logistik",
    "Lainnya",
];

function formatFirstName(name: string): string {
    return name.trim().split(/\s+/)[0] ?? name;
}

function formatRupiah(value: number): string {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(value);
}

function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 11) return "Selamat pagi";
    if (hour < 15) return "Selamat siang";
    if (hour < 18) return "Selamat sore";
    return "Selamat malam";
}

function getCategoryHeaderColor(category: string | null): string {
    const normalized = (category ?? "").trim().toLowerCase();

    switch (normalized) {
        case "katering":
            return "bg-[#FEF6DC]";

        case "kuliner":
            return "bg-[#FCE8E6]";

        case "retail":
            return "bg-[#ECEBFE]";

        case "administrasi":
            return "bg-[#E5F0FF]";

        case "logistik":
            return "bg-[#E6F7F1]";

        case "lainnya":
            return "bg-[#EEF3FA]";

        default:
            return "bg-[#EEF3FA]";
    }
}

function getTaskAction(task: RecommendedTask): {
    label: string;
    href: string;
    className: string;
} {
    if (task.applicationStatus === "accepted") {
        return {
            label: "Lihat Tugas",
            href: "/worker/applications",
            className: "bg-[#1E4479] text-white hover:bg-[#163561]",
        };
    }

    if (task.applicationStatus === "pending") {
        return {
            label: "Menunggu Seleksi",
            href: "/worker/applications",
            className:
                "border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100",
        };
    }

    if (task.applicationStatus === "rejected") {
        return {
            label: "Lihat Detail",
            href: `/worker/tasks/${task.id}`,
            className:
                "border border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200",
        };
    }

    return {
        label: "Lamar Tugas",
        href: `/worker/tasks/${task.id}`,
        className: "bg-[#21477F] text-white hover:bg-[#163561]",
    };
}

export default function WorkerDashboard({
    recommendedTasks = [],
    activeAssignments = 0,
    monthlyWages = 0,
    monthlyHours = 0,
    ratingScore = 0,
    ratingCount = 0,
    activeTask = null,
    recentHistory = [],
}: WorkerDashboardProps) {
    const { auth } = usePage().props as {
        auth: { user: { name: string } };
    };
    const user = auth.user;

    const [isAvailable, setIsAvailable] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("Semua");
    const [savedTaskIds, setSavedTaskIds] = useState<number[]>([]);

    const toggleSaveTask = (id: number) => {
        setSavedTaskIds((prev) =>
            prev.includes(id)
                ? prev.filter((item) => item !== id)
                : [...prev, id],
        );
    };

    const filteredTasks = useMemo(() => {
        return recommendedTasks.filter((task) => {
            const matchesCategory =
                selectedCategory === "Semua" ||
                (task.category ?? "").toLowerCase() ===
                    selectedCategory.toLowerCase();

            const q = searchQuery.trim().toLowerCase();
            const matchesSearch =
                q === "" ||
                task.title.toLowerCase().includes(q) ||
                task.businessName.toLowerCase().includes(q) ||
                (task.category ?? "").toLowerCase().includes(q);

            return matchesCategory && matchesSearch;
        });
    }, [recommendedTasks, selectedCategory, searchQuery]);

    return (
        <>
            <Head title="Dashboard Pekerja" />

            <main className="mx-auto w-full max-w-[1440px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                {/* 1. GREETING HEADER & AVAILABILITY TOGGLE */}
                <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-[#DDF3F6] px-3.5 py-1 text-xs font-semibold text-[#175B75]">
                            <ShieldCheck className="size-3.5" />
                            <span>Pekerja Terverifikasi</span>
                        </div>

                        <h1 className="text-2xl font-medium tracking-tight text-[#13294D] sm:text-[28px]">
                            {getGreeting()}, {formatFirstName(user.name)}!
                        </h1>

                        <p className="mt-1.5 text-[13px] text-[#6E829F]">
                            Ada{" "}
                            <span className="font-bold text-slate-900">
                                {recommendedTasks.length} tugas baru
                            </span>{" "}
                            di sekitar Anda hari ini.
                        </p>
                    </div>

                    {/* SWITCH SIAP MENERIMA TUGAS */}
                    <div className="flex items-center justify-between gap-4 self-start rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:self-center">
                        <div className="flex items-center gap-3">
                            <span
                                className={`size-2.5 rounded-full ${
                                    isAvailable
                                        ? "bg-emerald-500 ring-4 ring-emerald-500/15"
                                        : "bg-slate-300"
                                }`}
                            />
                            <div>
                                <p className="text-xs font-bold text-slate-900">
                                    Siap menerima tugas
                                </p>
                                <p className="text-[11px] text-slate-400">
                                    {isAvailable
                                        ? "Profilmu terlihat oleh UMKM"
                                        : "Profilmu sedang disembunyikan"}
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            role="switch"
                            aria-checked={isAvailable}
                            onClick={() => setIsAvailable((prev) => !prev)}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                                isAvailable ? "bg-[#1E4479]" : "bg-slate-200"
                            }`}
                        >
                            <span
                                className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-xs transition duration-200 ${
                                    isAvailable
                                        ? "translate-x-5"
                                        : "translate-x-0"
                                }`}
                            />
                        </button>
                    </div>
                </section>

                {/* 2. TIGA KARTU STATISTIK UTAMA */}
                <section className="grid gap-3.5 md:grid-cols-3">
                    {/* KARTU 1: JAM KERJA */}
                    <div className="flex min-h-[116px] items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#EAF1FA] text-[#1E4479]">
                            <Clock className="size-6" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-slate-500">
                                Jam kerja bulan ini
                            </p>
                            <p className="mt-1 text-[22px] font-bold tracking-tight text-slate-900">
                                {monthlyHours.toLocaleString("id-ID")} Jam
                            </p>
                            <p className="mt-1 text-[11px] text-slate-400">
                                {activeAssignments > 0
                                    ? `${activeAssignments} tugas sedang berjalan`
                                    : "Akumulasi jam kerja terverifikasi"}
                            </p>
                        </div>
                    </div>

                    {/* KARTU 2: TOTAL PENDAPATAN (HIGHLIGHT NAVY) */}
                    <div className="flex min-h-[116px] items-center gap-4 rounded-2xl bg-[#102A52] p-5 text-white shadow-sm">
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-teal-300">
                            <Wallet className="size-6" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-slate-300">
                                Total pendapatan
                            </p>
                            <p className="mt-1 text-[22px] font-bold tracking-tight text-white">
                                {formatRupiah(monthlyWages)}
                            </p>
                            <p className="mt-1 text-[11px] text-slate-300/80">
                                100% milik Anda
                            </p>
                        </div>
                    </div>

                    {/* KARTU 3: RATING PERFORMA */}
                    <div className="flex min-h-[116px] items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#EAF1FA] text-[#1E4479]">
                            <Star className="size-6" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-slate-500">
                                Rating performa
                            </p>
                            <p className="mt-1 text-[22px] font-bold tracking-tight text-slate-900">
                                {ratingScore.toLocaleString("id-ID", {
                                    minimumFractionDigits: 1,
                                    maximumFractionDigits: 1,
                                })}{" "}
                                / 5
                            </p>
                            <p className="mt-1 text-[11px] text-slate-400">
                                {ratingCount > 0
                                    ? `dari ${ratingCount} ulasan UMKM`
                                    : "Performa mitra lokal KarsaNusa"}
                            </p>
                        </div>
                    </div>
                </section>

                {/* 3. BANNER TUGAS AKTIF (MUNCUL JIKA ADA TUGAS AKTIF) */}
                {activeTask && (
                    <section className="overflow-hidden rounded-2xl border border-[#BBD4F5] bg-[#F5FAFD] shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#DCE8F8] px-6 py-3">
                            <div className="flex items-center gap-3">
                                <span className="rounded-full bg-[#DCE9FA] px-3 py-0.5 text-xs font-bold text-[#1E4479]">
                                    Sedang Berlangsung
                                </span>
                                <span className="text-xs text-slate-500">
                                    {activeTask.startedAgo}
                                </span>
                            </div>

                            <Link
                                href={`/worker/tasks/${activeTask.id}`}
                                className="inline-flex items-center gap-1 text-xs font-bold text-[#1E4479] hover:underline"
                            >
                                <span>Detail tugas</span>
                                <ChevronRight className="size-3.5" />
                            </Link>
                        </div>

                        <div className="flex flex-col justify-between gap-4 bg-white px-5 py-5 md:flex-row md:items-center">
                            <div className="flex items-start gap-4">
                                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#DCE9FA] text-[#1E4479]">
                                    <Briefcase className="size-6" />
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                                        TUGAS AKTIF
                                    </p>
                                    <h2 className="mt-0.5 text-base font-bold text-[#21477F]">
                                        {activeTask.title}
                                    </h2>
                                    <p className="mt-1 text-xs text-slate-500">
                                        <span className="font-semibold text-slate-700">
                                            {activeTask.businessName}
                                        </span>{" "}
                                        • {activeTask.locationAddress}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between gap-5 border-t border-[#DCE8F8] pt-4 md:justify-end md:border-t-0 md:pt-0">
                                <div>
                                    <div className="mb-1.5 h-1.5 w-20 overflow-hidden rounded-full bg-slate-200">
                                        <div className="h-full w-2/3 rounded-full bg-[#1E4479]" />
                                    </div>
                                    <p className="text-[11px] text-slate-400">
                                        Check-in
                                    </p>
                                    <p className="text-sm font-extrabold text-slate-900">
                                        {activeTask.checkInTime}
                                    </p>
                                </div>

                                <Link
                                    href={`/worker/tasks/${activeTask.id}`}
                                    className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-800 shadow-2xs transition hover:bg-slate-50"
                                >
                                    Check-out
                                </Link>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 border-t border-[#DCE8F8] bg-[#F5FAFD] px-5 py-2.5 text-xs">
                            <span className="inline-flex items-center gap-1.5 font-semibold text-[#1E4479]">
                                <MapPin className="size-3.5" />
                                Lokasi terverifikasi
                            </span>
                            <span className="text-slate-400">
                                {activeTask.distanceText}
                            </span>
                        </div>
                    </section>
                )}

                {/* 4. TUGAS DI SEKITAR ANDA */}
                <section className="space-y-4 pt-1">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-medium text-[#13294D]">
                                Tugas di sekitar Anda
                            </h2>
                            <p className="mt-0.5 text-xs text-slate-500">
                                Temukan pekerjaan harian yang sesuai dengan
                                waktu dan keahlianmu.
                            </p>
                        </div>

                        <Link
                            href="/worker/tasks"
                            className="inline-flex items-center gap-1.5 text-sm font-bold text-[#1E4479] hover:underline"
                        >
                            <span>Lihat semua tugas</span>
                            <ArrowRight className="size-4" />
                        </Link>
                    </div>

                    {/* SEARCH & FILTER PILLS */}
                    <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
                        <div className="relative flex-1">
                            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Cari tugas atau nama UMKM..."
                                className="h-10 w-full rounded-xl border border-slate-200 bg-white pr-4 pl-10 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#1E4479] focus:ring-2 focus:ring-[#1E4479]/15 focus:outline-none"
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            {CATEGORIES.map((category) => {
                                const active = selectedCategory === category;
                                return (
                                    <button
                                        key={category}
                                        type="button"
                                        onClick={() =>
                                            setSelectedCategory(category)
                                        }
                                        className={`rounded-xl px-3 py-2 text-[11px] font-semibold transition ${
                                            active
                                                ? "bg-[#0D254C] text-white shadow-2xs"
                                                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                        }`}
                                    >
                                        {category}
                                    </button>
                                );
                            })}

                            <div className="ml-1 inline-flex items-center gap-1.5 px-2 text-xs text-slate-500">
                                <MapPin className="size-3.5 text-slate-400" />
                                <span>
                                    Radius{" "}
                                    <strong className="text-slate-800">
                                        5 km
                                    </strong>
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* GRID KARTU LOWONGAN */}
                    {filteredTasks.length === 0 ? (
                        <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
                            <div className="flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                                <Search className="size-5" />
                            </div>
                            <h3 className="mt-4 text-sm font-bold text-slate-900">
                                Tidak ada tugas yang cocok
                            </h3>
                            <p className="mt-1 max-w-md text-xs leading-5 text-slate-500">
                                Coba ubah kata kunci pencarian atau pilih
                                kategori lain untuk melihat tugas harian dari
                                UMKM.
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {filteredTasks.map((task) => {
                                const isSaved = savedTaskIds.includes(task.id);
                                const initialLetter =
                                    task.businessName
                                        .trim()[0]
                                        ?.toUpperCase() ?? "U";
                                const action = getTaskAction(task);

                                return (
                                    <article
                                        key={task.id}
                                        className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-[#1E4479]/40 hover:shadow-md"
                                    >
                                        {/* HEADER WARNA KATEGORI */}
                                        <div
                                            className={`flex items-center justify-between px-4 pt-3 pb-7 ${getCategoryHeaderColor(
                                                task.category,
                                            )}`}
                                        >
                                            <span className="rounded-lg bg-white/95 px-2.5 py-1 text-[11px] font-bold text-slate-700 shadow-2xs">
                                                {task.category || "Umum"}
                                            </span>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    toggleSaveTask(task.id)
                                                }
                                                aria-label="Simpan tugas"
                                                className="flex size-8 items-center justify-center rounded-full bg-white/95 text-slate-500 shadow-2xs transition hover:text-rose-500"
                                            >
                                                <Heart
                                                    className={`size-4 ${
                                                        isSaved
                                                            ? "fill-rose-500 text-rose-500"
                                                            : ""
                                                    }`}
                                                />
                                            </button>
                                        </div>

                                        {/* BODY KARTU */}
                                        <div className="flex flex-1 flex-col px-4 pt-4 pb-4">
                                            {/* IDENTITAS UMKM */}
                                            <div className="flex items-center gap-3">
                                                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#0D254C] text-xs font-bold text-white">
                                                    {initialLetter}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-900">
                                                        {task.businessName}
                                                    </p>
                                                    <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-semibold text-[#1E4479]">
                                                        <ShieldCheck className="size-3" />
                                                        Terverifikasi
                                                    </p>
                                                </div>
                                            </div>

                                            {/* JUDUL TUGAS */}
                                            <h3 className="mt-3.5 line-clamp-2 text-sm font-semibold text-[#13294D]">
                                                {task.title}
                                            </h3>

                                            {/* META LOKASI & KUOTA */}
                                            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-500">
                                                <span className="inline-flex items-center gap-1">
                                                    <MapPin className="size-3.5 text-slate-400" />
                                                    <span className="line-clamp-1 max-w-[140px]">
                                                        {task.locationAddress ||
                                                            "Lokasi dekat Anda"}
                                                    </span>
                                                </span>
                                                <span className="inline-flex items-center gap-1">
                                                    <Calendar className="size-3.5 text-slate-400" />
                                                    Jadwal fleksibel
                                                </span>
                                            </div>

                                            {/* UPAH & TOMBOL AKSI */}
                                            <div className="mt-5 border-t border-slate-100 pt-4">
                                                <div className="flex items-baseline justify-between">
                                                    <div>
                                                        <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                                                            UPAH BERSIH
                                                        </p>
                                                        <p className="mt-0.5 text-base font-bold text-[#21477F]">
                                                            {task.wageAmount ===
                                                            null
                                                                ? "Kesepakatan"
                                                                : formatRupiah(
                                                                      task.wageAmount,
                                                                  )}{" "}
                                                            <span className="text-xs font-normal text-slate-400">
                                                                / tugas
                                                            </span>
                                                        </p>
                                                    </div>

                                                    <span className="text-xs font-medium text-slate-400">
                                                        {task.workerQuota ?? 1}{" "}
                                                        slot
                                                    </span>
                                                </div>

                                                <Link
                                                    href={action.href}
                                                    className={`mt-3.5 flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-xs font-semibold transition ${action.className}`}
                                                >
                                                    {action.label}
                                                </Link>
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* 5. RIWAYAT KERJA TERBARU */}
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                            <h2 className="text-base font-medium text-[#13294D]">
                                Riwayat kerja terbaru
                            </h2>
                            <p className="mt-0.5 text-xs text-slate-400">
                                Rekam jejak yang telah disetujui UMKM.
                            </p>
                        </div>

                        <Link
                            href="/worker/applications"
                            className="text-xs font-semibold text-[#21477F] hover:underline"
                        >
                            Lihat riwayat lengkap
                        </Link>
                    </div>

                    {recentHistory.length === 0 ? (
                        <div className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-8 text-center">
                            <p className="text-sm font-semibold text-slate-700">
                                Belum ada riwayat pekerjaan selesai
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                                Tugas harian yang telah kamu selesaikan dan
                                disetujui UMKM akan tercatat di sini.
                            </p>
                        </div>
                    ) : (
                        <div className="mt-5 overflow-x-auto">
                            <table className="w-full min-w-[600px] text-left text-sm">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                                        <th className="rounded-l-lg px-4 py-3">
                                            TUGAS & UMKM
                                        </th>
                                        <th className="px-4 py-3">TANGGAL</th>
                                        <th className="px-4 py-3">DURASI</th>
                                        <th className="px-4 py-3">UPAH</th>
                                        <th className="rounded-r-lg px-4 py-3">
                                            PENILAIAN
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {recentHistory.map((item) => (
                                        <tr
                                            key={item.id}
                                            className="transition hover:bg-slate-50/60"
                                        >
                                            <td className="px-4 py-3.5">
                                                <p className="font-bold text-slate-900">
                                                    {item.title}
                                                </p>
                                                <p className="mt-0.5 text-xs text-slate-400">
                                                    {item.businessName}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3.5 text-xs text-slate-600">
                                                {item.date}
                                            </td>
                                            <td className="px-4 py-3.5 text-xs text-slate-600">
                                                {item.duration}
                                            </td>
                                            <td className="px-4 py-3.5 text-xs font-bold text-slate-900">
                                                {formatRupiah(item.wageAmount)}
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-500">
                                                    <Star className="size-3.5 fill-amber-400 text-amber-400" />
                                                    {item.rating.toFixed(1)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                {/* TOMBOL FLOATING KANAN BAWAH */}
                <div className="flex justify-end pb-2">
                    <Link
                        href="/worker/applications"
                        className="inline-flex items-center gap-2 rounded-xl border border-[#BBD4F5] bg-[#E8F1FD] px-4 py-2.5 text-xs font-bold text-[#1E4479] shadow-2xs transition hover:bg-[#DCE9FA]"
                    >
                        <Star className="size-4" />
                        <span>Beri ulasan tugas terakhir</span>
                    </Link>
                </div>
            </main>
        </>
    );
}
