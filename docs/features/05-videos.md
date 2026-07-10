# Modül 5 — Maç Videoları

> Durum: **v1 + v1.5 + v2-lite uygulandı** (v1: 2026-07-06, v2-lite: 2026-07-11) ·
> v3 bekliyor · gerçek R2/ffmpeg pipeline'ı hâlâ açık (bkz. v2 bölümü) ·
> MVP sonrası · Bağımlılık: Modül 3, 4
> Araştırma: [../research/sosyalhalisaha.md](../research/sosyalhalisaha.md)

## Amaç
Maç videolarını Sahana'da toplamak. v1'de birleştirici (aggregator),
v2'de kendi yükleme altyapımız, uzun vadede kendi highlight sistemimiz.

## v1 — Harici Link (embed) ✅
- Video, bir **maça** bağlanır (`POST /matches/{id}/videos {url}`) — genel
  gönderiye serbest video ekleme v1 kapsamı dışında bırakıldı (basitlik;
  `match_played`/`lineup_shared` ile aynı otomatik-kart deseni).
- **Yetki:** sadece o maça katılan oyuncular video ekleyebilir
  (`MatchPolicy::addVideo`); ekleyen ya da takımın kaptanı silebilir
  (`VideoPolicy::delete`).
- Video eklenince otomatik `video_shared` feed kartı oluşur (ekleyenin
  `auto_posts_enabled` ayarına bağlı — Modül 4 deseniyle aynı).
- Backend job (`FetchVideoMetadata`, queue): YouTube için resmi oEmbed
  uç noktası, diğerleri için genel OG meta etiketi taraması (başlık +
  thumbnail); asenkron, kuyruğa düşer.
- Feed'de thumbnail kart → dokununca `expo-web-browser` in-app tarayıcı.
- `thumbnail_url` boşsa (oEmbed/OG metadata çekilemedi) sabit bir
  varsayılan kapak görseli gösterilir (`assets/images/video-default-cover.png`
  — kullanıcı kararı 2026-07-07, BACKLOG.md #9).
- `provider` alanı: `youtube | sosyalhalisaha | other` (host'a göre otomatik
  sınıflandırılır, `VideoProviderDetector`) — ileride resmi entegrasyona
  sancısız geçiş için.

**Yapılmayacak:** sosyalhalisaha içeriğini scrape edip kendi bünyemizde
oynatmak (telif + KVKK + kırılganlık — research dokümanındaki karar).

## v1.5 — "Videonu Bul" Deep-Link Yönlendirmesi (2026-07-06 karar)

Kullanıcının videosunu sosyalhalisaha'da bulmasını kolaylaştıran, ama
**otomatik çekme/gösterme içermeyen** bir kısayol. Detaylı gerekçe:
`docs/research/sosyalhalisaha.md` §3.1.

- **Yeni referans tablo `sosyalhalisaha_venues`:** `id, il_id (cities.id ile
  aynı), ilce_id, ilce_name, saha_id, saha_name`. Video içeriği değil, sadece
  isim/ID eşlemesi — tek seferlik/az sıklıkla elle güncellenen statik veri
  (seed migration). Kapsam: başlangıçta bilinen birkaç şehir/saha, ihtiyaca
  göre genişler.
- **Maç kurma akışına opsiyonel adım:** "Bu saha sosyalhalisaha'da kayıtlı mı?"
  — ilçe → saha autocomplete (yukarıdaki referans tablodan). Seçilirse
  `matches.sosyalhalisaha_venue_id` (nullable FK) set edilir. Seçilmezse akış
  hiç görünmez.
- **Maç ekranında "Videonu bul" butonu:** yalnızca `sosyalhalisaha_venue_id`
  doluysa ve maç `played` ise görünür. Basınca:
  `https://sosyalhalisaha.com/xhr/filtre/{il_id}_{ilce_id}_{saha_id}_{tarih:YYYY-MM-DD}_{saat:HH:mm}_`
  URL'i **sadece harici tarayıcıda açılır** (`Linking.openURL`). Backend bu
  endpoint'i hiçbir zaman çağırmaz, sonuç parse etmez, önbelleklemez.
- Kullanıcı orada kendi videosunu bulursa linkini kopyalar, Sahana'ya döner ve
  yukarıdaki v1 "harici link ekle" akışıyla (`POST /matches/{id}/videos`) maça
  ekler — geri kalan her şey (thumbnail, feed kartı) v1 ile aynı.
- Bu adım tamamen opsiyonel ve kullanıcı inisiyatifli; otomatik/arka planda
  video varlığı kontrolü **yapılmayacak**.

## v2 — Kullanıcı Yüklemesi ✅ (2026-07-11, "lite" kapsam — BACKLOG #23)

Kullanıcı açık talimat verdi: "çok uzun olmayacak şekilde, sistemimizi de
yormamalı, UI/UX bozulmamalı." Bu nedenle aşağıdaki tam v2 vizyonu
**bilinçli olarak küçültüldü** — R2/presigned URL/ffmpeg transcode/HLS
pipeline'ı hâlâ yok (Açık Sorular'daki ffmpeg worker kararı bekliyor).

