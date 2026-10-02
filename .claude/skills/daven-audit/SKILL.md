---
name: daven-audit
description: >
  הגהת-סידור אוטומטית ("המתפלל האוטומטי"). עובר על כל נוסח × כל תפילה × לוח ימים
  מייצג (חול, שני/חמישי, ר״ח יום/יומיים, חוה״מ סוכות/פסח, הושענא רבה, אסרו-חג,
  חנוכה, פורים/שושן/קטן, צומות, ת״ב, יוה״ע/יו״ם, עשי״ת, ערבי-ימים, מוצ״ש, ספירה)
  בא״י ובחו״ל, בשלושה מצבי-תצוגה (לחש / עם הערות / חזרת הש״ץ), דרך צינור זהה
  ל-read.tsx, ובודק מבנה וטקסט גלוי. שער חובה לפני build. Trigger: "הגהת סידור",
  "הרץ הגהה", "בדוק את כל התפילות", "daven audit", "audit the siddur", לפני build.
---

# הגהת-סידור אוטומטית (daven-audit) — v2

מנוע ש"מתפלל" כל תפילה בכל נוסח ובכל סוג-יום, קורא את הטקסט **הגלוי** (אחרי אותו
עיבוד שהאפליקציה עושה) ומסמן חריגות לפוסק. הפסק ההלכתי הוא של הרב.

## מתי
- **לפני כל build** — לא בונים APK אם יש חריגה שאינה שאלה-לפוסק.
- אחרי כל שינוי ב-`siddurAugment.ts` / `siddurRelevance.ts` / `siddurParser.ts` / `read.tsx`.

## הרצה (מ-`C:\Users\ITSHA\yahadut-app`)
```bash
npx --yes tsx@4.23.15 --tsconfig tsconfig.dump.json siddur-audit/daven-audit.ts
```
- פלט: `.siddur-audit-report.md` (🔴→🟠→🟡→⚪ + "שאלות לפוסק"). ~292 תאים, כמה דקות (מושך מספריא).
- `--dump <nusach> <svc> <YYYY-MM-DD> [chul]` → `.siddur-dump.md`: הטקסט הגלוי המלא של תפילה אחת.
- `--snap <dir> <nusach:svc:date …>` → קובץ טקסט לכל תפילה. **בדיקת רגרסיה:** צלם לפני שינוי
  ואחריו ו-`diff -r` — כל שורה שהשתנתה חייבת להיות מכוונת. (לא לקרוא snapshot באמצע כתיבה.)
- נוסחים: `ashkenazi` `sephardi` `edot-mizrach` `chabad`; שירותים: `shacharit` `mincha` `maariv`.

## נאמנות לאפליקציה (קריטי)
`appLeaves` + `renderMode` משכפלים את read.tsx: augment → isSectionRelevantToday (ערבית
מגולגלת ליום הבא) → prefs → פילטר שיר-של-יום → filterOmerForToday → splitMonolithicAmidah
+ parseParagraphs({amidah}) + תיחום עננו | הסרת תחנון → shouldRender בשלושת המצבים.
טקסט conditional/alternative → `enhanceConditionalText(p, date, il, isMaariv)`; רגיל →
`stripInactiveInlineParens`; הערה → כמות שהיא. **כל שינוי בצינור של read.tsx — לשכפל כאן.**

## בדיקות
מבנה: חלק חסר/סדר/כפילות-בסעיף, תחנון (כולל נפילת אפיים/וידוי), ערבוב-נוסח, נשיא-חנוכה.
טקסט: שם-חג (עם "הזה"), טקסט-שבת בחול, יעלה-ויבא/על-הנסים, שם-יום ריק, תוספות עשי״ת
המנוקדות, **הוראת עשי״ת ("בעשי״ת"/"בעשרת ימי תשובה") גלויה ביום רגיל**, עונת גשמים
(א״י/חו״ל עצמאי), ערבית: חוננתנו/עננו/ספירה, נחם, קרבן סוכות לפי יום, קרבן חג אחר,
ספירת "ומנחתם", שאריות HTML, תווית-יום תלויה, מילים מודבקות.

## תשתית (gitignored — לשחזר אם נמחקה)
`siddur-audit/` ו-`tsconfig.dump.json` gitignored. `@hebcal/core` ESM-only:
`"paths": { "@hebcal/core": ["./node_modules/@hebcal/core/dist/esm/index.js"] }`, ורק tsx@4.23.15.
אין Python במכונה.

## הצגה לרב
סכם מספר וסוג; הפרד באג אמיתי מאי-דיוק בגלאי; לכל באג נוסח/תפילה/יום + השורה; שאלות
הלכתיות — להציג, לא להכריע. אל תמציא נוסח (ספריא/תנ״ך בלבד). build רק באישור, versionCode עולה.
