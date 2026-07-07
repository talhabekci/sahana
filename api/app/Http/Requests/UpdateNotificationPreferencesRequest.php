<?php

namespace App\Http\Requests;

use App\Models\PlayerProfile;
use Illuminate\Foundation\Http\FormRequest;

class UpdateNotificationPreferencesRequest extends FormRequest
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
            'quiet_hours_enabled' => ['sometimes', 'boolean'],
            'categories' => ['sometimes', 'array:'.implode(',', PlayerProfile::NOTIFICATION_CATEGORIES)],
            'categories.*' => ['boolean'],
        ];
    }
}
