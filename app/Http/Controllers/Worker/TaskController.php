<?php

namespace App\Http\Controllers\Worker;

use App\Http\Controllers\Controller;
use App\Models\Task;
use App\Models\TaskApplication;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class TaskController extends Controller
{
    /**
     * ========================================
     * HALAMAN CARI TUGAS WORKER
     * ========================================
     *
     * Tugas ditampilkan jika:
     * - Sudah published oleh Admin.
     * - Belum melewati deadline lamaran.
     * - UMKM sudah approved.
     * - Kuota pekerja belum penuh.
     *
     * Kuota hanya dihitung dari ACCEPTED,
     * bukan dari jumlah pelamar PENDING.
     */
    public function index(): Response
    {
        $tasks = Task::query()

            // Tugas sudah disetujui Admin.
            ->where('status', 'published')
            ->whereNotNull('published_at')

            // Deadline lamaran masih berlaku.
            ->where('application_deadline', '>', now())

            // BARU: Hanya tugas dengan sisa kuota.
            ->hasAvailableQuota()

            // UMKM harus sudah terverifikasi.
            ->whereHas('business.user', function ($query) {
                $query->where(
                    'verification_status',
                    'approved'
                );
            })

            // Relasi data UMKM.
            ->with('business')

            // Hitung pekerja yang diterima UMKM.
            ->withCount([
                'applications as accepted_count' => function ($query) {
                    $query->where('status', 'accepted');
                },
            ])

            // Urutkan dari publikasi terbaru.
            ->latest('published_at')
            ->get()

            // Data untuk halaman Cari Tugas.
            ->map(fn (Task $task): array => [
                'id' => $task->id,

                'title' => $task->title,

                'category' => $task->category,

                'description' => $task->description,

                'locationAddress' => $task->location_address,

                'workerQuota' => $task->worker_quota,

                'wageAmount' => $task->wage_amount === null
                    ? null
                    : (int) $task->wage_amount,

                'businessName' => $task->business->name,

                'applicationDeadline' => $task
                    ->application_deadline
                    ?->format('d/m/Y H:i'),

                // ====================================
                // DATA TAMBAHAN UNTUK KARTU FIGMA
                // ====================================

                // Jadwal tugas: dipakai untuk label waktu dan durasi.
                'startsAt' => $task->starts_at
                    ?->format('d/m/Y H:i'),

                'endsAt' => $task->ends_at
                    ?->format('d/m/Y H:i'),

                // Koordinat asli dari database: digunakan untuk filter radius.
                // Jika tidak tersedia, frontend tidak menampilkan jarak palsu.

                'latitude' => $task->getRawOriginal('latitude') === null
                    ? null
                    : (float) $task->getRawOriginal('latitude'),

                'longitude' => $task->getRawOriginal('longitude') === null
                    ? null
                    : (float) $task->getRawOriginal('longitude'),

                // ====================================
                // DATA TAMBAHAN REVISI DOSEN
                // ====================================

                'acceptedCount' => (int) $task->getAttribute('accepted_count'),

                'remainingQuota' => max(
                    0,
                    (int) $task->worker_quota
                        - (int) $task->getAttribute('accepted_count')
                ),

                'isFull' => (
                    (int) $task->worker_quota <= 0
                    || (int) $task->getAttribute('accepted_count')
                    >= (int) $task->worker_quota
                ),
            ])

            ->values()
            ->all();

        return Inertia::render('worker/tasks/index', [
            'tasks' => $tasks,
        ]);
    }

    /**
     * ========================================
     * HALAMAN DETAIL TUGAS WORKER
     * ========================================
     *
     * Worker yang belum melamar:
     * - Hanya bisa melihat tugas yang tersedia.
     *
     * Worker yang sudah melamar:
     * - Tetap bisa melihat detail tugas.
     * - Tetap bisa melihat status lamarannya.
     * - Bisa membuka tugas yang sudah closed.
     * - Tidak bisa mengajukan lamaran kedua.
     */
    public function show(Request $request, Task $task): Response
    {
        // ========================================
        // 1. PERIKSA IDENTITAS WORKER
        // ========================================

        $worker = $request->user();

        abort_unless(
            $worker !== null && $worker->role === 'worker',
            403
        );

        // ========================================
        // 2. PERIKSA RIWAYAT LAMARAN
        // ========================================

        $application = TaskApplication::query()
            ->where('task_id', $task->id)
            ->where('worker_id', $worker->id)
            ->first(['id', 'status']);

        $hasApplied = $application !== null;

        // Gunakan status asli dari database.
        // Aman jika status menggunakan enum cast.
        $applicationStatus = $application === null
            ? null
            : (string) $application->getRawOriginal('status');

        // ========================================
        // 3. QUERY DETAIL TUGAS
        // ========================================

        $taskQuery = Task::query()
            ->whereKey($task->id)

            // Mengambil data UMKM.
            ->with('business')

            // Menghitung jumlah pekerja accepted.
            ->withCount([
                'applications as accepted_count' => function ($query) {
                    $query->where('status', 'accepted');
                },
            ]);

        // ========================================
        // 4. VALIDASI PEKERJA BARU
        // ========================================

        if (! $hasApplied) {

            // Worker yang belum pernah melamar
            // hanya bisa mengakses tugas tersedia.
            $taskQuery
                ->where('status', 'published')
                ->whereNotNull('published_at')
                ->where('application_deadline', '>', now())

                // Kuota harus masih tersedia.
                ->hasAvailableQuota()

                // UMKM harus approved.
                ->whereHas('business.user', function ($query) {
                    $query->where(
                        'verification_status',
                        'approved'
                    );
                });
        }

        // Worker yang sudah melamar tetap dapat
        // melihat detail tugas untuk riwayatnya,
        // termasuk setelah tugas ditutup.

        // ========================================
        // 5. AMBIL DATA TUGAS
        // ========================================

        $task = $taskQuery->firstOrFail();

        // ========================================
        // 6. HITUNG INFORMASI KUOTA
        // ========================================

        $quota = (int) $task->worker_quota;

        $acceptedCount = (int) $task->getAttribute('accepted_count');

        $remainingQuota = max(
            0,
            $quota - $acceptedCount
        );

        // Mengambil status asli dari database.
        $taskStatus = (string) $task->getRawOriginal('status');

        // Tugas dianggap penuh jika:
        // - Statusnya closed.
        // - Kuota tidak valid.
        // - Jumlah accepted mencapai kuota.
        $isFull = $taskStatus === 'closed'
            || $quota <= 0
            || $acceptedCount >= $quota;

        // ========================================
        // 7. PERIKSA DEADLINE LAMARAN
        // ========================================

        $deadlineIsValid =
            $task->application_deadline !== null
            && Carbon::parse(
                $task->application_deadline
            )->isFuture();

        // ========================================
        // 8. PERIKSA APAKAH BISA MELAMAR
        // ========================================

        $canApply =
            // Belum pernah mengirim lamaran.
            ! $hasApplied

            // Tugas masih dipublikasikan.
            && $taskStatus === 'published'

            // Sudah memiliki waktu publikasi.
            && $task->published_at !== null

            // Deadline lamaran masih berlaku.
            && $deadlineIsValid

            // Kuota harus valid dan tersedia.
            && $quota > 0
            && $remainingQuota > 0

            // Status tidak penuh.
            && ! $isFull;

        // ========================================
        // 9. KIRIM DATA KE FRONTEND
        // ========================================

        return Inertia::render('worker/tasks/show', [
            'task' => [

                // ====================================
                // DATA LAMA TETAP DIPERTAHANKAN
                // ====================================

                'id' => $task->id,

                'title' => $task->title,

                'category' => $task->category,

                'description' => $task->description,

                'requirements' => $task->requirements,

                'locationAddress' => $task->location_address,

                'businessName' => $task->business->name
                    ?? 'UMKM tidak tersedia',

                'workerQuota' => $task->worker_quota,

                'wageAmount' => (int) $task->wage_amount,

                'applicationDeadline' => $task
                    ->application_deadline
                    ?->format('d/m/Y H:i'),

                'startsAt' => $task
                    ->starts_at
                    ?->format('d/m/Y H:i'),

                'endsAt' => $task
                    ->ends_at
                    ?->format('d/m/Y H:i'),

                // ====================================
                // DATA TAMBAHAN REVISI DOSEN
                // ====================================

                'status' => $taskStatus,

                'acceptedCount' => $acceptedCount,

                'remainingQuota' => $remainingQuota,

                'isFull' => $isFull,

                'canApply' => $canApply,
            ],

            // Status lamaran Worker.
            'applicationStatus' => $applicationStatus,
        ]);
    }
}
