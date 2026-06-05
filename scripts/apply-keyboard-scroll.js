/**
 * Replace ScrollView with KeyboardScroll in screens that have TextInput.
 *
 * Strategy:
 *   1. Identify files importing both ScrollView and TextInput from react-native.
 *   2. Remove `ScrollView` from the named imports list.
 *   3. Insert `import { KeyboardScroll } from '...components/KeyboardScroll'`
 *      after the react-native import.
 *   4. Replace `<ScrollView ` → `<KeyboardScroll ` and `</ScrollView>` → `</KeyboardScroll>`.
 *
 * Skips files that already use KeyboardScroll. Reports per-file outcomes.
 *
 * Files driven by the explicit user-facing list of screens with bottom-of-view
 * inputs (yahrzeit, kever, refuah, etc.). Re-run any time a new input screen
 * is added.
 */

const fs = require('fs');
const path = require('path');

const FILES = [
  'app/tools/refuah-acrostic.tsx',
  'app/tools/kever-visit.tsx',
  'app/tools/mishnayos-neshama.tsx',
  'app/tools/yahrzeit.tsx',
  'app/tools/yahrtzeit.tsx',
  'app/tools/chiddushim.tsx',
  'app/tools/books-learned.tsx',
  'app/tools/halacha-questions.tsx',
  'app/tools/aveilus.tsx',
  'app/tools/brit.tsx',
  'app/tools/cholim.tsx',
  'app/tools/parent-call.tsx',
  'app/tools/contacts-halacha.tsx',
  'app/tools/hebrew-birthday.tsx',
  'app/tools/pidyon.tsx',
  'app/tools/chuppah.tsx',
  'app/tools/tahara.tsx',
  'app/tools/gematria.tsx',
  'app/tools/learning-plan.tsx',
  'app/tools/dates.tsx',
  'app/tools/maaser.tsx',
  'app/tools/halacha-search.tsx',
  'app/tools/whatsapp-groups.tsx',
  'app/halacha/challah.tsx',
  'app/halacha/maasrot-calc.tsx',
  'app/halacha/trumot.tsx',
  'app/brachot/db.tsx',
];

const ROOT = path.resolve(__dirname, '..');

function processFile(rel) {
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) return { rel, status: 'missing' };
  let src = fs.readFileSync(full, 'utf8');
  if (src.includes('KeyboardScroll')) return { rel, status: 'already' };
  if (!src.includes('ScrollView')) return { rel, status: 'no-scroll' };
  if (!src.includes('TextInput')) return { rel, status: 'no-input' };

  // Compute relative import path from the file to src/components/KeyboardScroll
  const depth = rel.split('/').length - 1; // app/tools/foo.tsx -> 2
  const upDots = '../'.repeat(depth);
  const importLine = `import { KeyboardScroll } from '${upDots}src/components/KeyboardScroll';`;

  // 1. Strip ScrollView from a `from 'react-native'` import line
  // Match: import { Foo, ScrollView, Bar } from 'react-native';
  src = src.replace(/(import\s*\{[^}]*?)ScrollView,?\s*([^}]*\}\s*from\s*['"]react-native['"];?)/,
    (match, before, after) => {
      // clean up double commas / leading/trailing commas
      let combined = before + after;
      combined = combined.replace(/\{\s*,/, '{');
      combined = combined.replace(/,\s*,/g, ',');
      combined = combined.replace(/,\s*\}/, ' }');
      return combined;
    });

  // 2. Insert KeyboardScroll import after the react-native import line
  src = src.replace(
    /(import\s*\{[^}]*\}\s*from\s*['"]react-native['"];?\n)/,
    `$1${importLine}\n`,
  );

  // 3. Replace JSX tags
  src = src.replace(/<ScrollView\b/g, '<KeyboardScroll');
  src = src.replace(/<\/ScrollView>/g, '</KeyboardScroll>');

  fs.writeFileSync(full, src);
  return { rel, status: 'done' };
}

let done = 0, skipped = 0, missing = 0;
for (const f of FILES) {
  const r = processFile(f);
  console.log(`  ${r.status.padEnd(10)} ${r.rel}`);
  if (r.status === 'done') done++;
  else if (r.status === 'missing') missing++;
  else skipped++;
}
console.log(`\nResult: ${done} updated, ${skipped} skipped, ${missing} missing`);
