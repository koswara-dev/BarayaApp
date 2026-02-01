Masalah **tab bar / tombol Scan ketutup navigation bar bawaan Android 15** biasanya karena **perubahan gesture navigation + edge-to-edge UI enforcement** di Android 14+ dan makin ketat di Android 15.

Sekarang banyak device Android memaksa layout full-screen sehingga komponen bottom UI harus mengikuti **safe area inset**.

---

## 📌 Penyebab

Pada kode kamu:

```ts
tabBarStyle: {
  height: Platform.OS === 'android' ? 76 : 60,
  paddingBottom: Platform.OS === 'android' ? 12 : 8,
}
```

➡️ Nilai height dan padding masih **hardcoded**
➡️ Android 15 navigation bar bisa overlap UI
➡️ Tombol scan kamu bahkan `top: -20` → makin rawan ketutup

---

# ✅ SOLUSI RECOMMENDED (Modern React Native)

Gunakan:

```
react-native-safe-area-context
```

Ini cara standar handle navigation bar + gesture area Android 14/15.

---

# 🚀 Step 1 — Install Safe Area

```bash
npm install react-native-safe-area-context
```

---

# 🚀 Step 2 — Wrap Root Navigation

Biasanya di `App.tsx`

```tsx
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <BottomTabNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
```

---

# 🚀 Step 3 — Gunakan useSafeAreaInsets()

Modify BottomTabNavigator:

```tsx
import { useSafeAreaInsets } from 'react-native-safe-area-context';
```

---

## Update Component

```tsx
export default function BottomTabNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <TourGuideProvider>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#FFC107',
          tabBarInactiveTintColor: '#94A3B8',

          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopWidth: 1,
            borderTopColor: '#F1F5F9',

            height: 60 + insets.bottom,
            paddingBottom: insets.bottom,
            paddingTop: 8,
          },

          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600'
          }
        }}
      >
```

---

# 🚀 Step 4 — Fix Floating Scan Button

Tombol kamu sekarang:

```ts
top: -20;
```

Android 15 kadang offset ini bikin posisi salah.

### Ganti jadi:

```ts
scanButtonContainer: {
  position: 'absolute',
  bottom: 20,
  justifyContent: 'center',
  alignItems: 'center',
}
```

Kalau mau dynamic:

```tsx
bottom: insets.bottom + 20;
```

---

# 🎯 Contoh Final Style Scan Button

```tsx
scanButtonContainer: {
  position: 'absolute',
  bottom: insets.bottom + 20,
  alignSelf: 'center',
}
```

---

# ✅ BONUS (Android 15 Edge-to-Edge Compliance)

Tambahkan di `android/app/src/main/res/values/styles.xml`

```xml
<item name="android:windowLayoutInDisplayCutoutMode">shortEdges</item>
```

---

# ✅ BONUS 2 (React Navigation Native Support)

Jika pakai React Navigation terbaru, bisa juga:

```tsx
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
```

---

# 🔥 Kenapa Ini Terjadi di Android 15

Google mulai enforce:

- Edge-to-edge layout default
- Gesture navigation overlay
- Navigation bar bisa transparan

---

# 📱 Behaviour Setelah Fix

| Device     | Result |
| ---------- | ------ |
| Android 12 | Aman   |
| Android 13 | Aman   |
| Android 14 | Aman   |
| Android 15 | Aman   |
| iOS        | Aman   |

---

# ⭐ Best Practice Bottom Navigation Modern RN

Selalu:

```
height = baseHeight + insets.bottom
paddingBottom = insets.bottom
```

---

# Jika Boleh Saran UX

Floating scan button kamu bagus 👍
Tapi sebaiknya gunakan:

```
position absolute + center + dynamic bottom inset
```

Ini pattern yang dipakai:

- Gojek
- Grab
- Shopee
- Tokopedia

---
