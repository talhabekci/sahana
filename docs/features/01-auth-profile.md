# Modül 1 — Kimlik & Oyuncu Profili

> Durum: **Taslak** · MVP kapsamında · Bağımlılık: yok (ilk modül)

## Amaç
Kullanıcının saniyeler içinde hesap açıp kendini "oyuncu" olarak tanımlaması.
Profil, diğer tüm modüllerin (kadro, eşleşme, reyting) veri temelidir.

## Kapsam (v1)
- Telefon numarası + SMS OTP ile kayıt/giriş (TR numaraları)
- Google / Apple ile giriş (Apple, App Store zorunluluğu)
- Oyuncu profili oluşturma ve düzenleme
- Başkasının profilini görüntüleme (herkese açık kısmı)
- Hesap silme (KVKK zorunluluğu)

### Kapsam dışı (sonraya)
- E-posta/şifre girişi · profil doğrulama rozetleri · gizlilik ayarları (granüler)

## Kullanıcı Hikayeleri
1. Oyuncu olarak telefon numaramla 30 saniyede kayıt olmak istiyorum ki
   arkadaşımın attığı maç davetine hemen katılabileyim.
2. Mevkimi ve seviyemi belirtmek istiyorum ki "adam eksik" ilanlarında doğru
   maçlarla eşleşeyim.
3. Uygulamayı silmek istediğimde tüm verimin silinmesini isterim (KVKK).

## Profil Alanları

| Alan | Tip | Zorunlu | Not |
|---|---|---|---|
| name | string | ✅ | Kayıtta istenir |
| avatar | görsel | – | Crop + EXIF temizleme |
| positions | çoklu seçim | ✅ | kaleci, defans, orta saha, forvet (çoklu) |
| foot | enum L/R/B | – | |
| level | 1-5 | ✅ | Kendi beyanı; Modül 6'da reytingle dengelenir |
| city / district | seçim | ✅ | İlan eşleşmesinin temeli |
| availability | JSON | – | Haftanın günleri + saat aralıkları |
| bio | string(160) | – | |

## Ekranlar (expo-router)
```
(auth)/welcome      → değer önerisi + "Telefonla devam et" / Google / Apple
(auth)/phone        → numara girişi
(auth)/otp          → 6 haneli kod, 120sn geri sayım, tekrar gönder
(auth)/onboarding   → isim → mevki(ler) → seviye → şehir (adım adım, atlanabilir alanlar hariç)
(tabs)/profile      → kendi profilim + düzenle
player/[id]         → başka oyuncunun profili
```

## API

| Method | Endpoint | Açıklama |
|---|---|---|
| POST | /auth/otp | `{phone}` → SMS gönderir. Rate: 3/saat/numara |
| POST | /auth/verify | `{phone, code}` → `{token, is_new_user}` |
| POST | /auth/social | `{provider: google\|apple, id_token}` → `{token, is_new_user}` |
| POST | /auth/logout | Token iptali |
| GET | /me | Kendi profilim (tüm alanlar) |
| PATCH | /me | Profil güncelleme |
| DELETE | /me | Hesap silme (soft delete + 30 gün sonra purge job) |
| GET | /players/{publicId} | Herkese açık profil |

OTP kodu: 6 hane, 120 sn geçerli, Redis'te hash'lenmiş, 5 yanlış denemede kilit.

## Veri Modeli
`users` (id, public_id, phone uniq nullable, name, avatar_path, provider alanları,
deleted_at) + `player_profiles` (user_id 1:1, positions JSON, foot, level,
city_id, district_id, availability JSON, bio). Şehir/ilçe: statik seed tablosu.

## Kabul Kriterleri
- [ ] Yeni numara ile kayıt → onboarding → profil oluşturma < 60 sn tamamlanabiliyor
- [ ] Yanlış OTP 5 kez → 429 + kullanıcıya net mesaj
- [ ] SMS gönderimi kuyruk üzerinden (senkron istek SMS sağlayıcısını beklemez)
- [ ] Hesap silme sonrası: token geçersiz, profil 404, telefon yeniden kayıt olabilir
- [ ] Apple ile giriş çalışıyor (App Store review şartı)
- [ ] Pest: her endpoint için happy path + rate limit + validasyon testi

## Açık Sorular
- [ ] SMS sağlayıcısı seçimi (Netgsm vs İleti Merkezi — fiyat/deliverability)
- [ ] Kullanıcı adı (@handle) v1'de olsun mu, yoksa Modül 4 (sosyal) ile mi gelsin?
