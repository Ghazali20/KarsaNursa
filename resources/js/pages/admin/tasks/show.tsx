import { router } from '@inertiajs/react';
import {
    BadgeCheck,
    BriefcaseBusiness,
    Clock3,
    FileText,
    History,
    MapPin,
    ShieldCheck,
    Users,
    Wallet,
    X,
} from 'lucide-react';
import { useEffect } from 'react';

export type ReviewTask = {
    id: number;
    title: string;
    status: string;
    description?: string | null;
    businessName?: string | null;
    businessEmail?: string | null;
    createdAt?: string | null;
    submittedAt?: string | null;
    updatedAt?: string | null;
    location?: string | null;
    wage?: number | string | null;
    workerQuota?: number | null;
    evidenceStatus?: 'valid' | 'pending' | 'none' | null;
    supportingDocuments?: number | null;
    reviewNotes?: string | null;
};

type Props = {
    task: ReviewTask;
    onClose?: () => void;
    onReviewed?: (task: ReviewTask) => void;
};

function formatTime(value?: string | null): string {
    if (!value) return 'Belum tercatat';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Belum tercatat';

    return date.toLocaleString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function formatWage(wage?: number | string | null): string {
    if (wage == null || wage === '') return 'Belum tersedia';
    const number = Number(wage);
    if (!Number.isFinite(number)) return String(wage);
    return `Rp${number.toLocaleString('id-ID')}`;
}

export default function TaskReviewModal({ task, onClose, onReviewed }: Props) {
    const close = () => {
        if (onClose) {
            onClose();
        } else {
            router.visit('/admin/tasks');
        }
    };

    useEffect(() => {
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') close();
        };
        document.addEventListener('keydown', onKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener('keydown', onKeyDown);
        };
        // The modal is recreated when the selected task changes.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [task.id]);

    const evidenceDescription =
        task.evidenceStatus === 'valid'
            ? 'Dokumen pendukung dinyatakan valid oleh sistem.'
            : task.evidenceStatus === 'pending'
              ? 'Dokumen pendukung masih menunggu pemeriksaan.'
              : task.supportingDocuments && task.supportingDocuments > 0
                ? `${task.supportingDocuments} dokumen pendukung tercatat.`
                : 'Belum ada informasi dokumen pendukung pada data tugas.';

    return (
        <div
            role="presentation"
            className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-[#14233e]/55 p-4 backdrop-blur-[5px]"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) close();
            }}
        >
            <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="task-review-title"
                className="my-auto w-full max-w-[700px] overflow-hidden rounded-[22px] bg-white text-[#18263e] shadow-2xl"
            >
                <div className="border-b border-[#e1e8f0] px-6 pt-7 pb-6 sm:px-8">
                    <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                            <span className="inline-flex rounded-full bg-[#fff0c4] px-3 py-1.5 text-[11px] font-extrabold text-[#b65b04]">
                                TINJAU DETAIL
                            </span>
                            <h2
                                id="task-review-title"
                                className="mt-4 text-[24px] leading-tight font-medium tracking-tight break-words sm:text-[28px]"
                            >
                                {task.title}
                            </h2>
                            <p className="mt-2 text-[12px] leading-relaxed text-[#788ba5]">
                                Periksa informasi tugas sebelum mengambil
                                keputusan.
                            </p>
                        </div>
                        <button
                            type="button"
                            aria-label="Tutup detail tugas"
                            onClick={close}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#dce5ee] text-[#7488a1] hover:bg-slate-50"
                        >
                            <X size={21} />
                        </button>
                    </div>
                </div>

                <div className="space-y-5 px-6 py-6 sm:px-8">
                    <div className="flex gap-4 border-b border-[#e1e8f0] pb-5">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#eff7fa] text-[#21477F]">
                            <BriefcaseBusiness size={22} />
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-extrabold tracking-wide text-[#8b9db3] uppercase">
                                Informasi Tugas UMKM
                            </p>
                            <p className="mt-2 text-[13px] font-semibold">
                                {task.businessName ||
                                    'Nama UMKM belum tersedia'}
                            </p>
                            <p className="mt-1 text-xs leading-relaxed break-words text-[#7e91aa]">
                                {task.description?.trim() ||
                                    'Deskripsi tugas belum tersedia.'}
                            </p>
                        </div>
                    </div>

                    <div className="grid gap-3 rounded-xl bg-[#f6f8fb] p-4 sm:grid-cols-2">
                        <div className="flex items-start gap-2.5 text-[12px]">
                            <Wallet
                                className="mt-0.5 shrink-0 text-[#21477F]"
                                size={17}
                            />
                            <div>
                                <p className="text-[#7e91aa]">Upah</p>
                                <p className="mt-1 font-semibold">
                                    {formatWage(task.wage)}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-2.5 text-[12px]">
                            <Users
                                className="mt-0.5 shrink-0 text-[#21477F]"
                                size={17}
                            />
                            <div>
                                <p className="text-[#7e91aa]">Kuota pekerja</p>
                                <p className="mt-1 font-semibold">
                                    {task.workerQuota != null
                                        ? `${task.workerQuota} orang`
                                        : 'Belum tersedia'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-2.5 text-[12px] sm:col-span-2">
                            <MapPin
                                className="mt-0.5 shrink-0 text-[#21477F]"
                                size={17}
                            />
                            <div>
                                <p className="text-[#7e91aa]">
                                    Lokasi pekerjaan
                                </p>
                                <p className="mt-1 font-semibold">
                                    {task.location || 'Belum tersedia'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 border-b border-[#e1e8f0] pb-5">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#eff7fa] text-[#21477F]">
                            <FileText size={22} />
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-extrabold tracking-wide text-[#8b9db3] uppercase">
                                Dokumen &amp; Bukti
                            </p>
                            <p className="mt-2 text-[13px] font-semibold">
                                Data pendukung tugas
                            </p>
                            <p className="mt-1 text-xs text-[#7e91aa]">
                                {evidenceDescription}
                            </p>
                        </div>
                        {task.evidenceStatus === 'valid' && (
                            <span className="rounded-xl bg-[#eff7fa] px-3 py-2 text-sm font-bold text-[#21477F]">
                                Valid
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-4 border-b border-[#e1e8f0] pb-5">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#eff7fa] text-[#21477F]">
                            <History size={22} />
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-extrabold tracking-wide text-[#8b9db3] uppercase">
                                Aktivitas Terakhir
                            </p>
                            <p className="mt-2 text-[13px] font-semibold">
                                {formatTime(
                                    task.updatedAt ||
                                        task.submittedAt ||
                                        task.createdAt,
                                )}
                            </p>
                            <p className="mt-1 text-xs text-[#7e91aa]">
                                Waktu berdasarkan data pembaruan tugas yang
                                tercatat.
                            </p>
                        </div>
                        <Clock3 className="shrink-0 text-[#b9c7d7]" size={19} />
                    </div>

                    {task.reviewNotes && (
                        <p className="rounded-xl bg-[#fff7e9] p-3 text-xs text-[#925c19]">
                            Catatan pemeriksaan: {task.reviewNotes}
                        </p>
                    )}

                    <div className="flex items-center gap-3 rounded-xl bg-[#f5f7fa] px-4 py-4 text-[11px] text-[#8495ad]">
                        <ShieldCheck
                            className="shrink-0 text-[#21477F]"
                            size={18}
                        />
                        Tombol di bawah hanya menandai bahwa detail telah dibaca
                        pada tampilan ini. Keputusan tugas disimpan melalui
                        Setujui atau Tolak pada tabel.
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[#e1e8f0] bg-[#f7f9fc] px-6 py-5 sm:px-8">
                    <button
                        type="button"
                        onClick={close}
                        className="rounded-xl px-5 py-3 text-sm font-semibold text-[#70829c] hover:bg-[#e8eef6]"
                    >
                        Tutup
                    </button>
                    <button
                        type="button"
                        onClick={() =>
                            onReviewed ? onReviewed(task) : close()
                        }
                        className="inline-flex items-center gap-2 rounded-xl bg-[#21477F] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#173760]"
                    >
                        <BadgeCheck size={18} />
                        Tandai Sudah Ditinjau
                    </button>
                </div>
            </section>
        </div>
    );
}
