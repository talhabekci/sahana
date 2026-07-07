<?php

namespace App\Console\Commands;

use App\Models\FootballMatch;
use App\Notifications\RsvpReminderNotification;
use Illuminate\Console\Command;

class SendRsvpReminders extends Command
{
    protected $signature = 'notifications:rsvp-reminders';

    protected $description = 'Maça 24 saat kala RSVP vermemiş katılımcılara hatırlatma gönderir';

    public function handle(): int
    {
        $Matches = FootballMatch::whereIn('status', ['draft', 'confirmed'])
            ->whereBetween('starts_at', [now()->addHours(23), now()->addHours(24)])
            ->with('participants.user')
            ->get();

        $Count = 0;

        foreach ($Matches as $Match) {
            foreach ($Match->participants as $Participant) {
                if ($Participant->rsvp !== null) {
                    continue;
                }

                $Participant->user->notify(new RsvpReminderNotification($Match));
                $Count++;
            }
        }

        $this->info("{$Count} RSVP hatırlatması gönderildi.");

        return self::SUCCESS;
    }
}
