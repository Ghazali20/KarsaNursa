<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Models\Business;
use App\Models\User;
use App\Models\VerificationDocument;
use App\Models\WorkerProfile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Laravel\Fortify\Contracts\CreatesNewUsers;
use RuntimeException;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules, ProfileValidationRules;

    /**
     * Validate and create a newly registered user.
     *
     * @param  array<string, mixed>  $input
     */
    public function create(array $input): User
    {
        if (isset($input['phone'])) {
            $input['phone'] = $this->normalizePhone((string) $input['phone']);
        }

        $validated = Validator::make($input, [
            ...$this->profileRules(),
            'role' => ['required', Rule::in(['worker', 'employer'])],
            'phone' => [
                'required',
                'string',
                'max:20',
                Rule::unique('users', 'phone'),
            ],

            'identity_type' => [
                'nullable',
                'required_if:role,worker',
                Rule::in(['ktp', 'ktm']),
            ],

            'business_name' => [
                'nullable',
                'required_if:role,employer',
                'string',
                'max:255',
            ],

            'business_document_type' => [
                'nullable',
                'required_if:role,employer',
                Rule::in(['nib', 'surat_usaha']),
            ],

            'verification_document' => [
                'required',
                'file',
                'mimes:jpg,jpeg,png,pdf',
                'max:5120',
            ],

            'password' => $this->passwordRules(),
        ], [
            'phone.required' => 'Nomor telepon wajib diisi.',
            'phone.unique' => 'Nomor telepon ini sudah terdaftar. Gunakan nomor lain.',
            'password.min' => 'Kata sandi minimal harus terdiri dari 8 karakter.',
            'password.required' => 'Kata sandi wajib diisi.',
            'password.confirmed' => 'Konfirmasi kata sandi tidak cocok.',
        ])->validate();

        return DB::transaction(function () use ($validated): User {
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => $validated['password'],
                'role' => $validated['role'],
                'phone' => $validated['phone'],
                'verification_status' => 'pending',
            ]);

            if ($validated['role'] === 'worker') {
                WorkerProfile::create([
                    'user_id' => $user->id,
                    'identity_type' => $validated['identity_type'],
                ]);

                $documentType = $validated['identity_type'];
            } else {
                Business::create([
                    'user_id' => $user->id,
                    'name' => $validated['business_name'],
                    'document_type' => $validated['business_document_type'],
                ]);

                $documentType = $validated['business_document_type'];
            }

            $file = $validated['verification_document'];

            $storagePath = $file->store(
                "verifications/{$user->id}",
                'local',
            );

            if ($storagePath === false) {
                throw new RuntimeException(
                    'Dokumen verifikasi gagal disimpan.',
                );
            }

            VerificationDocument::create([
                'user_id' => $user->id,
                'document_type' => $documentType,
                'disk' => 'local',
                'storage_path' => $storagePath,
                'original_name' => $file->getClientOriginalName(),
                'mime_type' => $file->getMimeType()
                    ?? 'application/octet-stream',
                'file_size' => $file->getSize(),
                'sha256' => hash_file(
                    'sha256',
                    $file->getRealPath(),
                ),
                'status' => 'pending',
            ]);

            return $user;
        });
    }

    /**
     * Normalisasi nomor telepon ke format standar (08...).
     */
    private function normalizePhone(?string $phone): string
    {
        if ($phone === null) {
            return '';
        }

        $cleaned = preg_replace('/\D+/', '', $phone) ?? '';

        if (str_starts_with($cleaned, '62')) {
            $cleaned = '0'.substr($cleaned, 2);
        } elseif (str_starts_with($cleaned, '8')) {
            $cleaned = '0'.$cleaned;
        }

        return $cleaned;
    }
}
