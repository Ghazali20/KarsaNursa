import { Head, Link } from '@inertiajs/react';
import {
    BriefcaseBusiness,
    Clock3,
    Heart,
    ListFilter,
    MapPin,
    Search,
    ShieldCheck,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type Task = {
    id: number;
    title: string;
    category: string | null;
    description: string | null;
    locationAddress: string | null;
    workerQuota: number | null;
    wageAmount: number | null;
    businessName: string;
    applicationDeadline: string | null;
    acceptedCount?: number;
    remainingQuota?: number;
    isFull?: boolean;
    startsAt?: string | null;
    endsAt?: string | null;
    latitude?: number | string | null;
    longitude?: number | string | null;
};

type Props = { tasks: Task[] };
type Category = 'Semua' | 'Katering' | 'Laundry' | 'Toko' | 'Bengkel';
type SortOption =
    | 'newest'
    | 'wage-high'
    | 'wage-low'
    | 'start-soon'
    | 'nearest';
type Location = { latitude: number; longitude: number };

const categories: Category[] = [
    'Semua',
    'Katering',
    'Laundry',
    'Toko',
    'Bengkel',
];

const FAVORITES_KEY = 'karsanursa:worker:favorites';

const rupiah = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
});

function parseTaskDate(value: string | null | undefined): Date | null {
    if (!value) return null;

    // Format tanggal dari Controller Laravel: d/m/Y H:i.
    const local = value.match(
        /^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?$/,
    );
    const date = local
        ? new Date(
              Number(local[3]),
              Number(local[2]) - 1,
              Number(local[1]),
              Number(local[4] ?? 0),
              Number(local[5] ?? 0),
          )
        : new Date(value);

    return Number.isNaN(date.getTime()) ? null : date;
}

function shortSchedule(value: string | null | undefined): string {
    const date = parseTaskDate(value);
    if (!date) return 'Jadwal belum tersedia';

    const current = new Date();
    const today = new Date(
        current.getFullYear(),
        current.getMonth(),
        current.getDate(),
    );
    const taskDay = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
    );
    const dayDifference = Math.round(
        (taskDay.getTime() - today.getTime()) / 86400000,
    );
    const time = new Intl.DateTimeFormat('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).format(date);

    if (dayDifference === 0) return `Hari ini · ${time}`;
    if (dayDifference === 1) return `Besok · ${time}`;

    return `${new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
    }).format(date)} · ${time}`;
}

function durationLabel(task: Task): string {
    const start = parseTaskDate(task.startsAt);
    const end = parseTaskDate(task.endsAt);
    if (!start || !end || end.getTime() <= start.getTime()) {
        return 'Durasi belum ada';
    }

    const hours = (end.getTime() - start.getTime()) / 3600000;
    return `${new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 }).format(hours)} jam`;
}

function categoryMatches(value: string | null, selected: Category): boolean {
    if (selected === 'Semua') return true;
    const text = (value ?? '').toLowerCase();

    const aliases: Record<Exclude<Category, 'Semua'>, string[]> = {
        Katering: ['katering', 'catering', 'kuliner', 'makanan'],
        Laundry: ['laundry', 'binatu'],
        Toko: ['toko', 'retail', 'kelontong'],
        Bengkel: ['bengkel', 'otomotif'],
    };

    return aliases[selected].some((name) => text.includes(name));
}

function cardTone(category: string | null): string {
    const text = (category ?? '').toLowerCase();
    if (text.includes('laundry') || text.includes('binatu'))
        return 'bg-[#e3efff]';
    if (text.includes('toko') || text.includes('retail')) return 'bg-[#eeedff]';
    if (text.includes('bengkel') || text.includes('otomotif'))
        return 'bg-[#e5f4ed]';
    if (
        text.includes('katering') ||
        text.includes('kuliner') ||
        text.includes('makanan')
    ) {
        return 'bg-[#fff6d5]';
    }
    return 'bg-[#eff3fc]';
}

function coordinatesOf(task: Task): Location | null {
    // Angka 0 valid untuk koordinat, tetapi null/kosong bukan.
    if (
        task.latitude === null ||
        task.latitude === undefined ||
        task.latitude === ''
    )
        return null;
    if (
        task.longitude === null ||
        task.longitude === undefined ||
        task.longitude === ''
    )
        return null;

    const latitude = Number(task.latitude);
    const longitude = Number(task.longitude);
    if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude) ||
        Math.abs(latitude) > 90 ||
        Math.abs(longitude) > 180
    ) {
        return null;
    }
    return { latitude, longitude };
}

