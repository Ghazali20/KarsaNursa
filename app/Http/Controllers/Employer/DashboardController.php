<?php

namespace App\Http\Controllers\Employer;

use App\Enums\TaskPaymentStatus;
use App\Enums\TaskStatus;
use App\Http\Controllers\Controller;
use App\Models\Task;
use App\Models\TaskApplication;
use App\Models\TaskPayment;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        Carbon::setLocale('id');

        /** @var User $user */
        $user = $request->user();

        $business = $user->business;

        abort_if(
            $business === null,
            403,
            'Profil usaha belum tersedia.'
        );

        $now = Carbon::now();
        $startOfMonth = $now->copy()->startOfMonth();
        $endOfMonth = $now->copy()->endOfMonth();
        $startOfLastMonth = $now->copy()->subMonth()->startOfMonth();
        $endOfLastMonth = $now->copy()->subMonth()->endOfMonth();

        // ==========================================
        // 1. TUGAS AKTIF
        // ==========================================
        $activeTasks = $business->tasks()
            ->whereIn('status', [TaskStatus::Published->value, 'in_progress', 'open', TaskStatus::Closed->value])
            ->where(function ($query) use ($now) {
                $query->whereNull('ends_at')
                    ->orWhere('ends_at', '>=', $now);
            })
            ->count();

        // ==========================================
        // 2. PELAMAR BARU (PENDING)
        // ==========================================
        $pendingApplicants = TaskApplication::query()
            ->where('status', 'pending')
            ->whereHas('task', function ($query) use ($business) {
                $query->where('business_id', $business->id);
            })
            ->count();

        // ==========================================
        // 3. TUGAS SELESAI BULAN INI & PERBANDINGAN
        // ==========================================
        $completedThisMonth = $business->tasks()
            ->where(function ($query) use ($startOfMonth, $endOfMonth, $now) {
                $query->whereBetween('ends_at', [$startOfMonth, $endOfMonth])
                    ->orWhere(function ($sq) use ($now) {
                        $sq->where('status', TaskStatus::Closed->value)
                            ->where('ends_at', '<=', $now);
                    })
                    ->orWhereHas('applications.payment', function ($pq) use ($startOfMonth, $endOfMonth) {
                        $pq->where('status', TaskPaymentStatus::Paid->value)
                            ->whereBetween('paid_at', [$startOfMonth, $endOfMonth]);
                    });
            })
            ->distinct()
            ->count();

        $completedLastMonth = $business->tasks()
            ->where(function ($query) use ($startOfLastMonth, $endOfLastMonth) {
                $query->whereBetween('ends_at', [$startOfLastMonth, $endOfLastMonth])
                    ->orWhereHas('applications.payment', function ($pq) use ($startOfLastMonth, $endOfLastMonth) {
                        $pq->where('status', TaskPaymentStatus::Paid->value)
                            ->whereBetween('paid_at', [$startOfLastMonth, $endOfLastMonth]);
                    });
            })
            ->distinct()
            ->count();

        if ($completedLastMonth > 0) {
            $completedPercentageChange = (int) round((($completedThisMonth - $completedLastMonth) / $completedLastMonth) * 100);
        } else {
            $completedPercentageChange = $completedThisMonth > 0 ? 100 : 0;
        }

        // ==========================================
        // 4. BIAYA TENAGA KERJA BULAN BERJALAN
        // ==========================================
        $monthlyExpenses = (int) TaskPayment::query()
            ->where('status', TaskPaymentStatus::Paid->value)
            ->where(function ($query) use ($startOfMonth, $endOfMonth) {
                $query->whereBetween('paid_at', [$startOfMonth, $endOfMonth])
                    ->orWhere(function ($sq) use ($startOfMonth, $endOfMonth) {
                        $sq->whereNull('paid_at')
                            ->whereBetween('updated_at', [$startOfMonth, $endOfMonth]);
                    });
            })
            ->whereHas(
                'application.task',
                function ($query) use ($business) {
                    $query->where('business_id', $business->id);
                }
            )
            ->sum('amount');

        $lastMonthExpenses = (int) TaskPayment::query()
            ->where('status', TaskPaymentStatus::Paid->value)
            ->where(function ($query) use ($startOfLastMonth, $endOfLastMonth) {
                $query->whereBetween('paid_at', [$startOfLastMonth, $endOfLastMonth])
                    ->orWhere(function ($sq) use ($startOfLastMonth, $endOfLastMonth) {
                        $sq->whereNull('paid_at')
                            ->whereBetween('updated_at', [$startOfLastMonth, $endOfLastMonth]);
                    });
            })
            ->whereHas(
                'application.task',
                function ($query) use ($business) {
                    $query->where('business_id', $business->id);
                }
            )
            ->sum('amount');

        if ($lastMonthExpenses > 0) {
            $expensePercentageChange = round((($monthlyExpenses - $lastMonthExpenses) / $lastMonthExpenses) * 100, 1);
        } else {
            $expensePercentageChange = $monthlyExpenses > 0 ? 100.0 : 0.0;
        }

        // ==========================================
        // 5. GRAFIK PENGELUARAN 6 BULAN TERAKHIR
        // ==========================================
        $chartMonths = [];
        $totalPeriodExpense = 0;

        for ($i = 5; $i >= 0; $i--) {
            $monthDate = $now->copy()->subMonths($i);
            $mStart = $monthDate->copy()->startOfMonth();
            $mEnd = $monthDate->copy()->endOfMonth();

            $sum = (int) TaskPayment::query()
                ->where('status', TaskPaymentStatus::Paid->value)
                ->where(function ($query) use ($mStart, $mEnd) {
                    $query->whereBetween('paid_at', [$mStart, $mEnd])
                        ->orWhere(function ($sq) use ($mStart, $mEnd) {
                            $sq->whereNull('paid_at')
                                ->whereBetween('updated_at', [$mStart, $mEnd]);
                        });
                })
                ->whereHas('application.task', function ($query) use ($business) {
                    $query->where('business_id', $business->id);
                })
                ->sum('amount');

            $chartMonths[] = [
                'month' => $monthDate->translatedFormat('M'),
                'fullMonth' => $monthDate->translatedFormat('F Y'),
                'amount' => $sum,
                'active' => $i === 0,
            ];

            $totalPeriodExpense += $sum;
        }

        // 6 bulan sebelumnya untuk tren perbandingan
        $prev6MonthsStart = $now->copy()->subMonths(11)->startOfMonth();
        $prev6MonthsEnd = $now->copy()->subMonths(6)->endOfMonth();
        $prev6MonthsExpense = (int) TaskPayment::query()
            ->where('status', TaskPaymentStatus::Paid->value)
            ->where(function ($query) use ($prev6MonthsStart, $prev6MonthsEnd) {
                $query->whereBetween('paid_at', [$prev6MonthsStart, $prev6MonthsEnd])
                    ->orWhere(function ($sq) use ($prev6MonthsStart, $prev6MonthsEnd) {
                        $sq->whereNull('paid_at')
                            ->whereBetween('updated_at', [$prev6MonthsStart, $prev6MonthsEnd]);
                    });
            })
            ->whereHas('application.task', function ($query) use ($business) {
                $query->where('business_id', $business->id);
            })
            ->sum('amount');

        if ($prev6MonthsExpense > 0) {
            $chartGrowth = round((($totalPeriodExpense - $prev6MonthsExpense) / $prev6MonthsExpense) * 100, 1);
        } else {
            $chartGrowth = $totalPeriodExpense > 0 ? 100.0 : 0.0;
        }

        $maxAmount = max(array_column($chartMonths, 'amount')) ?: 1;
        foreach ($chartMonths as &$item) {
            $item['heightPercent'] = $item['amount'] > 0
                ? max(15, (int) round(($item['amount'] / $maxAmount) * 100))
                : 6;
            $item['label'] = $this->formatCompactRupiah($item['amount']);
        }
        unset($item);

        // ==========================================
        // 6. DISTRIBUSI STATUS TUGAS (DONUT CHART)
        // ==========================================
        $tasksThisMonth = $business->tasks()
            ->where(function ($query) use ($startOfMonth, $endOfMonth) {
                $query->whereBetween('created_at', [$startOfMonth, $endOfMonth])
                    ->orWhereBetween('starts_at', [$startOfMonth, $endOfMonth])
                    ->orWhereBetween('ends_at', [$startOfMonth, $endOfMonth]);
            })
            ->get();

        if ($tasksThisMonth->isEmpty()) {
            $tasksThisMonth = $business->tasks()->get();
        }

        $totalTasksCount = $tasksThisMonth->count();
        $completedCount = 0;
        $inProgressCount = 0;
        $waitingCount = 0;
        $cancelledCount = 0;

        foreach ($tasksThisMonth as $t) {
            $status = strtolower((string) $t->status);
            if ($status === TaskStatus::Rejected->value || $status === 'cancelled') {
                $cancelledCount++;
            } elseif ($status === 'completed') {
                $completedCount++;
            } elseif ($status === 'in_progress' || $status === TaskStatus::Closed->value) {
                $inProgressCount++;
            } elseif ($status === TaskStatus::Published->value || $status === 'open') {
                $waitingCount++;
            } else {
                $waitingCount++;
            }
        }

        $taskDistribution = [
            'total' => $totalTasksCount,
            'completed' => [
                'count' => $completedCount,
                'percent' => $totalTasksCount > 0 ? (int) round(($completedCount / $totalTasksCount) * 100) : 0,
            ],
            'inProgress' => [
                'count' => $inProgressCount,
                'percent' => $totalTasksCount > 0 ? (int) round(($inProgressCount / $totalTasksCount) * 100) : 0,
            ],
            'waiting' => [
                'count' => $waitingCount,
                'percent' => $totalTasksCount > 0 ? (int) round(($waitingCount / $totalTasksCount) * 100) : 0,
            ],
            'cancelled' => [
                'count' => $cancelledCount,
                'percent' => $totalTasksCount > 0 ? (int) round(($cancelledCount / $totalTasksCount) * 100) : 0,
            ],
        ];

        // ==========================================
        // 7. 3 PELAMAR TERBARU YANG PERLU DITINJAU
        // ==========================================
        $recentApplicants = TaskApplication::query()
            ->where('status', 'pending')
            ->whereHas('task', function ($query) use ($business) {
                $query->where('business_id', $business->id);
            })
            ->with([
                'worker:id,name,email,verification_status',
                'worker.workerProfile',
                'task:id,business_id,title,status,worker_quota,wage_amount',
            ])
            ->latest('created_at')
            ->limit(3)
            ->get()
            ->map(function (TaskApplication $application) {
                $worker = $application->worker;
                $completedTasks = TaskApplication::query()
                    ->where('worker_id', $application->worker_id)
                    ->where('status', 'accepted')
                    ->whereHas('payment', fn ($q) => $q->where('status', TaskPaymentStatus::Paid->value))
                    ->count();

                return [
                    'id' => $application->id,
                    'taskId' => $application->task_id,
                    'taskTitle' => $application->task->title ?? '-',
                    'name' => $worker->name ?? 'Pencari Kerja',
                    'email' => $worker->email ?? '-',
                    'initials' => $this->getInitials($worker->name ?? 'PK'),
                    'verified' => $worker->verification_status === 'approved',
                    'rating' => '4.9',
                    'reviewsCount' => max(1, $completedTasks),
                    'completedTasks' => $completedTasks,
                    'appliedAt' => $application->created_at?->diffForHumans() ?? 'Baru saja',
                ];
            })
            ->values()
            ->all();

        // ==========================================
        // 8. TRANSAKSI UPAH TERBARU (OVERVIEW)
        // ==========================================
        $recentPayments = TaskPayment::query()
            ->whereHas('application.task', function ($query) use ($business) {
                $query->where('business_id', $business->id);
            })
            ->with([
                'application.worker:id,name,email',
                'application.task:id,title,starts_at,ends_at',
            ])
            ->latest('paid_at')
            ->latest('id')
            ->limit(5)
            ->get();

        $recentTransactions = $recentPayments->map(function (TaskPayment $payment) {
            $task = $payment->application?->task;
            $worker = $payment->application?->worker;
            $date = $payment->paid_at ?? $payment->created_at;

            $hours = '-';
            if ($task && $task->starts_at && $task->ends_at) {
                $diffMinutes = $task->starts_at->diffInMinutes($task->ends_at);
                $h = intdiv((int) $diffMinutes, 60);
                $m = $diffMinutes % 60;
                $hours = $h > 0 ? ($m > 0 ? "{$h}j {$m}m" : "{$h} Jam") : "{$m} Menit";
            }

            return [
                'id' => $payment->id,
                'code' => sprintf('#KN-%05d', $payment->id),
                'taskTitle' => $task->title ?? 'Tugas UMKM',
                'workerName' => $worker->name ?? 'Pekerja',
                'workerInitials' => $this->getInitials($worker->name ?? 'P'),
                'date' => $date ? $date->translatedFormat('d M Y') : '-',
                'shortDate' => $date ? $date->translatedFormat('d M') : '-',
                'hours' => $hours,
                'wage' => (int) $payment->amount,
                'status' => $payment->status === TaskPaymentStatus::Paid->value ? 'Disetujui' : 'Menunggu',
                'period' => $date ? $date->translatedFormat('F Y') : Carbon::now()->translatedFormat('F Y'),
            ];
        })->values()->all();

        // 5 Tugas terbaru untuk kompatibilitas
        $recentTasks = $business->tasks()
            ->latest('id')
            ->limit(5)
            ->get()
            ->map(fn (Task $task): array => [
                'id' => $task->id,
                'title' => $task->title,
                'category' => $task->category,
                'status' => $task->status,
                'workerQuota' => $task->worker_quota,
                'wageAmount' => $task->wage_amount === null
                    ? null
                    : (int) $task->wage_amount,
            ])
            ->values()
            ->all();

        return Inertia::render('employer/dashboard', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'isVerified' => $user->verification_status === 'approved',
                'verificationStatus' => $user->verification_status ?? 'pending',
                'businessName' => $business->name,
                'businessCategory' => $business->category,
            ],
            'stats' => [
                'activeTasks' => $activeTasks,
                'pendingApplicants' => $pendingApplicants,
                'completedThisMonth' => $completedThisMonth,
                'completedPercentageChange' => $completedPercentageChange,
                'monthlyExpenses' => $monthlyExpenses,
                'currentMonthName' => $now->translatedFormat('F Y'),
                'lastMonthName' => $now->copy()->subMonth()->translatedFormat('F'),
                'expensePercentageChange' => $expensePercentageChange,
            ],
            'chartData' => [
                'items' => $chartMonths,
                'totalAmount' => $totalPeriodExpense,
                'totalAmountFormatted' => $this->formatCompactRupiah($totalPeriodExpense),
                'growthPercent' => $chartGrowth,
            ],
            'taskDistribution' => $taskDistribution,
            'recentApplicants' => $recentApplicants,
            'recentTransactions' => $recentTransactions,
            'recentTasks' => $recentTasks,
        ]);
    }

    private function getInitials(string $name): string
    {
        $words = preg_split('/\s+/', trim($name)) ?: [];
        $initials = '';
        foreach (array_slice($words, 0, 2) as $w) {
            $initials .= mb_substr($w, 0, 1);
        }

        return mb_strtoupper($initials ?: 'KN');
    }

    private function formatCompactRupiah(int $amount): string
    {
        if ($amount >= 1_000_000_000) {
            return 'Rp '.rtrim(rtrim(number_format($amount / 1_000_000_000, 2, ',', '.'), '0'), ',').' M';
        }
        if ($amount >= 1_000_000) {
            return 'Rp '.rtrim(rtrim(number_format($amount / 1_000_000, 2, ',', '.'), '0'), ',').' jt';
        }

        return 'Rp '.number_format($amount, 0, ',', '.');
    }
}
