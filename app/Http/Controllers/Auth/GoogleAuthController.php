<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Socialite\Facades\Socialite;
use RuntimeException;
use Symfony\Component\HttpFoundation\RedirectResponse as SymfonyRedirectResponse;
use Throwable;

class GoogleAuthController extends Controller
{
    /**
     * Mengarahkan pengguna ke halaman Google OAuth.
     */
    public function redirect(Request $request): SymfonyRedirectResponse
    {
        $request->session()->forget('google_registration');

        return Socialite::driver('google')->redirect();
    }

    /**
     * Menangani callback dari Google OAuth.
     */
    public function callback(Request $request): RedirectResponse
    {
        try {
            $googleUser = Socialite::driver('google')->user();
        } catch (Throwable $exception) {
            report($exception);

            return redirect()
                ->route('login')
                ->withErrors([
                    'google' => 'Autentikasi Google gagal. Silakan coba lagi.',
                ]);
        }

        $googleId = (string) $googleUser->getId();
        $email = $googleUser->getEmail();

        // Pastikan Google ID dan email valid.
        if (
            $googleId === '' ||
            ! is_string($email) ||
            $email === '' ||
            ! ($googleUser->user['email_verified'] ?? false)
        ) {
            return redirect()
                ->route('login')
                ->withErrors([
                    'google' => 'Identitas atau email Google tidak dapat diverifikasi.',
                ]);
        }

        // ========================================
        // AKUN GOOGLE SUDAH TERDAFTAR
        // ========================================

        $user = User::query()
            ->where('google_id', $googleId)
            ->first();

        if ($user !== null) {
            Auth::login($user);

            $request->session()->regenerate();

            return redirect('/dashboard');
        }

        // ========================================
        // CEGAH EMAIL GANDA
        // ========================================

        // Akun manual tidak otomatis dihubungkan
        // ke akun Google hanya berdasarkan email.
        if (
            User::query()
                ->where('email', $email)
                ->exists()
        ) {
            return redirect()
                ->route('login')
                ->withErrors([
                    'google' => 'Email sudah terdaftar. Silakan gunakan metode login sebelumnya.',
                ]);
        }

        // ========================================
        // SIMPAN DATA GOOGLE DI SESSION
        // ========================================

        $request->session()->put('google_registration', [
            'id' => $googleId,
            'name' => $googleUser->getName() ?: 'Pengguna Google',
            'email' => $email,
        ]);

        return redirect()->route('google.complete');
    }

    /**
     * Menampilkan halaman Lengkapi Pendaftaran Google.
     */
    public function showComplete(
        Request $request
    ): Response|RedirectResponse {
        $pending = $request->session()->get('google_registration');

        if (
            ! is_array($pending) ||
            empty($pending['id']) ||
            empty($pending['email'])
        ) {
            return redirect()->route('login');
        }

        return Inertia::render('auth/google-complete', [
            'googleName' => $pending['name'],
            'googleEmail' => $pending['email'],
        ]);
    }

