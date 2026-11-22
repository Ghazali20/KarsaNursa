<?php

namespace App\Http\Controllers\Employer;

use App\Enums\TaskApplicationStatus;
use App\Enums\TaskPaymentStatus;
use App\Http\Controllers\Controller;
use App\Models\TaskApplication;
use App\Models\TaskPayment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class TaskPaymentController extends Controller
{
    /**
     * Menampilkan halaman Buku Pengeluaran Tenaga Kerja UMKM.
     */
    public function index(Request $request): Response
    {
        Carbon::setLocale('id');

        $user = $request->user();
        $business = $user?->business;

        abort_if(
            $business === null,
            403,
            'Profil usaha belum tersedia.'
        );

        $now = Carbon::now();
        $monthParam = $request->query('month');

        // Dapatkan semua periode transaksi yang pernah tercatat untuk dropdown opsi
        $allMonthKeys = TaskPayment::query()
            ->where('task_payments.status', TaskPaymentStatus::Paid->value)
            ->whereHas('application.task', fn ($q) => $q->where('business_id', $business->id))
            ->selectRaw('COALESCE(paid_at, created_at) as tx_date')
            ->orderByDesc('tx_date')
            ->pluck('tx_date')
            ->map(fn ($d) => Carbon::parse($d)->format('Y-m'))
            ->unique()
            ->values()
            ->all();

        if (empty($allMonthKeys)) {
            $allMonthKeys = [$now->format('Y-m')];
        }

        $selectedMonthKey = $monthParam;
        if (! $selectedMonthKey || (! in_array($selectedMonthKey, $allMonthKeys) && $selectedMonthKey !== 'all')) {
            $selectedMonthKey = $allMonthKeys[0];
        }

        $isAllPeriods = $selectedMonthKey === 'all';
        $selectedDate = $isAllPeriods ? $now : Carbon::createFromFormat('Y-m', $selectedMonthKey);
        $startOfMonth = $selectedDate->copy()->startOfMonth();
        $endOfMonth = $selectedDate->copy()->endOfMonth();
        $startOfPrevMonth = $selectedDate->copy()->subMonth()->startOfMonth();
        $endOfPrevMonth = $selectedDate->copy()->subMonth()->endOfMonth();

        // 1. Biaya Tenaga Kerja Bulan Terpilih + Selisih dari Bulan Lalu
        $monthlyExpenses = (int) TaskPayment::query()
            ->where('task_payments.status', TaskPaymentStatus::Paid->value)
            ->where(function ($query) use ($startOfMonth, $endOfMonth) {
                $query->whereBetween('task_payments.paid_at', [$startOfMonth, $endOfMonth])
                    ->orWhere(function ($sq) use ($startOfMonth, $endOfMonth) {
                        $sq->whereNull('task_payments.paid_at')
                            ->whereBetween('task_payments.updated_at', [$startOfMonth, $endOfMonth]);
                    });
            })
            ->whereHas('application.task', fn ($q) => $q->where('business_id', $business->id))
            ->sum('amount');

        $prevMonthExpenses = (int) TaskPayment::query()
            ->where('task_payments.status', TaskPaymentStatus::Paid->value)
            ->where(function ($query) use ($startOfPrevMonth, $endOfPrevMonth) {
                $query->whereBetween('task_payments.paid_at', [$startOfPrevMonth, $endOfPrevMonth])
                    ->orWhere(function ($sq) use ($startOfPrevMonth, $endOfPrevMonth) {
                        $sq->whereNull('task_payments.paid_at')
                            ->whereBetween('task_payments.updated_at', [$startOfPrevMonth, $endOfPrevMonth]);
                    });
            })
            ->whereHas('application.task', fn ($q) => $q->where('business_id', $business->id))
            ->sum('amount');

        if ($prevMonthExpenses > 0) {
            $expensePercentageChange = round((($monthlyExpenses - $prevMonthExpenses) / $prevMonthExpenses) * 100, 1);
        } else {
            $expensePercentageChange = $monthlyExpenses > 0 ? 100.0 : 0.0;
        }

        // 2. Tugas Dibayarkan
        $paidTasksCount = TaskPayment::query()
            ->where('task_payments.status', TaskPaymentStatus::Paid->value)
            ->where(function ($query) use ($startOfMonth, $endOfMonth, $isAllPeriods) {
                if (! $isAllPeriods) {
                    $query->whereBetween('task_payments.paid_at', [$startOfMonth, $endOfMonth])
                        ->orWhere(function ($sq) use ($startOfMonth, $endOfMonth) {
                            $sq->whereNull('task_payments.paid_at')
                                ->whereBetween('task_payments.updated_at', [$startOfMonth, $endOfMonth]);
                        });
                }
            })
            ->whereHas('application.task', fn ($q) => $q->where('business_id', $business->id))
            ->distinct('task_application_id')
            ->count();

        $totalTasksCount = $business->tasks()->count();

        // 3. Pekerja Unik (Menggunakan task_payments.status agar tidak ambigu)
        $uniqueWorkersCount = TaskPayment::query()
            ->where('task_payments.status', TaskPaymentStatus::Paid->value)
            ->where(function ($query) use ($startOfMonth, $endOfMonth, $isAllPeriods) {
                if (! $isAllPeriods) {
                    $query->whereBetween('task_payments.paid_at', [$startOfMonth, $endOfMonth])
                        ->orWhere(function ($sq) use ($startOfMonth, $endOfMonth) {
                            $sq->whereNull('task_payments.paid_at')
                                ->whereBetween('task_payments.updated_at', [$startOfMonth, $endOfMonth]);
                        });
                }
            })
            ->whereHas('application.task', fn ($q) => $q->where('business_id', $business->id))
            ->join('task_applications', 'task_payments.task_application_id', '=', 'task_applications.id')
            ->distinct('task_applications.worker_id')
            ->count('task_applications.worker_id');

        // 4. Daftar Transaksi Upah
        $paymentsQuery = TaskPayment::query()
            ->whereHas('application.task', fn ($q) => $q->where('business_id', $business->id))
            ->with([
                'application.worker:id,name,email',
                'application.task:id,title,starts_at,ends_at',
            ])
            ->latest('paid_at')
            ->latest('id');

        if (! $isAllPeriods) {
            $paymentsQuery->where(function ($query) use ($startOfMonth, $endOfMonth) {
                $query->whereBetween('task_payments.paid_at', [$startOfMonth, $endOfMonth])
                    ->orWhere(function ($sq) use ($startOfMonth, $endOfMonth) {
                        $sq->whereNull('task_payments.paid_at')
                            ->whereBetween('task_payments.updated_at', [$startOfMonth, $endOfMonth]);
                    });
            });
        }

        $transactions = $paymentsQuery->get()->map(function (TaskPayment $payment) {
            $task = $payment->application?->task;
            $worker = $payment->application?->worker;
            $date = $payment->paid_at ?? $payment->created_at;

            $hours = '-';
            if ($task && $task->starts_at && $task->ends_at) {
                $diffMinutes = (int) $task->starts_at->diffInMinutes($task->ends_at);
                $h = intdiv($diffMinutes, 60);
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

        // Daftar Periode untuk Opsi Dropdown
        $availablePeriods = collect($allMonthKeys)->map(function ($dateKey) {
            $carbon = Carbon::createFromFormat('Y-m', $dateKey);

            return [
                'key' => $dateKey,
                'label' => $carbon->translatedFormat('F Y'),
            ];
        })->values()->all();

        $pendingApplicants = TaskApplication::query()
            ->where('status', 'pending')
            ->whereHas('task', fn ($q) => $q->where('business_id', $business->id))
            ->count();

        return Inertia::render('employer/payments/index', [
            'stats' => [
                'monthlyExpense' => $monthlyExpenses,
                'expensePercentageChange' => $expensePercentageChange,
                'paidTasksCount' => $paidTasksCount,
                'totalTasksCount' => $totalTasksCount,
                'uniqueWorkersCount' => $uniqueWorkersCount,
                'averageRating' => '4.8',
                'selectedMonthKey' => $selectedMonthKey,
                'selectedMonthLabel' => $isAllPeriods ? 'Semua Periode' : $selectedDate->translatedFormat('F Y'),
                'prevMonthLabel' => $selectedDate->copy()->subMonth()->translatedFormat('F'),
                'pendingApplicants' => $pendingApplicants,
            ],
            'availablePeriods' => $availablePeriods,
            'transactions' => $transactions,
        ]);
    }

    /**
     * Mencatat pembayaran upah yang telah dilakukan oleh UMKM.
     *
     * Fitur ini mencatat pembayaran, bukan memproses transfer uang.
     */
    public function markPaid(
        Request $request,
        TaskApplication $application
    ): RedirectResponse {
        $business = $request->user()->business;

        abort_if(
            $business === null,
            403,
            'Profil usaha belum tersedia.'
        );

        DB::transaction(function () use (
            $application,
            $business,
        ): void {
            $lockedApplication = TaskApplication::query()
                ->with('task')
                ->lockForUpdate()
                ->findOrFail($application->id);

            abort_unless(
                (int) $lockedApplication->task->business_id
                    === (int) $business->id,
                403
            );

            if (
                $lockedApplication->status
                !== TaskApplicationStatus::Accepted->value
            ) {
                throw ValidationException::withMessages([
                    'payment' => 'Upah hanya dapat dibayar kepada pekerja yang diterima.',
                ]);
            }

            $payment = TaskPayment::query()
                ->where(
                    'task_application_id',
                    $lockedApplication->id
                )
                ->lockForUpdate()
                ->first();

            if ($payment === null) {
                throw ValidationException::withMessages([
                    'payment' => 'Catatan pembayaran untuk lamaran ini belum tersedia.',
                ]);
            }

            if ($payment->status !== TaskPaymentStatus::Pending->value) {
                throw ValidationException::withMessages([
                    'payment' => 'Pembayaran ini sudah diproses sebelumnya.',
                ]);
            }

            $payment->update([
                'status' => TaskPaymentStatus::Paid->value,
                'paid_at' => now(),
            ]);
        }, 3);

        return to_route('employer.applications.index')->with(
            'success',
            'Pembayaran upah berhasil dicatat.'
        );
    }

    private function getInitials(string $name): string
    {
        $words = preg_split('/\s+/', trim($name)) ?: [];
        $initials = '';
        foreach (array_slice($words, 0, 2) as $w) {
            $initials .= mb_substr($w, 0, 1);
        }

        return mb_strtoupper($initials ?: 'PK');
    }
}
