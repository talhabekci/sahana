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

### C. Medya depolama — Cloudflare R2 bağlantısı
- **Durum:** `AWS_*` env değişkenleri boş; `FILESYSTEM_DISK=local`.
  tech-stack.md R2'yi (S3-uyumlu) planlıyor ama hiç bağlanmadı.
- **Karar bekliyor:** R2 bucket'ı oluşturuldu mu, access key var mı?
- **Yapılacaklar:** `config/filesystems.php`'e R2 disk tanımı, prod env
  değerleri, mevcut foto/video upload kodunun (varsa `local` disk'e sabit
  referansı) `Storage::disk(config(...))` üzerinden gitmesinin doğrulanması.

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
- **Durum:** EAS production build profili var ama hiç submit denenmedi.
  İkon/splash placeholder olabilir, izin metinleri (konum, kamera/galeri,
  bildirim) App Store/Play Store'un zorunlu tuttuğu formatta yazılmamış.
- **Karar bekliyor:** Apple Developer / Google Play Console hesapları
  hazır mı?
- **Yapılacaklar:** `app.json` izin açıklamaları (`NSLocationWhenInUseUsageDescription`
  vb.), store listing metni/görselleri, gizlilik politikası URL'i (madde G'ye bağlı).

### G. Yasal — gizlilik politikası / KVKK / kullanım şartları
- **Durum:** Mobil UI iskeleti hazır (Backlog #29 — `settings/legal/[slug].tsx`,
  ayarlar ekranından erişiliyor) ama gerçek metin hâlâ yok, placeholder
  gösteriyor. Sosyal ağ + konum + push + kullanıcı içeriği barındıran bir
  uygulama için hem store submission hem KVKK açısından zorunlu.
- **Karar bekliyor:** Metni kim yazacak/onaylayacak (hukuki içerik — ben
  taslak önerebilirim ama nihai onay kullanıcıda olmalı).

### H. Veri yedekleme
- **Durum:** tech-stack.md `mysqldump + mongodump → R2 (günlük, cron)`
  planlıyor, hiç yazılmadı. Madde A/C ile birlikte ele alınmalı (VPS +
  R2 hazır olmadan test edilemez).

## Triyaj Kuralı
BACKLOG.md ile aynı: yeni bir üretim-hazırlığı ihtiyacı doğduğunda önce
buraya madde olarak eklenir, kullanıcı önceliklendirince kodlanır.
