# Backlog — İyileştirme Talepleri

> Kullanıcı geri bildiriminden doğan, henüz kodlanmamış iyileştirme/özellik
> istekleri. Bir madde ele alınmaya başlanınca ilgili modülün spec dosyasına
> (docs/features/XX-*.md) taşınır, "Kapsam"a eklenir ve burada ✅ işaretlenir.
> CLAUDE.md kuralı gereği: kodlamadan önce ilgili modül spec'i güncellenir.

## Açık Maddeler

### 1. Kadro Tahtası — Özel (serbest) kadro kurma ✅
- **Bağlı modül:** Modül 2 — [02-team-lineup.md](features/02-team-lineup.md)
- **Talep tarihi:** 2026-07-04 · **Tamamlandı:** 2026-07-04
- "Yeni kadro" akışına "Özel…" seçeneği eklendi: kullanıcı 3-14 arası puk
  sayısını stepper ile seçiyor, ızgara halinde yerleştiriliyor, sonra
  sürükleyerek serbestçe konumlandırıyor (`team/[id]/index.tsx`
  `generateCustomSlots`).

### 2. Keşif — Arama yarıçapı seçimi ✅
- **Bağlı modül:** Modül 3 — [03-match-organization.md](features/03-match-organization.md)
- **Talep tarihi:** 2026-07-04 · **Tamamlandı:** 2026-07-04
- `listings/index.tsx`'e 5/10/25/50 km çipleri eklendi; her iki sekmeyi
  (adam eksik + rakip arayanlar) birlikte etkiliyor.

### 3. Maç Kurma — Serbest tarih seçimi ✅
- **Bağlı modül:** Modül 3 — [03-match-organization.md](features/03-match-organization.md)
- **Talep tarihi:** 2026-07-04 · **Tamamlandı:** 2026-07-04
- 14 günlük şeridin yanına "Başka gün" düğmesi eklendi.
- **Not (2026-07-04):** İlk denemede `react-native-calendars` kullanıldı ama
  RN 0.81/New Architecture ile "Cannot convert undefined value to object"
  hatası verdi. Kütüphane tamamen kaldırıldı; yerine harici bağımlılıksız,
  tema token'larıyla birebir uyumlu `shared/ui/MonthCalendar.tsx` yazıldı.

### 5. Profil ekranı — kendi sosyal aktivitesi görünmüyor
- **Bağlı modül:** Modül 4 — [04-social-feed.md](features/04-social-feed.md)
- **Talep tarihi:** 2026-07-06
- Kullanıcı bir oyuncuyu takip ediyor, gönderi beğeniyor/yorumluyor ama
  (tabs)/profile ekranında bunların hiçbiri görünmüyor: kaç takipçisi var,
  kendisi ne paylaşmış, kendi gönderilerine kim ne yorum yapmış.
  `player/[id].tsx`'teki herkese açık profilde bu veriler zaten var
  (`followers_count`/`following_count`/gönderi listesi) — kendi profil
  ekranına da taşınmalı, üstüne kendi gönderilerine gelen yorumların
  görünürlüğü eklenmeli.

### 6. Akış — çekerek yenileme (pull-to-refresh)
- **Bağlı modül:** Modül 4 — [04-social-feed.md](features/04-social-feed.md)
- **Talep tarihi:** 2026-07-06
- (tabs)/feed.tsx'te sayfa yukarıdan aşağı çekilince `/feed`'e yeniden istek
  atıp yeni paylaşılanları yüklemesi isteniyor (FlatList `RefreshControl` +
  `refetch`/`isRefetching` bağlanmalı).

### 7. Gönderi paylaşma ekranı — zayıf, MVP'den production-ready'e geçiş
- **Bağlı modül:** Modül 4 — [04-social-feed.md](features/04-social-feed.md)
  (genel kapsamı MVP sonrası tüm uygulamayı etkiliyor)
- **Talep tarihi:** 2026-07-06
- Kullanıcı post/create.tsx'i (ve genel olarak uygulamayı) "MVP" seviyesinden
  çıkarıp yayına çıkmadan önce "production ready" hale getirmek istiyor.
  Somut kapsam netleşmedi (fotoğraf ekleme? draft kaydetme? daha zengin
  editör?) — implementasyona geçmeden önce kullanıcıyla netleştirilmeli.

### 8. Akışta adam eksik / rakip arayanlar ilanlarının gösterilmesi
- **Bağlı modül:** Modül 3 + Modül 4 — [03-match-organization.md](features/03-match-organization.md),
  [04-social-feed.md](features/04-social-feed.md)
- **Talep tarihi:** 2026-07-06
- `player_listings`/`opponent_listings` şu an sadece Keşfet (listings/index.tsx)
  sekmesinde görünüyor; kullanıcı bunların (tabs)/feed akışında da (yeni bir
  post/kart türü olarak) gösterilmesini istiyor. Feed'in `BuildFeed` Action'ı
  ve `Post.TYPES`'a yeni bir tür eklenmesi gerekebilir — tasarım netleşmeli.

## Genel Yön: MVP → Production Ready
- **Talep tarihi:** 2026-07-06
- Kullanıcı Modül 4'ü test etti, çökme yok; ama yukarıdaki maddeler + henüz
  yazılmamış başkaları için genel hedef: tüm modüller bitince MVP'den
  production-ready'e geçiş yapılacak (bkz. madde #7). Bu ayrı bir "cilalama"
  fazı olarak ROADMAP'in sonuna eklenebilir — kullanıcı ile netleşecek.

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
