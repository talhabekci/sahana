<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * @property string $status
 * @property Carbon|null $decided_at
 */
class ListingApplication extends Model
{
    protected $fillable = [
        'user_id',
        'note',
        'status',
        'decided_by',
        'decided_at',
    ];

    protected static function booted(): void
    {
        static::creating(function (ListingApplication $Application): void {
            $Application->public_id ??= (string) Str::ulid();
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
            'decided_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<PlayerListing, $this> */
    public function listing(): BelongsTo
    {
        return $this->belongsTo(PlayerListing::class, 'listing_id');
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
