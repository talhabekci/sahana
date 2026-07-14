# Production Readiness — Kontrol Listesi

> MVP modülleri (1-8 Aşama 1) tamamlandıktan sonra ürünü yayına hazırlamak
> için gereken, henüz kodlanmamış işler. BACKLOG.md ile aynı disiplin:
> bir madde ele alınmaya başlanınca ilgili spec/doc güncellenir, kodlanır,
> test edilir, commit'lenir, burada ✅ işaretlenir. **Tek seferde tek madde.**
>
> Mimari kararlar zaten netleşmiş durumda (bkz. tech-stack.md "Altyapı"
> bölümü), ama repoda henüz hiç Docker/deploy/observability kodu yok —
> bu liste o boşluğu somut, sıralı işlere döküyor.

## Açık Maddeler

### A. Altyapı / Deploy
- **Durum:** Repoda `docker-compose.yml`/`Dockerfile` yok. tech-stack.md
  hedefi: Hetzner VPS + Docker Compose (nginx, php-fpm, mysql:8, mongo:7,
  redis:7, horizon, reverb) + Cloudflare (DNS/CDN/R2).
- **Karar bekliyor:** VPS zaten kiralandı mı (Hetzner hesabı/sunucu var mı),
  domain hazır mı? Bunlar olmadan deploy pipeline'ı yazılabilir ama test
  edilemez.
