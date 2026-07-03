# Modül 4 — Sosyal Katman (Feed)

> Durum: **Ön taslak** · MVP sonrası · Bağımlılık: Modül 1-3
> Modül başlarken detaylandırılacak.

## Amaç
Uygulamayı "araçtan" "her gün açılan yere" dönüştürmek: maç sonuçları, kadro
paylaşımları ve videolardan oluşan akış + takip mekanizması.

## Kapsam (ilk sürüm)
- Feed: takip ettiklerim + takımlarımın aktiviteleri (kronolojik; algoritma yok)
- İçerik türleri: maç sonucu kartı, kadro görseli, video linki, düz gönderi (metin+foto)
- Takip et / takipçi modeli (onaysız, herkese açık profil varsayımı)
- Beğeni + yorum
- Keşfet: oyuncu/takım arama

### Kapsam dışı (şimdilik)
- Algoritmik sıralama · hikayeler · DM (Modül 7'de takım sohbeti önce)

## Otomatik içerik (soğuk başlangıç çözümü)
Feed'i kullanıcı üretimi beklemeden dolduran sistem olayları:
maç oynandı → sonuç kartı otomatik düşer; kadro dizildi → paylaşım önerilir.
**Kural:** otomatik kartlar kullanıcı ayarıyla kapatılabilir olmalı.

## Taslak API
`GET /feed` (cursor) · `POST /posts` · `POST /posts/{id}/like` ·
`POST /posts/{id}/comments` · `POST /players/{id}/follow` ·
`GET /search?q=&type=player|team`

## Veri Modeli (taslak)
`posts` (id, user_id, team_id?, type: result|lineup|video|text, body, media JSON,
subject_type/subject_id polimorfik) · `likes` · `comments` · `follows`
(follower_id, followed_id). Feed v1: sorgu + Redis cache (architecture.md kararı).

## Moderasyon (baştan gerekli!)
- Şikayet et (report) endpoint'i + admin görüntüleme — store politikaları
  UGC uygulamalarında zorunlu tutuyor (Apple 1.2: report + block şart).
- Kullanıcı engelleme (block): engellenen kişinin içeriği görünmez.
- Küfür filtresi v1: basit kelime listesi (TR), ileride gelişmiş.

## Açık Sorular
- [ ] Takım hesabı adına gönderi kim atabilir? (kaptan mı, tüm üyeler mi)
- [ ] Feed'e şehir bazlı "yakınımda" sekmesi eklensin mi?
