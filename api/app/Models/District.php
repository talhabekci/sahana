<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Statik ilçe seed'i (BACKLOG #51) — city_id = il plaka kodu.
 * `external_id`: sosyalhalisaha.com'un kendi ilçe ID'si (BACKLOG #58,
 * `sosyalhalisaha:sync` komutuyla doldurulur; null = orada kayıtlı değil/eşleşmedi).
 */
class District extends Model
{
    public $timestamps = false;

    protected $fillable = ['city_id', 'name', 'external_id'];

    /** @return BelongsTo<City, $this> */
    public function city(): BelongsTo
    {
        return $this->belongsTo(City::class);
    }

    /** BACKLOG #62: sosyalhalisaha_venues tablosu venues'e taşındı (type=sosyalhalisaha). */
    /** @return HasMany<Venue, $this> */
    public function sosyalhalisahaVenues(): HasMany
    {
        return $this->hasMany(Venue::class)->where('type', 'sosyalhalisaha');
    }
}
