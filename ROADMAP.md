# Sahana — Halı Saha Sosyal Ağı Yol Haritası

> Halı saha oyuncuları için kadro kurma, maça oyuncu bulma, maç videoları izleme ve
> sosyal etkileşimi tek çatı altında toplayan mobil uygulama.
> Hedef pazar: Türkiye (v1) → Global (v2+).

---

## 1. Vizyon ve Konumlandırma

**Problem:** Halı saha oyuncularının işleri bugün dağınık araçlarla dönüyor:
WhatsApp grupları (organizasyon), Excel/not defteri (kadro), sosyalhalisaha.com
(video), telefonla arama (saha rezervasyonu). Tek bir "halı saha oyuncusunun evi"
yok.

**Çözüm:** Sahana — oyuncu profili, takım yönetimi, maç organizasyonu, oyuncu
bulma ve maç videolarını birleştiren sosyal ağ.

### Rakip Analizi (ilk bakış — detayı `docs/market-research.md`'de olacak)

| Uygulama | Ne yapıyor | Eksiği |
|---|---|---|
| Sosyal Halı Saha | Anlaşmalı sahalara kamera kurup maç videosu sunuyor | Sosyal ağ değil; organizasyon/kadro yok; Şikayetvar'da video erişim şikayetleri var |
| Halısahavar | Maç/oyuncu/rakip bulma, turnuva | UX eski, sosyal katman zayıf |
| Adam Eksik | Eksik oyuncu bulma | Tek özellik odaklı |
| Kadro Kur / Quick Lineup / Lineupper | Kadro dizme, taktik tahtası | Sadece görsel araç, canlı veri yok |

**Fırsat:** Hiçbiri "hepsi bir arada + gerçek sosyal ağ" değil. Sahana'nın farkı
modüllerin birbirini beslemesi: videodan gelen highlight → profil istatistiği →
oyuncu reytingi → daha iyi maç eşleşmesi.

---

## 2. Teknoloji Seçimi

### Backend: **Laravel 12 (API-only)**
Senin en güçlü olduğun alan; hız kazandırır. Slim yerine Laravel önerme sebebim:
auth (Sanctum), queue, notification, broadcast, storage soyutlamaları hazır —
bu projede hepsi lazım olacak.

- **Auth:** Laravel Sanctum (mobil token auth)
- **DB:** MySQL 8 (aşina olduğun) — PostgreSQL'e geçiş kapısı açık tutulur
- **Cache/Queue:** Redis + Laravel Horizon
- **Realtime (chat, canlı maç durumu):** Laravel Reverb (birinci parti WebSocket)
- **Push bildirim:** Firebase Cloud Messaging (FCM)
- **Dosya/medya:** S3-uyumlu depolama (Cloudflare R2 önerilir — egress ücretsiz,
  video için kritik)
- **API standardı:** REST + JSON, versiyonlu (`/api/v1/...`)

### Mobil: **React Native (Expo)** ✅ KARAR VERİLDİ
Web geliştirme geçmişin JS/TS ekosistemini tanıdık kılıyor; Expo ile native
kurulum derdi olmadan hızlı başlangıç yapılır.

- **Framework:** Expo (managed workflow) + TypeScript
- **Navigasyon:** Expo Router (dosya tabanlı)
- **State/veri:** TanStack Query (server state) + Zustand (client state)
- Detaylı gerekçe ve paket listesi: `docs/tech-stack.md`

### Diğer
- **Git + GitHub**, CI olarak GitHub Actions (test + lint)
- **Ortamlar:** local (brew MySQL, `sahana` DB; Sail opsiyonel) → staging → production
- **Hosting (başlangıç):** tek VPS (Hetzner/DigitalOcean) + R2; ölçek gelince ayrıştırılır

---

## 3. Modüler Geliştirme Planı

Her modül: önce `docs/features/XX-modul-adi.md` spec dosyası → onay → API →
mobil ekranlar → test → sonraki modül. Bir modül bitmeden diğerine geçilmez.

### FAZ 0 — Temel Altyapı (1-2 hafta)
- [ ] Repo yapısı (monorepo: `api/` + `mobile/` + `docs/`)
- [ ] Laravel API iskeleti, Docker/Sail, CI pipeline
- [ ] Expo (React Native) projesi, tema/tasarım sistemi temelleri
- [ ] Spec: `docs/architecture.md`, `docs/tech-stack.md`, `docs/api-conventions.md`

### MODÜL 1 — Kimlik & Oyuncu Profili (MVP)
- [ ] Kayıt/giriş (telefon veya e-posta + OTP, Google/Apple ile giriş)
- [ ] Oyuncu profili: mevki(ler), güçlü ayak, boy, şehir/semt, müsaitlik saatleri
- [ ] Profil fotoğrafı, kısa bio
- Spec: `docs/features/01-auth-profile.md`

