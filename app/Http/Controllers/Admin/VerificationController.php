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
     * Status tugas yang sedang menunggu persetujuan Admin.
     */
    private const PENDING_TASK_STATUSES = [
        'submitted',
        'pending_review',
        'pending',
    ];

    /**
     * Dashboard Admin Karsa Nursa.
     */
    public function index(): Response
    {
        // 1. Statistik platform.
        $stats = [
            'workers' => User::query()
                ->where('role', 'worker')
                ->count(),

            'employers' => User::query()
                ->where('role', 'employer')
                ->count(),

            'tasks' => Task::query()
                ->count(),

            'pendingTasks' => Task::query()
                ->whereIn('status', self::PENDING_TASK_STATUSES)
                ->count(),

            'publishedTasks' => Task::query()
                ->where('status', 'published')
                ->count(),

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

        // 2. Antrian pemeriksaan identitas.
        $documentQueue = VerificationDocument::query()
            ->where('status', 'pending')
            ->whereHas('user', function ($query): void {
                $query->whereIn('role', [
                    'worker',
                    'employer',
                ]);
            })
            ->with('user:id,name,role')
            ->latest()
            ->limit(3)
            ->get()
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
                        'createdAt' => $document->created_at
                            ?->toIso8601String(),
                        'downloadUrl' => route(
                            'admin.verifications.document',
                            $document
                        ),
                    ];
                }
            )
            ->filter(
                fn (?array $document): bool => $document !== null
            )
            ->values()
            ->all();

        // 3. Tiga tugas terbaru.
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
                    'status' => (string) $task
                        ->getRawOriginal('status'),
                    'createdAt' => $task->created_at
                        ?->toIso8601String(),
                ]
            )
            ->values()
            ->all();

        // 4. Kirim data ke dashboard React.
        return Inertia::render('admin/dashboard', [
            'stats' => $stats,
            'documentQueue' => $documentQueue,
            'recentTasks' => $recentTasks,
        ]);
    }

    /**
     * Halaman manajemen akun.
     */
    public function users(Request $request): Response
    {
        $search = trim(
            substr((string) $request->query('search', ''), 0, 100)
        );

        $status = (string) $request->query('status', 'all');

        if (! in_array(
            $status,
            ['all', 'pending', 'approved', 'rejected'],
            true
        )) {
            $status = 'all';
        }

        // Statistik antrian.
        $pendingUsers = User::query()
            ->whereIn('role', ['worker', 'employer'])
            ->whereHas('verificationDocuments', function ($query): void {
                $query->where('status', 'pending');
            });

        $stats = [
            'totalQueue' => (clone $pendingUsers)->count(),

            'pendingWorkers' => (clone $pendingUsers)
                ->where('role', 'worker')
                ->count(),

            'pendingEmployers' => (clone $pendingUsers)
                ->where('role', 'employer')
                ->count(),

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

        $accounts = User::query()
            ->whereIn('role', ['worker', 'employer']);

        // Pencarian akun.
        if ($search !== '') {
            $accounts->where(function ($query) use ($search): void {
                $query->where('name', 'like', '%'.$search.'%')
                    ->orWhere('email', 'like', '%'.$search.'%')
                    ->orWhereHas(
                        'business',
                        function ($businessQuery) use ($search): void {
                            $businessQuery->where(
                                'name',
                                'like',
                                '%'.$search.'%'
                            );
                        }
                    );

                if (ctype_digit($search)) {
                    $query->orWhere('id', (int) $search);
                }
            });
        }

        // Filter status akun.
        if ($status === 'approved') {
            $accounts->where('verification_status', 'approved');

        } elseif ($status === 'rejected') {
            $accounts->where(function ($query): void {
                $query->where('verification_status', 'rejected')
                    ->orWhere(function ($pendingQuery): void {
                        $pendingQuery->where(
                            'verification_status',
                            'pending'
                        );

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
                    $query->whereHas(
                        'verificationDocuments',
                        function ($documents): void {
                            $documents->where('status', 'pending');
                        }
                    )->orWhereDoesntHave(
                        'verificationDocuments',
                        function ($documents): void {
                            $documents->where('status', 'rejected');
                        }
                    );
                });
        }

        // Ambil data akun dan dokumen.
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

                $pendingDocument = $documents->first(
                    function (VerificationDocument $document): bool {
                        return $document->status === 'pending';
                    }
                );

                $document = $pendingDocument ?? $documents->first();

                $hasPending = $pendingDocument !== null;

                $hasRejected = $documents->contains(
                    function (VerificationDocument $item): bool {
                        return $item->status === 'rejected';
                    }
                );

                $rawStatus = (string) $user->getRawOriginal(
                    'verification_status'
                );

                $accountStatus = $rawStatus === 'approved'
                    ? 'approved'
                    : (
                        (
                            $rawStatus === 'rejected'
                            || (! $hasPending && $hasRejected)
                        )
                        ? 'rejected'
                        : 'pending'
                    );

                $documentType = $document === null
                    ? '-'
                    : match (
                        strtolower((string) $document->document_type)
                    ) {
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

                    'documentId' => $pendingDocument?->id,
                    'documentType' => $documentType,

                    'documentStatus' => $document === null
                        ? 'none'
                        : (string) $document->status,

                    'documentsRemaining' => $documents
                        ->filter(
                            function (VerificationDocument $item): bool {
                                return $item->status === 'pending';
                            }
                        )
                        ->count(),

                    'createdLabel' => $user->created_at === null
                        ? '-'
                        : Carbon::parse((string) $user->created_at)
                            ->diffForHumans(),

                    'downloadUrl' => $document === null
                        ? null
                        : route(
                            'admin.verifications.document',
                            $document
                        ),
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
     * Menyetujui dokumen.
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
     * Menolak dokumen.
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
     * Pemeriksaan dokumen dan aktivasi akun.
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

            // 2. Validasi role pengguna.
            abort_unless(
                in_array(
                    $owner->role,
                    ['worker', 'employer'],
                    true
                ),
                403
            );

            // 3. Kunci dokumen yang sedang diperiksa.
            $target = VerificationDocument::query()
                ->where('user_id', $owner->id)
                ->lockForUpdate()
                ->findOrFail($document->id);

            // 4. Pastikan dokumen belum diproses.
            if ($target->status !== 'pending') {
                throw ValidationException::withMessages([
                    'document' => 'Dokumen sudah diproses. Muat ulang halaman.',
                ]);
            }

            // 5. Simpan keputusan Admin.
            $target->status = $decision;
            $target->review_notes = $notes;
            $target->reviewed_by = max(0, $adminId);
            $target->reviewed_at = now();

            $target->save();

            // 6. Aktifkan akun jika semua dokumen sudah disetujui.
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
     * Persetujuan akun lama.
     * Dipertahankan untuk kompatibilitas route.
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
            ->with('success', 'Akun berhasil disetujui.');
    }

    /**
     * Penolakan akun lama.
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
            ->with('success', 'Akun berhasil ditolak.');
    }

    /**
     * Download dokumen verifikasi secara privat.
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
     * Proses keputusan verifikasi akun lama.
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

            // 1. Kunci data pengguna.
            $target = User::query()
                ->lockForUpdate()
                ->findOrFail($user->id);

            // 2. Validasi role pengguna.
            abort_unless(
                in_array(
                    $target->role,
                    ['worker', 'employer'],
                    true
                ),
                403
            );

            // 3. Validasi status akun.
            if ($target->verification_status !== 'pending') {
                throw ValidationException::withMessages([
                    'verification' => 'Akun ini sudah diproses. Muat ulang halaman.',
                ]);
            }

            // 4. Validasi dokumen.
            if (
                ! $target->verificationDocuments()
                    ->where('status', 'pending')
                    ->exists()
            ) {
                throw ValidationException::withMessages([
                    'verification' => 'Akun belum memiliki dokumen verifikasi berstatus pending.',
                ]);
            }

            // 5. Perbarui status akun.
            $target->verification_status = $decision;

            $target->verified_at = $decision === 'approved'
                ? now()
                : null;

            $target->save();

            // 6. Perbarui seluruh dokumen yang masih pending.
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
