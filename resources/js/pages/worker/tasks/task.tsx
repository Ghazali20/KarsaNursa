import { Head, Link, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    CalendarDays,
    MapPin,
    Users,
    WalletCards,
    Building2,
    CheckCircle2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type WorkerTaskDetail = {
    id: number;
    title: string;
    category: string;
    description: string;
    locationAddress: string;
    workerQuota: number;
    wageAmount: number;
    applicationDeadline: string;
    startsAt: string;
    endsAt: string;
    business: {
        name: string;
        address: string | null;
        description?: string | null;
    };
    hasApplied?: boolean; // Status apakah user sudah melamar (opsional jika dari backend dikirim)
};

type WorkerTaskShowProps = {
    task: WorkerTaskDetail;
};

function formatCurrency(value: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(value);
}

function formatDate(value: string): string {
    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'full',
        timeStyle: 'short',
    }).format(new Date(value));
}

export default function WorkerTaskShow({ task }: WorkerTaskShowProps) {
    const { post, processing } = useForm({});

    const handleApply = (e: React.FormEvent) => {
        e.preventDefault();
        // Sesuaikan route endpoint lamaran backend Anda, misal: /worker/tasks/{id}/apply
        post(`/worker/tasks/${task.id}/apply`);
    };

    return (
        <>
            <Head title={task.title} />

            <main className="flex flex-1 flex-col bg-slate-50/70">
                <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                    {/* TOMBOL KEMBALI */}
                    <div>
                        <Button
                            variant="ghost"
                            asChild
                            className="gap-2 pl-0 hover:bg-transparent"
                        >
                            <Link href="/worker/tasks">
                                <ArrowLeft className="size-4" />
                                Kembali ke Daftar Tugas
                            </Link>
                        </Button>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-3">
                        {/* KONTEN UTAMA (KIRI) */}
                        <div className="space-y-6 lg:col-span-2">
                            <Card>
                                <CardHeader className="space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 capitalize">
                                            {task.category}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            Batas Lamaran:{' '}
                                            {formatDate(
                                                task.applicationDeadline,
                                            )}
                                        </span>
                                    </div>

                                    <CardTitle className="text-2xl font-bold text-slate-900">
                                        {task.title}
                                    </CardTitle>

                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Building2 className="size-4 text-slate-500" />
                                        <span className="font-medium text-slate-700">
                                            {task.business.name}
                                        </span>
                                    </div>
                                </CardHeader>

                                <CardContent className="space-y-6">
                                    {/* INFO UTAMA: Waktu, Lokasi, Kuota, Upah */}
                                    <div className="grid gap-4 rounded-2xl bg-slate-50 p-4 sm:grid-cols-2">
                                        <div className="flex items-start gap-3">
                                            <CalendarDays className="mt-0.5 size-5 shrink-0 text-blue-600" />
                                            <div>
                                                <div className="text-xs text-muted-foreground">
                                                    Jadwal Tugas
                                                </div>
                                                <div className="text-sm font-medium text-slate-800">
                                                    Mulai:{' '}
                                                    {formatDate(task.startsAt)}
                                                </div>
                                                <div className="text-sm font-medium text-slate-800">
                                                    Selesai:{' '}
                                                    {formatDate(task.endsAt)}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3">
                                            <MapPin className="mt-0.5 size-5 shrink-0 text-rose-600" />
                                            <div>
                                                <div className="text-xs text-muted-foreground">
                                                    Lokasi Kerja
                                                </div>
                                                <div className="text-sm font-medium text-slate-800">
                                                    {task.locationAddress}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3">
                                            <Users className="mt-0.5 size-5 shrink-0 text-indigo-600" />
                                            <div>
                                                <div className="text-xs text-muted-foreground">
                                                    Kuota Pekerja
                                                </div>
                                                <div className="text-sm font-medium text-slate-800">
                                                    {task.workerQuota} orang
                                                    dibutuhkan
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3">
                                            <WalletCards className="mt-0.5 size-5 shrink-0 text-emerald-600" />
                                            <div>
                                                <div className="text-xs text-muted-foreground">
                                                    Upah / Gaji
                                                </div>
                                                <div className="text-base font-bold text-emerald-700">
                                                    {formatCurrency(
                                                        task.wageAmount,
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* DESKRIPSI TUGAS */}
                                    <div className="space-y-2">
                                        <h3 className="text-base font-bold text-slate-900">
                                            Deskripsi Tugas
                                        </h3>
                                        <div className="text-sm leading-relaxed whitespace-pre-line text-slate-600">
                                            {task.description}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* SIDEBAR AKSI / LAMAR (KANAN) */}
                        <div>
                            <Card className="sticky top-6">
                                <CardHeader>
                                    <CardTitle className="text-lg">
                                        Kirim Lamaran
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <p className="text-sm text-muted-foreground">
                                        Pastikan jadwal Anda kosong dan sesuai
                                        dengan persyaratan tugas yang tertera
                                        sebelum melamar.
                                    </p>

                                    <form onSubmit={handleApply}>
                                        <Button
                                            type="submit"
                                            className="w-full"
                                            disabled={
                                                processing || task.hasApplied
                                            }
                                        >
                                            {task.hasApplied ? (
                                                <>
                                                    <CheckCircle2 className="mr-2 size-4" />
                                                    Sudah Melamar
                                                </>
                                            ) : (
                                                'Lamar Tugas Ini'
                                            )}
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}
