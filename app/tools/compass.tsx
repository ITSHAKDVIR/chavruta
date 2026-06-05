import React, { useEffect, useRef, useState } from 'react';
import { Animated, Platform, ScrollView, StyleSheet, Text, View, Pressable, Easing } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { useLocation } from '../../src/hooks/useLocation';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

// Beit HaMikdash coordinates (Har HaBayit, Holy of Holies approximation)
const JERUSALEM_LAT = 31.7780;
const JERUSALEM_LNG = 35.2354;

/** Initial bearing from (lat1,lng1) to (lat2,lng2) in degrees (0=north, clockwise). */
function bearingTo(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const dLng = toRad(lng2 - lng1);
  const y = Math.sin(dLng) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/** Great-circle distance in km. */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export default function CompassScreen() {
  const router = useRouter();
  const { location: storedLocation } = useLocation();
  // Live GPS coords - prefer these. Fall back to stored location if GPS unavailable.
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [phoneHeading, setPhoneHeading] = useState<number | null>(null);
  const [headingAccuracy, setHeadingAccuracy] = useState<number | null>(null);
  const [sensorAvailable, setSensorAvailable] = useState<boolean | null>(null);
  const rotation = useRef(new Animated.Value(0)).current;

  // Effective coords: live GPS if available, otherwise stored location.
  const myLat = gpsCoords?.lat ?? storedLocation.latitude;
  const myLng = gpsCoords?.lng ?? storedLocation.longitude;
  const targetBearing = bearingTo(myLat, myLng, JERUSALEM_LAT, JERUSALEM_LNG);
  const distanceKm = haversineKm(myLat, myLng, JERUSALEM_LAT, JERUSALEM_LNG);

  // Acquire live GPS position (one-shot - compass user isn't moving)
  useEffect(() => {
    if (Platform.OS === 'web') return; // web uses DeviceOrientation only
    let mounted = true;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (mounted) setGpsError('אין הרשאת מיקום');
          return;
        }
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (mounted) setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      } catch (e) {
        if (mounted) setGpsError('לא ניתן לקבל GPS');
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Heading (compass direction the phone is pointing)
  useEffect(() => {
    if (Platform.OS === 'web') {
      // Try DeviceOrientation API on web
      const handler = (e: DeviceOrientationEvent) => {
        if (e.alpha !== null) {
          // alpha=0 means device pointing north (on Chrome/Firefox)
          // Some browsers use webkitCompassHeading on iOS Safari
          const compassHeading = (e as any).webkitCompassHeading ?? (360 - e.alpha);
          setPhoneHeading(compassHeading);
        }
      };
      if (typeof window !== 'undefined' && 'ondeviceorientation' in window) {
        window.addEventListener('deviceorientationabsolute', handler as any);
        window.addEventListener('deviceorientation', handler);
        setSensorAvailable(true);
        return () => {
          window.removeEventListener('deviceorientationabsolute', handler as any);
          window.removeEventListener('deviceorientation', handler);
        };
      }
      setSensorAvailable(false);
      return;
    }

    // Native: use expo-location's heading service - it returns true heading
    // (geographic north) which is what we need for bearing comparison.
    let sub: Location.LocationSubscription | null = null;
    let mounted = true;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (mounted) setSensorAvailable(false);
          return;
        }
        sub = await Location.watchHeadingAsync((h) => {
          // trueHeading is from geographic north (the one we want).
          // magHeading is from magnetic north. trueHeading is -1 if unknown.
          const heading = h.trueHeading >= 0 ? h.trueHeading : h.magHeading;
          if (heading >= 0) {
            setPhoneHeading(heading);
            setHeadingAccuracy(h.accuracy ?? null);
            setSensorAvailable(true);
          }
        });
      } catch {
        if (mounted) setSensorAvailable(false);
      }
    })();
    return () => {
      mounted = false;
      sub?.remove();
    };
  }, []);

  // Arrow angle: rotate dial-arrow so it points at Jerusalem regardless of phone facing.
  // arrowAngle = targetBearing - phoneHeading
  const arrowAngle = phoneHeading !== null ? (targetBearing - phoneHeading + 360) % 360 : targetBearing;

  // Animate rotation - use shortest path to avoid 0→359° spin
  useEffect(() => {
    const currentRaw = (rotation as any)._value ?? 0;
    let diff = arrowAngle - currentRaw;
    while (diff > 180) diff -= 360;
    while (diff < -180) diff += 360;
    Animated.timing(rotation, {
      toValue: currentRaw + diff,
      duration: 200,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [arrowAngle, rotation]);

  const rotateStyle = {
    transform: [
      {
        rotate: rotation.interpolate({
          inputRange: [-360, 0, 360, 720],
          outputRange: ['-360deg', '0deg', '360deg', '720deg'],
        }),
      },
    ],
  };

  // Cardinal labels rotate by -phoneHeading so "צ" always sits at true north on screen.
  // When no heading is available, leave them static.
  const dialRotation = phoneHeading !== null ? -phoneHeading : 0;
  const dialRotateStyle = { transform: [{ rotate: `${dialRotation}deg` }] };

  function bearingName(deg: number): string {
    if (deg < 22.5 || deg >= 337.5) return 'צפון';
    if (deg < 67.5) return 'צפון-מזרח';
    if (deg < 112.5) return 'מזרח';
    if (deg < 157.5) return 'דרום-מזרח';
    if (deg < 202.5) return 'דרום';
    if (deg < 247.5) return 'דרום-מערב';
    if (deg < 292.5) return 'מערב';
    return 'צפון-מערב';
  }

  const usingGps = gpsCoords !== null;
  // "Aligned" only when we actually have a heading AND the arrow is within ±8° of "up".
  // Need parentheses — `&&` binds tighter than `||`, so without them the second clause
  // fires even when phoneHeading is null.
  const aligned =
    phoneHeading !== null &&
    (Math.abs(arrowAngle) < 8 || Math.abs(arrowAngle - 360) < 8);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={[typography.bodyBold, { color: colors.primary }]}>‹ חזרה</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <ScreenHeader title="מצפן תפילה" subtitle={`כיוון לירושלים (בית המקדש)`} />

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          <Card>
            <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>הוראות:</Text>
            <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.sm }]}>
              ⊙ החזק את המכשיר אופקית, שטוח (לא אנכי){'\n'}
              ⊙ סובב את הגוף עד שהחץ מצביע למעלה אל "מ" (מקדש){'\n'}
              ⊙ הצד שאליו אתה פונה - הוא הכיוון לירושלים
            </Text>
          </Card>

          <View style={styles.compassWrap}>
            <View style={[styles.compassDial, aligned && styles.compassDialAligned]}>
              {/* Cardinal labels rotate with the dial so they show true direction.
                  Without a sensor, the labels are hidden because we can't know true north. */}
              {phoneHeading !== null && (
                <View style={[StyleSheet.absoluteFill, dialRotateStyle, { alignItems: 'center', justifyContent: 'center' }]}>
                  <Text style={[styles.cardinal, { top: 8 }]}>צ</Text>
                  <Text style={[styles.cardinal, { bottom: 8 }]}>ד</Text>
                  <Text style={[styles.cardinal, { right: 8, top: '46%' }]}>מז</Text>
                  <Text style={[styles.cardinal, { left: 8, top: '46%' }]}>מע</Text>
                </View>
              )}

              {/* Rotating arrow → points to Jerusalem */}
              <Animated.View style={[styles.arrowContainer, rotateStyle]}>
                <Text style={[styles.arrow, aligned && { color: colors.success }]}>▲</Text>
                <View style={[styles.arrowStem, aligned && { backgroundColor: colors.success }]} />
                <Text style={[styles.mikdashLabel, aligned && { color: colors.success }]}>מ</Text>
              </Animated.View>
            </View>
            {aligned ? (
              <Text style={[typography.bodyBold, { color: colors.success, marginTop: spacing.sm, textAlign: 'center' }]}>
                ✓ אתה פונה לירושלים
              </Text>
            ) : (
              <Text style={[typography.small, { color: colors.textMuted, marginTop: spacing.sm, textAlign: 'center', fontStyle: 'italic' }]}>
                סובב את הגוף עד שהחץ והאות "מ" יהפכו לירוק — רק אז אתה מכוון נכון.
              </Text>
            )}
            {phoneHeading === null && (
              <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm, textAlign: 'center' }]}>
                ⚙ אין מצפן זמין - תוויות הכיוונים מוסתרות כי לא ניתן לדעת איפה הצפון
              </Text>
            )}
          </View>

          <Card variant="primary">
            <Text style={[typography.small, { color: colors.textPrimary, opacity: 0.85, textAlign: 'center' }]}>
              כיוון לירושלים מהמיקום שלך
            </Text>
            <Text style={[typography.h1, { color: colors.textPrimary, marginTop: 4, textAlign: 'center' }]}>
              {Math.round(targetBearing)}° · {bearingName(targetBearing)}
            </Text>
            <Text style={[typography.small, { color: colors.textPrimary, opacity: 0.85, marginTop: spacing.sm, textAlign: 'center' }]}>
              מרחק: {distanceKm < 1 ? '< 1' : Math.round(distanceKm)} ק"מ מבית המקדש
            </Text>
            <Text style={[typography.caption, { color: colors.textPrimary, opacity: 0.7, marginTop: 4, textAlign: 'center' }]}>
              {usingGps ? '📍 GPS חי' : `🏠 ${storedLocation.name} (מיקום שמור)`}
            </Text>
            {phoneHeading !== null && (
              <Text style={[typography.caption, { color: colors.textPrimary, opacity: 0.7, marginTop: 4, textAlign: 'center' }]}>
                המכשיר מצביע ל-{Math.round(phoneHeading)}°
                {headingAccuracy !== null && headingAccuracy >= 0 && headingAccuracy < 2 && ' · דיוק נמוך - כייל מצפן'}
              </Text>
            )}
          </Card>

          {gpsError && (
            <Card variant="accent">
              <Text style={[typography.bodyBold, { color: colors.primaryDark }]}>{gpsError}</Text>
              <Text style={[typography.body, { color: colors.primaryDark, opacity: 0.85, marginTop: spacing.sm }]}>
                משתמש במיקום השמור: {storedLocation.name}
              </Text>
            </Card>
          )}

          {sensorAvailable === false && (
            <Card variant="accent">
              <Text style={[typography.bodyBold, { color: colors.primaryDark }]}>מצפן לא זמין</Text>
              <Text style={[typography.body, { color: colors.primaryDark, opacity: 0.85, marginTop: spacing.sm }]}>
                {Platform.OS === 'web'
                  ? 'הדפדפן/מחשב לא תומך באוריינטציה. ב-iOS יש לאפשר חיישנים בהגדרות. במחשב - השתמש בכיוון הסטטי לעיל.'
                  : 'אין חיישן מצפן זמין במכשיר. השתמש בכיוון הסטטי לעיל.'}
              </Text>
            </Card>
          )}

          <Card>
            <Text style={[typography.h3, { color: colors.textPrimary }]}>הלכה</Text>
            <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.sm }]}>
              ⊙ <Text style={{ fontWeight: '700' }}>בעמידה</Text> - פונים לכיוון ירושלים, וירושלים פונה לבית המקדש.{'\n\n'}
              ⊙ <Text style={{ fontWeight: '700' }}>בא"י</Text> מצפון לירושלים - מתפללים דרומה.{'\n'}
              ⊙ <Text style={{ fontWeight: '700' }}>בא"י</Text> מדרום - צפונה.{'\n'}
              ⊙ <Text style={{ fontWeight: '700' }}>בחו"ל</Text> רוב הגלויות פונות מזרחה (לכן "מזרח" בבית הכנסת).
            </Text>
          </Card>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: { padding: spacing.lg },
  compassWrap: { alignItems: 'center', paddingVertical: spacing.lg },
  compassDial: {
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: colors.surface,
    borderWidth: 3,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  compassDialAligned: {
    borderColor: colors.success,
    borderWidth: 4,
  },
  cardinal: {
    position: 'absolute',
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  arrowContainer: {
    width: 60,
    height: 200,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  arrow: {
    fontSize: 48,
    color: colors.primary,
    marginTop: -10,
  },
  arrowStem: {
    width: 8,
    height: 110,
    backgroundColor: colors.primary,
    marginTop: -8,
    borderRadius: 4,
  },
  mikdashLabel: {
    position: 'absolute',
    top: -22,
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
});
