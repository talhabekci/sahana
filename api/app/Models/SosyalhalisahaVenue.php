<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * sosyalhalisaha.com saha dizini (BACKLOG #58) — sadece isim/ID eşlemesi,
 * `sosyalhalisaha:sync` komutuyla doldurulur. Video içeriği barındırmaz.
 */
class SosyalhalisahaVenue extends Model
{
    public $timestamps = false;

    protected $fillable = ['district_id', 'external_id', 'name'];

    /** @return BelongsTo<District, $this> */
    public function district(): BelongsTo
    {
        return $this->belongsTo(District::class);
    }
}
