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
   - Laravel kodunu `/var/www/webroot/ROOT`'a klonlar, composer install +
     `.env` üretimi (DB/Mongo/Redis host'ları otomatik) + migration çalıştırır
   - Horizon (queue) ve Reverb (websocket) process'lerini `supervisor` ile arka planda ayakta tutar

## Kurulumdan sonra elle yapılması gerekenler (gerçek bir kurulumdan doğrulandı)

**1) Apache'nin doküman kökünü `public/`'e çevir — ZORUNLU, yoksa 404 alırsınız**

`/var/www/webroot/ROOT` Laravel'in TAMAMINI içerir (`.env`, `composer.json`
dahil), ama Apache'nin sadece `public/` alt klasörünü servis etmesi lazım.
`cp` node'unda **root olarak**:

```bash
grep -rl "webroot/ROOT" /etc/httpd/ /etc/apache2/ 2>/dev/null
```

Bulduğun dosya(lar)daki `DocumentRoot /var/www/webroot/ROOT` satırını
`DocumentRoot /var/www/webroot/ROOT/public` yap (varsa `<Directory>` bloğunu
da eşleştir), sonra `httpd`/`apache2`'yi restart et. Bu adım otomatikleştirilmedi
çünkü vhost dosyasının tam yolu/formatı Jelastic sürümüne göre değişebilir.

**2) `.env`'i tamamla** — panelden "Variables" ya da doğrudan `.env` düzenleyerek:

```bash
cd /var/www/webroot/ROOT
php artisan key:generate --force        # APP_KEY boş gelir, doldurulmalı
sed -i "s#^APP_URL=.*#APP_URL=https://<gerçek-domain>#" .env
sed -i "s/^APP_DEBUG=.*/APP_DEBUG=false/" .env
sed -i "s/^CORS_ALLOWED_ORIGINS=.*/CORS_ALLOWED_ORIGINS=https:\/\/<gerçek-domain>/" .env
```

- **Redis parolası:** Jelastic'in Redis node'u parola korumalı ama
  `skipNodeEmails: true` yüzünden mail gelmez. Redis node'unun SSH'ında:
  `grep -i requirepass /etc/redis.conf /etc/redis/redis.conf 2>/dev/null`
  — bulduğun parolayı `cp` node'unda `.env`'deki `REDIS_PASSWORD`'e yaz.
- **R2 (madde C):** `MEDIA_DISK=s3` + `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` /
  `AWS_BUCKET=sahana-media` / `AWS_ENDPOINT` / `AWS_USE_PATH_STYLE_ENDPOINT=true`.
  `AWS_URL`'i R2 bucket'ına Cloudflare'da bağladığınız custom domain'e
  (`https://media.<domain>`) ayarlayın — r2.dev production için önerilmiyor.
- **Sentry (madde E):** `SENTRY_LARAVEL_DSN` ekleyin.
- `php artisan config:clear` her `.env` değişikliğinden sonra çalıştırılmalı.

**3) Domain/DNS (Cloudflare)**

- Domain'i Cloudflare'a zone olarak ekleyip nameserver'ları güncelleyin.
- `CNAME` kaydı: subdomain (örn. `api`) → bu environment'ın adresi
  (`<env-adı>.<bölge>.paasgo.net`), **Proxied** (turuncu bulut).
- **Jelastic'e de bind etmeniz gerekir** — sadece DNS eklemek yetmez!
  Panelde environment → "..." menü → **Custom Domains** → domain'i ekle.
  Eklenmezse "An environment could not be found via the specified host"
  hatası alırsınız.
- Cloudflare → SSL/TLS → **Full** mod (Flexible değil).

**4) Reverb (websocket) — henüz otomatik değil**

8080 portu Cloudflare'ın ücretsiz planında WSS (güvenli websocket)
proxy'lemiyor (sadece 443/8443 gibi belirli portlarda). Reverb'i Apache
üzerinden aynı 443 portundan reverse-proxy etmek gerekiyor — bu adım henüz
yapılmadı, ayrı bir iş olarak kalıyor.

**5) Mobil `.env.production`**

`mobile/.env.production` (repoda, gitignored) prod domain'ini kullanacak
şekilde güncellenmeli — `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_REVERB_*`,
`EXPO_PUBLIC_SENTRY_DSN`. Gerçek cihazda test için yeni bir EAS build
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
