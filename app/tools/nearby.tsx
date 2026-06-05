import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable, ActivityIndicator, Linking, Alert } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { Pill } from '../../src/components/Pill';
import { findNearbyPlaces, Place } from '../../src/services/overpass';
import { useLocation } from '../../src/hooks/useLocation';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

type Filter = 'all' | 'synagogue' | 'mikveh';

export default function NearbyScreen() {
  const router = useRouter();
  const { location } = useLocation();
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [searchRadius, setSearchRadius] = useState(3);
  const [usedGPS, setUsedGPS] = useState(false);

  async function search(useGPS: boolean) {
    setLoading(true);
    setError(null);
    let lat = location.latitude;
    let lng = location.longitude;
    if (useGPS) {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('הרשאת מיקום נדחתה. משתמש בעיר השמורה.');
        } else {
          const last = await Location.getLastKnownPositionAsync();
          const pos = last ?? (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
          setUsedGPS(true);
        }
      } catch (e: any) {
        setError(`שגיאת GPS: ${e?.message ?? e}`);
      }
    } else {
      setUsedGPS(false);
    }
    try {
      const result = await findNearbyPlaces(lat, lng, searchRadius);
      setPlaces(result);
      if (result.length === 0) setError('לא נמצאו תוצאות. נסה רדיוס גדול יותר.');
    } catch (e: any) {
      setError(`שגיאת חיפוש: ${e?.message ?? e}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    search(false);
  }, []);

  const filtered = filter === 'all' ? places : places.filter((p) => p.type === filter);

  function openWaze(p: Place) {
    const url = `https://waze.com/ul?ll=${p.latitude},${p.longitude}&navigate=yes&name=${encodeURIComponent(p.name)}`;
    Linking.openURL(url).catch(() =>
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${p.latitude},${p.longitude}`),
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={[typography.bodyBold, { color: colors.primary }]}>‹ חזרה</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <ScreenHeader title="חיפוש קרוב" subtitle="בתי כנסת + מקוואות לפי מיקום" />

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          <Card>
            <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>
              {usedGPS ? '📍 לפי GPS' : `📍 ${location.name}`}
            </Text>
            <View style={{ flexDirection: 'row-reverse', gap: spacing.sm, marginTop: spacing.sm }}>
              <Button label="🛰️ השתמש ב-GPS" onPress={() => search(true)} variant="secondary" style={{ flex: 1 }} />
              <Button label="🔍 חפש שוב" onPress={() => search(usedGPS)} style={{ flex: 1 }} />
            </View>
            <Text style={[typography.small, { color: colors.textMuted, marginTop: spacing.sm }]}>
              רדיוס: {searchRadius} ק"מ
            </Text>
            <View style={{ flexDirection: 'row-reverse', gap: 6, marginTop: 4 }}>
              {[1, 3, 5, 10, 20].map((r) => (
                <Pressable
                  key={r}
                  onPress={() => setSearchRadius(r)}
                  style={[styles.chip, searchRadius === r && styles.chipActive]}
                >
                  <Text style={[typography.caption, { color: searchRadius === r ? colors.textInverse : colors.textPrimary }]}>
                    {r} ק"מ
                  </Text>
                </Pressable>
              ))}
            </View>
          </Card>

          <View style={{ flexDirection: 'row-reverse', gap: spacing.sm }}>
            <Pressable onPress={() => setFilter('all')} style={[styles.tab, filter === 'all' && styles.tabActive]}>
              <Text style={[typography.bodyBold, { color: filter === 'all' ? colors.textInverse : colors.textPrimary }]}>הכל ({places.length})</Text>
            </Pressable>
            <Pressable onPress={() => setFilter('synagogue')} style={[styles.tab, filter === 'synagogue' && styles.tabActive]}>
              <Text style={[typography.bodyBold, { color: filter === 'synagogue' ? colors.textInverse : colors.textPrimary }]}>
                בתי כנסת ({places.filter((p) => p.type === 'synagogue').length})
              </Text>
            </Pressable>
            <Pressable onPress={() => setFilter('mikveh')} style={[styles.tab, filter === 'mikveh' && styles.tabActive]}>
              <Text style={[typography.bodyBold, { color: filter === 'mikveh' ? colors.textInverse : colors.textPrimary }]}>
                מקוואות ({places.filter((p) => p.type === 'mikveh').length})
              </Text>
            </Pressable>
          </View>

          {loading && (
            <View style={{ padding: spacing.xl, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[typography.body, { color: colors.textMuted, marginTop: spacing.md }]}>מחפש...</Text>
            </View>
          )}

          {error && !loading && (
            <Card><Text style={[typography.body, { color: colors.textSecondary }]}>{error}</Text></Card>
          )}

          {!loading && filtered.length > 0 && (
            filtered.map((p) => (
              <Card key={p.id}>
                <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.md }}>
                  <Text style={{ fontSize: 32 }}>{p.type === 'mikveh' ? '💧' : '🕍'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.h3, { color: colors.textPrimary }]}>{p.name}</Text>
                    <View style={{ flexDirection: 'row-reverse', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                      <Pill label={`${p.distanceKm.toFixed(2)} ק"מ`} tone="primary" />
                      {p.tags.denomination ? <Pill label={translateDenomination(p.tags.denomination)} tone="default" /> : null}
                      {p.tags['wheelchair'] === 'yes' ? <Pill label="♿" tone="default" /> : null}
                    </View>
                  </View>
                </View>
                <View style={{ flexDirection: 'row-reverse', gap: spacing.sm, marginTop: spacing.md }}>
                  <Button label="🗺️ נווט" onPress={() => openWaze(p)} variant="secondary" fullWidth style={{ flex: 1 }} />
                </View>
              </Card>
            ))
          )}

          <Text style={[typography.caption, { color: colors.textMuted, textAlign: 'center', marginTop: spacing.md }]}>
            נתונים: OpenStreetMap (CC-BY-SA)
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function translateDenomination(d: string): string {
  const map: Record<string, string> = {
    orthodox: 'אורתודוקסי',
    'haredi': 'חרדי',
    'haredim': 'חרדי',
    'modern_orthodox': 'דתי לאומי',
    'religious_zionist': 'דתי לאומי',
    'national_religious': 'דתי לאומי',
    conservative: 'קונסרבטיבי',
    masorti: 'מסורתי',
    reform: 'רפורמי',
    chabad: 'חב"ד',
    'ḥabad': 'חב"ד',
    chasidic: 'חסידי',
    hasidic: 'חסידי',
    chassidic: 'חסידי',
    yemenite: 'תימני',
    teimani: 'תימני',
    ashkenazi: 'אשכנז',
    sephardic: 'ספרד',
    sephardi: 'ספרד',
    sefardi: 'ספרד',
    'eidot_mizrach': 'עדות מזרח',
    edah_charedi: 'עדה החרדית',
    breslov: 'ברסלב',
    karlin: 'קרלין',
    ger: 'גור',
    'belz': 'בעלז',
    satmar: 'סאטמר',
    vizhnitz: 'ויז\'ניץ',
    nusach_ari: 'נוסח האר"י',
    nusach_sefard: 'נוסח ספרד',
    nusach_ashkenaz: 'נוסח אשכנז',
  };
  const key = d.toLowerCase().replace(/[\s-]/g, '_');
  return map[key] || d;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: { padding: spacing.lg },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
});
