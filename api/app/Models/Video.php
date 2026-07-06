<?php

namespace App\Models;

use Database\Factories\VideoFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class Video extends Model
{
    /** @use HasFactory<VideoFactory> */
    use HasFactory;

    public const TYPES = ['external_link', 'uploaded'];

    public const PROVIDERS = ['youtube', 'sosyalhalisaha', 'other'];

    protected $fillable = [
        'match_id',
        'user_id',
        'type',
        'provider',
        'url',
        'storage_path',
        'title',
        'thumbnail_url',
        'fetched_at',
    ];

    protected static function booted(): void
    {
        static::creating(function (Video $Video): void {
            $Video->public_id ??= (string) Str::ulid();
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
            'fetched_at' => 'datetime',
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
