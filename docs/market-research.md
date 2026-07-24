# Pazar Araştırması — Türkiye Halı Saha Uygulamaları

> Durum: İlk tarama (2026-07-03). Store yorumları ve derin inceleme yapılacak.
> Kaynak linkler en altta.

## 1. Pazar Gözlemi

Türkiye'de halı saha kültürü çok güçlü ama dijital araçlar parçalı:
video ayrı platformda, organizasyon WhatsApp'ta, kadro dizme ayrı uygulamada,
rezervasyon telefonla. **"Hepsi bir arada + sosyal ağ" konumunda oturmuş bir
oyuncu yok.** Sahana'nın tezi bu boşluk.

## 2. Rakipler

### Sosyal Halı Saha (sosyalhalisaha.com)
- **Model:** Anlaşmalı sahalara kamera kurar; maçlar otomatik kaydedilir,
  birkaç saat sonra platformda izlenir. Goller/kurtarışlar kategorize edilir,
  kullanıcılar puanlayabilir.
- **Güçlü yanı:** Saha içi donanım ağı — taklit etmesi pahalı bir hendek.
- **Zayıf yanı:** Sosyal ağ değil; organizasyon/kadro/oyuncu bulma yok.
  Şikayetvar'da ücret ödenmesine rağmen görüntülere erişilemediği şikayetleri var
  → kullanıcı güveni kırılgan.
- **Bizim için:** Rakip değil potansiyel **tamamlayıcı** — detay:
  [research/sosyalhalisaha.md](research/sosyalhalisaha.md)

### Halısahavar
- Maç/oyuncu/rakip bulma, saha bilgisi, turnuva özellikleri tek uygulamada.
- Konumlanışı Sahana'ya en yakın rakip; ama sosyal katmanı (feed, takip,
  istatistik/reyting) zayıf. Store puanları ve yorum analizi yapılacak (TODO).

### Adam Eksik
- Tek işlev: maça eksik oyuncu bulma. Dar ama net değer önerisi.
- Ders: "adam eksik" akışı bizde de tek başına parlayacak kadar önemli —
  Modül 3'ün onboarding'de öne çıkan yüzü olmalı.

### Kadro araçları (Halı Saha Kadro Kur, Quick Lineup, Lineupper, kadrokur.com.tr)
- Salt görsel kadro dizme/taktik tahtası. Veri katmanı yok (gerçek oyuncular,
  RSVP, istatistik yok).
- Yüksek indirme sayıları, ihtiyacın gerçekliğini kanıtlıyor. Bizde kadro
  tahtası gerçek takım verisine bağlı olacak — bu fark tek başına yeterli.

### VAR Sistemi (varsistemi.com)
- Sosyal Halı Saha benzeri video/canlı yayın iddiası. Yaygınlığı belirsiz,
  derin inceleme TODO.

## 3. Konumlandırma Haritası

```
                    Sosyal katman güçlü
                          ▲
                          │
                          │      ★ SAHANA (hedef)
                          │
   Tek işlev ◄────────────┼────────────► Hepsi bir arada
   Adam Eksik │           │            │ Halısahavar
   Kadro araçları         │
              Sosyal HS ● │
                          │
                    Sosyal katman zayıf
```

## 4. Sahana'nın Farklılaşması

1. **Veri döngüsü:** Maç → istatistik → oyuncu reytingi → daha iyi eşleşme.
   Rakiplerin hiçbirinde bu döngü kapalı devre çalışmıyor.
2. **WhatsApp'ı içeriden fethetme:** Kadro görseli/maç daveti WhatsApp'a
   paylaşılır → linke tıklayan gruba/uygulamaya gelir. Rakipler store reklamına
   bel bağlıyor; bizim büyüme kanalımız mevcut maç gruplarının kendisi.
3. **Video birleştirici:** v1'de link/embed toplayıcı (sosyalhalisaha dahil),
   uzun vadede kendi highlight altyapımız.

## 5. Riskler

