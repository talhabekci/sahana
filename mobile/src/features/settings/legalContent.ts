export type LegalSection = {
  heading?: string;
  body: string;
};

export type LegalDocument = {
  title: string;
  updatedAt: string;
  sections: LegalSection[];
};

/**
 * BACKLOG #29 / PRODUCTION-READINESS.md §G — ilk taslak metinler. Hukuki
 * nihai onay kullanıcıda; burası placeholder'ın yerini alan ama yine de
 * gözden geçirilmesi gereken bir başlangıç noktası.
 */
export const LEGAL_DOCUMENTS: Record<string, LegalDocument> = {
  privacy: {
    title: 'Gizlilik Politikası',
    updatedAt: '14 Temmuz 2026',
    sections: [
      {
        body: 'Sahana ("biz", "uygulama"), halı saha oyuncularının profil oluşturduğu, takım kurduğu, maç organize ettiği ve maç videolarını paylaştığı bir sosyal ağdır. Bu metin, uygulamayı kullanırken hangi verilerini topladığımızı, neden topladığımızı ve bu verilerle ilgili haklarını açıklar.',
      },
      {
        heading: 'Topladığımız veriler',
        body: 'Hesap oluştururken: e-posta adresin. Profilinde: ad-soyad, mevki(ler), güçlü ayak, boy, şehir/semt, müsaitlik saatleri, profil fotoğrafı ve kısa bio — bunların hepsi isteğe bağlı, doldurup doldurmamak sana kalmış (e-posta hariç). Kullanım sırasında: paylaştığın gönderiler, fotoğraf ve videolar, yorumlar, takım/maç bilgileri, oyuncu değerlendirmeleri ve maç istatistikleri, birebir ve takım sohbetlerindeki mesajlar (metin, fotoğraf, sesli mesaj). Cihazından: push bildirim token\'ı (bildirim gönderebilmek için) ve "yakınımdaki ilanlar" özelliğini kullandığında anlık konumun (sürekli takip edilmez, sadece o an sorgulandığında).',
      },
      {
        heading: 'Verilerini ne için kullanıyoruz',
        body: 'Profilini diğer oyunculara göstermek, seni maç/takım/rakip eşleşmelerinde önermek, bildirim göndermek (maç daveti, mesaj, takip vb.), yakınındaki oyuncu/rakip ilanlarını listelemek, hesabını güvenli tutmak (giriş doğrulama, spam/abuse önleme) ve yasal yükümlülüklerimizi yerine getirmek için kullanıyoruz. Verilerini reklam amacıyla satmıyoruz.',
      },
      {
        heading: 'Verilerini kimlerle paylaşıyoruz',
        body: 'Fotoğraf/video/ses dosyaların bulut depolama sağlayıcımızda (Cloudflare R2) barındırılır. Push bildirimler Expo/Firebase Cloud Messaging altyapısı üzerinden gönderilir. Hata izleme için (varsa) Sentry kullanılabilir — bu araçlar veriyi sadece bize hizmet sağlamak amacıyla işler, kendi adlarına kullanmaz. Yasal bir zorunluluk olmadıkça verilerini üçüncü taraflarla paylaşmıyoruz.',
      },
      {
        heading: 'Ne kadar süre saklıyoruz',
        body: 'Hesabın aktif olduğu sürece verilerini saklarız. Hesabını sildiğinde (Ayarlar > Hesabı Sil) profil verilerin ve kişisel içeriklerin sistemden kaldırılır; yasal saklama zorunluluğu olan kayıtlar (ör. mali/işlem kayıtları, varsa) ilgili mevzuatın öngördüğü süre kadar saklanabilir.',
      },
      {
        heading: 'Hakların',
        body: 'Verilerinin bir kopyasını isteyebilir, yanlış bilgilerin düzeltilmesini talep edebilir, hesabını ve verilerini silebilir, belirli bildirim türlerini kapatabilirsin (Ayarlar > Bildirim Tercihleri). Sorularını en alttaki iletişim adresinden bize ulaştırabilirsin.',
      },
      {
        heading: '18 yaş altı kullanıcılar',
        body: 'Sahana genel bir sosyal ağdır ve özellikle çocuklara yönelik değildir. 18 yaşın altındaysan ebeveyn/vasi gözetiminde kullanmanı öneririz.',
      },
      {
        heading: 'İletişim',
        body: 'Gizlilikle ilgili sorularını [iletişim e-postası buraya eklenecek] adresine gönderebilirsin.',
      },
    ],
  },
  kvkk: {
    title: 'KVKK Aydınlatma Metni',
    updatedAt: '14 Temmuz 2026',
    sections: [
      {
        body: '6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca, veri sorumlusu sıfatıyla Sahana olarak, kişisel verilerini hangi amaçla işlediğimizi, kimlerle paylaştığımızı ve KVKK kapsamındaki haklarını aşağıda bilgine sunuyoruz.',
      },
      {
        heading: 'İşlenen kişisel veri kategorileri',
        body: 'Kimlik ve iletişim verisi (ad-soyad, e-posta), profil verisi (mevki, boy, şehir/semt, müsaitlik, bio, profil fotoğrafı), görsel/işitsel kayıtlar (paylaştığın fotoğraf, video, sesli mesajlar), işlem güvenliği verisi (giriş kayıtları, cihaz/push token bilgisi), konum verisi (yalnızca "yakınımdaki ilanlar" özelliği kullanıldığında, anlık).',
      },
      {
        heading: 'İşleme amaçları',
        body: 'Üyelik ve profil işlemlerinin yürütülmesi, sosyal ağ içi eşleştirme (maç/takım/oyuncu önerileri), iletişim faaliyetlerinin yürütülmesi (bildirimler, mesajlaşma), hizmet kalitesinin ve güvenliğinin sağlanması, hukuki yükümlülüklerin yerine getirilmesi.',
      },
      {
        heading: 'Hukuki sebep',
        body: 'Kişisel verilerin, KVKK m.5/2 kapsamında bir sözleşmenin kurulması veya ifasıyla doğrudan ilgili olması, ilgili kişinin temel hak ve özgürlüklerine zarar vermemek kaydıyla veri sorumlusunun meşru menfaati ve açık rızan gerektiren durumlarda (ör. konum, bildirim izni) açık rızan hukuki sebeplerine dayanılarak işlenmektedir.',
      },
      {
        heading: 'Aktarım',
        body: 'Verilerin, hizmet aldığımız bulut depolama (Cloudflare R2) ve bildirim (Firebase Cloud Messaging/Expo) sağlayıcılarına, sadece hizmetin sunulabilmesi için gerekli ölçüde aktarılabilir. Bu sağlayıcıların sunucuları yurt dışında olabilir; bu durumda KVKK\'nın yurt dışına aktarıma ilişkin hükümlerine uyulur.',
      },
      {
        heading: 'KVKK m.11 kapsamındaki hakların',
        body: 'Kişisel verinin işlenip işlenmediğini öğrenme, işlenmişse buna ilişkin bilgi talep etme, işlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme, yurt içinde/yurt dışında aktarıldığı üçüncü kişileri bilme, eksik/yanlış işlenmişse düzeltilmesini isteme, silinmesini/yok edilmesini isteme, düzeltme-silme işlemlerinin aktarılan üçüncü kişilere bildirilmesini isteme, işlenen verinin münhasıran otomatik sistemlerle analiz edilmesi suretiyle aleyhine bir sonucun ortaya çıkmasına itiraz etme, kanuna aykırı işleme sebebiyle zarara uğraman hâlinde zararın giderilmesini talep etme.',
      },
      {
        heading: 'Başvuru yolu',
        body: 'Bu haklarını kullanmak için [iletişim e-postası buraya eklenecek] adresine, kimliğini tevsik edici bilgilerle birlikte yazılı başvuruda bulunabilirsin. Başvurun KVKK\'da öngörülen süre içinde ücretsiz olarak sonuçlandırılır.',
      },
    ],
  },
  terms: {
    title: 'Kullanım Şartları',
    updatedAt: '14 Temmuz 2026',
    sections: [
      {
        body: 'Sahana\'yı kullanarak aşağıdaki şartları kabul etmiş sayılırsın. Bu metni dikkatlice oku.',
      },
      {
        heading: 'Hesap',
        body: 'Kayıt için geçerli bir e-posta adresi gerekir. Hesabının güvenliğinden sen sorumlusun; hesabınla yapılan tüm işlemler senin sorumluluğundadır. 18 yaşın altındaysan ebeveyn/vasi izniyle kullanmalısın.',
      },
      {
        heading: 'Kullanıcı içeriği',
        body: 'Paylaştığın gönderi, fotoğraf, video, yorum ve mesajların (birlikte "içerik") sahibi sensin. Ancak içeriğini uygulama içinde gösterebilmemiz için bize dünya çapında, münhasır olmayan, telifsiz bir kullanım lisansı vermiş olursun. Başkalarının haklarını ihlal eden, hakaret/nefret söylemi içeren, müstehcen ya da yasa dışı içerik paylaşamazsın — böyle içerikler bildirim üzerine veya tarafımızca tespit edilirse kaldırılabilir ve hesabın askıya alınabilir.',
      },
      {
        heading: 'Saygılı kullanım',
        body: 'Diğer kullanıcılara saygılı davranmak, spam/istismar amaçlı mesaj/yorum/ilan göndermemek, sahte profil oluşturmamak, başkasının fotoğraf/videosunu izinsiz paylaşmamak kullanım şartıdır. Rahatsız edici davranışları "Şikayet Et" ve "Engelle" özellikleriyle bize bildirebilirsin.',
      },
      {
        heading: 'Maç, video ve istatistik verileri',
        body: 'Maç sonuçları, oyuncu istatistikleri ve değerlendirmeleri katılımcılar tarafından girilir ve onaylanır; bunların doğruluğunu garanti etmiyoruz, uyuşmazlık durumunda maç sonucu "itiraz" akışı üzerinden çözülür. Yüklediğin maç videolarının telif hakkına sahip olduğunu ya da paylaşma iznin olduğunu beyan etmiş sayılırsın.',
      },
      {
        heading: 'Hesap askıya alma ve sonlandırma',
        body: 'Bu şartları ihlal ettiğini tespit edersek hesabını uyarabilir, geçici olarak kısıtlayabilir ya da kapatabiliriz. Hesabını istediğin zaman Ayarlar > Hesabı Sil üzerinden kendin de kapatabilirsin.',
      },
      {
        heading: 'Sorumluluk sınırı',
        body: 'Sahana, oyuncular arası organize edilen maçların, saha rezervasyonlarının ya da kullanıcılar arası etkileşimlerin sonucundan sorumlu değildir; uygulama sadece bir araçtır. Hizmeti "olduğu gibi" sunarız, kesintisiz/hatasız çalışacağını garanti etmeyiz.',
      },
      {
        heading: 'Değişiklikler',
        body: 'Bu şartları zaman zaman güncelleyebiliriz; önemli değişikliklerde uygulama içinden bilgilendirme yaparız. Güncellenmiş şartları kullanmaya devam etmen, değişiklikleri kabul ettiğin anlamına gelir.',
      },
      {
        heading: 'İletişim',
        body: 'Sorularını [iletişim e-postası buraya eklenecek] adresine gönderebilirsin.',
      },
    ],
  },
};
