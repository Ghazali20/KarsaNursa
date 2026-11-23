import { Head, usePage } from '@inertiajs/react';
import {
    BadgeCheck,
    Briefcase,
    FileSpreadsheet,
    Star,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type HistoryItem = {
    id: number;
    taskTitle: string;
    businessName: string;
    dateLabel: string;
    wageAmount: number;
    statusKey: 'approved' | 'processing' | 'pending';
    statusLabel: string;
    rating: number | null;
    reviewComment: string | null;
    canReview: boolean;
};

type WorkerProfileSummary = {
    name: string;
    completedTasksCount: number;
    totalHours: number;
    joinedSince: string;
    rating: string;
    reviewCount: number;
};

type Props = {
    profile: WorkerProfileSummary;
    histories: HistoryItem[];
};

type SavedReviewMap = Record<number, { rating: number; comment: string }>;

function formatRupiah(value: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(value);
}

function getInitials(name: string): string {
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('');
}

function statusBadgeClass(statusKey: HistoryItem['statusKey']): string {
    if (statusKey === 'approved') {
        return 'bg-[#E1F3F2] text-[#186A66]';
    }
    if (statusKey === 'processing') {
        return 'bg-[#FEF3C7] text-[#B45309]';
    }
    return 'bg-slate-100 text-slate-600';
}

export default function WorkerHistoryIndex({ profile, histories }: Props) {
    const page = usePage();
    const authUser = (
        page.props as { auth?: { user?: { id?: number; name?: string } } }
    ).auth?.user;
    const storageKey = `karsanusa_worker_reviews_${authUser?.id ?? 'guest'}`;

    const [items, setItems] = useState<HistoryItem[]>(() => {
        if (typeof window === 'undefined') return histories;
        try {
            const raw = window.localStorage.getItem(storageKey);
            const saved: SavedReviewMap = raw ? JSON.parse(raw) : {};
            return histories.map((row) =>
                saved[row.id]
                    ? {
                          ...row,
                          rating: saved[row.id].rating,
                          reviewComment: saved[row.id].comment,
                      }
                    : row,
            );
        } catch {
            return histories;
        }
    });

    useEffect(() => {
        try {
            const mapToSave: SavedReviewMap = {};
            for (const row of items) {
                if (row.rating !== null) {
                    mapToSave[row.id] = {
                        rating: row.rating,
                        comment: row.reviewComment ?? '',
                    };
                }
            }
            window.localStorage.setItem(storageKey, JSON.stringify(mapToSave));
        } catch {
            // Abaikan error penyimpanan browser
        }
    }, [items, storageKey]);

    const liveRatingStats = useMemo(() => {
        const rated = items.filter((row) => row.rating !== null);
        const count = rated.length;
        if (count === 0) {
            return {
                ratingText: '0,0',
                reviewCount: 0,
            };
        }

        const total = rated.reduce((sum, row) => sum + (row.rating ?? 0), 0);
        const avg = (total / count).toFixed(1).replace('.', ',');

        return {
            ratingText: avg,
            reviewCount: count,
        };
    }, [items]);

    const [reviewModalItem, setReviewModalItem] = useState<HistoryItem | null>(
        null,
    );
    const [selectedScore, setSelectedScore] = useState<number>(5);
    const [commentInput, setCommentInput] = useState<string>('');

    const handleExportPortfolio = () => {
        const headers = [
            'Tugas',
            'UMKM',
            'Tanggal',
            'Upah (IDR)',
            'Status',
            'Rating',
            'Ulasan',
        ];
        const rows = items.map((row) =>
            [
                `"${row.taskTitle.replace(/"/g, '""')}"`,
                `"${row.businessName.replace(/"/g, '""')}"`,
                `"${row.dateLabel}"`,
                row.wageAmount,
                `"${row.statusLabel}"`,
                row.rating ?? '-',
                `"${(row.reviewComment ?? '-').replace(/"/g, '""')}"`,
            ].join(','),
        );

        const csvContent = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csvContent], {
            type: 'text/csv;charset=utf-8;',
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'portofolio-riwayat-kerja.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const openReviewModal = (item: HistoryItem) => {
        setReviewModalItem(item);
        setSelectedScore(item.rating ?? 5);
        setCommentInput(item.reviewComment ?? '');
    };

    const handleSaveReview = (e: React.FormEvent) => {
        e.preventDefault();
        if (!reviewModalItem) return;

        const cleanComment =
            commentInput.trim() ||
            'Pengalaman kerja berjalan lancar dan profesional.';

        setItems((prev) =>
            prev.map((row) =>
                row.id === reviewModalItem.id
                    ? {
                          ...row,
                          rating: selectedScore,
                          reviewComment: cleanComment,
                      }
                    : row,
            ),
        );
        setReviewModalItem(null);
    };

    return (
        <>
            <Head title="Riwayat Kerja Terverifikasi - KarsaNursa" />

            <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-8 sm:py-8">
                {/* 1. HEADER PORTOFOLIO DIGITAL */}
                <section className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                            PORTOFOLIO DIGITAL
                        </p>
                        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                            Riwayat kerja terverifikasi
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Rekam jejak profesional yang dapat dilihat oleh UMKM
                            saat proses seleksi.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleExportPortfolio}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-800 shadow-2xs transition hover:bg-slate-50"
                    >
                        <span>Ekspor Portofolio</span>
                        <FileSpreadsheet className="size-4 text-slate-500" />
                    </button>
                </section>

                {/* 2. KARTU RINGKASAN PROFIL & RATING REALTIME */}
                <section className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200/90 bg-white px-6 py-5 shadow-2xs sm:flex-row sm:items-center">
                    <div className="flex items-center gap-4">
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#E6EEF8] text-sm font-extrabold text-[#1E4479]">
                            {getInitials(profile.name)}
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5">
                                <h2 className="text-base font-extrabold text-slate-900">
                                    {profile.name}
                                </h2>
                                <BadgeCheck className="size-4 text-[#1E4479]" />
                            </div>
                            <p className="mt-0.5 text-xs text-slate-400">
                                {profile.completedTasksCount} tugas selesai ·{' '}
                                {profile.totalHours.toLocaleString('id-ID')} jam
                                kerja · Bergabung sejak {profile.joinedSince}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5 self-start sm:self-center sm:text-right">
                        <Star className="size-5 fill-amber-400 text-amber-400" />
                        <div>
                            <p className="text-lg leading-none font-extrabold text-slate-900">
                                {liveRatingStats.ratingText}
                            </p>
                            <p className="mt-1 text-[11px] text-slate-400">
                                dari {liveRatingStats.reviewCount} ulasan
                            </p>
                        </div>
                    </div>
                </section>

                {/* 3. DAFTAR KARTU RIWAYAT KERJA */}
                {items.length === 0 ? (
                    <section className="rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center shadow-2xs">
                        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[#EAF1FA] text-[#1E4479]">
                            <Briefcase className="size-6" />
                        </div>
                        <h2 className="mt-4 text-base font-extrabold text-slate-900">
                            Belum ada riwayat kerja tercatat
                        </h2>
                        <p className="mx-auto mt-1 max-w-md text-xs text-slate-400">
                            Tugas yang sudah diterima dan diselesaikan akan
                            muncul di sini sebagai portofolio terverifikasi.
                        </p>
                    </section>
                ) : (
                    <section className="space-y-4">
                        {items.map((item) => (
                            <article
                                key={item.id}
                                className="rounded-2xl border border-slate-200/90 bg-white px-6 py-5 shadow-2xs transition hover:border-slate-300"
                            >
                                <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                                    <div className="flex items-start gap-4">
                                        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#EAF1FA] text-[#1E4479]">
                                            <Briefcase className="size-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-extrabold text-slate-900 sm:text-base">
                                                {item.taskTitle}
                                            </h3>
                                            <p className="mt-0.5 text-xs text-slate-400">
                                                {item.businessName} ·{' '}
                                                {item.dateLabel}
                                            </p>
                                        </div>
                                    </div>

                                    <span
                                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${statusBadgeClass(
                                            item.statusKey,
                                        )}`}
                                    >
                                        {item.statusLabel}
                                    </span>
                                </div>

                                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                                    <div className="flex flex-wrap items-center gap-4">
                                        <span className="text-xs font-extrabold text-slate-900">
                                            {formatRupiah(item.wageAmount)}
                                        </span>

                                        {item.rating !== null && (
                                            <div className="flex items-center gap-1.5 text-xs">
                                                <Star className="size-3.5 fill-amber-400 text-amber-400" />
                                                <span className="font-bold text-amber-600">
                                                    {item.rating.toFixed(1)}
                                                </span>
                                                {item.reviewComment && (
                                                    <span className="text-slate-400">
                                                        · &ldquo;
                                                        {item.reviewComment}
                                                        &rdquo;
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {item.canReview && (
                                        <button
                                            type="button"
                                            onClick={() => openReviewModal(item)}
                                            className="text-xs font-semibold text-slate-500 transition hover:text-[#1E4479]"
                                        >
                                            Beri Ulasan
                                        </button>
                                    )}
                                </div>
                            </article>
                        ))}
                    </section>
                )}
            </main>

            {/* MODAL BERI ULASAN */}
            {reviewModalItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
                    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h3 className="text-base font-extrabold text-slate-900">
                                    Ulasan pengalaman kerja
                                </h3>
                                <p className="mt-0.5 text-xs text-slate-500">
                                    {reviewModalItem.taskTitle} ·{' '}
                                    {reviewModalItem.businessName}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setReviewModalItem(null)}
                                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                                aria-label="Tutup modal"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <form
                            onSubmit={handleSaveReview}
                            className="mt-4 space-y-4"
                        >
                            <div>
                                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                                    Rating (1 - 5)
                                </label>
                                <div className="flex items-center gap-2">
                                    {[1, 2, 3, 4, 5].map((score) => (
                                        <button
                                            key={score}
                                            type="button"
                                            onClick={() =>
                                                setSelectedScore(score)
                                            }
                                            className={`flex size-9 items-center justify-center rounded-xl border text-xs font-bold transition ${
                                                selectedScore >= score
                                                    ? 'border-amber-300 bg-amber-50 text-amber-600'
                                                    : 'border-slate-200 bg-white text-slate-400'
                                            }`}
                                        >
                                            {score}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label
                                    htmlFor="reviewComment"
                                    className="mb-1.5 block text-xs font-bold text-slate-700"
                                >
                                    Catatan ulasan
                                </label>
                                <textarea
                                    id="reviewComment"
                                    rows={3}
                                    value={commentInput}
                                    onChange={(e) =>
                                        setCommentInput(e.target.value)
                                    }
                                    placeholder="Tuliskan catatan singkat mengenai tugas ini..."
                                    className="w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-800 focus:border-[#1E4479] focus:outline-none"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={() => setReviewModalItem(null)}
                                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="rounded-xl bg-[#1E4479] px-4 py-2 text-xs font-bold text-white hover:bg-[#163561]"
                                >
                                    Simpan Ulasan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}