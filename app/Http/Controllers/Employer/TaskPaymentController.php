<?php

namespace App\Http\Controllers\Employer;

use App\Enums\TaskApplicationStatus;
use App\Enums\TaskPaymentStatus;
use App\Http\Controllers\Controller;
use App\Models\TaskApplication;
use App\Models\TaskPayment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class TaskPaymentController extends Controller
{
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
}
