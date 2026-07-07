<?php

namespace App\Models;

use Illuminate\Support\Carbon;
use MongoDB\Laravel\Eloquent\Model;

/**
 * Takım sohbeti mesajı — MongoDB'de (`sahana_chat` DB), MySQL'e FK yok
 * (spec: 07-notifications-chat.md, karar #2). `_id` (ObjectId) doğrudan
 * public ID olarak kullanılır.
 *
 * @property string $id
 * @property int $team_id
 * @property int $user_id
 * @property string $type
 * @property string|null $body
 * @property string|null $image_path
 * @property string|null $match_id
 * @property string|null $lineup_id
 * @property Carbon $created_at
 */
class Message extends Model
{
    public const TYPES = ['text', 'image', 'match_ref', 'lineup_ref'];

    protected $connection = 'mongodb';

    protected string $collection = 'messages';

    protected $fillable = [
        'team_id',
        'user_id',
        'type',
        'body',
        'image_path',
        'match_id',
        'lineup_id',
    ];
}
