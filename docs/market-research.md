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

## Kaynaklar
- [Sosyal Halı Saha](https://sosyalhalisaha.com/) · [Şikayetvar sayfası](https://www.sikayetvar.com/sosyal-hali-saha) · [ekşi sözlük](https://eksisozluk.com/sosyal-halisaha--5213335)
- [Halısahavar — App Store](https://apps.apple.com/tr/app/hal%C4%B1sahavar/id1583998724?l=tr)
- [Halı Saha Kadro Kur — Google Play](https://play.google.com/store/apps/details?id=com.creativetechnologytr.macvar.halisahakadro)
- [Quick Lineup — App Store](https://apps.apple.com/tr/app/quick-lineup-kadro-kurma/id6749352900?l=tr) · [quicklineup.com](https://quicklineup.com/tr)
- [kadrokur.com.tr](https://kadrokur.com.tr/) · [VAR Sistemi](https://varsistemi.com/)
