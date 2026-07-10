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

### 5. Profil ekranı — kendi sosyal aktivitesi görünmüyor ✅
- **Tamamlandı:** 2026-07-09 — `GET /me`'ye `followers_count`/
  `following_count` eklendi (`UserResource`, `MeController::loadCount`).
  `(tabs)/profile.tsx`, `player/[id].tsx`'teki FlatList+ListHeaderComponent
  desenine taşındı: takipçi/takip sayıları + kendi gönderi listesi
  (`PostCard` ile, her kart zaten `comments_count`'u gösterdiğinden kendi
  gönderilerine gelen yorum sayısı da otomatik görünür oluyor).
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

### 7. Gönderi paylaşma ekranı — zayıf, MVP'den production-ready'e geçiş ✅
- **Tamamlandı:** 2026-07-10 — kapsam kullanıcıyla netleşti: fotoğraf
  ekleme (güvenlik öncelikli) + kadro ekleme, zengin editör istenmedi.
  **Backend:** `posts.image_path` migration; `CreatePost` Action görseli
  GD ile gerçekten decode ederek doğruluyor (sahte uzantılı/bozuk dosya
  `422 invalid_image`), her zaman JPEG'e yeniden encode ediyor (EXIF/GPS
  temizliği + payload normalize), rastgele UUID dosya adıyla
  `Storage::disk('public')`a yazıyor. `lineup_id` — kullanıcı sadece kendi
  üyesi olduğu takımın kadrosunu ekleyebiliyor (`Lineup->team->isMember`).
  `PostResource.lineup` artık tam `LineupResource` (positions dahil).
  4 yeni Pest testi.
  **Mobil:** `post/create.tsx`'e `expo-image-picker` ile galeri seçimi
  (önizleme + kaldır) ve seçili takımın kadrolarından seçim eklendi.
  `PostCard`'a yeni `PitchPreview` bileşeni (PitchBoard'ın jestsiz/salt-
  okunur versiyonu — FlatList scroll'uyla çakışmasın diye) ile hem sistem
  "kadro paylaşıldı" hem kullanıcının manuel eklediği kadro aynı görsel
  saha önizlemesinde gösteriliyor (önceki düz isim yazan kart kaldırıldı).
  **Bilinen kısıt:** yerel GD kurulumu HEIC decode edemiyor — bkz.
  04-social-feed.md.
- **Bağlı modül:** Modül 4 — [04-social-feed.md](features/04-social-feed.md)
  (genel kapsamı MVP sonrası tüm uygulamayı etkiliyor)
- **Talep tarihi:** 2026-07-06

