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
└───────┬──────────────┬───────────────┬──────────────┬────────┘
        │              │               │              │
        ▼              ▼               ▼              ▼
   ┌─────────┐   ┌──────────┐   ┌─────────────┐  ┌──────────┐
   │ MySQL 8 │   │ Redis 7  │   │ Cloudflare  │  │ MongoDB  │
   │         │   │ cache+   │   │ R2 (medya)  │  │ (sohbet  │
   │         │   │ queue    │   │             │  │ geçmişi) │
   └─────────┘   └──────────┘   └─────────────┘  └──────────┘
                       │
                       ▼
              ┌─────────────────┐
              │ Expo Push API   │
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

devices (Modül 7)            notifications (Modül 7, Laravel yerleşik)
 ├ user_id                    ├ id (uuid), type
 ├ expo_push_token (uniq)     ├ notifiable_type/id
 └ platform: ios|android      ├ data JSON
                              └ read_at

messages (Modül 7 — MongoDB, sahana_chat DB, MySQL'e FK YOK)
 ├ _id (ObjectId, public ID)  ├ type: text|image|match_ref|lineup_ref
 ├ team_id, user_id           └ body? / image_path? / match_id? / lineup_id?
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
1. Kaptan maç oluşturur → takım üyelerine push (Expo Push API üzerinden).
2. Üyeler RSVP verir → kaptan eksik görürse "adam eksik" ilanı açar.
3. İlan, konum + mevki + seviye filtresiyle keşif ekranına düşer.
4. Başvuru → kaptan onayı → oyuncu maça eklenir → ilan `filled`.

### Video (Modül 5, v1)
1. Kullanıcı harici link yapıştırır (YouTube/sosyalhalisaha).
2. API, oEmbed/OG metadata çeker (job), thumbnail cache'ler.
3. Feed'de embed player ile oynatılır. Kendi yüklemeleri v2 (R2 + HLS).

### Bildirim & Sohbet (Modül 7)
1. Olay gerçekleşir (maç oluştu, başvuru geldi vb.) → Laravel Notification
   hem `database` (uygulama içi bildirim merkezi) hem özel `ExpoChannel`
   (push) kanallarına yazar; sessiz saatteyse push 08:00'e ertelenir.
2. Takım sohbeti mesajları MySQL değil **MongoDB**'ye yazılır (`sahana_chat`
   DB) — gönderildiğinde Reverb üzerinden `private-team.{id}` kanalına
   anlık yayınlanır, çevrimdışı üyelere push fallback gider.

## 5. Ortamlar

| Ortam | Amaç | API | Mobil |
|---|---|---|---|
| local | Geliştirme | Lokal PHP + brew MySQL (`sahana` DB) + brew MongoDB (`sahana_chat` DB); Sail opsiyonel | Expo Go / dev client |
| staging | Test + TestFlight/Internal track | VPS üzerinde ayrı container seti (MySQL+MongoDB+Redis+Reverb) | EAS preview build |
| production | Canlı | VPS | Store sürümleri + OTA |

## 5.1 Tema (Açık/Koyu) — BACKLOG #60

Mobil uygulamanın tek bir statik `Palette` sabiti yerine iki paleti var:
`DarkPalette` ("Gece Maçı", orijinal tasarım) ve `LightPalette` ("Gündüz
Maçı"). İkisi de **aynı anahtar adlarını** paylaşır (`pitchNight`, `turf`,
`chalk`, `lime`, ...) — anahat isimleri koyu temanın kökeninden geliyor,
her iki temada da aynı **rolü** (zemin, yüzey, birincil metin, aksan...)
temsil eder, ışık modunda "gece" kelimesi artık gerçek renkle eşleşmiyor
ama anahtarı yeniden adlandırmak 59 dosyayı gereksiz yere etkileyeceği
için tercih edilmedi.

- `mobile/src/shared/ui/theme.ts`: `useTheme()` hook'u — `useColorScheme()`
  (react-native) ile sistem tercihini, `useThemeStore` (zustand, tercih
  `system`/`light`/`dark`) ile kullanıcı override'ını okuyup etkin paleti
  döndürür.
- Kalıcı tercih `expo-secure-store` ile saklanır (auth store'daki
  yerleşik desenle aynı — `AsyncStorage` proje kararınca kullanılmıyor,
  bkz. tech-stack.md).
- Her ekranda modül seviyesindeki `StyleSheet.create({...})` bir
  `createStyles(Palette) => StyleSheet.create({...})` fabrikasına
  dönüştürülüp bileşen içinde `useMemo(() => createStyles(Palette),
  [Palette])` ile çağrılıyor — statik importta renkler derleme anında
  donduğu için canlı tema değişimi ancak stil üretimi render zamanına
  taşınarak mümkün oluyor.
- `lime` (projektör limonu) ışık modunda koyulaştırıldı — kullanım
  noktalarının çoğu (174'ten 133'ü) doğrudan metin/ikon rengi, orijinal
  neon değer beyaz zeminde düşük kontrastlı kalıyordu.
- Ayarlar ekranında "GÖRÜNÜM" bölümü: Sistem / Açık / Koyu üç seçenek.

## 6. Güvenlik Temelleri
- Tüm trafik TLS; API rate limiting (özellikle `/auth/otp` — SMS maliyet saldırısı!)
- KVKK: telefon numarası ve konum kişisel veri → açık rıza ekranı, veri silme
  endpoint'i (`DELETE /me`) baştan planlanır. Global açılımda GDPR aynı altyapıyı kullanır.
- Yüklenen görseller: boyut limiti, format doğrulama, EXIF temizleme.
- Yetkilendirme: Laravel Policy'leri (ör. maçı sadece kaptan iptal edebilir).
