<?php

namespace App\Models;

use Illuminate\Support\Carbon;
use MongoDB\Laravel\Eloquent\Model;

/**
 * Sohbet mesajı — MongoDB'de (`sahana_chat` DB), MySQL'e FK yok (spec:
 * 07-notifications-chat.md, karar #2). Takım sohbetinde `team_id` dolu,
 * DM'de `participant_ids` dolu — ikisi birden değil. `_id` (ObjectId)
 * doğrudan public ID olarak kullanılır.
 *
 * @property string $id
 * @property int|null $team_id
 * @property array<int, int>|null $participant_ids
 * @property int $user_id
 * @property string $type
 * @property string|null $body
 * @property string|null $image_path
 * @property string|null $audio_path
 * @property int|null $audio_duration
 * @property string|null $match_id
 * @property string|null $lineup_id
 * @property Carbon $created_at
 */
class Message extends Model
{
    public const TYPES = ['text', 'image', 'audio', 'match_ref', 'lineup_ref'];

    protected $connection = 'mongodb';

    protected string $collection = 'messages';

    protected $fillable = [
        'team_id',
        'participant_ids',
        'user_id',
        'type',
        'body',
        'image_path',
        'audio_path',
        'audio_duration',
        'match_id',
        'lineup_id',
    ];
}
