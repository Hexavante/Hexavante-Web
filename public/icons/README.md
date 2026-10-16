# Ícones PWA / APK



Gerados automaticamente a partir de `public/brand/hexavante-logo.png`:



```bash

npm run native:icons

```



Saída:



- `icon-192.png` / `icon-512.png` — PWA e manifest

- `native/android-res/` — launcher do APK (copiado no build Android)

- `src-tauri/icons/` — ícone do EXE (Tauri)



O build do APK (`npm run native:android:apk`) roda `native:icons` antes do Gradle.


