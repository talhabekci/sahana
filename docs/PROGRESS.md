# İlerleme Kaydı

> Her çalışma seansı buraya tarihli kayıt düşer. Yeni oturum işe başlamadan
> önce bu dosyayı okur. Format: en yeni kayıt en üstte.

## Modül Durumu

| Modül | Durum |
|---|---|
| Faz 0 — Altyapı | ✅ Tamamlandı (2026-07-03) |
| 1 — Kimlik & Profil | ✅ API + mobil tamam (2026-07-03) · cihazda kullanıcı testi bekliyor |
| 2 — Takım & Kadro | ✅ API + mobil tamam (2026-07-04) · cihazda kullanıcı testi bekliyor |
| 3 — Maç Organizasyonu | ✅ API + mobil tamam (2026-07-04) · cihazda kullanıcı testi bekliyor |
| 4 — Sosyal Katman | ✅ API + mobil tamam (2026-07-06) · cihazda kullanıcı testi bekliyor |
| 5-8 | ⬜ Başlamadı |

---

## 2026-07-06 — Modül 4 tamamlandı: Sosyal Katman (mobil)

- **Karar (kullanıcı):** Takıma etiketli gönderiyi herhangi bir takım üyesi
  paylaşabilir (sadece kaptan değil). 04-social-feed.md'ye işlendi.
- **Ekranlar:** (tabs)/feed (cursor-paginate akış, optimistic beğeni,
  "Gönderi paylaş" CTA, arama ikonu), post/create (metin gönderi + opsiyonel
  takım etiketleme çipleri, 500 karakter sayaç), post/[id] (detay + yorumlar,
  yorum composer'ı, "..." menüsünden şikayet/sil), player/[id] (herkese açık
  profil: takipçi/takip sayıları, takip et/çık, engelle/kaldır, engellenmiş
  kullanıcının gönderileri gizlenir, şikayet), search/index (oyuncu/takım
  sekmeli arama, 2+ karakterde tetiklenir).
- **Bug fix (kendi hatam):** post/create.tsx'i ilk yazışımda gönderi metni
  kutusu işlevsiz bir `Pressable` idi (boş `onPress`), gerçek metin girişi
  yapılamıyordu — fark edip gerçek `TextInput`'a çevirdim.
- Yazar adına dokunarak player/[id]'ye gitme feed + post detayına eklendi
  (PostCard'a opsiyonel `onPressAuthor` prop'u).
- Doğrulama: mobil lint + tsc temiz; Expo Router typed routes yeniden
  üretildi (4 yeni rota: post/create, post/[id], player/[id], search).
- API tarafı (migration/model/Action/controller/25 test) önceki oturumda
  bitmiş ve commit edilmişti (b48176c).

## 2026-07-04 (5) — İki çökme düzeltmesi (takvim + splash screen)

- **Takvim çökmesi:** `react-native-calendars`, RN 0.81/New Architecture ile
  "Cannot convert undefined value to object" hatası veriyordu (maç kurma →
  "Başka gün"). Kütüphane tamamen kaldırıldı (`npm uninstall`); yerine harici
  bağımlılıksız `shared/ui/MonthCalendar.tsx` yazıldı (ay ızgarası, önceki/
  sonraki ay gezinme, minDate öncesi günler devre dışı, tema token'larıyla
  birebir). `match/create.tsx` buna geçirildi.
- **Splash screen hatası:** Kök layout'taki navigasyon efekti `Segments`
  her değiştiğinde (yani her sayfa geçişinde) `SplashScreen.hideAsync()`'i
  tekrar çağırıyordu; splash zaten gizlendikten sonra tekrarlanan çağrı
  reddediliyordu ("No native splash screen registered..."). Düzeltme:
  hideAsync çağrısı artık sadece `Ready` ilk true olduğunda çalışan ayrı
  bir effect'te (bağımlılık: sadece `[Ready]`).
- BACKLOG.md #3'e not düşüldü (kütüphane değişikliği).
- Lint + tsc temiz.

## 2026-07-04 (4) — Backlog #1-3 tamamlandı

