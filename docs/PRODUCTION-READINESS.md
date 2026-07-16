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

### A. Altyapı / Deploy — Virtuozzo Jelastic'te CANLI ✅ (Reverb dahil, tamamı)
- **Durum (2026-07-14):** Hetzner+Docker planı terk edildi, Virtuozzo Jelastic
  PaaS kullanıldı. `deploy/virtuozzo/manifest.jps` ile 4 node açıldı (PHP-FPM/
  apache, MySQL, MongoDB, Redis), gerçek bir kurulumla test edildi ve birkaç
  gerçek hata bulunup düzeltildi:
  - `setup-supervisor` action'ında `user: root` eksikti + node CentOS/RHEL
    olduğu için `apt-get` yoktu (yum/dnf fallback eklendi).
  - Apache'nin doküman kökü Laravel'in TAMAMINI (`.env` dahil) serviş
    ediyordu → `/api/v1/health` 404 dönüyordu. Kullanıcı `webroot/ROOT`'u
    gerçek klasör olarak tutmayı tercih etti, Apache'nin `DocumentRoot`'unu
    elle `webroot/ROOT/public`'e çevirerek çözdü (manifest'e otomatikleştirme
    eklenmedi — vhost dosyasının tam yolu Jelastic sürümüne göre değişebilir,
    README'de adım adım anlatıldı).
  - `APP_KEY` boştu, `php artisan key:generate` elle çalıştırıldı.
  - Redis `NOAUTH` hatası — Jelastic'in Redis node'u parola korumalı ama
    `skipNodeEmails: true` yüzünden mail gelmedi; parola Redis node'unun
    `/etc/redis.conf`'undaki `requirepass` satırından bulundu.
  - Domain (`sahana-app.com`) alınıp Cloudflare'a bağlandı, `api.sahana-app.com`
    CNAME ile environment'a yönlendirildi — ama DNS eklemek yetmedi, Jelastic
    panelinde ayrıca **Custom Domains** altında bind edilmesi gerekti (bind
    edilmeden "environment could not be found via specified host" hatası
    veriyordu).
  - R2 custom domain (`media.sahana-app.com`) bağlandı, gerçek bir dosya
    yazılıp okunarak uçtan uca doğrulandı (bkz. madde C).
- **Doğrulanmış canlı durum:** `https://api.sahana-app.com/api/v1/health` →
  `{"data":{"status":"ok"}}`. DB/Mongo/Redis/R2 hepsi gerçek trafikle test
  edildi.
- **Reverb (websocket) çözüldü:** Jelastic'in Shared Load Balancer'ı 443'ü
  kendi sertifikasıyla karşılayıp Apache'ye **80** portundan düz HTTP olarak
  iletiyor (`apachectl -S` `*:443` hiç göstermiyor, sadece `*:80`) — bu
  yüzden proxy kuralı `ssl.conf`'a değil `httpd.conf`'taki `<VirtualHost *:80>`
  bloğuna eklendi: `ProxyPass /app ws://127.0.0.1:8080/app` +
  `ProxyPassReverse`. `mod_proxy_wstunnel` zaten yüklüydü. Dışarıdan
  `curl` ile websocket upgrade doğrulandı (`101 Switching Protocols`,
  `X-Powered-By: Laravel Reverb`).
