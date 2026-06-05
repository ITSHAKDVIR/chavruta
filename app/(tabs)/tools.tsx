import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon } from '../../src/components/Icon';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { BrandBar } from '../../src/components/BrandBar';
import { Card } from '../../src/components/Card';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { TOOLS, CATEGORIES, Tool } from '../../src/data/tools';
import { useShortcuts } from '../../src/hooks/useShortcuts';

function normalize(s: string): string {
  // Strip nikud + final-form normalization, lowercase
  return s
    .replace(/[֑-ׇ]/g, '')
    .replace(/ך/g, 'כ').replace(/ם/g, 'מ').replace(/ן/g, 'נ').replace(/ף/g, 'פ').replace(/ץ/g, 'צ')
    .toLowerCase()
    .trim();
}

function matchesQuery(t: Tool, q: string): boolean {
  if (!q) return true;
  const hay = normalize(`${t.title} ${t.description} ${t.id}`);
  return hay.includes(q);
}

export default function ToolsScreen() {
  const router = useRouter();
  const { favorites, toggleFavorite, trackUse, isFavorite } = useShortcuts();
  const [query, setQuery] = useState('');

  const normalizedQuery = useMemo(() => normalize(query), [query]);
  const filtered = useMemo(() => TOOLS.filter((t) => matchesQuery(t, normalizedQuery)), [normalizedQuery]);

  const handleTool = (toolId: string, route: string) => {
    trackUse(toolId);
    router.push(route as any);
  };

  const handleLongPress = (toolId: string, title: string) => {
    const fav = isFavorite(toolId);
    Alert.alert(
      title,
      fav ? 'להסיר מהמועדפים?' : 'להוסיף למועדפים? (יופיע בקיצורי דרך)',
      [
        { text: 'ביטול', style: 'cancel' },
        { text: fav ? 'הסר' : 'הוסף', onPress: () => toggleFavorite(toolId) },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <LinearGradient
        colors={['#0a1f3d', '#1e3a5f', '#2c5282']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill as any}
      />
      {/* Glow orb removed per user feedback — every screen should be clean. */}
      <BrandBar />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <ScreenHeader
          title="כלים"
          subtitle={query ? `${filtered.length} תוצאות` : `${TOOLS.length} כלים · לחיצה ארוכה להוספה למועדפים`}
        />

        {/* Search */}
        <View style={styles.searchWrap}>
          <View style={styles.searchBox}>
            <Icon name="search" size={18} color={colors.textMuted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="חפש כלי..."
              placeholderTextColor={colors.textMuted}
              style={styles.searchInput}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery('')} hitSlop={10}>
                <Icon name="close" size={18} color={colors.textMuted} />
              </Pressable>
            )}
          </View>
        </View>

        {query && filtered.length === 0 && (
          <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.lg }}>
            <Card variant="accent">
              <Text style={[typography.body, { color: colors.primaryDark, textAlign: 'center' }]}>
                לא נמצאו כלים תואמים ל-"{query}"
              </Text>
            </Card>
          </View>
        )}

        {CATEGORIES.map((cat) => {
          const list = filtered.filter((t) => t.category === cat.id);
          if (list.length === 0) return null;
          return (
            <View key={cat.id} style={{ marginBottom: spacing.xl }}>
              <Text style={[typography.h2, styles.sectionTitle]}>{cat.label}</Text>
              <View style={styles.grid}>
                {list.map((t) => (
                  <Card
                    key={t.id}
                    variant={t.tone === 'accent' ? 'featured' : 'default'}
                    style={styles.toolCard}
                    onPress={() => handleTool(t.id, t.route)}
                    onLongPress={() => handleLongPress(t.id, t.title)}
                  >
                    {isFavorite(t.id) && (
                      <View style={styles.starBadge}>
                        <Icon name="star" size={14} color={colors.primary} />
                      </View>
                    )}
                    {/* Prefer Lucide icon (consistent design language).
                        Fall back to emoji for tools without iconName. */}
                    {t.iconName ? (
                      <View style={{ marginBottom: 4 }}>
                        <Icon name={t.iconName as any} size={26} color={colors.primary} strokeWidth={1.5} />
                      </View>
                    ) : (
                      <Text style={styles.emojiSpot}>{t.emoji}</Text>
                    )}
                    <Text
                      style={[
                        { fontSize: 12.5, fontWeight: '700', color: colors.textPrimary, lineHeight: 15 },
                      ]}
                      numberOfLines={3}
                    >
                      {t.title}
                    </Text>
                    <Text
                      style={[
                        { fontSize: 9.5, color: colors.textMuted, marginTop: 2, lineHeight: 12 },
                      ]}
                      numberOfLines={2}
                    >
                      {t.description}
                    </Text>
                  </Card>
                ))}
              </View>
            </View>
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingBottom: spacing.xl },
  glow: {
    position: 'absolute',
    top: -60,
    left: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: colors.glowGold,
    opacity: 0.35,
  },
  searchWrap: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  searchBox: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: colors.glass,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
    paddingVertical: 4,
    // Right-padding prevents the first Hebrew letter from being clipped
    // by the icon/border on the right edge.
    paddingRight: 6,
  },
  sectionTitle: {
    color: colors.textPrimary,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  grid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    gap: 7,
  },
  // 3 cols instead of 2 — denser, more tools visible at once. Tile is
  // slightly taller than wide so the title doesn't crowd the emoji.
  toolCard: {
    width: '31.5%',
    aspectRatio: 0.92,
    position: 'relative',
    padding: 12,
  },
  // No nested gold frame — emoji renders directly. Just a uniform size so
  // different emoji widths don't make tiles look unbalanced.
  emojiSpot: {
    fontSize: 26,
    lineHeight: 30,
    color: colors.primary,
    marginBottom: 4,
  },
  starBadge: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
    zIndex: 1,
  },
});
