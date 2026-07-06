<?php

namespace App\Actions\Social;

use App\Models\Block;
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

        return Post::query()
            ->where(function ($Query) use ($TeamIds, $FollowingIds): void {
                $Query->whereIn('team_id', $TeamIds)
                    ->orWhereIn('user_id', $FollowingIds);
            })
            ->whereNotIn('user_id', $BlockedUserIds)
            ->with(['user.profile', 'team', 'match.team', 'match.opponentTeam', 'lineup'])
            ->withCount(['likes', 'comments'])
            ->latest('id')
            ->cursorPaginate($PerPage, ['*'], 'cursor', $Cursor);
    }

    /** @return Collection<int, int> */
    private function blockedEitherWay(User $Viewer): Collection
    {
        return Block::where('user_id', $Viewer->id)->pluck('blocked_user_id')
            ->merge(Block::where('blocked_user_id', $Viewer->id)->pluck('user_id'))
            ->unique();
    }
}
