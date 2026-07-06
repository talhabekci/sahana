# Backlog — İyileştirme Talepleri

> Kullanıcı geri bildiriminden doğan, henüz kodlanmamış iyileştirme/özellik
> istekleri. Bir madde ele alınmaya başlanınca ilgili modülün spec dosyasına
> (docs/features/XX-*.md) taşınır, "Kapsam"a eklenir ve burada ✅ işaretlenir.
> CLAUDE.md kuralı gereği: kodlamadan önce ilgili modül spec'i güncellenir.

## Açık Maddeler

### 1. Kadro Tahtası — Özel (serbest) kadro kurma
- **Bağlı modül:** Modül 2 — [02-team-lineup.md](features/02-team-lineup.md)
- **Talep tarihi:** 2026-07-04
- **Şu an:** "Yeni kadro" akışı sadece 4 hazır formasyon sunuyor (5/6/7/8
  kişilik presetler — `mobile/src/features/team/constants.ts`
  `FORMATION_PRESETS`), seçim bir Alert menüsünden yapılıyor.
- **İstenen:** Kullanıcı preset'e bağlı kalmadan kendi istediği sayıda ve
  serbest yerleşimli kadro oluşturabilsin.
- **Not:** Sürükle-bırak altyapısı (PitchBoard) zaten serbest x/y konumlarını
  destekliyor; eksik olan slot ekleme/çıkarma arayüzü ve "Özel" giriş yolu.

### 2. Keşif — Arama yarıçapı seçimi
- **Bağlı modül:** Modül 3 — [03-match-organization.md](features/03-match-organization.md)
- **Talep tarihi:** 2026-07-04
- **Şu an:** Yarıçap sabit kodlu (`listings/index.tsx`: adam eksik 30 km,
  rakip arayanlar 50 km).
- **İstenen:** Kullanıcı arama yarıçapını kendisi seçebilsin (ör. 5/10/25/50 km).
- **Not:** API zaten `radius` query parametresini destekliyor (§API tablosu);
  eksik olan sadece mobil UI'da bir seçici.

### 3. Maç Kurma — Serbest tarih seçimi
- **Bağlı modül:** Modül 3 — [03-match-organization.md](features/03-match-organization.md)
- **Talep tarihi:** 2026-07-04
- **Şu an:** `match/create.tsx` 14 günlük yatay gün şeridi sunuyor.
- **İstenen:** Kullanıcı 14 günden ileri bir tarihi de takvimden seçebilsin.
- **Not:** API zaten herhangi bir gelecek tarihi kabul ediyor
  (`starts_at`: `after:now`); sınırlama sadece mobil UI'da. Native/harici
  bir takvim paketi (ör. `react-native-calendars`) gerekecek.

### 4. Bildirimler (push notification)
- **Bağlı modül:** Modül 7 — [07-notifications-chat.md](features/07-notifications-chat.md)
  (zaten ROADMAP'te planlı; bu madde önceliklendirme sorusu)
- **Talep tarihi:** 2026-07-04
- **İstenen tetikleyiciler:** maça birkaç saat kala hatırlatma, maç saati
  geldiğinde, rakip bulunduğunda, adam-eksik başvurusu geldiğinde/onaylandığında.
- **Açık soru:** ROADMAP sırasına göre Modül 7, Modül 4-6'dan sonra geliyor.
  Kullanıcı deneyimi açısından (MVP'nin hemen ardından maç/RSVP döngüsünü
  gerçek anlamda WhatsApp'ın yerine koyabilmek için) öne alınması istenebilir.
  **Karar bekliyor.**

## Triyaj Kuralı
Yeni bir istek geldiğinde önce buraya madde olarak eklenir (kod yazılmaz).
Kullanıcı hangisinin öncelikli olduğunu belirtince, o madde ilgili modülün
spec dosyasına taşınır ve implementasyona oradan başlanır.
