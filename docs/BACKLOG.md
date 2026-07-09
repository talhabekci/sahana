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

### 6. Akış — çekerek yenileme (pull-to-refresh) ✅
- **Tamamlandı:** 2026-07-08 — `FlatList`'e `RefreshControl` bağlandı
  (`Feed_.refetch()` + `Feed_.isRefetching && !Feed_.isFetchingNextPage`,
  sayfalama sırasında yanlışlıkla "yenileniyor" göstermesin diye).
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

### 9. Videolara varsayılan kapak fotoğrafı ✅
- **Tamamlandı:** 2026-07-09 — `assets/images/video-default-cover.png`
  eklendi (tema renkleriyle: turfRaised zemin, ince saha çizgisi motifi,
  ortada yumuşak lime glow + play ikonu). `PostCard.tsx` ve
  `match/[id]/index.tsx`'teki ikon placeholder'ların yerini aldı.
- **Bağlı modül:** Modül 5 — [05-videos.md](05-videos.md)
- **Talep tarihi:** 2026-07-07
- Şu an `thumbnail_url` boş gelirse (oEmbed/OG metadata çekilemedi ya da
  sağlayıcı thumbnail döndürmedi) `PostCard`/match detayında sadece bir
  ikon placeholder gösteriliyor. Kullanıcı gerçek bir **varsayılan kapak
  görseli** istiyor (tek, sabit bir default asset — video başlığına/
  sağlayıcıya göre değişmeyen). Mobil tarafta `assets/`e eklenip
  `thumbnail_url == null` durumunda `<Image>` ile gösterilecek.

### 10. "Videonu bul" (v1.5) — kendi il/ilçe/saha tabloları + external_id eşleştirmesi
- **Bağlı modül:** Modül 5 — [05-videos.md](05-videos.md) §v1.5,
  [../research/sosyalhalisaha.md](../research/sosyalhalisaha.md) §3.1
  (ileride Modül 8 — Saha Rehberi ile kesişebilir)
- **Talep tarihi:** 2026-07-07
- Spec'teki v1.5 tasarımı tek bir düz `sosyalhalisaha_venues` referans
  tablosu öngörüyordu (`il_id, ilce_id, ilce_name, saha_id, saha_name`).
  Kullanıcının rafine ettiği tasarım: **kendi id sistemimizle** birinci
  sınıf `districts` (ilçe) ve `venues` (saha) tabloları tutulsun — il zaten
  `cities` tablosuyla eşleşiyor (plaka=id) — her ikisine de sosyalhalisaha
  eşleşmesi için nullable bir `external_id` kolonu eklensin. Maç kurarken
  kullanıcı kendi il/ilçe/saha'mızdan seçer; "Videonu bul" linki için
  sosyalhalisaha URL'i o saha kaydının `external_id`'siyle kurulur.
  Uygulamaya geçilmeden önce spec'in v1.5 bölümü bu tasarıma göre
  güncellenmeli.

### 11. Sohbet — DM (birebir mesajlaşma) + alt sekmede tüm sohbetlerin listesi ✅
- **Tamamlandı:** 2026-07-07 — aynı oturumda uygulandı (bkz. PROGRESS.md,
  07-notifications-chat.md "Sohbet — DM" bölümü).
- **Bağlı modül:** Modül 7 — [07-notifications-chat.md](features/07-notifications-chat.md)
  (v1 kapsamı sadece takım sohbetiydi — "Kapsam dışı (şimdilik): DM" olarak
  spec'e not düşülmüştü, bu madde onu resmen backlog'a taşıyor)
