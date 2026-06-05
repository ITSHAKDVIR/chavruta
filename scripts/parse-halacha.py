"""
Parse the Kosharot Halacha Yomit docx into JSON: { entries: [{ hmonth, hday, title, paragraphs }] }
Structure in the source:
  - <w:pStyle w:val="1"/>: chapter title (e.g. "בשר וחלב")
  - <w:pStyle w:val="2"/>: date heading (e.g. "א תשרי", "כ"ט אדר")
  - Subsequent paragraphs: body until next heading 2
"""
import re
import json
import sys
from xml.etree import ElementTree as ET

NS = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
ET.register_namespace("w", NS["w"])

# Hebrew month name → Hebcal months enum (Nisan=1...Adar II=13)
HEBREW_MONTHS = {
    "תשרי": 7,
    "חשון": 8, "חשוון": 8, "מרחשון": 8, "מרחשוון": 8,
    "כסלו": 9,
    "טבת": 10,
    "שבט": 11,
    "אדר": 12,
    "אדר א'": 12, "אדר א": 12, 'אדר א״': 12,
    "אדר ב'": 13, "אדר ב": 13, 'אדר ב״': 13,
    "ניסן": 1,
    "אייר": 2,
    "סיון": 3, "סיוון": 3,
    "תמוז": 4,
    "אב": 5,
    "אלול": 6,
}

# Hebrew numerals 1-30. Common forms include single-letter (א, ב, ...) and double-letter (י"א, ל').
HEBREW_DAY = {
    "א": 1, "ב": 2, "ג": 3, "ד": 4, "ה": 5, "ו": 6, "ז": 7, "ח": 8, "ט": 9, "י": 10,
    "יא": 11, "יב": 12, "יג": 13, "יד": 14, "טו": 15, "טז": 16, "יז": 17, "יח": 18, "יט": 19, "כ": 20,
    "כא": 21, "כב": 22, "כג": 23, "כד": 24, "כה": 25, "כו": 26, "כז": 27, "כח": 28, "כט": 29, "ל": 30,
}


def clean_hebrew_day(s: str) -> str:
    return s.replace('"', "").replace("'", "").replace("׳", "").replace("״", "").replace("'", "").strip()


def parse_date_heading(text: str):
    """'א תשרי' → (7, 1)  /  'כ"ט אדר' → (12, 29)"""
    t = text.strip()
    # split into day-token + month-name
    parts = t.split(maxsplit=1)
    if len(parts) != 2:
        return None
    day_tok, month_tok = parts
    month_tok = month_tok.strip()
    day_clean = clean_hebrew_day(day_tok)
    if day_clean not in HEBREW_DAY:
        return None
    # match month, longest first
    for name in sorted(HEBREW_MONTHS.keys(), key=lambda x: -len(x)):
        if month_tok.startswith(name) or month_tok == name:
            return (HEBREW_MONTHS[name], HEBREW_DAY[day_clean])
    return None


def get_para_style(para):
    pPr = para.find("w:pPr", NS)
    if pPr is None:
        return None
    pStyle = pPr.find("w:pStyle", NS)
    if pStyle is None:
        return None
    return pStyle.get(f"{{{NS['w']}}}val")


def get_para_text(para):
    """Extract all text from a paragraph, concatenated."""
    texts = []
    for t in para.iter(f"{{{NS['w']}}}t"):
        if t.text:
            texts.append(t.text)
    return "".join(texts).strip()


def is_list_item(para):
    pPr = para.find("w:pPr", NS)
    if pPr is None:
        return False
    return pPr.find("w:numPr", NS) is not None


def main(src_path, out_path):
    tree = ET.parse(src_path)
    root = tree.getroot()
    body = root.find("w:body", NS)

    entries = []
    current_entry = None
    current_section_title = None  # subtitle line (bold paragraph between date and body)

    for para in body.findall("w:p", NS):
        style = get_para_style(para)
        text = get_para_text(para)

        if style == "2":
            # date heading
            parsed = parse_date_heading(text)
            if parsed:
                if current_entry:
                    entries.append(current_entry)
                hmonth, hday = parsed
                current_entry = {
                    "hmonth": hmonth,
                    "hday": hday,
                    "dateLabel": text,
                    "title": None,
                    "paragraphs": [],
                }
                current_section_title = None
            else:
                # Unparseable heading 2 — log and skip
                sys.stderr.write(f"[warn] heading2 not parsed: {text!r}\n")
        elif style == "1":
            # chapter title (e.g. "בשר וחלב") — set as section context but not a new entry
            pass
        else:
            # body text
            if not text:
                continue
            if current_entry is None:
                continue
            # First non-list paragraph after the date is the subtitle/title
            if current_entry["title"] is None and not is_list_item(para):
                # treat as title if short and looks like a heading
                if len(text) < 80:
                    current_entry["title"] = text
                    continue
            current_entry["paragraphs"].append(text)

    if current_entry:
        entries.append(current_entry)

    out = {
        "source": "מכון כושרות - הלכה יומית",
        "entries": entries,
    }
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
    sys.stdout.buffer.write(f"Wrote {len(entries)} entries -> {out_path}\n".encode("utf-8"))


if __name__ == "__main__":
    src = sys.argv[1] if len(sys.argv) > 1 else "halacha-unpacked/word/document.xml"
    out = sys.argv[2] if len(sys.argv) > 2 else "src/data/halachaYomit.json"
    main(src, out)
