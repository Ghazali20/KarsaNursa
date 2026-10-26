import { Head } from '@inertiajs/react';
import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { ClipboardPlus } from 'lucide-react';

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

            <Button asChild>
                <Link href="/employer/tasks/create">
                    <ClipboardPlus />
                    Buat tugas baru
                </Link>
            </Button>

            <Button asChild>
                <Link href="/employer/tasks/create">Buat tugas pertama</Link>
            </Button>
        </>
    );
}
