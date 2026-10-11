import { Head } from '@inertiajs/react';

export default function WorkerDashboard() {
    return (
        <>
            <Head title="Dashboard Pekerja" />

            <section className="p-6">
                <h1 className="text-2xl font-extrabold text-[var(--karsa-deep-navy)]">
                    Dashboard Pekerja
                </h1>
                <p className="mt-2 text-sm text-[var(--karsa-muted)]">
                    Halaman ini akan diisi dengan dashboard pekerja KarsaNusa.
                </p>
            </section>
        </>
    );
}
