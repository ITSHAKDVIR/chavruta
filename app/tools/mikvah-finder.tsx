import React, { useEffect, useMemo, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, TextInput, View, Pressable, Platform, Modal } from 'react-native';
import { KeyboardScroll } from '../../src/components/KeyboardScroll';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { Pill } from '../../src/components/Pill';
import { distanceKm, MIKVAOT, Mikvah } from '../../src/data/mikvaot';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

type SortCenter = { name: string; lat: number; lng: number };

export default function MikvahFinderScreen() {
  const router = useRouter();
  const [gpsLoc, setGpsLoc] = useState<SortCenter | null>(null);
  const [manualCity, setManualCity] = useState<SortCenter | null>(null);
  const [search, setSearch] = useState('');
  const [showCityPicker, setShowCityPicker] = useState(false);

  // GPS auto-detect on mount
  useEffect(() => {
    (async () => {
      if (Platform.OS === 'web') return;
      try {
        const Location: any = await import('expo-location');
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const pos = await Location.getLastKnownPositionAsync();
        if (pos) {
          setGpsLoc({ name: 'המיקום שלי (GPS)', lat: pos.coords.latitude, lng: pos.coords.longitude });
        }
      } catch {}
    })();
  }, []);

  // Active sort center: manual city overrides GPS if set
  const sortCenter = manualCity ?? gpsLoc;

  // Unique cities for the city picker
  const cities = useMemo(() => {
    const set = new Map<string, SortCenter>();
    for (const m of MIKVAOT) {
      if (!set.has(m.city)) {
        // Use the first mikvah of that city as the city center
        set.set(m.city, { name: m.city, lat: m.lat, lng: m.lng });
      }
    }
    return Array.from(set.values()).sort((a, b) => a.name.localeCompare(b.name, 'he'));
  }, []);

  // Filter + sort
  const list = useMemo(() => {
    const q = search.trim();
    const filtered = q
      ? MIKVAOT.filter((m) =>
          `${m.name} ${m.city} ${m.address}`.toLowerCase().includes(q.toLowerCase()),
        )
      : MIKVAOT;
    if (sortCenter) {
      return [...filtered]
        .map((m) => ({ ...m, dist: distanceKm(sortCenter.lat, sortCenter.lng, m.lat, m.lng) }))
        .sort((a, b) => a.dist - b.dist);
    }
    return [...filtered].sort((a, b) => a.city.localeCompare(b.city, 'he'));
  }, [search, sortCenter]);

  function openWaze(m: Mikvah) {
    const url = `waze://?ll=${m.lat},${m.lng}&navigate=yes`;
    const fallback = `https://waze.com/ul?ll=${m.lat}%2C${m.lng}&navigate=yes`;
    Linking.openURL(url).catch(() => Linking.openURL(fallback));
  }

  function pickCity(c: SortCenter) {
    setManualCity(c);
    setShowCityPicker(false);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={[typography.bodyBold, { color: colors.primary }]}>‹ חזרה</Text>
        </Pressable>
      </View>
      <ScreenHeader
        title="מאתר מקווה"
        subtitle={
          sortCenter
            ? `ממוין לפי קרבה ל${sortCenter.name}`
            : `${list.length} מקוואות בכל הארץ`
        }
      />

      <View style={{ paddingHorizontal: spacing.lg, gap: spacing.sm }}>
        <View style={styles.searchRow}>
          <Text style={{ fontSize: 14 }}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="חפש לפי שם / עיר / כתובת"
            placeholderTextColor={colors.textMuted}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')} hitSlop={10}>
              <Text style={{ color: colors.textMuted, fontSize: 18 }}>✕</Text>
            </Pressable>
          )}
        </View>

        <View style={{ flexDirection: 'row-reverse', gap: spacing.sm, alignItems: 'center' }}>
          <Pressable
            onPress={() => setShowCityPicker(true)}
            style={styles.cityBtn}
          >
            <Text style={[typography.bodyBold, { color: colors.primary }]}>
              📍 בחר עיר ({manualCity ? manualCity.name : 'אוטומטי GPS'})
            </Text>
          </Pressable>
          {manualCity && (
            <Pressable onPress={() => setManualCity(null)} hitSlop={10}>
              <Text style={{ color: colors.danger, fontSize: 18 }}>✕</Text>
            </Pressable>
          )}
        </View>
      </View>

      <KeyboardScroll contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing.sm, gap: spacing.sm }}>
        {list.length === 0 && (
          <Card variant="accent">
            <Text style={[typography.body, { color: colors.primaryDark }]}>
              לא נמצאו מקוואות לחיפוש "{search}".
            </Text>
          </Card>
        )}
        {list.map((m: any) => (
          <Card key={`${m.name}-${m.city}-${m.address}`}>
            <View
              style={{
                flexDirection: 'row-reverse',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={[typography.h3, { color: colors.textPrimary }]}>💧 {m.name}</Text>
                <Text style={[typography.body, { color: colors.primary, marginTop: 2 }]}>{m.city}</Text>
                <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>
                  📍 {m.address}
                </Text>
                <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>
                  🕒 {m.hours}
                </Text>
                <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2, fontStyle: 'italic' }]}>
                  בהשגחת {m.supervisedBy}
                </Text>
              </View>
              {m.dist !== undefined && (
                <Pill
                  label={m.dist < 1 ? `${(m.dist * 1000).toFixed(0)} מ׳` : `${m.dist.toFixed(1)} ק"מ`}
                  tone="default"
                />
              )}
            </View>
            <View style={{ flexDirection: 'row-reverse', gap: spacing.sm, marginTop: spacing.sm }}>
              <Button label="🧭 ניווט בWaze" onPress={() => openWaze(m)} variant="primary" style={{ flex: 1 }} />
              {m.phone && (
                <Button
                  label={`📞 ${m.phone}`}
                  onPress={() => Linking.openURL(`tel:${m.phone}`)}
                  variant="secondary"
                  style={{ flex: 1 }}
                />
              )}
            </View>
          </Card>
        ))}
      </KeyboardScroll>

      <Modal
        animationType="slide"
        transparent
        visible={showCityPicker}
        onRequestClose={() => setShowCityPicker(false)}
      >
        <Pressable style={styles.modalBg} onPress={() => setShowCityPicker(false)}>
          <Pressable style={styles.modalBox} onPress={(e) => e.stopPropagation?.()}>
            <Text style={[typography.h2, { color: colors.textPrimary, marginBottom: spacing.md }]}>
              בחר עיר לחיפוש
            </Text>
            <ScrollView style={{ maxHeight: 400 }} nestedScrollEnabled={true}>
              {gpsLoc && (
                <Pressable
                  onPress={() => pickCity(gpsLoc)}
                  style={[styles.cityRow, { backgroundColor: colors.surfaceAlt }]}
                >
                  <Text style={[typography.bodyBold, { color: colors.primary }]}>📍 מיקום GPS</Text>
                </Pressable>
              )}
              {cities.map((c) => (
                <Pressable
                  key={c.name}
                  onPress={() => pickCity(c)}
                  style={styles.cityRow}
                >
                  <Text style={[typography.body, { color: colors.textPrimary }]}>{c.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Button label="ביטול" onPress={() => setShowCityPicker(false)} variant="secondary" />
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: { padding: spacing.lg },
  searchRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
    padding: 0,
    margin: 0,
  },
  cityBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    maxHeight: '85%',
  },
  cityRow: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
});
