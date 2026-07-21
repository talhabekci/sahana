<?php

use App\Models\FootballMatch;
use App\Models\OpponentListing;
use App\Models\Post;
use App\Models\Team;
use App\Models\User;
use App\Notifications\ApplicationDecisionNotification;
use App\Notifications\FollowedNotification;
use App\Notifications\InviteAcceptedNotification;
use App\Notifications\ListingApplicationNotification;
use App\Notifications\MatchConfirmedNotification;
use App\Notifications\MatchCreatedNotification;
use App\Notifications\MentionedNotification;
use App\Notifications\OpponentFoundNotification;
use App\Notifications\PostCommentedNotification;
use App\Notifications\PostLikedNotification;
use Illuminate\Support\Facades\Notification;

it('notifies team members except the creator when a match is created', function () {
    Notification::fake();

    $Captain = User::factory()->create();
    $Team = Team::factory()->create();
    $Team->members()->attach($Captain->id, ['role' => 'captain', 'joined_at' => now()]);
    $Teammate = User::factory()->create();
    $Team->members()->attach($Teammate->id, ['role' => 'member', 'joined_at' => now()]);

    $this->actingAs($Captain)->postJson('/api/v1/matches', [
        'team_id' => $Team->public_id,
        'venue_text' => 'Fenerbahçe Halı Saha',
        'starts_at' => now()->addDays(2)->toIso8601String(),
        'format' => 7,
    ])->assertCreated();

    Notification::assertSentTo($Teammate, MatchCreatedNotification::class);
    Notification::assertNotSentTo($Captain, MatchCreatedNotification::class);
});

it('notifies team members when a match is confirmed', function () {
    Notification::fake();

    $Captain = User::factory()->create();
    $Team = Team::factory()->create();
    $Team->members()->attach($Captain->id, ['role' => 'captain', 'joined_at' => now()]);
    $Match = FootballMatch::factory()->for($Team)->create();

    $this->actingAs($Captain)->postJson("/api/v1/matches/{$Match->public_id}/confirm")->assertOk();

    Notification::assertSentTo($Captain, MatchConfirmedNotification::class);
});

it('notifies the captain when a player applies to a listing', function () {
    Notification::fake();

    $Captain = User::factory()->create();
    $Team = Team::factory()->create();
    $Team->members()->attach($Captain->id, ['role' => 'captain', 'joined_at' => now()]);
    $Match = FootballMatch::factory()->for($Team)->create(['created_by' => $Captain->id]);
    $Match->forceFill(['status' => 'confirmed'])->save();

    $Listing = $Match->listings()->create([
        'positions_needed' => ['forvet'],
        'needed_count' => 1,
        'level_min' => 1,
        'level_max' => 5,
        'lat' => 41.0,
        'lng' => 29.0,
        'status' => 'open',
        'expires_at' => now()->addDay(),
    ]);

    $Applicant = User::factory()->create();

    $this->actingAs($Applicant)->postJson("/api/v1/listings/{$Listing->public_id}/applications", [])
        ->assertCreated();

    Notification::assertSentTo($Captain, ListingApplicationNotification::class);
});

it('notifies the applicant when their application is decided', function () {
    Notification::fake();

    $Captain = User::factory()->create();
    $Team = Team::factory()->create();
    $Team->members()->attach($Captain->id, ['role' => 'captain', 'joined_at' => now()]);
    $Match = FootballMatch::factory()->for($Team)->create(['created_by' => $Captain->id]);
    $Match->forceFill(['status' => 'confirmed'])->save();

    $Listing = $Match->listings()->create([
        'positions_needed' => ['forvet'],
        'needed_count' => 1,
        'level_min' => 1,
        'level_max' => 5,
        'lat' => 41.0,
        'lng' => 29.0,
        'status' => 'open',
        'expires_at' => now()->addDay(),
    ]);

    $Applicant = User::factory()->create();
    $Application = $Listing->applications()->create(['user_id' => $Applicant->id]);

    $this->actingAs($Captain)->postJson("/api/v1/applications/{$Application->public_id}/approve")
        ->assertOk();

    Notification::assertSentTo($Applicant, ApplicationDecisionNotification::class);
});

it('notifies the captain when an invite is accepted', function () {
    Notification::fake();

    $Captain = User::factory()->create();
    $Team = Team::factory()->create();
    $Team->members()->attach($Captain->id, ['role' => 'captain', 'joined_at' => now()]);

    $InviteResponse = $this->actingAs($Captain)->postJson("/api/v1/teams/{$Team->public_id}/invites")
        ->assertCreated();
    $Code = $InviteResponse->json('data.code');

    $NewMember = User::factory()->create();
    $this->actingAs($NewMember)->postJson("/api/v1/invites/{$Code}/accept")->assertOk();

    Notification::assertSentTo($Captain, InviteAcceptedNotification::class);
});

