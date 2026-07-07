<?php

namespace App\Http\Requests;

use App\Models\Message;
use Illuminate\Foundation\Http\FormRequest;

class StoreMessageRequest extends FormRequest
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
            'type' => ['required', 'string', 'in:'.implode(',', Message::TYPES)],
            'body' => ['required_if:type,text', 'nullable', 'string', 'max:2000'],
            'image_path' => ['required_if:type,image', 'nullable', 'string', 'max:2048'],
            'match_id' => ['required_if:type,match_ref', 'nullable', 'string'],
            'lineup_id' => ['required_if:type,lineup_ref', 'nullable', 'string'],
        ];
    }
}
