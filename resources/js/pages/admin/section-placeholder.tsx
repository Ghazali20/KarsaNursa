import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Construction } from 'lucide-react';

type Props = {
    title: string;
    description: string;
};

export default function AdminSectionPlaceholder({ title, description }: Props) {
    return (
        <>
            <Head title={`${title} - Admin KarsaNursa`} />

            <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-8">
                <div className="mx-auto max-w-6xl space-y-6">
                    {/* HEADER */}
                    <div>
                        <p className="text-sm font-semibold text-blue-700">
                            KarsaNursa · Admin
                        </p>

                        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
                            {title}
                        </h1>

                        <p className="mt-2 text-sm text-slate-600">
                            {description}
                        </p>
                    </div>

                    {/* HALAMAN AWAL */}
                    <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
                        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                            <Construction size={30} />
                        </div>

                        <h2 className="text-xl font-semibold">
                            Halaman Sedang Dikembangkan
                        </h2>

                        <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-500">
                            Menu {title} sudah tersedia dalam navigasi Admin.
                            Fitur pengelolaan data pada halaman ini akan
                            dikembangkan berikutnya.
                        </p>

                        <Link
                            href="/admin"
                            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800"
                        >
                            <ArrowLeft size={16} />
                            Kembali ke Dashboard
                        </Link>
                    </div>
                </div>
            </main>
        </>
    );
}
