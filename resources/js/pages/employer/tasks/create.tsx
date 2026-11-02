import { Form, Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    BriefcaseBusiness,
    Clock3,
    MapPin,
    Save,
    Send,
    Users,
    WalletCards,
} from 'lucide-react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

type Category = {
    value: string;
    label: string;
};

type CreateTaskProps = {
    categories: Category[];
    defaults: {
        attendanceRadiusMeters: number;
    };
};

export default function CreateTask({ categories, defaults }: CreateTaskProps) {
    return (
        <>
            <Head title="Buat Tugas Harian" />

            <main className="flex flex-1 flex-col bg-muted/30">
                <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <Button variant="ghost" size="sm" asChild>
                                <Link href="/employer/dashboard">
                                    <ArrowLeft />
                                    Kembali ke dashboard
                                </Link>
                            </Button>

                            <div className="mt-4 flex items-center gap-3">
                                <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                                    <BriefcaseBusiness className="size-5" />
                                </div>

                                <div>
                                    <div className="text-2xl font-bold tracking-tight">
                                        Buat tugas harian
                                    </div>

                                    <div className="mt-1 text-sm text-muted-foreground">
                                        Lengkapi informasi pekerjaan sebelum
                                        menyimpan draft atau mempublikasikannya.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Form
                        action="/employer/tasks"
                        method="post"
                        options={{
                            preserveScroll: true,
                        }}
                    >
                        {({ errors, processing }) => (
                            <div className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Informasi dasar</CardTitle>

                                        <CardDescription>
                                            Informasi utama yang akan dilihat
                                            pencari kerja.
                                        </CardDescription>
                                    </CardHeader>

                                    <CardContent className="space-y-5">
                                        <div className="space-y-2">
                                            <Label htmlFor="title">
                                                Judul tugas
                                            </Label>

                                            <Input
                                                id="title"
                                                name="title"
                                                placeholder="Contoh: Membantu pengemasan produk"
                                                required
                                                maxLength={150}
                                                aria-invalid={
                                                    errors.title
                                                        ? true
                                                        : undefined
                                                }
                                            />

                                            <InputError
                                                message={errors.title}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="category">
                                                Kategori
                                            </Label>

                                            <Select name="category" required>
                                                <SelectTrigger
                                                    id="category"
                                                    className="w-full"
                                                    aria-invalid={
                                                        errors.category
                                                            ? true
                                                            : undefined
                                                    }
                                                >
                                                    <SelectValue placeholder="Pilih kategori tugas" />
                                                </SelectTrigger>

                                                <SelectContent>
                                                    {categories.map(
                                                        (category) => (
                                                            <SelectItem
                                                                key={
                                                                    category.value
                                                                }
                                                                value={
                                                                    category.value
                                                                }
                                                            >
                                                                {category.label}
                                                            </SelectItem>
                                                        ),
                                                    )}
                                                </SelectContent>
                                            </Select>

                                            <InputError
                                                message={errors.category}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="description">
                                                Deskripsi pekerjaan
                                            </Label>

                                            <Textarea
                                                id="description"
                                                name="description"
                                                placeholder="Jelaskan pekerjaan yang perlu dilakukan, hasil yang diharapkan, serta kondisi kerja."
                                                required
                                                minLength={20}
                                                maxLength={5000}
                                                aria-invalid={
                                                    errors.description
                                                        ? true
                                                        : undefined
                                                }
                                            />

                                            <InputError
                                                message={errors.description}
                                            />
                                        </div>

                                        <div className="grid gap-5 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="requirements">
                                                    Persyaratan
                                                </Label>

                                                <Textarea
                                                    id="requirements"
                                                    name="requirements"
                                                    placeholder="Contoh: Teliti, mampu bekerja dalam tim."
                                                    maxLength={3000}
                                                    aria-invalid={
                                                        errors.requirements
                                                            ? true
                                                            : undefined
                                                    }
                                                />

                                                <InputError
                                                    message={
                                                        errors.requirements
                                                    }
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="instructions">
                                                    Instruksi tambahan
                                                </Label>

                                                <Textarea
                                                    id="instructions"
                                                    name="instructions"
                                                    placeholder="Informasi tambahan untuk pekerja."
                                                    maxLength={3000}
                                                    aria-invalid={
                                                        errors.instructions
                                                            ? true
                                                            : undefined
                                                    }
                                                />

                                                <InputError
                                                    message={
                                                        errors.instructions
                                                    }
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <MapPin className="size-5" />
                                            Lokasi dan presensi
                                        </CardTitle>

                                        <CardDescription>
                                            Koordinat digunakan untuk validasi
                                            check-in dan check-out.
                                        </CardDescription>
                                    </CardHeader>

                                    <CardContent className="space-y-5">
                                        <div className="space-y-2">
                                            <Label htmlFor="location_address">
                                                Alamat lengkap
                                            </Label>

                                            <Textarea
                                                id="location_address"
                                                name="location_address"
                                                placeholder="Masukkan alamat lengkap lokasi pekerjaan."
                                                required
                                                maxLength={1000}
                                                aria-invalid={
                                                    errors.location_address
                                                        ? true
                                                        : undefined
                                                }
                                            />

                                            <InputError
                                                message={
                                                    errors.location_address
                                                }
                                            />
                                        </div>

                                        <div className="grid gap-5 md:grid-cols-3">
                                            <div className="space-y-2">
                                                <Label htmlFor="latitude">
                                                    Latitude
                                                </Label>

                                                <Input
                                                    id="latitude"
                                                    name="latitude"
                                                    type="number"
                                                    step="0.0000001"
                                                    min="-90"
                                                    max="90"
                                                    placeholder="5.5483"
                                                    required
                                                    aria-invalid={
                                                        errors.latitude
                                                            ? true
                                                            : undefined
                                                    }
                                                />

                                                <InputError
                                                    message={errors.latitude}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="longitude">
                                                    Longitude
                                                </Label>

                                                <Input
                                                    id="longitude"
                                                    name="longitude"
                                                    type="number"
                                                    step="0.0000001"
                                                    min="-180"
                                                    max="180"
                                                    placeholder="95.3238"
                                                    required
                                                    aria-invalid={
                                                        errors.longitude
                                                            ? true
                                                            : undefined
                                                    }
                                                />

                                                <InputError
                                                    message={errors.longitude}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="attendance_radius_meters">
                                                    Radius presensi
                                                </Label>

                                                <Input
                                                    id="attendance_radius_meters"
                                                    name="attendance_radius_meters"
                                                    type="number"
                                                    min="50"
                                                    max="5000"
                                                    defaultValue={
                                                        defaults.attendanceRadiusMeters
                                                    }
                                                    required
                                                    aria-invalid={
                                                        errors.attendance_radius_meters
                                                            ? true
                                                            : undefined
                                                    }
                                                />

                                                <div className="text-xs text-muted-foreground">
                                                    Dalam meter.
                                                </div>

                                                <InputError
                                                    message={
                                                        errors.attendance_radius_meters
                                                    }
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Clock3 className="size-5" />
                                            Jadwal pekerjaan
                                        </CardTitle>

                                        <CardDescription>
                                            Tentukan batas lamaran dan waktu
                                            pelaksanaan tugas.
                                        </CardDescription>
                                    </CardHeader>

                                    <CardContent>
                                        <div className="grid gap-5 md:grid-cols-3">
                                            <div className="space-y-2">
                                                <Label htmlFor="application_deadline">
                                                    Batas lamaran
                                                </Label>

                                                <Input
                                                    id="application_deadline"
                                                    name="application_deadline"
                                                    type="datetime-local"
                                                    required
                                                    aria-invalid={
                                                        errors.application_deadline
                                                            ? true
                                                            : undefined
                                                    }
                                                />

                                                <InputError
                                                    message={
                                                        errors.application_deadline
                                                    }
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="starts_at">
                                                    Waktu mulai
                                                </Label>

                                                <Input
                                                    id="starts_at"
                                                    name="starts_at"
                                                    type="datetime-local"
                                                    required
                                                    aria-invalid={
                                                        errors.starts_at
                                                            ? true
                                                            : undefined
                                                    }
                                                />

                                                <InputError
                                                    message={errors.starts_at}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="ends_at">
                                                    Waktu selesai
                                                </Label>

                                                <Input
                                                    id="ends_at"
                                                    name="ends_at"
                                                    type="datetime-local"
                                                    required
                                                    aria-invalid={
                                                        errors.ends_at
                                                            ? true
                                                            : undefined
                                                    }
                                                />

                                                <InputError
                                                    message={errors.ends_at}
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>
                                            Tenaga kerja dan upah
                                        </CardTitle>

                                        <CardDescription>
                                            Tentukan jumlah pekerja dan nominal
                                            upah untuk setiap pekerja.
                                        </CardDescription>
                                    </CardHeader>

                                    <CardContent>
                                        <div className="grid gap-5 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="worker_quota">
                                                    Jumlah pekerja
                                                </Label>

                                                <div className="relative">
                                                    <Users className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />

                                                    <Input
                                                        id="worker_quota"
                                                        name="worker_quota"
                                                        type="number"
                                                        min="1"
                                                        max="100"
                                                        className="pl-9"
                                                        required
                                                        aria-invalid={
                                                            errors.worker_quota
                                                                ? true
                                                                : undefined
                                                        }
                                                    />
                                                </div>

                                                <InputError
                                                    message={
                                                        errors.worker_quota
                                                    }
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="wage_amount">
                                                    Upah per pekerja
                                                </Label>

                                                <div className="relative">
                                                    <WalletCards className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />

                                                    <Input
                                                        id="wage_amount"
                                                        name="wage_amount"
                                                        type="number"
                                                        min="1000"
                                                        step="1000"
                                                        className="pl-9"
                                                        placeholder="100000"
                                                        required
                                                        aria-invalid={
                                                            errors.wage_amount
                                                                ? true
                                                                : undefined
                                                        }
                                                    />
                                                </div>

                                                <InputError
                                                    message={errors.wage_amount}
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <div className="sticky bottom-4 flex flex-col-reverse gap-3 rounded-xl border bg-background/95 p-4 shadow-lg backdrop-blur sm:flex-row sm:justify-end">
                                    <Button
                                        type="submit"
                                        name="action"
                                        value="draft"
                                        variant="outline"
                                        disabled={processing}
                                    >
                                        <Save />
                                        Simpan draft
                                    </Button>

                                    <Button
                                        type="submit"
                                        name="action"
                                        value="publish"
                                        disabled={processing}
                                    >
                                        <Send />
                                        Publikasikan tugas
                                    </Button>
                                </div>
                            </div>
                        )}
                    </Form>
                </div>
            </main>
        </>
    );
}
