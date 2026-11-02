<?php

namespace App\Http\Requests\Worker;

use Illuminate\Foundation\Http\FormRequest;

class StoreTaskApplicationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->role === 'worker'
            && $this->user()->verification_status === 'approved';
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'message' => [
                'nullable',
                'string',
                'max:1000',
            ],
        ];
    }
}
