/**
 * Expo config plugin that adds a tiny Kotlin native module for controlling
 * Android's Do Not Disturb mode.
 *
 * What it does:
 *   1. Adds `android.permission.ACCESS_NOTIFICATION_POLICY` to AndroidManifest.
 *   2. Writes a Kotlin module that exposes:
 *        QuietMode.hasPolicyAccess(): Promise<boolean>
 *        QuietMode.requestPolicyAccess(): Promise<void>
 *        QuietMode.setDnd(enabled: boolean): Promise<boolean>
 *   3. Registers the module with the host React Native app via
 *      ReactNativeHostHandler (Expo SDK 50+).
 *
 * The user must grant Notification Policy access ONCE via system settings —
 * the module deep-links to that screen on first use. After granting, the JS
 * side can toggle DND silently.
 */
const { withAndroidManifest, withDangerousMod, AndroidConfig } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const KOTLIN_PACKAGE = 'com.itzhakdvir.chavruta.quietmode';
const KOTLIN_DIR = KOTLIN_PACKAGE.replace(/\./g, '/');

const KOTLIN_MODULE = `package ${KOTLIN_PACKAGE}

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
`;

const EXPO_MODULE_CONFIG = `{
  "platforms": ["android"],
  "android": {
    "modules": ["${KOTLIN_PACKAGE}.QuietModeModule"]
  }
}
`;

function withQuietModeManifest(config) {
  return withAndroidManifest(config, async (cfg) => {
    const manifest = cfg.modResults;
    AndroidConfig.Permissions.addPermission(
      manifest,
      'android.permission.ACCESS_NOTIFICATION_POLICY',
    );
    return cfg;
  });
}

function withQuietModeKotlin(config) {
  return withDangerousMod(config, [
    'android',
    async (cfg) => {
      const projectRoot = cfg.modRequest.projectRoot;
      // Place a tiny local Expo module at modules/quiet-mode/
      const moduleRoot = path.join(projectRoot, 'modules', 'quiet-mode');
      const srcDir = path.join(moduleRoot, 'android', 'src', 'main', 'java', KOTLIN_DIR);
      fs.mkdirSync(srcDir, { recursive: true });

      // Write Kotlin source
      fs.writeFileSync(path.join(srcDir, 'QuietModeModule.kt'), KOTLIN_MODULE);
      // expo-module.config.json registers the module with Expo Modules autolink
      fs.writeFileSync(
        path.join(moduleRoot, 'expo-module.config.json'),
        EXPO_MODULE_CONFIG,
      );
      // Minimal package.json so autolinking can pick it up
      const pkgJson = path.join(moduleRoot, 'package.json');
      if (!fs.existsSync(pkgJson)) {
        fs.writeFileSync(pkgJson, JSON.stringify({
          name: 'chavruta-quiet-mode',
          version: '1.0.0',
          main: 'index.js',
        }, null, 2));
      }
      // Minimal build.gradle so Android Gradle includes the Kotlin source
      const buildGradle = path.join(moduleRoot, 'android', 'build.gradle');
      if (!fs.existsSync(buildGradle)) {
        fs.writeFileSync(buildGradle, `
apply plugin: 'com.android.library'
apply plugin: 'kotlin-android'
apply plugin: 'maven-publish'

group = '${KOTLIN_PACKAGE}'
version = '1.0.0'

android {
  compileSdkVersion safeExtGet('compileSdkVersion', 34)
  namespace '${KOTLIN_PACKAGE}'
  defaultConfig { minSdkVersion safeExtGet('minSdkVersion', 24) }
}

dependencies { implementation project(':expo-modules-core') }

def safeExtGet(prop, fallback) {
  rootProject.ext.has(prop) ? rootProject.ext.get(prop) : fallback
}
`);
      }
      // index.js — empty entrypoint (the native side is what we need)
      const indexJs = path.join(moduleRoot, 'index.js');
      if (!fs.existsSync(indexJs)) {
        fs.writeFileSync(indexJs, '// Native-only module; see android/ folder\n');
      }
      return cfg;
    },
  ]);
}

module.exports = function withQuietMode(config) {
  config = withQuietModeManifest(config);
  config = withQuietModeKotlin(config);
  return config;
};
