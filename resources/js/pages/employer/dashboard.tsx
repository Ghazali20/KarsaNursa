import { Head } from '@inertiajs/react';

export default function EmployerDashboard() {
    return (
        <>
            <Head title="Dashboard UMKM" />

            <section className="p-6">
                <h1 className="text-2xl font-extrabold text-[var(--karsa-deep-navy)]">
                    Dashboard UMKM
                </h1>
                <p className="mt-2 text-sm text-[var(--karsa-muted)]">
                    Halaman ini akan diisi dengan dashboard UMKM KarsaNusa.
                </p>
            </section>
        </>
    );
}
