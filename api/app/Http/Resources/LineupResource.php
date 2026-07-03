<?php

namespace App\Http\Resources;

use App\Models\Lineup;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Lineup
 */
class LineupResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $Request): array
    {
        $MembersById = $this->team->members->keyBy('id');

        return [
            'id' => $this->public_id,
            'name' => $this->name,
            'formation' => $this->formation,
            'positions' => collect($this->positions)->map(function (array $Position) use ($MembersById): array {
                $Member = $Position['user_id'] !== null ? $MembersById->get($Position['user_id']) : null;

                return [
                    'id' => $Position['id'],
                    'x' => $Position['x'],
                    'y' => $Position['y'],
                    'label' => $Position['label'],
                    'user_id' => $Member?->public_id,
                    'user_name' => $Member?->name,
                    'guest_name' => $Position['guest_name'],
                ];
            })->all(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