it('notifies the listing owner captain when an opponent is found', function () {
    Notification::fake();

    $Captain = User::factory()->create();
    $Team = Team::factory()->create();
    $Team->members()->attach($Captain->id, ['role' => 'captain', 'joined_at' => now()]);
    $Match = FootballMatch::factory()->for($Team)->create();

    $Listing = OpponentListing::create([
        'team_id' => $Team->id,
        'match_id' => $Match->id,
        'created_by' => $Captain->id,
    ]);

    $RivalCaptain = User::factory()->create();
    $RivalTeam = Team::factory()->create();
    $RivalTeam->members()->attach($RivalCaptain->id, ['role' => 'captain', 'joined_at' => now()]);

    $this->actingAs($RivalCaptain)->postJson("/api/v1/opponent-listings/{$Listing->public_id}/match", [
        'team_id' => $RivalTeam->public_id,
    ])->assertOk();

    Notification::assertSentTo($Captain, OpponentFoundNotification::class);
});

it('notifies the target when a player is followed', function () {
    Notification::fake();

    $Viewer = User::factory()->create();
    $Target = User::factory()->create();

    $this->actingAs($Viewer)->postJson("/api/v1/players/{$Target->public_id}/follow")->assertOk();

    Notification::assertSentTo($Target, FollowedNotification::class);
});

it('does not re-notify when a player follows the same target again', function () {
    Notification::fake();

    $Viewer = User::factory()->create();
    $Target = User::factory()->create();

    $this->actingAs($Viewer)->postJson("/api/v1/players/{$Target->public_id}/follow")->assertOk();
    $this->actingAs($Viewer)->postJson("/api/v1/players/{$Target->public_id}/follow")->assertOk();

    Notification::assertSentToTimes($Target, FollowedNotification::class, 1);
});

it('notifies the post owner when someone likes their post, but not on self-like', function () {
    Notification::fake();

    $Owner = User::factory()->create();
    $Post = Post::factory()->for($Owner)->create();
    $Liker = User::factory()->create();

    $this->actingAs($Liker)->postJson("/api/v1/posts/{$Post->public_id}/like")->assertOk();

    Notification::assertSentTo($Owner, PostLikedNotification::class);

    $this->actingAs($Owner)->postJson("/api/v1/posts/{$Post->public_id}/like")->assertOk();

    Notification::assertSentToTimes($Owner, PostLikedNotification::class, 1);
});

it('notifies the post owner when someone comments on their post, but not on self-comment', function () {
    Notification::fake();

    $Owner = User::factory()->create();
    $Post = Post::factory()->for($Owner)->create();
    $Commenter = User::factory()->create();

    $this->actingAs($Commenter)->postJson("/api/v1/posts/{$Post->public_id}/comments", [
        'body' => 'Harika maçtı!',
    ])->assertCreated();

    Notification::assertSentTo($Owner, PostCommentedNotification::class);

    $this->actingAs($Owner)->postJson("/api/v1/posts/{$Post->public_id}/comments", [
        'body' => 'Kendi yorumum',
    ])->assertCreated();

    Notification::assertSentToTimes($Owner, PostCommentedNotification::class, 1);
});

it('notifies mentioned users on a post, excluding self-mentions', function () {
    Notification::fake();

    $Author = User::factory()->create();
    $Mentioned = User::factory()->create();

    $this->actingAs($Author)->postJson('/api/v1/posts', [
        'body' => '@'.$Mentioned->name.' harika bir asist yaptı!',
        'mentioned_user_ids' => [$Mentioned->public_id, $Author->public_id],
    ])->assertCreated();

    Notification::assertSentTo($Mentioned, MentionedNotification::class);
    Notification::assertNotSentTo($Author, MentionedNotification::class);
});

it('notifies mentioned users on a comment, excluding the post owner (already notified) and self', function () {
    Notification::fake();

    $Owner = User::factory()->create();
    $Post = Post::factory()->for($Owner)->create();
    $Commenter = User::factory()->create();
    $Mentioned = User::factory()->create();

    $this->actingAs($Commenter)->postJson("/api/v1/posts/{$Post->public_id}/comments", [
        'body' => '@'.$Mentioned->name.' bak bu yorumu',
        'mentioned_user_ids' => [$Mentioned->public_id, $Commenter->public_id, $Owner->public_id],
    ])->assertCreated();

    Notification::assertSentTo($Mentioned, MentionedNotification::class);
    Notification::assertNotSentTo($Commenter, MentionedNotification::class);
    Notification::assertNotSentTo($Owner, MentionedNotification::class);
    Notification::assertSentTo($Owner, PostCommentedNotification::class);
});

it('rejects a mention referencing a non-existent user', function () {
    $Author = User::factory()->create();

    $this->actingAs($Author)->postJson('/api/v1/posts', [
        'body' => 'Merhaba',
        'mentioned_user_ids' => ['not-a-real-public-id'],
    ])->assertStatus(422);
});
