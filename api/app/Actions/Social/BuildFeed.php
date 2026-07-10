<?php

namespace App\Actions\Social;

use App\Models\Block;
use App\Models\ListingApplication;
use App\Models\Post;
use App\Models\User;
use Illuminate\Pagination\CursorPaginator;
use Illuminate\Support\Collection;

class BuildFeed
{
    /**
     * Spec: "takip ettiklerim + takımlarımın aktiviteleri", engellenenler hariç.
     *
     * @return CursorPaginator<int, Post>
     */
    public function handle(User $Viewer, ?string $Cursor, int $PerPage = 20): CursorPaginator
    {
        $TeamIds = $Viewer->teams()->pluck('teams.id');
        $FollowingIds = $Viewer->following()->pluck('users.id');
        $BlockedUserIds = $this->blockedEitherWay($Viewer);

        $Paginator = Post::query()
            ->where(function ($Query) use ($TeamIds, $FollowingIds): void {
                $Query->whereIn('team_id', $TeamIds)
                    ->orWhereIn('user_id', $FollowingIds);
            })
            ->whereNotIn('user_id', $BlockedUserIds)
            ->with([
                'user.profile', 'team', 'match.team', 'match.opponentTeam', 'lineup.team.members', 'video',
                'playerListing.match.team', 'opponentListing.team',
            ])
            ->withCount(['likes', 'comments'])
            ->latest('id')
            ->cursorPaginate($PerPage, ['*'], 'cursor', $Cursor);

        // "applications" ilişkisini burada yüklemiyoruz (payload/sorgu ağırlığı) —
        // sadece görüntüleyenin kendi başvuru durumu, tek bir batch sorguyla.
        $this->applyMyApplicationStatus($Paginator->getCollection(), $Viewer);

        return $Paginator;
    }

    /** @param  Collection<int, Post>  $Posts */
    private function applyMyApplicationStatus(Collection $Posts, User $Viewer): void
    {
        $ListingIds = $Posts->pluck('playerListing.id')->filter()->unique();

        if ($ListingIds->isEmpty()) {
            return;
        }

        $MyStatuses = ListingApplication::whereIn('listing_id', $ListingIds)
            ->where('user_id', $Viewer->id)
            ->pluck('status', 'listing_id');

        foreach ($Posts as $Post) {
            $Post->playerListing?->setAttribute(
                'my_application_status',
                $MyStatuses[$Post->playerListing->id] ?? null,
            );
        }
    }

    /** @return Collection<int, int> */
    private function blockedEitherWay(User $Viewer): Collection
    {
        return Block::where('user_id', $Viewer->id)->pluck('blocked_user_id')
            ->merge(Block::where('blocked_user_id', $Viewer->id)->pluck('user_id'))
            ->unique();
    }
}
