import { Head } from '@inertiajs/react';

export default function AdminDashboard() {
    return (
        <>
            <Head title="Admin Console" />

            <section className="p-6">
                <h1 className="text-2xl font-extrabold text-[var(--karsa-deep-navy)]">
                    Admin Console
                </h1>
                <p className="mt-2 text-sm text-[var(--karsa-muted)]">
                    Halaman ini akan diisi dengan Admin Console KarsaNusa.
                </p>
            </section>
        </>
    );
}
