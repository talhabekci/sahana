# Modül 7 — Bildirim & Mesajlaşma

> Durum: **Tamamlandı** (2026-07-07, API + mobil) · Bağımlılık: Modül 1-3 ·
> Altyapı: Expo Push API + Laravel Reverb + MongoDB (sohbet)

## Amaç
Organizasyonu WhatsApp'tan tamamen koparabilmenin son parçası: doğru zamanda
doğru bildirim + takım içi sohbet.

## Kararlar (kullanıcı, 2026-07-07)

1. **Kapsam:** Aşağıdaki 7 bildirim tetikleyicisinin **tamamı** aynı oturumda
   yazılır (artık MVP aşamasında değiliz, Modül 1-6 bitti).
2. **Sohbet geçmişi:** MySQL yerine **MongoDB**'de tutulur (yüksek yazma
   hacmi + esnek şema; ilişkisel olmayan veri için daha uygun). Yerelde
   `brew install mongodb-community` ile kurulan instance kullanılır (zaten
   bu makinede kurulu ve çalışıyor); staging/production'da VPS üzerinde
   container. Saklama süresi sınırı **yok** — v1'de basit tutulur, mesaj
   koleksiyonu büyümesi ileride izlenir.
3. **Sessiz saat:** Varsayılan **açık** (00:00-08:00 arası, `Europe/Istanbul`
   sabit — kullanıcı bazlı saat dilimi v1'de yok). Zamana bağlı olmayan
   push'lar bu pencerede **08:00'e ertelenir** (silinmez); uygulama içi
   bildirim kaydı her durumda anında oluşur. Kullanıcı profilinden kapatabilir.

### Teknik not: FCM yerine Expo Push API
Proje Expo-managed olduğundan backend hiçbir zaman ham Firebase Admin SDK/FCM
ile konuşmaz — Expo'nun kendi push servisine (`https://exp.host/--/api/v2/push/send`)
tek bir HTTPS çağrısı yapılır, APNs/FCM yönlendirmesini Expo arkada halleder.
Bu, Firebase proje kurulumu/service-account credential yükünü tamamen ortadan
kaldırır. Mobilde `expo-notifications` ile push token alınır.

> **Not (Expo Go kısıtı):** Expo Go (SDK 53+) uzak push bildirimlerini artık
> desteklemiyor — gerçek bir Expo push token'ı yalnızca bir development
> build'de (`eas build --profile development`) alınabilir. `usePushRegistration`
> hook'u Expo Go'da hatasız sessizce hiçbir şey yapmaz; uygulama içi bildirim
> kaydı ve takım sohbeti (Reverb WS) bu kısıttan etkilenmez, Expo Go'da normal
> çalışır.

> **Not (2026-07-08):** `ExpoPushClient`, Expo'nun `data[].status: error`
> yanıtlarını (ör. `DeviceNotRegistered`) artık okuyup logluyor; token
> kalıcı geçersizse (`DeviceNotRegistered`) ilgili `devices` kaydı otomatik
> silinir — böylece prod'da push'lar sessizce başarısız olup hiç fark
> edilmez hâle gelmiyor (bkz. BACKLOG.md #17).

## Bildirimler

| Olay | Alıcı | Tetikleyici |
|---|---|---|
| Maç oluşturuldu | Takım üyeleri (oluşturan hariç) | `CreateMatch` Action |
| Maç onaylandı | Takım üyeleri | `ChangeMatchStatus` (confirm) |
| RSVP hatırlatma (maça 24s kala yanıtsızlara) | Yanıtsız üyeler | `notifications:rsvp-reminders` (saatlik sweep) |
| Maç hatırlatma (3 saat kala) | RSVP=yes diyenler | `notifications:match-reminders` (saatlik sweep) |
| Adam eksik başvurusu | Kaptan | `ApplyToListing` Action |
| Başvuru onayı/reddi | Başvuran | `DecideApplication` Action |
| Davet kabul edildi | Kaptan | `AcceptTeamInvite` Action |
| Rakip bulundu | İlanı açan takımın kaptanı | `MatchOpponentListing` Action (2026-07-09, BACKLOG.md #4) |
| Beğeni/yorum/takip (Modül 4) | İçerik sahibi | `notifications:social-summary` (birkaç saatte bir toplu) |

- Teknik: Laravel Notifications, özel `App\Notifications\Channels\ExpoChannel` +
  `database` channel birlikte (her bildirim hem push hem uygulama-içi kayıt).
  Expo push token kaydı `POST /me/devices`. Tercih ekranı: kategori bazlı
  aç/kapa + sessiz saat anahtarı (`GET/PATCH /me/notification-preferences`).
- Sosyal bildirimler (beğeni vb.) **batch/özet** gönderilir — bildirim
  yorgunluğu uygulama silmenin ilk sebebi. `player_profiles.last_social_summary_at`
  ile son özetten bu yana birikenler toplanır.
- Uygulama içi bildirim merkezi: `GET /notifications` (Laravel'in yerleşik
  `database` notification tablosu — `notifications:table` ile üretildi).

## Takım Sohbeti
- Takım başına tek kanal (WhatsApp grubunun karşılığı)
- Reverb (WebSocket) canlı; offline'a push fallback (mesaj bildirimi de
  ExpoChannel üzerinden gider, ayrı bir "sessiz" kategori olarak — 7/24,
  sessiz saat kuralına tabi değil, çünkü zaten anlık/isteğe bağlı bir kanal)
- Mesaj türleri: metin, görsel (galeri + kamera), sesli mesaj (kayıt, max 2
  dk, `expo-audio`); maç kartı/kadro paylaşımı (uygulama içi referans).
  Görsel/ses BACKLOG #26 ile eklendi (2026-07-11) — DM'de henüz yok,
  kapsam netleşirken ayrı ele alınacak (bkz. Sohbet — DM bölümü)
- **Broadcasting auth:** `channels:` parametresi varsayılan olarak `/broadcasting/auth`'u
  `web` (session) middleware'iyle kaydediyor — mobil Sanctum bearer token
  kullandığından `withBroadcasting()` ile elle `auth:sanctum` + `/api/v1`
  prefix'i verildi. Gerçek endpoint: `POST /api/v1/broadcasting/auth`
  (Authorization header zorunlu).

> **Bulunan hata (2026-07-07, cihaz testi):** WS kanal adı istemci/sunucu
> arasında uyuşmuyordu — mobil `team.{public_id}` (ULID) dinliyordu, backend
> `team.{Team->id}` (MySQL iç sayısal id) yayınlıyor ve öyle yetkilendiriyordu.
> Asla eşleşmediğinden canlı mesaj iletimi sessizce çalışmıyordu (mesaj REST
> ile gönderiliyor/kaydediliyordu, sadece WS anlık push'u ölüydü). Düzeltme:
> backend `public_id` üzerinden yayın/yetki yapacak şekilde değiştirildi
> (`team.{public_id}`) — mobil taraf zaten public_id kullandığından mobilde
> değişiklik gerekmedi.

## Sohbet — DM (birebir mesajlaşma) (kullanıcı, 2026-07-07 devam)

Backlog #11'den taşındı; kullanıcı önce backlog'a eklenmesini, ardından aynı
oturumda uygulanmasını istedi.

- **Veri modeli:** Ayrı bir koleksiyon/tablo yok — **aynı `messages`
  koleksiyonu**. Takım mesajında `team_id` dolu/`participant_ids` boş; DM
  mesajında `team_id` boş/`participant_ids` dolu (`[minUserId, maxUserId]`,
  MySQL iç sayısal id'lerle sıralı 2 elemanlı dizi — sorgu/index için).
  `SendMessage`/`ListMessages` Action'ları takıma özgü kalır; DM için ayrı
  `SendDirectMessage`/`ListDirectMessages`/`ListConversations` Action'ları
  eklenir (aynı `Message` modelini kullanırlar, kod tekrarı yok).
- **Kapsam (v1):** Sadece **metin + görsel**. Maç kartı/kadro paylaşımı DM'de
  yok (bir takımın maçını/kadrosunu paylaşmak, alıcının o takıma/maça
  yetkili olup olmadığı sorusunu gereksiz yere karmaşıklaştırıyor — takım
  sohbetinde zaten mümkün).
- **Yetki:** Herhangi bir kullanıcı, birbirini engellemediği sürece
  diğerine DM atabilir (arkadaşlık/takip şartı yok — v1 basit tutulur,
  `isBlockedWith()` kontrolü zaten Modül 4'te var, aynen kullanılıyor).
  Kendine mesaj gönderme reddedilir.
- **WS kanalı:** `private-dm.{PublicIdA}.{PublicIdB}` — iki kullanıcının
  `public_id`'si **alfabetik sırayla** (kanal adı deterministik olsun diye).
  Yetki: bağlanan kullanıcının `public_id`'si ikisinden biri olmalı.
- **Sohbet listesi (yeni "Sohbet" sekmesi):** `GET /conversations` —
  kullanıcının üyesi olduğu takım sohbetleri + DM yaptığı kişiler, son mesaj
  zamanına göre birleşik/sıralı tek liste. v1'de ayrı bir "conversations"
  tablosu yok — takım listesi `User->teams()` ilişkisinden, DM listesi ise
  kullanıcının dahil olduğu son ~200 DM mesajı taranıp kişi bazında
  ilkine (en yeniye) indirgenerek türetilir (agregasyon pipeline'ı yok,
  "v1'de basit tutulur" ilkesine sadık — mesaj hacmi arttıkça izlenecek).
  Okunmamış sayacı **yok** (v1 kapsamı dışı, mevcut takım sohbetiyle
  tutarlı).
- **Giriş noktaları:** Alt sekme çubuğuna "Sohbet" sekmesi (tüm
  konuşmaların listesi); `player/[id].tsx` herkese açık profilinde
  "Mesaj gönder" butonu.

## API

- `POST /me/devices` `{expo_push_token, platform}` — upsert (aynı token
  tekrar gönderilirse idempotent).
- `GET /notifications` (cursor) · `POST /notifications/{id}/read` ·
  `POST /notifications/read-all`.
- `GET /me/notification-preferences` · `PATCH /me/notification-preferences`
  `{categories: {...}, quiet_hours_enabled}`.
- `GET /teams/{id}/messages?before=<id>&limit=30` — **manuel cursor**
  (Laravel'in native `cursorPaginate()`'i MongoDB sürücüsüyle garantili
  uyumlu değil; aynı `{data, meta.next_cursor}` zarfı korunur, üretimi
  elle yapılır — api-conventions.md'den kasıtlı, gerekçeli sapma).
- `POST /teams/{id}/messages` — `type: text|image|audio|match_ref|lineup_ref`.
  `text`: `{body}`. `image`: multipart `{image: file}` (BACKLOG #7 güvenlik
  deseni — `ImageUploader`, gerçek içerik doğrulama + JPEG re-encode).
  `audio`: multipart `{audio: file (m4a/aac/wav/mp3, max 5MB), audio_duration?}`
  — sesli mesaj, ham dosya `Storage::disk('public')` üzerinde saklanır (görsel
  gibi yeniden encode edilmez, sadece mimes/uzantı doğrulaması). `match_ref`/
  `lineup_ref`: `{match_id}`/`{lineup_id}`. Backlog #26.
- WS kanalı: `private-team.{public_id}` (yetki: takım üyesi olmak yeterli).
- `GET /conversations` — birleşik sohbet listesi (takım + DM), son mesaj
  zamanına göre sıralı.
- `GET /players/{PublicId}/messages?before=<id>&limit=30` — DM geçmişi
  (aynı manuel cursor zarfı).
- `POST /players/{PublicId}/messages` `{type: text|image, body?, image_path?}`.
- WS kanalı: `private-dm.{PublicIdA}.{PublicIdB}` (alfabetik sıralı,
  yetki: bağlanan taraflardan biri olmak).

## Veri Modeli

- `devices` (MySQL): `user_id`, `expo_push_token` (unique), `platform: ios|android`.
- `notifications` (MySQL, Laravel yerleşik): `id (uuid)`, `type`,
  `notifiable_type/id`, `data (json)`, `read_at`.
- `player_profiles`'a eklenen kolonlar: `quiet_hours_enabled` (bool, default
  true), `notification_preferences` (json, nullable — null ise "hepsi açık"
  varsayılır), `last_social_summary_at` (timestamp, nullable).
- `messages` (**MongoDB**, `sahana_chat` veritabanı): `team_id?` (takım
  sohbeti), `participant_ids?` (DM, `[minUserId, maxUserId]`), `user_id`,
  `type: text|image|audio|match_ref|lineup_ref`, `body?`, `image_path?`,
  `audio_path?`, `audio_duration?` (saniye, sadece takım sohbetinde —
  DM'de `audio` tipi henüz yok), `match_id?`, `lineup_id?`, `created_at`.
  Her mesaj ya `team_id` ya `participant_ids` doldurur, ikisi birden değil.
  `_id` (ObjectId) doğrudan public ID olarak kullanılır (zaten tahmin
  edilemez).

## Açık Sorular
- [ ] v2: Reverb prod'da ayrı bir process olarak nasıl ayakta tutulacak
  (systemd/supervisor) — deploy dokümantasyonu gerektiğinde eklenecek.
- [ ] Sosyal özet bildiriminin sıklığı (saatlik mi, birkaç saatte bir mi) —
  ilk sürüm 3 saatte bir; kullanıcı geri bildirimine göre ayarlanabilir.
