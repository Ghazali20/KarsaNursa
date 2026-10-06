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
        $validated = Validator::make($input, [
            ...$this->profileRules(),
            'role' => ['required', Rule::in(['worker', 'employer'])],
            'phone' => ['required', 'string', 'max:30'],

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
}
