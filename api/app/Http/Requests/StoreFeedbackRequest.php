<?php

namespace App\Http\Requests;

use App\Models\Feedback;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreFeedbackRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'type' => ['required', Rule::in(Feedback::TYPES)],
            'message' => ['required', 'string', 'max:2000'],
            // ImageUploader::store() gerçek görsel içeriğini ayrıca doğrulayıp
            // EXIF/GPS metadata'sını temizleyerek yeniden JPEG'e encode ediyor.
            'image' => ['sometimes', 'nullable', 'file', 'mimes:jpg,jpeg,png,webp,heic', 'max:10240'],
        ];
    }
}
