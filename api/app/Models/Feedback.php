<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Feedback extends Model
{
    public const TYPES = ['bug', 'suggestion'];

    protected $table = 'feedback';

    protected $fillable = ['user_id', 'type', 'message', 'image_path'];

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
