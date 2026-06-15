import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Card } from './Card';
import { Icon } from './Icon';
import { colors, radius, spacing } from '../theme/colors';
import { typography } from '../theme/typography';

/**
 * Gabbai assistance card shown adjacent to the Torah reading.
 *
 * Provides collapsible quick-access to the nuschach a gabbai actually needs
 * during קריאת התורה:
 *   • העלייה לתורה (call-up phrasing)
 *   • Aliyah brachot (before + after)
 *   • Mi sheberach variants (for the oleh, sick, bar/bat mitzva, parent of
 *     newborn, soldiers, yahrzeit)
 *   • Birkat HaGomel (text + congregation response)
 *   • Hagbaha + glila
 *
 * All sections start COLLAPSED so the running prayer text isn't pushed
 * down by hundreds of pixels of gabbai content. Tap any chip to expand.
 */

type Section = {
  id: string;
  title: string;
  /** A function so we can use the user-entered name in the rendered text. */
  body: (oleh: string, mother: string) => string;
};

const SECTIONS: Section[] = [
  {
    id: 'aliyah-call',
    title: 'העלייה לתורה',
    body: (oleh, mother) =>
      `יַעֲמֹד / תַּעֲמֹד ${oleh || '___________'} ${mother ? 'בֶּן/בַּת ' + mother : 'בֶּן/בַּת ___________'} ` +
      'הָרִאשׁוֹן / הַשֵּׁנִי / הַשְּׁלִישִׁי / הָרְבִיעִי / הַחֲמִישִׁי / הַשִּׁשִּׁי / הַשְּׁבִיעִי / הַמַּפְטִיר. ' +
      'בָּרוּךְ שֶׁנָּתַן תּוֹרָה לְעַמּוֹ יִשְׂרָאֵל בִּקְדֻשָּׁתוֹ.',
  },
  {
    id: 'aliyah-brachot',
    title: 'ברכות העולה',
    body: () =>
      'לִפְנֵי הַקְּרִיאָה (העולה): "בָּרְכוּ אֶת ה\' הַמְבֹרָךְ." הקהל: "בָּרוּךְ ה\' הַמְבֹרָךְ לְעוֹלָם וָעֶד." העולה חוזר: "בָּרוּךְ ה\' הַמְבֹרָךְ לְעוֹלָם וָעֶד. בָּרוּךְ אַתָּה ה\' אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם אֲשֶׁר בָּחַר בָּנוּ מִכָּל הָעַמִּים וְנָתַן לָנוּ אֶת תּוֹרָתוֹ. בָּרוּךְ אַתָּה ה\' נוֹתֵן הַתּוֹרָה."\n\n' +
      'אַחֲרֵי הַקְּרִיאָה: "בָּרוּךְ אַתָּה ה\' אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, אֲשֶׁר נָתַן לָנוּ תּוֹרַת אֱמֶת וְחַיֵּי עוֹלָם נָטַע בְּתוֹכֵנוּ. בָּרוּךְ אַתָּה ה\' נוֹתֵן הַתּוֹרָה."',
  },
  {
    id: 'misheberach-oleh',
    title: 'מי שברך לעולה',
    body: (oleh, mother) =>
      `מִי שֶׁבֵּרַךְ אֲבוֹתֵינוּ אַבְרָהָם יִצְחָק וְיַעֲקֹב, הוּא יְבָרֵךְ אֶת ${oleh || '_______'} ${mother ? 'בֶּן/בַּת ' + mother : 'בֶּן/בַּת _______'} ` +
      'בַּעֲבוּר שֶׁעָלָה לְכָבוֹד תּוֹרָה לִכְבוֹד הַשַּׁבָּת / הַחַג. ' +
      'בִּשְׂכַר זֶה הַקָּדוֹשׁ בָּרוּךְ הוּא יִשְׁמְרֵהוּ וְיַצִּילֵהוּ מִכָּל צָרָה וְצוּקָה וּמִכָּל נֶגַע וּמַחֲלָה, ' +
      'וְיִשְׁלַח בְּרָכָה וְהַצְלָחָה בְּכָל מַעֲשֵׂה יָדָיו, וְנֹאמַר אָמֵן.',
  },
  {
    id: 'misheberach-choleh',
    title: 'מי שברך לחולה',
    body: (oleh, mother) =>
      `מִי שֶׁבֵּרַךְ אֲבוֹתֵינוּ אַבְרָהָם יִצְחָק וְיַעֲקֹב, מֹשֶׁה אַהֲרֹן דָּוִד וּשְׁלֹמֹה, ` +
      `הוּא יְבָרֵךְ וִירַפֵּא אֶת הַחוֹלֶה/ה ${oleh || '___________'} ${mother ? 'בֶּן/בַּת ' + mother : 'בֶּן/בַּת ___________'}. ` +
      'הַקָּדוֹשׁ בָּרוּךְ הוּא יִמָּלֵא רַחֲמִים עָלָיו/עָלֶיהָ, לְהַחֲלִימוֹ/לְהַחֲלִימָהּ וּלְרַפְּאוֹתוֹ/לְרַפְּאוֹתָהּ, ' +
      'וְיִשְׁלַח לוֹ/לָהּ מְהֵרָה רְפוּאָה שְׁלֵמָה מִן הַשָּׁמַיִם, רְפוּאַת הַנֶּפֶשׁ וּרְפוּאַת הַגּוּף, ' +
      'בְּתוֹךְ שְׁאָר חוֹלֵי יִשְׂרָאֵל הַשְׁתָּא בַּעֲגָלָא וּבִזְמַן קָרִיב, וְנֹאמַר אָמֵן.',
  },
  {
    id: 'misheberach-bar-mitzva',
    title: 'מי שברך לבר/בת מצוה',
    body: (oleh, mother) =>
      `מִי שֶׁבֵּרַךְ אֲבוֹתֵינוּ אַבְרָהָם יִצְחָק וְיַעֲקֹב, הוּא יְבָרֵךְ אֶת הַנַּעַר/הַנַּעֲרָה ${oleh || '___________'} ` +
      `${mother ? 'בֶּן/בַּת ' + mother : 'בֶּן/בַּת ___________'} שֶׁהִגִּיעַ/שֶׁהִגִּיעָה לְמִצְוֹת. ` +
      'הַקָּדוֹשׁ בָּרוּךְ הוּא יַעַזְרוֹ/יַעַזְרֶהָ לִשְׁמֹר אֶת הַתּוֹרָה וְהַמִּצְוֹת, ' +
      'יִשְׁמַח בּוֹ/בָּהּ אָבִיו וְאִמּוֹ, וְזֶה רְצוֹן ה\' עִמּוֹ/עִמָּהּ, וְנֹאמַר אָמֵן.',
  },
  {
    id: 'misheberach-yoledet',
    title: 'מי שברך ליולדת',
    body: (oleh, mother) =>
      `מִי שֶׁבֵּרַךְ אֲבוֹתֵינוּ אַבְרָהָם יִצְחָק וְיַעֲקֹב, שָׂרָה רִבְקָה רָחֵל וְלֵאָה, ` +
      `הוּא יְבָרֵךְ אֶת הַיּוֹלֶדֶת ${oleh || '_______'} ${mother ? 'בַּת ' + mother : 'בַּת _______'} ` +
      'וְאֶת בְּנָהּ/בִּתָּהּ שֶׁנּוֹלַד/שֶׁנּוֹלְדָה לָהּ בְּמַזָּל טוֹב. ' +
      'יְגַדְּלֵהוּ/יְגַדְּלֵהָ לְתוֹרָה לְחֻפָּה וּלְמַעֲשִׂים טוֹבִים, וְנֹאמַר אָמֵן.',
  },
  {
    id: 'misheberach-yahrzeit',
    title: 'מי שברך לעולה לעילוי נשמה (יארצייט)',
    body: (oleh, mother) =>
      `מִי שֶׁבֵּרַךְ אֲבוֹתֵינוּ אַבְרָהָם יִצְחָק וְיַעֲקֹב, הוּא יְבָרֵךְ אֶת ${oleh || '_______'} ${mother ? 'בֶּן/בַּת ' + mother : 'בֶּן/בַּת _______'} ` +
      'בַּעֲבוּר שֶׁעָלָה לְכָבוֹד הַתּוֹרָה לְעִלּוּי נִשְׁמַת ___________. ' +
      'בִּשְׂכַר זֶה תְּהֵא נִשְׁמָתָהּ/נִשְׁמָתוֹ צְרוּרָה בִּצְרוֹר הַחַיִּים, וְנֹאמַר אָמֵן.',
  },
  {
    id: 'misheberach-soldiers',
    title: 'מי שברך לחיילי צה"ל',
    body: () =>
      'מִי שֶׁבֵּרַךְ אֲבוֹתֵינוּ אַבְרָהָם יִצְחָק וְיַעֲקֹב, הוּא יְבָרֵךְ אֶת חַיָּלֵי צְבָא הַהֲגָנָה לְיִשְׂרָאֵל, ' +
      'הָעוֹמְדִים עַל מִשְׁמַר אַרְצֵנוּ וְעָרֵי אֱלֹהֵינוּ, מִגְּבוּל הַלְּבָנוֹן וְעַד מִדְבַּר מִצְרַיִם, ' +
      'וּמִן הַיָּם הַגָּדוֹל עַד לְבוֹא הָעֲרָבָה, בַּיַּבָּשָׁה בָּאֲוִיר וּבַיָּם. ' +
      'יִתֵּן ה\' אֶת אוֹיְבֵינוּ הַקָּמִים עָלֵינוּ נִגָּפִים לִפְנֵיהֶם. הַקָּדוֹשׁ בָּרוּךְ הוּא יִשְׁמֹר וְיַצִּיל אֶת חַיָּלֵינוּ מִכָּל צָרָה וְצוּקָה, ' +
      'וּמִכָּל נֶגַע וּמַחֲלָה, וְיִשְׁלַח בְּרָכָה וְהַצְלָחָה בְּכָל מַעֲשֵׂה יְדֵיהֶם. וְנֹאמַר אָמֵן.',
  },
  {
    id: 'gomel',
    title: 'ברכת הגומל',
    body: () =>
      'מי חייב: יורד הים, הולך מדבר, חולה שנתרפא, יוצא ממאסר.\n\n' +
      'נוסח: "בָּרוּךְ אַתָּה ה\' אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, הַגּוֹמֵל לְחַיָּבִים טוֹבוֹת שֶׁגְּמָלַנִי כָּל טוֹב."\n\n' +
      'הקהל עונה: "מִי שֶׁגְּמָלְךָ כָּל טוֹב, הוּא יִגְמָלְךָ כָּל טוֹב סֶלָה."',
  },
  {
    id: 'hagbaha',
    title: 'הגבהה וגלילה',
    body: () =>
      'אחרי הקריאה האחרון מגביה: "וְזֹאת הַתּוֹרָה אֲשֶׁר שָׂם מֹשֶׁה לִפְנֵי בְּנֵי יִשְׂרָאֵל עַל פִּי ה\' בְּיַד מֹשֶׁה."',
  },
];

