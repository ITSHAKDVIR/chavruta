import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from './Card';
import { Icon } from './Icon';
import { fetchSefariaText } from '../services/sefaria';
import { colors, spacing } from '../theme/colors';
import { typography } from '../theme/typography';

/**
 * Gabbai assistance card shown adjacent to the Torah reading.
 *
 * ONE combined collapse the gabbai opens (per R. Dvir — not many separate
 * collapses). All nuschach is REAL text fetched from Sefaria (Siddur Ashkenaz) —
 * nothing is invented. Sections without a Sefaria source (the יעמוד call-up,
 * bar/bat-mitzva, יולדת, יארצייט mi-sheberachs) were dropped rather than made up.
 * The aliyah-blessing source already opens with the call-up rubric. The personal
 * mi-sheberachs carry Sefaria's own "פב"פ" (פלוני בן/בת פלוני) placeholder.
 */

type GabbaiSection = { id: string; title: string; ref: string };

const GABBAI_SECTIONS: GabbaiSection[] = [
  { id: 'aliyah', title: 'קריאה לעלייה + ברכות העולה',
    ref: 'Siddur Ashkenaz, Weekday, Shacharit, Torah Reading, Reading from Sefer, Birkat HaTorah' },
  { id: 'gomel', title: 'ברכת הגומל',
    ref: 'Siddur Ashkenaz, Weekday, Shacharit, Torah Reading, Reading from Sefer, Birkat Hagomel' },
  { id: 'hagbaha', title: 'הגבהת התורה — וזאת התורה',
    ref: 'Siddur Ashkenaz, Weekday, Shacharit, Torah Reading, Reading from Sefer, Raising the Torah' },
  { id: 'msb-oleh', title: 'מי שברך לעולה',
    ref: 'Siddur Ashkenaz, Shabbat, Shacharit, Torah Reading, Reading from Sefer, Mi Sheberach, For an Oleh' },
  { id: 'msb-choleh', title: 'מי שברך לחולה',
    ref: 'Siddur Ashkenaz, Shabbat, Shacharit, Torah Reading, Reading from Sefer, Mi Sheberach, For Sickness (includes man and woman)' },
  { id: 'soldiers', title: 'תפילה לחיילי צה"ל',
    ref: 'Siddur Ashkenaz, Shabbat, Shacharit, Communal Prayers, Prayer for Israeli Soldiers' },
  { id: 'captives', title: 'תפילה לשבויים ולנעדרים',
    ref: 'Siddur Ashkenaz, Shabbat, Shacharit, Communal Prayers, Prayer for Those Being Held in Captivity' },
];

const stripHtml = (s: string) => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

type SectionState = string[] | 'error';

export function GabbaiCard() {
  const [open, setOpen] = useState(false);
  const [texts, setTexts] = useState<Record<string, SectionState>>({});
  const [loading, setLoading] = useState(false);
  const fetchedRef = useRef(false);
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  // Fetch the real Sefaria text once, the first time the gabbai opens the card.
  // Depend ONLY on `open`; a ref guards "fetch once" so setLoading doesn't re-run
  // the effect. The fetch completes even if the card is closed mid-flight.
  useEffect(() => {
    if (!open || fetchedRef.current) return;
    fetchedRef.current = true;
    setLoading(true);
    (async () => {
      const out: Record<string, SectionState> = {};
      await Promise.all(
        GABBAI_SECTIONS.map(async (s) => {
          try {
            const t = await fetchSefariaText(s.ref);
            out[s.id] =
              t && t.heText.length > 0 ? t.heText.map(stripHtml).filter(Boolean) : 'error';
          } catch {
            out[s.id] = 'error';
          }
        }),
      );
      if (mountedRef.current) {
        setTexts(out);
        setLoading(false);
      }
    })();
  }, [open]);

  return (
    <Card>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm }}
      >
        <Icon name={open ? 'chevronDown' : 'chevronLeft'} size={18} color={colors.primary} />
        <Icon name="book" size={20} color={colors.primary} />
        <Text style={[typography.bodyBold, { color: colors.textPrimary, flex: 1 }]}>נוסחי הגבאי</Text>
      </Pressable>

      {!open && (
        <Text style={[typography.caption, { color: colors.textMuted, marginTop: 4 }]}>
          קריאה לעלייה, ברכות העולה, מי שברך, ברכת הגומל, הגבהה. לחץ לפתיחה.
        </Text>
      )}

      {open && (
        <View style={{ marginTop: spacing.md }}>
          {loading && <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.md }} />}
          {GABBAI_SECTIONS.map((s) => {
            const t = texts[s.id];
            if (t === undefined) return null;
            return (
              <View key={s.id} style={styles.section}>
                <Text style={[typography.bodyBold, { color: colors.primary, marginBottom: 4 }]}>
                  {s.title}
                </Text>
                {t === 'error' ? (
                  <Text style={[typography.caption, { color: colors.textMuted }]}>לא נטען מספריא</Text>
                ) : (
                  t.map((line, i) => (
                    <Text key={i} style={styles.bodyText}>
                      {line}
                    </Text>
                  ))
                )}
              </View>
            );
          })}
          {!loading && (
            <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm }]}>
              הנוסח מ-ספריא (סידור אשכנז). ״פב״פ״ = פלוני בן/בת פלוני.
            </Text>
          )}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  bodyText: {
    color: colors.textPrimary,
    fontFamily: 'Rubik-Regular',
    fontSize: 17,
    lineHeight: 28,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 4,
  },
});
