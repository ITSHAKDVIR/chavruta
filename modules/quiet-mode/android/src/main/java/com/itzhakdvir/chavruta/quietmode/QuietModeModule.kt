package com.itzhakdvir.chavruta.quietmode

import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class QuietModeModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("QuietMode")

    AsyncFunction("hasPolicyAccess") {
      val ctx = appContext.reactContext ?: return@AsyncFunction false
      val nm = ctx.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
        ?: return@AsyncFunction false
      return@AsyncFunction nm.isNotificationPolicyAccessGranted
    }

    AsyncFunction("requestPolicyAccess") {
      val ctx = appContext.reactContext
      if (ctx != null) {
        val intent = Intent(Settings.ACTION_NOTIFICATION_POLICY_ACCESS_SETTINGS)
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        try { ctx.startActivity(intent) } catch (_: Exception) {}
      }
    }

    AsyncFunction("setDnd") { enabled: Boolean ->
      val ctx = appContext.reactContext ?: return@AsyncFunction false
      val nm = ctx.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
        ?: return@AsyncFunction false
      if (!nm.isNotificationPolicyAccessGranted) return@AsyncFunction false
      val filter = if (enabled)
        NotificationManager.INTERRUPTION_FILTER_NONE
      else
        NotificationManager.INTERRUPTION_FILTER_ALL
      try {
        nm.setInterruptionFilter(filter)
        return@AsyncFunction true
      } catch (_: SecurityException) {
        return@AsyncFunction false
      }
    }
  }
}
