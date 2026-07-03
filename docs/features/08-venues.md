# Modül 8 — Saha Rehberi & Rezervasyon

> Durum: **Ön taslak** · Faz 2 · Bağımlılık: Modül 3 (maçlar sahaya bağlanır)
> **Gelir modelinin çekirdeği** — işletme tarafı burada başlar.

## Amaç
Aşama 1: Türkiye halı saha veritabanı (rehber + yorum).
Aşama 2: işletme paneli + online rezervasyon (komisyon/SaaS geliri).

## Aşama 1 — Rehber
- Saha profili: ad, konum, foto, fiyat aralığı, özellikler
  (kapalı/açık, kaç kişilik, duş, otopark, kafeterya)
- Oyuncu yorumu + puanı (sadece o sahada maç kaydı olan kullanıcı yorumlayabilir
  → sahte yorum direnci)
- Maç oluştururken saha seçimi buradan yapılır (Modül 3'teki serbest metin
  `venue_text` alanının yerini `venue_id` alır; eski kayıtlar migrate edilir)
- İlk veri: seed çalışması (belediye listeleri, harita taraması, kullanıcı ekleme
  önerisi + moderasyon kuyruğu)

## Aşama 2 — İşletme Tarafı
- İşletme hesabı: sahasını sahiplenir (doğrulama: telefon + belge)
- Web panel (Laravel + Filament — mobil uygulamaya gerek yok):
  saat takvimi, fiyat, rezervasyon yönetimi
- Oyuncu tarafı: boş saat görüntüleme → rezervasyon talebi → işletme onayı
- Ödeme: v1'de sahada nakit/havale (sadece takvim yönetimi);
  online ödeme (iyzico) ancak talep kanıtlanırsa
- Gelir modeli adayları: aylık SaaS (takvim yönetimi) vs rezervasyon başı
  komisyon — pilot işletmelerle test

## Taslak API
`GET /venues?near=&radius=` · `GET /venues/{id}` · `POST /venues/{id}/reviews` ·
`GET /venues/{id}/availability?date=` (Aşama 2) · `POST /venues/{id}/bookings` (Aşama 2)

## Veri Modeli (taslak)
`venues` (id, name, location POINT, address, photos JSON, price_min/max,
amenities JSON, claimed_by_business_id?, status: seeded|verified) ·
`venue_reviews` (venue_id, user_id, score, body, match_id — kanıt bağı) ·
Aşama 2: `businesses`, `venue_slots`, `bookings`

## Açık Sorular
- [ ] Seed verisi kaynağı ve lisansı (Google Places API maliyeti vs elle giriş)
- [ ] sosyalhalisaha anlaşmalı sahaları rehberde işaretlensin mi? ("videolu saha"
      rozeti — iş birliği görüşmesine köprü)
- [ ] Pilot şehir hangisi? (soğuk başlangıç stratejisiyle aynı şehir olmalı)
