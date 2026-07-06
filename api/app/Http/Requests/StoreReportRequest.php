<?php

namespace App\Http\Requests;

use App\Models\Report;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreReportRequest extends FormRequest
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
            'subject_type' => ['required', Rule::in(Report::SUBJECT_TYPES)],
            'subject_id' => ['required', 'string'],
            'reason' => ['required', 'string', 'max:300'],
        ];
    }
}
