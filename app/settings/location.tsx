import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View, Pressable } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DEFAULT_LOCATIONS_BY_REGION, REGION_LABELS, LocationRegion, StoredLocation } from '../../src/data/hebcal';
import { useLocation, detectCurrentLocation } from '../../src/hooks/useLocation';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

function normalize(s: string): string {
  return s
    .replace(/[֑-ׇ]/g, '')
    .replace(/ך/g, 'כ').replace(/ם/g, 'מ').replace(/ן/g, 'נ').replace(/ף/g, 'פ').replace(/ץ/g, 'צ')
    .toLowerCase()
    .trim();
}

export default function LocationSettings() {
  const router = useRouter();
  const { location, setLocation } = useLocation();
  const [query, setQuery] = useState('');
  const [detecting, setDetecting] = useState(false);

  const choose = async (loc: StoredLocation) => {
    await setLocation(loc);
    router.back();
  };

  const autoDetect = async () => {
    setDetecting(true);
    const loc = await detectCurrentLocation();
    setDetecting(false);
    if (loc) await choose(loc);
  };

  const normalizedQuery = useMemo(() => normalize(query), [query]);

  // Group locations by region
  const grouped = useMemo(() => {
    const groups: Record<string, typeof DEFAULT_LOCATIONS_BY_REGION> = {};
    for (const loc of DEFAULT_LOCATIONS_BY_REGION) {
      if (normalizedQuery && !normalize(loc.name).includes(normalizedQuery)) continue;
      const key = loc.region;
      if (!groups[key]) groups[key] = [];
      groups[key].push(loc);
    }
    return groups;
  }, [normalizedQuery]);

  const totalMatches = Object.values(grouped).reduce((sum, arr) => sum + arr.length, 0);

  // Region display order
  const REGION_ORDER: LocationRegion[] = [
    'israel-jerusalem',
    'israel-center',
    'israel-north',
    'israel-south',
    'israel-judea',
    'us-east',
    'us-other',
    'europe',
    'americas',
    'africa',
    'asia-oceania',
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={[typography.bodyBold, { color: colors.primary }]}>‹ חזרה</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }} keyboardShouldPersistTaps="handled">
        <ScreenHeader
          title="בחר מיקום"
          subtitle={query ? `${totalMatches} תוצאות` : `${DEFAULT_LOCATIONS_BY_REGION.length} ערים בארץ ובחו"ל`}
        />

        {/* GPS auto-detect */}
        <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.md }}>
          <Pressable
            onPress={autoDetect}
            disabled={detecting}
            style={({ pressed }) => [
              styles.gpsBtn,
              pressed && { opacity: 0.7 },
              detecting && { opacity: 0.5 },
            ]}
          >
            <Text style={styles.gpsIcon}>📍</Text>
            <Text style={[typography.bodyBold, { color: colors.textInverse, flex: 1, textAlign: 'right' }]}>
              {detecting ? 'מאתר מיקום...' : 'זהה את המיקום שלי אוטומטית'}
            </Text>
          </Pressable>
        </View>

        {/* Search */}
        <View style={styles.searchWrap}>
          <View style={styles.searchBox}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="חפש עיר (לדוגמה: ירושלים, ברוקלין, פריז)"
              placeholderTextColor={colors.textMuted}
              style={styles.searchInput}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery('')} hitSlop={10}>
                <Text style={styles.clearIcon}>✕</Text>
              </Pressable>
            )}
          </View>
        </View>

        {query && totalMatches === 0 && (
          <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.lg }}>
            <Text style={[typography.body, { color: colors.textMuted, textAlign: 'center' }]}>
              לא נמצאה עיר תואמת ל-"{query}"
            </Text>
          </View>
        )}

        {REGION_ORDER.map((region) => {
          const list = grouped[region];
          if (!list || list.length === 0) return null;
          return (
            <View key={region} style={styles.regionBlock}>
              <Text style={[typography.h3, styles.regionTitle]}>{REGION_LABELS[region]}</Text>
              <View style={styles.list}>
                {list.map((loc) => {
                  const selected = loc.name === location.name;
                  return (
                    <Pressable
                      key={loc.name}
                      onPress={() => choose(loc)}
                      style={({ pressed }) => [
                        styles.row,
                        selected && styles.rowSelected,
                        pressed && !selected && { backgroundColor: colors.surfaceAlt },
                      ]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[typography.bodyBold, { color: selected ? colors.textInverse : colors.textPrimary }]}>
                          {loc.name}
                        </Text>
                        <Text
                          style={[
                            typography.caption,
                            {
                              color: selected ? colors.textInverse : colors.textMuted,
                              opacity: selected ? 0.85 : 1,
                              marginTop: 2,
                            },
                          ]}
                        >
                          {loc.latitude.toFixed(2)}°, {loc.longitude.toFixed(2)}° · {loc.timezone}
                        </Text>
                      </View>
                      {selected && <Text style={{ color: colors.textInverse, fontSize: 18 }}>✓</Text>}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: { padding: spacing.lg },
  gpsBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  gpsIcon: { fontSize: 22 },
  searchWrap: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  searchBox: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  searchIcon: { fontSize: 18 },
  clearIcon: { fontSize: 18, color: colors.textMuted, paddingHorizontal: 4 },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
    textAlign: 'right',
    paddingVertical: 4,
  },
  regionBlock: {
    marginTop: spacing.md,
    marginHorizontal: spacing.lg,
  },
  regionTitle: {
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  list: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowSelected: { backgroundColor: colors.primary },
});
