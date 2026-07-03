# Modül 7 — Bildirim & Mesajlaşma

> Durum: **Ön taslak** · MVP sonrası (push'un basit hali MVP'ye çekilebilir)
> Bağımlılık: Modül 1-3 · Altyapı: FCM + Laravel Reverb

## Amaç
Organizasyonu WhatsApp'tan tamamen koparabilmenin son parçası: doğru zamanda
doğru bildirim + takım içi sohbet.

## Bildirimler (öncelikli)

| Olay | Alıcı | Kanal |
|---|---|---|
| Maç oluşturuldu/onaylandı | Takım üyeleri | Push |
| RSVP hatırlatma (maça 24s kala yanıtsızlara) | Yanıtsız üyeler | Push |
| Maç hatırlatma (3 saat kala) | "Geliyorum" diyenler | Push |
| Adam eksik başvurusu | Kaptan | Push |
| Başvuru onayı/reddi | Başvuran | Push |
| Davet kabul edildi | Kaptan | Push |
| Beğeni/yorum/takip (Modül 4) | İçerik sahibi | Push (toplu/özet) |

- Teknik: Laravel Notifications → FCM channel; Expo push token kaydı
  `POST /me/devices`. Tercih ekranı: kategori bazlı aç/kapa (`GET/PATCH /me/notification-preferences`).
- Sosyal bildirimler (beğeni vb.) **batch/özet** gönderilir — bildirim yorgunluğu
  uygulama silmenin ilk sebebi.
- Uygulama içi bildirim merkezi: `GET /notifications` (DB channel paralel yazar).

## Takım Sohbeti
- Takım başına tek kanal (WhatsApp grubunun karşılığı)
- Reverb (WebSocket) canlı; offline'a push fallback
- Mesaj türleri: metin, görsel; maç kartı/kadro paylaşımı (uygulama içi referans)
- Kapsam dışı (şimdilik): DM, sesli mesaj, okundu bilgisi (basit tutulur)

## Taslak API
`POST /me/devices` `{expo_push_token, platform}` ·
`GET /notifications` + `POST /notifications/read` ·
`GET /teams/{id}/messages` (cursor) · `POST /teams/{id}/messages` ·
WS kanalı: `private-team.{id}`

## Açık Sorular
- [ ] MVP'ye minimum hangi push'lar çekilmeli? (öneri: maç oluşturuldu + başvuru geldi)
- [ ] Sohbet geçmişi saklama süresi / maliyeti (mesaj tablosu büyümesi)
- [ ] Sessiz saat (gece 00-08 push gönderme) varsayılan olsun mu?
