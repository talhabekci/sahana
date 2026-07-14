# Sahana — Virtuozzo Jelastic dağıtımı

`manifest.jps`, `docs/PRODUCTION-READINESS.md` madde A'daki topolojiyi
(nginx/apache + PHP-FPM, MySQL 8, MongoDB 7, Redis 7, Horizon, Reverb)
Jelastic üzerinde tek seferde kuran bir JPS manifest'i.

**Önemli:** Bu manifest, Virtuozzo'nun kendi resmi örnek manifest'lerinden
(Laravel, Ghost, MongoDB replication, Redis cluster — hepsi
`github.com/jelastic-jps/*`) doğrulanmış syntax'la yazıldı, ama sizin
panelinizdeki güncel node type kataloğuna karşı test edilmedi. Import
ekranındaki önizlemede `nodeType` alanları (apache/mysql/mongodb/redis)
kabul edilmezse, panelin "Marketplace" bölümünden karşılık gelen güncel
node adını görüp burada değiştirmeniz gerekebilir.

## Kurulum

1. Jelastic panel → **Import** (veya "Create Environment" → "Import a JPS
   file") → bu dosyayı yükleyin ya da GitHub raw URL'ini yapıştırın:
   `https://raw.githubusercontent.com/talhabekci/sahana/main/deploy/virtuozzo/manifest.jps`
2. Kurulum otomatik olarak şunları yapar:
   - 4 node açar: `cp` (PHP-FPM app), `sqldb` (MySQL), `nosqldb` (MongoDB), `cache` (Redis)
   - `api/` klasörünü public repo'dan klonlar, composer bağımlılıklarını kurar
   - `.env`'i DB/Mongo/Redis host'larıyla otomatik doldurur, `APP_KEY` üretir, migration çalıştırır
   - Horizon (queue) ve Reverb (websocket) process'lerini `supervisor` ile arka planda ayakta tutar

## Kurulumdan sonra elle yapılması gerekenler

Manifest bilerek şunları **otomatik doldurmuyor** — bunlar üçüncü taraf
sırları, panelden "Variables" (ya da SSH/File Manager ile `.env`) üzerinden
eklenmeli, sonra `cp` node'u restart edilmeli:

- `CORS_ALLOWED_ORIGINS` — gerçek domain(ler)
- `MEDIA_DISK=s3` + `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_BUCKET` /
  `AWS_URL` / `AWS_ENDPOINT` / `AWS_USE_PATH_STYLE_ENDPOINT=true` — R2 bilgileri
  (bkz. PROGRESS.md 2026-07-14 (6) kaydı — bucket zaten `sahana-media` olarak
  hazır, sadece `AWS_URL`'in gerçek custom domain'e bağlanması lazım, r2.dev
  production için önerilmiyor)
- `SENTRY_LARAVEL_DSN` — Laravel Sentry projesinin DSN'i
- `REVERB_APP_ID` / `REVERB_APP_KEY` / `REVERB_APP_SECRET` / `REVERB_HOST` /
  `REVERB_PORT=8080` / `REVERB_SCHEME=https` — prod domain'e göre güncellenmeli

Ayrıca:

- **Domain/DNS:** Cloudflare'da domain'i bu environment'ın public endpoint'ine
  (CNAME) yönlendirin. SSL zaten manifest'te `ssl: true` ile açık.
- **Reverb portu:** 8080 dışa açık olmalı — panelde node'un "Ports" ayarından
  bu portu expose edin (ya da nginx/apache üzerinden `/app` yolunu reverse-proxy
  yapın).
- **Mobil `.env`:** `EXPO_PUBLIC_API_URL` ve `EXPO_PUBLIC_REVERB_*` gerçek
  domain'i gösterecek şekilde güncellenmeli, yeni bir build alınmalı.
- **`php artisan config:cache` / `route:cache`:** prod'da performans için
  önerilir, `.env` her değiştiğinde `config:clear` + tekrar `config:cache`
  gerekir.

## Node topolojisi (elle kurmak isterseniz)

Manifest kullanmadan panelden elle de kurabilirsiniz — aynı 4 node:

| Node | Tip | Amaç |
|---|---|---|
| `cp` | PHP-FPM (apache) | Laravel API + Horizon + Reverb (supervisor ile) |
| `sqldb` | MySQL 8 | Ana veritabanı |
| `nosqldb` | MongoDB 7 | Sohbet/mesajlaşma (`sahana_chat`) |
| `cache` | Redis 7 | Cache + queue (Horizon) |

Horizon/Reverb'i elle kurarken `manifest.jps`'teki `setup-supervisor`
action'ındaki supervisor config'lerini referans alabilirsiniz.
