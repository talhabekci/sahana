# Sistem Mimarisi

> İlgili: [tech-stack.md](tech-stack.md) · [api-conventions.md](api-conventions.md)

## 1. Genel Görünüm

```
┌─────────────────────┐
│  Mobil Uygulama     │  React Native (Expo) — iOS & Android
│  (Sahana App)       │
└──────────┬──────────┘
           │ HTTPS (REST /api/v1)          WSS (Reverb)
           ▼                                   ▼
┌──────────────────────────────────────────────────────┐
│                    Laravel 12 API                     │
│  ┌────────────┐ ┌────────────┐ ┌──────────────────┐  │
│  │ Controllers │→│  Actions/  │→│ Eloquent Models  │  │
│  │ + FormReq   │ │  Services  │ │                  │  │
│  └────────────┘ └────────────┘ └──────────────────┘  │
│        │               │                              │
│        ▼               ▼                              │
│   API Resources    Jobs (Queue)                       │
└───────┬──────────────┬───────────────┬───────────────┘
        │              │               │
        ▼              ▼               ▼
   ┌─────────┐   ┌──────────┐   ┌─────────────┐
   │ MySQL 8 │   │ Redis 7  │   │ Cloudflare  │
   │         │   │ cache+   │   │ R2 (medya)  │
   │         │   │ queue    │   │             │
   └─────────┘   └──────────┘   └─────────────┘
                       │
                       ▼
              ┌─────────────────┐
              │ FCM (push)      │
              │ SMS sağlayıcı   │
              └─────────────────┘
```

## 2. Repo Yapısı (Monorepo)

```
Sahana/
├── ROADMAP.md
├── docs/                  # Tüm spec ve mimari dokümanlar
├── api/                   # Laravel 12
│   ├── app/
│   │   ├── Actions/       # İş mantığı: modül başına alt klasör
│   │   │   ├── Auth/
│   │   │   ├── Team/
│   │   │   └── Match/
│   │   ├── Http/
│   │   │   ├── Controllers/Api/V1/
│   │   │   ├── Requests/
│   │   │   └── Resources/
│   │   ├── Models/
│   │   └── Notifications/
│   ├── database/migrations/
│   ├── routes/api.php
│   └── tests/             # Pest: Feature ağırlıklı
└── mobile/                # Expo (React Native)
    ├── app/               # expo-router ekranları
    │   ├── (auth)/        # login, register, otp
    │   ├── (tabs)/        # ana sekmeler: feed, maçlar, takımlar, profil
    │   └── ...
    └── src/
        ├── features/      # modül başına: api.ts, hooks/, components/
        │   ├── auth/
        │   ├── team/
        │   ├── match/
        │   └── ...
        └── shared/        # UI kit, api client, utils
```

**Kural:** Mobil `features/` klasörleri ve API `Actions/` klasörleri, ROADMAP'teki
modüllerle birebir aynı isimleri taşır. Bir modülün kodu başka modülün iç
detayına dokunmaz; paylaşılan şeyler `shared/`'a gider.

## 3. Çekirdek Veri Modeli (ER — ilk taslak)

```
users ────────────┐
 ├ id             │
 ├ phone (uniq)   │         team_members (pivot)
 ├ name           │          ├ team_id
 ├ avatar_path    │          ├ user_id
 └ ...            │          ├ role: captain|member
                  │          └ jersey_number
player_profiles   │
 ├ user_id (1:1)  │         teams
 ├ positions JSON │◄────────├ id
 ├ foot: L|R|B    │         ├ name
 ├ city_id        │         ├ logo_path
 ├ level 1..5     │         ├ color_home / color_away
 └ availability   │         └ created_by (user_id)
                  │
matches           │         lineups
 ├ id             │          ├ id
 ├ team_id ───────┘          ├ match_id (nullable — bağımsız kadro olabilir)
 ├ opponent_team_id?         ├ team_id
 ├ venue_id?                 ├ formation: "2-3-1" vb.
 ├ starts_at (datetime, UTC) └ positions JSON [{user_id, x, y, role}]
 ├ price_per_player
 ├ status: draft|confirmed|played|cancelled
 └ ...

match_participants           player_listings ("adam eksik")
 ├ match_id                   ├ id
 ├ user_id                    ├ match_id
 ├ rsvp: yes|no|maybe         ├ positions_needed JSON
 └ responded_at               ├ level_min / level_max
                              ├ location POINT (SPATIAL INDEX)
venues                        └ status: open|filled|expired
 ├ id
 ├ name                      posts / comments / likes / follows
 ├ location POINT             (Modül 4 spec'inde detaylanacak)
 └ ...
                             videos
                              ├ id, match_id?, user_id
                              ├ type: external_link|uploaded
                              ├ url / storage_path
                              └ provider: youtube|sosyalhalisaha|other
```

Tarih/saat: DB'de her zaman **UTC**, API'de ISO 8601 (`2026-07-03T18:00:00Z`),
mobilde kullanıcı saat dilimine çevrilir. Detay: [api-conventions.md](api-conventions.md).

## 4. Kritik Akışlar

### Auth (Modül 1)
1. Telefon + OTP: `POST /auth/otp` → SMS job kuyruğa → `POST /auth/verify`
   → Sanctum token döner → mobilde SecureStore'a yazılır.
2. Token, `Authorization: Bearer` header'ı ile taşınır. Refresh stratejisi:
   uzun ömürlü token + şüpheli aktivitede iptal (v1 için yeterli).

### Maç organizasyonu (Modül 3)
1. Kaptan maç oluşturur → takım üyelerine push (FCM job).
2. Üyeler RSVP verir → kaptan eksik görürse "adam eksik" ilanı açar.
3. İlan, konum + mevki + seviye filtresiyle keşif ekranına düşer.
4. Başvuru → kaptan onayı → oyuncu maça eklenir → ilan `filled`.

### Video (Modül 5, v1)
1. Kullanıcı harici link yapıştırır (YouTube/sosyalhalisaha).
2. API, oEmbed/OG metadata çeker (job), thumbnail cache'ler.
3. Feed'de embed player ile oynatılır. Kendi yüklemeleri v2 (R2 + HLS).

## 5. Ortamlar

| Ortam | Amaç | API | Mobil |
|---|---|---|---|
| local | Geliştirme | Laravel Sail (Docker) | Expo Go / dev client |
| staging | Test + TestFlight/Internal track | VPS üzerinde ayrı container seti | EAS preview build |
| production | Canlı | VPS | Store sürümleri + OTA |

## 6. Güvenlik Temelleri
- Tüm trafik TLS; API rate limiting (özellikle `/auth/otp` — SMS maliyet saldırısı!)
- KVKK: telefon numarası ve konum kişisel veri → açık rıza ekranı, veri silme
  endpoint'i (`DELETE /me`) baştan planlanır. Global açılımda GDPR aynı altyapıyı kullanır.
- Yüklenen görseller: boyut limiti, format doğrulama, EXIF temizleme.
- Yetkilendirme: Laravel Policy'leri (ör. maçı sadece kaptan iptal edebilir).
