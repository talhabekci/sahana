<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

/**
 * @property array<int, array{id: string, x: float, y: float, label: string|null, user_id: int|null, guest_name: string|null}> $positions
 */
class Lineup extends Model
{
    protected $fillable = [
        'name',
        'formation',
        'positions',
        'match_id',
        'created_by',
    ];

    protected static function booted(): void
    {
        static::creating(function (Lineup $Lineup): void {
            $Lineup->public_id ??= (string) Str::ulid();
        });
    }

    public function getRouteKeyName(): string
    {
        return 'public_id';
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'positions' => 'array',
        ];
    }

    /** @return BelongsTo<Team, $this> */
    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }
}
