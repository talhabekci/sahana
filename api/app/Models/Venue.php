<?php

namespace App\Models;

use Database\Factories\VenueFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

/**
 * BACKLOG #62: tekil saha tablosu — `type` kaynağı ayırt eder
 * (`internal`: kendi rehberimiz/kullanıcı yorumları var; `sosyalhalisaha`:
 * sosyalhalisaha.com dizininden isim/ID eşlemesi, `district_id`+
 * `external_id` doludur, lat/lng ve yorumlar yoktur). İleride başka bir
 * kaynak eklenirse yeni bir tablo yerine `type`'a yeni bir değer eklenir.
 *
 * @property list<string>|null $photos
 * @property array<string, mixed>|null $amenities
 */
class Venue extends Model
{
    /** @use HasFactory<VenueFactory> */
    use HasFactory;

    public const STATUSES = ['seeded', 'verified'];

    public const TYPES = ['internal', 'sosyalhalisaha'];

    protected $fillable = [
        'name',
        'type',
        'district_id',
        'external_id',
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
            'external_id' => 'integer',
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

    /** @return BelongsTo<District, $this> */
    public function district(): BelongsTo
    {
        return $this->belongsTo(District::class);
    }

    /** @return HasMany<FootballMatch, $this> */
    public function matches(): HasMany
    {
        return $this->hasMany(FootballMatch::class);
    }
}