- **Gerçekte uygulanan:** `POST /matches/{id}/videos`, `url` yerine
  multipart `video` dosyası alır (`type: uploaded`, `videos.storage_path`
  zaten v1 migration'ında öngörülmüştü). Doğrudan `Storage::disk('public')`
  üzerine kaydedilir — transcode/HLS yok, tek dosya sunucudan doğrudan
  servis edilir.
- **Limitler:** max 60MB dosya boyutu, max 90 saniye (client `duration_seconds`
  ile bildirir, sunucu tarafında yumuşak doğrulama — sunucunun asıl
  koruması dosya boyutu sınırı; ffprobe/ffmpeg kurulu olmadığından gerçek
  süre server-side doğrulanamıyor, bu bilinçli bir sınırlama).
  `mimes:mp4,mov,m4v` + `mimetypes:video/mp4,video/quicktime,video/x-m4v`
  ile "gerçek içerik" kontrolü (görsellerdeki GD decode kadar derin değil,
  ama BACKLOG #7 deseniyle aynı seviyede orantılı bir doğrulama).
- **Mobil:** `match/[id]/index.tsx`'teki "Video ekle" artık bir seçim
  sunuyor: "Cihazdan yükle" (galeriden video seç, 90 sn üstü client-side
  reddedilir, `axios` `onUploadProgress` ile yükleme yüzdesi gösterilir —
  UI kilitlenmiyor) veya "Link yapıştır" (mevcut v1 akışı, değişmedi).
  Video satırına dokununca hem harici link hem yüklenen video aynı
  `expo-web-browser` `openBrowserAsync` ile açılıyor (yeni bir video
  player native bağımlılığı — `expo-video` — eklenmedi; bu oturumda zaten
  iki yeni native modül (`expo-image-manipulator`, `expo-audio`) eklendiği
  için üçüncüsünü eklememek bilinçli bir tercih).
- Silme (`DELETE /videos/{id}`) artık depodaki dosyayı da temizliyor
  (önceden sadece DB kaydı siliniyordu — v1'de link'ler için bu bir sorun
  değildi, upload ile birlikte gerekli oldu).
- **Yapılmadı (asıl v2 vizyonu, hâlâ açık):** presigned URL → R2, ffmpeg
  transcode/HLS, 3 dk/500 MB limiti. Aşağıdaki orijinal not olduğu gibi
  kalıyor, gelecekte gerçek altyapı kurulunca bu "lite" sürüm yerini alır.

### Orijinal v2 vizyonu (henüz kurulmadı)
- Akış: presigned URL → doğrudan R2'ye upload → transcode job (ffmpeg,
  720p/1080p HLS) → hazır olunca push
- Limitler (ilk öneri): max 3 dk / 500 MB; maça bağlı olma şartı
  (rastgele video platformu değiliz — depolama maliyet kontrolü)
- Videodaki üçüncü kişiler: yükleyen, izni olduğunu beyan eder (ToS maddesi)

## v3+ — Vizyon (not)
- Saha iş birliğiyle sabit kamera + otomatik kayıt (sosyalhalisaha modeli,
  ama sosyal ağa gömülü)
- Otomatik highlight kesme (gol anı tespiti) — ML araştırma konusu

## API
`POST /matches/{id}/videos` — `{url}` (harici link, v1) **veya** multipart
`{video: file, duration_seconds?}` (kullanıcı yüklemesi, v2-lite) ·
`GET /matches/{id}/videos` · `DELETE /videos/{id}` (yüklenen dosyayı da siler)

## Kabul Kriterleri (v1)
- [x] Maça katılan bir oyuncu video linki ekleyebiliyor; katılmayan biri ekleyemiyor (403)
- [x] Geçersiz URL 422 ile reddediliyor
- [x] YouTube linki için başlık/thumbnail oEmbed'den otomatik çekiliyor
- [x] sosyalhalisaha/diğer linkler otomatik çekilmiyor/parse edilmiyor (job sadece OG meta okur, sonucu re-host etmez)
- [x] Video eklenince takım/takipçi feed'inde `video_shared` kartı görünüyor
- [x] Ekleyen ya da takım kaptanı videoyu silebiliyor; başka katılımcı silemiyor (403)

## Kabul Kriterleri (v2-lite)
- [x] Maça katılan bir oyuncu cihazından video yükleyebiliyor; katılmayan biri yükleyemiyor (403)
- [x] 60MB üstü ya da mp4/mov/m4v dışı dosya 422 ile reddediliyor
- [x] Yüklenen video da `video_shared` feed kartı oluşturuyor (link ile aynı davranış)
- [x] Video silinince hem DB kaydı hem depodaki dosya temizleniyor
- [x] Yükleme sırasında UI kilitlenmiyor (ilerleme yüzdesi gösteriliyor)

## Açık Sorular
- [ ] v2 transcode: VPS'te ffmpeg worker mı, Cloudflare Stream mi? (maliyet analizi)
- [ ] Video izlenme sayacı Modül 6 istatistiklerine girsin mi?
- [ ] `sosyalhalisaha_venues` referans verisi ilk seferde nasıl toplanacak
  (elle mi, kullanıcıların "bu saha eksik" bildirimiyle mi büyüyecek)?
