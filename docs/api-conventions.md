# API Standartları

> Tüm endpoint'ler bu kurallara uyar. İlgili: [architecture.md](architecture.md)

## 1. Genel

- Base URL: `https://api.sahana.app/api/v1`
- Sadece JSON: `Content-Type: application/json`, `Accept: application/json`
- Kimlik doğrulama: `Authorization: Bearer <sanctum-token>`
- Versiyonlama: URL'de (`/api/v1/`). Kırıcı değişiklik = yeni versiyon.
- Dil: `Accept-Language: tr` (varsayılan `tr`, ileride `en`)

## 2. İsimlendirme

- Kaynaklar çoğul, kebab-case: `/matches`, `/player-listings`
- İlişkili kaynak: `/teams/{team}/members`
- Eylem gerektiğinde fiil son ek: `POST /matches/{match}/confirm`
- JSON alanları `snake_case` (Laravel Resource varsayılanı; mobil tarafta
  dönüştürme YOK, olduğu gibi kullanılır)

## 3. Response Zarfı

Başarılı — tek kaynak:
```json
{
  "data": {
    "id": 42,
    "name": "Perşembe Maçı",
    "starts_at": "2026-07-09T18:00:00Z"
  }
}
```

Başarılı — liste (cursor pagination):
```json
{
  "data": [ ... ],
  "meta": {
    "next_cursor": "eyJpZCI6NDF9",
    "per_page": 20
  }
}
```

> **Neden cursor?** Feed ve ilan listelerinde offset pagination, yeni kayıt
> düştükçe kayma yapar. Baştan cursor ile başlamak sonradan migration derdini önler.

## 4. Hata Formatı

```json
{
  "message": "Doğrulama hatası.",
  "code": "validation_failed",
  "errors": {
    "phone": ["Telefon numarası geçersiz."]
  }
}
```

| HTTP | Kullanım |
|---|---|
| 200/201 | Başarı / oluşturuldu |
| 401 | Token yok/geçersiz |
| 403 | Yetki yok (ör. kaptan olmayan maç iptali) |
| 404 | Kaynak yok — VEYA erişim gizlenmek isteniyorsa |
| 422 | Validasyon hatası (`errors` alanı dolu) |
| 429 | Rate limit (OTP, arama) |

`code` alanı mobilin programatik davranışı için sabittir (`otp_expired`,
`listing_already_filled` gibi); `message` kullanıcıya gösterilebilir ve çevrilidir.

## 5. Tarih/Saat & Konum

- Tüm zamanlar **UTC, ISO 8601**: `2026-07-09T18:00:00Z`. Mobil, cihaz saat
  dilimine çevirir. API'ye gönderilen zamanlar da UTC olmalı.
- Konum: `{"lat": 41.0082, "lng": 28.9784}` çifti. Yarıçap parametresi km:
  `GET /player-listings?near=41.0082,28.9784&radius=10`

## 6. Idempotency & Güvenlik

- Yazma endpoint'lerinde kritik olanlar (`POST /matches/{id}/rsvp`) doğal
  idempotent tasarlanır (aynı isteği iki kez atmak durumu bozmaz).
- Rate limit: `/auth/otp` → 3/saat/numara + 10/saat/IP (SMS maliyet saldırısı).
- Tüm ID'ler URL'de tahmin edilebilir artan integer yerine **public ID**
  (ör. `sqids`/ULID) ile taşınır — kullanıcı sayısı/maç sayısı dışarı sızmaz.

## 7. Dosya Yükleme

- Görseller: `POST /uploads` → önce API'den **presigned R2 URL** alınır,
  mobil doğrudan R2'ye yükler, sonra `path` API'ye bildirilir.
  (API üzerinden proxy yükleme YOK — VPS bant genişliğini korur.)
- Limitler: görsel max 10 MB (jpg/png/webp/heic), video v2'de tanımlanacak.

## 8. Test Standardı

- Her endpoint için en az: happy path + yetki reddi + validasyon hatası
  Pest feature testi. CI'da `php artisan test` yeşil olmadan merge yok.
- OpenAPI şeması Scramble ile otomatik üretilir: `/docs/api` (staging'de açık,
  prod'da kapalı).
