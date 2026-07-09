# İlerleme Kaydı

> Her çalışma seansı buraya tarihli kayıt düşer. Yeni oturum işe başlamadan
> önce bu dosyayı okur. Format: en yeni kayıt en üstte.

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
