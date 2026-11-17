import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { ArrowLeft, Bell, CheckCheck, XCircle } from 'lucide-react';

type WorkerNotification = {
    id: string;
    title: string;
    message: string;
    reason: string;
    taskTitle: string;
    automatic: boolean;
    readAt: string | null;
    createdAt: string | null;
};

type Props = {
    notifications: WorkerNotification[];
    unreadCount: number;
};

export default function WorkerNotificationsIndex({
    notifications,
    unreadCount,
}: Props) {
    const [processingId, setProcessingId] = useState<string | null>(null);

    function markAsRead(id: string) {
        if (processingId !== null) return;

        setProcessingId(id);
        router.patch(
            `/worker/notifications/${encodeURIComponent(id)}/read`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setProcessingId(null),
            },
        );
    }

    return (
        <>
            <Head title="Notifikasi - KarsaNursa" />
            <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
                <div className="mx-auto max-w-4xl space-y-6">
                    <Link
                        href="/worker/dashboard"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700"
                    >
                        <ArrowLeft className="size-4" />
                        Kembali ke Dashboard
                    </Link>

                    <header className="rounded-3xl bg-[var(--karsa-deep-navy)] p-7 text-white">
                        <div className="flex items-center gap-3">
                            <Bell className="size-7" />
                            <div>
                                <h1 className="text-2xl font-extrabold">
                                    Notifikasi Saya
                                </h1>
                                <p className="mt-2 text-sm text-white/75">
                                    {unreadCount} notifikasi belum dibaca
                                </p>
                            </div>
                        </div>
                    </header>

                    {notifications.length === 0 ? (
                        <section className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
                            <Bell className="mx-auto size-10 text-slate-400" />
                            <p className="mt-3 text-sm text-slate-500">
                                Belum ada notifikasi.
                            </p>
                        </section>
                    ) : (
                        <section className="space-y-3">
                            {notifications.map((item) => (
                                <article
                                    key={item.id}
                                    className={`rounded-2xl border p-5 shadow-sm ${
                                        item.readAt === null
                                            ? 'border-red-200 bg-red-50'
                                            : 'border-slate-200 bg-white'
                                    }`}
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div className="flex flex-1 items-start gap-3">
                                            <XCircle className="mt-0.5 size-5 shrink-0 text-red-600" />
                                            <div className="space-y-2">
                                                <h2 className="font-bold text-slate-900">
                                                    {item.title}
                                                </h2>
                                                <p className="text-sm text-slate-600">
                                                    {item.message}
                                                </p>
                                                {item.reason && (
                                                    <p className="text-sm font-medium text-red-700">
                                                        Alasan: {item.reason}
                                                    </p>
                                                )}
                                                <p className="text-xs text-slate-500">
                                                    {item.createdAt ?? '-'}
                                                    {item.automatic
                                                        ? ' · Penolakan otomatis'
                                                        : ''}
                                                </p>
                                                <Link
                                                    href="/worker/applications"
                                                    className="inline-block text-sm font-semibold text-blue-700 hover:underline"
                                                >
                                                    Lihat Lamaran Saya
                                                </Link>
                                            </div>
                                        </div>
                                        {item.readAt === null && (
                                            <button
                                                type="button"
                                                disabled={processingId !== null}
                                                onClick={() =>
                                                    markAsRead(item.id)
                                                }
                                                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                                            >
                                                <CheckCheck className="size-4" />
                                                Tandai dibaca
                                            </button>
                                        )}
                                    </div>
                                </article>
                            ))}
                        </section>
                    )}
                </div>
            </main>
        </>
    );
}
