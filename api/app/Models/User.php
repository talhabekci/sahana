<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\Pivot;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Str;
use Laravel\Sanctum\HasApiTokens;

/**
 * @property-read TeamMember|null $pivot Sadece Team->members() ilişkisi üzerinden gelen kullanıcılarda dolu.
 */
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'phone',
        'avatar_path',
    ];

    /**
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected static function booted(): void
    {
        static::creating(function (User $User): void {
            $User->public_id ??= (string) Str::ulid();
        });
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /** @return HasOne<PlayerProfile, $this> */
    public function profile(): HasOne
    {
        return $this->hasOne(PlayerProfile::class);
    }

    /** @return BelongsToMany<Team, $this, TeamMember, 'pivot'> */
    public function teams(): BelongsToMany
    {
        return $this->belongsToMany(Team::class, 'team_members')
            ->withPivot(['role', 'jersey_number', 'joined_at'])
            ->using(TeamMember::class);
    }

    /** @return HasMany<Post, $this> */
    public function posts(): HasMany
    {
        return $this->hasMany(Post::class);
    }

    /**
     * Beni takip edenler.
     *
     * @return BelongsToMany<User, $this, Pivot, 'pivot'>
     */
    public function followers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'follows', 'followed_id', 'follower_id');
    }

    /**
     * Takip ettiklerim.
     *
     * @return BelongsToMany<User, $this, Pivot, 'pivot'>
     */
    public function following(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'follows', 'follower_id', 'followed_id');
    }

    public function isFollowing(User $Other): bool
    {
        return Follow::where('follower_id', $this->id)->where('followed_id', $Other->id)->exists();
    }

    public function hasBlocked(User $Other): bool
    {
        return Block::where('user_id', $this->id)->where('blocked_user_id', $Other->id)->exists();
    }

    /** Ben mi engelledim, o mu — herhangi bir yönde engel var mı. */
    public function isBlockedWith(User $Other): bool
    {
        return Block::where(function ($Query) use ($Other): void {
            $Query->where('user_id', $this->id)->where('blocked_user_id', $Other->id);
        })->orWhere(function ($Query) use ($Other): void {
            $Query->where('user_id', $Other->id)->where('blocked_user_id', $this->id);
        })->exists();
    }
}