function distanceKm(from: Location, to: Location): number {
    // Haversine: jarak garis lurus; bukan jarak tempuh melalui jalan.
    const radians = (degrees: number) => (degrees * Math.PI) / 180;
    const deltaLatitude = radians(to.latitude - from.latitude);
    const deltaLongitude = radians(to.longitude - from.longitude);
    const factor =
        Math.sin(deltaLatitude / 2) ** 2 +
        Math.cos(radians(from.latitude)) *
            Math.cos(radians(to.latitude)) *
            Math.sin(deltaLongitude / 2) ** 2;

    return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(factor)));
}

export default function WorkerTasksIndex({ tasks }: Props) {
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState<Category>('Semua');
    const [sort, setSort] = useState<SortOption>('newest');
    const [showFilters, setShowFilters] = useState(false);
    const [savedIds, setSavedIds] = useState<number[]>([]);
    const [location, setLocation] = useState<Location | null>(null);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [requestingLocation, setRequestingLocation] = useState(false);
    const [radius, setRadius] = useState(5);
    const [radiusEnabled, setRadiusEnabled] = useState(false);

    useEffect(() => {
        try {
            const stored = JSON.parse(
                localStorage.getItem(FAVORITES_KEY) ?? '[]',
            ) as unknown;
            if (Array.isArray(stored)) {
                setSavedIds(
                    stored.filter((id): id is number => typeof id === 'number'),
                );
            }
        } catch {
            // Browser dapat menolak akses storage; daftar tugas tetap berfungsi.
        }
    }, []);

    function toggleFavorite(id: number) {
        setSavedIds((current) => {
            const next = current.includes(id)
                ? current.filter((value) => value !== id)
                : [...current, id];
            try {
                localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
            } catch {
                // Favorit hanya tersimpan untuk sesi ini jika storage tidak tersedia.
            }
            return next;
        });
    }

    const coordinatesAvailable = tasks.some(
        (task) => coordinatesOf(task) !== null,
    );

    function enableRadius() {
        if (!coordinatesAvailable) {
            setLocationError(
                'Koordinat tugas belum dikirim oleh Laravel. Tambahkan latitude dan longitude pada TaskController.',
            );
            return;
        }
        if (!navigator.geolocation) {
            setLocationError('Browser ini tidak mendukung akses lokasi.');
            return;
        }

        if (location) {
            setRadiusEnabled(true);
            setLocationError(null);
            return;
        }

        setRequestingLocation(true);
        setLocationError(null);
        navigator.geolocation.getCurrentPosition(
            ({ coords }) => {
                setLocation({
                    latitude: coords.latitude,
                    longitude: coords.longitude,
                });
                setRadiusEnabled(true);
                setRequestingLocation(false);
            },
            () => {
                setLocationError(
                    'Izin lokasi belum diberikan. Aktifkan izin lokasi di browser untuk memakai radius.',
                );
                setRequestingLocation(false);
            },
            { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
        );
    }

    const availableTasks = useMemo(() => {
        return tasks.filter((task) => {
            const quota = Number(task.workerQuota ?? 0);
            const accepted = Number(task.acceptedCount ?? 0);
            const remaining = Number(task.remainingQuota ?? quota - accepted);
            return task.isFull !== true && quota > 0 && remaining > 0;
        });
    }, [tasks]);

    const filteredTasks = useMemo(() => {
        const needle = query.trim().toLocaleLowerCase('id-ID');
        const result = availableTasks.filter((task) => {
            const matchesQuery = [
                String(task.id),
                task.title,
                task.businessName,
                task.category ?? '',
                task.description ?? '',
                task.locationAddress ?? '',
            ]
                .join(' ')
                .toLocaleLowerCase('id-ID')
                .includes(needle);

            if (!matchesQuery || !categoryMatches(task.category, category))
                return false;
            if (!radiusEnabled || !location) return true;
            const coordinates = coordinatesOf(task);
            return (
                coordinates !== null &&
                distanceKm(location, coordinates) <= radius
            );
        });

        result.sort((a, b) => {
            if (sort === 'wage-high')
                return (b.wageAmount ?? 0) - (a.wageAmount ?? 0);
            if (sort === 'wage-low')
                return (a.wageAmount ?? 0) - (b.wageAmount ?? 0);
            if (sort === 'start-soon') {
                return (
                    (parseTaskDate(a.startsAt)?.getTime() ?? Infinity) -
                    (parseTaskDate(b.startsAt)?.getTime() ?? Infinity)
                );
            }
            if (sort === 'nearest' && location) {
                return (
                    distanceKm(location, coordinatesOf(a) ?? location) -
                    distanceKm(location, coordinatesOf(b) ?? location)
                );
            }
            // Backend mengirim tugas terbaru terlebih dahulu.
            return 0;
        });

        return result;
    }, [
        availableTasks,
        query,
        category,
        radiusEnabled,
        location,
        radius,
        sort,
    ]);

    function clearFilters() {
        setQuery('');
        setCategory('Semua');
        setSort('newest');
        setRadiusEnabled(false);
        setLocationError(null);
    }

    return (
        <>
            <Head title="Cari Tugas & Lamar - KarsaNursa" />
            {/* Sidebar dan header Worker tetap menggunakan layout project. */}
            <main className="min-h-[calc(100svh-80px)] bg-[#f7f9fc] px-4 py-8 sm:px-6 xl:px-8">
                <div className="mx-auto max-w-[1440px] space-y-6">
                    <header className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <p className="text-[10px] font-extrabold tracking-[0.17em] text-[#21477f]">
                                MARKETPLACE TUGAS
                            </p>
                            <h1 className="mt-3 text-[25px] font-medium tracking-tight text-[#172c4b] sm:text-[29px]">
                                Peluang kerja di dekatmu
                            </h1>
                            <p className="mt-2 text-xs text-[#8192ae]">
                                Temukan tugas aktif dari UMKM terverifikasi.
                                {radiusEnabled &&
                                    ` Jarak maksimal ${radius} km dari lokasimu.`}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowFilters((value) => !value)}
                            aria-expanded={showFilters}
                            className="inline-flex items-center gap-2 rounded-xl border border-[#dbe4f0] bg-white px-5 py-3 text-sm font-semibold text-[#172c4b] shadow-sm transition hover:bg-slate-50"
                        >
                            Atur Filter
                            <ListFilter className="size-4" />
                        </button>
                    </header>

                    <section className="rounded-2xl border border-[#dbe4f0] bg-white p-3 shadow-sm">
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative min-w-[220px] flex-[2_1_360px]">
                                <Search className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-[#92a5c0]" />
                                <input
                                    type="search"
                                    aria-label="Cari tugas, UMKM, atau kategori"
                                    value={query}
                                    onChange={(event) =>
                                        setQuery(event.target.value)
                                    }
                                    placeholder="Cari tugas, UMKM, atau kategori..."
                                    className="h-12 w-full rounded-xl border border-[#dce5f2] bg-white pr-4 pl-12 text-sm text-[#172c4b] outline-none placeholder:text-[#a1b0c6] focus:border-[#21477f] focus:ring-2 focus:ring-blue-100"
                                />
                            </div>
                            <div
                                className="flex flex-wrap gap-1.5"
                                aria-label="Filter kategori tugas"
                            >
                                {categories.map((option) => (
                                    <button
                                        key={option}
                                        type="button"
                                        onClick={() => setCategory(option)}
                                        aria-pressed={category === option}
                                        className={`rounded-lg border px-3 py-2.5 text-xs font-medium transition ${
                                            category === option
                                                ? 'border-[#13294b] bg-[#13294b] text-white'
                                                : 'border-[#e0e8f2] bg-white text-[#7586a1] hover:border-[#21477f] hover:text-[#21477f]'
                                        }`}
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>
                            <button
                                type="button"
                                onClick={() =>
                                    setShowFilters((value) => !value)
                                }
                                className="inline-flex items-center gap-1.5 px-1 text-xs text-[#7083a0] hover:text-[#21477f]"
                            >
                                <MapPin className="size-4" />
                                Radius{' '}
                                <strong className="text-[#21477f]">
                                    {radiusEnabled
                                        ? `${radius} km`
                                        : 'nonaktif'}
                                </strong>
                            </button>
                        </div>
                    </section>

                    {showFilters && (
                        <section className="rounded-2xl border border-[#dbe4f0] bg-white p-4 shadow-sm sm:p-5">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-sm font-bold text-[#172c4b]">
                                        Filter berdasarkan lokasi
                                    </h2>
                                    <p className="mt-1 text-xs text-[#8293ab]">
                                        Perkiraan jarak garis lurus, bukan jarak
                                        perjalanan.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowFilters(false)}
                                    aria-label="Tutup filter"
                                    className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                                >
                                    <X className="size-4" />
                                </button>
                            </div>
                            <div className="mt-4 flex flex-wrap items-center gap-2">
                                {([5, 10, 20] as const).map((option) => (
                                    <button
                                        key={option}
                                        type="button"
                                        onClick={() => setRadius(option)}
                                        aria-pressed={radius === option}
                                        className={`rounded-lg border px-4 py-2 text-xs font-semibold ${
                                            radius === option
                                                ? 'border-[#21477f] bg-[#eaf1fb] text-[#21477f]'
                                                : 'border-slate-200 text-slate-600'
                                        }`}
                                    >
                                        {option} km
                                    </button>
                                ))}
                                {!radiusEnabled ? (
                                    <button
                                        type="button"
                                        disabled={requestingLocation}
                                        onClick={enableRadius}
                                        className="ml-auto rounded-lg bg-[#21477f] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                                    >
                                        {requestingLocation
                                            ? 'Memeriksa lokasi...'
                                            : 'Aktifkan radius'}
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setRadiusEnabled(false);
                                            if (sort === 'nearest')
                                                setSort('newest');
                                        }}
                                        className="ml-auto rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700"
                                    >
                                        Matikan radius
                                    </button>
                                )}
                            </div>
                            {locationError && (
                                <p
                                    role="alert"
                                    className="mt-3 text-xs text-amber-700"
                                >
                                    {locationError}
                                </p>
                            )}
                        </section>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <p className="text-sm text-[#172c4b]">
                            <strong>{filteredTasks.length}</strong>{' '}
                            <span className="text-[#8393aa]">
                                tugas ditemukan
                            </span>
                        </p>
                        <div className="flex items-center gap-2">
                            <label htmlFor="task-sort" className="sr-only">
                                Urutkan tugas
                            </label>
                            <select
                                id="task-sort"
                                value={sort}
                                onChange={(event) =>
                                    setSort(event.target.value as SortOption)
                                }
                                className="rounded-xl border border-[#dbe4f0] bg-white px-3 py-2.5 text-xs text-[#6f829d] outline-none focus:border-[#21477f]"
                            >
                                <option value="newest">Terbaru</option>
                                <option value="start-soon">
                                    Jadwal terdekat
                                </option>
                                <option value="wage-high">
                                    Upah tertinggi
                                </option>
                                <option value="wage-low">Upah terendah</option>
                                {location && radiusEnabled && (
                                    <option value="nearest">
                                        Jarak terdekat
                                    </option>
                                )}
                            </select>
                        </div>
                    </div>

                    {filteredTasks.length === 0 ? (
                        <section className="rounded-2xl border border-dashed border-[#d5e0ef] bg-white px-6 py-16 text-center">
                            <BriefcaseBusiness className="mx-auto size-11 text-[#96a8c2]" />
                            <h2 className="mt-4 text-base font-semibold text-[#172c4b]">
                                {availableTasks.length === 0
                                    ? 'Belum ada tugas tersedia'
                                    : 'Tidak ada tugas sesuai pencarian atau filter'}
                            </h2>
                            <p className="mt-2 text-sm text-[#8495b0]">
                                {availableTasks.length === 0
                                    ? 'Tugas yang telah disetujui Admin dan masih memiliki kuota akan muncul di sini.'
                                    : 'Coba kategori, kata kunci, atau radius yang berbeda.'}
                            </p>
                            {availableTasks.length > 0 && (
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="mt-4 rounded-lg bg-[#21477f] px-4 py-2 text-sm font-semibold text-white"
                                >
                                    Reset filter
                                </button>
                            )}
                        </section>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {filteredTasks.map((task) => {
                                const accepted = Math.max(
                                    0,
                                    Number(task.acceptedCount ?? 0),
                                );
                                const quota = Math.max(
                                    0,
                                    Number(task.workerQuota ?? 0),
                                );
                                const remaining = Math.max(
                                    0,
                                    Number(
                                        task.remainingQuota ?? quota - accepted,
                                    ),
                                );
                                const taskCoordinates = coordinatesOf(task);
                                const distance =
                                    location && taskCoordinates
                                        ? distanceKm(location, taskCoordinates)
                                        : null;
                                const favorite = savedIds.includes(task.id);
                                const initials = task.businessName
                                    .trim()
                                    .split(/\s+/)
                                    .slice(0, 2)
                                    .map((part) => part[0] ?? '')
                                    .join('')
                                    .toUpperCase();

                                return (
                                    <article
                                        key={task.id}
                                        className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[#dce5f1] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition hover:-translate-y-0.5 hover:shadow-md"
                                    >
                                        <div
                                            className={`flex h-[70px] items-start justify-between px-3 py-3 ${cardTone(task.category)}`}
                                        >
                                            <span className="rounded-lg bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-[#263852]">
                                                {task.category || 'Lainnya'}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    toggleFavorite(task.id)
                                                }
                                                aria-label={
                                                    favorite
                                                        ? 'Hapus dari favorit'
                                                        : 'Simpan tugas ke favorit'
                                                }
                                                aria-pressed={favorite}
                                                title="Favorit disimpan di browser ini"
                                                className="rounded-full border border-white/80 bg-white/90 p-1.5 text-[#7890b2] transition hover:text-[#21477f]"
                                            >
                                                <Heart
                                                    className={`size-[18px] ${favorite ? 'fill-rose-500 text-rose-500' : ''}`}
                                                />
                                            </button>
                                        </div>

                                        <div className="flex flex-1 flex-col px-4 pt-4 pb-3">
                                            <div className="flex items-center gap-2.5">
                                                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#102747] text-[11px] font-bold text-white">
                                                    {initials || 'U'}
                                                </span>
                                                <div className="min-w-0">
                                                    <p className="line-clamp-2 text-xs font-bold text-[#172c4b]">
                                                        {task.businessName}
                                                    </p>
                                                    <p className="mt-0.5 flex items-center gap-1 text-[10px] text-[#21477f]">
                                                        <ShieldCheck className="size-3" />
                                                        Terverifikasi
                                                    </p>
                                                </div>
                                            </div>

                                            <h3 className="mt-4 line-clamp-2 min-h-[46px] text-[15px] leading-snug font-medium text-[#152943]">
                                                {task.title}
                                            </h3>

                                            <div className="mt-3 flex flex-wrap gap-x-3 gap-y-2 text-[11px] text-[#8294af]">
                                                <span
                                                    className="inline-flex items-center gap-1"
                                                    title={
                                                        task.locationAddress ??
                                                        undefined
                                                    }
                                                >
                                                    <MapPin className="size-3.5 shrink-0" />
                                                    {distance !== null
                                                        ? `${distance.toLocaleString('id-ID', { maximumFractionDigits: 1 })} km`
                                                        : task.locationAddress
                                                          ? task.locationAddress
                                                                .length > 22
                                                              ? `${task.locationAddress.slice(0, 20)}…`
                                                              : task.locationAddress
                                                          : 'Alamat belum ada'}
                                                </span>
                                                <span className="inline-flex items-center gap-1">
                                                    <Clock3 className="size-3.5 shrink-0" />
                                                    {shortSchedule(
                                                        task.startsAt,
                                                    )}
                                                </span>
                                                <span className="inline-flex items-center gap-1">
                                                    <BriefcaseBusiness className="size-3.5 shrink-0" />
                                                    {durationLabel(task)}
                                                </span>
                                            </div>

                                            <div className="mt-4 border-t border-[#e6ebf2] pt-3">
                                                <p className="text-[10px] tracking-wide text-[#97a6bd]">
                                                    UPAH BERSIH
                                                </p>
                                                <div className="mt-1 flex flex-wrap items-end justify-between gap-2">
                                                    <p className="text-[18px] font-bold tracking-tight text-[#21477f]">
                                                        {task.wageAmount ===
                                                        null
                                                            ? 'Belum ditentukan'
                                                            : rupiah.format(
                                                                  task.wageAmount,
                                                              )}
                                                        <span className="ml-1 text-[10px] font-normal text-[#9aabc0]">
                                                            /tugas
                                                        </span>
                                                    </p>
                                                    <p className="text-[10px] text-[#7f90aa]">
                                                        {remaining} dari {quota}{' '}
                                                        slot
                                                    </p>
                                                </div>
                                            </div>

                                            <Link
                                                href={`/worker/tasks/${task.id}`}
                                                className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[#21477f] px-3 text-sm font-semibold text-white transition hover:bg-[#163762]"
                                            >
                                                Lihat Tugas
                                            </Link>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>
        </>
    );
}
