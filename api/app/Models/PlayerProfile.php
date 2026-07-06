<?php

namespace App\Models;

use Database\Factories\PlayerProfileFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlayerProfile extends Model
{
    /** @use HasFactory<PlayerProfileFactory> */
    use HasFactory;

    public const POSITIONS = ['kaleci', 'defans', 'orta_saha', 'forvet'];

    protected $fillable = [
        'positions',
        'foot',
        'level',
        'city_id',
        'district',
        'availability',
        'bio',
        'auto_posts_enabled',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'positions' => 'array',
            'availability' => 'array',
            'level' => 'integer',
            'auto_posts_enabled' => 'boolean',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<City, $this> */
    public function city(): BelongsTo
    {
        return $this->belongsTo(City::class);
    }
}