- **Kırılganlık (önemli):** "Redeploy Containers" paneldeki işlemi
  `httpd.conf`'u VE `supervisor` paketini (OS-seviyesi, kalıcı volume'da
  değil) sıfırlıyor — `.env`/kod (webroot altında) kalıcı kalıyor. Bu
  yüzden DocumentRoot + ProxyPass düzeltmeleri her "Redeploy Containers"
  sonrası TEKRAR yapılmalı. `supervisor` paketi de (`yum`) siliniyordu ve
  `pip3`/`supervisord` PATH'te bulunamadı; şu an Reverb+Horizon `nohup` ile
  arka planda çalışıyor (`disown`'lı) — **node yeniden başlarsa ya da
  process ölürse otomatik geri gelmez**, elle tekrar başlatılması gerekir.
  Kalıcı bir çözüm (cron `@reboot`, ya da Jelastic'in "Deployment Manager"ı
  üzerinden supervisor kurulumunu yeniden tetiklemek) henüz kurulmadı.
- Mobil `.env.production` yazıldı ama gerçek cihazda test için yeni bir
  EAS build gerekiyor.
- **Eski plan (artık geçersiz):** tech-stack.md hâlâ Hetzner VPS + Docker
  Compose yazıyor — Virtuozzo'ya geçiş netleşti, tech-stack.md'nin
  güncellenmesi ayrı bir iş (henüz yapılmadı).
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

### B. Queue — `sync`'ten çıkış ✅ (2026-07-16)
- **Durum:** Prod `.env`'de `QUEUE_CONNECTION=redis` zaten ayarlıydı, ama
  `laravel/horizon` **hiçbir zaman `composer.json`'a eklenmemişti** (daha
  önceki bir kayıt "Horizon zaten kurulu" diyordu — bu yanlıştı, hiç
  doğrulanmamıştı). Kullanıcı prod'da `nohup php artisan horizon`
  denediğinde `Command "horizon" is not defined` hatası aldı — bu yüzden
  kuyruğa düşen tek e-posta (`OtpCodeMail`, `ShouldQueue`) worker
  çalışmadığı için Redis'te sonsuza kadar bekliyordu, hiç işlenmiyordu.
  `composer require laravel/horizon` + `horizon:install` ile düzgünce
  kuruldu, `config/horizon.php`'deki production `maxProcesses` (stock
  varsayılan 10) gerçek kuyruk hacmine (OTP maili + push bildirimi, düşük
  hacim) göre 2'ye düşürüldü — küçük Jelastic node'unda gereksiz kaynak
  tüketmesin diye. Larastan/Pint/Pest (288 test) temiz.
- **Kalan:** Production'da `git pull` + **`composer install`** (sadece
  kod değil, `vendor/laravel/horizon` gelmesi için) çalıştırılıp
  `nohup php artisan horizon ...` yeniden başlatılmalı — bkz.
  `deploy/virtuozzo/README.md` madde 5'teki not. Kalıcı (crash-safe)
  worker süreci hâlâ açık bir iş (madde A'daki supervisor kırılganlığıyla
  aynı kök sorun).

