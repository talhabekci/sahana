# Modül 1 — Kimlik & Oyuncu Profili

> Durum: **Uygulanıyor** (API: 2026-07-03'te başladı) · MVP kapsamında · Bağımlılık: yok (ilk modül)

## Amaç
Kullanıcının saniyeler içinde hesap açıp kendini "oyuncu" olarak tanımlaması.
Profil, diğer tüm modüllerin (kadro, eşleşme, reyting) veri temelidir.

## Kapsam (v1)
- **Sadece e-posta + OTP** ile kayıt/giriş (kullanıcı kararı 2026-07-13: SMS
  sağlayıcısı henüz entegre değil — `identifier` alanı şimdilik yalnızca
  e-posta kabul eder, telefon formatı 422 döner). Altyapı telefona hazır:
  `users.phone` kolonu ve `SmsSender` arayüzü (lokalde log driver) duruyor —
  sağlayıcı seçilince `SendOtpRequest::identifierRule()`'daki kısıtlama
  kaldırılıp telefon de yeniden açılır.
- Google / Apple ile giriş (Apple, App Store zorunluluğu) —
  **implementasyon store hesapları/anahtarlar hazır olunca**; endpoint tasarımı sabit
- Oyuncu profili oluşturma ve düzenleme
- Başkasının profilini görüntüleme (herkese açık kısmı)
- Hesap silme (KVKK zorunluluğu)

### Kapsam dışı (sonraya)
- E-posta/şifre girişi · profil doğrulama rozetleri · gizlilik ayarları (granüler)

## Kullanıcı Hikayeleri
1. Oyuncu olarak e-posta adresimle 30 saniyede kayıt olmak istiyorum ki
   arkadaşımın attığı maç davetine hemen katılabileyim.
2. Mevkimi ve seviyemi belirtmek istiyorum ki "adam eksik" ilanlarında doğru
   maçlarla eşleşeyim.
3. Uygulamayı silmek istediğimde tüm verimin silinmesini isterim (KVKK).

## Profil Alanları

| Alan | Tip | Zorunlu | Not |
|---|---|---|---|
| name | string | ✅ | Kayıtta istenir |
| avatar | görsel | – | Kamera/galeri, `ImageUploader` ile JPEG'e re-encode + EXIF/GPS temizleme |
| positions | çoklu seçim | ✅ | kaleci, defans, orta saha, forvet (çoklu) |
| foot | enum L/R/B | – | |
| level | 1-5 | ✅ | Kendi beyanı; Modül 6'da reytingle dengelenir |
| city | seçim (81 il, seed) | ✅ | İlan eşleşmesinin temeli |
| district | seçim (ilçe seed, 970 kayıt) | – | BACKLOG #51 (2026-07-11): `districts` tablosu (city_id=plaka) + `GET /cities/{id}/districts`; profil düzenlemede şehre bağlı seçici. Profil şemasında hâlâ metin olarak saklanır (geriye uyumlu) |
| availability | JSON | – | Haftanın günleri + saat aralıkları |
| bio | string(160) | – | |
| birth_date | date | – | Geçmiş tarih zorunlu (`before:today`); yaş bazlı öneri/istatistik için veri toplama amaçlı (Backlog #27). Girişi seçmeli: gün/ay/yıl kolonlu sheet (BACKLOG #52 — native date picker bağımlılığı yok) |

## Ekranlar (expo-router)
```
(auth)/welcome      → değer önerisi + "Devam et" / Google / Apple
(auth)/identifier   → e-posta girişi (telefon şimdilik kapalı, bkz. Kapsam)
(auth)/otp          → 6 haneli kod, 120sn geri sayım, tekrar gönder
(auth)/onboarding   → isim → mevki(ler) → seviye → şehir (adım adım, atlanabilir alanlar hariç)
(tabs)/profile      → kendi profilim (avatar, takipçi/takip sayıları, düzenle + ayarlar simgesi)
profile-edit        → profil bilgilerini + fotoğrafını tek form üzerinden düzenleme
settings            → ayarlar: profili düzenle, bildirim tercihleri, yasal metinler, çıkış/hesap silme
settings/legal/[slug] → yasal metin görüntüleyici (placeholder; PRODUCTION-READINESS.md madde G'ye bağlı)
player/[id]         → başka oyuncunun profili
```

## API

| Method | Endpoint | Açıklama |
|---|---|---|
| POST | /auth/otp | `{identifier}` (yalnızca e-posta, bkz. Kapsam) → OTP gönderir. Rate: 3/saat/identifier + 10/saat/IP |
| POST | /auth/verify | `{identifier, code}` → `{token, is_new_user}` |
| POST | /auth/social | `{provider: google\|apple, id_token}` → `{token, is_new_user}` |
| POST | /auth/logout | Token iptali |
| GET | /me | Kendi profilim (tüm alanlar) |
| PATCH | /me | Profil güncelleme |
| DELETE | /me | Hesap silme (soft delete + 30 gün sonra purge job) |
| GET | /players/{publicId} | Herkese açık profil |
| GET | /cities | 81 il listesi (onboarding şehir seçimi) |
| GET | /cities/{id}/districts | İlin ilçeleri (statik seed, TR alfabetik — BACKLOG #51) |

OTP kodu: 6 hane, 120 sn geçerli, cache store'da hash'lenmiş (lokal: database
driver, prod: Redis), 5 yanlış denemede kilit (429 `otp_locked`).
E-posta OTP kuyruklu Mailable ile; SMS `SmsSender` arayüzü ile (lokal: log driver).

## Veri Modeli
`users` (id, public_id, phone uniq nullable, name, avatar_path, provider alanları,
deleted_at) + `player_profiles` (user_id 1:1, positions JSON, foot, level,
city_id, district_id, availability JSON, bio, birth_date nullable date).
Şehir/ilçe: statik seed tablosu.

## Kabul Kriterleri
- [ ] Yeni numara ile kayıt → onboarding → profil oluşturma < 60 sn tamamlanabiliyor
- [ ] Yanlış OTP 5 kez → 429 + kullanıcıya net mesaj
- [ ] SMS gönderimi kuyruk üzerinden (senkron istek SMS sağlayıcısını beklemez)
- [ ] Hesap silme sonrası: token geçersiz, profil 404, e-posta yeniden kayıt olabilir
- [ ] Apple ile giriş çalışıyor (App Store review şartı)
- [ ] Pest: her endpoint için happy path + rate limit + validasyon testi

## Açık Sorular
- [x] ~~OTP kanalı~~ → e-posta OTP v1'de aktif (kullanıcı kararı 2026-07-03)
- [ ] SMS sağlayıcısı seçimi (Netgsm vs İleti Merkezi — fiyat/deliverability)
- [ ] Kullanıcı adı (@handle) v1'de olsun mu, yoksa Modül 4 (sosyal) ile mi gelsin?
- [x] ~~Avatar yükleme~~ → Backlog #27 ile eklendi; şu an `Storage::disk('public')` (yerel),
      R2'ye taşıma docs/PRODUCTION-READINESS.md'de ayrı madde olarak duruyor
