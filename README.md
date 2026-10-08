# Kalori Lens (v2)

Fotoğraftan kalori ve makro takibi yapan mobil uygulama. Expo (SDK 57), TypeScript ve Expo Router ile yazıldı; backend olarak Supabase kullanılıyor.

## Geliştirme

```bash
npm install
npm run web        # tarayıcı önizlemesi
npx expo start     # telefonda Expo Go / development build
```

## Kontroller

```bash
npm run typecheck
npm run lint
npm test
```

## Yapı

- `src/app/`: ekranlar (Expo Router)
- `src/features/`: özellik modülleri (profil, yemek, egzersiz…)
- `src/lib/`: saf yardımcılar (tarih, beslenme hesapları)
- `src/i18n/`: çeviriler (`tr.json`)
- `src/theme/`: renkler ve ölçüler
- `supabase/`: veritabanı migration'ları ve Edge Functions

> Bu uygulama tıbbi tavsiye vermez.
