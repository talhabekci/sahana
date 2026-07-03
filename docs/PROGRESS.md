# İlerleme Kaydı

> Her çalışma seansı buraya tarihli kayıt düşer. Yeni oturum işe başlamadan
> önce bu dosyayı okur. Format: en yeni kayıt en üstte.

## Modül Durumu

| Modül | Durum |
|---|---|
| Faz 0 — Altyapı | ✅ Tamamlandı (2026-07-03) |
| 1 — Kimlik & Profil | 🔨 API tamam (2026-07-03) · mobil ekranlar bekliyor |
| 2 — Takım & Kadro | ⬜ Başlamadı |
| 3 — Maç Organizasyonu | ⬜ Başlamadı |
| 4-8 | ⬜ Başlamadı |

---

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
