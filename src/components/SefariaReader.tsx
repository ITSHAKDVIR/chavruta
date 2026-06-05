import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View, Pressable, ActivityIndicator } from 'react-native';
import { Card } from './Card';
import { fetchSefariaText } from '../services/sefaria';
import { parseParagraphs, activeTags, shouldRender, ParsedParagraph } from '../services/siddurParser';
import { hebrewNumeral } from '../data/hebrewNumbers';
import { colors, radius, spacing } from '../theme/colors';
import { typography } from '../theme/typography';

type Props = {
  /** Single ref or array of refs to fetch sequentially. */
  refs: string | string[];
  /** Show verse numbers for each paragraph. */
  showVerseNumbers?: boolean;
  /** Hide the show-all / halachic toggles. */
  hideToggles?: boolean;
  /** Default state for show-all toggle. */
  defaultShowAll?: boolean;
  /** Optional header above each ref's text. */
  sectionTitles?: string[];
  /** Whether running in Israel (for active tags). */
  inIsrael?: boolean;
};

type RefData = {
  ref: string;
  title: string;
  paragraphs: ParsedParagraph[];
  loading: boolean;
  error?: string;
};

export function SefariaReader({
  refs,
  showVerseNumbers = false,
  hideToggles = false,
  defaultShowAll = false,
  sectionTitles,
  inIsrael = true,
}: Props) {
  const refList = useMemo(() => (typeof refs === 'string' ? [refs] : refs), [refs]);
  const titleList = useMemo(() => sectionTitles ?? [], [sectionTitles]);

  const [data, setData] = useState<RefData[]>([]);
  const [showAll, setShowAll] = useState(defaultShowAll);
  const [showNotes, setShowNotes] = useState(false);

  useEffect(() => {
    setData(
      refList.map((r, i) => ({
        ref: r,
        title: titleList[i] ?? '',
        paragraphs: [],
        loading: true,
      })),
    );
    let cancelled = false;
    (async () => {
      const results = await Promise.all(
        refList.map(async (ref, i) => {
          try {
            const t = await fetchSefariaText(ref);
            if (t && t.heText.length > 0) {
              return {
                ref,
                title: titleList[i] ?? t.heRef,
                paragraphs: parseParagraphs(t.heText),
                loading: false,
              } as RefData;
            }
            return { ref, title: titleList[i] ?? ref, paragraphs: [], loading: false, error: 'הטקסט לא נטען' };
          } catch {
            return { ref, title: titleList[i] ?? ref, paragraphs: [], loading: false, error: 'שגיאת רשת' };
          }
        }),
      );
      if (!cancelled) setData(results);
    })();
    return () => {
      cancelled = true;
    };
  }, [refList.join('|'), titleList.join('|')]);

  const active = useMemo(() => activeTags(new Date(), inIsrael), [inIsrael]);
  const totalParagraphs = data.reduce((sum, d) => sum + d.paragraphs.length, 0);

  return (
    <View style={{ gap: spacing.md }}>
      {!hideToggles && totalParagraphs > 0 && (
        <Card>
          <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: spacing.sm }}>
            <Pressable
              onPress={() => setShowAll(!showAll)}
              style={[styles.toggleChip, showAll && styles.toggleChipActive]}
            >
              <Text style={[typography.caption, { color: showAll ? colors.textInverse : colors.textPrimary }]}>
                {showAll ? '✓ ' : ''}הצג את כל התוספות
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setShowNotes(!showNotes)}
              style={[styles.toggleChip, showNotes && styles.toggleChipActive]}
            >
              <Text style={[typography.caption, { color: showNotes ? colors.textInverse : colors.textPrimary }]}>
                {showNotes ? '✓ ' : ''}הערות הלכתיות
              </Text>
            </Pressable>
          </View>
        </Card>
      )}

      {data.map((d, idx) => (
        <Card key={`${d.ref}-${idx}`} padding="xl">
          {d.title && data.length > 1 && (
            <Text style={[typography.h3, styles.sectionTitle]}>{d.title}</Text>
          )}
          {d.loading && (
            <View style={{ paddingVertical: spacing.xl, alignItems: 'center' }}>
              <ActivityIndicator color={colors.primary} />
            </View>
          )}
          {d.error && (
            <Text style={[typography.body, { color: colors.danger }]}>{d.error}</Text>
          )}
          {d.paragraphs.map((p, j) => {
            if (!shouldRender(p, active, { showAll, showNotes })) return null;
            if (p.kind === 'halachic-note') {
              return (
                <Text key={j} style={[typography.small, styles.note]}>
                  {p.body}
                </Text>
              );
            }
            if (p.kind === 'conditional' || p.kind === 'alternative') {
              const inSeasonP = !p.tags || p.tags.length === 0 || p.tags.some((t) => active.has(t));
              return (
                <View key={j} style={[styles.condBlock, !inSeasonP && styles.condMuted]}>
                  {p.marker && (
                    <Text style={styles.condMarker}>
                      🔹 {p.marker}{!inSeasonP && ' · לא היום'}
                    </Text>
                  )}
                  <Text style={[typography.sacred, styles.paragraph, inSeasonP ? styles.condText : styles.condTextMuted]}>
                    {p.body}
                  </Text>
                </View>
              );
            }
            return (
              <Text key={j} style={[typography.sacred, styles.paragraph]}>
                {showVerseNumbers && (
                  <Text style={styles.verseNum}>({hebrewNumeral(j + 1)}) </Text>
                )}
                {p.body}
              </Text>
            );
          })}
        </Card>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  toggleChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleChipActive: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
  sectionTitle: { color: colors.primaryDark, marginBottom: spacing.md },
  paragraph: {
    color: colors.textPrimary,
    lineHeight: 32,
    textAlign: 'right',
    marginTop: spacing.sm,
  },
  note: { color: colors.textMuted, fontStyle: 'italic', marginTop: spacing.sm, lineHeight: 20, opacity: 0.85 },
  verseNum: { color: colors.accentDark ?? colors.primary, fontWeight: '700' },
  condBlock: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRightWidth: 4,
    borderRightColor: '#8B3A62',
    backgroundColor: 'rgba(139, 58, 98, 0.07)',
    borderRadius: radius.sm,
  },
  condMuted: { borderRightColor: colors.border, backgroundColor: 'rgba(0,0,0,0.03)', opacity: 0.55 },
  condMarker: { color: '#8B3A62', fontWeight: '700', fontSize: 12, marginBottom: spacing.xs },
  condText: { color: '#5C1F3A', fontWeight: '500' },
  condTextMuted: { color: colors.textMuted, fontStyle: 'italic' },
});
