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
   - **TÜM monorepo'yu** `/var/www/webroot/ROOT`'a git clone'lar (ROOT'un
     kendisi gerçek bir git working tree olsun diye, `.git` doğrudan
     ROOT'ta — 2026-07-16'dan önceki sürüm sadece `api/` içeriğini
     `cp -a` ile kopyalıyordu, ROOT hiçbir zaman git repo olmuyordu, bkz.
     "Güncelleme akışı" bölümü). Laravel uygulaması `ROOT/api` altında;
     composer install + `.env` üretimi + migration orada çalışır.
   - Horizon (queue) ve Reverb (websocket) process'lerini `supervisor` ile arka planda ayakta tutar

## Kurulumdan sonra elle yapılması gerekenler (gerçek bir kurulumdan doğrulandı)

**1) Apache'nin doküman kökünü `api/public/`'e çevir — ZORUNLU, yoksa 404 alırsınız**

`/var/www/webroot/ROOT` artık TÜM monorepo'yu içerir (`mobile/`, `docs/`,
`api/` — `api/.env`/`api/composer.json` dahil), Apache'nin sadece
`api/public/` alt klasörünü servis etmesi lazım. `cp` node'unda **root
olarak**:

```bash
grep -rl "webroot/ROOT" /etc/httpd/ /etc/apache2/ 2>/dev/null
```

Bulduğun dosya(lar)daki `DocumentRoot /var/www/webroot/ROOT` satırını
`DocumentRoot /var/www/webroot/ROOT/api/public` yap (varsa `<Directory>`
bloğunu da eşleştir), sonra `httpd`/`apache2`'yi restart et. Bu adım
otomatikleştirilmedi çünkü vhost dosyasının tam yolu/formatı Jelastic
sürümüne göre değişebilir.

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

**4) Reverb (websocket) — çözüldü, ama proxy kuralı 80'e gider (443'e değil!)**

8080 portu Cloudflare'ın ücretsiz planında WSS proxy'lemiyor (sadece
443/8443 gibi belirli portlarda), bu yüzden Reverb'i Apache üzerinden
proxy'lemek gerekiyor. **Kritik nokta:** `apachectl -S` çalıştırınca
`*:443` hiç görünmüyor, sadece `*:80` — çünkü Jelastic'in Shared Load
Balancer'ı dış HTTPS trafiğini kendi sertifikasıyla karşılayıp Apache'ye
**düz HTTP olarak 80 portundan** iletiyor. Yani proxy kuralı `ssl.conf`'a
değil, `httpd.conf`'taki `<VirtualHost *:80>` bloğuna eklenmeli (Jelastic
zaten orada yorum satırı halinde bir websocket şablonu bırakıyor):

```bash
sed -i '/<\/VirtualHost>/i\
    ProxyPass /app ws://127.0.0.1:8080/app\
    ProxyPassReverse /app ws://127.0.0.1:8080/app' /etc/httpd/conf/httpd.conf
apachectl configtest && systemctl restart httpd
```

Doğrulama (dışarıdan, HTTP/1.1 zorlanarak — HTTP/2'de upgrade header'ları
işe yaramaz):
```bash
curl -i -N --http1.1 -H "Connection: Upgrade" -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Version: 13" -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" \
  "https://<domain>/app/<REVERB_APP_KEY>"
```
`101 Switching Protocols` + `X-Powered-By: Laravel Reverb` dönmeli.

**5) ⚠️ "Redeploy Containers" OS-seviyesi her şeyi sıfırlıyor**

Panelden "Redeploy Containers" yaptığınızda `httpd.conf` (DocumentRoot +
ProxyPass düzeltmeleri dahil) VE `yum`/`dnf` ile kurulan `supervisor`
paketi **tamamen sıfırlanıyor** — sadece `/var/www/webroot/ROOT` (kod +
`.env`) kalıcı volume'da kalıp hayatta kalıyor. Her redeploy sonrası
madde 1 ve bu maddedeki adımların TEKRAR yapılması gerekir.

