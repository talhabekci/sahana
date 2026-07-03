# Modül 5 — Maç Videoları

> Durum: **Ön taslak** · MVP sonrası · Bağımlılık: Modül 3, 4
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
