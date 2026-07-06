# Modül 4 — Sosyal Katman (Feed)

> Durum: **Uygulanıyor** (2026-07-04) · MVP sonrası · Bağımlılık: Modül 1-3

## Amaç
Uygulamayı "araçtan" "her gün açılan yere" dönüştürmek: maç aktiviteleri,
kadro paylaşımları ve gönderilerden oluşan akış + takip mekanizması.

## Kapsam (v1)
- Feed: takip ettiklerim + takımlarımın aktiviteleri (kronolojik; algoritma yok)
- İçerik türleri: **metin gönderisi** (fotoğrafsız — bkz. not), **maç oynandı**
  auto-kartı, **kadro paylaşıldı** auto-kartı
- Takip et / takipçi modeli (onaysız, herkese açık profil varsayımı — Modül 1'in
  `GET /players/{id}` zaten herkese açık)
- Beğeni + yorum
- Keşfet: oyuncu/takım arama (isimden basit LIKE araması, v1'de Scout/ES yok)
- Moderasyon: şikayet (report) + engelleme (block) — **zorunlu**, ertelenemez

### Kapsam dışı (v1)
- Algoritmik sıralama · hikayeler · DM (Modül 7'de takım sohbeti önce)
- **Fotoğraflı gönderi:** R2 presigned upload akışı henüz kurulmadı (Modül 1
  avatar, Modül 2 logo kararlarıyla aynı çizgide) — v1'de gönderiler metin only.
- **Video gönderisi:** Modül 5 henüz yok; özel bir `video` post tipi
  tanımlanmadı. Kullanıcı isterse metin gönderisine link yapıştırabilir
  (özel önizleme/embed yok, Modül 5'i bekliyor).
- **Maç sonucu kartı (skorlu):** Modül 6 (istatistik) henüz yok, skor verisi
  mevcut değil. Onun yerine sade **"maç oynandı"** kartı (takımlar, saha,
  tarih) — skor eklenmesi Modül 6'nın kancası.
- Şehir bazlı "yakınımda" sekmesi — v1'de yok, MVP-sonrası backlog'a not
  düşüldü (kullanıcı kararı 2026-07-04: öncelik değil).

## Otomatik içerik (soğuk başlangıç çözümü)
Feed'i kullanıcı üretimi beklemeden dolduran sistem olayları:
- Maç `matches:sweep` ile `played` olunca → takım takipçilerinin feed'ine
  "maç oynandı" kartı otomatik düşer (skor yok, Modül 6'da eklenecek).
- Kadro tahtası oluşturulunca → aynı takımın üyelerine otomatik "kadro
  paylaşıldı" kartı düşer (WhatsApp'a export ayrı, bu sadece feed içi).
- **Kural:** otomatik kartlar profil ayarından kapatılabilir olmalı
  (`auto_posts_enabled` — Modül 1 `PlayerProfile`'a eklenir).

## Takım adına paylaşım (kullanıcı kararı 2026-07-04)
**Herhangi bir takım üyesi**, gönderiyi o takıma etiketleyerek paylaşabilir
(sadece kaptan değil) — `posts.team_id` doldurulur, `posts.user_id` gönderiyi
atan kişidir. Takım etiketleme opsiyoneldir.

## Ekranlar
```
(tabs)/feed          → akış (yeni ilk sekme — "her gün açılan yer")
post/create          → metin gönderisi oluştur (+ opsiyonel takım etiketi)
post/[id]             → gönderi detay + yorumlar
player/[id]           → oyuncu herkese açık profili (Modül 1'de tanımlı,
                        şimdi inşa ediliyor) — takip et/bırak, engelle, şikayet
search/               → oyuncu/takım arama
```

## API

| Method | Endpoint | Açıklama |
|---|---|---|
| GET | /feed | Takip + takım akışı (cursor) |
| POST | /posts | Metin gönderisi oluştur (`body`, `team_id?`) |
| GET | /posts/{id} | Gönderi detay |
| DELETE | /posts/{id} | Sahibi veya (takım gönderisiyse) kaptan silebilir |
| POST | /posts/{id}/like · DELETE /posts/{id}/like | Beğen/geri al (idempotent) |
| GET | /posts/{id}/comments | Yorumlar (cursor) |
| POST | /posts/{id}/comments | Yorum ekle |
| DELETE | /comments/{id} | Sahibi silebilir |
| POST | /players/{id}/follow · DELETE /players/{id}/follow | Takip et/bırak |
| POST | /players/{id}/block · DELETE /players/{id}/block | Engelle/kaldır |
| POST | /reports | Şikayet (`subject_type: post\|comment\|user`, `subject_id`, `reason`) |
| GET | /search?q=&type=player\|team | Basit isim araması |

## Veri Modeli
`posts` (id, public_id, user_id, team_id?, type: text|match_played|lineup_shared,
body?, subject_type/subject_id polimorfik [match/lineup için], created_at) ·
`likes` (post_id, user_id) · `comments` (id, public_id, post_id, user_id, body,
created_at) · `follows` (follower_id, followed_id) · `blocks` (user_id,
blocked_user_id) · `reports` (id, reporter_id, subject_type, subject_id,
reason, status: pending|reviewed). Feed v1: sorgu + Redis cache
(architecture.md kararı); Redis henüz kurulmadıysa DB sorgusu yeterli (ölçek
gelince eklenir).

## Moderasyon (baştan gerekli!)
- Şikayet et (report) endpoint'i + admin görüntüleme — store politikaları
  UGC uygulamalarında zorunlu tutuyor (Apple 1.2: report + block şart).
  v1'de admin görüntüleme sadece DB seviyesinde (panel yok); önemli olan
  kullanıcının şikayet edebilmesi.
- Kullanıcı engelleme (block): engellenen kişinin gönderileri feed'den ve
  profilinden gizlenir; karşılıklı görünürlük engellenir.
- Küfür filtresi v1: basit TR kelime listesi, gönderi/yorum oluşturmada
  validasyon hatası (422) döner — ileride gelişmiş (ML tabanlı) filtreye
  geçiş kolay olacak şekilde tek bir `ProfanityFilter` sınıfında izole.

## Kabul Kriterleri
- [ ] Takip + kendi takımlarının gönderileri feed'de kronolojik görünüyor
- [ ] Maç `played` olunca ilgili takımın üyelerine otomatik kart düşüyor
- [ ] Engellenen kullanıcının gönderileri feed'de görünmüyor
- [ ] Küfürlü içerik 422 ile reddediliyor
- [ ] Şikayet ve engelleme uçtan uca çalışıyor (policy + test)
- [ ] Bir kullanıcı kendi gönderisini/yorumunu silebiliyor; başkasınınkini silemiyor

## Açık Sorular
- [x] ~~Takım hesabı adına gönderi kim atabilir?~~ → Tüm üyeler (kullanıcı
      kararı 2026-07-04)
- [x] ~~Şehir bazlı "yakınımda" sekmesi~~ → v1'de yok, ertelendi
