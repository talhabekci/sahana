<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Statik ilçe seed'i (BACKLOG #51) — city_id = il plaka kodu. */
class District extends Model
{
    public $timestamps = false;

    protected $fillable = ['city_id', 'name'];

    /** @return BelongsTo<City, $this> */
    public function city(): BelongsTo
    {
        return $this->belongsTo(City::class);
    }
}
