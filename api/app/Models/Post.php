<?php

namespace App\Models;

use Database\Factories\PostFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Post extends Model
{
    /** @use HasFactory<PostFactory> */
    use HasFactory;

    public const TYPES = ['text', 'match_played', 'lineup_shared', 'video_shared'];

    protected $fillable = [
        'user_id',
        'team_id',
        'type',
        'body',
        'match_id',
        'lineup_id',
        'video_id',
    ];

    protected static function booted(): void
    {
        static::creating(function (Post $Post): void {
            $Post->public_id ??= (string) Str::ulid();
        });
    }

    public function getRouteKeyName(): string
    {
        return 'public_id';
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<Team, $this> */
    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    /** @return BelongsTo<FootballMatch, $this> */
    public function match(): BelongsTo
    {
        return $this->belongsTo(FootballMatch::class, 'match_id');
    }

    /** @return BelongsTo<Lineup, $this> */
    public function lineup(): BelongsTo
    {
        return $this->belongsTo(Lineup::class);
    }

    /** @return BelongsTo<Video, $this> */
    public function video(): BelongsTo
    {
        return $this->belongsTo(Video::class);
    }

    /** @return HasMany<Like, $this> */
    public function likes(): HasMany
    {
        return $this->hasMany(Like::class);
    }

    /** @return HasMany<Comment, $this> */
    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }
}
