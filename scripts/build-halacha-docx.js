// Build halacha-review.docx from /tmp/halacha.json.
// One section per source file, paragraphs grouped by topic where detectable.
// All text is RTL Hebrew with smart quotes.

const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  PageOrientation, PageBreak, LevelFormat,
} = require('docx');

const data = JSON.parse(fs.readFileSync('/tmp/halacha.json', 'utf-8'));

// Map source files to friendly Hebrew section names.
const SECTION_TITLES = {
  'src/data/halachaIndex.ts':       'מאגר הלכה (אינדקס מאוחד)',
  'src/data/arbaaMinim.ts':         'ארבעת המינים — קריטריונים',
  'src/data/kasheringData.ts':      'הכשרת כלים — נתונים',
  'src/data/kasheringSimulator.ts': 'הכשרת כלים — סימולציה',
  'src/data/kashrutSim.ts':         'כשרות — סימולציה',
  'src/data/cosmeticsIngredients.ts':'תמרוקים — מרכיבים',
  'src/data/tefilaInserts.ts':      'הוספות בתפילה',
  'src/data/birkatHamazon.ts':      'ברכת המזון',
  'src/data/shiurim.ts':            'שיעורי תורה (מידות)',
  'src/data/shemita.ts':            'הלכות שמיטה',
  'src/data/aveilus.ts':            'אבילות',
  'src/data/chuppah.ts':            'חופה',
  'src/data/kilayim.ts':            'כלאיים',
  'src/data/brachot.ts':            'ברכות',
  'src/data/brachotDb.ts':          'מאגר ברכות',
  'src/data/chazakaTalGeshem.ts':   'חזקה לטל וגשם',
  'src/data/kiddushLevana.ts':      'קידוש לבנה',
  'src/data/siddurRelevance.ts':    'רלוונטיות סידור',
  'src/data/holidayKit.ts':         'ערכות חגים',
  'src/data/halachaYomit.ts':       'הלכה יומית',
  'src/data/prayerTimeWindows.ts':  'זמני תפילה',
  'app/tools/arba-minim.tsx':       'כלי: ארבעת המינים',
  'app/tools/aveilus.tsx':          'כלי: אבילות',
  'app/tools/bedikat-chametz.tsx':  'כלי: בדיקת חמץ',
  'app/tools/brit.tsx':             'כלי: ברית מילה',
  'app/tools/chanukah.tsx':         'כלי: חנוכה',
  'app/tools/compass.tsx':          'כלי: מצפן',
  'app/tools/cosmetics-check.tsx':  'כלי: בדיקת תמרוקים',
  'app/tools/halacha-questions.tsx':'כלי: שאלות הלכה',
  'app/tools/hundred-brachot.tsx':  'כלי: 100 ברכות',
  'app/tools/kever-visit.tsx':      'כלי: ביקור בקבר',
  'app/tools/meatmilk.tsx':         'כלי: בשר וחלב',
  'app/tools/molad.tsx':            'כלי: מולד',
  'app/tools/motzaei-shabbat.tsx':  'כלי: מוצאי שבת',
  'app/tools/netilat-arba-minim.tsx':'כלי: נטילת ארבעת המינים',
  'app/tools/omer.tsx':             'כלי: ספירת העומר',
  'app/tools/pidyon.tsx':           'כלי: פדיון הבן',
  'app/tools/purim.tsx':            'כלי: פורים',
  'app/tools/sechach-meter.tsx':    'כלי: מדידת סכך',
  'app/tools/tahara.tsx':           'כלי: טהרת המשפחה',
  'app/tools/tal-geshem.tsx':       'כלי: טל וגשם',
  'app/tools/tu-bishvat.tsx':       'כלי: ט"ו בשבט',
  'app/tools/yahrtzeit.tsx':        'כלי: יארצייט',
  'app/tools/yahrzeit.tsx':         'כלי: יארצייט (גרסה 2)',
};

const FIELD_LABEL = {
  description: 'תיאור', summary: 'תקציר', note: 'הערה', criteria: 'קריטריון',
  text: 'נוסח', body: 'גוף', ruling: 'פסיקה', detail: 'פרט', rule: 'דין',
  intro: 'הקדמה', q: 'שאלה', a: 'תשובה', answer: 'תשובה',
  why: 'הסבר', how: 'הוראה', when: 'מתי', who: 'מי',
  basicRequirements: 'דרישות יסוד', additionalChecks: 'בדיקות נוספות',
  preferred: 'מועדף', acceptable: 'קביל', disqualified: 'פסול',
};

