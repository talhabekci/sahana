# Modül 8 — Saha Rehberi & Rezervasyon

> Durum: **Uygulanıyor** (2026-07-08, sadece Aşama 1) · Faz 2 ·
> Bağımlılık: Modül 3 (maçlar sahaya bağlanır)
> **Gelir modelinin çekirdeği** — işletme tarafı burada başlar.

## Kararlar (kullanıcı, 2026-07-08)

1. **Kapsam:** Bu oturumda sadece **Aşama 1** (Rehber) kodlanır. Aşama 2
   (işletme hesabı, panel, rezervasyon) ayrı, sonraki bir iş — bu dosyada
   sadece taslak olarak kalır, kodlanmadan önce ayrıca ele alınacak.
2. **Seed verisi:** v1'de boş/test verisiyle başlanır. Gerçek toplu veri
   doldurma (Google Places API vs. elle giriş, maliyet/lisans) ayrı bir
   karar — **BACKLOG.md**'ye taşındı, bu turda kodlanmadı. Kullanıcının
   kendi saha ekleyebilmesi ("öneri + moderasyon kuyruğu") de bu yüzden v1
   kapsamı dışında — Taslak API'de zaten `POST /venues` hiç yoktu, sadece
   `GET /venues`, `GET /venues/{id}`, `POST /venues/{id}/reviews`. Test
   verisi `php artisan tinker`/seeder ile elle girilir.
3. **`venue_text` → `venue_id` geçişi:** İkisi bir arada, `venue_id`
   **opsiyonel** (nullable). `matches.venue_text` kalır (serbest metin hâlâ
   girilebilir); yeni nullable `venue_id` eklenir — kullanıcı rehberden
   saha seçerse dolar. Geriye dönük kırılma riski yok, eski kayıtlar
   migrate edilmez (zaten hepsi `venue_id: null` kalır, çalışmaya devam
   eder).

## Aşama 1 — Rehber
- Saha profili: ad, konum, foto, fiyat aralığı, özellikler
  (kapalı/açık, kaç kişilik, duş, otopark, kafeterya)
- Oyuncu yorumu + puanı (sadece o sahada maç kaydı olan kullanıcı yorumlayabilir
  → sahte yorum direnci)
- Maç oluştururken saha seçimi buradan da yapılabilir (rehberden seçilirse
  `venue_id` + `venue_text`/`venue_lat`/`venue_lng` otomatik doldurulur;
  seçilmezse eskisi gibi serbest metin)
- İlk veri: bu turda yok (yukarıdaki karar #2) — ileride seed çalışması
  (belediye listeleri, harita taraması, kullanıcı ekleme önerisi + moderasyon
  kuyruğu)

## Aşama 2 — İşletme Tarafı
- İşletme hesabı: sahasını sahiplenir (doğrulama: telefon + belge)
- Web panel (Laravel + Filament — mobil uygulamaya gerek yok):
  saat takvimi, fiyat, rezervasyon yönetimi
- Oyuncu tarafı: boş saat görüntüleme → rezervasyon talebi → işletme onayı
- Ödeme: v1'de sahada nakit/havale (sadece takvim yönetimi);
  online ödeme (iyzico) ancak talep kanıtlanırsa
- Gelir modeli adayları: aylık SaaS (takvim yönetimi) vs rezervasyon başı
  komisyon — pilot işletmelerle test

## API (Aşama 1)
- `GET /venues?near=41.0,28.9&radius=10&search=` — rehber listesi. Konum:
  Modül 3'teki gibi **`lat`/`lng` decimal + bounding-box + PHP haversine**
  (`App\Support\Geo`, aynen tekrar kullanılır) — POINT/SPATIAL DEĞİL, çünkü
  test paketi sqlite'ta koşuyor ve 10-50 km yarıçaplar için bounding-box
  fazlasıyla yeterli (Modül 3 kararıyla tutarlılık).
- `GET /venues/{id}` — detay (ortalama puan + yorum sayısı + son yorumlar).
- `POST /venues/{id}/reviews` `{match_id, score: 1-5, body?}` — yalnızca o
  `match_id`'nin katılımcısı VE maçın `venue_id`'si bu saha VE maç
  `status: played` ise izin verilir (kanıt zinciri — sahte yorum direnci).
- `POST /matches` / `PATCH /matches/{id}` — artık opsiyonel `venue_id`
  (rehberden saha public_id'si) kabul eder, `venue_text`'in yanında.

Aşama 2 (rezervasyon) API'si henüz taslak, kodlanmadı:
`GET /venues/{id}/availability?date=` · `POST /venues/{id}/bookings`.

## Veri Modeli (Aşama 1 — uygulandı)
- `venues`: `id`, `public_id` (ULID), `name`, `lat`/`lng` (decimal, Modül
  3'teki `matches.venue_lat/lng` ile aynı format), `address?`,
  `photos` (JSON, url listesi), `price_min?`/`price_max?` (TL),
  `amenities` (JSON — `indoor`, `capacity`, `shower`, `parking`, `cafeteria`
  gibi anahtarlar), `status: seeded|verified` (default `seeded`).
- `venue_reviews`: `venue_id`, `user_id`, `match_id` (kanıt bağı, zorunlu),
  `score` (1-5), `body?`.
- `matches.venue_id` (nullable, `venues.id`'ye FK) — `venue_text`'in yanında.

Aşama 2 (taslak, kodlanmadı): `businesses`, `venue_slots`, `bookings`.

## Açık Sorular (Aşama 2 ve ötesi)
- [ ] Seed verisi kaynağı ve lisansı (Google Places API maliyeti vs elle giriş)
      — bkz. BACKLOG.md.
- [ ] sosyalhalisaha anlaşmalı sahaları rehberde işaretlensin mi? ("videolu saha"
      rozeti — iş birliği görüşmesine köprü)
- [ ] Pilot şehir hangisi? (soğuk başlangıç stratejisiyle aynı şehir olmalı)
- [ ] Aşama 2 (işletme paneli + rezervasyon) ne zaman ele alınacak — ayrı
      bir karar/spec güncellemesi gerekiyor.