    /**
     * Menyelesaikan pendaftaran pengguna Google.
     *
     * Mendukung:
     * - Worker: KTP atau KTM
     * - Employer: NIB atau Surat Usaha
     * - Upload PDF, JPG, JPEG, PNG maksimal 5 MB
     */
    public function storeComplete(Request $request): RedirectResponse
    {
        // ========================================
        // 1. VALIDASI SESSION GOOGLE
        // ========================================

        $pending = $request->session()->get('google_registration');

        if (
            ! is_array($pending) ||
            empty($pending['id']) ||
            empty($pending['email'])
        ) {
            return redirect()
                ->route('login')
                ->withErrors([
                    'google' => 'Sesi pendaftaran Google berakhir. Silakan coba lagi.',
                ]);
        }

        // ========================================
        // 2. VALIDASI FORM PENDAFTARAN
        // ========================================

        $validated = $request->validate([
            // ------------------------------------
            // DATA UMUM
            // ------------------------------------

            'role' => [
                'required',
                Rule::in(['worker', 'employer']),
            ],

            'phone' => [
                'required',
                'string',
                'max:20',
            ],

            // ------------------------------------
            // PROFIL PEN CARI KERJA
            // ------------------------------------

            'worker_identity_type' => [
                'exclude_unless:role,worker',
                'required',
                Rule::in(['ktp', 'ktm']),
            ],

            'worker_identity_document' => [
                'exclude_unless:role,worker',
                'required',
                'file',
                'mimes:pdf,jpg,jpeg,png',
                'extensions:pdf,jpg,jpeg,png',
                'max:5120',
            ],

            'worker_date_of_birth' => [
                'exclude_unless:role,worker',
                'required',
                'date',
                'before:today',
            ],

            'worker_address' => [
                'exclude_unless:role,worker',
                'required',
                'string',
                'max:1000',
            ],

            'worker_skills' => [
                'exclude_unless:role,worker',
                'nullable',
                'string',
                'max:1000',
            ],

            // ------------------------------------
            // PROFIL PEMILIK UMKM
            // ------------------------------------

            'business_name' => [
                'exclude_unless:role,employer',
                'required',
                'string',
                'max:255',
            ],

            'business_document_type' => [
                'exclude_unless:role,employer',
                'required',
                Rule::in(['nib', 'surat_usaha']),
            ],

            'business_document' => [
                'exclude_unless:role,employer',
                'required',
                'file',
                'mimes:pdf,jpg,jpeg,png',
                'extensions:pdf,jpg,jpeg,png',
                'max:5120',
            ],

            'business_category' => [
                'exclude_unless:role,employer',
                'required',
                'string',
                'max:255',
            ],

            'business_address' => [
                'exclude_unless:role,employer',
                'required',
                'string',
                'max:1000',
            ],
        ], [
            'worker_identity_document.required' => 'Dokumen KTP atau KTM wajib diunggah.',

            'business_document.required' => 'Dokumen NIB atau Surat Usaha wajib diunggah.',

            'worker_identity_document.mimes' => 'Dokumen harus berupa PDF, JPG, atau PNG.',

            'business_document.mimes' => 'Dokumen harus berupa PDF, JPG, atau PNG.',

            'worker_identity_document.extensions' => 'Ekstensi dokumen harus PDF, JPG, atau PNG.',

            'business_document.extensions' => 'Ekstensi dokumen harus PDF, JPG, atau PNG.',

            'worker_identity_document.max' => 'Ukuran dokumen maksimal 5 MB.',

            'business_document.max' => 'Ukuran dokumen maksimal 5 MB.',
        ]);

        // ========================================
        // 3. TENTUKAN DOKUMEN SESUAI ROLE
        // ========================================

        $isWorker = $validated['role'] === 'worker';

        $documentField = $isWorker
            ? 'worker_identity_document'
            : 'business_document';

        $documentType = $isWorker
            ? $validated['worker_identity_type']
            : $validated['business_document_type'];

        $file = $validated[$documentField];

        if (! $file instanceof UploadedFile) {
            throw ValidationException::withMessages([
                $documentField => 'Dokumen yang diunggah tidak valid.',
            ]);
        }

        // Menghitung checksum dari file asli.
        $checksum = hash_file('sha256', $file->getRealPath());

        if ($checksum === false) {
            throw ValidationException::withMessages([
                $documentField => 'Dokumen tidak dapat diproses. Silakan unggah ulang.',
            ]);
        }

        // Menyimpan path untuk membersihkan file
        // apabila transaksi database gagal.
        $storedDocumentPath = null;

        // ========================================
        // 4. SIMPAN USER DAN DOKUMEN
        // ========================================

        try {
            $user = DB::transaction(function () use (
                $pending,
                $validated,
                $isWorker,
                $file,
                $documentType,
                $checksum,
                &$storedDocumentPath
            ): User {
                // --------------------------------
                // CEGAH AKUN GOOGLE GANDA
                // --------------------------------

                if (
                    User::query()
                        ->where('google_id', $pending['id'])
                        ->exists() ||
                    User::query()
                        ->where('email', $pending['email'])
                        ->exists()
                ) {
                    throw ValidationException::withMessages([
                        'google' => 'Akun sudah terdaftar. Silakan login kembali.',
                    ]);
                }

                // --------------------------------
                // BUAT AKUN PENGGUNA
                // --------------------------------

                $user = User::query()->create([
                    'name' => Str::limit($pending['name'], 255, ''),
                    'email' => $pending['email'],
                    'google_id' => $pending['id'],
                    'role' => $validated['role'],
                    'phone' => $validated['phone'],

                    // Akun langsung aktif.
                    'verification_status' => 'approved',

                    // Password acak untuk akun Google.
                    'password' => Hash::make(
                        Str::random(64)
                    ),
                ]);

                // Email sudah diverifikasi oleh Google.
                $user->email_verified_at = now();
                $user->save();

                // --------------------------------
                // BUAT PROFIL PEN CARI KERJA
                // --------------------------------

                if ($isWorker) {
                    $skills = array_values(
                        array_filter(
                            array_map(
                                'trim',
                                explode(
                                    ',',
                                    $validated['worker_skills'] ?? ''
                                )
                            )
                        )
                    );

                    $user->workerProfile()->create([
                        'identity_type' => $validated['worker_identity_type'],

                        'date_of_birth' => $validated['worker_date_of_birth'],

                        'address' => $validated['worker_address'],

                        'skills' => $skills,
                    ]);
                }

                // --------------------------------
                // BUAT PROFIL PEMILIK UMKM
                // --------------------------------

                if (! $isWorker) {
                    $user->business()->create([
                        'name' => $validated['business_name'],

                        'document_type' => $validated['business_document_type'],

                        'category' => $validated['business_category'],

                        'address' => $validated['business_address'],
                    ]);
                }

                // --------------------------------
                // UPLOAD DOKUMEN KE STORAGE PRIVAT
                // --------------------------------

                $storedDocumentPath = $file->store(
                    "verifications/{$user->id}",
                    'local'
                );

                if ($storedDocumentPath === false) {
                    throw new RuntimeException(
                        'Dokumen verifikasi gagal disimpan.'
                    );
                }

                // --------------------------------
                // SIMPAN METADATA DOKUMEN
                // --------------------------------

                $user->verificationDocuments()->create([
                    'document_type' => $documentType,

                    'disk' => 'local',

                    'storage_path' => $storedDocumentPath,

                    'original_name' => $file->getClientOriginalName(),

                    'mime_type' => $file->getMimeType()
                            ?? 'application/octet-stream',

                    'file_size' => $file->getSize(),

                    'sha256' => $checksum,

                    // Status peninjauan dokumen.
                    // Tidak menghalangi login akun.
                    'status' => 'pending',
                ]);

                return $user;
            });
        } catch (Throwable $exception) {
            // --------------------------------
            // BERSIHKAN FILE JIKA DATABASE GAGAL
            // --------------------------------

            if (
                is_string($storedDocumentPath) &&
                $storedDocumentPath !== ''
            ) {
                Storage::disk('local')
                    ->delete($storedDocumentPath);
            }

            throw $exception;
        }

        // ========================================
        // 5. HAPUS SESSION PENDAFTARAN
        // ========================================

        $request->session()->forget('google_registration');

        // ========================================
        // 6. LOGIN PENGGUNA
        // ========================================

        Auth::login($user);

        $request->session()->regenerate();

        // ========================================
        // 7. REDIRECT SESUAI ROLE
        // ========================================

        return redirect('/dashboard');
    }
}
