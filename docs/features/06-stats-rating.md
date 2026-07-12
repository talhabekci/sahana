# Modül 6 — İstatistik & Reyting

> Durum: **Tamamlandı** (2026-07-07, API + mobil) · MVP sonrası · Bağımlılık: Modül 3

## Amaç
Halı saha oyuncusuna FIFA kartı hissi: maç geçmişi, gol/asist, form grafiği,
takım arkadaşlarından gelen reyting. **Bu modül veri döngüsünü kapatır:**
oynanan maç → istatistik → güvenilir seviye → daha iyi eşleşme (Modül 3'ün
`level` beyanının yerini kazanılmış reyting alır).

## Kapsam (ilk sürüm)
- Maç sonucu girişi: skor (ev sahibi kaptan girer, rakip kaptan onaylar/itiraz eder)
- Bireysel: gol/asist girişi (kaptan veya oyuncunun kendisi; kaptan onayı)
- Maç sonrası oyuncu puanlama: takım arkadaşları birbirine 1-10
  (anonim, maçtan sonra 48 saat açık)
- Profilde: sezon özeti (maç/gol/asist), form grafiği (son 5 maç reytingi),
  güvenilirlik göstergesi (RSVP verdiği maça gelme oranı!)

### Tasarım ilkeleri
- **Manipülasyon direnci:** puanlama anonim; min 3 puan gelmeden reyting
  gösterilmez; kendi kendine puan yok.
- **Pozitif çerçeve:** düşük puan utandırma aracı olmasın — profilde tek sayı
  yerine seviye bandı (ör. "Orta Saha · Seviye 3.8") gösterilir.
- **Güvenilirlik skoru** (maça gelme oranı) belki reytingden daha değerli —
  "maça gelmeyen adam" problemi halı sahanın 1 numaralı derdi.

## Kararlar (kullanıcı, 2026-07-06)

1. **Rakip kaptan onay vermezse:** 48 saat içinde onaylamaz/itiraz etmezse
   skor **otomatik onaylanır** (`results:auto-confirm` — `matches:sweep`'e
   benzer saatlik scheduled command, `confirmed_by = null` ile).
2. **Rakip takım kayıtlı değilse** (`opponent_team_id` boş — karma/informal
   maç): Modül 6'nın tamamı (skor, oyuncu istatistiği, reyting) **o maç için
   kapalı** — `POST /matches/{id}/result` 422 döner. Kayıtlı rakip şartı.
3. **Reyting hesabı:** zaman ağırlıklı — üstel azalma (`weight = 0.5^(gün/45)`,
   45 günlük yarı ömür), her okuma anında hesaplanır (cache'lenmiş kolon YOK,
   v1'de veri hacmi küçük — ileride gerekirse job ile önbelleklemeye geçilir).
4. **Sezon tanımı:** takvim yılı (Ocak-Aralık). `season` parametresi yıl
   (`2026`); belirtilmezse içinde bulunulan yıl.

### Ek karar: "Geldi mi?" (attended) takibi
Güvenilirlik skoru için RSVP'nin kendisi yetmez (RSVP=yes deyip gelmemek asıl
problem). `match_participants`'a nullable `attended` boolean eklendi: kaptan
skor girerken RSVP=yes katılımcılar için "gelmedi" işaretleyebilir (aksi halde
`attended=true` varsayılır). Güvenilirlik = `attended=true` / (`attended=true`
+ `attended=false`) — RSVP=no/maybe veya hiç işaretlenmemiş katılımcılar
paydaya girmez.

## Rozetler (başarımlar) — BACKLOG #54, 2026-07-11
Rekabet/retention mekaniği: kullanıcı "içeride rekabeti arttırmamız lazım, bi
heves olmalı" dedi. Mevcut istatistik/reyting verisi üzerine hesaplanan,
tek seferlik kazanılan (geri alınmayan) rozetler.

