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
- Mesaj türleri: metin, görsel; maç kartı/kadro paylaşımı (uygulama içi referans)
- Kapsam dışı (şimdilik): DM, sesli mesaj, okundu bilgisi (basit tutulur)
- **Broadcasting auth:** `channels:` parametresi varsayılan olarak `/broadcasting/auth`'u
  `web` (session) middleware'iyle kaydediyor — mobil Sanctum bearer token
  kullandığından `withBroadcasting()` ile elle `auth:sanctum` + `/api/v1`
  prefix'i verildi. Gerçek endpoint: `POST /api/v1/broadcasting/auth`
  (Authorization header zorunlu).

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
- `POST /teams/{id}/messages` `{type, body?, image_path?, match_id?, lineup_id?}`.
- WS kanalı: `private-team.{id}` (yetki: takım üyesi olmak yeterli).

## Veri Modeli

- `devices` (MySQL): `user_id`, `expo_push_token` (unique), `platform: ios|android`.
- `notifications` (MySQL, Laravel yerleşik): `id (uuid)`, `type`,
  `notifiable_type/id`, `data (json)`, `read_at`.
- `player_profiles`'a eklenen kolonlar: `quiet_hours_enabled` (bool, default
  true), `notification_preferences` (json, nullable — null ise "hepsi açık"
  varsayılır), `last_social_summary_at` (timestamp, nullable).
- `messages` (**MongoDB**, `sahana_chat` veritabanı): `team_id`, `user_id`,
  `type: text|image|match_ref|lineup_ref`, `body?`, `image_path?`,
  `match_id?`, `lineup_id?`, `created_at`. `_id` (ObjectId) doğrudan public
  ID olarak kullanılır (zaten tahmin edilemez).

## Açık Sorular
- [ ] v2: Reverb prod'da ayrı bir process olarak nasıl ayakta tutulacak
  (systemd/supervisor) — deploy dokümantasyonu gerektiğinde eklenecek.
- [ ] Sosyal özet bildiriminin sıklığı (saatlik mi, birkaç saatte bir mi) —
  ilk sürüm 3 saatte bir; kullanıcı geri bildirimine göre ayarlanabilir.
