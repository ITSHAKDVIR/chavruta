"""
Extract halachic content from src/data/*.ts files into a structured JSON.
Output goes to /tmp/halacha.json, ready for the docx generator.

We're looking for Hebrew strings that are:
  - Longer than 30 chars (skip UI labels)
  - Inside object/array literals (the data, not formatting code)
  - Tagged with field names like 'description', 'note', 'criteria', 'text',
    'body', 'ruling', 'detail', 'rule', etc.
"""
import json, re, sys, codecs, pathlib
sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer)

# Files known to contain halachic content (not just lists of locations,
# tehillim text, etc.).
HALACHA_FILES = [
    'halachaIndex.ts',
    'arbaaMinim.ts',
    'kasheringData.ts',
    'kasheringSimulator.ts',
    'kashrutSim.ts',
    'cosmeticsIngredients.ts',
    'tefilaInserts.ts',
    'birkatHamazon.ts',
    'shiurim.ts',
    'shemita.ts',
    'aveilus.ts',
    'chuppah.ts',
    'kilayim.ts',
    'brachot.ts',
    'brachotDb.ts',
    'chazakaTalGeshem.ts',
    'kiddushLevana.ts',
    'siddurRelevance.ts',
    'holidayKit.ts',
    'halachaYomit.ts',
    'prayerTimeWindows.ts',
]

# Tool files with embedded halacha (chosen by hebrew-char count earlier).
TOOL_FILES = [
    'arba-minim.tsx',
    'aveilus.tsx',
    'bedikat-chametz.tsx',
    'brit.tsx',
    'chanukah.tsx',
    'compass.tsx',
    'cosmetics-check.tsx',
    'halacha-questions.tsx',
    'hundred-brachot.tsx',
    'kever-visit.tsx',
    'meatmilk.tsx',
    'molad.tsx',
    'motzaei-shabbat.tsx',
    'netilat-arba-minim.tsx',
    'omer.tsx',
    'pidyon.tsx',
    'purim.tsx',
    'sechach-meter.tsx',
    'tahara.tsx',
    'tal-geshem.tsx',
    'tu-bishvat.tsx',
    'yahrtzeit.tsx',
    'yahrzeit.tsx',
]

HEBREW_RX = re.compile(r'[֐-׿]')
# Find string literals: 'xxx', "xxx", or `xxx` (template; may span lines)
STR_RX = re.compile(
    r"""(?:'([^'\\]*(?:\\.[^'\\]*)*)')""" +
    r"""|(?:"([^"\\]*(?:\\.[^"\\]*)*)")""" +
    r"""|(?:`([^`\\]*(?:\\.[^`\\]*)*)`)""",
    re.DOTALL
)
# Find field name immediately before a string: e.g. "description: 'הלכה'"
FIELD_RX = re.compile(r"(\w+)\s*:\s*$")

def extract_from(file_path):
    text = pathlib.Path(file_path).read_text(encoding='utf-8')
    entries = []
    # Track current "object key" by walking back to last identifier before string
    for m in STR_RX.finditer(text):
        s = m.group(1) or m.group(2) or m.group(3) or ''
        if not s or not HEBREW_RX.search(s):
            continue
        # Skip short labels
        if len(s) < 30:
            continue
        # Look backward for a field name on the same or previous line
        prefix = text[max(0, m.start() - 60):m.start()]
        last_line = prefix.rsplit('\n', 1)[-1]
        fm = re.search(r"(\w+)\s*:\s*$", last_line)
        field = fm.group(1) if fm else '?'
        # Try to find a "title"/"label"/"name" sibling for context within ~300 chars
        ctx_start = max(0, m.start() - 400)
        ctx = text[ctx_start:m.start()]
        title_match = list(re.finditer(r"(?:title|label|name|topic|q)\s*:\s*['\"`]([^'\"`]{2,60})['\"`]", ctx))
        title = title_match[-1].group(1) if title_match else ''
        # Clean smart escapes
        clean = (s.replace('\\n', '\n').replace("\\'", "'").replace('\\"', '"')
                  .replace('\\`', '`').replace('\\\\', '\\'))
        entries.append({'field': field, 'title': title, 'text': clean.strip()})
    return entries

def main():
    root = pathlib.Path(__file__).resolve().parent.parent
    out = {}
    for name in HALACHA_FILES:
        path = root / 'src' / 'data' / name
        if not path.exists():
            continue
        entries = extract_from(path)
        if entries:
            out[f'src/data/{name}'] = entries
    for name in TOOL_FILES:
        path = root / 'app' / 'tools' / name
        if not path.exists():
            continue
        entries = extract_from(path)
        if entries:
            out[f'app/tools/{name}'] = entries
    # Stats
    total_files = len(out)
    total_entries = sum(len(v) for v in out.values())
    print(f'Extracted {total_entries} halachic entries across {total_files} files', file=sys.stderr)
    json.dump(out, open('/tmp/halacha.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    print('Wrote /tmp/halacha.json', file=sys.stderr)

if __name__ == '__main__':
    main()
