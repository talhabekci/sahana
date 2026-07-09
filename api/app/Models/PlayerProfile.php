<?php

namespace App\Models;

use Database\Factories\PlayerProfileFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property array<string, bool>|null $notification_preferences
 */
class PlayerProfile extends Model
{
    /** @use HasFactory<PlayerProfileFactory> */
    use HasFactory;

    public const POSITIONS = ['kaleci', 'defans', 'orta_saha', 'forvet'];

    /** Modül 7: bildirim tercih ekranındaki kategoriler — hepsi varsayılan açık. */
    public const NOTIFICATION_CATEGORIES = [
        'match_created',
        'match_confirmed',
        'rsvp_reminder',
        'match_reminder',
        'listing_application',
        'application_decision',
        'invite_accepted',
        'opponent_found',
        'social_summary',
        'chat_message',
    ];

    protected $fillable = [
        'positions',
        'foot',
        'level',
        'city_id',
        'district',
        'availability',
        'bio',
        'auto_posts_enabled',
        'quiet_hours_enabled',
        'notification_preferences',
        'last_social_summary_at',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'positions' => 'array',
            'availability' => 'array',
            'level' => 'integer',
            'auto_posts_enabled' => 'boolean',
            'quiet_hours_enabled' => 'boolean',
            'notification_preferences' => 'array',
            'last_social_summary_at' => 'datetime',
        ];
    }

    /** notification_preferences'ta kayıt yoksa (null/eksik anahtar) kategori açık sayılır. */
    public function wantsNotification(string $Category): bool
    {
        return (bool) ($this->notification_preferences[$Category] ?? true);
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
