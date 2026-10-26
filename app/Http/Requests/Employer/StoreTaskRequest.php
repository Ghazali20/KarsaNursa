<?php

namespace App\Http\Requests\Employer;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'employer'
            && $this->user()->business()->exists();
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => [
                'required',
                'string',
                'max:150',
            ],

            'category' => [
                'required',
                'string',
                Rule::in([
                    'kuliner',
                    'retail',
                    'produksi',
                    'administrasi',
                    'event',
                    'logistik',
                    'lainnya',
                ]),
            ],

            'description' => [
                'required',
                'string',
                'min:20',
                'max:5000',
            ],

            'requirements' => [
                'nullable',
                'string',
                'max:3000',
            ],

            'instructions' => [
                'nullable',
                'string',
                'max:3000',
            ],

            'location_address' => [
                'required',
                'string',
                'max:1000',
            ],

            'latitude' => [
                'required',
                'numeric',
                'between:-90,90',
            ],

            'longitude' => [
                'required',
                'numeric',
                'between:-180,180',
            ],

            'attendance_radius_meters' => [
                'required',
                'integer',
                'min:50',
                'max:5000',
            ],

            'application_deadline' => [
                'required',
                'date',
                'after:now',
                'before:starts_at',
            ],

            'starts_at' => [
                'required',
                'date',
                'after:now',
            ],

            'ends_at' => [
                'required',
                'date',
                'after:starts_at',
            ],

            'worker_quota' => [
                'required',
                'integer',
                'min:1',
                'max:100',
            ],

            'wage_amount' => [
                'required',
                'integer',
                'min:1000',
                'max:100000000',
            ],

            'action' => [
                'required',
                Rule::in([
                    'draft',
                    'publish',
                ]),
            ],
        ];
    }

    public function attributes(): array
    {
        return [
            'title' => 'judul tugas',
            'category' => 'kategori',
            'description' => 'deskripsi',
            'requirements' => 'persyaratan',
            'instructions' => 'instruksi',
            'location_address' => 'alamat',
            'latitude' => 'latitude',
            'longitude' => 'longitude',
            'attendance_radius_meters' => 'radius presensi',
            'application_deadline' => 'batas waktu lamaran',
            'starts_at' => 'waktu mulai',
            'ends_at' => 'waktu selesai',
            'worker_quota' => 'jumlah pekerja',
            'wage_amount' => 'upah',
            'action' => 'aksi publikasi',
        ];
    }
}