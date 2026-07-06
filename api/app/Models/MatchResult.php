<?php

namespace App\Models;

use Database\Factories\MatchResultFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MatchResult extends Model
{
    /** @use HasFactory<MatchResultFactory> */
    use HasFactory;

    public const STATUSES = ['pending', 'confirmed', 'disputed'];

    protected $fillable = [
        'match_id',
        'home_score',
        'away_score',
        'entered_by',
        'confirmed_by',
        'status',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'home_score' => 'integer',
            'away_score' => 'integer',
        ];
    }

    /** @return BelongsTo<FootballMatch, $this> */
    public function match(): BelongsTo
    {
        return $this->belongsTo(FootballMatch::class, 'match_id');
    }

    /** @return BelongsTo<User, $this> */
    public function enteredBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'entered_by');
    }

    /** @return BelongsTo<User, $this> */
    public function confirmedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'confirmed_by');
    }
}
