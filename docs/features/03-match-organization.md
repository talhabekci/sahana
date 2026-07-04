# Modül 3 — Maç Organizasyonu & Oyuncu Bulma

> Durum: **Uygulanıyor** (2026-07-04) · MVP kapsamında · Bağımlılık: Modül 1, 2

## Amaç
WhatsApp anketinin ve "adam var mı?" mesaj turlarının yerini almak:
maç kur → takım RSVP versin → eksik varsa ilanla oyuncu bul.

## Kapsam (v1)
- Maç oluşturma (kaptan): tarih/saat, saha (serbest metin + opsiyonel konum),
  format (5v5...8v8), kişi başı ücret
- RSVP: geliyorum / gelmiyorum / belki — tek dokunuş
- Katılım özeti: kaç kişi tamam, kaç eksik
- "Adam eksik" ilanı: mevki + seviye aralığı + konum → keşif listesi
- İlana başvuru → kaptan onayı → maça katılım
- Rakip takım ilanı ("maç arıyoruz")

### Kapsam dışı
- Saha rezervasyonu (Modül 8) · skor/istatistik girişi (Modül 6) ·
  otomatik hatırlatma pushları (Modül 7'de; v1'de basit push denenebilir)

## Kullanıcı Hikayeleri
1. Kaptan olarak perşembe 21:00 maçını oluşturup takıma duyurmak istiyorum;
   kimin geldiğini anket kovalamadan görmek istiyorum.
2. Oyuncu olarak tek dokunuşla "geliyorum" demek istiyorum.
3. Kaptan olarak 2 eksiğim için çevredeki uygun oyunculara ulaşmak istiyorum.
4. Takımsız oyuncu olarak bu akşam yakınımda oynanacak eksik maç bulmak istiyorum.
5. Kaptan olarak rakip takım bulmak istiyorum.

## Akışlar

### Maç yaşam döngüsü
```
draft → confirmed → played
              ↘ cancelled
```
- `confirmed`: kaptan onayı; katılımcılara bildirim.
- Maç saati geçince otomatik `played` (scheduled job) — Modül 6'nın kancası.

### Adam eksik eşleşmesi
1. Kaptan ilan açar: `positions_needed`, `level_min/max`, ücret, konum.
2. İlan keşif ekranında: konum yarıçapı + mevki + tarih filtresi.
3. Oyuncu başvurur (kısa not ekleyebilir) → kaptana bildirim.
4. Kaptan onaylar → oyuncu `match_participants`'a eklenir, ilan sayacı düşer,
   dolunca `filled`. Maç saati geçince `expired`.

## Ekranlar
```
(tabs)/matches         → maçlarım (yaklaşan/geçmiş) + keşif sekmesi (ilanlar)
match/create           → maç kurma sihirbazı
match/[id]             → detay: bilgiler, RSVP listesi, kadro linki, eksik ilanı
match/[id]/listing     → ilan oluştur/yönet + başvuranlar
listings/              → keşif: yakınımdaki adam-eksik + rakip ilanları (harita/liste)
```

## API

| Method | Endpoint | Açıklama |
|---|---|---|
| POST | /matches | Maç oluştur |
| GET | /matches?filter=upcoming\|past | Maçlarım |
| GET | /matches/{id} | Detay + katılım listesi |
| PATCH | /matches/{id} | Kaptan günceller |
| POST | /matches/{id}/confirm · /cancel | Durum geçişleri |
| PUT | /matches/{id}/rsvp | `{status: yes\|no\|maybe}` idempotent |
| POST | /matches/{id}/listings | Adam eksik ilanı |
| GET | /listings?near=41.0,28.9&radius=10&position=defans&date=2026-07-09 | Keşif |
| POST | /listings/{id}/applications | Başvur |
| POST | /applications/{id}/approve · /reject | Kaptan kararı |
| GET | /listings/{id} | İlan detayı (kaptan görünümünde başvurularla) |
| POST | /opponent-listings | Rakip arama ilanı |
| GET | /opponent-listings?near=&radius= | Rakip ilanları keşfi |
| POST | /opponent-listings/{id}/match | Rakip kaptan eşleşmeyi kabul eder `{team_id}` |

## Veri Modeli
`matches` (id, public_id, team_id, opponent_team_id?, venue_text, venue_lat/lng
decimal?, starts_at UTC, format 5-8, price_per_player, status) ·
`match_participants` (match_id, user_id, source: team|listing, rsvp, responded_at) ·
`player_listings` (id, public_id, match_id, positions_needed JSON, needed_count,
level_min, level_max, lat/lng decimal + bileşik indeks, status, expires_at) ·
`listing_applications` (listing_id, user_id, note, status, decided_by, decided_at) ·
`opponent_listings` (id, public_id, team_id, match_id?, note, lat/lng?, status)

> **Konum kararı (2026-07-04):** v1'de MySQL POINT + SPATIAL INDEX yerine
> `lat`/`lng` decimal kolonlar + bileşik indeks + bounding-box sorgusu
> (sonuçlar PHP'de haversine ile mesafeye göre sıralanır). Gerekçe: test paketi
> sqlite'ta koşuyor (spatial yok) ve 10-50 km yarıçaplar için bounding-box
> performans/doğruluk açısından fazlasıyla yeterli. Ölçek gelince POINT'e
> geçiş tek migration'lık iş.
>
> **needed_count:** "İlan sayacı düşer, dolunca filled" davranışı için açık
> kolon; `positions_needed` hangi mevkiler arandığının bilgisi.
>
> **Rakip ilanı akışı (v1):** Kaptan ilan açar → keşifte listelenir → rakip
> takımın kaptanı "maç yapalım" der (`POST /opponent-listings/{id}/match`,
> kendi takımını seçerek) → maçın `opponent_team_id`'si dolar, ilan `matched`.
> Sohbet Modül 7'ye kadar yok; iletişim maç detayı üzerinden yürür.

## Kabul Kriterleri
- [ ] Maç kur → RSVP → eksik ilanı → başvuru → onay zinciri uçtan uca çalışıyor
- [ ] RSVP idempotent; aynı istek iki kez → durum bozulmaz
- [ ] Keşif sorgusu: 10 km yarıçap + filtrelerle < 200ms (lat/lng bileşik indeks +
      bounding-box; mesafe sıralaması PHP'de haversine)
- [ ] Dolu ilana başvuru → 422 `listing_already_filled`
- [ ] Onaylanan oyuncu maç detayını görebilir; reddedilen göremez (policy testi)
- [ ] Maç saati geçen ilanlar job ile `expired`

## Açık Sorular
- [ ] Ücret paylaşımı sadece bilgi mi, ileride ödeme entegrasyonu (iyzico) olur mu?
- [ ] "Belki" diyenlere maç günü otomatik hatırlatma (Modül 7'ye not)
- [ ] Rakip ilanında seviye eşleşmesi takım ortalama reytingiyle mi? (Modül 6 sonrası)
