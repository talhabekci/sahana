# Modül 5 — Maç Videoları

> Durum: **Spec netleşti** (2026-07-06), uygulama bekliyor · MVP sonrası ·
> Bağımlılık: Modül 3, 4
> Araştırma: [../research/sosyalhalisaha.md](../research/sosyalhalisaha.md)

## Amaç
Maç videolarını Sahana'da toplamak. v1'de birleştirici (aggregator),
v2'de kendi yükleme altyapımız, uzun vadede kendi highlight sistemimiz.

## v1 — Harici Link (embed)
- Maça veya gönderiye video linki ekleme (YouTube, sosyalhalisaha, diğer)
- Backend job: OG/oEmbed metadata (başlık, thumbnail) çekip cache'ler
- Feed'de thumbnail kart → in-app browser veya embed player
- `provider` alanı: `youtube | sosyalhalisaha | other` — ileride resmi
  entegrasyona sancısız geçiş için

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

## v2 — Kullanıcı Yüklemesi
- Telefonla çekilen maç/highlight videosu yükleme
- Akış: presigned URL → doğrudan R2'ye upload → transcode job (ffmpeg,
  720p/1080p HLS) → hazır olunca push
- Limitler (ilk öneri): max 3 dk / 500 MB; maça bağlı olma şartı
  (rastgele video platformu değiliz — depolama maliyet kontrolü)
- Videodaki üçüncü kişiler: yükleyen, izni olduğunu beyan eder (ToS maddesi)

## v3+ — Vizyon (not)
- Saha iş birliğiyle sabit kamera + otomatik kayıt (sosyalhalisaha modeli,
  ama sosyal ağa gömülü)
- Otomatik highlight kesme (gol anı tespiti) — ML araştırma konusu

## Taslak API
`POST /matches/{id}/videos` `{url}` veya `{upload_path}` ·
`GET /matches/{id}/videos` · `DELETE /videos/{id}` ·
`POST /uploads/video` → presigned URL (v2)

## Açık Sorular
- [ ] v2 transcode: VPS'te ffmpeg worker mı, Cloudflare Stream mi? (maliyet analizi)
- [ ] Video izlenme sayacı Modül 6 istatistiklerine girsin mi?
- [ ] `sosyalhalisaha_venues` referans verisi ilk seferde nasıl toplanacak
  (elle mi, kullanıcıların "bu saha eksik" bildirimiyle mi büyüyecek)?
