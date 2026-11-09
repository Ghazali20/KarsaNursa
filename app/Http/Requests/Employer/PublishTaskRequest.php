<?php

namespace App\Http\Requests\Employer;

use App\Enums\TaskStatus;
use App\Models\Task;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class PublishTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        $task = $this->route('task');

        return $task !== null
            && $this->user()?->can(
                'publish',
                $task,
            );
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (
            $validator,
        ): void {
            $task = $this->route('task');

            if (! $task instanceof Task) {
                return;
            }

            if (
                $task->status
                !== TaskStatus::Draft->value
            ) {
                $validator->errors()->add(
                    'task',
                    'Hanya tugas draft yang dapat dipublikasikan.',
                );
            }

            if (
                $task->application_deadline === null
                || $task->application_deadline->isPast()
            ) {
                $validator->errors()->add(
                    'application_deadline',
                    'Batas waktu lamaran sudah lewat. Ubah jadwal sebelum mempublikasikan tugas.',
                );
            }

            if ($task->starts_at === null || $task->starts_at->isPast()) {
                $validator->errors()->add(
                    'starts_at',
                    'Waktu mulai tugas sudah lewat. Ubah jadwal sebelum mempublikasikan tugas.',
                );
            }

            if (
                $task->ends_at === null
                || $task->starts_at === null
                || $task->ends_at->lessThanOrEqualTo($task->starts_at)
            ) {
                $validator->errors()->add(
                    'ends_at',
                    'Waktu selesai harus setelah waktu mulai.',
                );
            }
        });
    }
}
