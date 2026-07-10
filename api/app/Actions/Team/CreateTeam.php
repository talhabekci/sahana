<?php

namespace App\Actions\Team;

use App\Models\Team;
use App\Models\User;
use App\Support\ImageUploader;
use Illuminate\Http\UploadedFile;

class CreateTeam
{
    /**
     * @param  array{name: string, badge_icon?: string|null, logo?: UploadedFile|null, color_home: string}  $Data
     */
    public function handle(User $Creator, array $Data): Team
    {
        $LogoPath = null;

        if (! empty($Data['logo'])) {
            $LogoPath = ImageUploader::store($Data['logo'], 'teams');
        }

        $Team = Team::create([
            'name' => $Data['name'],
            'badge_icon' => $Data['badge_icon'] ?? null,
            'logo_path' => $LogoPath,
            'color_home' => $Data['color_home'],
            'created_by' => $Creator->id,
        ]);

        $Team->members()->attach($Creator->id, [
            'role' => 'captain',
            'joined_at' => now(),
        ]);

        return $Team->fresh('members');
    }
}