- **Talep tarihi:** 2026-07-07
- Şu an tek sohbet kanalı `team/[id]/chat.tsx` (takım içi grup sohbeti); alt
  sekmelerde (tabs) ayrı bir "Sohbet" sekmesi yok. Kullanıcı iki şey istiyor:
  1. Alt tab bar'a bir **Sohbet** sekmesi eklenip kullanıcının katıldığı
     TÜM sohbetleri (hem takım grupları hem ileride DM'ler) tek yerden
     görüp yönetebilmesi (liste, son mesaj önizlemesi, okunmamış rozeti gibi).
  2. **Birebir DM**: akıştan biriyle veya `player/[id].tsx` herkese açık
     profilinden doğrudan "Mesaj gönder" ile birebir sohbet başlatılabilmesi.
- Mimari not: mevcut `messages` (MongoDB) koleksiyonu `team_id`'ye bağlı;
  DM için ya aynı koleksiyona `conversation_id`/`type: dm` gibi bir ayrım
  eklenmeli ya da ayrı bir `conversations`/`direct_messages` şeması
  tasarlanmalı — spec'e işlenmeden kodlanmayacak.

### 12. Sohbet — klavye ile mesaj kutusu arasında aşırı boşluk ✅
- **Tamamlandı:** 2026-07-07 — `keyboardVerticalOffset` her iki ekranda da
  `0`'a çekildi (topBar, KeyboardAvoidingView'ın kendi içinde bir çocuk
  olduğundan ek bir offset'e gerek yoktu; 90 değeri `post/[id].tsx`'ten
  kopyalanmış ama oraya özel bir değermiş).
- **Bağlı modül:** Modül 7 — [07-notifications-chat.md](features/07-notifications-chat.md)
  (`team/[id]/chat.tsx`, `dm/[id].tsx`)
- **Talep tarihi:** 2026-07-07
- Cihaz testinde: mesaj yazarken composer ile klavye arasında büyük bir
  boşluk oluşuyor (ekran görüntüsü — takım sohbeti, 16:28). Muhtemel sebep:
  her iki ekran da `post/[id].tsx`'ten kopyalanan sabit
  `keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}` değerini
  kullanıyor — bu değer o ekranın kendi header/scroll yapısına göre
  ayarlanmıştı, sohbet ekranlarının farklı üst bar yüksekliğiyle uyuşmuyor
  olabilir. Düzeltilmeden önce her ekran için doğru offset ölçülmeli (ya da
  `react-native-keyboard-controller` gibi daha güvenilir bir çözüme
  geçilmeli — uygulama genelinde tutarlılık için).

### 13. Sohbet — mesaj gönderince kısa süreliğine iki kez görünüyor ✅
- **Tamamlandı:** 2026-07-07 — iki katmanlı düzeltme uygulandı: (1)
  `shared/api/echo.ts`'e axios request interceptor eklendi,
  `EchoInstance?.socketId()`'i her isteğe `X-Socket-Id` header'ı olarak
  enjekte ediyor (asıl kök neden düzeltmesi); (2) her iki ekranın da hem
  mutation `onSuccess`'inde hem Echo dinleyicisinde, aynı `id` zaten
  cache'te varsa tekrar eklenmiyor (idempotent merge — bağlantı henüz
  kurulmamışken oluşabilecek ırk koşullarına karşı ek güvence).