**v1 kataloğu** (`App\Support\BadgeCatalog`):

| Anahtar | Etiket | Koşul |
|---|---|---|
| `ilk_gol` | İlk Gol | En az 1 onaylı gol |
| `hat_trick` | Hat-Trick | Bir maçta 3+ onaylı gol |
| `seri_5` | 5 Maçlık Seri | Üst üste 5 maça `attended=true` (aradaki en yeni 5 katılımın hepsi) |
| `guvenilir` | Güvenilir Oyuncu | En az 5 maçlık katılım kaydında %90+ `attended` oranı |
| `yildiz` | Yıldız | En az 5 puanla 8.5+ zaman ağırlıklı ortalama reyting |

**Ne zaman kontrol edilir:** `AwardBadges` action'ı — skor girişi (`EnterMatchResult`,
katılımcıların `attended` durumu belirlenince), istatistik onayı
(`ApprovePlayerStat`), reyting girişi (`SubmitRating`) sonrasında ilgili
oyuncu(lar) için tetiklenir. İdempotent: `player_badges(user_id, badge_key)`
unique — bir rozet bir kez kazanılır.

**Akışa düşme:** yeni kazanılan her rozet için, `match_played`/`lineup_shared`
ile birebir aynı desende, `auto_posts_enabled=false` değilse otomatik bir
`badge_earned` tipi gönderi oluşturulur.

