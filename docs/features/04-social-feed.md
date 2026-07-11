# Modül 4 — Sosyal Katman (Feed)

> Durum: **Tamamlandı** (2026-07-06) · MVP sonrası · Bağımlılık: Modül 1-3

## Amaç
Uygulamayı "araçtan" "her gün açılan yere" dönüştürmek: maç aktiviteleri,
kadro paylaşımları ve gönderilerden oluşan akış + takip mekanizması.

## Kapsam (v1)
- Feed: takip ettiklerim + takımlarımın aktiviteleri (kronolojik; algoritma yok)
- İçerik türleri: **metin gönderisi** (opsiyonel **fotoğraf** + opsiyonel
  **kadro ekleme** ile — kullanıcı kararı 2026-07-10, BACKLOG.md #7), **maç
  oynandı** auto-kartı, **kadro paylaşıldı** auto-kartı, **adam eksik**
  auto-kartı, **rakip arıyoruz** auto-kartı (kullanıcı kararı 2026-07-10,
  BACKLOG.md #8 — bkz. aşağıdaki bölüm)
- Takip et / takipçi modeli (onaysız, herkese açık profil varsayımı — Modül 1'in
  `GET /players/{id}` zaten herkese açık)
- Beğeni + yorum
- Keşfet: oyuncu/takım arama (isimden basit LIKE araması, v1'de Scout/ES yok)
- Moderasyon: şikayet (report) + engelleme (block) — **zorunlu**, ertelenemez
- Çekerek yenileme (pull-to-refresh) — kullanıcı kararı 2026-07-06, BACKLOG.md #6
- `GET /me`'ye `followers_count`/`following_count` eklendi; (tabs)/profile
  ekranında kendi takipçi/takip sayıları ve kendi gönderi listesi
  görünüyor (`player/[id].tsx`'teki herkese açık profille aynı desen) —
  kullanıcı kararı 2026-07-06, BACKLOG.md #5
- `GET /players/{id}/followers` ve `/following` — sayının arkasındaki
  gerçek liste (kullanıcı kararı 2026-07-11, BACKLOG.md #28, ilk
  uygulamada sadece sayı görünüyordu). `mobile/connections/[id].tsx`
  (takipçiler/takip edilenler sekmeli tek ekran), hem kendi profilden hem
  herkese açık profilden erişilebilir. Engellenen kullanıcı için 404
  (mevcut `posts` endpoint'iyle aynı gizlilik deseni).

### Kapsam dışı (v1)
- Algoritmik sıralama · hikayeler · DM (Modül 7'de takım sohbeti önce)
- **Video gönderisi:** Modül 5 henüz yok; özel bir `video` post tipi
  tanımlanmadı. Kullanıcı isterse metin gönderisine link yapıştırabilir
  (özel önizleme/embed yok, Modül 5'i bekliyor).
- **Maç sonucu kartı (skorlu):** Modül 6 (istatistik) henüz yok, skor verisi
  mevcut değil. Onun yerine sade **"maç oynandı"** kartı (takımlar, saha,
  tarih) — skor eklenmesi Modül 6'nın kancası.
- Şehir bazlı "yakınımda" sekmesi — v1'de yok, MVP-sonrası backlog'a not
  düşüldü (kullanıcı kararı 2026-07-04: öncelik değil).

## Otomatik içerik (soğuk başlangıç çözümü)
Feed'i kullanıcı üretimi beklemeden dolduran sistem olayları:
- Maç `matches:sweep` ile `played` olunca → takım takipçilerinin feed'ine
  "maç oynandı" kartı otomatik düşer (skor yok, Modül 6'da eklenecek).
- Kadro tahtası oluşturulunca → aynı takımın üyelerine otomatik "kadro
  paylaşıldı" kartı düşer (WhatsApp'a export ayrı, bu sadece feed içi).
- **Kural:** otomatik kartlar profil ayarından kapatılabilir olmalı
  (`auto_posts_enabled` — Modül 1 `PlayerProfile`'a eklenir).

## Gönderiye fotoğraf + kadro ekleme (kullanıcı kararı 2026-07-10, BACKLOG.md #7)
- **Kapsam:** post/create ekranında opsiyonel **tek fotoğraf** ve/veya
  opsiyonel **kendi takımının kayıtlı kadrolarından biri** eklenebilir.
  Zengin bir editöre gerek yok — sadece metin + tek fotoğraf + tek kadro.
  Fotoğraf hem galeriden seçilebilir hem kamerayla çekilebilir (kullanıcı
  kararı 2026-07-10, BACKLOG.md #24 — ilk uygulamada sadece galeri vardı).
- **Video (BACKLOG #37, 2026-07-11):** fotoğrafa alternatif olarak tek
  **video** da eklenebilir (aynı gönderide ikisi birden olmaz —
  `prohibits:image`). Maç videosuyla (Modül 5 v2-lite) aynı sınırlar:
  galeriden seçim, iOS'ta 720p H.264 re-encode + 90 sn kırpma, sunucuda
  mp4/mov/m4v + max 100MB, `posts.video_path`'e ham kayıt. Akışta
  `expo-video` (`PostVideoPlayer`) ile native kontrollü, otomatik
  oynatmayan gömülü oynatıcı. Yükleme yüzde göstergeli, UI kilitlenmez.
- **Fotoğraf güvenliği (kullanıcı: "güvenlik çok önemli"):**
  - İzin verilen tür/limit api-conventions.md ile aynı: jpg/png/webp/heic,
    max 10 MB.
  - Sunucu tarafında sadece MIME/uzantıya güvenilmez: dosya GD ile
    (`imagecreatefromstring`) gerçekten decode edilmeye çalışılır; başarısız
    olursa (bozuk dosya ya da sahte uzantılı zararlı dosya) `422
    invalid_image` döner.
  - Decode başarılıysa görsel **her zaman JPEG'e yeniden encode edilir**
    (kalite 85) — bu hem EXIF metadata'sını (ör. GPS konumu) tamamen siler
    hem de dosyanın payload'ını normalize eder. Orijinal bayt dizisi asla
    diske yazılmaz.
  - Dosya adı kullanıcıdan gelmez, rastgele UUID ile üretilir (path
    traversal / üzerine yazma riski yok); `storage/app/public/posts/`
    altında (`Storage::disk('public')`).
  - **Düzeltme (kullanıcı 2026-07-11, BACKLOG.md #34/#35):** İlk uygulamada
    "iOS otomatik JPEG'e çeviriyor" varsayımı yanlış çıktı — hem kamera
    çekimi hem galeriden seçilen orijinal fotoğraflar gerçekten HEIC
    baytı olarak geliyordu, GD bunu decode edemediğinden kullanıcı hem
    feed fotoğrafında ("Doğrulama hatası" — `mimes` kuralı reddediyordu)
    hem takım arması yüklerken ("bozuk görsel dosyası" — `ImageUploader`
    reddediyordu) hata alıyordu. Kalıcı çözüm: istemci artık
    `expo-image-manipulator` (`shared/media/ensureJpeg.ts`) ile seçilen/
    çekilen her görseli yüklemeden **önce** gerçek JPEG'e yeniden encode
    ediyor — sunucuya hiçbir zaman ham HEIC bayt dizisi ulaşmıyor. GD'nin
    HEIC decode edememesi hâlâ doğru ama artık pratikte tetiklenmiyor.
    **Not:** `expo-image-manipulator` yeni bir native modül — bu
    değişiklik için yeni bir EAS development build gerekir.
- **Kadro ekleme:** `posts.lineup_id` zaten mevcuttu (sistem otomatik "kadro
  paylaşıldı" kartı için) — sadece kullanıcının kendi paylaşımına manuel
  seçmesi açıldı. Yalnızca kendi üyesi olduğu bir takımın kadrosu
  seçilebilir (`Team::isMember` kontrolü, aksi halde 403).
- **Görünüm (düzeltme, kullanıcı 2026-07-10):** ilk uygulamada saha
  önizlemesi (`PitchPreview`) feed listesinde de gösteriliyordu — kullanıcı
  bunun listede fazla/dikkat dağıtıcı olduğunu, sadece gönderinin **detay**
  sayfasında görünmesi gerektiğini belirtti. `PostCard`'a `detailed` prop'u
  eklendi: feed/profil/oyuncu-profili gibi liste bağlamlarında (`detailed`
  yok/false) kadro için sade "📋 {isim}" metin kartı gösterilir; `post/[id].tsx`
  (gönderi detayı) `detailed` ile görsel saha önizlemesini gösterir. Bu
  vesileyle `post/[id].tsx`'in `PostCard`'dan bağımsız, güncel olmayan bir
  kopya kart render'ı olduğu fark edildi (fotoğraf/ilan kartları hiç
  görünmüyordu) — artık `PostCard`'ı doğrudan kullanıyor, kopya kod yok.

## Feed'de adam eksik / rakip arıyoruz kartları (kullanıcı kararı 2026-07-10, BACKLOG.md #8)
- **Kapsam:** bir kaptan "adam eksik" ya da "rakip arıyoruz" ilanı açtığında
  (Modül 3), mevcut `match_played`/`lineup_shared` sistem-kartı deseniyle
  birebir aynı şekilde otomatik bir feed kartı da düşer (`Post.TYPES`'a
  `player_listing`/`opponent_listing` eklendi, `auto_posts_enabled`
  kapalıysa atlanır). Kart, ilanın **canlı** durumunu gösterir (ilişki her
  istekte taze çekilir) — ilan dolunca/eşleşince feed'deki kart da otomatik
  günceller, ayrıca bir senkronizasyon gerekmez.
- **Kod tekrarı yok:** Keşfet (`listings/index.tsx`) ekranındaki ilan
  kartlarının JSX'i `features/match/ListingCards.tsx`'e ("Başvur"/"Maç
  yapalım" butonları dahil) çıkarıldı; hem Keşfet hem feed aynı bileşeni
  kullanıyor. Mutation mantığı da `useListingActions` hook'una taşındı.
- **Performans (kullanıcı: "sorgular en optimal şekilde çalışmalı"):**
  - Yeni FK'ler (`player_listing_id`/`opponent_listing_id`) mevcut
    `match_id`/`lineup_id` deseniyle aynı — ayrı bir UNION sorgusu yok, feed
    hâlâ tek bir `posts` tablosu üzerinden cursor-paginate ediliyor.
  - `BuildFeed`/`PlayerController::posts()` ilgili ilişkileri (`playerListing.
    match.team`, `opponentListing.team`) eager-load ediyor — N+1 yok.
  - Görüntüleyenin kendi başvuru durumu (`my_application_status`)
    sayfadaki tüm `player_listing` post'ları için **tek bir batch sorguyla**
    hesaplanıyor (`PlayerListingController::index`'teki mevcut desenle
    aynı) — post başına ayrı sorgu yok.
  - `applications` ilişkisi feed/profil bağlamında **bilinçli olarak eager-
    load edilmiyor** (sadece captain'ın ilan detay sayfasında gerekli) —
    gereksiz payload/sorgu ağırlığı taşınmıyor.
- **"Kartlar zayıf" geri bildirimi (kullanıcı, 2026-07-10):** `PostCard`
  header'ına baş harf rozeti (avatar_path varsa gerçek görsel, yoksa isim
  baş harfleri) eklendi — Modül 1'de avatar yükleme henüz kurulmadığından
  (`avatar_path` bugün her zaman null) şimdilik hep rozet görünüyor, avatar
  yüklemesi gelince otomatik gerçek fotoğrafa geçer.

## Takım adına paylaşım (kullanıcı kararı 2026-07-04)
**Herhangi bir takım üyesi**, gönderiyi o takıma etiketleyerek paylaşabilir
(sadece kaptan değil) — `posts.team_id` doldurulur, `posts.user_id` gönderiyi
atan kişidir. Takım etiketleme opsiyoneldir.

## Ekranlar
```
(tabs)/feed          → akış (yeni ilk sekme — "her gün açılan yer")
post/create          → metin gönderisi oluştur (+ opsiyonel takım etiketi)
post/[id]             → gönderi detay + yorumlar
player/[id]           → oyuncu herkese açık profili (Modül 1'de tanımlı,
                        şimdi inşa ediliyor) — takip et/bırak, engelle, şikayet
search/               → oyuncu/takım arama
```

## API

| Method | Endpoint | Açıklama |
|---|---|---|
| GET | /feed | Takip + takım akışı (cursor) |
| POST | /posts | Metin gönderisi oluştur (multipart: `body`, `team_id?`, `image?`, `lineup_id?`) |
| GET | /posts/{id} | Gönderi detay |
| DELETE | /posts/{id} | Sahibi veya (takım gönderisiyse) kaptan silebilir |
| POST | /posts/{id}/like · DELETE /posts/{id}/like | Beğen/geri al (idempotent) |
| GET | /posts/{id}/comments | Yorumlar (cursor) |
| POST | /posts/{id}/comments | Yorum ekle |
| DELETE | /comments/{id} | Sahibi silebilir |
| POST | /players/{id}/follow · DELETE /players/{id}/follow | Takip et/bırak |
| POST | /players/{id}/block · DELETE /players/{id}/block | Engelle/kaldır |
| POST | /reports | Şikayet (`subject_type: post\|comment\|user`, `subject_id`, `reason`) |
| GET | /search?q=&type=player\|team | Basit isim araması |
| GET | /players/{id}/followers | Takipçi listesi (BACKLOG.md #28) |
| GET | /players/{id}/following | Takip edilenler listesi (BACKLOG.md #28) |

## Veri Modeli
`posts` (id, public_id, user_id, team_id?, type: text|match_played|lineup_shared|
video_shared|player_listing|opponent_listing, body?, image_path? [JPEG'e yeniden
encode edilmiş, EXIF'siz], match_id?, lineup_id?, video_id?, player_listing_id?,
opponent_listing_id? — genel polimorfik yerine doğrudan FK, api-conventions.md
§8 kararıyla tutarlı, created_at) ·
`likes` (post_id, user_id) · `comments` (id, public_id, post_id, user_id, body,
created_at) · `follows` (follower_id, followed_id) · `blocks` (user_id,
blocked_user_id) · `reports` (id, reporter_id, subject_type, subject_id,
reason, status: pending|reviewed). Feed v1: sorgu + Redis cache
(architecture.md kararı); Redis henüz kurulmadıysa DB sorgusu yeterli (ölçek
gelince eklenir).

## Moderasyon (baştan gerekli!)
- Şikayet et (report) endpoint'i + admin görüntüleme — store politikaları
  UGC uygulamalarında zorunlu tutuyor (Apple 1.2: report + block şart).
  v1'de admin görüntüleme sadece DB seviyesinde (panel yok); önemli olan
  kullanıcının şikayet edebilmesi.
- Kullanıcı engelleme (block): engellenen kişinin gönderileri feed'den ve
  profilinden gizlenir; karşılıklı görünürlük engellenir.
- Küfür filtresi v1: basit TR kelime listesi, gönderi/yorum oluşturmada
  validasyon hatası (422) döner — ileride gelişmiş (ML tabanlı) filtreye
  geçiş kolay olacak şekilde tek bir `ProfanityFilter` sınıfında izole.

## Kabul Kriterleri
- [x] Takip + kendi takımlarının gönderileri feed'de kronolojik görünüyor
- [x] Maç `played` olunca ilgili takımın üyelerine otomatik kart düşüyor
- [x] Engellenen kullanıcının gönderileri feed'de görünmüyor
- [x] Küfürlü içerik 422 ile reddediliyor
- [x] Şikayet ve engelleme uçtan uca çalışıyor (policy + test)
- [x] Bir kullanıcı kendi gönderisini/yorumunu silebiliyor; başkasınınkini silemiyor

## Açık Sorular
- [x] ~~Takım hesabı adına gönderi kim atabilir?~~ → Tüm üyeler (kullanıcı
      kararı 2026-07-04)
- [x] ~~Şehir bazlı "yakınımda" sekmesi~~ → v1'de yok, ertelendi
