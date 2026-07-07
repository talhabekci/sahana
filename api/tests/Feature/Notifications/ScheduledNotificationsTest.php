<?php

use App\Models\Comment;
use App\Models\Follow;
use App\Models\FootballMatch;
use App\Models\Like;
use App\Models\Post;
use App\Models\Team;
use App\Models\User;
use App\Notifications\MatchReminderNotification;
use App\Notifications\RsvpReminderNotification;
use App\Notifications\SocialSummaryNotification;
use Illuminate\Support\Facades\Notification;

it('reminds participants who have not responded 24h before a match', function () {
    Notification::fake();

    $Team = Team::factory()->create();
    $Match = FootballMatch::factory()->for($Team)->create(['starts_at' => now()->addHours(23)->addMinutes(30)]);

    $Responded = User::factory()->create();
    $Match->participants()->create(['user_id' => $Responded->id, 'source' => 'team', 'rsvp' => 'yes']);

    $NotResponded = User::factory()->create();
    $Match->participants()->create(['user_id' => $NotResponded->id, 'source' => 'team']);

    $this->artisan('notifications:rsvp-reminders')->assertSuccessful();

    Notification::assertSentTo($NotResponded, RsvpReminderNotification::class);
    Notification::assertNotSentTo($Responded, RsvpReminderNotification::class);
});

it('does not remind for a match outside the 24h window', function () {
    Notification::fake();

    $Team = Team::factory()->create();
    $Match = FootballMatch::factory()->for($Team)->create(['starts_at' => now()->addHours(10)]);
    $Player = User::factory()->create();
    $Match->participants()->create(['user_id' => $Player->id, 'source' => 'team']);

    $this->artisan('notifications:rsvp-reminders')->assertSuccessful();

    Notification::assertNotSentTo($Player, RsvpReminderNotification::class);
});

it('reminds rsvp=yes participants 3 hours before a confirmed match', function () {
    Notification::fake();

    $Team = Team::factory()->create();
    $Match = FootballMatch::factory()->for($Team)->create(['starts_at' => now()->addHours(2)->addMinutes(30)]);
    $Match->forceFill(['status' => 'confirmed'])->save();

    $Coming = User::factory()->create();
    $Match->participants()->create(['user_id' => $Coming->id, 'source' => 'team', 'rsvp' => 'yes']);

    $NotComing = User::factory()->create();
    $Match->participants()->create(['user_id' => $NotComing->id, 'source' => 'team', 'rsvp' => 'no']);

    $this->artisan('notifications:match-reminders')->assertSuccessful();

    Notification::assertSentTo($Coming, MatchReminderNotification::class);
    Notification::assertNotSentTo($NotComing, MatchReminderNotification::class);
});

it('sends a social summary once likes/comments/follows have accumulated', function () {
    Notification::fake();

    $Owner = User::factory()->create();
    $Owner->profile()->create(['positions' => ['kaleci'], 'level' => 3, 'city_id' => 34]);
    $Post = Post::factory()->for($Owner, 'user')->create();

    $Liker = User::factory()->create();
    Like::create(['post_id' => $Post->id, 'user_id' => $Liker->id]);

    $Commenter = User::factory()->create();
    Comment::factory()->for($Post)->for($Commenter, 'user')->create();

    $NewFollower = User::factory()->create();
    Follow::create(['follower_id' => $NewFollower->id, 'followed_id' => $Owner->id]);

    $this->artisan('notifications:social-summary')->assertSuccessful();

    Notification::assertSentTo($Owner, SocialSummaryNotification::class);
    expect($Owner->profile->fresh()->last_social_summary_at)->not->toBeNull();
});

it('skips users with no social activity since the last summary', function () {
    Notification::fake();

    $User = User::factory()->create();
    $User->profile()->create(['positions' => ['kaleci'], 'level' => 3, 'city_id' => 34]);

    $this->artisan('notifications:social-summary')->assertSuccessful();

    Notification::assertNotSentTo($User, SocialSummaryNotification::class);
});
