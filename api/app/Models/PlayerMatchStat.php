<?php

namespace App\Models;

use Database\Factories\PlayerMatchStatFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class PlayerMatchStat extends Model
{
    /** @use HasFactory<PlayerMatchStatFactory> */
    use HasFactory;

    protected $fillable = [
        'match_id',
        'user_id',
        'goals',
        'assists',
        'approved',
        'entered_by',
    ];

    protected static function booted(): void
    {
        static::creating(function (PlayerMatchStat $Stat): void {
            $Stat->public_id ??= (string) Str::ulid();
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
            'goals' => 'integer',
            'assists' => 'integer',
            'approved' => 'boolean',
        ];
    }

    /** @return BelongsTo<FootballMatch, $this> */
    public function match(): BelongsTo
    {
        return $this->belongsTo(FootballMatch::class, 'match_id');
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<User, $this> */
    public function enteredBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'entered_by');
    }
}
