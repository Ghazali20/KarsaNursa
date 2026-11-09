<?php

namespace App\Http\Controllers\Worker;

use App\Http\Controllers\Controller;
use App\Models\Task;
use App\Models\TaskApplication;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        // ========================================
        // 1. MENGAMBIL DATA PENCARI KERJA
        // ========================================

        $worker = $request->user();

        // ========================================
        // 2. MENGAMBIL 4 TUGAS TERBARU
        // ========================================

        $recommendedTasks = Task::query()
            ->where('status', 'published')
            ->whereNotNull('published_at')
            ->where('application_deadline', '>', now())
            ->whereHas('business.user', function ($query) {
                $query->where(
                    'verification_status',
                    'approved'
                );
            })
            ->with('business')
            ->latest('published_at')
            ->limit(4)
            ->get()
            ->map(fn (Task $task): array => [
                'id' => $task->id,
                'title' => $task->title,
                'category' => $task->category,
                'businessName' => $task->business->name,
                'locationAddress' => $task->location_address,
                'wageAmount' => $task->wage_amount === null
                    ? null
                    : (int) $task->wage_amount,
                'workerQuota' => $task->worker_quota,
            ])
            ->values()
            ->all();

        // ========================================
        // 3. MENGHITUNG LAMARAN AKTIF
        // ========================================

        // Hanya menghitung lamaran milik worker
        // yang sedang login dan berstatus pending.

        $pendingApplications = TaskApplication::query()
            ->where('worker_id', $worker->id)
            ->where('status', 'pending')
            ->count();

        // ========================================
        // 4. MENGIRIM DATA KE DASHBOARD REACT
        // ========================================

        return Inertia::render('worker/dashboard', [
            'recommendedTasks' => $recommendedTasks,
            'pendingApplications' => $pendingApplications,
        ]);
    }
}
