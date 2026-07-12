<?php

namespace App\Support;

use GuzzleHttp\Cookie\CookieJar;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * sosyalhalisaha.com'un kendi il/ilçe/saha dizini AJAX uç noktasının
 * istemcisi (BACKLOG #58) — video arama uç noktasıyla (`xhr/filtre/...`)
 * KARIŞTIRILMAMALI: bu, sitenin `/filtre` sayfasındaki seçici dropdown'ları
 * besleyen, sadece isim/ID dönen ayrı bir uç nokta. Backend bu istemciyi
 * yalnızca `sosyalhalisaha:sync` komutundan, tek seferlik/nadiren çağırır —
 * canlı/istek-anı bir entegrasyon değildir.
 *
 * CSRF oturumu kendi kendine kurulur (§bootstrap): sayfa GET edilir, gizli
 * `_token` alanı ve oturum çerezleri çıkarılır — harici/elle girilen bir
 * token'a bağımlı değildir (kullanıcı kararı, 2026-07-12).
 */
class SosyalhalisahaClient
{
    private const BASE_URL = 'https://sosyalhalisaha.com/filtre';

    private CookieJar $CookieJar;

    private ?string $Token = null;

    public function __construct()
    {
        $this->CookieJar = new CookieJar;
    }

    public function bootstrap(): void
    {
        $Response = Http::withOptions(['cookies' => $this->CookieJar])->get(self::BASE_URL);

        if ($Response->failed()) {
            throw new RuntimeException('sosyalhalisaha.com/filtre sayfası açılamadı.');
        }

        if (preg_match('/name="_token"\s+value="([^"]+)"/', $Response->body(), $Matches) !== 1) {
            throw new RuntimeException('sosyalhalisaha.com sayfasında CSRF token bulunamadı.');
        }

        $this->Token = $Matches[1];
    }

    /** @return array<int, array{id: int, name: string}> */
    public function getDistricts(int $CityId): array
    {
        $Data = $this->post(['city' => $CityId, 'type' => 'getdistrict']);

        /** @var array<int, array{id: int, name: string}> $Data */
        return $Data;
    }

    /** @return array<int, array{id: int, title: string}> */
    public function getPlaces(int $DistrictExternalId): array
    {
        $Data = $this->post(['district' => $DistrictExternalId, 'type' => 'getplace']);

        /** @var array<int, array{id: int, title: string}> $Data */
        return $Data;
    }

    /**
     * @param  array<string, int|string>  $Data
     * @return array<int, array<string, mixed>>
     */
    private function post(array $Data): array
    {
        if ($this->Token === null) {
            throw new RuntimeException('Önce bootstrap() çağrılmalı.');
        }

        $Response = $this->request(['_token' => $this->Token, ...$Data]);

        if ($Response->failed() || $Response->json('status') !== 'success') {
            return [];
        }

        return $Response->json('data') ?? [];
    }

    /** @param  array<string, int|string>  $Data */
    private function request(array $Data): Response
    {
        return Http::withOptions(['cookies' => $this->CookieJar])
            ->withHeaders([
                'X-Requested-With' => 'XMLHttpRequest',
                'Referer' => self::BASE_URL,
                'Accept' => 'application/json',
            ])
            ->timeout(30)
            ->retry(3, 1000)
            ->asForm()
            ->post(self::BASE_URL, $Data);
    }
}
