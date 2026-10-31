<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\VerificationDocument;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class VerificationController extends Controller
{
    /**
     * Menampilkan daftar akun dan statistik verifikasi.
     */
    public function index(): Response
    {
        $users = User::query()
            ->whereIn('role', ['worker', 'employer'])
            ->with([
                'business',
                'workerProfile',
                'verificationDocuments',
            ])
            ->orderByRaw(
                "CASE WHEN verification_status = 'pending' THEN 0 ELSE 1 END"
            )
            ->latest()
            ->get()
            ->map(fn (User $user): array => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'verificationStatus' => $user->verification_status,

                'profileLabel' => $user->role === 'employer'
                    ? $user->business?->name
                    : $user->workerProfile?->identity_type,

                'documents' => $user->verificationDocuments
                    ->map(
                        fn (VerificationDocument $document): array => [
                            'id' => $document->id,
                            'name' => $document->original_name,
                            'type' => $document->document_type,
                            'status' => $document->status,
                            'reviewNotes' => $document->review_notes,
                            'url' => route(
                                'admin.verifications.document',
                                $document
                            ),
                        ]
                    )
                    ->values()
                    ->all(),
            ])
            ->values()
            ->all();

        $base = fn () => User::query()
            ->whereIn('role', ['worker', 'employer']);

        return Inertia::render('admin/dashboard', [
            'stats' => [
                'pending' => $base()
                    ->where('verification_status', 'pending')
                    ->count(),

                'approved' => $base()
                    ->where('verification_status', 'approved')
                    ->count(),

                'rejected' => $base()
                    ->where('verification_status', 'rejected')
                    ->count(),
            ],

            'users' => $users,
        ]);
    }

    /**
     * Menyetujui akun pengguna.
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
     * Menolak akun beserta alasannya.
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
     * Mengunduh dokumen verifikasi melalui akses Admin.
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

        return Storage::disk('local')->download(
            $document->storage_path,
            $document->original_name
        );
    }

    /**
     * Memproses keputusan verifikasi secara aman.
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
            $target = User::query()
                ->lockForUpdate()
                ->findOrFail($user->id);

            abort_unless(
                in_array(
                    $target->role,
                    ['worker', 'employer'],
                    true
                ),
                403
            );

            if ($target->verification_status !== 'pending') {
                throw ValidationException::withMessages([
                    'verification' =>
                        'Akun ini sudah diproses. Muat ulang halaman.',
                ]);
            }

            if (! $target->verificationDocuments()
                ->where('status', 'pending')
                ->exists()) {
                throw ValidationException::withMessages([
                    'verification' =>
                        'Akun belum memiliki dokumen verifikasi berstatus pending.',
                ]);
            }

            // Perbarui status pengguna.
            $target->verification_status = $decision;

            $target->verified_at = $decision === 'approved'
                ? now()
                : null;

            $target->save();

            // Perbarui hasil pemeriksaan dokumen.
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
