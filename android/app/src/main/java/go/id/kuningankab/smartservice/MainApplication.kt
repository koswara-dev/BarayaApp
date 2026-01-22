package go.id.kuningankab.smartservice

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          // Packages that cannot be autolinked yet can be added manually here, for example:
          // add(MyReactNativePackage())
        },
    )
  }

  override fun onCreate() {
    super.onCreate()
    loadReactNative(this)
    createNotificationChannels()
  }

  private fun createNotificationChannels() {
    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
      val notificationManager = getSystemService(android.app.NotificationManager::class.java)

      // 1. Emergency Channel
      val emergencyChannel = android.app.NotificationChannel(
        "emergency",
        "Layanan Darurat",
        android.app.NotificationManager.IMPORTANCE_HIGH
      )
      emergencyChannel.description = "Notifikasi untuk laporan darurat Anda"
      emergencyChannel.enableLights(true)
      emergencyChannel.enableVibration(true)
      // Note: Sound is handled by system default or updated by Notifee later

      // 2. Default Channel
      val defaultChannel = android.app.NotificationChannel(
        "default",
        "Informasi Umum",
        android.app.NotificationManager.IMPORTANCE_HIGH
      )

      // 3. Event Channel
      val eventChannel = android.app.NotificationChannel(
        "event",
        "Event & Agenda",
        android.app.NotificationManager.IMPORTANCE_HIGH
      )
      eventChannel.description = "Notifikasi update event dan agenda terkini"

      // 4. Pengaduan Channel
      val pengaduanChannel = android.app.NotificationChannel(
        "pengaduan",
        "Update Pengaduan",
        android.app.NotificationManager.IMPORTANCE_HIGH
      )
      pengaduanChannel.description = "Notifikasi perkembangan status pengaduan Anda"

      notificationManager.createNotificationChannels(listOf(emergencyChannel, defaultChannel, eventChannel, pengaduanChannel))
    }
  }
}
