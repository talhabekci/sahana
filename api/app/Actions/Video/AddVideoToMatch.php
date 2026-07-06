<?php

namespace App\Actions\Video;

use App\Actions\Social\CreateVideoSharedPost;
use App\Jobs\FetchVideoMetadata;
use App\Models\FootballMatch;
use App\Models\User;
use App\Models\Video;
use App\Support\VideoProviderDetector;

class AddVideoToMatch
{
    public function __construct(private readonly CreateVideoSharedPost $CreateSharedPost) {}

    public function handle(FootballMatch $Match, User $Uploader, string $Url): Video
    {
        $Video = Video::create([
            'match_id' => $Match->id,
            'user_id' => $Uploader->id,
            'type' => 'external_link',
            'provider' => VideoProviderDetector::detect($Url),
            'url' => $Url,
        ]);

        FetchVideoMetadata::dispatch($Video);

        // Sync kuyruğunda job, bu $Video'nun serileştirilmiş ayrı bir kopyası
        // üzerinde çalışıp DB'yi günceller; bellekteki nesneyi yansıtmak için
        // yeniden okunur (gerçek kuyrukta iş henüz bitmediğinden no-op kalır).
        $Video->refresh();

        $this->CreateSharedPost->handle($Video, $Uploader);

        return $Video;
    }
}
