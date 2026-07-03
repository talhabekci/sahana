<?php

namespace App\Actions\Team;

use App\Exceptions\ApiError;
use App\Models\Team;
use App\Models\User;

/**
 * Mobilden gelen pozisyon dizisindeki user_id alanları oyuncunun PUBLIC id'sidir
 * (api-conventions §6). Bu sınıf her girişi takım üyeliğine göre doğrulayıp
 * DB'de saklanacak dahili user_id'ye çevirir.
 */
class ResolveLineupPositions
{
    /**
     * @param  array<int, array{id: string, x: float, y: float, label?: string|null, user_id?: string|null, guest_name?: string|null}>  $Positions
     * @return array<int, array{id: string, x: float, y: float, label: string|null, user_id: int|null, guest_name: string|null}>
     */
    public function handle(Team $Team, array $Positions): array
    {
        $MembersByPublicId = $Team->members->keyBy('public_id');

        return array_map(function (array $Position) use ($MembersByPublicId): array {
            $UserId = null;

            if (! empty($Position['user_id'])) {
                /** @var User|null $Member */
                $Member = $MembersByPublicId->get($Position['user_id']);

                if ($Member === null) {
                    throw new ApiError(
                        'Kadroya sadece takım üyeleri eklenebilir.',
                        'position_invalid_user',
                    );
                }

                $UserId = $Member->id;
            }

            return [
                'id' => $Position['id'],
                'x' => $Position['x'],
                'y' => $Position['y'],
                'label' => $Position['label'] ?? null,
                'user_id' => $UserId,
                'guest_name' => $Position['guest_name'] ?? null,
            ];
        }, $Positions);
    }
}