- **Özel kadro kurma:** team/[id]/index.tsx "Yeni kadro" akışına "Özel…"
  eklendi — 3-14 arası puk sayısı stepper ile seçilir, `generateCustomSlots`
  ızgara halinde yerleştirir, kullanıcı sonra serbestçe sürükler.
- **Keşif yarıçap seçici:** listings/index.tsx'e 5/10/25/50 km çipleri
  eklendi (RADIUS_OPTIONS), her iki keşif sekmesini etkiliyor.
- **Serbest tarih seçimi:** match/create.tsx'e `react-native-calendars` ile
  temalanmış takvim modalı eklendi ("Başka gün" düğmesi); gün state'i
  `DayOffset`'ten `SelectedDate: Date` nesnesine geçirildi.
- İlgili spec'ler (02-team-lineup.md, 03-match-organization.md) ve
  BACKLOG.md güncellendi (üç madde ✅). Madde #4 (bildirimler) kullanıcı
  tercihiyle şimdilik ertelendi.
- Lint + tsc temiz.

## 2026-07-04 (3) — Kadro tahtası çökme düzeltmesi + backlog dokümanı

- **Bug fix:** Kadro tahtası ekranı (team/[id]/lineup/[lid]) açılırken hata
  veriyordu. Kök neden: uygulama kökünde `GestureHandlerRootView` yoktu;
  `PitchBoard`'daki `GestureDetector` (sürükleme) buna ihtiyaç duyuyor —
  uygulamada gesture kullanan tek ekran orası olduğu için sorun sadece kadro
  açılışında görünüyordu. `mobile/src/app/_layout.tsx`'e eklendi.
