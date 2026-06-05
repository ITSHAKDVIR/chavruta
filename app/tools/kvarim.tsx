import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable, TextInput, Linking } from 'react-native';
import { KeyboardScroll } from '../../src/components/KeyboardScroll';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { Pill } from '../../src/components/Pill';
import { KVAREI_TZADIKIM, TFILA_BAKEVER, REGIONS } from '../../src/data/kvarim';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

export default function KvarimScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState<string>('all');
  const [showTfila, setShowTfila] = useState(false);

  const filtered = useMemo(() => {
    let list = KVAREI_TZADIKIM;
    if (region !== 'all') list = list.filter((k) => k.region === region);
    const q = search.trim();
    if (q) {
      list = list.filter(
        (k) => k.name.includes(q) || k.description.includes(q) || k.location.includes(q),
      );
    }
    return list;
  }, [search, region]);

  function openInWaze(lat: number, lng: number, name: string) {
    const url = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes&name=${encodeURIComponent(name)}`;
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
    });
  }

  function openInGoogleMaps(lat: number, lng: number) {
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={[typography.bodyBold, { color: colors.primary }]}>‹ חזרה</Text>
        </Pressable>
        <Pressable onPress={() => setShowTfila(!showTfila)} hitSlop={10}>
          <Text style={[typography.bodyBold, { color: colors.primary }]}>
            {showTfila ? 'הסתר תפילה' : 'תפילה'}
          </Text>
        </Pressable>
      </View>
      <KeyboardScroll contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <ScreenHeader title="קברי צדיקים" subtitle="ניווט + תפילה במקום" />

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          {showTfila && (
            <Card variant="accent">
              <Text style={[typography.h3, { color: colors.primaryDark, marginBottom: spacing.sm }]}>
                תפילה בקבר הצדיק
              </Text>
              <Text style={[typography.sacred, { color: colors.primaryDark }]}>{TFILA_BAKEVER}</Text>
            </Card>
          )}

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="חיפוש - שם / מיקום..."
            placeholderTextColor={colors.textMuted}
            style={styles.search}
            textAlign="right"
          />

          <View style={{ flexDirection: 'row-reverse', gap: 4, flexWrap: 'wrap' }}>
            <Pressable onPress={() => setRegion('all')} style={[styles.regionChip, region === 'all' && styles.regionChipActive]}>
              <Text style={[typography.body, { color: region === 'all' ? colors.textInverse : colors.textPrimary }]}>הכל ({KVAREI_TZADIKIM.length})</Text>
            </Pressable>
            {REGIONS.map((r) => {
              const count = KVAREI_TZADIKIM.filter((k) => k.region === r.id).length;
              if (count === 0) return null;
              return (
                <Pressable key={r.id} onPress={() => setRegion(r.id)} style={[styles.regionChip, region === r.id && styles.regionChipActive]}>
                  <Text style={[typography.body, { color: region === r.id ? colors.textInverse : colors.textPrimary }]}>
                    {r.label} ({count})
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {filtered.map((k) => (
            <Card key={k.id}>
              <Text style={[typography.h3, { color: colors.textPrimary }]}>{k.name}</Text>
              <Text style={[typography.body, { color: colors.textSecondary, marginTop: 4 }]}>{k.description}</Text>
              <View style={{ flexDirection: 'row-reverse', gap: spacing.sm, marginTop: spacing.sm, flexWrap: 'wrap' }}>
                <Pill label={`📍 ${k.location}`} tone="default" />
                {k.yahrtzeit ? <Pill label={`🕯️ ${k.yahrtzeit}`} tone="accent" /> : null}
              </View>
              <Text style={[typography.small, { color: colors.textMuted, marginTop: spacing.sm, fontStyle: 'italic' }]}>
                {k.significance}
              </Text>
              {k.specialPrayer && (
                <View style={styles.prayerBox}>
                  <Text style={[typography.bodyBold, { color: colors.primary, marginBottom: 4 }]}>📿 תפילה / מנהג מיוחד למקום:</Text>
                  <Text style={[typography.body, { color: colors.textPrimary }]}>{k.specialPrayer}</Text>
                </View>
              )}
              <View style={{ flexDirection: 'row-reverse', gap: spacing.sm, marginTop: spacing.md }}>
                <Button label="🗺️ Waze" onPress={() => openInWaze(k.latitude, k.longitude, k.name)} variant="secondary" style={{ flex: 1 }} fullWidth />
                <Button label="🌍 מפות" onPress={() => openInGoogleMaps(k.latitude, k.longitude)} variant="secondary" style={{ flex: 1 }} fullWidth />
              </View>
            </Card>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </KeyboardScroll>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: { padding: spacing.lg, flexDirection: 'row-reverse', justifyContent: 'space-between' },
  search: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 16,
    color: colors.textPrimary,
  },
  regionChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  regionChipActive: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
  prayerBox: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
