/**
 * App-wide menu — a comprehensive index of every screen and tool in the app,
 * with a search box at the top. Opened from the hamburger icon in BrandBar.
 *
 * Layout:
 *   - Header with back button + search box
 *   - "ניווט ראשי" section (the 5 main tabs + notifications + about)
 *   - All tool categories with their tools, grouped and collapsible
 */
import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Pressable,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon, IconName } from '../src/components/Icon';
import { Card } from '../src/components/Card';
import { TOOLS, CATEGORIES, Tool } from '../src/data/tools';
import { colors, radius, spacing } from '../src/theme/colors';
import { typography } from '../src/theme/typography';

type NavItem = { id: string; label: string; description?: string; icon: IconName; route: string };

const PRIMARY_NAV: NavItem[] = [
  { id: 'home', label: 'בית', description: 'מסך פתיחה — היום שלך', icon: 'home', route: '/(tabs)' },
  { id: 'learn', label: 'לימוד', description: 'הלכה יומית · משניות · ועוד', icon: 'book', route: '/(tabs)/learn' },
  { id: 'calendar', label: 'לוח שנה', description: 'תאריכים עבריים ומועדים', icon: 'calendar', route: '/(tabs)/calendar' },
  { id: 'tools', label: 'כלים', description: 'כל הכלים בקטגוריות', icon: 'wrench', route: '/(tabs)/tools' },
  { id: 'notifications', label: 'מרכז התראות', description: 'תזכורות, תפילות, יארצייט', icon: 'bell', route: '/settings/notifications' },
  { id: 'settings', label: 'הגדרות', description: 'מיקום, נוסח, גרסה', icon: 'settings', route: '/(tabs)/more' },
];

export default function AppMenuScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');

  // Filtered tools: match against title + description + category label.
  const matches = useMemo(() => {
    const q = search.trim();
    if (!q) return null;
    const ql = q.toLowerCase();
    return TOOLS.filter((t) =>
      t.title.includes(q) ||
      t.description.includes(q) ||
      t.title.toLowerCase().includes(ql) ||
      t.description.toLowerCase().includes(ql),
    );
  }, [search]);

  const navMatches = useMemo(() => {
    const q = search.trim();
    if (!q) return null;
    return PRIMARY_NAV.filter((n) => n.label.includes(q) || (n.description?.includes(q) ?? false));
  }, [search]);

  // Group tools by category
  const grouped = useMemo(() => {
    const list = matches ?? TOOLS;
    const byCat: Record<string, Tool[]> = {};
    for (const t of list) {
      (byCat[t.category] ??= []).push(t);
    }
    return CATEGORIES.filter((c) => byCat[c.id]?.length).map((c) => ({
      ...c,
      tools: byCat[c.id],
    }));
  }, [matches]);

  const go = (route: string) => router.push(route as any);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={['#0a1f3d', '#1e3a5f', '#2c5282']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill as any}
      />

      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Icon name="chevronRight" size={20} color={colors.primary} />
          <Text style={[typography.bodyBold, { color: colors.primary }]}>חזרה</Text>
        </Pressable>
        <Text style={[typography.h2, { color: colors.textPrimary }]}>תפריט אפליקציה</Text>
      </View>

      <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.sm }}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="חיפוש כלי או מסך..."
          placeholderTextColor={colors.textMuted}
          style={styles.search}
        />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        {/* Primary navigation (always shown unless search filters it out) */}
        {(!navMatches || navMatches.length > 0) && (
          <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.lg }}>
            <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.sm, textAlign: 'right' }]}>
              ניווט ראשי
            </Text>
            {(navMatches ?? PRIMARY_NAV).map((n) => (
              <Card key={n.id} onPress={() => go(n.route)}>
                <View style={styles.row}>
                  <Icon name={n.icon} size={24} color={colors.primary} strokeWidth={1.6} />
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.h3, { color: colors.textPrimary }]}>{n.label}</Text>
                    {n.description ? (
                      <Text style={[typography.small, { color: colors.textMuted, marginTop: 2 }]}>{n.description}</Text>
                    ) : null}
                  </View>
                  <Text style={{ color: colors.textMuted, fontSize: 20 }}>‹</Text>
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* Tools by category */}
        {grouped.length === 0 && search.trim() ? (
          <View style={{ padding: spacing.xl }}>
            <Text style={[typography.body, { color: colors.textMuted, textAlign: 'center' }]}>
              לא נמצאו תוצאות עבור "{search}"
            </Text>
          </View>
        ) : (
          grouped.map((cat) => (
            <View key={cat.id} style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.lg }}>
              <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.sm, textAlign: 'right' }]}>
                {cat.label}
              </Text>
              {cat.tools.map((t) => (
                <Card key={t.id} onPress={() => go(t.route)}>
                  <View style={styles.row}>
                    {t.iconName ? (
                      <Icon name={t.iconName as any} size={22} color={colors.primary} strokeWidth={1.6} />
                    ) : (
                      <Text style={{ fontSize: 22 }}>{t.emoji}</Text>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>{t.title}</Text>
                      <Text style={[typography.small, { color: colors.textMuted, marginTop: 2 }]}>{t.description}</Text>
                    </View>
                    <Text style={{ color: colors.textMuted, fontSize: 18 }}>‹</Text>
                  </View>
                </Card>
              ))}
            </View>
          ))
        )}

        <Text style={[typography.caption, { color: colors.textMuted, textAlign: 'center', marginTop: spacing.md }]}>
          סך הכל {TOOLS.length} כלים
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  backBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
  },
  search: {
    backgroundColor: colors.glass,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing.md,
    color: colors.textPrimary,
    fontSize: 15,
    textAlign: 'right',
  },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
  },
});
