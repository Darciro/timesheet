# Timesheet

App em React Native (Expo) para calcular o horário de saída com base no horário de entrada, considerando 8h48 de trabalho diário (44h semanais).

## Como rodar

```sh
npm install
npm run start   # abre o Expo Dev Tools (Metro)
npm run ios     # abre no simulador iOS
npm run android # abre no emulador Android
```

Requer o app **Expo Go** (ou um simulador/emulador) para testar em um dispositivo.

## Rodando no emulador Android

### Pré-requisitos

- JDK 17: `brew install --cask temurin@17`
- Android Studio, com o SDK em `~/Library/Android/sdk` e um AVD criado (ex.: `Pixel_5`)

Variáveis de ambiente no `~/.zshrc`:

```sh
export ANDROID_HOME="$HOME/Library/Android/sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export JAVA_HOME="/Library/Java/JavaVirtualMachines/temurin-17.jdk/Contents/Home"
export PATH="$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$PATH:$JAVA_HOME/bin"
```

Depois rode `source ~/.zshrc`.

### Executando

```sh
emulator -avd Pixel_5   # se o emulador ainda não estiver aberto
adb devices             # deve listar emulator-5554  device
npm run android         # compila, instala e abre o app com o Metro
```

O primeiro build demora, porque o Gradle baixa as dependências e partes do SDK (platform, build-tools, NDK). Os builds seguintes são rápidos.

Se o app já estiver instalado, basta subir o Metro com `npx expo start --dev-client` e apertar `a`.

### Problemas comuns

- **`Cannot find AVD system path. Please define ANDROID_SDK_ROOT`**: o `ANDROID_HOME` aponta para um SDK sem a imagem de sistema do AVD, por exemplo o SDK do Homebrew (`/opt/homebrew/share/android-commandlinetools`). Aponte o `ANDROID_HOME` e o `ANDROID_SDK_ROOT` para o SDK do Android Studio.
- **`Running multiple emulators with the same AVD`**: o emulador já está aberto. Confira com `adb devices`.
- **`[CXX1101] NDK at .../ndk/27.1.12297006 did not have a source.properties file`**: o download automático do NDK ficou incompleto. Apague a pasta `~/Library/Android/sdk/ndk/27.1.12297006` e reinstale o NDK pelo Android Studio (SDK Manager → SDK Tools → NDK (Side by side)), ou copie de outro SDK que tenha uma instalação completa.

### APK de release

```sh
npm run build:android   # gera android/app/build/outputs/apk/release/app-release.apk
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