| Risk | Etki | Önlem |
|---|---|---|
| Halısahavar sosyal katman eklerse | Yüksek | MVP hızlı çıkmalı; reyting döngüsünü önce biz kurmalıyız |
| Soğuk başlangıç (boş sosyal ağ) | Yüksek | Şehir şehir açılış (tek şehirde yoğunluk > ülkede seyreklik); araç değeri (kadro+RSVP) tek takım için bile işe yarar |
| Video beklentisi (kamera yokken) | Orta | v1'de beklentiyi "link paylaşımı" olarak net kurgula |
| Saha işletmelerinin ilgisizliği | Düşük (v1'de gerek yok) | Modül 8 Faz 2'ye ertelendi |

## 6. Yapılacaklar
- [ ] Halısahavar + Adam Eksik store yorumlarından şikayet madenciliği
- [ ] 5-10 halı saha oyuncusuyla mini anket (hangi araçları kullanıyorlar?)
- [ ] Sosyal Halı Saha kapsama listesi: hangi şehirler/sahalar?

## 7. Gelir Modeli — tartışma notu (2026-07-24)

> App Store incelemesi beklenirken yapılan bir strateji tartışmasının
> özeti. Karar değil, **daha sonra tekrar konuşulacak** açık bir konu.

**Kullanıcının önerisi (uzun vade):** Kullanıcı tabanı oluştuktan sonra
saha sahiplerine SaaS bir panel satmak — saha müsaitlik takvimi, ödeme,
saha sahibi ile iletişim son kullanıcı uygulamasından yönetilir, saha
sahibi kendi panelinden takip eder.

**Değerlendirme:** Meşru bir uzun vadeli yön ama **ayrı bir ürün** —
şimdi değil:
- İki taraflı pazar (marketplace) kurmak tavuk-yumurta sorunu: saha
  sahibine "sana müşteri getiriyorum" diyebilmek için elde önce gerçek
  kullanıcı hacmi olması lazım.
- Saha sahipleri küçük/teknolojiye uzak işletmeler — onlara satış soğuk
  arama/saha ziyareti gerektiren yavaş bir B2B satış işi, bir özellik
  değil.
- Rezervasyon/takvim/escrow altyapısı ayrı bir ürün — şu an `sosyalhalisaha_venue_id`
  ile sadece DIŞARIDAN saha verisi senkronize ediliyor, kendi rezervasyon
  sistemimiz yok.
- Zaten madde 5'teki risk tablosunda "Saha işletmelerinin ilgisizliği"
  v1 için düşük öncelikli ve Modül 8 Faz 2'ye ertelenmiş — bu tartışma o
  kararla tutarlı.
- **Ne zaman gündeme alınmalı:** kullanıcı tabanı gerçek trafik/yoğunluk
  gösterdiğinde ("her hafta X takım geliyor" diye saha sahibine
  gösterilecek somut bir sayı olduğunda).

**Kısa vadeli (kullanıcı kazandıktan hemen sonraki) değerlendirme:**

| Model | Değerlendirme |
|---|---|
| Reklam (AdMob vb.) | Zayıf — düşük kullanıcı sayısında Türkiye eCPM'i çok düşük, ayda birkaç yüz TL bile getirmez. Gerçek ölçek (on binlerce MAU) olmadan anlamsız. |
| Bireysel kullanıcıya premium abonelik (gelişmiş istatistik vb.) | Zayıf — amatör oyuncu "sosyal" bir araca cebinden para vermeye genelde istekli değil; bu tarz alışkanlık ürünleri (Strava gibi) yıllar ve dev ölçek gerektiriyor. |
| **Saha ücreti bölüştürme + tahsilat (PSP entegrasyonu, İyzico/PayTR tarzı)** | **En güçlü aday.** Her hafta zaten var olan gerçek bir acı: kaptan 10-14 kişiden saha parasını kovalıyor. Uygulama üzerinden ödeme toplayıp küçük bir hizmet bedeli (%2-3) almak, kullanıcıya yeni bir davranış öğretmiyor — zaten yaptığı bir ödemenin sürtünmesini azaltıyor. Az kullanıcıyla bile her aktif takım = garanti haftalık işlem hacmi. Kıyas: ABD'de TeamSnap tam bu modelle gelir üretiyor. |
| "Takım Pro" (kaptana aylık/sezonluk ücret: sınırsız üye, hatırlatma, istatistik export) | Ucuz tamamlayıcı — tek başına büyük gelir değil ama ödeme özelliğiyle birlikte çapraz satışı kolaylaştırır. |

**Öneri sıralaması:** önce ödeme/tahsilat özelliğini gerçek gelir kanalı
olarak inşa etmeyi değerlendir (regülasyon/PSP entegrasyonu var ama saha-
sahibi-SaaS'ından çok daha ulaşılabilir); reklam ve bireysel premium'u
"neden olmasın" bonusları olarak arka planda tut; saha sahibi SaaS'ını
gerçek trafik olmadan gündeme getirme.

## Kaynaklar
- [Sosyal Halı Saha](https://sosyalhalisaha.com/) · [Şikayetvar sayfası](https://www.sikayetvar.com/sosyal-hali-saha) · [ekşi sözlük](https://eksisozluk.com/sosyal-halisaha--5213335)
- [Halısahavar — App Store](https://apps.apple.com/tr/app/hal%C4%B1sahavar/id1583998724?l=tr)
- [Halı Saha Kadro Kur — Google Play](https://play.google.com/store/apps/details?id=com.creativetechnologytr.macvar.halisahakadro)
- [Quick Lineup — App Store](https://apps.apple.com/tr/app/quick-lineup-kadro-kurma/id6749352900?l=tr) · [quicklineup.com](https://quicklineup.com/tr)
- [kadrokur.com.tr](https://kadrokur.com.tr/) · [VAR Sistemi](https://varsistemi.com/)
