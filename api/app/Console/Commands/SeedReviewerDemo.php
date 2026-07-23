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
            // User::factory()/diğer factory'ler fakerphp/faker'a bağımlı;
            // bu komut prod'da `composer install --no-dev` sonrası da
            // çalışabilsin diye burada faker kullanılmıyor, sabit değerler
            // doğrudan model üzerinden yazılıyor.
            $Teammate = User::firstOrCreate(
                ['email' => 'reviewer-demo-teammate@sahana-app.com'],
                ['name' => 'Ahmet Yılmaz'],
            );
            $Team->members()->attach($Teammate->id, ['role' => 'member', 'joined_at' => now()]);
        }

        if (FootballMatch::where('team_id', $Team->id)->count() === 0) {
            FootballMatch::create([
                'team_id' => $Team->id,
                'venue_text' => 'Reviewer Halı Saha',
                'venue_lat' => 41.0082,
                'venue_lng' => 28.9784,
                'starts_at' => now()->addDays(3)->setTime(21, 0),
                'format' => 7,
                'price_per_player' => 150,
                'created_by' => $Reviewer->id,
            ])->forceFill(['status' => 'confirmed'])->save();
        }

        if (Post::where('user_id', $Reviewer->id)->count() === 0) {
            Post::create([
                'user_id' => $Reviewer->id,
                'type' => 'text',
                'body' => "Sahana'ya hoş geldin! İlk maçımızı Reviewer FK ile organize ettik. 💪",
            ]);
        }

        $this->info("Reviewer demo hazır: {$Email} — takım: Reviewer FK");

        return self::SUCCESS;
    }
}
