import { Head, router } from '@inertiajs/react';
import {
    Check,
    Clock3,
    Search,
    ShieldCheck,
    X,
} from 'lucide-react';
import { useState } from 'react';
import TaskReviewModal, { type ReviewTask } from './show';

type RawTask = ReviewTask & {
    created_at?: string | null;
    updated_at?: string | null;
    submitted_at?: string | null;
    review_notes?: string | null;
    business_name?: string | null;
    business?: { name?: string | null; email?: string | null } | null;
    wage_amount?: string | number | null;
    worker_quota?: number | null;
    address?: string | null;
    submittedAtIso?: string | null;
};

type Stats = {
    pending?: number;
    pendingTasks?: number;
    submitted?: number;
    approvedToday?: number;
    rejectedToday?: number;
};

type Props = {
    tasks?: RawTask[] | { data: RawTask[] };
    stats?: Stats;
};

type Filter = 'all' | 'pending' | 'published' | 'rejected' | 'draft';

const pendingStatuses = new Set(['submitted', 'pending_review', 'pending']);

function isPending(status: string): boolean {
    return pendingStatuses.has(status);
}

function getStatusLabel(status: string): string {
    if (isPending(status)) return 'Menunggu';
    if (status === 'published') return 'Disetujui';
    if (status === 'rejected') return 'Ditolak';
    if (status === 'draft') return 'Draft';
    return status.replaceAll('_', ' ');
}

function statusClass(status: string): string {
    if (isPending(status)) return 'bg-[#fff1d0] text-[#a55a07]';
    if (status === 'published') return 'bg-[#e0f6e3] text-[#15803d]';
    if (status === 'rejected') return 'bg-[#ffe4e6] text-[#be123c]';
    return 'bg-slate-100 text-slate-700';
}

