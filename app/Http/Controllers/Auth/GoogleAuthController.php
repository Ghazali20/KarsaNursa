<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Socialite\Facades\Socialite;
use Throwable;

class GoogleAuthController extends Controller
{
    /**
     * Redirect pengguna ke Google.
     */
    public function redirect(Request $request): \Symfony\Component\HttpFoundation\RedirectResponse
    {
        $request->session()->forget('google_registration');

        return Socialite::driver('google')->redirect();
    }

    /**
     * Menangani callback setelah login Google.
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

        // Pengguna yang sebelumnya mendaftar dengan Google.
        $user = User::query()
            ->where('google_id', $googleId)
            ->first();

        if ($user !== null) {
            Auth::login($user);
            $request->session()->regenerate();

            return redirect('/dashboard');
        }

        // Akun manual tidak otomatis dihubungkan ke Google.
        if (User::query()->where('email', $email)->exists()) {
            return redirect()
                ->route('login')
                ->withErrors([
                    'google' => 'Email sudah terdaftar. Silakan gunakan metode login sebelumnya.',
                ]);
        }

        // Simpan identitas sementara di session server.
        $request->session()->put('google_registration', [
            'id' => $googleId,
            'name' => $googleUser->getName() ?: 'Pengguna Google',
            'email' => $email,
        ]);

        return redirect()->route('google.complete');
    }

    /**
     * Menampilkan formulir pemilihan role.
     */
    public function showComplete(Request $request): Response|RedirectResponse
    {
        $pending = $request->session()->get('google_registration');

        if (! is_array($pending)) {
            return redirect()->route('login');
        }

        return Inertia::render('auth/google-complete', [
            'googleName' => $pending['name'],
            'googleEmail' => $pending['email'],
        ]);
    }

    /**
     * Menyelesaikan pendaftaran melalui Google.
     */
    public function storeComplete(Request $request): RedirectResponse
    {
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

        $validated = $request->validate([
            'role' => [
                'required',
                Rule::in(['worker', 'employer']),
            ],
            'phone' => [
                'required',
                'string',
                'max:20',
            ],

            // Profil pencari kerja.
            'worker_identity_type' => [
                'nullable',
                'required_if:role,worker',
                Rule::in(['ktp']),
            ],
            'worker_date_of_birth' => [
                'nullable',
                'required_if:role,worker',
                'date',
                'before:today',
            ],
            'worker_address' => [
                'nullable',
                'required_if:role,worker',
                'string',
                'max:1000',
            ],
            'worker_skills' => [
                'nullable',
                'string',
                'max:1000',
            ],

            // Profil pemilik UMKM.
            'business_name' => [
                'nullable',
                'required_if:role,employer',
                'string',
                'max:255',
            ],
            'business_document_type' => [
                'nullable',
                'required_if:role,employer',
                Rule::in(['nib']),
            ],
            'business_category' => [
                'nullable',
                'required_if:role,employer',
                'string',
                'max:255',
            ],
            'business_address' => [
                'nullable',
                'required_if:role,employer',
                'string',
                'max:1000',
            ],
        ]);

        $user = DB::transaction(function () use ($pending, $validated) {
            // Mencegah akun Google dan email ganda.
            if (
                User::query()->where('google_id', $pending['id'])->exists() ||
                User::query()->where('email', $pending['email'])->exists()
            ) {
                throw ValidationException::withMessages([
                    'google' => 'Akun sudah terdaftar. Silakan login kembali.',
                ]);
            }

            $user = User::query()->create([
                'name' => Str::limit($pending['name'], 255, ''),
                'email' => $pending['email'],
                'google_id' => $pending['id'],
                'role' => $validated['role'],
                'phone' => $validated['phone'],
                'verification_status' => 'approved',

                // Tidak menjadi password login manual.
                'password' => Hash::make(Str::random(64)),
            ]);

            // Email telah diverifikasi oleh penyedia Google.
            // verified_at untuk persetujuan Admin tidak diisi.
            $user->email_verified_at = now();
            $user->save();

            if ($validated['role'] === 'worker') {
                $skills = array_values(array_filter(
                    array_map(
                        'trim',
                        explode(',', $validated['worker_skills'] ?? '')
                    )
                ));

                $user->workerProfile()->create([
                    'identity_type' => $validated['worker_identity_type'],
                    'date_of_birth' => $validated['worker_date_of_birth'],
                    'address' => $validated['worker_address'],
                    'skills' => $skills,
                ]);
            }

            if ($validated['role'] === 'employer') {
                $user->business()->create([
                    'name' => $validated['business_name'],
                    'document_type' => $validated['business_document_type'],
                    'category' => $validated['business_category'],
                    'address' => $validated['business_address'],
                ]);
            }

            return $user;
        });

        $request->session()->forget('google_registration');

        Auth::login($user);
        $request->session()->regenerate();

        return redirect('/dashboard');
    }
}
