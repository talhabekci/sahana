# Modül 2 — Takım & Kadro Kurma

> Durum: **Taslak** · MVP kapsamında · Bağımlılık: Modül 1

## Amaç
Halı saha ekiplerinin dijital yuvası: takım oluştur, arkadaşlarını davet et,
maç kadrosunu sürükle-bırak dizip WhatsApp'a paylaş. **Kadro görseli paylaşımı
bu ürünün viral büyüme motorudur** — davetsiz kullanıcı, görseldeki linkten gelir.

## Kapsam (v1)
- Takım oluşturma: isim, logo (hazır ikon seti + kullanıcı arma fotoğrafı
  yükleme — kullanıcı kararı 2026-07-10, BACKLOG.md #30, ilk uygulamada
  sadece hazır ikon vardı), forma rengi (8 önerilen renk + 24 renklik
  geniş palet, herhangi bir hex zaten API'de destekleniyordu — eksik olan
  mobil UI'daki seçenek genişliğiydi)
- Davet: paylaşılabilir link + QR (linke tıklayan → uygulama/store → takıma katılır)
- Roller: kaptan (kurucu; devredilebilir) / üye
- Kadro tahtası: 5/6/7/8 kişilik saha dizilimi, sürükle-bırak
- Kadroyu PNG olarak export → sistem paylaşım menüsü (WhatsApp hedefli)
- Bir kullanıcı birden çok takımda olabilir

### Kapsam dışı
- Takım istatistikleri (Modül 6) · takım sohbeti (Modül 7) · turnuva (Faz 3)

## Kullanıcı Hikayeleri
1. Kaptan olarak takımımı kurup WhatsApp grubuma davet linki atmak istiyorum ki
   herkes tek tıkla katılsın.
2. Kaptan olarak perşembe maçının kadrosunu dizip gruba görsel atmak istiyorum ki
   kim nerede oynuyor tartışması sahada değil telefonda bitsin.
3. Oyuncu olarak dizilişte kendimi görmek istiyorum.

## Kadro Tahtası (ürünün kalbi — özen!)
- Saha görseli üzerine oyuncu pulu (avatar + isim + forma no) sürükle-bırak
- Boş pozisyona takım üyesi listesinden atama; üye olmayan için "misafir" pulu
- Hazır diziliş şablonları: 1-2-1 (5'li), 2-3-1 (7'li) vb. **+ "Özel" seçeneği**
  (kullanıcı 1-14 arası istediği puk sayısını seçer, sahaya serbest dizer —
  preset'e bağlı kalmadan; kullanıcı talebi 2026-07-04, bkz. BACKLOG.md #1)
- Pozisyonlar `{user_id|guest_name, x, y}` normalize koordinat (0-1) olarak saklanır
- Export: `react-native-view-shot` ile marka filigranlı PNG
  (alt köşede "sahana.app ile kuruldu" + davet linki QR'ı — büyüme kancası)

## Ekranlar
```
(tabs)/teams            → takımlarım listesi + "Takım kur"
team/create             → isim, logo, renk (3 adım)
team/[id]               → takım detay: üyeler, kadrolar, (ileride: maçlar)
team/[id]/invite        → link + QR paylaşım
team/[id]/lineup/[lid]  → kadro tahtası (oluştur/düzenle/export)
join/[inviteCode]       → davet karşılama (deep link)
```

## API

| Method | Endpoint | Açıklama |
|---|---|---|
| POST | /teams | Takım oluştur (oluşturan = kaptan; multipart: `name`, `badge_icon?`, `logo?`, `color_home`) |
| GET | /teams/{id} | Detay (üyelerle) |
| PATCH | /teams/{id} | Kaptan: isim/logo/renk (multipart, `_method=PATCH`) |
| POST | /teams/{id}/invites | Davet linki üret `{code, expires_at}` |
| POST | /invites/{code}/accept | Katıl (auth zorunlu; yoksa önce kayıt akışı) |
| DELETE | /teams/{id}/members/{userId} | Kaptan çıkarır / üye kendisi ayrılır |
| POST | /teams/{id}/transfer-captaincy | `{user_id}` |
| POST | /teams/{id}/lineups | Kadro oluştur |
| PATCH | /lineups/{id} | Pozisyon güncelle (otomatik kayıt) |
| GET | /lineups/{id} | Görüntüle |
| DELETE | /lineups/{id} | Herhangi bir takım üyesi silebilir (kullanıcı kararı 2026-07-10, BACKLOG.md #25) |
| DELETE | /teams/{id} | Sadece kaptan; cascade ile üyeler/kadrolar/maçlar da silinir (kullanıcı kararı 2026-07-10, BACKLOG.md #31) |

## Veri Modeli
`teams` (id, public_id, name, logo_path, color_home, created_by) ·
`team_members` (team_id, user_id, role, jersey_number, joined_at) ·
`team_invites` (team_id, code uniq, created_by, expires_at, max_uses) ·
`lineups` (id, team_id, match_id nullable, name, formation, positions JSON)

## Kabul Kriterleri
- [ ] Takım kurma + 1 davet + 1 katılım akışı uçtan uca çalışıyor (deep link dahil)
- [ ] Kadro tahtası 60 fps sürükleme (Reanimated; eski Android'de test)
- [ ] Export edilen PNG WhatsApp'ta net görünüyor (min 1080px genişlik)
- [ ] Davet linki: uygulama yüklü değilse store'a, yüklüyse doğrudan katılım ekranına
- [ ] Kaptan takımdan ayrılamaz — önce devretmeli (422 + net mesaj)

## Açık Sorular
- [x] ~~Davet linki altyapısı~~ → v1'de `Linking.createURL('join/{code}')` (Expo
      deep link) + QR; "yüklü değilse store'a" yönlendirmesi gerçek universal
      link/Branch.io gerektirir — bunun için domain/hosting olmadığından ertelendi.
      Şimdilik: uygulama zaten kuruluysa link/QR sorunsuz çalışır.
- [ ] Misafir oyuncu pulu, ileride gerçek kullanıcıya dönüştürülebilmeli mi?
- [ ] Kadro tahtası etkileşimi: mevcut implementasyon "sürükle (yeniden konumla) +
      dokun (oyuncu ata)" modeli. Spec'in "bench'ten sürükle-bırak" tarifinden
      farklı ama aynı kabul kriterlerini karşılıyor — kullanıcı testinde
      doğrulanacak.