function dateLabel(value?: string | null): string {
    if (!value) return 'Tidak tercatat';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Tidak tercatat';
    return date.toLocaleString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function toTask(task: RawTask): ReviewTask {
    return {
        ...task,
        title: task.title || 'Tugas tanpa judul',
        status: task.status || 'unknown',
        businessName: task.businessName ?? task.business_name ?? task.business?.name ?? null,
        businessEmail: task.businessEmail ?? task.business?.email ?? null,
        createdAt: task.createdAt ?? task.created_at ?? null,
        submittedAt:
            task.submittedAtIso ??
            task.submittedAt ??
            task.submitted_at ??
            null,
        updatedAt: task.updatedAt ?? task.updated_at ?? null,
        wage: task.wage ?? task.wage_amount ?? null,
        workerQuota: task.workerQuota ?? task.worker_quota ?? null,
        location: task.location ?? task.address ?? null,
        reviewNotes: task.reviewNotes ?? task.review_notes ?? null,
    };
}

export default function AdminTaskIndex({ tasks = [], stats }: Props) {
    const sourceTasks = Array.isArray(tasks) ? tasks : tasks.data ?? [];
    const allTasks = sourceTasks.map(toTask);

    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<Filter>('all');
    const [selectedTask, setSelectedTask] = useState<ReviewTask | null>(null);
    const [rejectingTask, setRejectingTask] = useState<ReviewTask | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [reviewedIds, setReviewedIds] = useState<number[]>([]);

    const filteredTasks = (() => {
        const keyword = search.trim().toLowerCase();
        return allTasks.filter((task) => {
            const matchesStatus =
                filter === 'all' ||
                (filter === 'pending' ? isPending(task.status) : task.status === filter);
            const matchesSearch =
                !keyword ||
                [task.title, task.businessName, task.businessEmail, String(task.id)]
                    .some((value) => (value ?? '').toLowerCase().includes(keyword));
            return matchesStatus && matchesSearch;
        });
    })();

    const pendingCount = stats?.pending ?? stats?.pendingTasks ?? stats?.submitted ??
        allTasks.filter((task) => isPending(task.status)).length;

    function approve(task: ReviewTask) {
        if (processingId !== null || !isPending(task.status)) return;
        if (!window.confirm(`Setujui tugas "${task.title}"?`)) return;

        setProcessingId(task.id);
        setError(null);
        router.patch(`/admin/tasks/${task.id}/approve`, {}, {
            preserveScroll: true,
            onSuccess: () => setNotice(`Tugas "${task.title}" berhasil diproses.`),
            onError: (errors) => setError(Object.values(errors)[0] ?? 'Gagal menyetujui tugas.'),
            onFinish: () => setProcessingId(null),
        });
    }

    function reject() {
        if (!rejectingTask || processingId !== null) return;
        const reason = rejectReason.trim();
        if (reason.length < 5) {
            setError('Alasan penolakan minimal 5 karakter.');
            return;
        }

        const task = rejectingTask;
        setProcessingId(task.id);
        setError(null);
        router.patch(`/admin/tasks/${task.id}/reject`, { review_notes: reason }, {
            preserveScroll: true,
            onSuccess: () => {
                setRejectingTask(null);
                setRejectReason('');
                setNotice(`Tugas "${task.title}" berhasil ditolak.`);
            },
            onError: (errors) => setError(Object.values(errors)[0] ?? 'Gagal menolak tugas.'),
            onFinish: () => setProcessingId(null),
        });
    }

    const summaryCards = [
        {
            label: 'Menunggu peninjauan',
            value: `${pendingCount.toLocaleString('id-ID')} Tugas`,
            subtitle: 'Pengajuan tugas UMKM',
            icon: ShieldCheck,
            iconClass: 'bg-[#fff0f1] text-[#f28b2b]',
        },
        {
            label: 'Disetujui hari ini',
            value: stats?.approvedToday == null ? '—' : `${stats.approvedToday.toLocaleString('id-ID')} Tugas`,
            subtitle: stats?.approvedToday == null ? 'Menunggu data Controller' : 'Tugas disetujui hari ini',
            icon: Check,
            iconClass: 'bg-[#edf7fa] text-[#21477F]',
        },
        {
            label: 'Ditolak hari ini',
            value: stats?.rejectedToday == null ? '—' : `${stats.rejectedToday.toLocaleString('id-ID')} Tugas`,
            subtitle: stats?.rejectedToday == null ? 'Menunggu data Controller' : 'Tugas ditolak hari ini',
            icon: X,
            iconClass: 'bg-[#ff6068] text-white',
        },
    ];

    return (
        <>
            <Head title="Manajemen Tugas - Admin KarsaNursa" />
            <main className="min-h-[calc(100svh-70px)] w-full bg-[#21477F] px-4 py-8 text-[#192842] sm:px-6 lg:px-8 lg:py-10">
                <div className="mx-auto max-w-[1440px] space-y-5">
                    <header>
                        <h1 className="text-[28px] font-medium tracking-tight text-white">Manajemen tugas UMKM</h1>
                        <p className="mt-2 text-xs text-white/85">
                            Periksa tugas yang diajukan UMKM sebelum ditampilkan kepada Pencari Kerja.
                        </p>
                    </header>

                    <section className="grid gap-3 md:grid-cols-3">
                        {summaryCards.map((card) => {
                            const Icon = card.icon;
                            return (
                                <article key={card.label} className="flex min-h-[102px] items-start gap-4 rounded-xl border border-[#dbe5f1] bg-white p-4 shadow-sm">
                                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${card.iconClass}`}>
                                        <Icon size={23} />
                                    </span>
                                    <div className="min-w-0">
                                        <p className="text-[11px] text-[#63728b]">{card.label}</p>
                                        <p className="mt-1 text-[23px] font-bold tracking-tight text-slate-950 tabular-nums">{card.value}</p>
                                        <p className="mt-2 text-[11px] text-[#6f87ab]">{card.subtitle}</p>
                                    </div>
                                </article>
                            );
                        })}
                    </section>

                    {notice && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</p>}
                    {error && !rejectingTask && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

                    <section className="rounded-2xl border border-[#dce6f1] bg-white p-4 shadow-sm sm:p-6 lg:px-8">
                        <div className="flex flex-col gap-3 pb-3 sm:flex-row">
                            <label className="relative min-w-0 flex-1">
                                <Search size={19} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#64748b]" />
                                <span className="sr-only">Cari tugas atau UMKM</span>
                                <input
                                    type="search"
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Cari ID, tugas, atau nama UMKM..."
                                    className="h-11 w-full rounded-xl border border-[#dce6f1] bg-white py-2 pl-12 pr-4 text-[12px] text-[#1e293b] outline-none placeholder:text-[#a4b2c6] focus:border-[#21477F]"
                                />
                            </label>
                            <label>
                                <span className="sr-only">Filter status tugas</span>
                                <select
                                    value={filter}
                                    onChange={(event) => setFilter(event.target.value as Filter)}
                                    className="h-11 w-full min-w-[148px] rounded-xl border border-[#dce6f1] bg-white px-4 text-[12px] text-[#24354d] focus:border-[#21477F] sm:w-auto"
                                >
                                    <option value="all">Semua</option>
                                    <option value="pending">Menunggu</option>
                                    <option value="published">Disetujui</option>
                                    <option value="rejected">Ditolak</option>
                                    <option value="draft">Draft</option>
                                </select>
                            </label>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[850px] border-collapse text-left">
                                <thead className="border-y border-[#e1e8f1] text-[10px] font-semibold uppercase text-[#8395af]">
                                    <tr>
                                        <th className="py-4 pr-4 font-semibold">UMKM / Pengaju</th>
                                        <th className="py-4 pr-4 font-semibold">Status</th>
                                        <th className="py-4 pr-4 font-semibold">Tugas</th>
                                        <th className="py-4 pr-4 font-semibold">Waktu diajukan</th>
                                        <th className="py-4 text-right font-semibold">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#e1e8f1]">
                                    {filteredTasks.map((task) => {
                                        const initials = (task.businessName || 'UMKM')
                                            .trim()
                                            .split(/\s+/)
                                            .slice(0, 2)
                                            .map((part) => part.charAt(0))
                                            .join('')
                                            .toUpperCase();
                                        const pending = isPending(task.status);
                                        return (
                                            <tr key={task.id} className="align-middle">
                                                <td className="py-5 pr-4">
                                                    <div className="flex items-center gap-3">
                                                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#d5eff6] text-xs font-bold text-[#173252]">{initials}</span>
                                                        <div className="min-w-0">
                                                            <p className="max-w-[230px] truncate text-[12px] font-semibold text-[#18253a]">{task.businessName || 'UMKM belum tersedia'}</p>
                                                            <p className="mt-1 max-w-[230px] truncate text-[10px] text-[#8c9ab0]">Tugas #{task.id}{task.businessEmail ? ` · ${task.businessEmail}` : ''}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-5 pr-4">
                                                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusClass(task.status)}`}>{getStatusLabel(task.status)}</span>
                                                </td>
                                                <td className="py-5 pr-4">
                                                    <p className="max-w-[250px] truncate text-[12px] font-semibold text-[#18253a]">{task.title}</p>
                                                    <p className="mt-1 max-w-[250px] truncate text-[10px] text-[#8c9ab0]">{task.description || 'Belum ada deskripsi tugas'}</p>
                                                </td>
                                                <td className="whitespace-nowrap py-5 pr-4 text-[11px] text-[#4386c8]">{dateLabel(task.submittedAt || task.createdAt)}</td>
                                                <td className="py-5">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedTask(task)}
                                                            className="whitespace-nowrap rounded-lg border border-[#dbe5f0] px-3 py-2.5 text-[11px] font-semibold text-[#273349] hover:bg-[#f4f8fc]"
                                                        >
                                                            Tinjau detail
                                                        </button>
                                                        {pending ? (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    title="Tolak tugas"
                                                                    aria-label={`Tolak ${task.title}`}
                                                                    disabled={processingId !== null}
                                                                    onClick={() => {
                                                                        setRejectingTask(task);
                                                                        setRejectReason('');
                                                                        setError(null);
                                                                    }}
                                                                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#ffd2d8] bg-[#fff0f1] text-[#e5313b] hover:bg-[#ffe2e5] disabled:opacity-50"
                                                                >
                                                                    <X size={17} />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    title="Setujui tugas"
                                                                    aria-label={`Setujui ${task.title}`}
                                                                    disabled={processingId !== null}
                                                                    onClick={() => approve(task)}
                                                                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#37c900] text-white hover:bg-[#2bac00] disabled:opacity-50"
                                                                >
                                                                    {processingId === task.id ? <Clock3 size={16} /> : <Check size={20} />}
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <span className="min-w-[82px] text-center text-[11px] text-[#93a2b5]">Diproses</span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {filteredTasks.length === 0 && (
                                <div className="py-14 text-center text-sm text-[#8c9ab0]">
                                    Tidak ada tugas yang cocok dengan pencarian atau filter.
                                </div>
                            )}
                        </div>
                        {reviewedIds.length > 0 && (
                            <p className="mt-3 text-right text-[11px] text-[#8395af]">
                                {reviewedIds.length} tugas sudah dibaca pada sesi tampilan ini (belum disimpan sebagai log).
                            </p>
                        )}
                    </section>
                </div>
            </main>

            {selectedTask && (
                <TaskReviewModal
                    task={selectedTask}
                    onClose={() => setSelectedTask(null)}
                    onReviewed={(task) => {
                        setReviewedIds((current) => current.includes(task.id) ? current : [...current, task.id]);
                        setSelectedTask(null);
                        setNotice(`Detail tugas "${task.title}" sudah dibaca. Silakan pilih Setujui atau Tolak untuk menyimpan keputusan.`);
                    }}
                />
            )}

            {rejectingTask && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[#14233e]/60 p-4 backdrop-blur-sm">
                    <section role="dialog" aria-modal="true" aria-labelledby="reject-task-title" className="w-full max-w-md rounded-2xl bg-white p-6 text-[#192842] shadow-2xl">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-[11px] font-bold text-red-600">KEPUTUSAN ADMIN</p>
                                <h2 id="reject-task-title" className="mt-2 text-xl font-semibold">Tolak tugas UMKM</h2>
                                <p className="mt-2 text-sm text-[#7c8da5]">{rejectingTask.title}</p>
                            </div>
                            <button type="button" aria-label="Tutup" disabled={processingId !== null} onClick={() => setRejectingTask(null)} className="rounded-lg p-2 hover:bg-slate-100">
                                <X size={19} />
                            </button>
                        </div>
                        <label htmlFor="task-review-notes" className="mt-5 block text-sm font-semibold">Alasan penolakan</label>
                        <textarea
                            id="task-review-notes"
                            value={rejectReason}
                            onChange={(event) => setRejectReason(event.target.value)}
                            rows={4}
                            maxLength={1000}
                            placeholder="Contoh: Deskripsi tugas belum lengkap atau upah tidak jelas."
                            className="mt-2 w-full rounded-xl border border-[#dbe5f0] p-3 text-sm outline-none focus:border-[#21477F]"
                        />
                        {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}
                        <div className="mt-5 flex justify-end gap-2">
                            <button type="button" disabled={processingId !== null} onClick={() => setRejectingTask(null)} className="rounded-lg px-4 py-2 text-sm text-[#60748d] hover:bg-slate-100">Batal</button>
                            <button type="button" disabled={processingId !== null || rejectReason.trim().length < 5} onClick={reject} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">{processingId === rejectingTask.id ? 'Memproses...' : 'Tolak Tugas'}</button>
                        </div>
                    </section>
                </div>
            )}
        </>
    );
}
