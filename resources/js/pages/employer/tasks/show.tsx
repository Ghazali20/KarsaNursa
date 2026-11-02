
import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    CalendarDays,
    MapPin,
    Send,
    Users,
    WalletCards,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

type TaskDetail = {
    id: number;
    title: string;
    category: string;
    description: string;
    requirements: string | null;
    instructions: string | null;
    locationAddress: string;
    latitude: string;
    longitude: string;
    attendanceRadiusMeters: number;
    applicationDeadline: string;
    startsAt: string;
    endsAt: string;
    workerQuota: number;
    wageAmount: number;
    status: string;
    statusLabel: string;
    publishedAt: string | null;
};

type ShowTaskProps = {
    task: TaskDetail;
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

export default function ShowTask({ task }: ShowTaskProps) {
    const handlePublish = () => {
        if (
            confirm(
                'Apakah Anda yakin ingin mempublikasikan tugas ini?',
            )
        ) {
            router.patch(
                `/employer/tasks/${task.id}/publish`,
            );
        }
    };

    return (
        <>
            <Head title={task.title} />

            <main className="flex flex-1 flex-col bg-slate-50/70">
                <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between">
                        <Button variant="ghost" asChild>
                            <Link href="/employer/dashboard">
                                <ArrowLeft />
                                Kembali ke dashboard
                            </Link>
                        </Button>

                        {task.status === 'draft' && (
                            <Button
                                onClick={handlePublish}
                                className="bg-emerald-600 hover:bg-emerald-700"
                            >
                                <Send className="mr-2 size-4" />
                                Publikasikan Tugas
                            </Button>
                        )}
                    </div>

                    <Card>
                        <CardHeader>
                            <div className="flex flex-wrap items-center gap-2">
                                <span
                                    className={
                                        task.status === 'published'
                                            ? 'rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700'
                                            : 'rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700'
                                    }
                                >
                                    {task.statusLabel}
                                </span>

                                <span className="text-sm capitalize text-muted-foreground">
                                    {task.category}
                                </span>
                            </div>

                            <CardTitle className="mt-3 text-2xl">
                                {task.title}
                            </CardTitle>

                            <CardDescription>
                                Informasi lengkap tugas harian.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-8">
                            <div className="grid gap-4 sm:grid-cols-3">
                                <div className="rounded-xl bg-muted p-4">
                                    <Users className="size-5 text-primary" />
                                    <div className="mt-3 text-sm text-muted-foreground">
                                        Jumlah pekerja
                                    </div>
                                    <div className="mt-1 font-bold">
                                        {task.workerQuota} orang
                                    </div>
                                </div>

                                <div className="rounded-xl bg-muted p-4">
                                    <WalletCards className="size-5 text-primary" />
                                    <div className="mt-3 text-sm text-muted-foreground">
                                        Upah per pekerja
                                    </div>
                                    <div className="mt-1 font-bold">
                                        {formatCurrency(task.wageAmount)}
                                    </div>
                                </div>

                                <div className="rounded-xl bg-muted p-4">
                                    <CalendarDays className="size-5 text-primary" />
                                    <div className="mt-3 text-sm text-muted-foreground">
                                        Waktu mulai
                                    </div>
                                    <div className="mt-1 text-sm font-bold">
                                        {formatDate(task.startsAt)}
                                    </div>
                                </div>
                            </div>

                            <section>
                                <div className="font-bold">
                                    Deskripsi pekerjaan
                                </div>
                                <p className="mt-2 whitespace-pre-line text-sm leading-7 text-muted-foreground">
                                    {task.description}
                                </p>
                            </section>

                            {task.requirements && (
                                <section>
                                    <div className="font-bold">
                                        Persyaratan
                                    </div>
                                    <p className="mt-2 whitespace-pre-line text-sm leading-7 text-muted-foreground">
                                        {task.requirements}
                                    </p>
                                </section>
                            )}

                            {task.instructions && (
                                <section>
                                    <div className="font-bold">
                                        Instruksi tambahan
                                    </div>
                                    <p className="mt-2 whitespace-pre-line text-sm leading-7 text-muted-foreground">
                                        {task.instructions}
                                    </p>
                                </section>
                            )}

                            <section>
                                <div className="flex items-center gap-2 font-bold">
                                    <MapPin className="size-4" />
                                    Lokasi
                                </div>

                                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                                    {task.locationAddress}
                                </p>

                                <p className="mt-1 text-xs text-muted-foreground">
                                    Radius presensi:{' '}
                                    {task.attendanceRadiusMeters} meter
                                </p>
                            </section>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </>
    );
}