- **Bağlı modül:** Modül 7 — [07-notifications-chat.md](features/07-notifications-chat.md)
  (`dm/[id].tsx`, muhtemelen `team/[id]/chat.tsx`'i de etkiliyor)
- **Talep tarihi:** 2026-07-07
- Cihaz testinde: mesaj atınca aynı mesaj FlatList'te iki kez beliriyor,
  ekrandan çıkıp tekrar girince tek görünüyor. Ekran görüntüsündeki
  React Native hata kutusu kök nedeni doğruluyor: **"Encountered two
  children with the same key"** (`dm/[id].tsx:130`, `FlatList`
  `keyExtractor={(Item) => Item.id}`) — yani state'te aynı `id`'ye sahip
  mesaj gerçekten iki kez var.
  **Kök neden teşhisi:** `SendMessage`/`SendDirectMessage` Action'ları
  `broadcast(...)->toOthers()` kullanıyor — bu, Laravel'in gönderen
  bağlantıyı (`X-Socket-Id` header'ı üzerinden) dışlamasına dayanıyor.
  Ancak `shared/api/client.ts`'teki axios istemcisi hiçbir zaman
  `X-Socket-Id` header'ı eklemiyor (Echo ile axios arasında bu köprü
  kurulmamış) — bu yüzden backend göndereni gerçek anlamda "toOthers"
  olarak ayıramıyor, gönderenin kendi bağlantısına da event gidiyor.
  Sonuç: mesaj hem mutation'ın `onSuccess`'inde manuel prepend ediliyor
  hem de Echo `.message.sent` dinleyicisinde tekrar ekleniyor → aynı id
  iki kez. Düzeltme adayı: `getEcho()` bağlantısı kurulduktan sonra
  `Echo.socketId()`'i axios'un default header'larına enjekte etmek (Echo
  hazır olduğunda `Api.defaults.headers.common['X-Socket-Id'] =
  getEcho().socketId()`), ya da Echo listener'da gelen mesajın id'si
  zaten cache'te varsa eklememek (idempotent merge).

### 14. Sohbet — kendi gönderdiğim mesajlar renk kontrastından okunmuyor ✅
- **Tamamlandı:** 2026-07-07 — `bubbleMine` içindeki metinler için yeni
  `textMine` stili eklendi (`color: Palette.limeInk`), `bubbleBody`/
  `bubbleWhen`/`refText`'e kendi mesajlarımda koşullu uygulanıyor.
- **Bağlı modül:** Modül 7 — [07-notifications-chat.md](features/07-notifications-chat.md)
  (`dm/[id].tsx`)
- **Talep tarihi:** 2026-07-07
- DM ekranında kendi mesaj balonum (`bubbleMine`) arka planı `Palette.lime`
  (`#C9F24E`, parlak sarı-yeşil) ama metin rengi hâlâ `Palette.chalk`
  (`#EAF2EA`, neredeyse beyaz) — kontrast çok düşük, okunmuyor. Düzeltme:
  `bubbleMine` içindeki `bubbleBody`/`bubbleWhen` metinlerinde
  `Palette.limeInk` (`#0B1A0F`, zaten lime üzerine yazı için tanımlı koyu
  ton — rozet ikonlarında kullanılıyor) kullanılmalı.

