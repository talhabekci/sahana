<?php

namespace App\Actions\Match;

use App\Exceptions\ApiError;
use App\Models\ListingApplication;
use App\Models\User;
use App\Notifications\ApplicationDecisionNotification;
use Illuminate\Support\Facades\DB;

class DecideApplication
{
    public function handle(ListingApplication $Application, User $Captain, bool $Approve): ListingApplication
    {
        if ($Application->status !== 'pending') {
            throw new ApiError('Bu başvuru zaten sonuçlanmış.', 'application_already_decided');
        }

        $Listing = $Application->listing;

        if ($Approve && $Listing->status === 'filled') {
            throw new ApiError('İlan dolmuş.', 'listing_already_filled');
        }

        DB::transaction(function () use ($Application, $Captain, $Approve, $Listing): void {
            $Application->forceFill([
                'status' => $Approve ? 'approved' : 'rejected',
                'decided_by' => $Captain->id,
                'decided_at' => now(),
            ])->save();

            if (! $Approve) {
                return;
            }

            // Spec: onaylanan oyuncu maça eklenir, sayaç düşer, dolunca filled.
            $Listing->match->participants()->create([
                'user_id' => $Application->user_id,
                'source' => 'listing',
                'rsvp' => 'yes',
                'responded_at' => now(),
            ]);

            $Remaining = $Listing->needed_count - 1;

            $Listing->forceFill([
                'needed_count' => max(0, $Remaining),
                'status' => $Remaining <= 0 ? 'filled' : 'open',
            ])->save();
        });

        $Application = $Application->fresh(['user']);
        $Application->user->notify(new ApplicationDecisionNotification($Application));

        return $Application;
    }
}
