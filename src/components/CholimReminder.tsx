/**
 * Floating reminder shown over Shemoneh-Esreh sections in the siddur:
 * "remember to daven for your cholim list". Tapping it scrolls/links to
 * the cholim tool so the user can review the names.
 *
 * Self-contained: reads the cholim list from storage on mount, hides itself
 * if the list is empty.
 */
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { getJSON, Keys } from '../storage/storage';
import { Icon } from './Icon';
import { colors, radius, spacing } from '../theme/colors';
import { typography } from '../theme/typography';

export function CholimReminder() {
  const router = useRouter();
  const [count, setCount] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    (async () => {
      const list = await getJSON<any[]>(Keys.cholimList, []);
      setCount(Array.isArray(list) ? list.length : 0);
    })();
  }, []);

  if (count === 0 || dismissed) return null;
  return (
    <Pressable
      style={styles.box}
      onPress={() => router.push('/tools/cholim' as any)}
    >
      <Icon name="heart" size={18} color={colors.primary} />
      <Text style={[typography.small, { color: colors.textPrimary, flex: 1 }]} numberOfLines={2}>
        זכרו ב<Text style={{ color: colors.primary, fontWeight: '700' }}>"רפאנו"</Text> להתפלל על
        {count === 1 ? ' חולה אחד' : ` ${count} חולים`} ברשימה
      </Text>
      <Pressable
        onPress={(e) => { e.stopPropagation(); setDismissed(true); }}
        hitSlop={10}
        style={styles.close}
      >
        <Icon name="close" size={14} color={colors.textMuted} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    backgroundColor: 'rgba(212,164,55,0.12)',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.glassBorderGold,
    marginVertical: spacing.sm,
  },
  close: { padding: 4 },
});
