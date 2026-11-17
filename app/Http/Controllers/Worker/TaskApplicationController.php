<?php

namespace App\Http\Controllers\Worker;

use App\Http\Controllers\Controller;
use App\Models\Task;
use App\Models\TaskApplication;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class TaskApplicationController extends Controller
{
    /**
     * ========================================
     * HALAMAN LAMARAN SAYA
     * ========================================
     *
     * Menampilkan seluruh riwayat lamaran Worker.
     *
     * Lamaran tetap ditampilkan meskipun:
     * - Tugas sudah closed.
     * - Lamaran ditolak UMKM.
     * - Lamaran ditolak otomatis karena kuota penuh.
     */
    public function index(Request $request): Response
    {
        $worker = $request->user();

        abort_unless(
            $worker !== null && $worker->role === 'worker',
            403
        );

        $applications = TaskApplication::query()
            ->where('worker_id', $worker->id)
            ->with([
                'task.business',
                'payment',
            ])

            // Menggunakan created_at,
            // karena applied_at tidak tersedia.
            ->latest('created_at')
            ->get()
            ->map(fn (TaskApplication $application): array => [
                'id' => $application->id,

                'taskTitle' => $application->task->title,

                'businessName' => $application
                    ->task
                    ->business
                    ->name,

                'wageAmount' => $application->payment->amount
                    ?? (int) $application->task->wage_amount,

                'paymentStatus' => $application->payment?->status,

                'paidAt' => $application->payment?->paid_at
                    ?->format('d/m/Y H:i'),

                // Pending / Accepted / Rejected.
                'status' => $application->status,

                // Waktu mengajukan lamaran.
                'appliedAt' => $application->created_at
                    ?->format('d/m/Y H:i'),

                // Alasan penolakan manual / otomatis.
                'reviewNotes' => $application->review_notes ?? null,

                'reviewedAt' => $application->reviewed_at
                    ? Carbon::parse(
                        $application->reviewed_at
                    )->format('d/m/Y H:i')
                    : null,
            ])
            ->values()
            ->all();

        return Inertia::render('worker/applications/index', [
            'applications' => $applications,
        ]);
    }

    /**
     * ========================================
     * WORKER MENGAJUKAN LAMARAN
     * ========================================
     *
     * Ketentuan revisi dosen:
     *
     * 1. Tugas harus berstatus published.
     * 2. Admin sudah menyetujui tugas.
     * 3. UMKM pemilik tugas harus approved.
     * 4. Deadline lamaran belum berakhir.
     * 5. Kuota dihitung dari status accepted.
     * 6. Lamaran pending tidak mengurangi kuota.
     * 7. Worker tidak boleh melamar dua kali.
     * 8. Tugas full/closed tidak dapat dilamar.
     *
     * Menggunakan transaksi database dan
     * lockForUpdate untuk mencegah race condition.
     */
    public function store(
        Request $request,
        Task $task
    ): RedirectResponse {

        // ========================================
        // 1. VALIDASI AKUN WORKER
        // ========================================

        $worker = $request->user();

        abort_unless(
            $worker !== null && $worker->role === 'worker',
            403
        );

        // ========================================
        // 2. TRANSAKSI DATABASE
        // ========================================

        DB::transaction(function () use ($worker, $task): void {

            // ====================================
            // 3. KUNCI DATA TUGAS
            // ====================================

            // Penguncian ini penting karena
            // UMKM juga mengunci Task ketika
            // menyetujui lamaran pekerja.
            $lockedTask = Task::query()
                ->with('business.user')
                ->lockForUpdate()
                ->findOrFail($task->id);

            // ====================================
            // 4. PERIKSA KETERSEDIAAN TUGAS
            // ====================================

            $isAvailable =
                $lockedTask->getRawOriginal('status') === 'published'

                // Sudah dipublikasikan Admin.
                && $lockedTask->published_at !== null

                // Memiliki batas pendaftaran.
                && $lockedTask->application_deadline !== null

                // Batas pendaftaran belum lewat.
                && Carbon::parse(
                    $lockedTask->application_deadline
                )->isFuture()

                // UMKM pemilik tugas sudah approved.
                && $lockedTask->business?->user
                    ?->verification_status === 'approved';

            // Tugas draft, pending_review,
            // rejected, atau closed ditolak.
            abort_unless($isAvailable, 404);

            // ====================================
            // 5. CEGAH LAMARAN GANDA
            // ====================================

            $alreadyApplied = TaskApplication::query()
                ->where('task_id', $lockedTask->id)
                ->where('worker_id', $worker->id)
                ->exists();

            if ($alreadyApplied) {
                throw ValidationException::withMessages([
                    'application' => 'Kamu sudah pernah melamar tugas ini.',
                ]);
            }

            // ====================================
            // 6. PERIKSA KUOTA PEKERJA
            // ====================================

            // Kuota maksimal dari UMKM.
            $quota = (int) $lockedTask->worker_quota;

            // Hitung HANYA pekerja yang
            // sudah diterima oleh UMKM.
            $acceptedCount = TaskApplication::query()
                ->where('task_id', $lockedTask->id)
                ->where('status', 'accepted')
                ->count();

            // Jumlah pekerja yang masih dibutuhkan.
            $remainingQuota = max(
                0,
                $quota - $acceptedCount
            );

            // ====================================
            // 7. TOLAK JIKA KUOTA PENUH
            // ====================================

            if (
                $quota < 1
                || $remainingQuota <= 0
            ) {
                throw ValidationException::withMessages([
                    'application' => 'Maaf, kuota pekerja untuk tugas ini sudah penuh. '
                        .'Silakan mencari tugas lainnya.',
                ]);
            }

            // ====================================
            // 8. SIMPAN LAMARAN WORKER
            // ====================================

            // Walaupun jumlah pending sudah
            // melebihi kuota, Worker masih
            // boleh mengajukan lamaran.
            //
            // Contoh:
            // Kuota = 2
            // Accepted = 0
            // Pending = 5
            //
            // Lamaran pekerja berikutnya
            // tetap dapat disimpan selama
            // accepted belum mencapai 2.

            TaskApplication::query()->create([
                'task_id' => $lockedTask->id,
                'worker_id' => $worker->id,
                'status' => 'pending',
            ]);

            // created_at otomatis diisi
            // Eloquent jika timestamps aktif.

        }, 3);

        // ========================================
        // 9. REDIRECT SETELAH MELAMAR
        // ========================================

        return to_route(
            'worker.tasks.show',
            $task
        )->with(
            'success',
            'Lamaran berhasil dikirim dan menunggu seleksi UMKM.'
        );
    }
}
