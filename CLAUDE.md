# Sahana — Çalışma Kuralları

Halı saha oyuncuları için sosyal ağ. Monorepo: `api/` (Laravel 12) + `mobile/` (Expo RN) + `docs/`.

## MUTLAK KURALLAR

1. **Dokümanlara sadakat:** Kod, HER ZAMAN `docs/` altındaki spec'lere uyar.
   Bir modüle dokunmadan önce oku: ilgili `docs/features/XX-*.md` +
   `docs/api-conventions.md` + `docs/architecture.md` + `docs/tech-stack.md`.
2. **Spec'te olmayan şey kodlanmaz.** Gerekiyorsa önce spec güncellenir
   (kullanıcı teyidiyle), sonra kod yazılır.
3. **İlerleme kaydı:** Her çalışma seansı sonunda `docs/PROGRESS.md`'ye tarihli
   kayıt düşülür. Yeni oturum, işe başlamadan önce PROGRESS.md'yi okur.
4. Modül sırası ROADMAP.md'deki gibidir; bir modül bitmeden diğerine geçilmez.

## Hızlı Referans

- Yol haritası ve modüller: [ROADMAP.md](ROADMAP.md)
- Güncel durum / kaldığımız yer: [docs/PROGRESS.md](docs/PROGRESS.md)
- API kuralları (zarf, hata formatı, adlandırma): [docs/api-conventions.md](docs/api-conventions.md)
- Klasör yapısı ve ER modeli: [docs/architecture.md](docs/architecture.md)

## Teknik Sabitler (tech-stack.md'den)

- API: Laravel 12, API-only, Sanctum, Pest testleri, Pint, Larastan
- Mobil: Expo + TypeScript strict, expo-router, TanStack Query + Zustand
- DB: MySQL 8, zamanlar UTC/ISO 8601, JSON alanlar snake_case
- Controller ince, iş mantığı `app/Actions/<Modül>/` altında
- Her endpoint: happy path + yetki + validasyon Pest testi olmadan bitmiş sayılmaz
