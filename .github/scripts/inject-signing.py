"""Inject a release signingConfig + buildType wiring into the Expo-generated
android/app/build.gradle.

The Expo prebuild output has a `signingConfigs { debug { ... } }` block and a
`buildTypes { release { signingConfig signingConfigs.debug } }`. We:
  1. Add a `release { ... }` entry inside `signingConfigs { }` referring to
     release.jks + env-var credentials.
  2. Switch the `release` buildType's signingConfig from `.debug` to `.release`.

Idempotent — if release.jks is already mentioned in the file, we skip step 1.
"""
import re
import sys


INJECT = """
        release {
            storeFile file('release.jks')
            storePassword System.getenv('RELEASE_STORE_PASSWORD')
            keyAlias System.getenv('RELEASE_KEY_ALIAS')
            keyPassword System.getenv('RELEASE_KEY_PASSWORD')
        }"""


def patch(path: str) -> None:
    with open(path) as f:
        src = f.read()

    if 'release.jks' not in src:
        # Inject release entry right after the opening of the signingConfigs block.
        src = re.sub(r'(signingConfigs\s*\{)', r'\1' + INJECT, src, count=1)

    # Switch release buildType to use the release signing config. This
    # matches both the common spaces-only form and any tab indentation.
    src = src.replace(
        'signingConfig signingConfigs.debug',
        'signingConfig signingConfigs.release',
    )

    with open(path, 'w') as f:
        f.write(src)

    print(f'Patched {path}')


if __name__ == '__main__':
    patch(sys.argv[1])
