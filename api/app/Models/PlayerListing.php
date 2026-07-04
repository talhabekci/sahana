<?php

namespace App\Models;

use Database\Factories\PlayerListingFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * @property list<string> $positions_needed
 * @property Carbon $expires_at
 */
class PlayerListing extends Model
{
    /** @use HasFactory<PlayerListingFactory> */
    use HasFactory;

    protected $fillable = [
        'positions_needed',
        'needed_count',
        'level_min',
        'level_max',
        'lat',
        'lng',
        'status',
        'expires_at',
    ];

    protected static function booted(): void
    {
        static::creating(function (PlayerListing $Listing): void {
            $Listing->public_id ??= (string) Str::ulid();
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
            'positions_needed' => 'array',
            'needed_count' => 'integer',
            'level_min' => 'integer',
            'level_max' => 'integer',
            'lat' => 'float',
            'lng' => 'float',
            'expires_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<FootballMatch, $this> */
    public function match(): BelongsTo
    {
        return $this->belongsTo(FootballMatch::class, 'match_id');
    }

    /** @return HasMany<ListingApplication, $this> */
    public function applications(): HasMany
    {
        return $this->hasMany(ListingApplication::class, 'listing_id');
    }

    public function isOpen(): bool
    {
        return $this->status === 'open' && ! $this->expires_at->isPast();
    }
}