// RTL paragraph helper
const rtlPara = (children, opts = {}) => new Paragraph({
  bidirectional: true,
  alignment: AlignmentType.RIGHT,
  ...opts,
  children,
});

const h1 = (text) => rtlPara([new TextRun({ text, bold: true, size: 32, font: 'Arial' })], {
  heading: HeadingLevel.HEADING_1,
  spacing: { before: 320, after: 200 },
});
const h2 = (text) => rtlPara([new TextRun({ text, bold: true, size: 26, font: 'Arial' })], {
  heading: HeadingLevel.HEADING_2,
  spacing: { before: 240, after: 120 },
});
const h3 = (text) => rtlPara([new TextRun({ text, bold: true, size: 22, font: 'Arial' })], {
  heading: HeadingLevel.HEADING_3,
  spacing: { before: 160, after: 80 },
});
const para = (text, italic = false) => rtlPara([
  new TextRun({ text, size: 22, font: 'Arial', italics: italic }),
], { spacing: { after: 100 } });

// Build the document children
const children = [];

// Title page
children.push(rtlPara([new TextRun({
  text: 'חברותא — סקירת הלכות מובנות באפליקציה',
  bold: true, size: 40, font: 'Arial',
})], { alignment: AlignmentType.CENTER, spacing: { before: 1200, after: 400 } }));

children.push(rtlPara([new TextRun({
  text: 'מסמך זה מרכז את כל הטקסטים ההלכתיים שמופיעים באפליקציה, מסודרים לפי הקובץ שבו הם מוגדרים. ' +
        'תיקונים שתעשו כאן יש להעתיק חזרה לקובץ המקור (הציטוט בכל פסקה).',
  size: 22, font: 'Arial',
})], { alignment: AlignmentType.CENTER, spacing: { after: 400 } }));

children.push(rtlPara([new TextRun({
  text: `סה"כ ${Object.keys(data).length} קבצים, ${Object.values(data).reduce((s,a)=>s+a.length,0)} פסקאות הלכתיות.`,
  size: 22, font: 'Arial', italics: true,
})], { alignment: AlignmentType.CENTER }));

children.push(new Paragraph({ children: [new PageBreak()] }));

// Sections
const sortedKeys = Object.keys(data).sort((a, b) => {
  // src/data files first, then app/tools files
  const aIsData = a.startsWith('src/data/');
  const bIsData = b.startsWith('src/data/');
  if (aIsData !== bIsData) return aIsData ? -1 : 1;
  return a.localeCompare(b);
});

for (const filePath of sortedKeys) {
  const entries = data[filePath];
  const title = SECTION_TITLES[filePath] || filePath;

  children.push(h1(title));
  children.push(rtlPara([new TextRun({
    text: `[מקור: ${filePath}]`,
    size: 18, font: 'Consolas', color: '666666',
  })], { spacing: { after: 200 } }));

  // Group entries by title (where extractor found one)
  const grouped = new Map();
  for (const e of entries) {
    const key = e.title || '(ללא כותרת)';
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(e);
  }

  for (const [groupTitle, items] of grouped) {
    if (groupTitle !== '(ללא כותרת)') {
      children.push(h3(groupTitle));
    }
    for (const it of items) {
      const fieldLabel = FIELD_LABEL[it.field] || it.field;
      if (it.field && it.field !== '?') {
        children.push(rtlPara([
          new TextRun({ text: `${fieldLabel}: `, bold: true, size: 20, font: 'Arial', color: '666666' }),
        ], { spacing: { before: 80, after: 40 } }));
      }
      // Split by newlines so multiline strings render as multiple paragraphs
      const lines = it.text.split(/\n\s*\n+/);
      for (const line of lines) {
        if (line.trim()) {
          children.push(para(line.trim()));
        }
      }
    }
  }

  children.push(new Paragraph({ children: [new PageBreak()] }));
}

// Build the document
const doc = new Document({
  styles: {
    default: { document: { run: { font: 'Arial', size: 22 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 32, bold: true, font: 'Arial' },
        paragraph: { spacing: { before: 240, after: 200 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 26, bold: true, font: 'Arial' },
        paragraph: { spacing: { before: 180, after: 120 }, outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 22, bold: true, font: 'Arial' },
        paragraph: { spacing: { before: 140, after: 80 }, outlineLevel: 2 } },
    ],
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },  // US Letter
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
      },
    },
    children,
  }],
});

Packer.toBuffer(doc).then(buf => {
  const outPath = path.join(__dirname, '..', 'halacha-review.docx');
  fs.writeFileSync(outPath, buf);
  console.log(`Wrote ${outPath} (${(buf.length / 1024).toFixed(1)} KB)`);
});