### C. Medya depolama — Cloudflare R2 bağlantısı ✅ (uçtan uca doğrulandı)
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
- **Canlı doğrulama (2026-07-14):** Prod sunucusunda `MEDIA_DISK=s3` +
  gerçek R2 kimlik bilgileri girildi. Bucket'a (`sahana-media`) Cloudflare'da
  custom domain (`media.sahana-app.com`) bağlandı — `AWS_URL` buna
  ayarlandı. `php artisan tinker` ile gerçek bir dosya yazılıp hem API
  üzerinden hem `https://media.sahana-app.com/...` üzerinden okunarak
  uçtan uca doğrulandı (r2.dev yerine gerçek custom domain kullanıldı,
  Cloudflare'ın kendi "production'da kullanma" uyarısına uyuldu).
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

### E. Gözlemlenebilirlik — hata takibi ✅
- **Durum:** Kullanıcı iki ayrı Sentry projesi açtı (API + mobil) ve DSN'leri
  verdi. `sentry/sentry-laravel` kuruldu; `sentry:publish` ile
  `config/sentry.php` yayınlandı ve test event/transaction gerçek Sentry'ye
  gönderildiği doğrulandı — ama `bootstrap/app.php`'e istisna raporlamayı
  bağlayan `Integration::handles($Exceptions)` çağrısı otomatik
  eklenmiyordu (Laravel 11+'ın yeni `withExceptions()` yapısı için elle
  eklenmesi gerekiyor), o satır eklendi. `SENTRY_LARAVEL_DSN` boşsa SDK
  sessizce devre dışı kalıyor. `send_default_pii` varsayılan `false`
  (KVKK'ya uygun — IP/header otomatik gönderilmiyor).
- Mobilde `@sentry/react-native` (`npx expo install`, config plugin
  `app.json`'a otomatik eklendi) kuruldu. `_layout.tsx`'te modül
  seviyesinde `Sentry.init()` çağrılıyor (`EXPO_PUBLIC_SENTRY_DSN` boşsa
  `enabled: false`), kök bileşen resmi Expo Router deseniyle
  `Sentry.wrap(RootLayout)` ile export ediliyor.
- **Test ortamı düzeltmesi:** İlk kurulumda `phpunit.xml`'e
  `SENTRY_LARAVEL_DSN` override eklenmediği için Pest test suite'i gerçek
  Sentry'ye network isteği atıyor, süre 2.4sn'den 70sn'ye çıkıyordu — boş
  DSN override'ı eklenip düzeltildi.
- **Kaynak harita (sourcemap) yükleme:** Kullanıcı resmi
  `npx @sentry/wizard@latest -i reactNative --saas --org sahana-zg --project react-native`
  komutunu kendi terminalinde çalıştırdı (ben çalıştıramadım — etkileşimli,
  tarayıcı girişi gerektiriyor). Wizard: `metro.config.js` oluşturdu
  (`getSentryExpoConfig` ile debug-id enjeksiyonu), `app.json`'a
  `@sentry/react-native/expo` config plugin'ini (org/project/url ile)
  ekledi, build-zamanı yükleme için `SENTRY_AUTH_TOKEN`'ı `.env.local`'e
  yazdı (`.gitignore`'a otomatik eklendi, commit edilmiyor). Wizard bu
  projede `App.js` bulamadığı için (Expo Router `_layout.tsx` kullanıyoruz)
  `Sentry.init()`/`Sentry.wrap()` snippet'lerini otomatik uygulayamadı —
  elle zaten mevcut olan koda (bkz. yukarıdaki madde) yeni DSN'i işledim,
  `enableLogs: true` eklendi (kullanıcı wizard akışında logs'u açık seçti).
  Not: wizard'ın seçtiği proje ID'si (`4511733650882640`), kullanıcının
  ilk verdiği DSN'deki proje ID'sinden (`4511733636989008`) farklı —
  muhtemelen ilk proje "ProjectId" hatasından sonra yeniden oluşturuldu;
  şu an geçerli/doğrulanmış olan bu yeni DSN kullanılıyor.

### F. Store submission (mobil)
- **Durum:** Kullanıcı Apple Developer / Google Play Console hesaplarının
  hazır olduğunu onayladı. İkon/splash artık placeholder değil (gerçek marka
  görselleri — bkz. PROGRESS.md 2026-07-13/14 kayıtları). İzin metinleri
  taranıp eksik olan tek kalem (konum — `expo-location` kullanılıyor ama
  plugin'de Türkçe açıklama yoktu) kapatıldı: `app.json`'a
  `locationWhenInUsePermission` eklendi. Kamera/galeri/mikrofon zaten
  önceden yapılandırılmıştı.
- **iOS (2026-07-16):** İlk EAS production build TestFlight'a yüklendi ama
  API'ye hiç istek gitmiyordu (gitignored `.env.production` EAS cloud
  build'de görünmüyor) — kullanıcı bu yüzden iOS build sürecini tamamen
  Xcode'a taşıdı (bkz. PROGRESS.md 2026-07-16). Xcode'dan alınan build
  (1.0.0/8) başarıyla TestFlight'a yüklendi ve cihazda güncelleme olarak
  göründü; gerçek cihazda API isteklerinin ulaştığı doğrulanmadı (kullanıcı
  henüz test etmedi). Release akışı `mobile/README.md`'ye yazıldı.
- **Android:** Ele alınmadı, kullanıcı muhtemelen Android Studio'dan manuel
  build alacak (ayrı bir oturum).
- **Kalan:** Cihazda gerçek API trafiğinin çalıştığını doğrulamak, store
  listing metni/görselleri (ekran görüntüleri, açıklama, kategori) ve
  gizlilik politikası URL'i (madde G'nin canlıda yayınlanmış hâli)
  hazırlamak, Android submission.

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
