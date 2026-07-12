<?php

namespace App\Models;

use Database\Factories\FootballMatchFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * Sınıf adı FootballMatch — `match` PHP 8'de ayrılmış sözcük olduğu için
 * model bu adla, tablo spec'teki gibi `matches`.
 *
 * @property Carbon $starts_at
 */
class FootballMatch extends Model
{
    /** @use HasFactory<FootballMatchFactory> */
    use HasFactory;

    public const STATUSES = ['draft', 'confirmed', 'played', 'cancelled'];

    protected $table = 'matches';

    protected $fillable = [
        'team_id',
        'opponent_team_id',
        'venue_id',
        'sosyalhalisaha_venue_id',
        'venue_text',
        'venue_lat',
        'venue_lng',
        'starts_at',
        'format',
        'price_per_player',
        'created_by',
    ];

    protected static function booted(): void
    {
        static::creating(function (FootballMatch $Match): void {
            $Match->public_id ??= (string) Str::ulid();
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
            'starts_at' => 'datetime',
            'venue_lat' => 'float',
            'venue_lng' => 'float',
            'format' => 'integer',
            'price_per_player' => 'integer',
        ];
    }

    /** @return BelongsTo<Team, $this> */
    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    /** @return BelongsTo<Venue, $this> */
    public function venue(): BelongsTo
    {
        return $this->belongsTo(Venue::class);
    }

    /** @return BelongsTo<SosyalhalisahaVenue, $this> */
    public function sosyalhalisahaVenue(): BelongsTo
    {
        return $this->belongsTo(SosyalhalisahaVenue::class);
    }

    /** @return BelongsTo<Team, $this> */
    public function opponentTeam(): BelongsTo
    {
        return $this->belongsTo(Team::class, 'opponent_team_id');
    }

    /** @return HasMany<MatchParticipant, $this> */
    public function participants(): HasMany
    {
        return $this->hasMany(MatchParticipant::class, 'match_id');
    }

    /** @return HasMany<PlayerListing, $this> */
    public function listings(): HasMany
    {
        return $this->hasMany(PlayerListing::class, 'match_id');
    }

    /** @return HasMany<Video, $this> */
    public function videos(): HasMany
    {
        return $this->hasMany(Video::class, 'match_id');
    }

    /** @return HasOne<MatchResult, $this> */
    public function result(): HasOne
    {
        return $this->hasOne(MatchResult::class, 'match_id');
    }

    /** @return HasMany<PlayerMatchStat, $this> */
    public function playerStats(): HasMany
    {
        return $this->hasMany(PlayerMatchStat::class, 'match_id');
    }

    /** @return HasMany<PlayerRating, $this> */
    public function ratings(): HasMany
    {
        return $this->hasMany(PlayerRating::class, 'match_id');
    }

    /** @return BelongsTo<User, $this> */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function isCaptain(User $User): bool
    {
        return $this->team->isCaptain($User);
    }

    public function participantFor(User $User): ?MatchParticipant
    {
        return $this->participants->firstWhere('user_id', $User->id);
    }
}
