# İlerleme Kaydı

> Her çalışma seansı buraya tarihli kayıt düşer. Yeni oturum işe başlamadan
> önce bu dosyayı okur. Format: en yeni kayıt en üstte.

## 2026-07-11 (19) — Backlog #54/#55: rozet sistemi + haftalık performans özeti

- Kullanıcı retention/rekabet fikri istedi ("bi heves olmalı, yeni
  yaratıcı bişeyler"); ikisine birden başlanması istendi.
- **#54 Rozetler:** yeni `player_badges` tablosu + `App\Support\
  BadgeCatalog` (5 rozet v1: `ilk_gol`, `hat_trick`, `seri_5` — üst üste
  5 maça gelme, `guvenilir` — %90+ katılım min 5 maç, `yildiz` — 8.5+
  ortalama reyting min 5 puan). Yeni `AwardBadges` action'ı —
  `EnterMatchResult` (attended belirlenince tüm RSVP=yes katılımcılar
  için), `SubmitPlayerStat` (kaptan girişi direkt onaylı olduğundan),
  `ApprovePlayerStat` (oyuncu-girişi sonradan onaylanınca), `SubmitRating`
  (her yeni puan sonrası ratee için) noktalarında tetiklenir; idempotent
  (`unique(user_id, badge_key)`). Yeni kazanılan rozet `auto_posts_enabled`
  açıksa `badge_earned` tipi otomatik gönderi olarak akışa düşer (mevcut
  `match_played`/`lineup_shared` deseniyle birebir). Yeni `GET /players/
  {id}/badges`; `PostResource`'a `badge` alanı. 8 yeni Pest testi.
- **#55 Haftalık özet:** yeni `recap:weekly` scheduled command (Pazar
  20:00) — `notifications:social-summary` ile aynı checkpoint deseni
  (`player_profiles.last_weekly_recap_at`). Son 7 günde en az 1 maça
  katılan her oyuncu için maç/gol/asist/ortalama puan hesaplanıp
  `weekly_recap` tipi gönderi olarak (`recap_data` JSON) akışa düşer;
  `auto_posts_enabled=false` gönderiyi atlar ama checkpoint yine
  güncellenir (spam önleme). 4 yeni Pest testi.
- **Mobil:** yeni `features/stats/BadgeRow.tsx` — kazanılan rozetlerin
  yatay vitrini, profil ve oyuncu profili ekranlarına `StatsCard`'ın
  altına eklendi (dokununca açıklama gösterir). `PostCard`'a
  `badge_earned` (rozet ikonu + etiket) ve `weekly_recap` (maç/gol/
  asist/puan özeti) kart render'ları eklendi — feed/profil/detayda
  otomatik geçerli, ekstra kod gerekmedi.
- **Yan ürün bug düzeltmesi:** `districts` migration'ı (BACKLOG #51'den)
  hiçbir zaman gerçek MySQL'e uygulanamamıştı — `city_id` yanlışlıkla
  `unsignedBigInteger` tanımlıydı, `cities.id` ise `unsignedSmallInteger`
  (plaka kodu); MySQL 8 FK tip uyuşmazlığını reddediyor. SQLite (test DB)
  bu uyuşmazlığı sessizce kabul ettiğinden testler yakalamamıştı. Migration
  dosyası düzeltildi (hiçbir gerçek DB'de başarıyla çalışmamıştı, ek
  migration yerine doğrudan düzeltme yapıldı), districts yeniden seed'lendi.
- Doğrulama: api 275 test (12 yeni) + Pint + Larastan temiz; mobil tsc +
  lint temiz.
- Not: `recap:weekly` prod'da cron/scheduler çalışır durumda olmalı
  (mevcut `matches:sweep` vb. ile aynı altyapı — PRODUCTION-READINESS.md
  madde A'ya bağlı, ayrı bir iş değil).

## 2026-07-11 (18) — Backlog #53: aramada takım sayfası açılmıyordu + kendi hesabın çıkıyordu

- **Takım sayfası açılmıyordu:** `TeamPolicy::view` üyelik şartı koyuyordu;
  arama/keşiften üyesi olmadığın bir takıma dokununca `GET /teams/{id}`
  403 dönüyor, mobil ekran bunu ele almadığı için sonsuz "yükleniyor"
  görünüyordu. `TeamController::show`'daki authorize kaldırıldı — takım
  profili artık oyuncu profili gibi herkese açık. Sohbet
  (`TeamMessageController`, hâlâ `TeamPolicy::view`'i kullanıyor — o
  metod bilerek üyelik şartını korudu) ve kadro yönetimi
  (`manageLineups`) üyeliğe bağlı kaldı. Mobil `team/[id]/index.tsx`'e
  `IAmMember` eklendi — üye olmayan görüntüleyende sohbet/kadro/
  ayrıl-sil bölümleri gizleniyor, `listLineups` isteği hiç atılmıyor
  (`enabled: my_role != null`).
- **Kendi hesabın aramada çıkıyordu:** `SearchController` oyuncu
  aramasında `where('id', '!=', viewer)` eksikti. Takip butonu zaten
  kendine özel gizliydi (`PlayerPublicResource.is_following` kendine
  `null` dönüyor) ama arama sonucunda görünmen başlı başına yanlıştı.
- 4 yeni Pest testi (263 toplam) — takım profilinin herkese açık olduğu
  + sohbet/kadronun hâlâ korunduğu + aramanın kendini hariç tuttuğu.
  Pint + Larastan temiz. Mobil tsc + lint temiz.
- Spec güncellendi: 02-team-lineup.md (`GET /teams/{id}` herkese açık
  notu), 04-social-feed.md (arama kendini hariç tutuyor notu).

## 2026-07-11 (17) — Backlog #51/#52: ilçe ve doğum tarihi seçmeli oldu

- **#51 (ilçe):** yeni `districts` tablosu (city_id = plaka) +
  `DistrictSeeder` — 970 ilçe, harici veri setinden Türkçe başlık
  düzeltmesi ve TR alfabetik sırayla üretildi; `GET /cities/{id}/districts`
  ucu + test. Mobilde profil düzenlemedeki ilçe alanı şehre bağlı seçici
  oldu (şehir değişince sıfırlanır). `player_profiles.district` metin
  olarak kalıyor (geriye uyumlu, şema değişikliği yok).
- **#52 (doğum tarihi):** GG/AA/YYYY metin girişleri yerine gün/ay/yıl
  kolonlu GlassView sheet seçicisi — native datetimepicker bağımlılığı
  eklenmedi (rebuild yok); geçersiz tarih oluşamaz (gün, ayın gün sayısına
  kırpılır), Temizle ile boşaltılabilir.
- Doğrulama: api 260 test + Pint + Larastan; mobil tsc + lint temiz.
- Not: lokal DB'ye migrate + seed uygulandı; testler `$seed = true`
  ile ilçeleri otomatik yüklüyor.

## 2026-07-11 (16) — Backlog #50: video/ses oynatılamıyor (HTTP Range)

- **Kök neden:** PHP yerleşik dev sunucusu `/storage/...` statiklerinde
  HTTP Range desteklemiyor; AVPlayer/ExoPlayer Range olmadan medya
  akıtamadığından yüklenen video ve sesli mesajlar cihazda hiç
  oynatılamıyordu (kullanıcının "uygulama içi oynatıcıda sorun mu var"
  şüphesi — oynatıcı sağlamdı, sunucu 206 dönmüyordu).
- **Düzeltme (platform bağımsız — kullanıcı özellikle sordu, iOS'a özel
  değil):** yeni `GET /media/{path}` route'u + `MediaController`,
  `BinaryFileResponse` ile Range'i Symfony'ye işletiyor; yol kaçışı
  koruması var. `ImageUploader::url()` artık `/media/...` üretiyor;
  `TeamResource.logo_url` ve `PostResource.image_url` da aynı merkeze
  bağlandı. Mobilde değişiklik gerekmedi (URL'ler API'den geliyor,
  eski mesajlar dahil her şey otomatik düzeldi).
- Doğrulama: 4 yeni Pest testi (259 toplam, 206 + Content-Range
  assert'leri), Pint + Larastan temiz; gerçek .mov dosyasıyla canlı
  sunucuda `Range: bytes=0-99` → 206, content-type video/quicktime,
  100 bayt — uçtan uca kanıtlandı.
- Prod notu: nginx `location /media/` alias'ı ile PHP atlanabilir
  (opsiyonel) — PRODUCTION-READINESS.md madde A'ya eklendi.

## 2026-07-11 (15) — 4. tur: feed'de kendi postlar (#49) + serve script düzeltmesi

- **#49:** takımsız postlar yazarın kendi akışında hiç görünmüyordu —
  feed sorgusunda "kendi postların" koşulu yoktu (takım postları +
  takip edilenler vardı, kullanıcı kendini takip etmediği için kendi
  içeriği dışarıda kalıyordu). `BuildFeed`'e `orWhere(user_id, viewer)`
  eklendi; 1 yeni Pest testi (255 toplam).
- **Video "Doğrulama hatası" (tekrar) — kök neden benim önceki
  düzeltmemdeki kusur:** `composer serve`'deki `-d` limit bayrakları
  `artisan serve`'ün başlattığı ALT sürece geçmiyormuş; kullanıcı
  script'i kullansa bile limitler 2M/8M kalıyordu. Script PHP yerleşik
  sunucusunu doğrudan başlatacak şekilde değiştirildi ve 12MB'lık test
  POST'uyla doğrulandı (PHP uyarısı yok, istek Laravel'e ulaşıyor).
  Kullanıcının API'yi durdurup `composer serve` ile yeniden başlatması
  gerekiyor. Kod regresyonu YOKTU — video yükleme cihazda hiçbir zaman
  bu limitlerle çalışmamıştı.

## 2026-07-11 (14) — Backlog #46/#47/#48: 3. tur bug düzeltmeleri

- **#46:** `PostResource`'un `video` bloğu `video_url` dönmüyordu —
  yüklenen maç videosunun feed kartı `url`'e (NULL) bakıp hiçbir şey
  yapmıyordu. Alan eklendi; `video_shared` kartı yüklenen videoyu satır
  içi `PostVideoPlayer` ile oynatıyor, maç detayındaki satır uygulama
  içi oynatıcı modalı açıyor (harici linkler tarayıcıda kalıyor).
- **#47:** iOS sessiz anahtarı açıkken ses kısılıyordu — "oynatılmıyor"
  şikayetinin nedeni. `VoiceMessageBubble` çalmadan önce
  `setAudioModeAsync({ playsInSilentMode: true })` çağırıyor.
- **#48:** sohbette fotoğraf/ses artık seçilir seçilmez gitmiyor —
  composer üstünde bekleyen ek önizlemesi (X ile kaldırılabilir),
  gönderim yalnızca gönder butonuyla; metin+medya birlikteyse iki ayrı
  mesaj (önce medya).
- Doğrulama: api 254 test + Pint + Larastan temiz; mobil tsc + lint temiz.
- Hatırlatma: 4 yeni native modül (`expo-image-manipulator`, `expo-audio`,
  `expo-video`, `expo-blur`) tek `eas build --profile development`
  bekliyor; lokal API `composer serve` ile başlatılmalı.

## 2026-07-11 (13) — Backlog #43: liquid glass (ilk dalga) + 3. tur cihaz geri bildirimi

- **#43:** yeni `shared/ui/GlassView.tsx` (`expo-blur`) — tab bar saydam +
  absolute + buzlu cam arka plan (tab ekranlarının alt boşlukları yüzer
  bara göre artırıldı); maç kur / maç detayı / profil düzenleme bottom
  sheet'leri GlassView'a geçti. Kartlar bilinçli solid (performans).
  Efekt yeni development build gerektiriyor (expo-blur native).
- Kullanıcı 3. tur cihaz testinden 6 madde bildirdi: #46 (yüklenen maç
  videosu feed'de oynamıyor + uygulama içi oynatma), #47 (ses kayıtları
  sessiz modda duyulmuyor), #48 (sohbet medyası önizlemesiz hemen
  gidiyor) BACKLOG'a eklendi. "Liquid glass görünmüyor" = rebuild
  gerekiyor (4 yeni native modül birikti); PHP 8MB POST limiti hatası =
  API hâlâ eski komutla çalışıyor, `composer serve` ile başlatılmalı
  (kullanıcıya iletildi).

## 2026-07-11 (12) — Backlog #37: akış gönderisine video ekleme

- **Backend:** `posts.video_path` (nullable, yeni migration — `video_id`
  maça bağlı Modül 5 videolarına işaret eder, bu ayrı bir kavram).
  `POST /posts` artık multipart `video` kabul ediyor: mp4/mov/m4v +
  `mimetypes` doğrulaması, max 100MB, `prohibits:image` (aynı gönderide
  foto+video birlikte reddedilir). `CreatePost` ham dosyayı
  `post-videos/` altına kaydediyor; `PostResource`'a `video_url` eklendi.
  3 yeni Pest testi (254 toplam), Pint + Larastan temiz.
- **Mobil:** YENİ native modüller `expo-video` + `expo-blur` birlikte
  kuruldu (tek EAS rebuild'de test edilebilsin diye — #43 liquid glass
  expo-blur'u kullanacak). post/create'te "Medya ekle" menüsü: kamera /
  galeriden fotoğraf / galeriden video (max 90 sn, iOS'ta 720p re-encode +
  seçimde kırpma — maç videosuyla aynı desen). Video yüklemesi yüzde
  göstergeli. Akışta yeni `PostVideoPlayer` (`expo-video`): native
  kontrollü, otomatik oynatmayan gömülü oynatıcı — PostCard'a eklendi,
  feed/profil/post detayında geçerli.
- Doğrulama: tsc + lint temiz.
- **Not:** `expo-video` + `expo-blur` + (önceki turdan `expo-image-
  manipulator` + `expo-audio`) için tek bir yeni development build
  yeterli — kullanıcının `eas build --profile development` alması gerekiyor.

## 2026-07-11 (11) — Backlog #33: ilanlar için paylaşılabilir link

- **Mobil:** yeni `features/match/shareListing.ts` — takım davet linkiyle
  aynı desen (`Linking.createURL`), "Linki kopyala" / "Paylaş…" seçenekleri.
  `PlayerListingCard` ve `OpponentListingCard`'a paylaş ikonu eklendi
  (kartlar Keşfet'te ve feed'de kullanıldığından tek değişiklikle her
  yerde geçerli). Yeni deep-link hedef ekranları: `listing/[id].tsx` ve
  `opponent-listing/[id].tsx` — ilan kartı + başvur/eşleş aksiyonları;
  girişsiz kullanıcı welcome'a yönlenir (davetteki "bekleyen kod" v1'de
  ilanlara uygulanmadı, giriş sonrası linke tekrar tıklamak yeterli —
  spec'e not düşüldü).
- **Backend:** eksik olan `GET /opponent-listings/{id}` (show) eklendi
  (`GET /listings/{id}` zaten vardı). 1 yeni Pest testi (251 toplam),
  Pint + Larastan temiz.
- Spec 03-match-organization.md güncellendi; tsc + lint temiz.

### Sonraki adım
- #37 (akışta video, expo-video) + #43 (liquid glass, expo-blur) — yeni
  native modüller, tek rebuild'de birleştirilecek.

## 2026-07-11 (10) — Backlog #44: sezon kartı detay ekranı

- **Backend:** yeni `GET /players/{id}/stats/matches?season=` —
  `BuildPlayerSeasonMatches` action'ı sezonun maç bazında dökümünü döner
  (tarih/saha, takım + rakip adı, skor, onaylı gol/asist, maç başına
  ortalama puan; yeniden eskiye; toplu sorgularla N+1 yok). Spec
  06-stats-rating.md §API güncellendi. 1 yeni Pest testi (250 toplam),
  Pint + Larastan temiz.
- **Mobil:** yeni `stats/[id].tsx` ekranı — üstte sezon özeti şeridi
  (maç/gol/asist/reyting), altında maç listesi; satıra dokununca maç
  detayına gidiyor. `StatsCard` opsiyonel `onPress` prop'u aldı (verilince
  sağ üstte ok işareti) — hem `(tabs)/profile.tsx` hem `player/[id].tsx`
  sezon kartından `/stats/{playerId}`'ye yönlendiriyor.
- Doğrulama: tsc + lint temiz.

## 2026-07-11 (9) — Backlog #45: keşfette rakip ilanları görünmüyor

- **Kök neden:** rakip ilanlarının tamamı NULL `lat/lng` ile açılıyor
  (maç detayından açılan ilan, maçın koordinatını kopyalıyor ve koordinatsız
  maçlarda NULL kalıyor); Keşfet her zaman `near` gönderdiğinden
  `whereBetween('lat', ...)` NULL konumlu ilanların hepsini eliyordu —
  "Rakip Arayanlar" sekmesi hep boş görünüyordu (DB'de 8/8 ilan NULL).
- **Düzeltme:** konumu olmayan ilanlar yarıçap filtresinden muaf tutuldu
  (`whereNull('lat')` OR bounding box) — hem `OpponentListingController`
  hem `PlayerListingController::index`. Konumsuz ilan artık her yerde
  görünür; konumlu ilanlar yarıçap davranışını korur.
- 1 yeni Pest testi (249 toplam), Pint + Larastan temiz.

## 2026-07-11 (8) — Backlog #39: sohbet ortak component + DM'e fotoğraf/ses

- **Backend:** DM (`POST /players/{id}/messages`) artık takım sohbetiyle
  birebir aynı medya sözleşmesini kullanıyor: `type: text|image|audio`,
  multipart `image` (ImageUploader güvenlik hattı) + `audio` (m4a vb.,
  max 5MB). `StoreDirectMessageRequest`'teki hiç kullanılmayan
  `image_path` string girdisi kaldırıldı. 3 yeni Pest testi (248 toplam),
  Pint + Larastan temiz.
- **Mobil:** yeni `features/chat/ChatConversation.tsx` — iki sohbet
  ekranının ortak gövdesi (mesaj listesi, metin/fotoğraf/ses composer'ı,
  kayıt çubuğu, medya balonları). `team/[id]/chat.tsx` ve `dm/[id].tsx`
  ~320'şer satırdan ~90 satıra indi, sadece veri katmanı tutuyorlar.
  DM'de kendi mesajlar sağa hizalı (lime), medya balonları okunabilirlik
  için her zaman koyu yüzeyde. `chat/api.ts`: `SendMessagePayload` +
  ortak `postMessage` helper'ı; `sendDirectMessage` multipart destekli.
- Doğrulama: tsc + lint temiz, 248 Pest testi yeşil.

### Sonraki adım
- #37 (akışta video, expo-video) + #43 (liquid glass, expo-blur) — ikisi
  aynı rebuild'de; sonra #33, #44, #45.

## 2026-07-11 (7) — Cihaz testi 2. tur: 10 yeni madde (#37-#45) + medya yükleme kök çözümü

- Kullanıcı cihazda ikinci test turunu yaptı, 10 madde bildirdi — hepsi
  BACKLOG #37-#45 olarak kaydedildi (+ #33'e "uygulanacak" güncellemesi).
  Kullanıcı notu: "artık MVP kafasında değiliz."
- **Bu kayıtta tamamlananlar (bug kümesi):**
- **#38 ✅ (medya görünmüyor):** Kök neden `api/.env`'de
  `APP_URL=http://localhost` — `Storage::url()` tüm medya linklerini
  telefondan erişilemeyen localhost'tan üretiyordu. Kullanıcı APP_URL'i
  LAN IP+port'a çekti; prod notu PRODUCTION-READINESS madde A'ya eklendi.
- **#40/#41 ✅ (arma/avatar/video "Doğrulama hatası"):** Kök neden PHP
  `upload_max_filesize=2M` (artisan serve, CLI php.ini) — dosya kapıda
  düşünce Laravel jenerik validasyon hatası veriyordu. Üç katmanlı çözüm:
  (1) `ensureJpeg` artık uzun kenarı 1600px'e küçültüyor, tüm çağrı
  noktaları (gönderi/arma/avatar/sohbet) asset boyutlarını geçiriyor;
  (2) yeni `composer serve` script'i (`-d upload_max_filesize=120M
  -d post_max_size=125M` + `--host=0.0.0.0`) — **lokal API artık bununla
  başlatılmalı**; (3) maç videosu seçimi iOS'ta 720p H.264'e re-encode +
  `videoMaxDuration:90`/`allowsEditing` ile kırpma, sunucu video limiti
  60→100MB (kırpılmış 720p için pay), test güncellendi.
- **#39a ✅ (fotoğrafın "kaybolması"):** sohbet `Send` mutation'ında
  `onError` yoktu — yükleme hatası kullanıcıya hiç gösterilmiyordu.
  Alert eklendi. (#39'un ses çalma sorunu APP_URL ile çözüldü; kalan
  kapsam: sohbet ortak component + DM'e medya.)
- **#42 ✅ (ayarlar ikonu):** kullanıcı kendisi düzeltti.
- Doğrulama: api Pint + VideoTest (13 test) yeşil; mobil tsc + lint temiz.

### Sonraki adım
- #39c (sohbet ortak component + DM medya), #37 (akışta video, expo-video),
  #43 (liquid glass, expo-blur — #37 ile aynı rebuild'de), #33 (ilan linki),
  #44 (sezon detayı), #45 (keşfet rakip ilanları).

## 2026-07-11 (6) — Backlog #23: gol videosu yükleme (Modül 5 v2-lite)

- Kullanıcının açık talimatı ("çok uzun olmayacak şekilde, sistemimizi de
  yormamalı, UI/UX bozulmamalı") gereği, spec'teki tam v2 vizyonu (presigned
  URL → R2 → ffmpeg transcode → HLS) bilinçli olarak "lite" bir sürüme
  küçültüldü — gerçek altyapı hâlâ kurulmadı, `docs/features/05-videos.md`
  bunu net şekilde ayırıyor.
- **Backend:** `POST /matches/{id}/videos`, `url` yanında multipart `video`
  dosyası da kabul ediyor artık. `videos.storage_path`/`type: uploaded`
  zaten v1 migration'ında öngörülmüştü — ek migration gerekmedi. Limitler:
  max 60MB, max 90 sn (`duration_seconds` client'tan geliyor, sunucu
  tarafında yumuşak doğrulama — ffprobe/ffmpeg kurulu olmadığından gerçek
  süre server-side doğrulanamıyor; asıl koruma dosya boyutu sınırı).
  `mimes:mp4,mov,m4v` + `mimetypes:video/mp4,video/quicktime,video/x-m4v`
  ile içerik doğrulama (görsellerdeki GD decode kadar derin değil ama
  BACKLOG #7 deseniyle orantılı). `VideoResource`'a `video_url` eklendi.
- **Önemli düzeltme:** `DELETE /videos/{id}` önceden sadece DB kaydını
  siliyordu, depodaki dosyayı hiç temizlemiyordu — upload ile birlikte bu
  artık gerekli olduğundan düzeltildi (link'ler için zaten sorun değildi).
- 4 yeni Pest testi (245 toplam), Pint + Larastan temiz.
- **Mobil:** `match/[id]/index.tsx`'teki "Video ekle" butonu artık bir
  seçim sunuyor: "Cihazdan yükle" (galeriden video seç, 90 sn üstü
  client-side reddedilir, `axios`'un `onUploadProgress`'i ile yüzde
  göstergesi — UI kilitlenmiyor, arka planda devam ediyor) veya
  "Link yapıştır" (mevcut v1 akışı, hiç değişmedi). Video satırına
  dokununca hem harici link hem yüklenen video aynı `expo-web-browser`
  `openBrowserAsync` ile açılıyor — yeni bir `expo-video` player
  bağımlılığı **eklenmedi**: bu oturumda zaten `expo-image-manipulator`
  ve `expo-audio` eklendiğinden üçüncü bir native modül/rebuild'den
  kaçınmak bilinçli bir tercihti.
- Doğrulama: `npx tsc --noEmit` + lint temiz.

### Sonraki adım
- Backlog'daki bu oturumda planlanan tüm maddeler (#22, #24, #25, #26,
  #27, #28, #29, #30, #31, #34, #35, #36, #23) tamamlandı. Kalan:
  #32/#33 (kadro sohbette paylaşma, adam eksik/rakip için paylaşılabilir
  link — sadece backlog'a not düşülmüştü, kapsam netleşmedi) ve
  infra/production-readiness işi (Virtuozzo deploy, R2, yasal metin
  içeriği — hepsi kullanıcı kararı bekliyor). Kullanıcının `expo-image-
  manipulator` + `expo-audio` için yeni bir development build alması
  gerekiyor, bu oturumda teyit edilmedi.

## 2026-07-11 (5) — Backlog #26: takım sohbetinde fotoğraf + ses kaydı

- **Backend:** `Message::TYPES`'a `audio` eklendi (`audio_path`,
  `audio_duration`). `StoreMessageRequest`'teki `image_path` (string) girdisi
  — hiçbir zaman gerçek bir upload akışına bağlanmamış, kullanılmayan bir
  alandı — gerçek multipart `image` dosyasına dönüştürüldü (`ImageUploader`
  ile aynı güvenlik hattı: gerçek içerik doğrulama + JPEG re-encode). Yeni
  `audio` multipart alanı (mimes: m4a/mp4/aac/wav/caf/mp3, max 5MB) — ham
  dosya olarak `Storage::disk('public')`'a kaydediliyor (ses için görsel
  gibi bir re-encode/doğrulama katmanı yok, sadece uzantı/mime kontrolü —
  orantılı bir güvenlik seviyesi). `TeamMessageController::store()` dosya
  varsa upload edip path'i `SendMessage` action'ına geçiyor. 4 yeni Pest
  testi (241 toplam), Pint + Larastan temiz.
- **Mobil:** yeni native bağımlılık `expo-audio` (Expo SDK 54 uyumlu,
  `expo-image-manipulator` gibi ayrı bir EAS development build gerektirir —
  aynı rebuild'e dahil edilebilir). `features/chat/useVoiceRecorder.ts`:
  kayıt başlat/durdur, `RecordingPresets.LOW_QUALITY`, max 2 dakika (dosya
  boyutunu 5MB sınırının çok altında tutmak için bilinçli tercih).
  `features/chat/VoiceMessageBubble.tsx`: oynatma (play/pause + kalan süre,
  bitince başa sarma). `team/[id]/chat.tsx` composer'ı: ataç ikonu (kamera/
  galeri, `post/create.tsx`'teki `ensureJpeg` deseniyle aynı) + mikrofon
  ikonu; kayıt sırasında composer "kayıt çubuğuna" dönüşüyor (çöp kutusu =
  vazgeç, onay = gönder). Görsel mesajlar artık gerçek resmi gösteriyor
  (önceden "🖼️ Görsel" sabit metniydi, hiç render edilmiyordu).
- DM sohbetine genişletilmedi — kullanıcı açıkça sadece takım sohbetini
  belirtmişti ("kapsam netleşirken DM de değerlendirilir" notuyla
  BACKLOG'a düşülmüştü).
- `docs/features/07-notifications-chat.md` güncellendi: mesaj türleri,
  API sözleşmesi (`image_path` string → multipart `image`/`audio`), veri
  modeli.
- Doğrulama: `npx tsc --noEmit` + lint temiz.

### Sonraki adım
- Sırada #23 (gol videosu yükleme, Modül 5 v2). Kullanıcının `expo-audio`
  + `expo-image-manipulator` için yeni bir development build alması
  gerekiyor (henüz bu oturumda teyit edilmedi).

## 2026-07-11 (4) — Backlog #29: Ayarlar ekranı

- **Mobil:** `(tabs)/profile.tsx`'e, kaydırmayla hareket etmeyen sabit
  bir dişli/ayarlar ikonu eklendi (sağ üst). Yeni `settings/index.tsx`:
  HESAP (profili düzenle → `/profile-edit`, bildirim tercihleri →
  mevcut `/notifications/preferences`), YASAL (gizlilik politikası,
  kullanım şartları, KVKK aydınlatma metni → yeni `settings/legal/
  [slug].tsx`), HESAP İŞLEMLERİ (çıkış yap, hesabımı sil).
- Çıkış yap ve hesap silme aksiyonları `profile.tsx`'ten tamamen
  kaldırıldı, artık sadece ayarlar ekranında.
- Yasal metinler için gerçek içerik yazılmadı — bu hukuki bir karar
  (KVKK/gizlilik/şartlar metni), PRODUCTION-READINESS.md madde G'de
  "karar bekliyor" olarak zaten işaretliydi; yalnızca placeholder
  ekranı (UI iskeleti) eklendi, kullanıcı onayı olmadan metin
  uydurulmadı.
- Doğrulama: `npx tsc --noEmit` + lint temiz (bir tane `react/no-
  unescaped-entities` hatası düzeltildi).

### Sonraki adım
- Sırada #26 (takım sohbetinde fotoğraf+ses kaydı), ardından #23
  (gol videosu yükleme).

## 2026-07-11 (3) — Backlog #27: profil fotoğrafı yükleme + profil düzenleme

- **Backend:** `player_profiles.birth_date` (nullable date, `before:today`)
  eklendi. `PATCH /me` artık `avatar` dosyası kabul ediyor —
  `ImageUploader::store(..., 'avatars')` ile aynı güvenlik deseni
  (gerçek görsel doğrulama, JPEG re-encode, EXIF/GPS temizleme).
  `ImageUploader::url()` statik yardımcı eklendi.
- **Önemli düzeltme (groundwork):** `avatar_path` API genelinde hiçbir
  zaman tam URL'e çözülmüyormuş — 8 Resource dosyasında (`CommentResource`,
  `ListingApplicationResource`, `VenueReviewResource`, `MessageResource`
  [`avatar_path` + kullanılmayan `image_path` alanı da], `TeamMemberResource`,
  `UserResource`, `PlayerPublicResource`, `PostResource`) düzeltildi.
  Bu, upload çalışsa bile avatarların hiçbir yerde görünmeyeceği anlamına
  geliyordu; #27 kapsamında gerekli zemin çalışması olarak yapıldı.
- **Mobil:** yeni `profile-edit.tsx` — tek scroll form: avatar (kamera/
  galeri + `ensureJpeg`), isim, mevki(ler) (`PitchPositionPicker`),
  seviye, şehir (arama modalı, `match/create.tsx`'teki bottom-sheet
  deseniyle aynı), ilçe, hakkında, doğum tarihi. Doğum tarihi için
  native date picker bağımlılığı eklemek yerine (zaten `expo-image-
  manipulator` rebuild'i bekliyorken ikinci bir native modül eklememek
  için) GG/AA/YYYY üç ayrı sayısal alan kullanıldı. `(tabs)/profile.tsx`'e
  avatar gösterimi (initials fallback) ve düzenle butonu eklendi.
- `features/auth/api.ts`: `Profile.birth_date`, `UpdateMePayload.birth_date`
  + `avatar`, `updateMe()` artık `avatar` varsa multipart'a geçiyor
  (`createTeam`/`updateTeam` ile aynı desen; dizi alanlar için `key[]`
  formatında ayrı ayrı append — Laravel'in `array` validasyonu için gerekli).
- 4 yeni Pest testi (237 toplam), Pint + Larastan temiz, `npx tsc --noEmit`
  + lint temiz.
- `docs/features/01-auth-profile.md` güncellendi: profil alanları tablosuna
  `birth_date`, ekranlar listesine `profile-edit`, açık sorular bölümünde
  avatar maddesi ✅ işaretlendi (R2'ye taşıma ayrı, PRODUCTION-READINESS.md'de).

### Sonraki adım
- Sırada #29 (Ayarlar ekranı), ardından #26 (takım sohbeti fotoğraf+ses),
  #23 (gol videosu yükleme).

## 2026-07-11 (2) — Backlog #28: takipçi/takip edilenler listesi

- **Backend:** `GET /players/{id}/followers` ve `/following` — mevcut
  `PlayerPublicResource` yeniden kullanıldı, N+1 önleme için
  `withCount(['followers','following'])` + `profile.city` eager-load
  (`is_following`/`is_blocked` per-row kontrolü zaten mevcut/pre-existing
  bir desen, bu iş kapsamında değiştirilmedi). Engellenen kullanıcı için
  404 (`posts` endpoint'iyle aynı gizlilik deseni). 3 yeni Pest testi
  (233 toplam), Pint + Larastan temiz.
- **Mobil:** yeni `connections/[id].tsx` — takipçiler/takip edilenler
  sekmeli tek ekran (route restructuring gerekmesin diye `player/[id]`
  altında değil ayrı bir route). Kendi profil ve herkese açık profildeki
  takipçi/takip sayı bloklarına dokununca açılıyor.
- Doğrulama: `npx tsc --noEmit` + lint temiz.

### Sonraki adım
- Sırada #27 (profil fotoğrafı + profil düzenleme).

## 2026-07-11 — Backlog #34/#35/#36: HEIC bug fix + gerçek renk seçici

- **#34/#35 (bug, aynı kök neden):** Kamera/galeriden gelen fotoğraflar
  iOS'ta gerçek HEIC baytı olarak geliyordu ("iOS otomatik JPEG'e
  çeviriyor" varsayımı yanlıştı), sunucudaki GD bunu decode edemediği
  için hem feed fotoğrafı ("Doğrulama hatası") hem takım arması ("bozuk
  görsel dosyası") reddediliyordu. Kalıcı çözüm: `expo-image-manipulator`
  kuruldu; yeni `shared/media/ensureJpeg.ts` seçilen/çekilen her görseli
  yüklemeden önce gerçek JPEG'e yeniden encode ediyor —
  `post/create.tsx` ve `team/create.tsx` buna geçirildi, "İşleniyor..."
  göstergesi eklendi. **Yeni native modül — yeni EAS development build
  gerekiyor.**
- **#36:** "Paletten seç"teki 24 sabit renk swatch'ı kaldırıldı, yerine
  `shared/ui/HueColorPicker.tsx` — sürüklenebilir, sürekli bir ton (hue)
  seçici (React Native View'larla simüle edilmiş gradyan, `react-native-svg`
  gibi ek native bağımlılık yok — rebuild gerekmez). "Önerilen" 8 renk
  bölümü korundu.
- Doğrulama: `npx tsc --noEmit` + lint temiz. Backend değişikliği yok.

### Sonraki adım
- Kullanıcı EAS rebuild sonrası cihazda test edecek. Sonra kalan backlog
  maddeleri (#28, #27, #29, #26, #23) devam edecek.

## 2026-07-10 (10) — Backlog #30: takım arma fotoğrafı + özel renk seçimi

- **Backend:** `teams.logo_path` (nullable), `badge_icon` nullable oldu
  (en az biri zorunlu, `withValidator`). Görsel güvenlik mantığı
  (GD decode/reencode/rastgele-ad — BACKLOG #7'de yazılmıştı)
  `App\Support\ImageUploader`'a çıkarıldı; `CreatePost` de buna refactor
  edildi (kod tekrarı önlendi, ileride avatar/sohbet fotoğrafı bunu
  kullanacak). `color_home` zaten herhangi bir hex kabul ediyordu.
  5 yeni Pest testi (230 toplam), Pint + Larastan temiz.
- **Mobil:** `team/create.tsx` arma adımına galeri yükleme seçeneği
  (ikonla karşılıklı dışlayıcı), renk adımına "Önerilen" + "Paletten seç"
  (24 renk, HSL formülüyle üretildi) bölümleri eklendi. Takım listesi +
  takım detay sayfası `logo_url` varsa gerçek görseli gösteriyor (diğer
  küçük yüzeyler kapsam dışı bırakıldı, not düşüldü).
- Doğrulama: `npx tsc --noEmit` + lint temiz.
- **Kullanıcı talimatı:** "Bu featuru yapıktan sonra dur" — bu maddeden
  sonra duruluyor, kalan backlog maddeleri (#28, #27, #29, #26, #23)
  kullanıcının bir sonraki talimatını bekliyor.

## 2026-07-10 (9) — Backlog #22: animasyonlu splash ekranı

- Yeni `shared/ui/AnimatedSplash.tsx`: native statik splash kapanınca aynı
  marka görseliyle (`splash-icon.png`) devam eden bir giriş animasyonu —
  sıçrayarak büyüyen amblem + genişleyip kaybolan floodlight halkası,
  sonra tüm ekran solup uygulamayı açığa çıkarıyor. `_layout.tsx`'teki
  `Ready` sinyaline bağlı, en az ~500ms gösterildikten sonra kapanıyor.
  Reanimated zaten bir bağımlılıktı (PitchBoard), ek paket gerekmedi.
- **Doğrulanamadı:** Görsel sonucu cihazda görmedim, kullanıcı test edecek.
- Doğrulama: `npx tsc --noEmit` + lint temiz.

### Sonraki adım
- Sırada #30 (takım arma fotoğrafı + özel renk seçimi).

## 2026-07-10 (8) — Backlog #24: gönderi fotoğrafında kamera seçeneği

- "Fotoğraf ekle" artık galeri/kamera arasında seçim sunuyor
  (`launchCameraAsync` + izin kontrolü). Küçük, tek dosyalık değişiklik.
- Doğrulama: `npx tsc --noEmit` + lint temiz.

### Sonraki adım
- Sırada #22 (animasyonlu splash).

## 2026-07-10 (7) — Backlog #25 + #31: kadro silme, takım silme

- Kullanıcı 9 yeni istek verdi (#22-#31, ayrıca sohbette 2 tane daha #32-#33)
  — BACKLOG.md'ye yazıldı, sırayla uygulanıyor.
- **#25 (kadro silme):** `DELETE /lineups/{id}`, mevcut `manageLineups`
  policy'siyle (herhangi bir takım üyesi). Mobilde kadro satırına uzun
  basınca silme aksiyonu.
- **#31 (takım silme):** `DELETE /teams/{id}`, yeni `TeamPolicy::delete`
  (sadece kaptan). Tüm ilişkiler zaten `cascadeOnDelete` idi, ek migration
  gerekmedi. Mobilde kaptan için "Takımdan ayrıl" yerine net onay
  metniyle "Takımı sil".
- 4 yeni Pest testi, Pint + Larastan temiz. `npx tsc --noEmit` + lint temiz.

### Sonraki adım
- Sırada #24 (post fotoğrafına kamera seçeneği) — küçük, hızlı.

## 2026-07-10 (6) — Bug fix: kadro önizlemesi feed'de fazla, post/[id].tsx kopya render

- **Kullanıcı geri bildirimi (cihaz testi):** feed'de kadro için eklenen
  görsel saha önizlemesi (`PitchPreview`) listede dikkat dağıtıcıydı —
  sadece gönderinin detay sayfasına girildiğinde görünmesi istendi.
- **Kök neden keşfi:** `post/[id].tsx` (gönderi detayı) `PostCard`'ı hiç
  kullanmıyormuş, kendi eski/bağımsız bir kart render kopyasına sahipmiş —
  bu yüzden fotoğraf, kadro önizlemesi ve #8'de eklenen ilan kartları detay
  sayfasında hiç görünmüyordu (ayrı, keşfedilmemiş bir eksiklik).
- **Düzeltme:** `PostCard`'a opsiyonel `detailed` prop'u eklendi (`onPress`
  de opsiyonel yapıldı — detay sayfasında karta tıklamanın bir anlamı yok).
  Feed/profil/oyuncu-profili gibi liste bağlamlarında kadro için sade
  "📋 {isim}" metin kartı; `detailed` ile (sadece `post/[id].tsx`) görsel
  `PitchPreview` gösteriliyor. `post/[id].tsx` artık kendi kopya render'ı
  yerine doğrudan `PostCard`'ı (`detailed` ile) kullanıyor — kopya kod
  kalktı, fotoğraf/ilan kartları eksikliği de bu vesileyle giderildi.
- **Ayrıca bildirilen (kod değil, altyapı):** cihazda "Cannot find native
  module 'ExponentImagePicker'" hatası — `expo-image-picker` native kod
  içerdiğinden mevcut dev-client build'inde yok; yeni bir EAS development
  build alınması gerektiği kullanıcıya açıklandı (kod tarafında yapılacak
  bir şey yok).
- Doğrulama: `npx tsc --noEmit` + `npm run lint` temiz.

## 2026-07-10 (5) — Backlog #8: feed'de adam eksik / rakip arıyoruz kartları

- **Kararlar (kullanıcı):** ilanlar feed'de yeni kart türü olsun; genel
  kart kalitesi zayıf bulundu; performans/ölçeklenebilirlik öncelikli
  ("kullanıcı sayısı post sayısı arttığı zaman performansı etkilememeli").
- **Backend:** `Post.TYPES` → `player_listing`/`opponent_listing`;
  `posts.player_listing_id`/`opponent_listing_id` (mevcut match_id/lineup_id
  deseniyle aynı, FK constraint otomatik index). Yeni `CreatePlayerListingPost`/
  `CreateOpponentListingPost` Action'ları — `CreateLineupSharedPost`'un
  `CreateLineup` içine inject edildiği desenle birebir aynı şekilde
  `CreatePlayerListing`/`CreateOpponentListing`'e inject edildi,
  `auto_posts_enabled` kontrolü korunuyor.
  **Performans:** `BuildFeed`/`PlayerController::posts()` yeni ilişkileri
  (`playerListing.match.team`, `opponentListing.team`) eager-load ediyor;
  görüntüleyenin `my_application_status`'u sayfadaki tüm player_listing
  post'ları için tek bir batch `ListingApplication` sorgusuyla hesaplanıyor
  (post başına sorgu yok — `PlayerListingController::index`'teki mevcut
  desenle aynı); `applications` ilişkisi feed bağlamında bilinçli olarak
  eager-load edilmiyor (gereksiz payload). 4 yeni Pest testi (222 toplam,
  hepsi yeşil), Pint + Larastan temiz.
- **Mobil:** `listings/index.tsx`'teki ilan kartı JSX'i (adam eksik +
  rakip arıyoruz) `features/match/ListingCards.tsx`'e çıkarıldı; mutation
  mantığı (`apply`, `promptOpponentMatch`) `features/match/
  useListingActions.ts` hook'una taşındı — hem Keşfet hem `PostCard` aynı
  bileşen/hook'u kullanıyor, kod tekrarı yok. `PostCard` header'ına baş
  harf rozeti eklendi (avatar_path varsa gerçek görsel, yoksa isim baş
  harfleri — Modül 1'de avatar yükleme henüz kurulmadığından şimdilik hep
  rozet).
- Doğrulama: `npx tsc --noEmit` + `npm run lint` temiz.

### Sonraki adım
- BACKLOG.md'deki #7/#8/#19/#20/#21 tamamlandı. Kalan: #10/#18 (il/ilçe/
  saha hiyerarşisi) ve #16 (gerçek saha verisi) — kullanıcı "ayrıca
  anlatacağım" dedi, henüz netleşmedi.

## 2026-07-10 (4) — Backlog #7: gönderiye fotoğraf + kadro ekleme

- **Kararlar (kullanıcı):** kadro ekleme, fotoğraf ekleme (güvenlik
  öncelikli), zengin editör yok.
- **Backend:** `posts.image_path` migration (`Post::$fillable`'a da
  eklendi — ilk denemede unutulup mass-assignment'ın sessizce düşürdüğü
  ortaya çıktı, Pest testiyle yakalandı). `CreatePost` Action: `image`
  dosyası GD (`imagecreatefromstring`) ile gerçekten decode edilip
  doğrulanıyor (sahte uzantılı/bozuk dosya → `422 invalid_image`), her
  zaman JPEG'e yeniden encode ediliyor (EXIF/GPS metadata temizliği +
  orijinal bayt dizisi hiç diske yazılmıyor), rastgele UUID adla
  `Storage::disk('public')`a kaydediliyor (`php artisan storage:link`
  çalıştırıldı). `lineup_id` — `Lineup->team->isMember` ile sahiplik
  doğrulanıyor. `PostResource.lineup` artık tam `LineupResource` embed'i
  (positions dahil) — `PostController`/`BuildFeed`/`PlayerController`'daki
  eager-load'lara `lineup.team.members` eklendi. 4 yeni Pest testi (218
  toplam, hepsi yeşil), Pint + Larastan temiz.
  **Bilinen kısıt:** yerel GD kurulumunda Imagick yok, HEIC decode
  edilemiyor — ham HEIC baytı `422` ile reddedilir (bkz.
  04-social-feed.md "Bilinen kısıt").
- **Mobil:** `expo-image-picker` kuruldu (+ `app.json` izin metinleri).
  `post/create.tsx`'e galeriden fotoğraf seçme (önizleme + kaldır butonu)
  ve seçili takımın kayıtlı kadrolarından seçim eklendi. Yeni
  `features/team/PitchPreview.tsx` — `PitchBoard`'ın jestsiz/salt-okunur
  versiyonu (PanGesture, FlatList scroll'uyla çakışacağından ayrı bir
  bileşen olarak yazıldı, yüzde-tabanlı konumlandırma). `PostCard`'da
  hem sistem "kadro paylaşıldı" hem manuel eklenen kadro artık bu görsel
  önizlemeyle gösteriliyor (önceki düz isim yazan kart kaldırıldı) —
  kullanıcının #8'de belirttiği "kartlar zayıf" geri bildirimini de
  kısmen karşılıyor.
- Doğrulama: `npx tsc --noEmit` + `npm run lint` temiz.

### Sonraki adım
- Sırada #8 (feed'de ilan kartları — kullanıcı "rakip ilanı ve adam eksik
  ilanı yeni bir kart olarak görünsün, genel olarak kartlar zayıf" dedi).

## 2026-07-10 (3) — Backlog #19: boş durumlar (empty states)

- 14 boş-durum noktasının (feed, keşfet x2, sohbetler, takımlar, arama x2,
  maçlar, saha rehberi, takım sohbeti, DM, oyuncu profili, kendi profilim,
  kadro atama sayfası) hepsinde zaten bağlamsal Türkçe metin olduğu
  doğrulandı — eksik olan görsel tutarlılıktı. Ortak `shared/ui/
  EmptyState.tsx` (ikon + mesaj) eklendi, mevcut metinler korunarak
  uygulandı. Ters listelerde (`team/[id]/chat.tsx`, `dm/[id].tsx`) zaten
  var olan `scaleY: -1` flip'i için `EmptyState`'e opsiyonel `style` prop'u
  eklendi.
- Doğrulama: `npx tsc --noEmit` ve `npm run lint` temiz.

### Sonraki adım
- BACKLOG.md'nin #19/#20/#21 üçü de kapandı. Sırada kullanıcı netleştirmesi
  gereken #7 (gönderi paylaşma ekranı), #8 (feed'de ilan gösterimi),
  #10/#18 (il/ilçe/saha), #16 (gerçek saha verisi).

## 2026-07-10 (2) — Backlog #20 + #21: hata/yeniden deneme ve yükleme tutarlılığı

- **#20 (hata/retry) tamamlandı:** 13 ekranın hiçbirinde `isError` kontrolü
  yoktu — network hatası, kullanıcıya yanlışlıkla "içerik yok" (boş liste)
  ya da bazı ekranlarda sonsuz spinner (`player/[id].tsx`, `Player.isPending
  || Player.data == null` koşulu hata sonrası hiç `false` olmuyordu) olarak
  görünüyordu. `shared/ui/ErrorState.tsx` (ikon + mesaj + "Tekrar dene")
  eklendi ve feed, maçlar, sohbetler, takımlar, bildirimler, saha rehberi,
  DM, takım sohbeti, oyuncu profili, kendi profilim, keşfet, arama,
  onboarding şehir adımı olmak üzere 13 ekrana uygulandı.
- **#21 (yükleme tutarlılığı) kapatıldı — kod değişikliği gerekmedi:** aynı
  denetimde tüm ekranların zaten aynı `ActivityIndicator`/`Button.loading`
  desenini kullandığı doğrulandı.
- Doğrulama: `npx tsc --noEmit` ve `npm run lint` temiz (mevcut, alakasız 1
  axios import uyarısı hariç).

### Sonraki adım
- Sırada #19 (empty states — mevcut durumda her ekranda zaten bağlamsal
  metin var, geliştirme daha çok görsel/ikon tutarlılığı) ve ardından
  kullanıcı netleştirmesi gereken #7/#8/#10/#18/#16.

## 2026-07-10 — Marka ikonu + splash ekranı, yeni backlog maddeleri (#19-21)

- **Uygulama ikonu/splash:** `mobile/assets/images/{icon,splash-icon,
  android-icon-foreground,android-icon-background,android-icon-monochrome,
  favicon}.png` şimdiye kadar hiç değiştirilmemiş Expo şablon varsayılanlarıydı
  (React/Expo logosu) — tema token'larından (`Palette.pitchNight`/`turfRaised`/
  `lime`/`limeInk`, "Gece Maçı" tasarım dili) üretilen yeni bir marka görseli
  ile değiştirildi: gece çimi zemininde iki soluk halka (floodlight/orta
  yuvarlak hissi) + `BarlowCondensed_700Bold` fontundan bold "S" monogramı,
  lime glow + limeInk gölge ile. Python/Pillow ile üretildi (`video-default-
  cover.png`'de kullanılan yöntemle aynı).
- `app.json`: iOS artık deneysel Icon Composer (`.icon`) formatı yerine
  standart `icon.png`'yi kullanıyor (bu projede daha önce bir Swift build
  hatasına yol açan deneysel paket kategorisiyle aynı risk sınıfı — kaldırıldı,
  `assets/expo.icon/` silindi). Splash `backgroundColor` → `#0B1F14`
  (`Palette.pitchNight`, önceki `#208AEF` alakasız mavi bir varsayılandı),
  `imageWidth` 76 → 200. Android adaptive icon `backgroundColor` → `#0B1F14`.
- **BACKLOG.md #19-21 (yeni):** kullanıcının "henüz hiç bakılmamış ama
  production'da fark yaratan şeyler" talebiyle detaylı yazıldı — boş durumlar
  (empty states), hata/yeniden deneme durumları, yükleme durumu (spinner/
  skeleton) tutarlılığı. Üçü de cross-cutting, henüz kodlanmadı.
- Doğrulama: `npx tsc --noEmit` temiz, `npx expo config` ile app.json
  şeması doğrulandı.

### Sonraki adım
- Kullanıcı talebi: sırada BACKLOG.md'deki açık maddeler (#7, #8, #10/#18,
  #16, #19, #20, #21) var — production-ready fazının uygulama-içi ayağı.
  Altyapı/deploy tarafı (Virtuozzo — bkz. docs/PRODUCTION-READINESS.md)
  kullanıcı isteğiyle şimdilik arka planda bekletiliyor.

## 2026-07-09 — EAS dev build, push doğrulama, backlog temizliği (#17, #6, #9, #5, #4), 2 bug fix

- **EAS development build:** `expo-dev-client` kuruldu, `mobile/eas.json`
  (development/preview/production profilleri) eklendi. `app.json`'a
  `ios.bundleIdentifier` / `android.package` = `com.sahanaapp.app` eklendi
  (non-interactive EAS build zorunlu kıldı; kullanıcının `sahanaapp.com`
  alan adına göre seçildi). Android ve iOS dev-client build'leri başarıyla
  alındı ve cihaza kuruldu.
  - **iOS build hatası kök neden:** `'RNHostViewProtocol' is not a member
    type of struct 'ExpoModulesCore.ExpoSwiftUI'` — `src/` içinde hiç
    kullanılmayan `expo-glass-effect` ve `@expo/ui` paketlerinden
    kaynaklanıyordu (grep ile doğrulandı), ikisi de kaldırıldı.
- **Push bildirim uçtan uca doğrulandı:** gerçek cihazda dev-client build
  üzerinden push token kaydı + `ExpoPushClient` üzerinden hem uygulama
  içinden hem terminalden (tinker + ham HTTP) test bildirimleri gönderildi,
  teslimat onaylandı.
- **Backlog #17 — ExpoPushClient sessiz hata:** `send()` artık Expo'nun
  `data[]` yanıtındaki `status: error` ticket'larını `Log::warning`'e
  yazıyor; `DeviceNotRegistered` durumunda ilgili `devices` kaydı otomatik
  siliniyor. 3 yeni test (`ExpoPushClientTest.php`).
- **Backlog #6 — Akış pull-to-refresh:** `(tabs)/feed.tsx` FlatList'e
  `RefreshControl` bağlandı.
- **Backlog #9 — Video varsayılan kapak:** `assets/images/video-default-cover.png`
  eklendi, `PostCard.tsx` ve `match/[id]/index.tsx`'teki ikon placeholder'ların
  yerini aldı.
- **Backlog #5 — Profil ekranı sosyal aktivite:** `GET /me`'ye
  `followers_count`/`following_count` eklendi; `(tabs)/profile.tsx`,
  `player/[id].tsx`'teki FlatList+ListHeaderComponent desenine taşındı
  (takipçi/takip sayıları + kendi gönderi listesi).
- **Backlog #4 — Rakip bulundu bildirimi:** `OpponentFoundNotification`
  eklendi, `MatchOpponentListing` Action'ı eşleşme sonrası ilan sahibi
  kaptanı bilgilendiriyor.
- **Bug fix — aynı sahaya birden fazla yorum:** `venue_reviews`'a
  `(venue_id, user_id)` unique index + `CreateVenueReview`'da açık
  `already_reviewed` (422) kontrolü; `VenueResource`'a `my_review` eklendi,
  mobilde kullanıcı zaten yorum yapmışsa "Yorum yap" butonu hiç gösterilmiyor
  (uyarı yerine buton gizleme — kullanıcı tercihi).
- **Bug fix — yorum modalında klavye input'un üstüne biniyordu:**
  `venues/[id].tsx`'teki yorum Modal'ı `KeyboardAvoidingView` ile sarmalandı
  (chat ekranlarında daha önce çözülen desenle birebir aynı —
  `behavior="padding"`, `keyboardVerticalOffset={0}`). Uygulama genelinde
  aynı eksik için proaktif tarama yapıldı, başka Modal+TextInput gap'i
  çıkmadı.
- Doğrulama: API 209 test + Pint + Larastan yeşil; mobil `tsc --noEmit` +
  lint temiz. Her madde kendi commit'iyle push edildi.

### Sonraki adım
- Kullanıcı talebi: backlog'daki geri kalan açık maddeler (#7 gönderi
  paylaşma ekranı, #8 feed'de ilan gösterimi, #10/#18 il/ilçe/saha
  hiyerarşisi, #16 gerçek saha verisi — hepsi kullanıcı netleştirmesi
  bekliyor) sonrasında **production-ready** faza geçilecek: hosting/deploy,
  queue'nun `sync`'ten çıkarılması, Sentry/hata takibi, `APP_DEBUG`/CORS/
  rate-limit güvenlik taraması, medya depolama (R2/S3), store submission
  (ikon/gizlilik politikası/izin metinleri), yasal metinler (KVKK/kullanım
  şartları), DB backup stratejisi. Bu oturumda üretim hazırlığına başlandı.

