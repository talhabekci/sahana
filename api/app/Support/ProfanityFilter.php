<?php

namespace App\Support;

/**
 * v1 küfür filtresi — spec kararı (04-social-feed.md §Moderasyon): basit TR
 * kelime listesi, ileride ML tabanlı filtreye geçişi kolaylaştırmak için
 * tek bir sınıfta izole.
 */
class ProfanityFilter
{
    /** @var list<string> */
    private const BLOCKED_WORDS = [
        'amk', 'aq', 'orospu', 'piç', 'yavşak', 'ibne', 'göt herif',
        'siktir', 'salak', 'gerizekalı', 'aptal herif',
    ];

    /**
     * Tam kelime sınırıyla arar (ör. "amk" kısaltması "akşamki" içinde eşleşmesin
     * — klasik "Scunthorpe problemi"). \b yerine \p{L}\p{N} kullanılır çünkü
     * PCRE'nin \w'si Türkçe harfleri (ş,ı,ğ,ü,ö,ç) güvenilir kapsamıyor.
     */
    public static function containsProfanity(string $Text): bool
    {
        $Normalized = mb_strtolower($Text, 'UTF-8');

        foreach (self::BLOCKED_WORDS as $Word) {
            $Pattern = '/(?<![\p{L}\p{N}])'.preg_quote($Word, '/').'(?![\p{L}\p{N}])/u';

            if (preg_match($Pattern, $Normalized) === 1) {
                return true;
            }
        }

        return false;
    }
}
