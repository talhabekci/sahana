# Araştırma: sosyalhalisaha.com Video Entegrasyonu

> Durum: Ön araştırma (2026-07-03). Karar: **v1'de link/embed, entegrasyon için
> iş birliği görüşmesi denenecek.**

## 1. Sistem Nasıl Çalışıyor?

- Anlaşmalı halı sahalara sabit kamera kurulur (tavsiye edilen: en az 2 kamera).
- Maçlar saat bazlı otomatik kaydedilir; oyuncu maçından birkaç saat sonra
  platformda kendini izler.
- Platform golleri, kurtarışları ve öne çıkan pozisyonları kategorize eder;
  kullanıcılar videoları izleyip puanlayabilir.
- URL yapısı gözlemi: `sosyalhalisaha.com/mac-detay/{id}` ve
  `sosyalhalisaha.com/video-detay/{id}` — sayfalar halka açık görünüyor
  (arama motorunda indeksli).
- **Filtre endpoint'i (kullanıcı gözlemi, 2026-07-06):**
  `sosyalhalisaha.com/xhr/filtre/{il_id}_{ilce_id}_{saha_id}_{tarih}_{saat}_`
  (örn. `34_410_486_2026-06-30_23:00_`). `il_id` = plaka numarası (bizim
  `cities.id` ile birebir aynı — ek eşleştirmeye gerek yok). `ilce_id` ve
  `saha_id` sosyalhalisaha'ya özel, dokümansız dahili ID'ler. Bu, XHR/dahili
  bir uç nokta — resmi/genel API değil; **programatik olarak bizim backend'imiz
  tarafından çağrılmayacak** (bkz. §2 Seçenek C kararı). Kullanım şekli için
  §3'teki "deep-link" yaklaşımına bakın.

## 2. Entegrasyon Seçenekleri

| Seçenek | Uygulanabilirlik | Risk | Karar |
|---|---|---|---|
| **A. Resmi API / iş birliği** | Halka açık API bulunamadı; iletişime geçmek gerek | Düşük | 🎯 Hedef — MVP sonrası görüşme |
| **B. Kullanıcının link yapıştırması + embed/önizleme** | Hemen yapılabilir | Çok düşük (sadece link + OG metadata) | ✅ v1 çözümü |
| **C. Scraping ile video çekme** | Teknik olarak mümkün görünse de | **Yüksek**: telif/ToS ihlali, kırılgan, KVKK (videodaki kişiler!) | ❌ Yapılmayacak |
| **D. Kendi kamera/highlight sistemimiz** | Uzun vade; donanım + saha anlaşması gerektirir | Orta (sermaye) | Faz 3+ vizyonu |

### Neden C (scraping) yok?
1. Videolar sosyalhalisaha'nın anlaşmalı sahalarda kendi donanımıyla ürettiği
   içerik — telif onlarda.
2. Videolarda üçüncü kişiler var; izinsiz yeniden yayınlamak KVKK açısından
   bizim sorumluluğumuz olur.
3. Site yapısı değişince kırılır; ürünün temel özelliğini başkasının insafına
   bırakmak stratejik hata.

## 3. v1 Uygulaması (Seçenek B — Modül 5 spec'ine girecek)

1. Kullanıcı maç kaydına video linki ekler (sosyalhalisaha, YouTube, vb.).
2. Backend job, linkin OG/oEmbed metadata'sını çeker (başlık + thumbnail).
3. Feed'de thumbnail kartı; tıklayınca in-app browser/embed player.
4. `videos.provider` alanı sayesinde ileride resmi entegrasyona geçiş sancısız.

### 3.1 Deep-Link ile "Videonu Bul" Yönlendirmesi (2026-07-06 karar)

Kullanıcı önerisi: maç kurulurken il/ilçe/saha seçilsin, maç bitince video
otomatik gösterilsin. **Otomatik çekme/gösterme kısmı reddedildi** (yukarıdaki
Seçenek C gerekçeleriyle aynı: telif + kırılganlık + KVKK). Bunun yerine kabul
edilen orta yol:

- Kullanıcı maç kurarken opsiyonel olarak sosyalhalisaha ilçe/saha eşleşmesi
  seçer (il zaten `cities` tablosuyla bedava eşleşiyor).
- Maç günü/saati geldikten sonra maç ekranında "Videonu bul" butonu belirir;
  bu, yukarıdaki filtre URL'ini **sadece harici tarayıcıda açar**
  (`Linking.openURL`) — bizim sunucumuz bu endpoint'i hiç çağırmaz, sonucu
  parse etmez, hiçbir veri depolamaz. Kullanıcı orada kendi videosunu bulup
  linkini kopyalar, Sahana'ya dönüp §3 adım 1'deki mevcut "harici link ekle"
  akışıyla maça/gönderiye ekler.
- Bu şekilde tüm veri akışı kullanıcı inisiyatifinde kalır; hukuki/teknik risk
  sıradan bir hyperlink'ten farksızdır. Ayrıntılı akış: `docs/features/05-videos.md`
  §"v1.5".

## 4. İş Birliği Görüşmesi İçin Notlar (MVP sonrası)

- **Bizim değerimiz onlara:** Sahana kullanıcıları maç organize ederken hangi
  sahada oynayacağını seçiyor → sosyalhalisaha'lı sahalara talep yönlendirebiliriz;
  videolarına yeni izleyici kitlesi getiririz.
- **İstediğimiz:** Maç saati + saha eşleşmesiyle video listesi dönen basit bir API
  (veya deep-link standardı).
- Şikayetvar'daki erişim şikayetleri pazarlıkta veri noktası: kullanıcı
  deneyimlerini bizim üzerimizden iyileştirebilirler.

## 5. Açık Sorular
- [ ] Hangi şehir/sahalarda aktifler? (kapsama listesi çıkarılacak)
- [ ] Video sayfaları login istiyor mu, ücretli içerik hangi seviyede başlıyor?
- [ ] VAR Sistemi (varsistemi.com) benzer API/iş birliği için alternatif olabilir mi?
- [ ] İletişim kanalı: kurumsal mail / sahadaki işletmeler üzerinden referans?