## 2026-07-08 — Modül 8 (Aşama 1): Saha Rehberi

- **Kararlar (kullanıcı):** Bu oturumda sadece Aşama 1 (rehber) — Aşama 2
  (işletme paneli + rezervasyon) ayrı bir iş, taslak olarak kaldı. Seed
  verisi yok, boş/test verisiyle başlandı (gerçek toplu veri doldurma
  BACKLOG.md #16'ya taşındı). `matches.venue_text` korunuyor, yeni
  `venue_id` nullable/opsiyonel — geriye dönük kırılma yok.
- **API:** `venues` + `venue_reviews` tabloları, `matches.venue_id` (nullable
  FK). Konum sorgusu Modül 3'teki desenle birebir aynı — `lat`/`lng` decimal
  + bounding-box + PHP haversine (`App\Support\Geo`), POINT/SPATIAL değil
  (test paketi sqlite'ta koşuyor). `GET /venues?near=&radius=&search=` ·
  `GET /venues/{id}` (ortalama puan + yorumlar) · `POST /venues/{id}/reviews`
  — sahte yorum direnci: sadece o sahada oynanmış (`status: played`), yorumu
  yapan kullanıcının katılımcısı olduğu bir maça (`match_id`, kanıt bağı)
  dayanarak yorum yapılabiliyor (`CreateVenueReview` Action). `POST`/`PATCH
  /matches` artık opsiyonel `venue_id` kabul ediyor (public_id → internal id
  çözümlemesi `MatchController`'da).
- **Larastan:** `VenueResource`'ta `withAvg()`'ın eklediği dinamik
  `reviews_avg_score` alanına property erişimi "undefined property" verdi —
  `distance_km` için zaten kullanılan `getAttribute()` desenine çekilerek
  çözüldü (aynı dosyada tutarlı).
- **Mobil:** `features/venue/api.ts`; `venues/index.tsx` (arama/yakınımdaki
  liste), `venues/[id].tsx` (detay, özellikler, yorumlar, yıldızlı puanlama
  + maç seçimli yorum formu — sadece o sahada oynanmış maçı olan kullanıcıya
  gösteriliyor); `match/create.tsx`'e "Rehberden seç" modalı (serbest metin
  girişi korunuyor). Giriş noktası: `(tabs)/matches.tsx` header'ına "Sahalar"
  linki.
- Doğrulama: API 206 test (10 yeni) + Pint + Larastan yeşil, gerçek local
  MySQL'e migrate edildi; mobil `tsc --noEmit` + lint temiz.
  `docs/features/08-venues.md` "Uygulanıyor"a çekildi, `ROADMAP.md` Modül 8
  Aşama 1 checkbox'ları işaretlendi.

### Sonraki adım
- Kullanıcı cihaz testi: saha rehberi listesi/arama, saha detayında yorum
  yapma (oynanmış bir maç gerekiyor — test verisi tinker ile eklenmeli),
  maç kurarken rehberden saha seçimi.
- Aşama 2 (işletme paneli + rezervasyon) ayrı bir karar/spec güncellemesi
  gerektiriyor — henüz ele alınmadı.
- ROADMAP sırasına göre sıradaki modül yok (1-8 tamam) — MVP→production-ready
  cilalama fazı (BACKLOG.md) veya kullanıcının belirleyeceği yeni öncelik.

---

## 2026-07-07 (4) — Sohbet UI hataları düzeltildi (backlog #12-#15)

- Kullanıcı cihazda test ederken 4 UI hatası buldu, önce backlog'a yazıldı,
  sonra aynı oturumda düzeltildi:
  - **#12 Klavye boşluğu:** `team/[id]/chat.tsx` + `dm/[id].tsx`'teki
    `keyboardVerticalOffset={90}` (post/[id].tsx'ten kör kopyalanmış) `0`'a
    çekildi — topBar zaten KeyboardAvoidingView'ın kendi içinde bir çocuk.
  - **#13 Çift mesaj görünme:** Kök neden — `broadcast(...)->toOthers()`
    gönderenin bağlantısını `X-Socket-Id` header'ıyla dışlıyor, ama axios
    istemcisi bu header'ı hiç göndermiyordu. `shared/api/echo.ts`'e
    `EchoInstance?.socketId()`'i her isteğe enjekte eden bir axios
    interceptor eklendi. Ek güvence: her iki ekranda da hem mutation
    `onSuccess`'i hem Echo dinleyicisi, aynı `id` cache'te zaten varsa
    tekrar eklemiyor (idempotent merge).
  - **#14 Renk kontrastı:** DM'de kendi mesaj balonum (`Palette.lime` arka
    plan) üzerindeki metin `Palette.chalk` (neredeyse beyaz) yerine artık
    `Palette.limeInk` (koyu, yeni `textMine` stili) kullanıyor.
  - **#15 Akış buton yerleşimi:** Alt sabit "Gönderi paylaş" butonu
    kaldırıldı; header'ın soluna (AKIŞ başlığının yanına) "+" ikon butonu
    eklendi.
- Doğrulama: mobil `tsc --noEmit` + lint temiz. Backend değişmedi, API
  testlerine dokunulmadı.

### Sonraki adım
- Kullanıcı cihaz testi: sohbet ekranlarında klavye/mesaj davranışı ve akış
  header'ındaki yeni "+" butonu.
- Modül 8 ya da MVP→production-ready cilalama (BACKLOG.md), Modül 1-8
  tamamlandıktan sonra.

---

## Modül Durumu

| Modül | Durum |
|---|---|
| Faz 0 — Altyapı | ✅ Tamamlandı (2026-07-03) |
| 1 — Kimlik & Profil | ✅ API + mobil tamam (2026-07-03) · cihazda kullanıcı testi bekliyor |
| 2 — Takım & Kadro | ✅ API + mobil tamam (2026-07-04) · cihazda kullanıcı testi bekliyor |
| 3 — Maç Organizasyonu | ✅ API + mobil tamam (2026-07-04) · cihazda kullanıcı testi bekliyor |
| 4 — Sosyal Katman | ✅ API + mobil tamam (2026-07-06) · cihazda kullanıcı testi bekliyor |
| 5 — Maç Videoları | ✅ v1 API + mobil tamam (2026-07-06) · v1.5/v2/v3 bekliyor |
| 6 — İstatistik & Reyting | ✅ API + mobil tamam (2026-07-07) · cihazda kullanıcı testi bekliyor |
| 7 — Bildirim & Mesajlaşma | ✅ API + mobil tamam (2026-07-07, DM dahil) · cihazda kullanıcı testi bekliyor (push ancak EAS dev build'de test edilebilir) |
| 8 — Saha Rehberi | ✅ Aşama 1 (API + mobil) tamam (2026-07-08) · Aşama 2 (işletme paneli) ayrı iş |

---

## 2026-07-07 (3) — Modül 7 genişletmesi: DM (birebir mesajlaşma) + Sohbet sekmesi

- **Bağlam:** Kullanıcı önce backlog'a eklenmesini istedi (#11: DM + alt
  sekmede sohbet listesi), sonra aynı oturumda uygulanmasını istedi.
- **Kararlar (kullanıcı):** DM için ayrı bir şema yerine **aynı `messages`
  koleksiyonu** — takım mesajında `team_id`, DM'de `participant_ids`
  (`[minUserId, maxUserId]`) dolu. DM v1 kapsamı sadece metin+görsel (maç/
  kadro paylaşımı yok). Herhangi bir kullanıcı, engellenmediği sürece
  diğerine DM atabilir (takip şartı yok).
- **Bulunan ve düzeltilen hata (cihaz testinde ortaya çıktı):** Takım
  sohbetinin WS kanal adı istemci/sunucu arasında hiç uyuşmuyormuş — mobil
  `team.{public_id}` dinliyordu, backend `team.{Team->id}` (MySQL iç
  sayısal id) yayınlıyor/yetkilendiriyordu. Bu yüzden canlı mesaj iletimi
  sessizce çalışmıyordu (REST ile gönderim/kayıt çalışıyordu, sadece anlık
  WS push'u ölüydü). `MessageSent` event'i `int $TeamId` yerine genel bir
  `string $Channel` alacak şekilde genelleştirildi; `SendMessage`/
  `routes/channels.php` `public_id` üzerinden yayın/yetki yapacak şekilde
  düzeltildi. Regresyon testi eklendi (broadcast kanal adını doğruluyor).
- **API:** `Message` modeline `participant_ids` alanı eklendi.
  `SendDirectMessage`/`ListDirectMessages`/`ListConversations` Action'ları
  (aynı `Message` modelini paylaşıyor, kod tekrarı yok).
  `DirectMessageNotification` (ChatMessageNotification'ın DM karşılığı).
  `GET /conversations` (takım + DM birleşik liste, son mesaja göre sıralı —
  Mongo ObjectId'nin kendisi sıralama anahtarı olarak kullanıldı, ISO string
  saniye çözünürlüğü yetersiz kalıyordu). `GET/POST /players/{id}/messages`.
  WS kanalı: `private-dm.{public_id_A}.{public_id_B}` (alfabetik sıralı).
- **Larastan:** `ListConversations`'ta `$Last?->id ?? ''` "nullsafe
  unnecessary" uyarısı verdi — Modül 7'nin ilk turunda karşılaşılan
  `PlayerProfile` durumuyla aynı, mongodb/laravel-mongodb stub'larının
  `first()`'ü yanlışlıkla non-nullable işaretlemesinden kaynaklanan yanlış
  pozitif (yazılan test — mesajsız takım — bunu kanıtlıyor). Körü körüne
  linter önerisine uyulmadı; `$Last === null ? '' : $Last->id` ile aynı
  davranış korunarak linter de memnun edildi.
- **Mobil:** Alt tab bar'a "Sohbet" sekmesi (`(tabs)/conversations.tsx`,
  takım + DM birleşik liste). `dm/[id].tsx` (DM sohbet ekranı, takım
  sohbetiyle aynı desen — ters FlatList + Echo canlı dinleme + REST cursor).
  `player/[id].tsx`'e "Mesaj gönder" ikon butonu.
- Doğrulama: API 196 test (9 yeni + 1 güncellenmiş regresyon) + Pint +
  Larastan yeşil; mobil `tsc --noEmit` + lint temiz.
  `docs/features/07-notifications-chat.md` ve `docs/BACKLOG.md` (#11 ✅)
  güncellendi.

### Sonraki adım
- Kullanıcı cihaz testi: takım sohbetinde canlı iletim artık gerçekten
  çalışmalı (bugfix sonrası); DM akışı iki hesapla; Sohbet sekmesinde her
  ikisinin de göründüğünü doğrula.
- ROADMAP sırasına göre Modül 8, ya da MVP→production-ready cilalama
  (BACKLOG.md), Modül 1-8 tamamlandıktan sonra.

---

## 2026-07-07 (2) — Modül 7 tamamlandı: Bildirim & Mesajlaşma

- **Kararlar (kullanıcı):** 7 bildirim tetikleyicisinin tamamı tek oturumda;
  sohbet geçmişi MySQL yerine **MongoDB**'de (`sahana_chat`, yerel brew
  kurulumu); sessiz saat varsayılan **açık** (00:00-08:00, `Europe/Istanbul`
  sabit, `chat_message` kategorisi muaf).
- **Teknik sapma:** tech-stack.md'nin FCM kararı yerine Expo Push API
  kullanıldı (proje Expo-managed olduğundan Firebase Admin SDK gereksiz;
  tek HTTPS çağrısıyla `exp.host/--/api/v2/push/send`).
- **API:** `devices` tablosu + `App\Notifications\Channels\ExpoChannel`
  (kategori tercihi + sessiz saat kontrolü + `SendExpoPush` job, gecikmeli
  dispatch) + 9 bildirim sınıfı (maç oluşturuldu/onaylandı, RSVP/maç
  hatırlatma sweep'leri, ilan başvurusu/kararı, davet kabulü, sosyal özet
  batch, sohbet mesajı). MongoDB `Message` modeli (`MongoDB\Laravel\Eloquent\
  Model`, `_id` doğrudan public ID), `SendMessage`/`ListMessages` Action'ları,
  Reverb (`MessageSent` event, `private-team.{id}` kanalı). `GET/POST
  /teams/{id}/messages` manuel cursor (native `cursorPaginate()` Mongo
  sürücüsüyle garantili uyumlu değil — kasıtlı, gerekçeli api-conventions
  sapması).
- **Kritik düzeltme:** `withRouting(channels: ...)` `/broadcasting/auth`'u
  varsayılan `web` (session) middleware'iyle kaydediyor — mobil Sanctum
  bearer token kullandığından uyumsuz. `->withBroadcasting($channels,
  attributes: ['prefix' => 'api/v1', 'middleware' => ['auth:sanctum']])` ile
  düzeltildi.
- **Test metodolojisi dersi:** Bildirim sınıfları `ShouldQueue` olduğundan
  kapsamsız `Queue::fake()` dış `SendQueuedNotifications` job'ını yakalayıp
  `ExpoChannel::send()`'in hiç çalışmamasına (ve testin yanlışlıkla
  geçmesine) yol açıyordu; `Queue::fake([SendExpoPush::class])` ile iç job'a
  daraltılarak gerçek kanal mantığı test edildi.
- **Mobil:** paketler (`expo-notifications`, `expo-device`, `laravel-echo`,
  `pusher-js`), `shared/api/echo.ts` (Echo/Reverb singleton, Sanctum
  authorizer), `usePushRegistration` hook'u (Expo Go'da SDK 53+ uzak push
  desteklemediği için try/catch ile sessiz düşüş, `_layout.tsx`'e bağlandı),
  bildirim merkezi (`notifications/index.tsx`, cursor sonsuz kaydırma,
  okundu işaretleme), bildirim tercihleri (`notifications/preferences.tsx`,
  sessiz saat + 9 kategori anahtarı), takım sohbeti (`team/[id]/chat.tsx`,
  ters `FlatList` + Echo canlı dinleme + REST cursor sayfalama). Giriş
  noktaları: akış ekranına zil ikonu, takım ekranına "Takım sohbeti" butonu.
- **pusher-js tip hatası:** `echo.ts`'teki authorizer callback imzası
  (`error: boolean`) gerçek `ChannelAuthorizationCallback` tipiyle
  (`error: Error | null`) uyuşmuyordu — `tsc --noEmit` ile yakalandı, düzeltildi.
- **Kullanıcıya iletilmesi gereken kısıtlama:** Expo Go (SDK 53+) uzak push
  bildirimlerini desteklemiyor; gerçek push test için EAS development build
  gerekiyor (uygulama içi bildirim kaydı ve sohbet WS'i Expo Go'da normal
  çalışır, yalnızca push token alınamaz).
- Doğrulama: API 187 test (33 yeni) + Pint + Larastan yeşil, gerçek MySQL'e
  migrate edildi; mobil `tsc --noEmit` + lint temiz.
  `docs/features/07-notifications-chat.md` zaten güncel (kararlar oturum
  başında işlendi).

### Sonraki adım
- Kullanıcı cihaz testi: bildirim tetikleyicileri (maç oluştur/onayla, ilana
  başvur/karar ver, davet kabul et) + takım sohbeti (iki hesapla canlı mesaj).
  Gerçek push bildirimi için EAS dev build gerekiyor — Expo Go'da sadece
  uygulama içi bildirim kaydı ve sohbet test edilebilir.
- ROADMAP sırasına göre Modül 8 ya da kullanıcının MVP→production-ready
  cilalama tercihi (BACKLOG.md), Modül 1-8 tamamlandıktan sonra.

## 2026-07-07 — Modül 6 tamamlandı: İstatistik & Reyting

- **Kararlar (kullanıcı):** rakip onaylamazsa 48s sonra otomatik onay; rakip
  takım kayıtlı değilse modül o maç için tamamen kapalı; reyting zaman
  ağırlıklı (üstel azalma, 45 gün yarı ömür); sezon = takvim yılı.
- **API:** `match_results` (skor girişi → rakip onayı/itirazı, `results:
  auto-confirm` saatlik komut), `player_match_stats` (kaptan direkt onaylı,
  oyuncu kendisi için onay bekler), `player_ratings` (katılımcılar arası 1-10,
  `starts_at`..`+48s` penceresi, kendine puan yok). Yeni `match_participants.
  attended` kolonu güvenilirlik skoru için ("RSVP=yes dedi ama gelmedi"
  problemi). `GET /players/{id}/stats` — sezon özeti, zaman ağırlıklı reyting
  (min 3 puan şartı), güvenilirlik yüzdesi, son 5 maç formu.
  `App\Support\RatingCalculator` üstel azalma hesaplayan saf fonksiyon.
- **Öğrenilen (Modül 5'ten taşınan ders tekrar doğrulandı):** hem sonuç girme
  hem puanlama, maçın `status` alanına değil `starts_at` zamanına göre
  kapılandı (sweep'in çalışmasını beklememek için).
- **Test hatası/düzeltme:** `player_match_stats`'ta `unique(match_id,user_id)`
  olduğundan aynı maça aynı oyuncu için iki kayıt eklenemiyor — bir testte bu
  kısıtlamaya takılan senaryo ayrı bir maça taşındı.
- **Larastan:** üç yeni modelin (`MatchResult`, `PlayerMatchStat`,
  `PlayerRating`) factory sınıfları unutulmuştu — docblock'ta referans var
  ama dosya yoktu; eklendi (`composer dump-autoload` sonrası Larastan cache
  temizlenip yeşile döndü).
- **Mobil:** match/[id] ekranına SKOR + İSTATİSTİKLER bölümleri, yeni
  match/[id]/rate.tsx (1-10 tek dokunuş puanlama), paylaşılan `StatsCard`
  bileşeni (tabs)/profile.tsx ve player/[id].tsx'e eklendi. `MatchResource`'a
  `i_am_opponent_captain` ve katılımcılara `is_me` alanı eklendi.
- Doğrulama: API 154 test (35 yeni) + Pint + Larastan yeşil; mobil lint + tsc
  temiz; gerçek local MySQL'e migrate edildi (Modül 5'teki unutma hatası
  tekrarlanmadı). `docs/features/06-stats-rating.md` "Tamamlandı" + Kabul
  Kriterleri/mobil ekranlar notu eklendi.

### Sonraki adım
- Kullanıcı cihaz testi (özellikle: skor gir → rakip onaylasın/itiraz etsin →
  istatistik gir/onayla → puanla → profilde sezon özetini gör zinciri, en az
  iki hesapla).
- ROADMAP sırasına göre Modül 7 (Bildirim & Mesajlaşma) ya da kullanıcının
  MVP→production-ready cilalama tercihi (BACKLOG.md).

## 2026-07-06 (3) — Modül 5 v1 tamamlandı: Maç Videoları (harici link)

- **API:** `videos` tablosu (match_id, user_id, type, provider, url, title,
  thumbnail_url, fetched_at) + `posts.video_id`/`video_shared` type eklendi.
  `AddVideoToMatch` Action → `Video::create` + `FetchVideoMetadata` job
  (kuyruk) + `CreateVideoSharedPost` (Modül 4'teki auto-post deseninin aynısı,
  `auto_posts_enabled`'a saygılı). `MatchPolicy::addVideo` (sadece katılımcı),
  `VideoPolicy::delete` (ekleyen ya da kaptan). `VideoController`
  (index/store/destroy), `POST/GET /matches/{id}/videos`, `DELETE /videos/{id}`.
- **Metadata job:** YouTube için resmi oEmbed endpoint'i (`youtube.com/oembed`),
  diğer sağlayıcılar için genel OG meta etiketi regex taraması — sosyalhalisaha
  dahil hiçbir içerik scrape/re-host edilmiyor, sadece başlık+thumbnail
  önizlemesi (research kararına sadık).
- **Öğrenilen:** `sync` kuyruk sürücüsünde bile job, `SerializesModels` ile
  modelin ayrı bir kopyasını işler; Action'da dispatch sonrası `$Video->refresh()`
  çağrılmadan JSON yanıtı eski (title=null) veriyi döndürüyordu — testte
  yakalandı, düzeltildi.
- **Mobil:** match/[id] ekranına "VİDEOLAR" bölümü (maç `played` olunca
  görünür) + "Video ekle" modalı (URL yapıştır) + `expo-web-browser` ile
  in-app tarayıcıda izleme. `PostCard`'a `video_shared` kart türü (thumbnail +
  play rozeti). `MatchResource`'a `i_am_participant` alanı eklendi (video
  ekleme butonunu göstermek için, `my_rsvp`'den bağımsız).
- Doğrulama: API 117 test (9 yeni) + Pint + Larastan yeşil; mobil lint + tsc
  temiz. `docs/features/05-videos.md` "v1 ✅" + Kabul Kriterleri işaretlendi.
- **Kapsam dışı bırakılan (v1.5):** sosyalhalisaha "Videonu bul" deep-link
  yönlendirmesi (spec yazıldı, henüz kodlanmadı — `sosyalhalisaha_venues`
  referans tablosu + maç kurma akışına opsiyonel saha eşleştirme gerekiyor).

### Sonraki adım
- Kullanıcı onayıyla v1.5 (deep-link) implementasyonuna geçilebilir, ya da
  ROADMAP sırasına göre Modül 6'ya geçilebilir — kullanıcı MVP→production-ready
  cilalama fazını da modüller bitince yapmak istiyor (bkz. BACKLOG.md).

## 2026-07-06 (2) — Modül 5 spec kararı: "Videonu bul" deep-link

- Kullanıcı önerisi: sosyalhalisaha'nın dokümansız `xhr/filtre/{il}_{ilce}_
  {saha}_{tarih}_{saat}_` uç noktasını kullanarak maç videosunu otomatik
  çekip Sahana içinde göstermek. **Otomatik çekme reddedildi** (telif +
  ToS + KVKK + kırılganlık — research dokümanındaki Seçenek C kararıyla aynı
  gerekçe); kullanıcı bu değerlendirmeyi kabul etti.
- **Kabul edilen orta yol (v1.5):** maç kurarken opsiyonel ilçe/saha eşleşmesi
  (yeni referans tablo `sosyalhalisaha_venues`; il zaten `cities.id` ile aynı).
  Maç `played` olunca "Videonu bul" butonu yukarıdaki filtre URL'ini sadece
  harici tarayıcıda açar (`Linking.openURL`) — backend bu endpoint'i hiç
  çağırmaz/parse etmez. Kullanıcı orada bulduğu video linkini mevcut v1
  "harici link ekle" akışıyla geri Sahana'ya ekler.
- `docs/features/05-videos.md` ve `docs/research/sosyalhalisaha.md` §3.1
  güncellendi. Henüz kod yazılmadı — kullanıcı diğer modüller bitene kadar
  geliştirme/değişiklikleri ertelemek istiyor (Modül 4 test edildi, crash
  yok, iyileştirme istekleri modüller bitince ele alınacak).

### Sonraki adım
- Kullanıcının onayıyla Modül 5 implementasyonuna (v1 harici link + v1.5
  deep-link) başlanacak; öncesinde ROADMAP sırası ve kullanıcı tercihi
  netleşmeli (Modül 4 cihaz testi bekleniyor, birikmiş iyileştirme istekleri
  var ama "modüller bitince" ertelendi).

## 2026-07-06 — Modül 4 tamamlandı: Sosyal Katman (mobil)

- **Karar (kullanıcı):** Takıma etiketli gönderiyi herhangi bir takım üyesi
  paylaşabilir (sadece kaptan değil). 04-social-feed.md'ye işlendi.
- **Ekranlar:** (tabs)/feed (cursor-paginate akış, optimistic beğeni,
  "Gönderi paylaş" CTA, arama ikonu), post/create (metin gönderi + opsiyonel
  takım etiketleme çipleri, 500 karakter sayaç), post/[id] (detay + yorumlar,
  yorum composer'ı, "..." menüsünden şikayet/sil), player/[id] (herkese açık
  profil: takipçi/takip sayıları, takip et/çık, engelle/kaldır, engellenmiş
  kullanıcının gönderileri gizlenir, şikayet), search/index (oyuncu/takım
  sekmeli arama, 2+ karakterde tetiklenir).
- **Bug fix (kendi hatam):** post/create.tsx'i ilk yazışımda gönderi metni
  kutusu işlevsiz bir `Pressable` idi (boş `onPress`), gerçek metin girişi
  yapılamıyordu — fark edip gerçek `TextInput`'a çevirdim.
- Yazar adına dokunarak player/[id]'ye gitme feed + post detayına eklendi
  (PostCard'a opsiyonel `onPressAuthor` prop'u).
- Doğrulama: mobil lint + tsc temiz; Expo Router typed routes yeniden
  üretildi (4 yeni rota: post/create, post/[id], player/[id], search).
- API tarafı (migration/model/Action/controller/25 test) önceki oturumda
  bitmiş ve commit edilmişti (b48176c).

## 2026-07-04 (5) — İki çökme düzeltmesi (takvim + splash screen)

- **Takvim çökmesi:** `react-native-calendars`, RN 0.81/New Architecture ile
  "Cannot convert undefined value to object" hatası veriyordu (maç kurma →
  "Başka gün"). Kütüphane tamamen kaldırıldı (`npm uninstall`); yerine harici
  bağımlılıksız `shared/ui/MonthCalendar.tsx` yazıldı (ay ızgarası, önceki/
  sonraki ay gezinme, minDate öncesi günler devre dışı, tema token'larıyla
  birebir). `match/create.tsx` buna geçirildi.
- **Splash screen hatası:** Kök layout'taki navigasyon efekti `Segments`
  her değiştiğinde (yani her sayfa geçişinde) `SplashScreen.hideAsync()`'i
  tekrar çağırıyordu; splash zaten gizlendikten sonra tekrarlanan çağrı
  reddediliyordu ("No native splash screen registered..."). Düzeltme:
  hideAsync çağrısı artık sadece `Ready` ilk true olduğunda çalışan ayrı
  bir effect'te (bağımlılık: sadece `[Ready]`).
- BACKLOG.md #3'e not düşüldü (kütüphane değişikliği).
- Lint + tsc temiz.

## 2026-07-04 (4) — Backlog #1-3 tamamlandı

- **Özel kadro kurma:** team/[id]/index.tsx "Yeni kadro" akışına "Özel…"
  eklendi — 3-14 arası puk sayısı stepper ile seçilir, `generateCustomSlots`
  ızgara halinde yerleştirir, kullanıcı sonra serbestçe sürükler.
- **Keşif yarıçap seçici:** listings/index.tsx'e 5/10/25/50 km çipleri
  eklendi (RADIUS_OPTIONS), her iki keşif sekmesini etkiliyor.
- **Serbest tarih seçimi:** match/create.tsx'e `react-native-calendars` ile
  temalanmış takvim modalı eklendi ("Başka gün" düğmesi); gün state'i
  `DayOffset`'ten `SelectedDate: Date` nesnesine geçirildi.
- İlgili spec'ler (02-team-lineup.md, 03-match-organization.md) ve
  BACKLOG.md güncellendi (üç madde ✅). Madde #4 (bildirimler) kullanıcı
  tercihiyle şimdilik ertelendi.
- Lint + tsc temiz.

## 2026-07-04 (3) — Kadro tahtası çökme düzeltmesi + backlog dokümanı

- **Bug fix:** Kadro tahtası ekranı (team/[id]/lineup/[lid]) açılırken hata
  veriyordu. Kök neden: uygulama kökünde `GestureHandlerRootView` yoktu;
  `PitchBoard`'daki `GestureDetector` (sürükleme) buna ihtiyaç duyuyor —
  uygulamada gesture kullanan tek ekran orası olduğu için sorun sadece kadro
  açılışında görünüyordu. `mobile/src/app/_layout.tsx`'e eklendi.
- **docs/BACKLOG.md oluşturuldu:** Kullanıcının talep ettiği dört iyileştirme
  buraya kaydedildi (henüz kodlanmadı): (1) kadro tahtasında serbest/özel
  kadro kurma — preset'lere ek, (2) keşifte kullanıcının arama yarıçapını
  seçebilmesi, (3) maç kurarken 14 günlük şerit dışında takvimden serbest
  tarih seçimi, (4) push bildirimler (maç hatırlatma, rakip bulundu vb. —
  zaten Modül 7'de planlı, öncelik sırası kullanıcıyla netleşecek).
  CLAUDE.md Hızlı Referans'a eklendi.
- Bağlantı hatası (mobil .env'deki IP ile Mac'in güncel LAN IP'si uyuşmazlığı)
  kullanıcı tarafından kendisi çözüldü.

### Sonraki adım
- Kullanıcı BACKLOG.md'deki dört maddeden hangisiyle devam edileceğine
  karar verecek.

## 2026-07-04 (2) — Modül 3 tamamlandı: Maç Organizasyonu & Oyuncu Bulma

- **API:** matches (FootballMatch modeli — `match` PHP'de ayrılmış sözcük),
  match_participants, player_listings, listing_applications, opponent_listings.
  Maç kur (takım üyeleri otomatik katılımcı) → RSVP (idempotent) → adam eksik
  ilanı → başvuru → kaptan onayı (katılımcı ekle + sayaç düş + dolunca filled).
  Rakip ilanı: aç → keşifte listele → rakip kaptan "maç yapalım" →
  opponent_team_id dolar. matches:sweep (saatlik): geçmiş maçlar played,
  süresi dolan ilanlar expired. MatchPolicy elle Gate::policy ile bağlı.
- **Konum kararı (spec'e işlendi):** v1'de POINT yerine lat/lng decimal +
  bileşik indeks + bounding-box; mesafe sıralaması PHP haversine (Support/Geo).
  Gerekçe: test paketi sqlite; 10-50 km için doğruluk yeterli.
- **Öğrenilen:** Eloquent `create()` DB varsayılanlarını (status kolonları)
  bellekteki modele yansıtmaz — create sonrası `refresh()` gerekiyor
  (üç action'da düzeltildi).
- **Mobil:** matches sekmesi gerçek listeye dönüştü (Yaklaşan/Geçmiş +
  durum/RSVP özeti kartları); match/create sihirbazı (takım, saha, 14 günlük
  gün şeridi + saat çipleri, format, ücret — native date picker bağımlılığı
  yok); match/[id] detay (üç durumlu RSVP, kadro listesi, kaptan aksiyonları:
  onayla/iptal/adam-eksik/rakip ilanı); match/[id]/listing (ilan formu:
  mevki çipleri + kişi stepper + seviye aralığı; başvuru onay/red);
  listings keşfi (expo-location + İstanbul fallback, Adam Eksik / Rakip
  Arayanlar sekmeleri, mesafe rozetli kartlar, tek dokunuş başvuru).
- API 83 test + Pint + Larastan yeşil; mobil lint + tsc temiz.
- **MVP tamam:** Modül 1+2+3 bitti — ROADMAP'e göre store'a çıkılabilir
  seviye; öncesinde cihazda uçtan uca kullanıcı testi şart.

### Sonraki adım
- Kullanıcı cihaz testi (özellikle: maç kur → RSVP → ilan → başvuru → onay
  zinciri iki hesapla).
- Sonrası ROADMAP sırasına göre Modül 4 (Sosyal Katman) — veya kullanıcı
  tercihiyle store hazırlığı (ikon, splash, EAS build, TestFlight).

## 2026-07-04 — Modül 2 tamamlandı: Takım & Kadro Kurma

- **API:** teams/team_members/team_invites/lineups tabloları; TeamPolicy
  (view/update/manageInvites/transferCaptaincy/manageLineups); Action'lar
  (CreateTeam, GenerateTeamInvite, AcceptTeamInvite, RemoveTeamMember,
  TransferCaptaincy, CreateLineup/UpdateLineup + ResolveLineupPositions).
  Endpoint'ler spec'e birebir + iki gerekçeli ek: `GET /teams` (listem) ve
  `GET /teams/{id}/lineups` (Modül 1'deki `GET /cities` emsaliyle aynı mantık).
  Kaptan takımdan ayrılamaz (önce devretmeli); yetkisiz işlemler 403.
  28 yeni Pest testi (toplam 54), Larastan ve Pint temiz.
- **Larastan notu:** `casts()` metodu ile tanımlı date/array cast'ler, ilgili
  alan üzerinde Carbon/array-özel metot çağrıldığında Larastan 3.10 tarafından
  doğru tipte görülmüyor (ham DB tipine düşüyor) — çözüm: model sınıflarına
  `@property` docblock'u eklemek (TeamInvite, Lineup, TeamMember, User::$pivot).
  Bu, ileride benzer modellerde karşılaşılırsa hatırlanmalı.
- **Mobil:** "Gece Maçı" tasarım sistemine sadık kalarak: (tabs)/teams listesi,
  team/create (3 adım: isim→arma→renk), team/[id] detay (üyeler, kadrolar,
  davet, kaptan aksiyonları), team/[id]/invite (QR + kopyala + paylaş),
  team/[id]/lineup/[lid] (kadro tahtası).
  **Kadro tahtası tasarım kararı:** spec "bench'ten sürükle-bırak" tarif
  ediyordu; bunun yerine "puk sahada serbest sürüklenir (yeniden konumlama) +
  dokunma ile oyuncu/misafir atama sayfası açılır" modelini uyguladım — aynı
  kabul kriterlerini (60fps sürükleme, misafir pulu, atama) karşılıyor ama
  daha güvenilir bir gesture implementasyonu. Spec'in açık sorularına not
  düşüldü, kullanıcı onayı bekliyor.
  PNG export: react-native-view-shot + expo-sharing, alt köşede
  "sahana.app ile kuruldu" filigranı (büyüme kancası).
  Davet: `Linking.createURL` + `react-native-qrcode-svg`; oturumsuz kullanıcı
  join ekranına gelirse kod `pendingInviteStore`'da bekletilip OTP/onboarding
  bitince otomatik kabul ediliyor.
- **Düzeltmeler:** `Controller`'a `AuthorizesRequests` trait'i eklendi (Laravel
  12 iskeleti varsayılan getirmiyor); `AccessDeniedHttpException`→403 zarfı
  eklendi (policy reddi Laravel'de bu şekilde geliyor, `AuthorizationException`
  değil). Route typed-routes önbelleği (`.expo/types/router.d.ts`) yeni
  ekranlar için `expo start` ile yeniden üretildi.
- Doğrulama: API 54 test + Pint + Larastan yeşil; mobil lint + tsc temiz.

### Sonraki adım
- Modül 3: docs/features/03-match-organization.md (maç organizasyonu +
  adam eksik ilanları) — Modül 2'nin `teams`/`lineups` altyapısına bağlanacak.

## 2026-07-03 (6) — Expo SDK 57 → 54 düşürüldü (geçici)

- **Neden:** Expo Go'nun SDK 57 sürümü Apple incelemesinde, App Store'daki
  sürüm SDK 54 destekliyor; kullanıcı kendi iPhone'unda test etmek istedi.
- expo@54.0.35 / expo-router@6 / RN 0.81.5; temiz npm install; expo-doctor
  17/17, tsc + lint yeşil. Kod değişikliği gerekmedi.
- **Geri yükseltme:** Expo Go 57 App Store'a düşünce `npm install expo@^57 &&
  npx expo install --fix` ile dönülecek (not: SDK 57'nin react-server-dom
  bağımlılıkları için node_modules temiz kurulum gerekebilir).
- Cihaz testi için `mobile/.env` → EXPO_PUBLIC_API_URL=http://192.168.1.113:8000/api/v1
  (Wi-Fi değişirse IP güncellenmeli).

## 2026-07-03 (5) — Modül 1 mobil ekranları tamamlandı

- **Tasarım sistemi "Gece Maçı":** koyu çim zemini (#0B1F14), tebeşir saha
  çizgileri motifi (PitchLines), tek aksan projektör limonu (#C9F24E).
  Fontlar: Barlow Condensed (display), Manrope (gövde), Space Mono (kod/skor).
  Token'lar `src/shared/ui/theme.ts` — ekranlarda ham hex yasak.
- **İmza etkileşimler:** onboarding'de mevki seçimi mini saha üzerinde
  (PitchPositionPicker); OTP girişi skorbord hücreleri (OtpInput).
- **Akış:** welcome → identifier (tek alan: telefon/e-posta) → otp (120 sn
  sayaç, otomatik gönderim, tekrar gönder) → onboarding (isim → mevki → seviye
  → şehir, 4 adım) → (tabs)/profile. Token SecureStore'da; kök _layout auth
  kapısı yönlendirmeyi yapıyor.
- **Ekranlar:** (tabs) profil (forma kartı: isim, mevki çipleri, seviye rozeti,
  çıkış + KVKK hesap silme) ve maçlar (Modül 3 için "yakında" boş durumu).
- **Altyapı:** axios client (`EXPO_PUBLIC_API_URL`, varsayılan
  http://127.0.0.1:8000/api/v1 — fiziksel cihazda LAN IP gerekir), API hata
  zarfı normalize ediliyor (`toApiFailure`), TanStack Query + Zustand.
- API'ye `GET /cities` eklendi (onboarding şehir seçimi; spec güncellendi).
- Şablon artıkları silindi (components/hooks/constants, explore).
  Doğrulama: mobil lint + tsc temiz; API 26 test + Pint + Larastan yeşil.

### Sonraki adım
- Cihazda/simülatörde kullanıcı testi: `php artisan serve` (api/) +
  `npx expo start` (mobile/); OTP kodu `storage/logs/laravel.log`'a düşer.
- Sonra Modül 2: docs/features/02-team-lineup.md (takım & kadro).

## 2026-07-03 (4) — Modül 1 API tamamlandı

- **Spec güncellemesi (kullanıcı kararı):** OTP kanalı telefon VEYA e-posta, tek
  `identifier` alanı. E-posta OTP v1'de aktif; SMS `SmsSender` arayüzü arkasında
  (LogSmsSender). Google/Apple girişi store anahtarları hazır olunca.
- **Endpoint'ler:** POST /auth/otp, /auth/verify, /auth/logout; GET/PATCH/DELETE /me;
  GET /players/{publicId}. Hepsi api-conventions zarfı ve hata formatıyla
  (validation_failed, otp_expired, otp_invalid, otp_locked, otp_rate_limited,
  unauthenticated, not_found kodları bootstrap/app.php'de render ediliyor).
- **DB:** users alter (public_id ULID, phone, avatar_path, soft delete; name/email/
  password nullable), cities (81 il, plaka=id, seed), player_profiles.
- **KVKK:** DELETE /me anonimleştirir + soft delete; `users:purge` komutu 30 gün
  sonra kalıcı siler (günlük schedule).
- **Doğrulama:** 25 Pest testi + Pint + Larastan (1G memory) yeşil; e-posta OTP →
  verify → PATCH /me akışı çalışan sunucuda uçtan uca test edildi.
- Not: Lokal `.env` QUEUE_CONNECTION=sync (worker derdi yok); prod'da Redis+Horizon.
- Not: Testte aynı senaryoda ikinci istek için `auth->forgetGuards()` gerekiyor
  (guard, ilk isteğin kullanıcısını hatırlıyor).

### Sonraki adım
- Modül 1 mobil tarafı: (auth) ekranları — welcome, identifier girişi, OTP,
  onboarding; token'ın SecureStore'a yazılması; /me profil ekranı.

## 2026-07-03 (3) — GitHub + lokal MySQL

- Remote: https://github.com/talhabekci/sahana.git (`origin/main`).
- Commit kuralı (kullanıcı talebi): mesajlarda Claude/co-author atfı YOK;
  mevcut commit'lerden de temizlendi (filter-branch).
- Lokal DB: Sail yerine kullanıcının brew MySQL'i (9.5) — `sahana` veritabanı,
  `root`/şifresiz, `127.0.0.1`. Migration'lar çalıştı, testler yeşil.
  `.env` + `.env.example` güncellendi; docs (ROADMAP, tech-stack, architecture) işlendi.

## 2026-07-03 (2) — Faz 0 tamamlandı: monorepo iskeleti

- Kök repo `git init` (main); ilk commit: 143 dosya.
- **api/**: Laravel 12.62 + Sanctum (install:api) + Pest + Pint + Larastan (level 6)
  + Sail (mysql, redis). `/api/v1/health` endpoint'i zarf formatıyla; 3 test yeşil,
  Pint ve Larastan temiz. Test ortamı sqlite :memory:. `app/Actions/{Auth,Team,Match}`
  ve `app/Http/Controllers/Api/V1` klasör yapısı hazır.
- **mobile/**: Expo SDK 57 (RN 0.86, TS strict, expo-router) + TanStack Query,
  Zustand, axios, expo-secure-store. `src/features/{auth,team,match}` + `src/shared`
  yapısı. Şablonun bozuk web kalıntıları temizlendi (global.css importu,
  use-color-scheme.web.ts); lint + tsc yeşil. Not: web hedeflenmiyor,
  `*.web.*` dosyaları tsconfig'de exclude.
- CI: `.github/workflows/api-ci.yml` (pint+larastan+pest) ve `mobile-ci.yml` (lint+tsc).
- Not: migration hiç çalıştırılmadı (yerel MySQL yok); geliştirme DB'si Sail ile:
  `cd api && ./vendor/bin/sail up -d && sail artisan migrate`

### Kod stili kararı (kullanıcı, 2026-07-03)
- **PHP değişkenleri PascalCase** (`$PricePerPlayer`), controller/sınıf PascalCase,
  metotlar camelCase, DB tabloları snake_case. api-conventions.md §8'e işlendi.

### Sonraki adım
- Modül 1: docs/features/01-auth-profile.md implementasyonu.

## 2026-07-03 — Proje başlangıcı + doküman seti

- ROADMAP.md yazıldı; mobil teknoloji kararı **React Native (Expo)** olarak kesinleşti.
- Tüm `docs/` seti oluşturuldu: tech-stack, architecture, api-conventions,
  market-research, research/sosyalhalisaha, features/01-08.
- Kritik kararlar: sosyalhalisaha scrape edilmeyecek (v1 link/embed);
  MVP = Modül 1+2+3; kadro PNG export'u viral büyüme kanalı.
- CLAUDE.md (çalışma kuralları) ve bu dosya oluşturuldu.
- Faz 0 iskelet kurulumu başladı (Laravel api/ + Expo mobile/).

### Sonraki adım
- Faz 0'ı bitir: api/ + mobile/ iskeletleri, CI, git init.
- Ardından Modül 1 (docs/features/01-auth-profile.md) implementasyonu.
