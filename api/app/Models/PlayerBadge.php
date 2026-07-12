<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * Kazanılan rozet kaydı (BACKLOG #54) — katalog App\Support\BadgeCatalog'da sabit.
 *
 * @property Carbon $earned_at
 */
class PlayerBadge extends Model
{
    public $timestamps = false;

    protected $fillable = ['user_id', 'badge_key', 'earned_at'];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'earned_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
