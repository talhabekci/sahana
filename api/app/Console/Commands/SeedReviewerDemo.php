<?php

namespace App\Console\Commands;

use App\Models\Comment;
use App\Models\FootballMatch;
use App\Models\Lineup;
use App\Models\Message;
use App\Models\PlayerBadge;
use App\Models\PlayerMatchStat;
use App\Models\PlayerRating;
use App\Models\Post;
use App\Models\Team;
use App\Models\User;
use App\Notifications\FollowedNotification;
use App\Notifications\MatchConfirmedNotification;
use App\Notifications\PostCommentedNotification;
use App\Notifications\PostLikedNotification;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class SeedReviewerDemo extends Command
{
    protected $signature = 'demo:seed-reviewer {--email= : Reviewer demo e-postası, boşsa REVIEWER_DEMO_EMAIL kullanılır}';

    protected $description = 'App Store/Play Store reviewer demo hesabına ekran görüntüsüne uygun gerçekçi bir takım, kadro, sohbet, istatistik ve bildirim ekler';

    /** @var array<string, User> */
    private array $Roster = [];

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
            'positions' => ['forvet'],
            'foot' => 'R',
            'level' => 4,
            'city_id' => 34,
            'district' => 'Kadıköy',
        ]);

        $Team = $this->seedRoster($Reviewer);
        $Match = $this->seedMatchAndLineup($Team, $Reviewer);
        $this->seedStatsAndBadges($Match, $Reviewer);
        $Post = $this->seedPosts($Team, $Reviewer);
        $this->seedChat($Team, $Reviewer);
        $this->seedNotifications($Reviewer, $Match, $Post);

        $this->info("Reviewer demo hazır: {$Email} — takım: {$Team->name}");

        return self::SUCCESS;
    }

    private function seedRoster(User $Reviewer): Team
    {
        // User::factory()/diğer factory'ler fakerphp/faker'a bağımlı; bu
        // komut prod'da `composer install --no-dev` sonrası da çalışabilsin
        // diye burada faker kullanılmıyor, sabit değerler doğrudan model
        // üzerinden yazılıyor.
        $TeammateSeed = [
            'kaleci' => ['name' => 'Ahmet Yılmaz', 'position' => 'kaleci', 'foot' => 'R', 'level' => 3],
            'defans-1' => ['name' => 'Mehmet Demir', 'position' => 'defans', 'foot' => 'R', 'level' => 3],
            'defans-2' => ['name' => 'Emre Şahin', 'position' => 'defans', 'foot' => 'L', 'level' => 4],
            'orta-1' => ['name' => 'Burak Kaya', 'position' => 'orta_saha', 'foot' => 'R', 'level' => 4],
            'orta-2' => ['name' => 'Caner Aydın', 'position' => 'orta_saha', 'foot' => 'B', 'level' => 3],
            'forvet' => ['name' => 'Onur Çelik', 'position' => 'forvet', 'foot' => 'R', 'level' => 5],
        ];

        $this->Roster['reviewer'] = $Reviewer;

        foreach ($TeammateSeed as $Key => $Info) {
            $Slug = str($Info['name'])->slug()->value();
            $Teammate = User::firstOrCreate(
                ['email' => "reviewer-demo-{$Slug}@sahana-app.com"],
                ['name' => $Info['name']],
            );

            $Teammate->profile()->firstOrCreate([], [
                'positions' => [$Info['position']],
                'foot' => $Info['foot'],
                'level' => $Info['level'],
                'city_id' => 34,
                'district' => 'Kadıköy',
            ]);

            $this->Roster[$Key] = $Teammate;
        }

        $Team = Team::firstOrCreate(
            ['name' => 'Reviewer FK'],
            ['badge_icon' => 'shield', 'color_home' => '#C9F24E', 'created_by' => $Reviewer->id],
        );

        foreach ($this->Roster as $Key => $Member) {
            if (! $Team->isMember($Member)) {
                $Team->members()->attach($Member->id, [
                    'role' => $Key === 'reviewer' ? 'captain' : 'member',
                    'joined_at' => now(),
                ]);
            }
        }

        // isMember() yukarıda $Team->members ilişkisini (ilk, olası boş
        // hâliyle) önbelleğe alıyor; attach() bu önbelleği güncellemiyor.
        // seedMatchAndLineup() gerçek/güncel üye listesini kullanabilsin diye
        // ilişki burada zorla tazeleniyor.
        $Team->load('members');

        return $Team;
    }

    private function seedMatchAndLineup(Team $Team, User $Reviewer): FootballMatch
    {
        $Match = FootballMatch::where('team_id', $Team->id)->first();

        if ($Match === null) {
            $Match = FootballMatch::create([
                'team_id' => $Team->id,
                'venue_text' => 'Reviewer Halı Saha',
                'venue_lat' => 41.0082,
                'venue_lng' => 28.9784,
                'starts_at' => now()->addDays(3)->setTime(21, 0),
                'format' => 7,
                'price_per_player' => 150,
                'created_by' => $Reviewer->id,
            ]);
            $Match->forceFill(['status' => 'confirmed'])->save();
        }

        if ($Match->participants()->doesntExist()) {
            // Spec akışı (CreateMatch::handle ile aynı): maç kurulunca takım
            // üyeleri katılımcı olur. MatchController::index() listeyi
            // whereHas('participants', user_id) ile filtrelediği için bu
            // kayıtlar olmadan maç, katılımcı olan hiç kimsenin "Maçlarım"
            // listesinde görünmüyordu — asıl eksik buydu.
            foreach ($Team->members as $Member) {
                $Match->participants()->create([
                    'user_id' => $Member->id,
                    'source' => 'team',
                    // Sohbetteki "sadece Caner izinliymiş" mesajıyla tutarlı.
                    'rsvp' => $Member->id === $this->Roster['orta-2']->id ? 'no' : 'yes',
                    'responded_at' => now(),
                ]);
            }
        }

        if (Lineup::where('match_id', $Match->id)->doesntExist()) {
            $Team->lineups()->create([
                'match_id' => $Match->id,
                'name' => 'İlk 7',
                'formation' => '1-3-2-1',
                'created_by' => $Reviewer->id,
                'positions' => [
                    ['id' => 'gk', 'x' => 0.5, 'y' => 0.92, 'label' => 'KL', 'user_id' => $this->Roster['kaleci']->id, 'guest_name' => null],
                    ['id' => 'def-1', 'x' => 0.25, 'y' => 0.7, 'label' => 'DF', 'user_id' => $this->Roster['defans-1']->id, 'guest_name' => null],
                    ['id' => 'def-2', 'x' => 0.5, 'y' => 0.75, 'label' => 'DF', 'user_id' => $this->Roster['defans-2']->id, 'guest_name' => null],
                    ['id' => 'orta-1', 'x' => 0.25, 'y' => 0.45, 'label' => 'OS', 'user_id' => $this->Roster['orta-1']->id, 'guest_name' => null],
                    ['id' => 'orta-2', 'x' => 0.75, 'y' => 0.45, 'label' => 'OS', 'user_id' => $this->Roster['orta-2']->id, 'guest_name' => null],
                    ['id' => 'fw-1', 'x' => 0.35, 'y' => 0.15, 'label' => 'FV', 'user_id' => $this->Roster['forvet']->id, 'guest_name' => null],
                    ['id' => 'fw-2', 'x' => 0.65, 'y' => 0.15, 'label' => 'FV', 'user_id' => $Reviewer->id, 'guest_name' => null],
                ],
            ]);
        }

        return $Match;
    }

    private function seedStatsAndBadges(FootballMatch $Match, User $Reviewer): void
    {
        if (PlayerMatchStat::where('match_id', $Match->id)->doesntExist()) {
            PlayerMatchStat::create([
                'match_id' => $Match->id,
                'user_id' => $Reviewer->id,
                'goals' => 2,
                'assists' => 1,
                'approved' => true,
                'entered_by' => $Reviewer->id,
            ]);
            PlayerMatchStat::create([
                'match_id' => $Match->id,
                'user_id' => $this->Roster['forvet']->id,
                'goals' => 1,
                'assists' => 0,
                'approved' => true,
                'entered_by' => $Reviewer->id,
            ]);
        }

        if (PlayerRating::where('ratee_id', $Reviewer->id)->doesntExist()) {
            foreach ([$this->Roster['kaleci'], $this->Roster['defans-1'], $this->Roster['orta-1'], $this->Roster['forvet']] as $Index => $Rater) {
                PlayerRating::create([
                    'match_id' => $Match->id,
                    'rater_id' => $Rater->id,
                    'ratee_id' => $Reviewer->id,
                    'score' => [9, 10, 8, 10][$Index],
                ]);
            }
        }

        if (PlayerBadge::where('user_id', $Reviewer->id)->doesntExist()) {
            foreach (['ilk_gol', 'yildiz'] as $BadgeKey) {
                PlayerBadge::create(['user_id' => $Reviewer->id, 'badge_key' => $BadgeKey, 'earned_at' => now()]);
            }
        }
    }

    private function seedPosts(Team $Team, User $Reviewer): Post
    {
        $Existing = Post::where('team_id', $Team->id)->first();

        if ($Existing !== null) {
            return $Existing;
        }

        $Photos = [
            ['file' => 'post-1-gece-halisaha.jpg', 'author' => $Reviewer, 'body' => 'Bu akşamki maçtan kare 🌙 Reviewer FK sahada!'],
            ['file' => 'post-2-takim-toplanma.jpg', 'author' => $this->Roster['kaleci'], 'body' => 'Maç öncesi son taktik toplantısı 💪'],
            ['file' => 'post-3-mac-aksiyonu.jpg', 'author' => $this->Roster['forvet'], 'body' => 'İkinci golün asisti bendendi 😄'],
            ['file' => 'post-4-kaleci.jpg', 'author' => $Reviewer, 'body' => 'Kalecimiz bu hafta da yerini sağlamlaştırdı 🧤'],
        ];

        $FirstPost = null;

        foreach ($Photos as $Photo) {
            $Contents = file_get_contents(base_path("resources/demo-images/{$Photo['file']}"));
            $Path = 'posts/'.pathinfo($Photo['file'], PATHINFO_FILENAME).'-'.$Reviewer->id.'.jpg';
            Storage::disk(config('filesystems.media_disk'))->put($Path, $Contents);

            $Post = Post::create([
                'user_id' => $Photo['author']->id,
                'team_id' => $Team->id,
                'type' => 'text',
                'body' => $Photo['body'],
                'image_path' => $Path,
            ]);

            $FirstPost ??= $Post;
        }

        return $FirstPost;
    }

    private function seedChat(Team $Team, User $Reviewer): void
    {
        if (Message::where('team_id', $Team->id)->exists()) {
            return;
        }

        $TeamMessages = [
            [$this->Roster['kaleci'], 'Bu akşam saat 21:00\'de sahadayız, geç kalmayın 💪'],
            [$Reviewer, 'Ben geldim, kaptan da hazır 👍'],
            [$this->Roster['forvet'], 'Formaları getirdim'],
            [$this->Roster['defans-2'], 'Yağmur yağacakmış, saha kapalı değil mi?'],
            [$Reviewer, 'Kapalı halı saha, sorun yok 🙂'],
        ];

        foreach ($TeamMessages as [$Author, $Body]) {
            Message::create([
                'team_id' => $Team->id,
                'user_id' => $Author->id,
                'type' => 'text',
                'body' => $Body,
            ]);
        }

        $DmMessages = [
            [$this->Roster['kaleci'], 'Kaptan, bu hafta kimler gelemiyor?'],
            [$Reviewer, 'Sadece Caner izinliymiş, gerisi tam'],
        ];

        foreach ($DmMessages as [$Author, $Body]) {
            Message::create([
                'participant_ids' => [$Reviewer->id, $this->Roster['kaleci']->id],
                'user_id' => $Author->id,
                'type' => 'text',
                'body' => $Body,
            ]);
        }
    }

    private function seedNotifications(User $Reviewer, FootballMatch $Match, Post $Post): void
    {
        if ($Reviewer->notifications()->exists()) {
            return;
        }

        $Reviewer->notify(new FollowedNotification($this->Roster['kaleci']));
        $Reviewer->notify(new MatchConfirmedNotification($Match));
        $Reviewer->notify(new PostLikedNotification($Post, $this->Roster['forvet']));

        $Comment = Comment::create([
            'post_id' => $Post->id,
            'user_id' => $this->Roster['kaleci']->id,
            'body' => 'Harika maçtı kaptan! 👏',
        ]);

        $Reviewer->notify(new PostCommentedNotification($Post, $Comment));
    }
}