## Haftalık performans özeti — BACKLOG #55, 2026-07-11
Spotify Wrapped mantığı: haftada bir (Pazar 20:00, `recap:weekly` scheduled
command — `notifications:social-summary` ile aynı "checkpoint" deseni,
`player_profiles.last_weekly_recap_at` ile tekrar önlenir), o hafta (son 7 gün)
en az 1 maça katılan her oyuncu için otomatik bir özet hesaplanır: maç sayısı,
onaylı gol/asist toplamı, o haftaki maçların ortalama reytingi (puan yoksa
`null`). `auto_posts_enabled=false` ise gönderi oluşturulmaz (checkpoint yine
güncellenir — spam'e engel). Sonuç, `weekly_recap` tipi bir gönderi olarak
akışa düşer; `recap_data` JSON kolonunda saklanır (ayrı ilişkisel tablo
gerekmez, tek seferlik anlık görüntü).

## API

- `POST /matches/{id}/result` `{home_score, away_score, no_show_user_ids?}` —
  sadece ev sahibi kaptan; rakip takım yoksa 422.
- `POST /matches/{id}/result/confirm` — sadece rakip kaptan.
- `POST /matches/{id}/result/dispute` — sadece rakip kaptan (`status=disputed`,
  ileri çözüm v1'de manuel/destek üzerinden, otomatik akış yok).
- `POST /matches/{id}/player-stats` `{user_id, goals, assists}` — kaptan
  (herhangi bir katılımcı için, direkt onaylı) veya oyuncunun kendisi (sadece
  kendisi için, onay bekler). Upsert (maç+oyuncu başına tek kayıt).
- `GET /matches/{id}/player-stats` — maçın tüm istatistik kayıtları (mobil kadro
  listesinde göstermek için); sadece maç katılımcıları görebilir.
- `POST /player-stats/{id}/approve` — sadece kaptan, bekleyen kaydı onaylar.
- `POST /matches/{id}/ratings` `{ratee_id, score}` — rater/ratee ikisi de o
  maçın katılımcısı olmalı, kendine puan yok, sadece `starts_at` ile
  `starts_at + 48s` arası (maç `cancelled` değilse; `played` durumunu
  beklemez — Modül 5'teki "sweep'i bekleme" dersine sadık).
- `GET /players/{id}/stats?season=2026` — sezon özeti (maç/gol/asist),
  zaman ağırlıklı ortalama reyting (`ratings_count < 3` ise `null` +
  `ratings_count` alanı döner, UI "yeterli veri yok" gösterir), güvenilirlik
  yüzdesi, son 5 maçın reyting listesi (form grafiği).
- `GET /players/{id}/stats/matches?season=2026` — sezonun maç bazında dökümü
  (BACKLOG #44, 2026-07-11): oyuncunun o sezon katıldığı maçlar, yeniden
  eskiye — her satırda maç id/tarih/saha, takım + rakip adı, skor (varsa),
  oyuncunun onaylı gol/asist'i ve o maçtaki ortalama puanı. Mobilde profil
  ve oyuncu ekranındaki sezon kartına dokununca açılan `stats/[id]` detay
  ekranı bu endpoint'i kullanır.
- `GET /players/{id}/badges` — kazanılan rozetlerin listesi (yeniden eskiye) —
  `{key, label, description, icon, earned_at}` (BACKLOG #54, 2026-07-11).

## Veri Modeli

- `match_results`: `match_id` (unique FK), `home_score`, `away_score`,
  `entered_by`, `confirmed_by` (nullable), `status: pending|confirmed|disputed`.
- `player_badges`: `user_id`, `badge_key`, `earned_at`. `UNIQUE(user_id, badge_key)`
  (BACKLOG #54). Katalog PHP'de sabit (`BadgeCatalog`) — ayrı katalog tablosu yok.
- `posts.badge_key` / `posts.recap_data` (JSON): `badge_earned`/`weekly_recap`
  tipi otomatik gönderilerin verisi (BACKLOG #54/#55). `player_profiles.
  last_weekly_recap_at`: haftalık özet tekrarını önleyen checkpoint.
- `player_match_stats`: `match_id`, `user_id`, `goals`, `assists`, `approved`,
  `entered_by`. `UNIQUE(match_id, user_id)`.
- `player_ratings`: `match_id`, `rater_id`, `ratee_id`, `score` (1-10).
  `UNIQUE(match_id, rater_id, ratee_id)`.
- `match_participants.attended`: nullable boolean (yeni kolon).
- Reyting/güvenilirlik **hesaplanmış alan olarak saklanmaz** — okuma anında
  `player_ratings`/`match_participants` üzerinden hesaplanır (karar #3).

## Mobil Ekranlar
- **match/[id]/index.tsx:** "SKOR" bölümü (kaptan için "Skoru gir" modalı —
  skor + RSVP=yes katılımcılardan gelmeyenleri işaretleme; rakip kaptan için
  onayla/itiraz et), "İSTATİSTİKLER" bölümü (kaptan herkes için, oyuncu sadece
  kendisi için dokununca açılan gol/asist stepper modalı; onay bekleyen
  kayıtlarda kaptana onay ikonu), puanlama penceresi açıkken "Takım
  arkadaşlarını puanla" bağlantısı.
- **match/[id]/rate.tsx:** yeni ekran — kendisi hariç katılımcılar, her biri
  için 1-10 arası tek dokunuşla puanlama (upsert, tekrar dokununca günceller).
- **(tabs)/profile.tsx** ve **player/[id].tsx:** paylaşılan `StatsCard`
  bileşeni (sezon maç/gol/asist, reyting — yetersiz veri varsa "X/3 puan",
  güvenilirlik yüzdesi, son maçların form noktaları) + `BadgeRow` bileşeni
  (kazanılan rozetler, ikon + etiket; BACKLOG #54).
- **PostCard:** `badge_earned` ve `weekly_recap` tipleri için otomatik kart
  render'ı — diğer auto-post tipleriyle (`match_played` vb.) aynı görsel dil
  (BACKLOG #54/#55).

## Açık Sorular
- [ ] v2: Reyting hacmi büyüyünce (çok maç/oyuncu) okuma-anı hesaplama yerine
  job ile önbellekleme gerekebilir — performans izlenecek.
- [ ] Disputed durumun manuel çözüm akışı (destek ekibi arayüzü?) — v1'de yok,
  sadece durum işaretleniyor.
