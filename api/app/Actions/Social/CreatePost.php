<?php

namespace App\Actions\Social;

use App\Exceptions\ApiError;
use App\Models\Lineup;
use App\Models\Post;
use App\Models\Team;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class CreatePost
{
    /**
     * @param  array{body: string, team_id?: string|null, image?: UploadedFile|null, lineup_id?: string|null}  $Data
     */
    public function handle(User $Author, array $Data): Post
    {
        $TeamId = null;

        if (! empty($Data['team_id'])) {
            $Team = Team::where('public_id', $Data['team_id'])->firstOrFail();

            if (! $Team->isMember($Author)) {
                throw new ApiError('Bu takım adına paylaşım yapamazsın.', 'forbidden', 403);
            }

            $TeamId = $Team->id;
        }

        $LineupId = null;

        if (! empty($Data['lineup_id'])) {
            $Lineup = Lineup::where('public_id', $Data['lineup_id'])->firstOrFail();

            if (! $Lineup->team->isMember($Author)) {
                throw new ApiError('Bu kadroyu paylaşamazsın.', 'forbidden', 403);
            }

            $LineupId = $Lineup->id;
        }

        $ImagePath = null;

        if (! empty($Data['image'])) {
            $ImagePath = $this->storeImage($Data['image']);
        }

        return Post::create([
            'user_id' => $Author->id,
            'team_id' => $TeamId,
            'type' => 'text',
            'body' => $Data['body'],
            'image_path' => $ImagePath,
            'lineup_id' => $LineupId,
        ]);
    }

    /**
     * Görseli gerçekten decode ederek doğrular (sahte uzantı/bozuk dosya
     * reddedilir), sonra JPEG'e yeniden encode eder — bu hem EXIF metadata'sını
     * (ör. GPS konumu) siler hem de orijinal bayt dizisinin diske hiç
     * yazılmamasını sağlar. Dosya adı rastgele üretilir (path traversal /
     * üzerine yazma riski yok). Bkz. docs/features/04-social-feed.md.
     */
    private function storeImage(UploadedFile $Image): string
    {
        $Resource = @imagecreatefromstring(file_get_contents($Image->getRealPath()));

        if ($Resource === false) {
            throw new ApiError('Desteklenmeyen ya da bozuk görsel dosyası.', 'invalid_image', 422);
        }

        ob_start();
        imagejpeg($Resource, quality: 85);
        $JpegContents = ob_get_clean();
        imagedestroy($Resource);

        $Path = 'posts/'.Str::uuid().'.jpg';
        Storage::disk('public')->put($Path, $JpegContents);

        return $Path;
    }
}
