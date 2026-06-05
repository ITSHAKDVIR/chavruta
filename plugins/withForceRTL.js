/**
 * Force the Android app into RTL layout from the very first frame.
 *
 * Multi-pronged approach:
 *   1. MainApplication.onCreate — sets I18nUtil.forceRTL BEFORE React Native loads.
 *   2. MainActivity.onCreate — same call as a safety net (some OEM ROMs reset prefs).
 *   3. AndroidManifest.xml — adds android:supportsRtl="true" and
 *      android:layoutDirection="rtl" on the application tag, so the native
 *      layer treats the app as RTL from the moment the process starts.
 *   4. MainActivity.attachBaseContext — wraps the context with a Hebrew locale
 *      Configuration, so even system services treat us as a Hebrew RTL app.
 */
const { withMainActivity, withDangerousMod, withAndroidManifest } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const RTL_IMPORT = `import com.facebook.react.modules.i18nmanager.I18nUtil`;
const RTL_CONFIG_IMPORTS = `
import android.content.Context
import android.content.res.Configuration
import java.util.Locale`;

const RTL_CALL_KT = `    // [withForceRTL] Force RTL natively before React Native bootstraps.
    val sharedI18nUtilInstance = I18nUtil.getInstance()
    sharedI18nUtilInstance.allowRTL(applicationContext, true)
    sharedI18nUtilInstance.forceRTL(applicationContext, true)
`;

const ATTACH_BASE_CONTEXT = `
  override fun attachBaseContext(newBase: Context) {
    // [withForceRTL] Wrap the base context with a Hebrew locale so the OS
    // treats this app as RTL from the very first resource lookup.
    val config = Configuration(newBase.resources.configuration)
    val locale = Locale("he", "IL")
    Locale.setDefault(locale)
    config.setLocale(locale)
    config.setLayoutDirection(locale)
    super.attachBaseContext(newBase.createConfigurationContext(config))
  }
`;

function injectIntoMainActivity(src) {
  // Add primary I18nUtil import
  if (!src.includes('com.facebook.react.modules.i18nmanager.I18nUtil')) {
    src = src.replace(/(^import [^\n]+\n)(?![\s\S]*^import )/m, `$1${RTL_IMPORT}\n`);
  }
  // Add Configuration/Locale imports
  if (!src.includes('java.util.Locale')) {
    src = src.replace(/(^import [^\n]+\n)(?![\s\S]*^import )/m, `$1${RTL_CONFIG_IMPORTS}\n`);
  }
  // Strip prior injection if present
  src = src.replace(
    /\s*\/\/ \[withForceRTL\][\s\S]*?sharedI18nUtilInstance\.forceRTL\(applicationContext, true\)\n?/g,
    '\n',
  );
  src = src.replace(/\s*override fun attachBaseContext\(newBase: Context\) \{[\s\S]*?\n  \}\n/g, '\n');

  // Inject forceRTL at the very start of onCreate body (before setTheme).
  src = src.replace(
    /(override fun onCreate\(savedInstanceState: Bundle\?\) \{\n)/,
    `$1${RTL_CALL_KT}`,
  );

  // Inject attachBaseContext override right after the class opening brace
  src = src.replace(
    /(class MainActivity : ReactActivity\(\) \{\n)/,
    `$1${ATTACH_BASE_CONTEXT}`,
  );
  return src;
}

function injectIntoMainApplication(src) {
  if (!src.includes('com.facebook.react.modules.i18nmanager.I18nUtil')) {
    src = src.replace(/(^import [^\n]+\n)(?![\s\S]*^import )/m, `$1${RTL_IMPORT}\n`);
  }
  src = src.replace(
    /\s*\/\/ \[withForceRTL\][\s\S]*?sharedI18nUtilInstance\.forceRTL\(applicationContext, true\)\n?/g,
    '\n',
  );
  src = src.replace(
    /(super\.onCreate\(\)\n)/,
    `$1${RTL_CALL_KT}`,
  );
  return src;
}

const withForceRTL = (config) => {
  // 1. Patch MainActivity (force RTL + Hebrew locale via attachBaseContext)
  config = withMainActivity(config, async (cfg) => {
    cfg.modResults.contents = injectIntoMainActivity(cfg.modResults.contents);
    return cfg;
  });

  // 2. Patch MainApplication (force RTL before loadReactNative)
  config = withDangerousMod(config, [
    'android',
    async (cfg) => {
      const platformRoot = cfg.modRequest.platformProjectRoot;
      const candidates = [
        path.join(platformRoot, 'app/src/main/java/com/itzhakdvir/chavruta/MainApplication.kt'),
        path.join(platformRoot, 'app/src/main/java/com/itzhakdvir/chavruta/MainApplication.java'),
      ];
      for (const filePath of candidates) {
        if (fs.existsSync(filePath)) {
          let src = fs.readFileSync(filePath, 'utf8');
          src = injectIntoMainApplication(src);
          fs.writeFileSync(filePath, src);
        }
      }
      return cfg;
    },
  ]);

  // 3. Patch AndroidManifest.xml — set supportsRtl and layoutDirection on application
  config = withAndroidManifest(config, async (cfg) => {
    const application = cfg.modResults.manifest.application?.[0];
    if (application) {
      application.$['android:supportsRtl'] = 'true';
      application.$['android:layoutDirection'] = 'rtl';
    }
    return cfg;
  });

  return config;
};

module.exports = withForceRTL;