export function GabbaiCard() {
  const [open, setOpen] = useState<Set<string>>(new Set());
  // Shared name fields used by personal mi-sheberachs.
  const [oleh, setOleh] = useState('');
  const [mother, setMother] = useState('');

  function toggle(id: string) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <Card>
      <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
        <Icon name="book" size={20} color={colors.primary} />
        <Text style={[typography.bodyBold, { color: colors.textPrimary, flex: 1 }]}>נוסחי הגבאי</Text>
      </View>
      <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.md }]}>
        נוסחים לקריאה ולמי שברך. סגורים כברירת מחדל — פתח את המתאים.
      </Text>

      {/* Name fields shared across mi-sheberachs (single source of truth). */}
      <View style={styles.nameRow}>
        <TextInput
          style={styles.input}
          placeholder="שם העולה / החולה"
          placeholderTextColor={colors.textMuted}
          value={oleh}
          onChangeText={setOleh}
        />
        <TextInput
          style={styles.input}
          placeholder="שם האם"
          placeholderTextColor={colors.textMuted}
          value={mother}
          onChangeText={setMother}
        />
      </View>

      {SECTIONS.map((s) => {
        const isOpen = open.has(s.id);
        return (
          <View key={s.id} style={styles.section}>
            <Pressable
              onPress={() => toggle(s.id)}
              style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm }}
            >
              <Icon name={isOpen ? 'chevronDown' : 'chevronLeft'} size={16} color={colors.primary} />
              <Text style={[typography.body, { color: colors.textPrimary, flex: 1 }]}>{s.title}</Text>
            </Pressable>
            {isOpen && (
              <View style={styles.body}>
                <Text style={styles.bodyText}>{s.body(oleh, mother)}</Text>
              </View>
            )}
          </View>
        );
      })}
    </Card>
  );
}

const styles = StyleSheet.create({
  nameRow: {
    flexDirection: 'row-reverse',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    color: colors.textPrimary,
    textAlign: 'right',
    fontFamily: 'Rubik-Regular',
  },
  section: {
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  body: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  bodyText: {
    color: colors.textPrimary,
    fontFamily: 'Rubik-Regular',
    fontSize: 17,
    lineHeight: 28,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
