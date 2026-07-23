<?php

namespace App\Console\Commands;

use App\Models\FootballMatch;
use App\Models\Post;
use App\Models\Team;
use App\Models\User;
use Illuminate\Console\Command;

class SeedReviewerDemo extends Command
{
    protected $signature = 'demo:seed-reviewer {--email= : Reviewer demo e-postası, boşsa REVIEWER_DEMO_EMAIL kullanılır}';

    protected $description = 'App Store/Play Store reviewer demo hesabına gerçek görünen bir takım, maç ve gönderi ekler';

    public function handle(): int
    {
        $Email = $this->option('email') ?? config('services.reviewer_demo.email');

        if (! is_string($Email) || $Email === '') {
            $this->error('E-posta verilmedi ve REVIEWER_DEMO_EMAIL de boş — --email=... ile geç ya da .env\'i doldur.');

            return self::FAILURE;
        }

        $Reviewer = User::firstOrCreate(
            ['email' => $Email],
            ['name' => 'Sahana Reviewer'],
        );

        $Reviewer->profile()->firstOrCreate([], [
            'positions' => ['orta_saha'],
            'foot' => 'R',
            'level' => 3,
            'city_id' => 34,
            'district' => 'Kadıköy',
        ]);

        $Team = Team::firstOrCreate(
            ['name' => 'Reviewer FK'],
            ['badge_icon' => 'shield', 'color_home' => '#C9F24E', 'created_by' => $Reviewer->id],
        );

        if (! $Team->isMember($Reviewer)) {
            $Team->members()->attach($Reviewer->id, ['role' => 'captain', 'joined_at' => now()]);
        }

        if ($Team->members()->count() < 2) {
            $Teammate = User::factory()->create(['name' => 'Ahmet Yılmaz']);
            $Team->members()->attach($Teammate->id, ['role' => 'member', 'joined_at' => now()]);
        }

        if (FootballMatch::where('team_id', $Team->id)->count() === 0) {
            FootballMatch::factory()->create([
                'team_id' => $Team->id,
                'created_by' => $Reviewer->id,
                'starts_at' => now()->addDays(3)->setTime(21, 0),
            ])->forceFill(['status' => 'confirmed'])->save();
        }

        if (Post::where('user_id', $Reviewer->id)->count() === 0) {
            Post::factory()->create([
                'user_id' => $Reviewer->id,
                'body' => "Sahana'ya hoş geldin! İlk maçımızı Reviewer FK ile organize ettik. 💪",
            ]);
        }

        $this->info("Reviewer demo hazır: {$Email} — takım: Reviewer FK");

        return self::SUCCESS;
    }
}
