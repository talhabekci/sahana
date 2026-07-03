# Teknoloji Stack'i

> Karar tarihi: 2026-07-03 · Durum: **Kesinleşti**
> İlgili: [ROADMAP.md](../ROADMAP.md) · [architecture.md](architecture.md)

## Özet Tablo

| Katman | Teknoloji | Neden |
|---|---|---|
| Mobil | React Native (Expo, TypeScript) | Web/JS aşinalığı, tek codebase, OTA update |
| Backend | Laravel 12 (API-only) | Mevcut PHP/Laravel tecrübesi, batteries-included |
| Veritabanı | MySQL 8 | Aşinalık; coğrafi sorgular için yeterli (POINT + SPATIAL INDEX) |
| Cache & Queue | Redis 7 + Laravel Horizon | Bildirim fan-out, feed cache, OTP rate limit |
| Realtime | Laravel Reverb | Birinci parti WebSocket; chat + canlı katılım durumu |
| Push | Firebase Cloud Messaging (FCM) | iOS+Android tek kanal, Expo ile uyumlu |
| Medya depolama | Cloudflare R2 (S3-uyumlu) | Egress ücretsiz — video/foto ağırlıklı üründe kritik |
| CI/CD | GitHub Actions + EAS Build | API testleri + mobil build otomasyonu |
| Hosting (v1) | Tek VPS (Hetzner) + Docker | Düşük maliyet, basit operasyon |

---

## Mobil: React Native (Expo)

### Neden Expo (bare RN değil)?
- Native build zinciri (Xcode/Gradle) derdi olmadan geliştirme — mobil tecrübesi
  olmayan biri için en kısa öğrenme yolu.
- **EAS Build:** Mac'te lokal iOS build derdi yerine bulutta build.
- **OTA Updates (expo-updates):** Store onayı beklemeden JS-katmanı düzeltme yayını.
- İhtiyaç halinde `expo prebuild` ile native koda çıkış kapısı açık.

### Temel Paketler

| İhtiyaç | Paket | Not |
|---|---|---|
| Dil | TypeScript (strict) | Baştan strict; sonradan açmak acı verir |
| Navigasyon | `expo-router` | Dosya tabanlı, deep-link desteği hazır |
| Server state | `@tanstack/react-query` | API cache, optimistic update, offline retry |
| Client state | `zustand` | Hafif; Redux'a gerek yok |
| Form | `react-hook-form` + `zod` | Zod şemaları API validasyonuyla paralel tutulur |
| HTTP | `axios` | Interceptor ile token yenileme |
| Push | `expo-notifications` + FCM | |
| Harita | `react-native-maps` | Saha/ilan konumları için |
| Video oynatma | `expo-video` | HLS destekli |
| Görsel seçme/çekme | `expo-image-picker` | Profil/takım logosu |
| Güvenli saklama | `expo-secure-store` | Auth token burada, AsyncStorage'da DEĞİL |
| Kadro tahtası sürükle-bırak | `react-native-gesture-handler` + `react-native-reanimated` | Modül 2'nin kalbi |
| Kadro görseli export | `react-native-view-shot` | WhatsApp paylaşımı için PNG |
| i18n | `i18next` + `react-i18next` | TR başlar, global için altyapı hazır |

### Kod standartları
- ESLint + Prettier (CI'da zorunlu)
- Klasör yapısı: `app/` (router), `src/features/<modül>/`, `src/shared/`
- Her feature modülü kendi `api.ts`, `components/`, `hooks/` klasörünü taşır —
  ROADMAP'teki modül yapısıyla birebir eşleşir.

---

## Backend: Laravel 12

### Neden Slim değil?
Slim ile her şeyi elle kurmak gerekir (auth, queue, storage, broadcast).
Bu projede hepsi Modül 1-7 arasında lazım. Laravel'de birinci parti:

- **Sanctum** → mobil token auth (Modül 1)
- **Queue + Horizon** → OTP SMS, push fan-out, görsel işleme (Modül 1, 7)
- **Notifications** → tek API'den push + mail + DB bildirimi (Modül 7)
- **Reverb** → takım sohbeti WebSocket (Modül 7)
- **Storage (Flysystem)** → R2'ye tek satır konfigürasyonla bağlanır (Modül 5)
- **Scout** (ileride) → oyuncu/takım araması

### Temel Paketler

| İhtiyaç | Paket |
|---|---|
| Auth | `laravel/sanctum` |
| Queue izleme | `laravel/horizon` |
| WebSocket | `laravel/reverb` |
| Görsel işleme (thumbnail, crop) | `intervention/image` |
| SMS (OTP) | Netgsm/İleti Merkezi entegrasyonu (TR); arayüz arkasına saklanır |
| API dokümantasyonu | `dedoc/scramble` (OpenAPI otomatik üretim) |
| Test | Pest |
| Statik analiz | Larastan (PHPStan level 6+) |
| Code style | Laravel Pint |

### Mimari kurallar (özet — detay `architecture.md`)
- API-only: Blade yok, her yanıt JSON.
- Controller ince, iş mantığı Action/Service sınıflarında.
- Form Request ile validasyon; Resource ile response şekillendirme.
- Tüm endpoint'ler `docs/api-conventions.md` standartlarına uyar.

---

## Veritabanı: MySQL

> Lokal geliştirme: kullanıcının brew MySQL kurulumu (9.5, `sahana` veritabanı,
> `root`/şifresiz) — Sail/Docker opsiyonel. Prod hedefi MySQL 8 uyumluluğu.

- Konum bazlı "yakınımdaki ilanlar/sahalar" için `POINT` kolonu + `SPATIAL INDEX`
  ve `ST_Distance_Sphere` yeterli. PostGIS gerektirecek karmaşıklık ufukta yok.
- Feed zaman çizelgesi v1'de basit sorgu + Redis cache; ölçek gelirse fan-out
  değerlendirilir.
- Migration'lar tek gerçeklik kaynağı; şema değişikliği asla elle yapılmaz.

## Altyapı (v1 — maliyet odaklı)

```
Hetzner VPS (CX32 ~ €8/ay)
├── Docker Compose
│   ├── nginx (TLS: Let's Encrypt)
│   ├── php-fpm (Laravel)
│   ├── mysql:8
│   ├── redis:7
│   ├── horizon (queue worker)
│   └── reverb (websocket)
├── Cloudflare (DNS + CDN + R2)
└── Yedekleme: mysqldump → R2 (günlük, cron)
```

Ölçek sinyali geldiğinde (ilk ~10K aktif kullanıcı sonrası): managed DB'ye geçiş,
worker'ları ayrı makineye alma. Şimdiden mikroservis YOK.

## Karar Kaydı

| Tarih | Karar | Alternatif | Gerekçe |
|---|---|---|---|
| 2026-07-03 | React Native (Expo) | Flutter | Kullanıcının JS/web aşinalığı, OTA update, EAS |
| 2026-07-03 | Laravel 12 | Slim 4 | Batteries-included; Modül 1-7 ihtiyaçları birinci parti |
| 2026-07-03 | MySQL 8 | PostgreSQL | Aşinalık; spatial ihtiyaçlar MySQL'de karşılanıyor |
| 2026-07-03 | Cloudflare R2 | AWS S3 | Egress ücretsiz; video ağırlıklı ürün |