### 15. Akış — "Gönderi paylaş" butonu altında fazla boşluk, genel buton/UI cilası ✅
- **Tamamlandı:** 2026-07-07 — alt `footer` butonu kaldırıldı, yerine
  header'ın sol tarafına (AKIŞ başlığının hemen solunda) bir "+" ikon
  butonu eklendi (`/post/create`'e gidiyor). Uygulama genelinde benzer
  buton yerleşimlerinin gözden geçirilmesi ayrı bir cilalama fazı olarak
  madde #7'de kalmaya devam ediyor.
- **Bağlı modül:** Modül 4 — [04-social-feed.md](features/04-social-feed.md)
  (genel kapsamı uygulama geneli buton/spacing tutarlılığını etkiliyor)
- **Talep tarihi:** 2026-07-07
- `(tabs)/feed.tsx`'te alt sabit `footer` içindeki "Gönderi paylaş"
  butonunun altında/çevresinde gereğinden fazla boşluk var. Kullanıcının
  önerisi: butonu tamamen kaldırıp yerine sol üstte (header'da) bir "+"
  ikon butonu koymak — hem burada hem uygulama genelinde daha sade bir UI
  için bu deseni değerlendirmek. Madde #7'deki "MVP → production ready"
  genel cilalama fazıyla birlikte ele alınabilir.

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

### 16. Saha rehberi — gerçek seed verisi (Google Places API vs. elle giriş)
- **Bağlı modül:** Modül 8 — [08-venues.md](features/08-venues.md)
- **Talep tarihi:** 2026-07-08
- Modül 8'in Aşama 1'i (rehber) boş/test verisiyle kodlandı (kullanıcı
  kararı). Gerçek Türkiye halı saha verisini toplu doldurmak ayrı bir iş:
  Google Places API (maliyetli, kullanım başına ücretli) ile mi, yoksa elle
  giriş/kullanıcı ekleme akışıyla mı (spec'te "öneri + moderasyon kuyruğu"
  olarak bahsediliyor, henüz `POST /venues` endpoint'i yok) doldurulacağı
  netleşmeden kodlanmayacak. Pilot şehir seçimiyle birlikte ele alınmalı
  (bkz. 08-venues.md "Açık Sorular").

### 18. Saha seçimi — düz liste yerine il → ilçe → saha hiyerarşik akış
- **Bağlı modül:** Modül 8 — [08-venues.md](features/08-venues.md)
  (ilgili: madde #10 "il/ilçe/saha tabloları", madde #16 "gerçek seed verisi")
- **Talep tarihi:** 2026-07-08
- Cihaz testinde kullanıcı: maç kurarken "Rehberden seç" tüm sahaları düz
  bir liste olarak getiriyor — production-ready değil, kullanıcı önce
  **il**, sonra **ilçe**, sonra o ilçedeki **sahalar** arasından seçim
  yapabilmeli. Bunun için gerçek saha verisinin bir haritalama/konum
  API'sinden (Google Places vb.) il/ilçe bazında çekilmesi gerekiyor —
  yani bu madde, #16'daki "gerçek seed verisi" kararına ve #10'daki
  `districts`/`venues` + `external_id` tasarımına doğrudan bağımlı, aynı
  alt yapı ihtiyacının üçüncü bir yerde (Modül 8 saha seçimi) tekrar
  ortaya çıkması. **Kullanıcı bu konuda nasıl ilerlenmesi gerektiğini
  ayrıca anlatacak** — henüz tasarım/kapsam kararı yok, kodlanmadı.

### 17. ExpoPushClient — Expo'nun hata yanıtı hiç loglanmıyor (sessiz başarısızlık) ✅
- **Tamamlandı:** 2026-07-08 — `ExpoPushClient::send()` artık Expo
  yanıtındaki `data[]` ticket'larını okuyor, `status: error` olanları
  `Log::warning`'e yazıyor; `details.error === 'DeviceNotRegistered'`
  durumunda ilgili `devices` kaydını otomatik siliyor (token kalıcı
  geçersiz demek). 3 yeni test (`ExpoPushClientTest.php`).
- **Bağlı modül:** Modül 7 — [07-notifications-chat.md](features/07-notifications-chat.md)
  (`App\Support\ExpoPushClient`)
- **Talep tarihi:** 2026-07-08
- Cihaz testinde keşfedildi: `ExpoPushClient::send()` sadece ağ seviyesi
  hataları (`Throwable`) yakalayıp logluyor. Ama Expo'nun push API'si,
  geçersiz/eski bir token gibi durumlarda bile HTTP `200` döner — hatayı
  yanıtın **içindeki** `data[].status: "error"` alanında verir (ör.
  `DeviceNotRegistered`). Şu anki kod bu içeriği hiç okumadığından, prod'da
  push'lar sessizce başarısız olabilir ve hiçbir yerde görünmez. Düzeltme:
  yanıtı parse edip `status: error` olan mesajları uyarı olarak logla
  (mümkünse `details.error === 'DeviceNotRegistered'` durumunda ilgili
  `devices` kaydını da silmeyi değerlendir — token artık geçersiz demektir).

## Triyaj Kuralı
Yeni bir istek geldiğinde önce buraya madde olarak eklenir (kod yazılmaz).
Kullanıcı hangisinin öncelikli olduğunu belirtince, o madde ilgili modülün
spec dosyasına taşınır ve implementasyona oradan başlanır.
