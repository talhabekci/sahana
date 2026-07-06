<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property string $source
 * @property string|null $rsvp
 * @property Carbon|null $responded_at
 * @property bool|null $attended
 */
class MatchParticipant extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'source',
        'rsvp',
        'responded_at',
        'attended',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'responded_at' => 'datetime',
            'attended' => 'boolean',
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
}
