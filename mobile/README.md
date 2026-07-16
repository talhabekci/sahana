# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Release (production build)

**iOS — Xcode üzerinden manuel (EAS cloud build kullanılmıyor):** EAS cloud
build'in gitignored `.env.production`'ı görememesi yüzünden TestFlight'a
giden ilk build API'ye hiç istek atmıyordu; bu yüzden production build
akışı tamamen Xcode'a taşındı.

1. `mobile/app.json`'da `ios.buildNumber`'ı bir artır — App Store Connect'te
   şu ana kadar yüklenmiş en yüksek build numarasından büyük olmalı,
   yoksa TestFlight yeni build'i "güncelleme" olarak görmez ve sessizce
   yok sayar (`ios/`'daki `CURRENT_PROJECT_VERSION` değil, Expo'nun
   `Info.plist`'e yazdığı literal `CFBundleVersion` esas alınır).
2. ```bash
   npx expo prebuild --platform ios --clean
   open ios/Sahana.xcworkspace
   ```
3. Xcode'da signing team'i kontrol et (fresh prebuild sonrası bazen
   sıfırlanır), **Product → Archive**.
4. Archive bitince Organizer → **Distribute App** → **App Store Connect**
   (önerilen ayarlarla) → **Upload**.
5. App Store Connect → TestFlight sekmesinde build "Processing"den
   "Ready to Submit"e geçince (birkaç dakika sürebilir) cihazdan
   TestFlight uygulamasıyla güncelle.

**Sentry sourcemap upload (Xcode archive'ında gerekli):**
- `app.json`'ın `plugins` dizisinde **sadece** yapılandırılmış
  `["@sentry/react-native/expo", {...}]` girdisi olmalı — yanına bir de
  bare `"@sentry/react-native"` eklenirse (örn. `expo install` bir sonraki
  paket güncellemesinde otomatik ekleyebilir), Expo'nun
  `createRunOncePlugin` de-duplication'ı yüzünden ikisi AYNI plugin kabul
  edilip sadece dizideki İLK'i çalışır — bare olan önce gelirse
  `ios/sentry.properties` org/project'siz (kırık) üretilir.
- `sentry-cli`'nin auth token'ı Xcode'un build phase'i Expo'nun `.env*`
  dosyalarını okumadığı için `~/.sentryclirc`'ten (geliştiricinin kendi
  makinesinde, `[auth]\ntoken=...`) gelir — proje dışı, gitignore'a bile
  gerek yok, her yeni Mac'te bir kere elle oluşturulmalı.

**Android:** Şimdilik ele alınmadı, Android Studio üzerinden manuel build
planlanıyor (ayrı bir oturumda ele alınacak). `eas.json`'daki `production`
profili (env değerleriyle) hâlâ duruyor, Android için EAS cloud build
kullanılmak istenirse bu profil zaten hazır.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
