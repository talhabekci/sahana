<?php

namespace App\Models;

use Database\Factories\VenueFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

/**
 * @property list<string>|null $photos
 * @property array<string, mixed>|null $amenities
 */
class Venue extends Model
{
    /** @use HasFactory<VenueFactory> */
    use HasFactory;

    public const STATUSES = ['seeded', 'verified'];

    protected $fillable = [
        'name',
        'lat',
        'lng',
        'address',
        'photos',
        'price_min',
        'price_max',
        'amenities',
        'status',
    ];

    protected static function booted(): void
    {
        static::creating(function (Venue $Venue): void {
            $Venue->public_id ??= (string) Str::ulid();
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
            'lat' => 'float',
            'lng' => 'float',
            'photos' => 'array',
            'price_min' => 'integer',
            'price_max' => 'integer',
            'amenities' => 'array',
        ];
    }

    /** @return HasMany<VenueReview, $this> */
    public function reviews(): HasMany
    {
        return $this->hasMany(VenueReview::class);
    }

    /** @return HasMany<FootballMatch, $this> */
    public function matches(): HasMany
    {
        return $this->hasMany(FootballMatch::class);
    }
}
