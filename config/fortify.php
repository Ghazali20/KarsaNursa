<?php

use Laravel\Fortify\Features;

return [

    /*
    |--------------------------------------------------------------------------
    | Fortify Guard
    |--------------------------------------------------------------------------
    |
    | Autentikasi pengguna KarsaNursa menggunakan session web Laravel.
    |
    */

    'guard' => 'web',

    /*
    |--------------------------------------------------------------------------
    | Fortify Password Broker
    |--------------------------------------------------------------------------
    |
    | Digunakan untuk fitur lupa password.
    |
    */

    'passwords' => 'users',

    /*
    |--------------------------------------------------------------------------
    | Username / Email
    |--------------------------------------------------------------------------
    |
    | Pengguna login menggunakan email dan password.
    |
    */

    'username' => 'email',

    'email' => 'email',

    /*
    |--------------------------------------------------------------------------
    | Lowercase Usernames
    |--------------------------------------------------------------------------
    */

    'lowercase_usernames' => true,

    /*
    |--------------------------------------------------------------------------
    | Home Path
    |--------------------------------------------------------------------------
    |
    | Setelah login, pengguna diarahkan ke /dashboard.
    | Middleware approved akan memeriksa status persetujuan Admin.
    |
    */

    'home' => '/dashboard',

    /*
    |--------------------------------------------------------------------------
    | Fortify Routes Prefix / Subdomain
    |--------------------------------------------------------------------------
    */

    'prefix' => '',

    'domain' => null,

    /*
    |--------------------------------------------------------------------------
    | Fortify Routes Middleware
    |--------------------------------------------------------------------------
    */

    'middleware' => ['web'],

    /*
    |--------------------------------------------------------------------------
    | Rate Limiting
    |--------------------------------------------------------------------------
    |
    | Pembatasan percobaan login tetap digunakan untuk membantu melindungi akun pengguna.
    |
    | Rate limiter Passkey dan 2FA dihapus karena fiturnya tidak digunakan.
    |
    */

    'limiters' => [
        'login' => 'login',
    ],

    /*
    |--------------------------------------------------------------------------
    | Register View Routes
    |--------------------------------------------------------------------------
    |
    | Tetap aktif untuk halaman login, registrasi, dan reset password.
    |
    */

    'views' => true,

    /*
    |--------------------------------------------------------------------------
    | Features KarsaNursa
    |--------------------------------------------------------------------------
    |
    | Persetujuan akun UMKM dan Worker dilakukan melalui Admin KarsaNursa.
    |
    */

    'features' => [
        Features::registration(),
        Features::resetPasswords(),
        Features::updateProfileInformation(),
        Features::updatePasswords(),
    ],

];
