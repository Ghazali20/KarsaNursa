import { Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
    CalendarDays,
    MapPin,
    Search,
    Users,
    WalletCards,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

type WorkerTask = {
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
    };
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type TasksPage = {
    data: WorkerTask[];
    links: PaginationLink[];
};

type WorkerTasksIndexProps = {
    tasks: TasksPage;
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
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}

export default function WorkerTasksIndex({ tasks }: WorkerTasksIndexProps) {
    return (
        <>
            <Head title="Cari Tugas" />

            <main className="flex flex-1 flex-col bg-slate-50/70">
                <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                    {/* HEADER */}
                    <header className="rounded-3xl bg-[var(--karsa-deep-navy)] px-6 py-8 text-white">
                        <div className="flex size-12 items-center justify-center rounded-xl bg-white/10">
                            <Search className="size-6" />
                        </div>

                        <div className="mt-5 text-2xl font-extrabold">
                            Temukan tugas harian
                        </div>

                        <p className="mt-2 max-w-2xl text-sm leading-6 text-white/70">
                            Jelajahi tugas yang telah dipublikasikan UMKM dan
                            pilih pekerjaan yang sesuai dengan jadwal Anda.
                        </p>
                    </header>

                    {/* DAFTAR TUGAS */}
                    {tasks.data.length === 0 ? (
                        <Card>
                            <CardContent className="flex min-h-72 flex-col items-center justify-center text-center">
                                <Search className="size-8 text-muted-foreground" />

                                <div className="mt-5 text-lg font-bold">
                                    Belum ada tugas tersedia
                                </div>

                                <p className="mt-2 max-w-md text-sm text-muted-foreground">
                                    Tugas yang dipublikasikan UMKM dan masih
                                    membuka lamaran akan muncul di halaman ini.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                            {tasks.data.map((task) => (
                                <Card key={task.id}>
                                    <CardHeader>
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 capitalize">
                                                {task.category}
                                            </span>

                                            <span className="text-xs text-muted-foreground">
                                                {task.business.name}
                                            </span>
                                        </div>

                                        <CardTitle className="mt-3">
                                            {task.title}
                                        </CardTitle>

                                        <CardDescription className="line-clamp-3">
                                            {task.description}
                                        </CardDescription>
                                    </CardHeader>

                                    <CardContent className="space-y-3">
                                        <div className="flex items-start gap-2 text-sm text-muted-foreground">
                                            <MapPin className="mt-0.5 size-4 shrink-0" />
                                            <span>{task.locationAddress}</span>
                                        </div>

                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <CalendarDays className="size-4" />
                                            {formatDate(task.startsAt)}
                                        </div>

                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Users className="size-4" />
                                            {task.workerQuota} pekerja
                                        </div>

                                        <div className="flex items-center gap-2 font-bold text-slate-950">
                                            <WalletCards className="size-4 text-emerald-600" />
                                            {formatCurrency(task.wageAmount)}
                                        </div>
                                    </CardContent>

                                    <CardFooter>
                                        <Button className="w-full" asChild>
                                            <Link
                                                href={`/worker/tasks/${task.id}`}
                                            >
                                                Lihat detail
                                                <ArrowRight />
                                            </Link>
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </>
    );
}
