import { Head, Link, usePage } from '@inertiajs/react';
import {
    BriefcaseBusiness,
    ChevronRight,
    Download,
    FileCheck2,
    FileText,
    ShieldCheck,
    Users,
    X,
} from 'lucide-react';
import { useState } from 'react';

type Stats = {
    workers: number;
    employers: number;
    tasks: number;
    pendingTasks: number;
    publishedTasks: number;
    pendingDocuments: number;
};

type DocumentItem = {
    id: number;
    userName: string;
    userRole: string;
    documentType: string;
    createdAt: string | null;
    downloadUrl: string;
    documentFileName?: string | null;
    documentMimeType?: string | null;
};

type TaskItem = {
    id: number;
    title: string;
    status: string;
    createdAt: string | null;
};

type Props = {
    stats: Stats;
    documentQueue?: DocumentItem[];
    recentTasks?: TaskItem[];
};

function formatDate(value: string | null): string {
    if (!value) return '-';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return '-';

    return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

function statusLabel(status: string): string {
    if (status === 'published') return 'Dipublikasikan';
    if (status === 'rejected') return 'Ditolak';
    if (status === 'draft') return 'Draft';

    if (['submitted', 'pending_review', 'pending'].includes(status)) {
        return 'Perlu ditinjau';
    }

    return status.replaceAll('_', ' ');
}

function statusClass(status: string): string {
    if (status === 'published') {
        return 'bg-emerald-100 text-emerald-700';
    }

    if (status === 'rejected') {
        return 'bg-rose-100 text-rose-700';
    }

    if (['submitted', 'pending_review', 'pending'].includes(status)) {
        return 'bg-amber-100 text-amber-800';
    }

    return 'bg-slate-100 text-slate-600';
}

export default function AdminDashboard({
    stats,
    documentQueue = [],
    recentTasks = [],
}: Props) {
    const { auth } = usePage().props;
    const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);

    function isImageFile(
        fileName?: string | null,
        mimeType?: string | null,
    ): boolean {
        if (mimeType && mimeType.startsWith('image/')) return true;
        if (fileName && /\.(jpe?g|png|webp|gif|svg)$/i.test(fileName))
            return true;
        return false;
    }

    function isPdfFile(
        fileName?: string | null,
        mimeType?: string | null,
    ): boolean {
        if (mimeType && mimeType === 'application/pdf') return true;
        if (fileName && /\.pdf$/i.test(fileName)) return true;
        return false;
    }

    const firstName = auth?.user?.name?.trim().split(/\s+/)[0] || 'Admin';

    const totalUsers = stats.workers + stats.employers;

    const cards = [
        {
            title: 'Total pengguna',
            value: totalUsers.toLocaleString('id-ID'),
            subtitle: `${stats.workers} pekerja · ${stats.employers} UMKM`,
            icon: Users,
            color: 'bg-sky-50 text-[#244B83]',
        },
        {
            title: 'Menunggu pemeriksaan',
            value: stats.pendingDocuments.toLocaleString('id-ID'),
            subtitle: 'Dokumen identitas dan usaha',
            icon: ShieldCheck,
            color: 'bg-orange-50 text-orange-500',
        },
        {
            title: 'Tugas aktif',
            value: stats.publishedTasks.toLocaleString('id-ID'),
            subtitle: 'Tugas berstatus dipublikasikan',
            icon: BriefcaseBusiness,
            color: 'bg-sky-50 text-[#244B83]',
        },
        {
            title: 'Laporan terbuka',
            value: '—',
            subtitle: 'Modul laporan belum terintegrasi',
            icon: FileText,
            color: 'bg-red-50 text-red-500',
        },
    ];

    return (
        <>
            <Head title="Dashboard Admin - KarsaNursa" />

            <main className="min-h-[calc(100svh-70px)] w-full bg-[#21477F] px-4 py-8 text-slate-950 sm:px-6 lg:px-8 lg:py-10">
                <div className="mx-auto max-w-[1440px] space-y-5">
                    {/* HEADER DASHBOARD */}

                    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <h1 className="text-[27px] font-medium tracking-tight text-white sm:text-[31px]">
                                Halo, {firstName}!
                            </h1>

                            <p className="mt-2 text-sm leading-relaxed text-white">
                                Pantau keamanan platform, pemeriksaan dokumen,
                                dan aktivitas KarsaNursa.
                            </p>
                        </div>
                    </div>

                    {/* EMPAT KARTU STATISTIK */}

                    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        {cards.map((card) => {
                            const Icon = card.icon;

                            return (
                                <article
                                    key={card.title}
                                    className="flex min-h-[106px] items-start gap-3 rounded-xl border border-[#dce5ed] bg-white p-4 shadow-sm"
                                >
                                    <div
                                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${card.color}`}
                                    >
                                        <Icon size={21} />
                                    </div>

                                    <div className="min-w-0">
                                        <p className="text-xs text-slate-600">
                                            {card.title}
                                        </p>

                                        <p className="mt-1 text-2xl font-bold tabular-nums">
                                            {card.value}
                                        </p>

                                        <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
                                            {card.subtitle}
                                        </p>
                                    </div>
                                </article>
                            );
                        })}
                    </section>

                    {/* ANTRIAN DOKUMEN + TUGAS TERBARU */}

                    <div className="grid grid-cols-1 items-stretch gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,0.9fr)]">
                        {/* ANTRIAN PEMERIKSAAN */}

                        <section className="min-w-0 rounded-2xl border border-[#dce5ed] bg-white p-5 shadow-sm sm:p-6">
                            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <h2 className="text-lg font-semibold">
                                        Antrian pemeriksaan identitas
                                    </h2>

                                    <p className="mt-1 text-xs text-slate-600">
                                        Periksa dokumen identitas sebelum
                                        menyetujui akun.
                                    </p>
                                </div>

                                <Link
                                    href="/admin/users"
                                    className="text-sm font-semibold hover:text-blue-700"
                                >
                                    Lihat semua
                                </Link>
                            </div>

                            {documentQueue.length === 0 ? (
                                <div className="flex min-h-[250px] flex-col items-center justify-center text-center">
                                    <FileCheck2
                                        size={32}
                                        className="text-slate-300"
                                    />

                                    <p className="mt-3 text-sm font-medium text-slate-600">
                                        Tidak ada dokumen dalam antrian.
                                    </p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-200">
                                    {documentQueue.map((document) => {
                                        const initials = document.userName
                                            .trim()
                                            .split(/\s+/)
                                            .slice(0, 2)
                                            .map((part) => part.charAt(0))
                                            .join('')
                                            .toUpperCase();

                                        return (
                                            <article
                                                key={document.id}
                                                className="flex flex-wrap items-center gap-3 py-4 first:pt-1"
                                            >
                                                {/* AVATAR */}

                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#d6f1f7] text-xs font-bold">
                                                    {initials}
                                                </div>

                                                {/* PROFIL */}

                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-bold">
                                                        {document.userName}
                                                    </p>

                                                    <span className="mt-1 inline-block rounded-full bg-[#d6f1f7] px-2 py-0.5 text-[10px] font-semibold">
                                                        {document.userRole ===
                                                        'employer'
                                                            ? 'UMKM'
                                                            : 'Pekerja'}
                                                    </span>

                                                    <p className="mt-1 text-xs text-slate-600">
                                                        {document.documentType.toUpperCase()}
                                                    </p>
                                                </div>

                                                {/* AKSI */}

                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setPreviewDoc(
                                                                document,
                                                            )
                                                        }
                                                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50"
                                                    >
                                                        <FileText size={15} />
                                                        Tinjau
                                                    </button>

                                                    <Link
                                                        href="/admin/users"
                                                        className="rounded-lg bg-[#39C900] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#32B400]"
                                                    >
                                                        Pemeriksaan
                                                    </Link>
                                                </div>
                                            </article>
                                        );
                                    })}
                                </div>
                            )}
                        </section>

                        {/* TUGAS TERBARU */}

                        <section className="min-w-0 rounded-2xl border border-[#dce5ed] bg-white p-5 shadow-sm sm:p-6">
                            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <h2 className="text-lg font-semibold">
                                        Tugas Terbaru
                                    </h2>

                                    <p className="mt-1 text-xs text-slate-600">
                                        Tugas yang dibuat oleh UMKM.
                                    </p>
                                </div>

                                <Link
                                    href="/admin/tasks"
                                    className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold hover:bg-slate-50"
                                >
                                    Lihat semua
                                </Link>
                            </div>

                            <div className="mb-2 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-[11px] text-slate-500">
                                <span>{stats.pendingTasks} perlu ditinjau</span>

                                <span>Terbaru</span>
                            </div>

                            {recentTasks.length === 0 ? (
                                <div className="py-12 text-center text-sm text-slate-500">
                                    Belum ada tugas.
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {recentTasks.map((task) => (
                                        <Link
                                            href="/admin/tasks"
                                            key={task.id}
                                            className="flex items-center gap-3 py-4 hover:bg-slate-50"
                                        >
                                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-[#244B83]">
                                                <BriefcaseBusiness size={19} />
                                            </span>

                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-xs font-semibold">
                                                    {task.title}
                                                </p>

                                                <span
                                                    className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusClass(task.status)}`}
                                                >
                                                    {statusLabel(task.status)}
                                                </span>

                                                <p className="mt-1 text-[10px] text-slate-400">
                                                    {formatDate(task.createdAt)}
                                                </p>
                                            </div>

                                            <ChevronRight
                                                size={17}
                                                className="shrink-0 text-slate-600"
                                            />
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>
                </div>
            </main>

            {/* ========================================
                MODAL PRATINJAU DOKUMEN (POPUP)
            ======================================== */}
            {previewDoc && previewDoc.downloadUrl && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs"
                    onClick={() => setPreviewDoc(null)}
                >
                    <div
                        className="flex max-h-[92vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl transition-all"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header Modal */}
                        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <h3 className="truncate text-base font-bold text-slate-900">
                                        Pratinjau Dokumen {previewDoc.documentType.toUpperCase()}
                                    </h3>
                                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
                                        {previewDoc.userRole === 'employer'
                                            ? 'UMKM'
                                            : 'Pencari Kerja'}
                                    </span>
                                </div>
                                <p className="mt-0.5 truncate text-xs text-slate-500">
                                    {previewDoc.userName} · ID #{previewDoc.id}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setPreviewDoc(null)}
                                className="ml-3 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                                title="Tutup"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Konten Dokumen */}
                        <div className="flex-1 overflow-auto p-6">
                            {isImageFile(
                                previewDoc.documentFileName,
                                previewDoc.documentMimeType,
                            ) ? (
                                <div className="flex max-h-[62vh] min-h-[300px] items-center justify-center overflow-auto rounded-xl bg-slate-100/80 p-3">
                                    <img
                                        src={previewDoc.downloadUrl}
                                        alt={`Dokumen ${previewDoc.userName}`}
                                        className="max-h-[58vh] w-auto max-w-full rounded-lg object-contain shadow-sm"
                                    />
                                </div>
                            ) : isPdfFile(
                                  previewDoc.documentFileName,
                                  previewDoc.documentMimeType,
                              ) ? (
                                <div className="h-[62vh] w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                                    <iframe
                                        src={previewDoc.downloadUrl}
                                        title={`Dokumen ${previewDoc.userName}`}
                                        className="h-full w-full border-0"
                                    />
                                </div>
                            ) : (
                                <div className="flex max-h-[62vh] min-h-[300px] flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-8 text-center">
                                    <FileText
                                        size={48}
                                        className="text-slate-400"
                                    />
                                    <p className="mt-3 text-sm font-semibold text-slate-800">
                                        {previewDoc.documentFileName ||
                                            `Dokumen_${previewDoc.documentType}`}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500">
                                        Format file tidak mendukung pratinjau
                                        langsung di peramban. Silakan klik
                                        tombol unduh di bawah untuk melihat isi
                                        dokumen.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Footer Modal */}
                        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/50 px-6 py-4">
                            <a
                                href={`${previewDoc.downloadUrl}?download=1`}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100"
                            >
                                <Download size={15} />
                                Unduh File
                            </a>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPreviewDoc(null)}
                                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100"
                                >
                                    Tutup
                                </button>

                                <Link
                                    href="/admin/users"
                                    className="rounded-lg bg-[#39C900] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#32B400]"
                                >
                                    Periksa di Manajemen Akun
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
