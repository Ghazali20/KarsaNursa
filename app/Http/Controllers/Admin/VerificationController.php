<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Task;
use App\Models\User;
use App\Models\VerificationDocument;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class VerificationController extends Controller
{
    /**
     * Status tugas yang sedang
     * menunggu persetujuan Admin.
     *
     * Sesuaikan dengan TaskStatus.php
     * jika nilai status pada project berbeda.
     */
    private const PENDING_TASK_STATUSES = [
        'submitted',
        'pending_review',
        'pending',
    ];

    /**
     * ========================================
     * DASHBOARD ADMIN KARSA NURSA
     * ========================================
     *
     * Menampilkan:
     * 1. Statistik pengguna
     * 2. Statistik tugas
     * 3. Statistik dokumen
     * 4. Antrian pemeriksaan identitas
     * 5. Tiga tugas terbaru
     *
     * Bagian Aktivitas yang Perlu Perhatian
     * sudah dihapus sesuai desain terbaru.
     */
    public function index(): Response
    {
        // ========================================
        // 1. STATISTIK PLATFORM
        // ========================================

        $stats = [

            // Total akun Pencari Kerja.
            'workers' => User::query()
                ->where('role', 'worker')
                ->count(),

            // Total akun Pemilik UMKM.
            'employers' => User::query()
                ->where('role', 'employer')
                ->count(),

            // Seluruh tugas yang dibuat UMKM.
            // Termasuk tugas berstatus draft.
            'tasks' => Task::query()
                ->count(),

            // Tugas yang menunggu persetujuan Admin.
            'pendingTasks' => Task::query()
                ->whereIn(
                    'status',
                    self::PENDING_TASK_STATUSES
                )
                ->count(),

            // Tugas yang sudah dipublikasikan.
            'publishedTasks' => Task::query()
                ->where('status', 'published')
                ->count(),

            // Dokumen yang menunggu pemeriksaan.
            'pendingDocuments' => VerificationDocument::query()
                ->where('status', 'pending')
                ->whereHas('user', function ($query): void {
                    $query->whereIn('role', [
                        'worker',
                        'employer',
                    ]);
                })
                ->count(),
        ];

        // ========================================
        // 2. ANTRIAN PEMERIKSAAN IDENTITAS
        // ========================================

        // Mengambil maksimal tiga dokumen
        // terbaru yang berstatus pending.
        //
        // Pemeriksaan dokumen tidak
        // memengaruhi status aktivasi akun.

        $documentQueue = VerificationDocument::query()

            // Hanya dokumen yang belum diperiksa.
            ->where('status', 'pending')

            // Hanya dokumen Worker atau UMKM.
            ->whereHas('user', function ($query): void {
                $query->whereIn('role', [
                    'worker',
                    'employer',
                ]);
            })

            // Ambil informasi pengguna.
            ->with('user:id,name,role')

            // Urutkan dari dokumen terbaru.
            ->latest()

            // Maksimal tiga dokumen.
            ->limit(3)

            ->get()

            // Sesuaikan format untuk React.
            ->map(
                function (
                    VerificationDocument $document
                ): ?array {

                    $user = $document->user;

                    if ($user === null) {
                        return null;
                    }

                    return [
                        'id' => $document->id,

                        'userName' => $user->name,

                        'userRole' => $user->role,

                        'documentType' => $document->document_type,

                        'createdAt' => $document
                            ->created_at
                            ?->toIso8601String(),

                        // Dokumen tetap privat.
                        // Hanya dapat diunduh Admin.
                        'downloadUrl' => route(
                            'admin.verifications.document',
                            $document
                        ),
                    ];
                }
            )

            // Hilangkan data relasi yang kosong.
            ->filter(
                fn (?array $document): bool => $document !== null
            )

            ->values()
            ->all();

        // ========================================
        // 3. TIGA TUGAS TERBARU
        // ========================================

        // Mengambil tiga tugas terbaru
        // dari database KarsaNursa.

        $recentTasks = Task::query()

            ->latest()

            ->limit(3)

            ->get([
                'id',
                'title',
                'status',
                'created_at',
            ])

            ->map(
                fn (Task $task): array => [

                    'id' => $task->id,

                    'title' => $task->title,

                    // Ambil nilai asli status.
                    // Mendukung model dengan enum cast.
                    'status' => (string) $task
                        ->getRawOriginal('status'),

                    'createdAt' => $task
                        ->created_at
                        ?->toIso8601String(),
                ]
            )

            ->values()
            ->all();

        // ========================================
        // 4. KIRIM DATA KE DASHBOARD REACT
        // ========================================

        return Inertia::render('admin/dashboard', [

            // Statistik platform.
            'stats' => $stats,

            // Antrian dokumen.
            'documentQueue' => $documentQueue,

            // Tiga tugas terbaru.
            'recentTasks' => $recentTasks,

        ]);
    }

    /**
     * ========================================
     * HALAMAN MANAJEMEN AKUN
     * ========================================
     *
     * Cari akun berdasarkan ID, nama, email, nama usaha,
     * lalu filter Semua / Menunggu / Disetujui / Ditolak.
     */
    public function users(Request $request): Response
    {
        $search = trim(substr((string) $request->query('search', ''), 0, 100));
        $status = (string) $request->query('status', 'all');

        if (! in_array($status, ['all', 'pending', 'approved', 'rejected'], true)) {
            $status = 'all';
        }

        // Statistik antrean tetap dihitung dari dokumen pending,
        // terpisah dari filter daftar akun.
        $pendingUsers = User::query()
            ->whereIn('role', ['worker', 'employer'])
            ->whereHas('verificationDocuments', function ($query): void {
                $query->where('status', 'pending');
            });

        $stats = [
            'totalQueue' => (clone $pendingUsers)->count(),
            'pendingWorkers' => (clone $pendingUsers)->where('role', 'worker')->count(),
            'pendingEmployers' => (clone $pendingUsers)->where('role', 'employer')->count(),
            'activeUsers' => User::query()
                ->whereIn('role', ['worker', 'employer'])
                ->where('verification_status', 'approved')
                ->count(),
            'verifiedDocuments' => VerificationDocument::query()
                ->where('status', 'approved')
                ->whereHas('user', function ($query): void {
                    $query->whereIn('role', ['worker', 'employer']);
                })
                ->count(),
        ];

        $accounts = User::query()->whereIn('role', ['worker', 'employer']);

        // Cari berdasarkan ID, nama, email, dan nama usaha.
        if ($search !== '') {
            $accounts->where(function ($query) use ($search): void {
                $query->where('name', 'like', '%'.$search.'%')
                    ->orWhere('email', 'like', '%'.$search.'%')
                    ->orWhereHas('business', function ($businessQuery) use ($search): void {
                        $businessQuery->where('name', 'like', '%'.$search.'%');
                    });

                if (ctype_digit($search)) {
                    $query->orWhere('id', (int) $search);
                }
            });
        }

        // Untuk akun yang belum disetujui, dokumen yang seluruhnya
        // ditolak juga ditampilkan sebagai "Ditolak", walaupun
        // users.verification_status masih pending.
        if ($status === 'approved') {
            $accounts->where('verification_status', 'approved');
        } elseif ($status === 'rejected') {
            $accounts->where(function ($query): void {
                $query->where('verification_status', 'rejected')
                    ->orWhere(function ($pendingQuery): void {
                        // Gunakan subquery untuk menghindari ambiguitas
                        // tipe Builder pada analisis PHPStan.
                        $pendingQuery->where('verification_status', 'pending');
                        $pendingQuery->whereNotIn(
                            'id',
                            VerificationDocument::query()
                                ->select('user_id')
                                ->where('status', 'pending')
                        );
                        $pendingQuery->whereIn(
                            'id',
                            VerificationDocument::query()
                                ->select('user_id')
                                ->where('status', 'rejected')
                        );
                    });
            });
        } elseif ($status === 'pending') {
            $accounts->where('verification_status', 'pending')
                ->where(function ($query): void {
                    $query->whereHas('verificationDocuments', function ($documents): void {
                        $documents->where('status', 'pending');
                    })->orWhereDoesntHave('verificationDocuments', function ($documents): void {
                        $documents->where('status', 'rejected');
                    });
                });
        }

        $queue = $accounts
            ->with([
                'business:id,user_id,name',
                'verificationDocuments' => function ($query): void {
                    $query->latest('id');
                },
            ])
            ->latest('id')
            ->paginate(8)
            ->withQueryString()
            ->through(function (User $user): array {
                $documents = $user->verificationDocuments;
                $pendingDocument = $documents->first(function (VerificationDocument $document): bool {
                    return $document->status === 'pending';
                });
                $document = $pendingDocument ?? $documents->first();

                $hasPending = $pendingDocument !== null;
                $hasRejected = $documents->contains(function (VerificationDocument $item): bool {
                    return $item->status === 'rejected';
                });

                $rawStatus = (string) $user->getRawOriginal('verification_status');
                $accountStatus = $rawStatus === 'approved'
                    ? 'approved'
                    : (($rawStatus === 'rejected' || (! $hasPending && $hasRejected))
                        ? 'rejected'
                        : 'pending');

                $documentType = $document === null
                    ? '-'
                    : match (strtolower((string) $document->document_type)) {
                        'ktp' => 'KTP',
                        'ktm' => 'KTM',
                        'nib' => 'NIB',
                        'surat_usaha' => 'Surat Usaha',
                        default => (string) $document->document_type,
                    };

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'businessName' => $user->business->name ?? null,
                    'accountStatus' => $accountStatus,
                    // Aksi persetujuan hanya untuk dokumen pending.
                    'documentId' => $pendingDocument?->id,
                    'documentType' => $documentType,
                    'documentStatus' => $document === null ? 'none' : (string) $document->status,
                    'documentsRemaining' => $documents->filter(function (VerificationDocument $item): bool {
                        return $item->status === 'pending';
                    })->count(),
                    'createdLabel' => $user->created_at === null
                        ? '-'
                        : Carbon::parse((string) $user->created_at)
                            ->diffForHumans(),
                    'downloadUrl' => $document === null
                        ? null
                        : route('admin.verifications.document', $document),
                ];
            });

        return Inertia::render('admin/users/index', [
            'stats' => $stats,
            'queue' => $queue,
            'filters' => [
                'search' => $search,
                'status' => $status,
            ],
        ]);
    }

    /**
     * ========================================
     * VERIFIKASI DOKUMEN
     * ========================================
     *
     * Hanya memperbarui status dokumen.
     * Status aktivasi akun tidak berubah.
     */
    public function approveDocument(
        Request $request,
        VerificationDocument $document
    ): RedirectResponse {
        $this->reviewDocument(
            $document,
            (int) $request->user()->id,
            'approved',
            null
        );

        return to_route('admin.users.index')
            ->with('success', 'Dokumen berhasil diverifikasi.');
    }

    /**
     * ========================================
     * TOLAK DOKUMEN
     * ========================================
     *
     * Penolakan wajib menyertakan alasan.
     */
    public function rejectDocument(
        Request $request,
        VerificationDocument $document
    ): RedirectResponse {
        $validated = $request->validate([
            'review_notes' => [
                'required',
                'string',
                'min:5',
                'max:1000',
            ],
        ]);

        $this->reviewDocument(
            $document,
            (int) $request->user()->id,
            'rejected',
            $validated['review_notes']
        );

        return to_route('admin.users.index')
            ->with('success', 'Dokumen berhasil ditolak.');
    }

    /**
     * Memeriksa dokumen dan mengaktifkan akun
     * apabila seluruh dokumen telah disetujui.
     */

    /**
     * Memeriksa dokumen dan mengaktifkan akun
     * jika semua dokumen sudah disetujui.
     */
    private function reviewDocument(
        VerificationDocument $document,
        int $adminId,
        string $decision,
        ?string $notes
    ): void {
        DB::transaction(function () use (
            $document,
            $adminId,
            $decision,
            $notes
        ): void {

            // 1. Kunci akun pengguna.
            $owner = User::query()
                ->lockForUpdate()
                ->findOrFail($document->user_id);

            abort_unless(
                in_array(
                    $owner->role,
                    ['worker', 'employer'],
                    true
                ),
                403
            );

            // 2. Kunci dokumen yang diperiksa.
            $target = VerificationDocument::query()
                ->where('user_id', $owner->id)
                ->lockForUpdate()
                ->findOrFail($document->id);

            // 3. Pastikan dokumen belum diproses.
            if ($target->status !== 'pending') {
                throw ValidationException::withMessages([
                    'document' => 'Dokumen sudah diproses. Muat ulang halaman.',
                ]);
            }

            // 4. Simpan keputusan Admin.
            $target->status = $decision;
            $target->review_notes = $notes;
            $target->reviewed_by = max(0, $adminId);
            $target->reviewed_at = now();

            $target->save();

            // Sinkronisasi ke users.verification_status ini diperlukan
            // agar middleware approved membuka dashboard sesuai role.
            // 5. Aktifkan akun hanya setelah
            // seluruh dokumen disetujui.
            if (
                $decision === 'approved'
                && $owner->verification_status === 'pending'
            ) {
                $hasDocuments = $owner
                    ->verificationDocuments()
                    ->exists();

                $hasUnapprovedDocuments = $owner
                    ->verificationDocuments()
                    ->where('status', '!=', 'approved')
                    ->exists();

                if (
                    $hasDocuments
                    && ! $hasUnapprovedDocuments
                ) {
                    $owner->verification_status = 'approved';
                    $owner->verified_at = now();
                    $owner->save();
                }
            }
        });
    }

    /**
     * ========================================
     * PERSETUJUAN AKUN LAMA
     * ========================================
     *
     * Dipertahankan untuk kompatibilitas
     * route dan pengujian sebelumnya.
     */
    public function approve(
        Request $request,
        User $user
    ): RedirectResponse {

        $this->decide(
            $user,
            (int) $request->user()->id,
            'approved',
            null
        );

        return to_route('admin.dashboard')
            ->with(
                'success',
                'Akun berhasil disetujui.'
            );
    }

    /**
     * ========================================
     * PENOLAKAN AKUN LAMA
     * ========================================
     *
     * Penolakan wajib menyertakan alasan.
     */
    public function reject(
        Request $request,
        User $user
    ): RedirectResponse {

        $validated = $request->validate([
            'review_notes' => [
                'required',
                'string',
                'min:5',
                'max:1000',
            ],
        ]);

        $this->decide(
            $user,
            (int) $request->user()->id,
            'rejected',
            $validated['review_notes']
        );

        return to_route('admin.dashboard')
            ->with(
                'success',
                'Akun berhasil ditolak.'
            );
    }

    /**
     * ========================================
     * DOWNLOAD DOKUMEN VERIFIKASI
     * ========================================
     *
     * Dokumen tersimpan pada disk local.
     * Dokumen tidak dapat diakses publik.
     *
     * Route download hanya dapat diakses
     * oleh Admin sesuai middleware web.php.
     */
    public function download(
        VerificationDocument $document
    ): StreamedResponse {

        abort_unless(
            $document->disk === 'local'

                && str_starts_with(
                    $document->storage_path,
                    "verifications/{$document->user_id}/"
                )

                && Storage::disk('local')->exists(
                    $document->storage_path
                ),
            404
        );

        /** @var FilesystemAdapter $disk */
        $disk = Storage::disk('local');

        return $disk->download(
            $document->storage_path,
            $document->original_name
        );
    }

    /**
     * ========================================
     * PROSES KEPUTUSAN VERIFIKASI LAMA
     * ========================================
     *
     * Menggunakan transaksi database
     * dan lockForUpdate agar keputusan
     * tidak diproses bersamaan.
     *
     * Tidak digunakan oleh proses
     * pemeriksaan dokumen akun baru.
     */
    private function decide(
        User $user,
        int $adminId,
        string $decision,
        ?string $notes
    ): void {

        DB::transaction(function () use (
            $user,
            $adminId,
            $decision,
            $notes
        ): void {

            // ====================================
            // 1. KUNCI DATA PENGGUNA
            // ====================================

            $target = User::query()
                ->lockForUpdate()
                ->findOrFail($user->id);

            // Hanya Worker dan Employer.
            abort_unless(
                in_array(
                    $target->role,
                    ['worker', 'employer'],
                    true
                ),
                403
            );

            // ====================================
            // 2. VALIDASI STATUS AKUN
            // ====================================

            if (
                $target->verification_status !== 'pending'
            ) {
                throw ValidationException::withMessages([
                    'verification' => 'Akun ini sudah diproses. Muat ulang halaman.',
                ]);
            }

            // ====================================
            // 3. VALIDASI DOKUMEN
            // ====================================

            if (
                ! $target->verificationDocuments()
                    ->where('status', 'pending')
                    ->exists()
            ) {
                throw ValidationException::withMessages([
                    'verification' => 'Akun belum memiliki dokumen verifikasi berstatus pending.',
                ]);
            }

            // ====================================
            // 4. PERBARUI STATUS AKUN
            // ====================================

            $target->verification_status = $decision;

            $target->verified_at =
                $decision === 'approved'
                ? now()
                : null;

            $target->save();

            // ====================================
            // 5. PERBARUI STATUS DOKUMEN
            // ====================================

            $target->verificationDocuments()
                ->where('status', 'pending')
                ->update([
                    'status' => $decision,
                    'review_notes' => $notes,
                    'reviewed_by' => $adminId,
                    'reviewed_at' => now(),
                ]);
        });
    }
}
