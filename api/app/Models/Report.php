<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Report extends Model
{
    public const SUBJECT_TYPES = ['post', 'comment', 'user'];

    protected $fillable = ['reporter_id', 'subject_type', 'subject_id', 'reason', 'status'];

    /** @return BelongsTo<User, $this> */
    public function reporter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reporter_id');
    }
}
