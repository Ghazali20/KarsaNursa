import { Head, Link, router } from '@inertiajs/react';
import {
    CalendarDays,
    ClipboardPlus,
    Eye,
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

type TaskItem = {
    id: number;
    title: string;
    category: string;
    status: string;
    statusLabel: string;
    workerQuota: number;
    wageAmount: number;
    applicationDeadline: string;
    startsAt: string;
    endsAt: string;
    publishedAt: string | null;
    canPublish: boolean;
    applicantsCount: number;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type TasksPage = {
    data: TaskItem[];
    links: PaginationLink[];
};

type EmployerTasksIndexProps = {
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

export default function EmployerTasksIndex({ tasks }: EmployerTasksIndexProps) {
    function publishTask(task: TaskItem): void {
        const confirmed = window.confirm(
            `Publikasikan tugas "${task.title}" sekarang?`,
        );

        if (!confirmed) {
            return;
        }

        router.patch(
            `/employer/tasks/${task.id}/publish`,
            {},
            {
                preserveScroll: true,
            },
        );
    }

    return (
        <>
            <Head title="Kelola Tugas" />

            <main className="flex flex-1 flex-col bg-slate-50/70">
                <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h1 className="text-2xl font-extrabold text-slate-950">
                                Kelola tugas
                            </h1>

                            <p className="mt-1 text-sm text-slate-500">
                                Kelola draft dan tugas yang telah
                                dipublikasikan.
                            </p>
                        </div>

                        <Button asChild>
                            <Link href="/employer/tasks/create">
                                <ClipboardPlus />
                                Buat tugas baru
                            </Link>
                        </Button>
                    </div>

                    {/* Empty State */}
                    {tasks.data.length === 0 ? (
                        <Card>
                            <CardContent className="flex min-h-72 flex-col items-center justify-center text-center">
                                <h2 className="text-lg font-bold">
                                    Belum ada tugas
                                </h2>

                                <p className="mt-2 max-w-md text-sm text-muted-foreground">
                                    Buat draft atau publikasikan tugas pertama
                                    untuk menemukan pekerja lokal.
                                </p>

                                <Button className="mt-5" asChild>
                                    <Link href="/employer/tasks/create">
                                        Buat tugas pertama
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        /* Task List */
                        <div className="grid gap-4">
                            {tasks.data.map((task) => (
                                <Card key={task.id}>
                                    <CardHeader>
                                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                            {/* Task Information */}
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span
                                                        className={
                                                            task.status ===
                                                            'published'
                                                                ? 'rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700'
                                                                : 'rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700'
                                                        }
                                                    >
                                                        {task.statusLabel}
                                                    </span>

                                                    <span className="text-xs font-medium text-muted-foreground capitalize">
                                                        {task.category}
                                                    </span>
                                                </div>

                                                <CardTitle className="mt-3">
                                                    {task.title}
                                                </CardTitle>

                                                <CardDescription className="mt-2">
                                                    Batas lamaran:{' '}
                                                    {formatDate(
                                                        task.applicationDeadline,
                                                    )}
                                                </CardDescription>
                                            </div>

                                            {/* Task Actions */}
                                            <div className="flex flex-wrap gap-2">
                                                <Button
                                                    variant="outline"
                                                    asChild
                                                >
                                                    <Link
                                                        href={`/employer/tasks/${task.id}`}
                                                    >
                                                        <Eye />
                                                        Detail
                                                    </Link>
                                                </Button>

                                                {task.canPublish && (
                                                    <Button
                                                        type="button"
                                                        onClick={() =>
                                                            publishTask(task)
                                                        }
                                                    >
                                                        <Send />
                                                        Publikasikan
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </CardHeader>

                                    {/* Task Details */}
                                    <CardContent>
                                        <div className="grid gap-3 text-sm sm:grid-cols-3">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <CalendarDays className="size-4" />
                                                {formatDate(task.startsAt)}
                                            </div>

                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Users className="size-4" />
                                                {task.workerQuota} pekerja
                                            </div>

                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <WalletCards className="size-4" />
                                                {formatCurrency(
                                                    task.wageAmount,
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </>
    );
}