- **docs/BACKLOG.md oluşturuldu:** Kullanıcının talep ettiği dört iyileştirme
  buraya kaydedildi (henüz kodlanmadı): (1) kadro tahtasında serbest/özel
  kadro kurma — preset'lere ek, (2) keşifte kullanıcının arama yarıçapını
  seçebilmesi, (3) maç kurarken 14 günlük şerit dışında takvimden serbest
  tarih seçimi, (4) push bildirimler (maç hatırlatma, rakip bulundu vb. —
  zaten Modül 7'de planlı, öncelik sırası kullanıcıyla netleşecek).
  CLAUDE.md Hızlı Referans'a eklendi.
- Bağlantı hatası (mobil .env'deki IP ile Mac'in güncel LAN IP'si uyuşmazlığı)
  kullanıcı tarafından kendisi çözüldü.

### Sonraki adım
- Kullanıcı BACKLOG.md'deki dört maddeden hangisiyle devam edileceğine
  karar verecek.

## 2026-07-04 (2) — Modül 3 tamamlandı: Maç Organizasyonu & Oyuncu Bulma

- **API:** matches (FootballMatch modeli — `match` PHP'de ayrılmış sözcük),
  match_participants, player_listings, listing_applications, opponent_listings.
  Maç kur (takım üyeleri otomatik katılımcı) → RSVP (idempotent) → adam eksik
  ilanı → başvuru → kaptan onayı (katılımcı ekle + sayaç düş + dolunca filled).
  Rakip ilanı: aç → keşifte listele → rakip kaptan "maç yapalım" →
  opponent_team_id dolar. matches:sweep (saatlik): geçmiş maçlar played,
  süresi dolan ilanlar expired. MatchPolicy elle Gate::policy ile bağlı.
- **Konum kararı (spec'e işlendi):** v1'de POINT yerine lat/lng decimal +
  bileşik indeks + bounding-box; mesafe sıralaması PHP haversine (Support/Geo).
  Gerekçe: test paketi sqlite; 10-50 km için doğruluk yeterli.
- **Öğrenilen:** Eloquent `create()` DB varsayılanlarını (status kolonları)
  bellekteki modele yansıtmaz — create sonrası `refresh()` gerekiyor
  (üç action'da düzeltildi).
- **Mobil:** matches sekmesi gerçek listeye dönüştü (Yaklaşan/Geçmiş +
  durum/RSVP özeti kartları); match/create sihirbazı (takım, saha, 14 günlük
  gün şeridi + saat çipleri, format, ücret — native date picker bağımlılığı
  yok); match/[id] detay (üç durumlu RSVP, kadro listesi, kaptan aksiyonları:
  onayla/iptal/adam-eksik/rakip ilanı); match/[id]/listing (ilan formu:
  mevki çipleri + kişi stepper + seviye aralığı; başvuru onay/red);
  listings keşfi (expo-location + İstanbul fallback, Adam Eksik / Rakip
  Arayanlar sekmeleri, mesafe rozetli kartlar, tek dokunuş başvuru).
- API 83 test + Pint + Larastan yeşil; mobil lint + tsc temiz.
- **MVP tamam:** Modül 1+2+3 bitti — ROADMAP'e göre store'a çıkılabilir
  seviye; öncesinde cihazda uçtan uca kullanıcı testi şart.

### Sonraki adım
- Kullanıcı cihaz testi (özellikle: maç kur → RSVP → ilan → başvuru → onay
  zinciri iki hesapla).
- Sonrası ROADMAP sırasına göre Modül 4 (Sosyal Katman) — veya kullanıcı
  tercihiyle store hazırlığı (ikon, splash, EAS build, TestFlight).

## 2026-07-04 — Modül 2 tamamlandı: Takım & Kadro Kurma

- **API:** teams/team_members/team_invites/lineups tabloları; TeamPolicy
  (view/update/manageInvites/transferCaptaincy/manageLineups); Action'lar
  (CreateTeam, GenerateTeamInvite, AcceptTeamInvite, RemoveTeamMember,
  TransferCaptaincy, CreateLineup/UpdateLineup + ResolveLineupPositions).
  Endpoint'ler spec'e birebir + iki gerekçeli ek: `GET /teams` (listem) ve
  `GET /teams/{id}/lineups` (Modül 1'deki `GET /cities` emsaliyle aynı mantık).
  Kaptan takımdan ayrılamaz (önce devretmeli); yetkisiz işlemler 403.
  28 yeni Pest testi (toplam 54), Larastan ve Pint temiz.
- **Larastan notu:** `casts()` metodu ile tanımlı date/array cast'ler, ilgili
  alan üzerinde Carbon/array-özel metot çağrıldığında Larastan 3.10 tarafından
  doğru tipte görülmüyor (ham DB tipine düşüyor) — çözüm: model sınıflarına
  `@property` docblock'u eklemek (TeamInvite, Lineup, TeamMember, User::$pivot).
  Bu, ileride benzer modellerde karşılaşılırsa hatırlanmalı.
- **Mobil:** "Gece Maçı" tasarım sistemine sadık kalarak: (tabs)/teams listesi,
  team/create (3 adım: isim→arma→renk), team/[id] detay (üyeler, kadrolar,
  davet, kaptan aksiyonları), team/[id]/invite (QR + kopyala + paylaş),
  team/[id]/lineup/[lid] (kadro tahtası).
  **Kadro tahtası tasarım kararı:** spec "bench'ten sürükle-bırak" tarif
  ediyordu; bunun yerine "puk sahada serbest sürüklenir (yeniden konumlama) +
  dokunma ile oyuncu/misafir atama sayfası açılır" modelini uyguladım — aynı
  kabul kriterlerini (60fps sürükleme, misafir pulu, atama) karşılıyor ama
  daha güvenilir bir gesture implementasyonu. Spec'in açık sorularına not
  düşüldü, kullanıcı onayı bekliyor.
  PNG export: react-native-view-shot + expo-sharing, alt köşede
  "sahana.app ile kuruldu" filigranı (büyüme kancası).
  Davet: `Linking.createURL` + `react-native-qrcode-svg`; oturumsuz kullanıcı
  join ekranına gelirse kod `pendingInviteStore`'da bekletilip OTP/onboarding
  bitince otomatik kabul ediliyor.
- **Düzeltmeler:** `Controller`'a `AuthorizesRequests` trait'i eklendi (Laravel
  12 iskeleti varsayılan getirmiyor); `AccessDeniedHttpException`→403 zarfı
  eklendi (policy reddi Laravel'de bu şekilde geliyor, `AuthorizationException`
  değil). Route typed-routes önbelleği (`.expo/types/router.d.ts`) yeni
  ekranlar için `expo start` ile yeniden üretildi.
- Doğrulama: API 54 test + Pint + Larastan yeşil; mobil lint + tsc temiz.

### Sonraki adım
- Modül 3: docs/features/03-match-organization.md (maç organizasyonu +
  adam eksik ilanları) — Modül 2'nin `teams`/`lineups` altyapısına bağlanacak.

## 2026-07-03 (6) — Expo SDK 57 → 54 düşürüldü (geçici)

- **Neden:** Expo Go'nun SDK 57 sürümü Apple incelemesinde, App Store'daki
  sürüm SDK 54 destekliyor; kullanıcı kendi iPhone'unda test etmek istedi.
- expo@54.0.35 / expo-router@6 / RN 0.81.5; temiz npm install; expo-doctor
  17/17, tsc + lint yeşil. Kod değişikliği gerekmedi.
- **Geri yükseltme:** Expo Go 57 App Store'a düşünce `npm install expo@^57 &&
  npx expo install --fix` ile dönülecek (not: SDK 57'nin react-server-dom
  bağımlılıkları için node_modules temiz kurulum gerekebilir).
- Cihaz testi için `mobile/.env` → EXPO_PUBLIC_API_URL=http://192.168.1.113:8000/api/v1
  (Wi-Fi değişirse IP güncellenmeli).

## 2026-07-03 (5) — Modül 1 mobil ekranları tamamlandı

- **Tasarım sistemi "Gece Maçı":** koyu çim zemini (#0B1F14), tebeşir saha
  çizgileri motifi (PitchLines), tek aksan projektör limonu (#C9F24E).
  Fontlar: Barlow Condensed (display), Manrope (gövde), Space Mono (kod/skor).
  Token'lar `src/shared/ui/theme.ts` — ekranlarda ham hex yasak.
- **İmza etkileşimler:** onboarding'de mevki seçimi mini saha üzerinde
  (PitchPositionPicker); OTP girişi skorbord hücreleri (OtpInput).
- **Akış:** welcome → identifier (tek alan: telefon/e-posta) → otp (120 sn
  sayaç, otomatik gönderim, tekrar gönder) → onboarding (isim → mevki → seviye
  → şehir, 4 adım) → (tabs)/profile. Token SecureStore'da; kök _layout auth
  kapısı yönlendirmeyi yapıyor.
- **Ekranlar:** (tabs) profil (forma kartı: isim, mevki çipleri, seviye rozeti,
  çıkış + KVKK hesap silme) ve maçlar (Modül 3 için "yakında" boş durumu).
- **Altyapı:** axios client (`EXPO_PUBLIC_API_URL`, varsayılan
  http://127.0.0.1:8000/api/v1 — fiziksel cihazda LAN IP gerekir), API hata
  zarfı normalize ediliyor (`toApiFailure`), TanStack Query + Zustand.
- API'ye `GET /cities` eklendi (onboarding şehir seçimi; spec güncellendi).
- Şablon artıkları silindi (components/hooks/constants, explore).
  Doğrulama: mobil lint + tsc temiz; API 26 test + Pint + Larastan yeşil.

### Sonraki adım
- Cihazda/simülatörde kullanıcı testi: `php artisan serve` (api/) +
  `npx expo start` (mobile/); OTP kodu `storage/logs/laravel.log`'a düşer.
- Sonra Modül 2: docs/features/02-team-lineup.md (takım & kadro).

## 2026-07-03 (4) — Modül 1 API tamamlandı

- **Spec güncellemesi (kullanıcı kararı):** OTP kanalı telefon VEYA e-posta, tek
  `identifier` alanı. E-posta OTP v1'de aktif; SMS `SmsSender` arayüzü arkasında
  (LogSmsSender). Google/Apple girişi store anahtarları hazır olunca.
- **Endpoint'ler:** POST /auth/otp, /auth/verify, /auth/logout; GET/PATCH/DELETE /me;
  GET /players/{publicId}. Hepsi api-conventions zarfı ve hata formatıyla
  (validation_failed, otp_expired, otp_invalid, otp_locked, otp_rate_limited,
  unauthenticated, not_found kodları bootstrap/app.php'de render ediliyor).
- **DB:** users alter (public_id ULID, phone, avatar_path, soft delete; name/email/
  password nullable), cities (81 il, plaka=id, seed), player_profiles.
- **KVKK:** DELETE /me anonimleştirir + soft delete; `users:purge` komutu 30 gün
  sonra kalıcı siler (günlük schedule).
- **Doğrulama:** 25 Pest testi + Pint + Larastan (1G memory) yeşil; e-posta OTP →
  verify → PATCH /me akışı çalışan sunucuda uçtan uca test edildi.
- Not: Lokal `.env` QUEUE_CONNECTION=sync (worker derdi yok); prod'da Redis+Horizon.
- Not: Testte aynı senaryoda ikinci istek için `auth->forgetGuards()` gerekiyor
  (guard, ilk isteğin kullanıcısını hatırlıyor).

### Sonraki adım
- Modül 1 mobil tarafı: (auth) ekranları — welcome, identifier girişi, OTP,
  onboarding; token'ın SecureStore'a yazılması; /me profil ekranı.

## 2026-07-03 (3) — GitHub + lokal MySQL

- Remote: https://github.com/talhabekci/sahana.git (`origin/main`).
- Commit kuralı (kullanıcı talebi): mesajlarda Claude/co-author atfı YOK;
  mevcut commit'lerden de temizlendi (filter-branch).
- Lokal DB: Sail yerine kullanıcının brew MySQL'i (9.5) — `sahana` veritabanı,
  `root`/şifresiz, `127.0.0.1`. Migration'lar çalıştı, testler yeşil.
  `.env` + `.env.example` güncellendi; docs (ROADMAP, tech-stack, architecture) işlendi.

## 2026-07-03 (2) — Faz 0 tamamlandı: monorepo iskeleti

- Kök repo `git init` (main); ilk commit: 143 dosya.
- **api/**: Laravel 12.62 + Sanctum (install:api) + Pest + Pint + Larastan (level 6)
  + Sail (mysql, redis). `/api/v1/health` endpoint'i zarf formatıyla; 3 test yeşil,
  Pint ve Larastan temiz. Test ortamı sqlite :memory:. `app/Actions/{Auth,Team,Match}`
  ve `app/Http/Controllers/Api/V1` klasör yapısı hazır.
- **mobile/**: Expo SDK 57 (RN 0.86, TS strict, expo-router) + TanStack Query,
  Zustand, axios, expo-secure-store. `src/features/{auth,team,match}` + `src/shared`
  yapısı. Şablonun bozuk web kalıntıları temizlendi (global.css importu,
  use-color-scheme.web.ts); lint + tsc yeşil. Not: web hedeflenmiyor,
  `*.web.*` dosyaları tsconfig'de exclude.
- CI: `.github/workflows/api-ci.yml` (pint+larastan+pest) ve `mobile-ci.yml` (lint+tsc).
- Not: migration hiç çalıştırılmadı (yerel MySQL yok); geliştirme DB'si Sail ile:
  `cd api && ./vendor/bin/sail up -d && sail artisan migrate`

### Kod stili kararı (kullanıcı, 2026-07-03)
- **PHP değişkenleri PascalCase** (`$PricePerPlayer`), controller/sınıf PascalCase,
  metotlar camelCase, DB tabloları snake_case. api-conventions.md §8'e işlendi.

### Sonraki adım
- Modül 1: docs/features/01-auth-profile.md implementasyonu.

## 2026-07-03 — Proje başlangıcı + doküman seti

- ROADMAP.md yazıldı; mobil teknoloji kararı **React Native (Expo)** olarak kesinleşti.
- Tüm `docs/` seti oluşturuldu: tech-stack, architecture, api-conventions,
  market-research, research/sosyalhalisaha, features/01-08.
- Kritik kararlar: sosyalhalisaha scrape edilmeyecek (v1 link/embed);
  MVP = Modül 1+2+3; kadro PNG export'u viral büyüme kanalı.
- CLAUDE.md (çalışma kuralları) ve bu dosya oluşturuldu.
- Faz 0 iskelet kurulumu başladı (Laravel api/ + Expo mobile/).

### Sonraki adım
- Faz 0'ı bitir: api/ + mobile/ iskeletleri, CI, git init.
- Ardından Modül 1 (docs/features/01-auth-profile.md) implementasyonu.