### 8. Akışta adam eksik / rakip arayanlar ilanlarının gösterilmesi ✅
- **Tamamlandı:** 2026-07-10 — kullanıcıyla netleşen kapsam: ilanlar feed'de
  yeni bir kart türü olarak görünüyor; ayrıca genel kart kalitesi
  ("kartların görselleri ve işlevleri zayıf") ve performans ("kullanıcı/post
  sayısı arttıkça sorgular optimal çalışmalı") de ele alındı.
  **Backend:** `Post.TYPES`'a `player_listing`/`opponent_listing` eklendi;
  ilan oluşturulunca (`CreatePlayerListing`/`CreateOpponentListing`)
  otomatik bir `Post` da yaratılıyor (mevcut `match_played`/`lineup_shared`
  deseniyle birebir aynı, `auto_posts_enabled`'e bağlı). Performans:
  ayrı UNION sorgusu yok (tek `posts` tablosu, cursor-paginate); yeni
  ilişkiler eager-load ediliyor (N+1 yok); görüntüleyenin başvuru durumu
  sayfa başına **tek batch sorguyla** hesaplanıyor (`PlayerListingController::
  index`'teki mevcut desenle aynı); `applications` ilişkisi feed'de
  bilinçli olarak yüklenmiyor (gereksiz payload). 4 yeni Pest testi (222
  toplam).
  **Mobil:** Keşfet'teki ilan kartı JSX'i `features/match/ListingCards.tsx`'e
  çıkarıldı (kod tekrarı yok, "Başvur"/"Maç yapalım" hem Keşfet hem feed'de
  çalışıyor), mutation mantığı `useListingActions` hook'una taşındı.
  `PostCard` header'ına baş harf rozeti (avatar_path varsa gerçek görsel)
  eklendi — "kartlar zayıf" geri bildirimine kısmi cevap.
- **Bağlı modül:** Modül 3 + Modül 4 — [03-match-organization.md](features/03-match-organization.md),
  [04-social-feed.md](features/04-social-feed.md)
- **Talep tarihi:** 2026-07-06

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

### 4. Bildirimler (push notification) — büyük ölçüde ✅
- **Bağlı modül:** Modül 7 — [07-notifications-chat.md](features/07-notifications-chat.md)
  (zaten ROADMAP'te planlı; bu madde önceliklendirme sorusu)
- **Talep tarihi:** 2026-07-04
- **İstenen tetikleyiciler:** maça birkaç saat kala hatırlatma ✅
  (`notifications:match-reminders`), rakip bulunduğunda ✅ (2026-07-09,
  `OpponentFoundNotification` — `MatchOpponentListing` Action), adam-eksik
  başvurusu geldiğinde/onaylandığında ✅ (`ListingApplicationNotification`/
  `ApplicationDecisionNotification`). **Kalan:** "maç saati tam geldiğinde"
  anlık bir bildirim yok (sadece 3 saat öncesi hatırlatma var) — küçük, ayrı
  bir iş; değeri düşük görülüyorsa atlanabilir.
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

### 19. Boş durumlar (empty states) — uygulama genelinde tutarlı bir tasarım yok ✅
- **Tamamlandı:** 2026-07-10 — denetim madde #20'dekinin tersini gösterdi:
  14 boş-durum noktasının (feed, keşfet x2, sohbetler, takımlar, arama x2,
  maçlar, saha rehberi, takım sohbeti, DM, oyuncu profili, kendi profilim,
  kadro atama sayfası) her birinde zaten bağlamsal Türkçe metin vardı —
  eksik olan görsel tutarlılıktı (düz `<Text>`, ikon yok). Ortak
  `shared/ui/EmptyState.tsx` (ikon + mesaj, `ErrorState`'le aynı görsel
  dil) eklendi, mevcut metinler korunarak hepsine uygulandı. Ters (inverted)
  mesaj listelerinde (`team/[id]/chat.tsx`, `dm/[id].tsx`) zaten var olan
  `scaleY: -1` flip'i korumak için `EmptyState`'e opsiyonel `style` prop'u
  eklendi. CTA butonları (ör. "İlk gönderini paylaş") kapsam dışı bırakıldı
  — mevcut metinler zaten teşvik edici, ayrı bir iş olarak değerlendirilebilir.
- **Bağlı modül:** cross-cutting (Modül 3 keşfet/ilanlar, Modül 4 akış,
  Modül 6 maç geçmişi, Modül 7 sohbet/bildirimler, Modül 8 saha rehberi)
- **Talep tarihi:** 2026-07-10
- Şu ana kadar hiçbir test/backlog turunda gündeme gelmedi — yani bilinçli
  bir tasarım kararı değil, henüz hiç bakılmamış bir alan. Feed, maçlar,
  bildirimler, sohbet listesi (`(tabs)` sohbet sekmesi + `dm/[id].tsx` +
  `team/[id]/chat.tsx`), saha rehberi (`venues/index.tsx`), keşfet/ilanlar
  (`listings/index.tsx`) gibi liste ekranlarında veri boş geldiğinde ne
  gösterildiği tek tek denetlenmedi. Muhtemel risk: bazı ekranlarda sadece
  boş bir `FlatList` alanı kalıyor (kırık/eksik hissi veren bir boşluk),
  kullanıcıya "neden boş, ne yapmalıyım" mesajı verilmiyor.
- **Yapılacaklar:**
  1. Denetim: yukarıdaki ekranların her biri boş veriyle (yeni kayıt olmuş
     kullanıcı, hiç maçı/takımı/yorumu olmayan biri) tek tek test edilip
     bugün ne gösterdiği not edilmeli.
  2. Ortak bir `EmptyState` bileşeni tasarlanmalı (`shared/ui/`) — ikon/
     basit illüstrasyon + kısa başlık + 1 cümlelik açıklama + (varsa)
     bir CTA butonu (ör. "İlk gönderini paylaş", "Bir takıma katıl").
  3. Her ekrana bağlamına uygun metin/CTA ile uygulanmalı — jenerik
     "Kayıt yok" yazısı yerine ekrana özel, teşvik edici bir ton.

### 20. Hata / yeniden deneme durumları — network hatası kullanıcıya nasıl göründüğü denetlenmedi ✅
- **Tamamlandı:** 2026-07-10 — denetim doğruladı: 13 `FlatList`/tekil-veri
  ekranından **hiçbirinde** `isError` kontrolü yoktu. İki somut ek bulgu:
  `player/[id].tsx` hata durumunda `Player.isPending || Player.data == null`
  koşulu yüzünden sonsuza kadar spinner'da kalıyordu; `(tabs)/profile.tsx`
  da benzer şekilde hata anında sessizce eksik/boş görünüyordu. Ortak
  `shared/ui/ErrorState.tsx` (ikon + mesaj + "Tekrar dene" butonu, mevcut
  `Button`/tema token'larıyla) eklendi; feed, maçlar, sohbetler listesi,
  takımlar, bildirimler, saha rehberi, DM, takım sohbeti, oyuncu profili,
  kendi profilim, keşfet (adam eksik + rakip arayan sekmeleri), arama
  (oyuncu + takım sekmeleri), onboarding şehir adımı — toplam 13 ekrana
  uygulandı. Mutasyon hataları (madde 3) zaten `toApiFailure`/inline metin
  deseniyle tutarlıydı, ek iş gerekmedi.
- **Bağlı modül:** cross-cutting
- **Talep tarihi:** 2026-07-10
- TanStack Query zaten `isError`/`refetch` state'i sağlıyor, ama ekranların
  bunu görsel olarak kullanıp kullanmadığı (ya da sessizce boş/yüklenmiyor
  görünümünde kalıp kalmadığı) hiç sistematik denetlenmedi. Prod'da gerçek
  kullanıcılar zayıf/kopuk bağlantıyla karşılaşacak (halı saha genelde
  kapalı alan, sinyal zayıf olabilir) — bu senaryo şu ana kadar test
  edilmedi.
- **Yapılacaklar:**
  1. Denetim: uçak modu/network kesintisiyle feed, maç detayı, sohbet,
     profil gibi ana ekranlar tek tek test edilmeli — hata anında ne
     görünüyor (boş ekran mı, sonsuz spinner mı, sessiz başarısızlık mı).
  2. Ortak bir `ErrorState`/retry bileşeni (`shared/ui/`) — kısa mesaj +
     "Tekrar dene" butonu (`refetch()`'i tetikler).
  3. Mutasyonlarda (gönderi paylaşma, yorum, RSVP vb.) başarısızlık zaten
     çoğu yerde `toApiFailure`/inline hata metniyle gösteriliyor gibi
     görünüyor (bkz. onboarding.tsx `Error_` deseni) — bu desenin tüm
     mutasyonlarda tutarlı uygulandığı da denetlenmeli.

### 21. Yükleme durumları — spinner/skeleton tutarlılığı ✅
- **Tamamlandı (denetim, kod değişikliği gerekmedi):** 2026-07-10 — madde
  #20 denetimi sırasında 13 ekranın tamamı tek tek incelendi: hepsi zaten
  aynı deseni kullanıyor — tam-sayfa yüklemede merkezi
  `<ActivityIndicator color={Palette.lime}/>`, aksiyon butonlarında
  `Button`'ın kendi `loading` prop'u. Sapma bulunmadı; skeleton'a geçiş
  şu an için gerekli görülmedi (liste boyutları küçük, gecikme az).
- **Bağlı modül:** cross-cutting
- **Talep tarihi:** 2026-07-10
- Ekranlar arası yükleme göstergesi için tek bir standart hiç belirlenmedi
  (bazı ekranlar tam-sayfa spinner, bazıları liste + `isPending` gösterge
  kombinasyonu kullanıyor olabilir — sistematik değil, ekran yazılırken
  ad-hoc seçilmiş).
- **Yapılacaklar:** Karar verilmeli — liste ekranlarında iskelet (skeleton)
  kart mı yoksa merkezi spinner mı; aksiyon butonlarında zaten kullanılan
  inline `loading` prop deseni (`Button`) korunur. Karar sonrası tüm ana
  liste ekranlarına (feed, maçlar, saha rehberi, keşfet) tutarlı uygulanır.

### 22. Splash ekranı — animasyonlu olmalı ✅
- **Tamamlandı:** 2026-07-10 — yeni `shared/ui/AnimatedSplash.tsx`: native
  statik splash kapanır kapanmaz aynı marka görseli (`splash-icon.png`,
  BACKLOG'daki ikon işiyle aynı asset) sıçrayarak büyüyüp (spring benzeri
  scale + fade) etrafında genişleyip kaybolan bir floodlight halkasıyla
  belirginleşiyor, sonra tüm ekran solup asıl uygulamayı açığa çıkarıyor.
  `app/_layout.tsx`'teki `Ready` (fontlar+auth hydration) sinyaline bağlı:
  animasyon en az ~500ms gösterildikten sonra `ready` true olunca kapanıyor
  (hızlı cihazlarda erken kesilip boşluk kalmasın diye). Reanimated ile
  (proje zaten `PitchBoard`'ta kullanıyor), ek bağımlılık gerekmedi.
  **Not:** Görsel sonucu cihazda görmedim (build/simülatör erişimim yok) —
  kullanıcı cihazda doğrulayacak.
- **Bağlı modül:** cross-cutting (app shell)
- **Talep tarihi:** 2026-07-10
- Şu an splash statik bir görsel (`splash-icon.png` + düz arka plan).
  Kullanıcı animasyonlu bir splash istiyor, tasarım/yaratıcılık serbest
  bırakıldı ("yaratıcılık sana kalmış").
- **Not:** Expo'nun native splash mekanizması (`expo-splash-screen`) tek bir
  statik görseli gösterip JS hazır olunca kapatır — gerçek animasyon için
  native splash minimal tutulup `SplashScreen.preventAutoHideAsync()` ile
  JS tarafında özel bir animasyonlu bileşen (Reanimated) gösterilip
  ardından `hideAsync()` çağrılması gerekiyor.

### 23. Gol videosu yükleme — kullanıcı kendi videosunu yükleyebilmeli
- **Bağlı modül:** Modül 5 — [05-videos.md](features/05-videos.md) (v1
  spec'i bunu açıkça v2'ye ertelemişti: "R2 + HLS")
- **Talep tarihi:** 2026-07-10
- Kullanıcı: "çok uzun olmayacak şekilde, sistemimizi de yormamalı, UI/UX
  bozulmamalı." Tam HLS transcoding pipeline'ı olmadan, süre/boyut limitli
  (ör. 60-90 sn, düşük çözünürlük sınırı) doğrudan dosya yükleme + mevcut
  fotoğraf güvenliği desenine benzer doğrulama (gerçek video içeriği
  kontrolü, güvenli depolama) ile ele alınmalı. Yükleme sırasında UI'ı
  kilitlememesi için arka planda ilerleme göstergesiyle yüklenmeli.

### 24. Gönderi fotoğrafı — kameradan çekme seçeneği eksik ✅
- **Tamamlandı:** 2026-07-10 — "Fotoğraf ekle" butonu artık galeri/kamera
  seçimi sunan bir aksiyon açıyor (`ImagePicker.launchCameraAsync` +
  kamera izni kontrolü, izin yoksa net bir uyarı). Kamera izin metni
  zaten BACKLOG #7'de `app.json`'a eklenmişti.
- **Bağlı modül:** Modül 4 — [04-social-feed.md](features/04-social-feed.md)
  (BACKLOG #7'nin devamı)
- **Talep tarihi:** 2026-07-10

### 25. Kadro silme yok ✅
- **Tamamlandı:** 2026-07-10 — `DELETE /lineups/{id}` eklendi (mevcut
  `manageLineups` policy'siyle aynı yetki: herhangi bir takım üyesi
  silebilir, kadro oluşturma/düzenlemeyle tutarlı). Mobilde kadro satırına
  uzun basınca ("Kadroyu sil") aksiyonu eklendi. 2 yeni Pest testi.
- **Bağlı modül:** Modül 2 — [02-team-lineup.md](features/02-team-lineup.md)
- **Talep tarihi:** 2026-07-10

### 26. Takım sohbeti — fotoğraf (galeri+kamera) ve ses kaydı eklenebilmeli
- **Bağlı modül:** Modül 7 — [07-notifications-chat.md](features/07-notifications-chat.md)
- **Talep tarihi:** 2026-07-10
- Şu an takım sohbeti (`team/[id]/chat.tsx`) sadece metin destekliyor.
  Kullanıcı en azından fotoğraf ekleme (galeri + kamera) ve ses kaydı
  eklenmesini istiyor. Fotoğraf güvenliği BACKLOG #7'deki desenle aynı
  olmalı (gerçek içerik doğrulama, EXIF temizliği). Ses kaydı için
  kayıt (expo-av/expo-audio) + yükleme + sohbet balonunda oynatma
  gerekiyor. DM sohbetine de aynı ihtiyaç genişletilebilir (kullanıcı
  sadece takım sohbetini belirtti, kapsam netleşirken DM de değerlendirilir).

### 27. Profil fotoğrafı yükleme + profil düzenleme eksik (doğum tarihi vb.) ✅
- **Tamamlandı:** 2026-07-11 — `player_profiles.birth_date` (nullable date,
  `before:today` validasyonu) eklendi; `PATCH /me` artık `avatar` dosyası
  kabul ediyor (`ImageUploader::store(..., 'avatars')`, aynı güvenlik
  deseni: gerçek görsel doğrulama + JPEG re-encode + EXIF/GPS temizleme).
  Groundwork olarak `avatar_path` alanının API genelinde **hiçbir zaman**
  tam URL'e çözülmediği fark edildi (8 farklı Resource dosyası) — hepsi
  `ImageUploader::url()` ile düzeltildi (`CommentResource`,
  `ListingApplicationResource`, `VenueReviewResource`, `MessageResource`
  [`avatar_path` + kullanılmayan `image_path`], `TeamMemberResource`,
  `UserResource`, `PlayerPublicResource`, `PostResource`). Mobilde yeni
  `profile-edit.tsx` ekranı: avatar (kamera/galeri + `ensureJpeg`), isim,
  mevki(ler), seviye, şehir (arama modalı), ilçe, hakkında, doğum tarihi
  (GG/AA/YYYY üç ayrı alan — native date picker bağımlılığı eklemeden).
  `(tabs)/profile.tsx`'e avatar gösterimi ve düzenle butonu eklendi.
  4 yeni Pest testi (237 toplam), Pint/Larastan temiz.
- **Bağlı modül:** Modül 1 — [01-auth-profile.md](features/01-auth-profile.md)
- **Talep tarihi:** 2026-07-10

### 28. Profilde takip ettiklerim/takipçilerim listesi görünmüyor (sadece sayı) ✅
- **Tamamlandı:** 2026-07-11 — `GET /players/{id}/followers` ve
  `/following` eklendi (mevcut `PlayerPublicResource` yeniden kullanıldı;
  N+1 önleme: `withCount(['followers','following'])` + `profile.city`
  eager-load; engellenen kullanıcı için 404, `posts` endpoint'iyle aynı
  desen). Mobilde yeni `connections/[id].tsx` — takipçiler/takip
  edilenler sekmeli tek ekran; hem kendi profildeki hem herkese açık
  profildeki takipçi/takip sayı bloklarına dokununca açılıyor. 3 yeni
  Pest testi (233 toplam).
- **Bağlı modül:** Modül 4 — [04-social-feed.md](features/04-social-feed.md)
- **Talep tarihi:** 2026-07-10

### 29. Ayarlar ekranı yok
- **Bağlı modül:** cross-cutting (Modül 1 profil + genel)
- **Talep tarihi:** 2026-07-10
- Profil sayfasının sağ üstüne bir ayarlar ikonu konup ayrı bir Ayarlar
  ekranı açılmalı: yasal metinler (PRODUCTION-READINESS.md madde G'ye
  bağlı), bildirim tercihleri (mevcut `/notifications/preferences`'a link),
  hesap silme (şu an profile.tsx'te doğrudan duruyor, buraya taşınmalı),
  çıkış yap. Şu an bu aksiyonlar dağınık şekilde profil ekranının içinde.

### 30. Takım kurarken özel renk seçimi + arma fotoğrafı yükleme ✅
- **Tamamlandı:** 2026-07-10 — **Backend:** `teams.logo_path` (nullable);
  `badge_icon` artık nullable/opsiyonel (logo varsa gerekmiyor,
  `withValidator` ile en az birinin zorunlu olduğu doğrulanıyor). Görsel
  güvenliği BACKLOG #7'deki aynı hat — bu vesileyle GD decode/reencode/
  rastgele-dosya-adı mantığı `App\Support\ImageUploader`'a çıkarıldı
  (`CreatePost` de buna refactor edildi, kod tekrarı yok — ilerideki
  avatar/sohbet fotoğrafı işleri de bunu kullanacak). `color_home` zaten
  herhangi bir hex kabul ediyordu (regex validasyonu), eksik olan mobil
  UI'daki seçenek genişliğiydi. 5 yeni Pest testi (230 toplam).
  **Mobil:** `team/create.tsx`'in arma adımına "Galeriden arma fotoğrafı
  seç" seçeneği (ikonla karşılıklı dışlayıcı); renk adımına "Önerilen" (8)
  + "Paletten seç" (HSL formülüyle üretilen 24 renk) bölümleri eklendi.
  Takım listesi + takım detay sayfası artık `logo_url` varsa gerçek görseli
  gösteriyor (diğer küçük/ikincil yüzeyler — arama, sohbet listesi,
  PostCard'daki küçük takım etiketi — kapsam dışı bırakıldı, hâlâ ikon
  gösteriyor, ayrı bir iş olarak ele alınabilir).
- **Bağlı modül:** Modül 2 — [02-team-lineup.md](features/02-team-lineup.md)
- **Talep tarihi:** 2026-07-10

### 31. Takım silme yok ✅
- **Tamamlandı:** 2026-07-10 — `DELETE /teams/{id}` eklendi (yeni
  `TeamPolicy::delete`, sadece kaptan). Tüm ilişkiler (üyeler, kadrolar,
  davetler, maçlar, rakip ilanları) zaten `cascadeOnDelete` ile
  tanımlıydı, ek migration gerekmedi; postlardaki `team_id` sadece
  null'lanıyor (gönderiler silinmiyor). Mobilde kaptan için "Takımdan
  ayrıl" butonunun yerini net bir onay metniyle "Takımı sil" alıyor.
  2 yeni Pest testi.
- **Bağlı modül:** Modül 2 — [02-team-lineup.md](features/02-team-lineup.md)
- **Talep tarihi:** 2026-07-10

### 32. Kadroyu takım sohbetinde paylaşma
- **Bağlı modül:** Modül 2 + Modül 7 — [02-team-lineup.md](features/02-team-lineup.md),
  [07-notifications-chat.md](features/07-notifications-chat.md)
- **Talep tarihi:** 2026-07-10
- Kullanıcı bir kadroyu doğrudan takım sohbetine paylaşabilmek istiyor
  (şu an sadece WhatsApp'a PNG export ve feed'e otomatik/manuel post var —
  bkz. BACKLOG #7). Muhtemelen sohbet mesajlarına da (feed post'larındaki
  gibi) bir `lineup_id` referansı eklenip mesaj balonunda `PitchPreview`
  ile gösterilmesi gerekecek — kapsam netleşmeden kodlanmayacak.

### 33. Adam eksik / rakip arıyor ilanları için paylaşılabilir link
- **Bağlı modül:** Modül 3 — [03-match-organization.md](features/03-match-organization.md)
- **Talep tarihi:** 2026-07-10
- Kullanıcı, takım davet linkine benzer şekilde, bir ilan (player/opponent
  listing) için kopyalanabilir bir link istiyor — takım sohbetinden,
  WhatsApp'tan ya da başka bir mecradan paylaşılabilsin. Muhtemelen
  mevcut `team_invites`teki `code`+deep-link (`Linking.createURL`) deseni
  ilana da uygulanır (`listings/{id}` ya da `opponent-listings/{id}` için
  bir deep-link + kopyala butonu) — kapsam/hedef ekran (linke tıklayınca
  nereye düşecek, giriş yapmamış kullanıcı ne görecek) netleşmeden
  kodlanmayacak.

### 34. Bug: kameradan çekilen fotoğraf feed gönderisine eklenirken "Doğrulama hatası" ✅
- **Tamamlandı:** 2026-07-11 — kök neden #35 ile aynı çıktı: iOS kamera/
  galeri çıktısı gerçek HEIC baytı, GD decode edemiyor. Bkz. #35'teki
  çözüm.
- **Bağlı modül:** Modül 4 — [04-social-feed.md](features/04-social-feed.md)
  (BACKLOG #7/#24'ün devamı)
- **Talep tarihi:** 2026-07-10

### 35. Bug: takım arması yüklerken "Desteklenmeyen ya da bozuk görsel dosyası" ✅
- **Tamamlandı:** 2026-07-11 — kalıcı çözüm: `expo-image-manipulator`
  kuruldu, yeni `shared/media/ensureJpeg.ts` yardımcı fonksiyonu seçilen/
  çekilen her görseli yüklemeden önce gerçek JPEG'e yeniden encode ediyor.
  `post/create.tsx` (galeri+kamera) ve `team/create.tsx` (arma) bu
  fonksiyonu kullanacak şekilde güncellendi, dönüşüm sırasında kısa bir
  "İşleniyor..." göstergesi eklendi. **Not:** `expo-image-manipulator`
  yeni bir native modül — bu değişiklik için yeni bir EAS development
  build gerekiyor.
- **Bağlı modül:** Modül 2 — [02-team-lineup.md](features/02-team-lineup.md)
  (BACKLOG #30'un devamı)
- **Talep tarihi:** 2026-07-10

### 36. Takım rengi — "Paletten seç" 24 sabit seçenek yerine gerçek bir renk seçici olmalı ✅
- **Tamamlandı:** 2026-07-11 — 24 sabit renk swatch'ı kaldırıldı, yerine
  yeni `shared/ui/HueColorPicker.tsx` geldi: sürüklenebilir bir ton (hue)
  şeridi, tam renk yelpazesinden herhangi bir tonu sürekli olarak seçmeye
  izin veriyor (sabit S/L, 0-360° hue serbest). `react-native-svg` gibi
  ek bir native bağımlılık gerektirmeden (gradyan çok sayıda ince View
  segmentiyle simüle edildi) — mevcut build'de çalışır, yeni rebuild
  gerekmez. "Önerilen" 8 renk bölümü korundu.
- **Bağlı modül:** Modül 2 — [02-team-lineup.md](features/02-team-lineup.md)
  (BACKLOG #30'un düzeltmesi)
- **Talep tarihi:** 2026-07-10

## Triyaj Kuralı
Yeni bir istek geldiğinde önce buraya madde olarak eklenir (kod yazılmaz).
Kullanıcı hangisinin öncelikli olduğunu belirtince, o madde ilgili modülün
spec dosyasına taşınır ve implementasyona oradan başlanır.
