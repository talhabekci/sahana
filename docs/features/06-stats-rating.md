# Modül 6 — İstatistik & Reyting

> Durum: **Ön taslak** · MVP sonrası · Bağımlılık: Modül 3

## Amaç
Halı saha oyuncusuna FIFA kartı hissi: maç geçmişi, gol/asist, form grafiği,
takım arkadaşlarından gelen reyting. **Bu modül veri döngüsünü kapatır:**
oynanan maç → istatistik → güvenilir seviye → daha iyi eşleşme (Modül 3'ün
`level` beyanının yerini kazanılmış reyting alır).

## Kapsam (ilk sürüm)
- Maç sonucu girişi: skor (kaptan girer, rakip kaptan onaylar/itiraz eder)
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

## Taslak API
`POST /matches/{id}/result` · `POST /matches/{id}/result/confirm` (rakip kaptan) ·
`POST /matches/{id}/player-stats` · `POST /matches/{id}/ratings`
`{ratee_id, score}` · `GET /players/{id}/stats?season=2026`

## Veri Modeli (taslak)
`match_results` (match_id, home_score, away_score, entered_by, confirmed_by?,
status: pending|confirmed|disputed) · `player_match_stats` (match_id, user_id,
goals, assists, approved) · `player_ratings` (match_id, rater_id, ratee_id,
score, UNIQUE(match_id, rater_id, ratee_id)) · hesaplanmış: `player_profiles.rating`
(job ile güncellenir), `reliability_score`

## Açık Sorular
- [ ] Rakip kaptan onay vermezse skor ne olur? (48 saat sonra otomatik onay?)
- [ ] Reyting hesabı: basit ortalama mı, zaman ağırlıklı mı (son maçlar daha etkili)?
- [ ] Sezon tanımı: takvim yılı mı, Eylül-Haziran mı?
