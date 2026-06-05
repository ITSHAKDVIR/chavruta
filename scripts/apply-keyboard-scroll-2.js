/**
 * Second pass — apply KeyboardScroll only to the OUTER ScrollView in each file.
 *
 * Different from pass 1: this version is conservative about which `<ScrollView>`
 * to convert. It targets only the FIRST `<ScrollView` tag in the file (the
 * outer one), leaving inner ones alone. Pass 1 had a bug where it converted
 * horizontal pickers — this avoids that.
 *
 * Adds KeyboardScroll import; keeps ScrollView import for the inner ones.
 */
const fs = require('fs');
const path = require('path');

const FILES = [
  'app/tools/bedikat-chametz.tsx',
  'app/tools/kvarim.tsx',
  'app/tools/mikvah-finder.tsx',
  'app/tools/minyan-finder.tsx',
  'app/tools/photo-to-rabbi.tsx',
  'app/tools/shul-times.tsx',
  'app/tools/tehillim-split.tsx',
];

const ROOT = path.resolve(__dirname, '..');

for (const rel of FILES) {
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) { console.log(`MISSING ${rel}`); continue; }
  let src = fs.readFileSync(full, 'utf8');
  if (src.includes('KeyboardScroll')) { console.log(`SKIP ${rel}`); continue; }

  const depth = rel.split('/').length - 1;
  const upDots = '../'.repeat(depth);
  const importLine = `import { KeyboardScroll } from '${upDots}src/components/KeyboardScroll';`;

  // Add import after react-native line
  src = src.replace(
    /(import\s*\{[^}]*\}\s*from\s*['"]react-native['"];?\n)/,
    `$1${importLine}\n`,
  );

  // Replace ONLY the first <ScrollView (the outer wrapping one).
  // Match either <ScrollView style=... or <ScrollView contentContainerStyle=... or just <ScrollView followed by whitespace.
  // We match `<ScrollView contentContainerStyle=...` first (typical outer pattern), falling back to plain `<ScrollView`.
  // Use a one-shot replacement — JS String.replace defaults to first match for string-from-regex.
  let replaced = false;
  src = src.replace(/<ScrollView\b/, (match) => {
    if (replaced) return match;
    replaced = true;
    return '<KeyboardScroll';
  });
  if (!replaced) { console.log(`NO-MATCH ${rel}`); continue; }

  // Replace the LAST </ScrollView> (corresponds to outer)
  const lastIdx = src.lastIndexOf('</ScrollView>');
  if (lastIdx === -1) { console.log(`NO-CLOSE ${rel}`); continue; }
  src = src.slice(0, lastIdx) + '</KeyboardScroll>' + src.slice(lastIdx + '</ScrollView>'.length);

  fs.writeFileSync(full, src);
  console.log(`DONE ${rel}`);
}
