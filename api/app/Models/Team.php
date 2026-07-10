<?php

namespace App\Models;

use Database\Factories\TeamFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Team extends Model
{
    /** @use HasFactory<TeamFactory> */
    use HasFactory;

    public const BADGE_ICONS = ['shield', 'ball', 'flash', 'star', 'flame', 'wave'];

    protected $fillable = [
        'name',
        'badge_icon',
        'logo_path',
        'color_home',
        'created_by',
    ];

    protected static function booted(): void
    {
        static::creating(function (Team $Team): void {
            $Team->public_id ??= (string) Str::ulid();
        });
    }

    public function getRouteKeyName(): string
    {
        return 'public_id';
    }

    /** @return BelongsToMany<User, $this, TeamMember, 'pivot'> */
    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'team_members')
            ->withPivot(['role', 'jersey_number', 'joined_at'])
            ->using(TeamMember::class);
    }

    public function captain(): ?User
    {
        return $this->members->firstWhere('pivot.role', 'captain');
    }

    public function isMember(User $User): bool
    {
        return $this->members->contains('id', $User->id);
    }

    public function isCaptain(User $User): bool
    {
        return $this->captain()?->id === $User->id;
    }

    /** @return HasMany<TeamInvite, $this> */
    public function invites(): HasMany
    {
        return $this->hasMany(TeamInvite::class);
    }

    /** @return HasMany<Lineup, $this> */
    public function lineups(): HasMany
    {
        return $this->hasMany(Lineup::class);
    }
}
