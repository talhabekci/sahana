<?php

namespace App\Support;

/**
 * Rozet kataloğu (BACKLOG #54) — sabit, PHP'de tanımlı. Ayrı bir DB tablosu
 * yok; `player_badges.badge_key` buradaki anahtarlardan birine karşılık gelir.
 */
class BadgeCatalog
{
    /** @var array<string, array{label: string, description: string, icon: string}> */
    public const ALL = [
        'ilk_gol' => [
            'label' => 'İlk Gol',
            'description' => 'İlk golünü attın.',
            'icon' => 'football',
        ],
        'hat_trick' => [
            'label' => 'Hat-Trick',
            'description' => 'Bir maçta 3 veya daha fazla gol attın.',
            'icon' => 'flame',
        ],
        'seri_5' => [
            'label' => '5 Maçlık Seri',
            'description' => 'Üst üste 5 maça geldin.',
            'icon' => 'flash',
        ],
        'guvenilir' => [
            'label' => 'Güvenilir Oyuncu',
            'description' => 'En az 5 maçta %90 ve üzeri katılım gösterdin.',
            'icon' => 'shield-checkmark',
        ],
        'yildiz' => [
            'label' => 'Yıldız',
            'description' => 'En az 5 puanla 8.5 ve üzeri ortalama reyting kazandın.',
            'icon' => 'star',
        ],
    ];

    /** @return array{label: string, description: string, icon: string} */
    public static function get(string $Key): array
    {
        return self::ALL[$Key] ?? [
            'label' => $Key,
            'description' => '',
            'icon' => 'ribbon-outline',
        ];
    }
}
