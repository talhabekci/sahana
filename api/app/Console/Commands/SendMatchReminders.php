<?php

namespace App\Console\Commands;

use App\Models\FootballMatch;
use App\Notifications\MatchReminderNotification;
use Illuminate\Console\Command;

class SendMatchReminders extends Command
{
    protected $signature = 'notifications:match-reminders';

    protected $description = 'Maça 3 saat kala RSVP=yes diyenlere hatırlatma gönderir';

    public function handle(): int
    {
        $Matches = FootballMatch::where('status', 'confirmed')
            ->whereBetween('starts_at', [now()->addHours(2), now()->addHours(3)])
            ->with('participants.user')
            ->get();

        $Count = 0;

        foreach ($Matches as $Match) {
            foreach ($Match->participants as $Participant) {
                if ($Participant->rsvp !== 'yes') {
                    continue;
                }

                $Participant->user->notify(new MatchReminderNotification($Match));
                $Count++;
            }
        }

        $this->info("{$Count} maç hatırlatması gönderildi.");

        return self::SUCCESS;
    }
}