### MODÜL 2 — Takım & Kadro Kurma (MVP)
- [ ] Takım oluşturma, logo/renk, üye davet (link/QR ile)
- [ ] Kadro dizilişi: sürükle-bırak taktik tahtası (5/6/7/8 kişilik)
- [ ] Kadroyu görsel olarak paylaşma (WhatsApp'a export — viral büyüme kanalı!)
- Spec: `docs/features/02-team-lineup.md`

### MODÜL 3 — Maç Organizasyonu & Oyuncu Bulma (MVP)
- [ ] Maç oluşturma: tarih/saat, saha, kişi başı ücret
- [ ] Katılım durumu (geliyorum/gelmiyorum/belki) — WhatsApp anketinin yerini alır
- [ ] "Adam eksik" ilanı: konum + mevki + seviye bazlı eşleşme
- [ ] Rakip takım bulma
- Spec: `docs/features/03-match-organization.md`

> **🎯 MVP = Modül 1+2+3.** Bu üçü yayınlanabilir ürün. App Store/Play Store'a
> burada çıkılır, gerçek kullanıcı geri bildirimi toplanır.

### MODÜL 4 — Sosyal Katman
- [ ] Akış (feed): maç sonuçları, kadro paylaşımları, videolar
- [ ] Takip, beğeni, yorum
- [ ] Oyuncu arama/keşfet
- Spec: `docs/features/04-social-feed.md`

### MODÜL 5 — Maç Videoları
- [ ] v1: Video linki paylaşma (sosyalhalisaha, YouTube vb. embed)
- [ ] sosyalhalisaha.com entegrasyon araştırması — **dikkat:** halka açık API'leri
  görünmüyor; scraping yasal/kırılgan risk taşır. Doğru yol muhtemelen **iş birliği
  görüşmesi** veya uzun vadede kendi kamera/highlight sistemimiz.
  Araştırma dosyası: `docs/research/sosyalhalisaha.md`
- [ ] v2: Kullanıcının kendi çektiği videoyu yükleme (R2 + HLS)
- Spec: `docs/features/05-videos.md`

### MODÜL 6 — İstatistik & Reyting
- [ ] Maç sonucu, gol/asist girişi (takım kaptanı girer, oyuncular onaylar)
- [ ] Maç sonrası oyuncu puanlama (takım arkadaşları arası)
- [ ] Profilde sezon istatistikleri, form grafiği
- Spec: `docs/features/06-stats-rating.md`

### MODÜL 7 — Bildirim & Mesajlaşma
- [ ] Push bildirimler (maç hatırlatma, davet, ilan eşleşmesi) — FCM
- [ ] Takım içi sohbet (Reverb WebSocket)
- Spec: `docs/features/07-notifications-chat.md`

### MODÜL 8 — Saha Rehberi & Rezervasyon (Faz 2)
- [x] Saha veritabanı (konum, fiyat, özellikler, foto)
- [x] Saha yorumları/puanları
- [ ] İleride: işletme paneli + online rezervasyon (gelir modeli!)
- Spec: `docs/features/08-venues.md`

### FAZ 3 — Büyüme (ufukta)
- Turnuva/lig modülü, sponsorlu içerik, premium üyelik,
  çoklu dil (i18n baştan altyapıda hazır tutulur), global açılım

---

## 4. Gelir Modeli Adayları (şimdilik not)
1. Saha işletmelerine SaaS panel + rezervasyon komisyonu
2. Premium oyuncu profili (detaylı istatistik, video highlight)
3. Sponsorluk/reklam (yerel spor markaları)

---

## 5. Oluşturulacak Doküman Yapısı

```
docs/
├── market-research.md        # Rakip analizi (detaylı)
├── tech-stack.md             # Teknoloji kararları + gerekçeleri
├── architecture.md           # Sistem mimarisi, ER diyagramı
├── api-conventions.md        # REST standartları, hata formatı, versiyonlama
├── research/
│   └── sosyalhalisaha.md     # Video entegrasyon araştırması
└── features/
    ├── 01-auth-profile.md
    ├── 02-team-lineup.md
    ├── 03-match-organization.md
    ├── 04-social-feed.md
    ├── 05-videos.md
    ├── 06-stats-rating.md
    ├── 07-notifications-chat.md
    └── 08-venues.md
```

## 6. Sıradaki Adımlar
1. ✅ Yol haritası (bu dosya)
2. ✅ Mobil teknoloji kararı: React Native (Expo)
3. ⬜ Doküman seti (`docs/`) — tech-stack, mimari, API standartları, feature spec'ler
4. ⬜ Faz 0: repo + API iskeleti + Expo projesi
