import { Head } from '@inertiajs/react';
import {
    Clock,
    FileSpreadsheet,
    ShieldCheck,
    TrendingUp,
    Wallet,
} from 'lucide-react';
import { useMemo, useState } from 'react';

type EarningRow = {
    id: number;
    taskTitle: string;
    businessName: string;
    dateLabel: string;
    hoursLabel: string;
    wageAmount: number;
    statusKey: 'approved' | 'processing' | 'pending';
    statusLabel: string;
};

type Props = {
    periodLabel?: string;
    availableEarnings?: number;
    monthlyEarnings?: number;
    totalHours?: number;
    completedCount?: number;
    items?: EarningRow[];
};

function formatRupiah(value: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(value);
}

function statusBadgeStyle(statusKey: EarningRow['statusKey']): string {
    if (statusKey === 'approved') {
        return 'bg-[#E1F3F2] text-[#186A66]';
    }
    if (statusKey === 'processing') {
        return 'bg-[#FEF3C7] text-[#B45309]';
    }
    return 'bg-slate-100 text-slate-600';
}

export default function WorkerEarningsIndex({
    periodLabel = 'November 2026',
    availableEarnings = 0,
    monthlyEarnings = 0,
    totalHours = 0,
    completedCount = 0,
    items = [],
}: Props) {
    const [statusFilter, setStatusFilter] = useState<'all' | EarningRow['statusKey']>('all');

    const filteredItems = useMemo(() => {
        if (statusFilter === 'all') return items;

        return items.filter((row) => row.statusKey === statusFilter);
    }, [items, statusFilter]);

    const handleDownloadRecap = () => {
        const headers = ['Tugas', 'UMKM', 'Tanggal', 'Jam', 'Upah (IDR)', 'Status'];
        const csvLines = [
            headers.join(','),
            ...filteredItems.map((row) =>
                [
                    `"${row.taskTitle.replace(/"/g, '""')}"`,
                    `"${row.businessName.replace(/"/g, '""')}"`,
                    `"${row.dateLabel}"`,
                    `"${row.hoursLabel}"`,
                    row.wageAmount,
                    `"${row.statusLabel}"`,
                ].join(','),
            ),
        ];

        const blob = new Blob([csvLines.join('\n')], {
            type: 'text/csv;charset=utf-8;',
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `rekap-pendapatan-${periodLabel.toLowerCase().replace(/\s+/g, '-')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <>
            <Head title="Pendapatan Saya - KarsaNursa" />

            <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-8 sm:py-8">
                {/* 1. HEADER LEDGER UPAH */}
                <section className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                            LEDGER UPAH
                        </p>
                        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                            Pendapatan saya
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Seluruh upah tercatat otomatis dan diterima penuh
                            tanpa biaya tersembunyi.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleDownloadRecap}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-800 shadow-2xs transition hover:bg-slate-50"
                    >
                        <span>Unduh Rekap</span>
                        <FileSpreadsheet className="size-4 text-slate-500" />
                    </button>
                </section>

                {/* 2. BANNER 100% UPAH */}
                <section className="flex flex-col justify-between gap-3 rounded-2xl border border-[#CBE7EA] bg-[#F2FAFB] px-5 py-4 sm:flex-row sm:items-center">
                    <div className="flex items-start gap-3.5 sm:items-center">
                        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-[#1E4479] sm:mt-0" />
                        <div>
                            <p className="text-sm font-bold text-slate-900">
                                100% upah adalah hak Anda
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">
                                KarsaNusa tidak memotong pendapatan pekerja.
                                Ledger ini adalah pencatatan transparan, bukan
                                payment gateway.
                            </p>
                        </div>
                    </div>

                    <span className="self-start rounded-full bg-[#DCF0F2] px-3.5 py-1 text-xs font-bold text-[#186A66] sm:self-center">
                        Zero Hidden Fee
                    </span>
                </section>

                {/* 3. TIGA KARTU RINGKASAN PENDAPATAN */}
                <section className="grid gap-4 md:grid-cols-3">
                    {/* PENDAPATAN TERSEDIA (NAVY) */}
                    <div className="flex items-center gap-4 rounded-2xl bg-[#0D254C] p-6 text-white shadow-sm">
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-teal-200">
                            <Wallet className="size-6" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-slate-300">
                                Pendapatan tersedia
                            </p>
                            <p className="mt-1 text-2xl font-extrabold tracking-tight text-white">
                                {formatRupiah(availableEarnings)}
                            </p>
                            <p className="mt-1 text-[11px] text-slate-300/80">
                                Siap dicatat sebagai diterima
                            </p>
                        </div>
                    </div>

                    {/* PENDAPATAN BULAN INI */}
                    <div className="flex items-center gap-4 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xs">
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#EAF1FA] text-[#1E4479]">
                            <TrendingUp className="size-6" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-slate-500">
                                Pendapatan bulan ini
                            </p>
                            <p className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">
                                {formatRupiah(monthlyEarnings)}
                            </p>
                            <p className="mt-1 text-[11px] text-slate-400">
                                Periode {periodLabel}
                            </p>
                        </div>
                    </div>

                    {/* TOTAL JAM KERJA */}
                    <div className="flex items-center gap-4 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xs">
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#EAF1FA] text-[#1E4479]">
                            <Clock className="size-6" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-slate-500">
                                Total jam kerja
                            </p>
                            <p className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">
                                {totalHours.toLocaleString('id-ID')} Jam
                            </p>
                            <p className="mt-1 text-[11px] text-slate-400">
                                {completedCount} tugas diselesaikan
                            </p>
                        </div>
                    </div>
                </section>

                {/* 4. TABEL RINCIAN PENDAPATAN */}
                <section className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xs sm:p-7">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-extrabold text-slate-900">
                                Rincian pendapatan
                            </h2>
                            <p className="mt-0.5 text-xs text-slate-400">
                                {periodLabel}
                            </p>
                        </div>

                        <select
                            aria-label="Filter status pendapatan"
                            value={statusFilter}
                            onChange={(e) =>
                                setStatusFilter(
                                    e.target.value as
                                        | 'all'
                                        | EarningRow['statusKey'],
                                )
                            }
                            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 focus:border-[#1E4479] focus:outline-none"
                        >
                            <option value="all">Semua status</option>
                            <option value="approved">Disetujui</option>
                            <option value="processing">Diproses</option>
                            <option value="pending">Berjalan</option>
                        </select>
                    </div>

                    {filteredItems.length === 0 ? (
                        <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-6 py-12 text-center">
                            <p className="text-sm font-bold text-slate-800">
                                Belum ada catatan pendapatan
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                                Upah dari tugas harian yang kamu kerjakan dan
                                dibayar UMKM akan tampil di sini.
                            </p>
                        </div>
                    ) : (
                        <div className="mt-5 overflow-x-auto">
                            <table className="w-full min-w-[640px] text-left text-sm">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/80 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                                        <th className="rounded-l-lg px-4 py-3">
                                            TUGAS & UMKM
                                        </th>
                                        <th className="px-4 py-3">TANGGAL</th>
                                        <th className="px-4 py-3">JAM</th>
                                        <th className="px-4 py-3">UPAH</th>
                                        <th className="rounded-r-lg px-4 py-3 text-right">
                                            STATUS
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredItems.map((row) => (
                                        <tr
                                            key={row.id}
                                            className="transition hover:bg-slate-50/60"
                                        >
                                            <td className="px-4 py-4">
                                                <p className="font-bold text-slate-900">
                                                    {row.taskTitle}
                                                </p>
                                                <p className="mt-0.5 text-xs text-slate-400">
                                                    {row.businessName}
                                                </p>
                                            </td>
                                            <td className="px-4 py-4 text-xs text-slate-600">
                                                {row.dateLabel}
                                            </td>
                                            <td className="px-4 py-4 text-xs text-slate-600">
                                                {row.hoursLabel}
                                            </td>
                                            <td className="px-4 py-4 text-xs font-extrabold text-slate-900">
                                                {formatRupiah(row.wageAmount)}
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <span
                                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${statusBadgeStyle(
                                                        row.statusKey,
                                                    )}`}
                                                >
                                                    {row.statusLabel}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </main>
        </>
    );
}