- **Yapılacaklar:** `Dockerfile` (php-fpm), `docker-compose.yml`,
  nginx config + TLS (Let's Encrypt/Certbot), `.env.production` şablonu,
  GitHub Actions deploy workflow (mevcut `api-ci.yml`/`mobile-ci.yml`'e ek).
- **PHP upload limitleri (BACKLOG #40'tan öğrenildi, 2026-07-11):** PHP'nin
  varsayılan `upload_max_filesize=2M` / `post_max_size=8M` değerleri video
  yüklemeyi (100MB'a kadar) ve büyük görselleri kırar. Lokalde `composer serve`
  script'i bunları `-d` bayraklarıyla yükseltiyor; production php.ini/fpm
  havuzunda `upload_max_filesize=120M`, `post_max_size=125M` (+ nginx
  `client_max_body_size 125m`) ayarlanmalı.
- **Medya servisi (BACKLOG #50'den öğrenildi):** tüm yüklenen medya artık
  `/media/{path}` route'undan (PHP üzerinden, Range destekli) servis
  ediliyor. Prod'da nginx ile `location /media/` doğrudan
  `storage/app/public`'e alias'lanarak PHP atlanabilir (nginx statikte
  Range'i doğal destekler) — opsiyonel performans işi, davranış aynı.
- **APP_URL (BACKLOG #38'den öğrenildi):** `Storage::url()` medya linklerini
  APP_URL'den üretir — prod `.env`'de gerçek alan adı olmalı, yoksa hiçbir
  yüklenen medya istemcide görüntülenmez.

### B. Queue — `sync`'ten çıkış
- **Durum:** `.env.example`'da `QUEUE_CONNECTION=sync` — bildirim/video
  gibi işler prod'da request içinde senkron çalışır, Horizon zaten kurulu
  (composer.json) ama hiç kullanılmıyor.
- **Yapılacaklar:** Prod `.env` için `QUEUE_CONNECTION=redis` +
  `horizon` servisinin compose'a eklenmesi (madde A ile birleşebilir).

### C. Medya depolama — Cloudflare R2 bağlantısı ✅ (kod tarafı)
- **Durum:** Kullanıcı R2 bucket'ının hazır olduğunu onayladı. Kod tarafı
  tamamlandı: `league/flysystem-aws-s3-v3` kuruldu (mevcut generic `s3`
  disk zaten `endpoint`/`use_path_style_endpoint` destekliyor — R2 S3 API
  uyumlu olduğu için ayrı bir `r2` disk tanımına gerek yoktu). Yeni
  `config('filesystems.media_disk')` (env: `MEDIA_DISK`, varsayılan
  `public`) tek kaynak oldu; daha önce 6 farklı yerde (`ImageUploader`,
  `MediaController`, `VideoController`, `DirectMessageController`,
  `TeamMessageController`, `CreatePost`) hardcode edilmiş `'public'` disk
  referansları buradan okuyacak şekilde değiştirildi. `ImageUploader::url()`
  artık `media_disk` local değilse diskin kendi genel URL'ini dönüyor
  (`/media/...` PHP proxy'si atlanıyor — R2/Cloudflare Range'i native
  destekliyor). `/media/{path}` route'u artık `media_disk` public değilken
  güvenli şekilde 404 dönüyor (önceden `Storage::path()` uzak diskte patlardı).
- **Kalan:** Prod sunucusunun gerçek `.env`'ine (asla commit edilmeyecek)
  `MEDIA_DISK=s3` + R2'nin gerçek `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`/
  `AWS_BUCKET`/`AWS_URL`/`AWS_ENDPOINT` değerlerinin girilmesi — bu madde
  A/deploy'un parçası, kod tarafında ek iş yok.
- **Test:** `tests/Feature/ImageUploaderTest.php`, `tests/Feature/MediaRouteTest.php`
  (yeni 404 guard testi).

### D. Güvenlik taraması ✅
- **Durum:** OTP endpoint'i zaten iyi korunuyordu (`RateLimiter` ile
  3/saat/identifier + 10/saat/IP + 5 yanlış denemede kilit — spec'e
  birebir uygun, dokunulmadı). Kalan iki boşluk kapatıldı:
  - `config/cors.php` eklendi — `allowed_origins` artık `CORS_ALLOWED_ORIGINS`
    env değişkeninden okunuyor (virgülle ayrılmış liste), varsayılan boş
    (hiçbir origin'e izin yok). Mobil istemci Bearer token kullandığı için
    CORS'tan etkilenmiyor; bu sadece ileride eklenebilecek bir web paneli
    için.
  - Genel API'ye `throttle:api` (60/dk, kullanıcı ID veya IP'ye göre) tüm
    `v1` grubuna eklendi. Yorum, DM/takım mesajı, ilan başvurusu
    endpoint'lerine ayrıca `throttle:write` (20/dk) eklendi
    (`AppServiceProvider::boot()` + `routes/api.php`).
  - Prod `.env` için `APP_DEBUG=false`, `APP_ENV=production` hatırlatması
    hâlâ geçerli — bu bir deploy checklist maddesi, kod değil (madde A'da
    izlenebilir).
- **Test:** `tests/Feature/RateLimitTest.php` — 20 istekten sonraki 21.
  istek 429 dönüyor.

### E. Gözlemlenebilirlik — hata takibi
- **Durum:** Sentry (ya da benzeri) yok, ne API ne mobil. Şu an bir hata
  sadece `storage/logs`'a düşüyor.
- **Karar bekliyor:** Sentry hesabı (ücretsiz tier yeterli olabilir) — DSN
  kullanıcı tarafından oluşturulmalı, ben hesap açamam.
- **Yapılacaklar:** `sentry/sentry-laravel` (API) + `@sentry/react-native`
  (mobil) kurulumu, DSN env değişkenleri, prod'da aktif/dev'de kapalı.

### F. Store submission (mobil)
- **Durum:** Kullanıcı Apple Developer / Google Play Console hesaplarının
  hazır olduğunu onayladı. İkon/splash artık placeholder değil (gerçek marka
  görselleri — bkz. PROGRESS.md 2026-07-13/14 kayıtları). İzin metinleri
  taranıp eksik olan tek kalem (konum — `expo-location` kullanılıyor ama
  plugin'de Türkçe açıklama yoktu) kapatıldı: `app.json`'a
  `locationWhenInUsePermission` eklendi. Kamera/galeri/mikrofon zaten
  önceden yapılandırılmıştı.
- **Kalan:** EAS production build alıp gerçek submit'i denemek, store
  listing metni/görselleri (ekran görüntüleri, açıklama, kategori) ve
  gizlilik politikası URL'i (madde G'nin canlıda yayınlanmış hâli) hazırlamak
  — bunlar kod değişikliği değil, gerçek bir üretim build'i ve store
  hesabı işlemleri; kullanıcıyla birlikte ayrı bir oturumda ele alınmalı.

### G. Yasal — gizlilik politikası / KVKK / kullanım şartları — taslak yazıldı, onay bekliyor
- **Durum:** Kullanıcı taslağı yazmamı istedi. `mobile/src/features/settings/legalContent.ts`
  içinde üç belge (gizlilik politikası, KVKK aydınlatma metni, kullanım
  şartları) Türkçe taslak olarak yazıldı; `settings/legal/[slug].tsx`
  artık placeholder yerine bu içeriği gösteriyor. İçerik ürünün gerçek veri
  modeline dayanıyor (e-posta ile giriş, profil alanları, medya/mesaj/konum
  verisi, Cloudflare R2 ve FCM/Expo gibi işlemciler, hesap silme akışı).
- **Kalan:** Bu **nihai bir hukuki metin değil** — kullanıcı (istenirse bir
  avukat) tarafından gözden geçirilip onaylanmadan yayına çıkılmamalı.
  İletişim e-postası da placeholder (`[iletişim e-postası buraya eklenecek]`)
  — gerçek adres belirlenince doldurulmalı. Onaylanınca bu madde ✅ olarak
  işaretlenecek.

### H. Veri yedekleme
- **Durum:** tech-stack.md `mysqldump + mongodump → R2 (günlük, cron)`
  planlıyor, hiç yazılmadı. Madde A/C ile birlikte ele alınmalı (VPS +
  R2 hazır olmadan test edilemez).

## Triyaj Kuralı
BACKLOG.md ile aynı: yeni bir üretim-hazırlığı ihtiyacı doğduğunda önce
buraya madde olarak eklenir, kullanıcı önceliklendirince kodlanır.
