Berikut **implementasi end-to-end FCM Notifikasi Pengaduan & Darurat berbasis `dinasId`** dengan **Spring Boot (backend)** dan **React Native CLI (frontend)**, disesuaikan dengan pola aplikasi layanan publik yang sedang kamu bangun.

---

## 1️⃣ Arsitektur Alur Notifikasi

**Flow singkat:**

1. User login di **React Native**
2. App ambil **FCM Token**
3. Token dikirim ke **Backend Spring Boot**
4. Token disimpan berdasarkan:

   - `userId`
   - `role`
   - `dinasId`

5. Saat:

   - **Pengaduan dibuat** → notif ke dinas terkait
   - **Darurat dibuat** → notif ke dinas + pejabat

6. Backend filter token berdasarkan `dinasId`

---

## 2️⃣ Database Design (FCM Token)

### Entity: `user_fcm_token`

```sql
CREATE TABLE user_fcm_token (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    role VARCHAR(50) NOT NULL,
    dinas_id BIGINT,
    fcm_token TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 9️⃣ Trigger Saat Pengaduan / Darurat

### Pengaduan

```java
fcmNotificationService.sendToDinas(
    pengaduan.getDinasId(),
    "Pengaduan Baru",
    pengaduan.getJudul(),
    Map.of(
        "type", "PENGADUAN",
        "pengaduanId", pengaduan.getId().toString()
    )
);
```

### Darurat

```java
fcmNotificationService.sendToDinas(
    darurat.getDinasId(),
    "🚨 DARURAT",
    darurat.getLokasi(),
    Map.of(
        "type", "DARURAT",
        "daruratId", darurat.getId().toString()
    )
);
```

---

## 🔟 React Native CLI – Ambil & Kirim FCM Token

---

### Request Permission & Get Token

```js
import messaging from '@react-native-firebase/messaging';
import axios from 'axios';

export async function registerFcmToken(jwt) {
  await messaging().requestPermission();

  const token = await messaging().getToken();

  await axios.post(
    'https://api.domainmu.com/api/fcm/register',
    { fcmToken: token },
    {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    },
  );
}
```

➡️ Panggil **setelah login sukses**

---

### Handle Notifikasi

```js
messaging().onMessage(async remoteMessage => {
  console.log('FCM Foreground:', remoteMessage);
});

messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('FCM Background:', remoteMessage);
});
```

---

## 1️⃣1️⃣ Payload di Mobile

```json
{
  "type": "DARURAT",
  "daruratId": "15"
}
```

➡️ Bisa routing ke halaman detail
