import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon } from '../../src/components/Icon';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { ParchmentText } from '../../src/components/ParchmentText';
import { TFILOT } from '../../src/data/tfilot';
import { buildBirkatHamazon, buildShevaBrachot, buildBritMilahBirkatHamazon, getActiveInsertLabels } from '../../src/data/birkatHamazon';
import { useLocation } from '../../src/hooks/useLocation';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

export default function TfilaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const tfila = TFILOT.find((t) => t.id === String(id));
  const { location } = useLocation();

  const isBirkatHamazon = String(id) === 'birkat-hamazon-short';
  const isShevaBrachot = String(id) === 'birkat-hamazon-sheva-brachot';
  const useSegments = isBirkatHamazon || isShevaBrachot;
  const inIsrael = location?.timezone?.startsWith('Asia/Jerusalem') ?? true;

  // User-toggleable occasion modes for the main BHM screen. Sheva Brachot has
  // its own dedicated id (links from Chuppah), so when that id is open we lock
  // the toggle on. Brit Milah is always opt-in.
  const [britMilahMode, setBritMilahMode] = useState(false);
  const [shevaBrachotMode, setShevaBrachotMode] = useState(isShevaBrachot);

  const bhSegments = useMemo(
    () => {
      if (shevaBrachotMode || isShevaBrachot) return buildShevaBrachot(new Date(), inIsrael);
      if (britMilahMode) return buildBritMilahBirkatHamazon(new Date(), inIsrael);
      if (isBirkatHamazon) return buildBirkatHamazon(new Date(), inIsrael);
      return [];
    },
    [isBirkatHamazon, isShevaBrachot, britMilahMode, shevaBrachotMode, inIsrael],
  );
  const bhActiveLabels = useMemo(
    () => (isBirkatHamazon ? getActiveInsertLabels(new Date(), inIsrael) : []),
    [isBirkatHamazon, inIsrael],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={['#0a1f3d', '#1e3a5f', '#2c5282']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill as any}
      />
      {/* Glow orb removed per user feedback. */}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Icon name="chevronRight" size={20} color={colors.primary} />
          <Text style={[typography.bodyBold, { color: colors.primary }]}>חזרה</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        {tfila ? (
          <>
            <ScreenHeader title={tfila.title} subtitle={tfila.when} />
            <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
              {useSegments ? (
                <>
                  {isBirkatHamazon && (
                    <Card>
                      <Text style={[typography.bodyBold, { color: colors.textPrimary, marginBottom: spacing.sm }]}>
                        ➕ הוספות לפי מאורע
                      </Text>
                      <View style={{ flexDirection: 'row-reverse', gap: spacing.sm, flexWrap: 'wrap' }}>
                        <Pressable
                          onPress={() => { setBritMilahMode(!britMilahMode); setShevaBrachotMode(false); }}
                          style={[styles.toggleBtn, britMilahMode && styles.toggleBtnActive]}
                        >
                          <Text style={[typography.bodyBold, { color: britMilahMode ? colors.textInverse : colors.textPrimary }]}>
                            {britMilahMode ? '✓ ' : ''}🪔 ברית מילה
                          </Text>
                        </Pressable>
                        <Pressable
                          onPress={() => { setShevaBrachotMode(!shevaBrachotMode); setBritMilahMode(false); }}
                          style={[styles.toggleBtn, shevaBrachotMode && styles.toggleBtnActive]}
                        >
                          <Text style={[typography.bodyBold, { color: shevaBrachotMode ? colors.textInverse : colors.textPrimary }]}>
                            {shevaBrachotMode ? '✓ ' : ''}💒 שבע ברכות
                          </Text>
                        </Pressable>
                      </View>
                      <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm }]}>
                        בחר מאורע — הוספות מיוחדות יופיעו בנוסח (הרחמן + פסוקים נוספים).
                      </Text>
                    </Card>
                  )}
                  {bhActiveLabels.length > 0 && (
                    <Card variant="accent">
                      <Text style={[typography.bodyBold, { color: colors.primaryDark, marginBottom: 4 }]}>
                        ✨ תוספות להיום:
                      </Text>
                      <Text style={[typography.body, { color: colors.primaryDark }]}>
                        {bhActiveLabels.join(' • ')}
                      </Text>
                      <Text style={[typography.caption, { color: colors.primaryDark, marginTop: spacing.xs, opacity: 0.8 }]}>
                        התוספות משולבות בנוסח למטה ומסומנות במסגרת צהובה.
                      </Text>
                    </Card>
                  )}
                  {bhSegments.map((seg) => (
                    <View key={seg.id}>
                      {seg.conditional ? (
                        <ParchmentText
                          sectionName={seg.header || undefined}
                          instruction={`✨ ${seg.conditional.label}`}
                          textSize={18}
                        >
                          {seg.text}
                        </ParchmentText>
                      ) : (
                        <ParchmentText
                          sectionName={seg.header || undefined}
                          textSize={19}
                        >
                          {seg.text}
                        </ParchmentText>
                      )}
                    </View>
                  ))}
                </>
              ) : (
                <ParchmentText textSize={20}>
                  {tfila.text}
                </ParchmentText>
              )}
            </View>
          </>
        ) : (
          <ScreenHeader title="לא נמצא" />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  toggleBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    flexGrow: 1,
    minWidth: 130,
    alignItems: 'center',
  },
  toggleBtnActive: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
  safe: { flex: 1, backgroundColor: colors.bg },
  glow: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: colors.glowGold,
    opacity: 0.35,
  },
  topBar: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md },
  backBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-end',
  },
});
