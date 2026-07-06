<?php

namespace App\Jobs;

use App\Models\Video;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * YouTube için resmi oEmbed uç noktası, diğer sağlayıcılar için genel OG meta
 * etiketi taraması. sosyalhalisaha içeriği asla otomatik çekilip yeniden
 * yayınlanmaz — sadece başlık/thumbnail önizlemesi (bkz. research dokümanı).
 */
class FetchVideoMetadata implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(private readonly Video $Video) {}

    public function handle(): void
    {
        if ($this->Video->url === null) {
            return;
        }

        try {
            $Metadata = $this->Video->provider === 'youtube'
                ? $this->fetchYoutubeOEmbed($this->Video->url)
                : $this->fetchOpenGraph($this->Video->url);
        } catch (Throwable $Exception) {
            Log::warning('Video metadata çekilemedi.', [
                'video_id' => $this->Video->id,
                'error' => $Exception->getMessage(),
            ]);
            $Metadata = [];
        }

        $this->Video->forceFill([
            'title' => $Metadata['title'] ?? null,
            'thumbnail_url' => $Metadata['thumbnail_url'] ?? null,
            'fetched_at' => now(),
        ])->save();
    }

    /**
     * @return array{title?: string|null, thumbnail_url?: string|null}
     */
    private function fetchYoutubeOEmbed(string $Url): array
    {
        $Response = Http::timeout(5)->get('https://www.youtube.com/oembed', [
            'url' => $Url,
            'format' => 'json',
        ]);

        if (! $Response->successful()) {
            return [];
        }

        return [
            'title' => $Response->json('title'),
            'thumbnail_url' => $Response->json('thumbnail_url'),
        ];
    }

    /**
     * @return array{title?: string|null, thumbnail_url?: string|null}
     */
    private function fetchOpenGraph(string $Url): array
    {
        $Response = Http::timeout(5)->get($Url);

        if (! $Response->successful()) {
            return [];
        }

        $Html = $Response->body();

        return [
            'title' => $this->extractMetaTag($Html, 'og:title'),
            'thumbnail_url' => $this->extractMetaTag($Html, 'og:image'),
        ];
    }

    private function extractMetaTag(string $Html, string $Property): ?string
    {
        $Pattern = '/<meta[^>]+property=["\']'.preg_quote($Property, '/').'["\'][^>]+content=["\']([^"\']+)["\'][^>]*>/i';

        if (preg_match($Pattern, $Html, $Matches) === 1) {
            return html_entity_decode($Matches[1]);
        }

        return null;
    }
}