`supervisor` paketi tekrar `yum install` ile kurulamıyorsa (`pip3` de
PATH'te yoksa), en basit geçici çözüm — **root gerektirmez, ama otomatik
yeniden başlama YOK, node restart'ında elle tekrar çalıştırılmalı**:

```bash
cd /var/www/webroot/ROOT
nohup php artisan reverb:start --host=0.0.0.0 --port=8080 > storage/logs/reverb-bg.log 2>&1 &
nohup php artisan horizon > storage/logs/horizon-bg.log 2>&1 &
disown -a
```

Kalıcı bir çözüm (örn. cron `@reboot` girdisi, ya da Jelastic'in
"Deployment Manager"ı üzerinden `setup-supervisor` action'ını yeniden
tetiklemek) henüz kurulmadı — ayrı bir iş.

**Not (2026-07-16):** Yukarıdaki `horizon` komutu daha önce
`Command "horizon" is not defined` hatası veriyordu — `laravel/horizon`
paketi hiçbir zaman `composer.json`'a eklenmemişti (yerelde de yoktu),
sadece manifest'in supervisor `.ini`'si onu varsayıyordu. Artık
`composer.json`'a eklendi ve commit'lendi; production'da bu komutun
çalışması için `git pull`'un ardından **`composer install --no-dev
--optimize-autoloader`** çalıştırılması ŞART (sadece kod dosyaları değil,
`vendor/laravel/horizon` da gelmeli).

**6) Scheduler cron'u — ZORUNLU, yoksa zamanlanmış işler hiç çalışmaz**

`routes/console.php`'deki `Schedule::command(...)` satırları (`matches:sweep`,
`results:auto-confirm`, `users:purge`, bildirim hatırlatmaları, haftalık
özet) yalnızca `php artisan schedule:run` her dakika tetiklenirse çalışır.
Bunu yapan bir cron kurulmadan bu işlerin HİÇBİRİ sessizce çalışmaz —
2026-07-16'da "maç tarihi geçti ama 'Videonu bul' butonu çıkmadı"
şikayetiyle fark edildi: `matches:sweep` çalışmadığı için maç durumu hiç
`confirmed`'den `played`'e dönmemiş. `cp` node'unda **root olarak**:

```bash
echo "* * * * * apache cd /var/www/webroot/ROOT/api && php artisan schedule:run >> /dev/null 2>&1" > /etc/cron.d/sahana-schedule
chmod 644 /etc/cron.d/sahana-schedule
systemctl enable --now crond || systemctl enable --now cron || service crond start || service cron start
```

Geriye dönük birikmiş işleri hemen yakalamak için tek seferlik (apache
kullanıcısıyla, `ROOT/api` içinde):

```bash
php artisan matches:sweep
php artisan results:auto-confirm
```

Bu cron da madde 5'teki gibi "Redeploy Containers"tan etkilenebilir
(OS-seviyesi state) — henüz doğrulanmadı, kontrol edilmeli.

**7) Mobil `.env.production`**

`mobile/.env.production` (repoda, gitignored) prod domain'ini kullanacak
şekilde güncellenmeli — `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_REVERB_*`,
`EXPO_PUBLIC_SENTRY_DSN`. Gerçek cihazda test için yeni bir EAS build
gerekir.

## Zaten kurulu (eski yapıdaki) bir environment'ı git yapısına geçirme

2026-07-16'dan önce kurulmuş environment'larda `ROOT` `git pull` çalıştıramaz
(`.git` hiç yok — eski manifest sadece dosyaları kopyalıyordu). Tek seferlik
geçiş, `cp` node'unda:

```bash
cd /var/www/webroot/ROOT
cp .env /tmp/sahana-env-backup      # ZORUNLU — aşağıda geri yazılacak
cd /tmp
git clone https://github.com/talhabekci/sahana.git sahana-new
rm -rf /var/www/webroot/ROOT
mv /tmp/sahana-new /var/www/webroot/ROOT
cp /tmp/sahana-env-backup /var/www/webroot/ROOT/api/.env
cd /var/www/webroot/ROOT/api
curl -sS https://getcomposer.org/installer | php
php composer.phar install --no-dev --optimize-autoloader --no-interaction
php artisan config:clear
```

Sonra madde 1'i (DocumentRoot artık `ROOT/api/public`) ve madde 4'ü (Reverb
ProxyPass — path değişmedi, dokunmaya gerek yok) tekrar uygula, Horizon/
Reverb'i yeniden başlat (madde 5). `storage/` klasörü (loglar, R2
kullanıldığı için yerel medya yok) yeni clone'da boş gelir — sorun değil,
`storage/logs` ve `bootstrap/cache` yazılabilir olmalı:

```bash
chmod -R 755 /var/www/webroot/ROOT/api/storage /var/www/webroot/ROOT/api/bootstrap/cache
```

## Güncelleme akışı (her API değişikliğinde)

Staging ortamı yok, CI/CD otomasyonu kurulmadı — kullanıcı bilinçli olarak
basit/manuel bir akış tercih etti (migration'ı gözle görüp onaylamak,
otomatik git-push-tetikler-deploy'dan daha güvenli görüldü):

1. **Lokalde:** kod değişikliği + ilgili Pest testleri yaz/çalıştır
   (`php artisan test`), Pint + Larastan temiz olsun.
2. `git commit` + `git push` (main).
3. `cp` node'una SSH ile bağlan (panel → environment → SSH).
4. ```bash
   cd /var/www/webroot/ROOT
   git pull
   ```
5. Sadece gerekliyse (her deploy'da değil, `cd api` sonrası):
   - `composer.json` değiştiyse: `composer install --no-dev --optimize-autoloader`
   - Yeni migration varsa: `php artisan migrate --force`
   - `.env` değiştiyse: `php artisan config:clear`
6. Değişiklik Horizon job'larını veya Reverb/broadcasting event'lerini
   etkiliyorsa, madde 5'teki (yukarıdaki, Reverb bölümü) `nohup` süreçlerini
   yeniden başlat (eski PID'leri `pkill -f "artisan reverb:start"` /
   `pkill -f "artisan horizon"` ile durdurup aynı `nohup` komutlarını tekrar
   çalıştır) — kod `git pull` ile güncellense de PHP süreçleri eski kodu
   bellekte tutmaya devam eder.

**Not:** `/var/www/webroot/ROOT` kalıcı volume'da olduğu için "Redeploy
Containers"tan etkilenmez, `git pull` sorunsuz çalışmaya devam eder — ama
Apache config'i (DocumentRoot/ProxyPass) yine elle düzeltilmesi gerekir
(yukarıdaki madde 5).

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
