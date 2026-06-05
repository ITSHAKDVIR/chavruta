/**
 * Add `iconName` field to every tool in src/data/tools.ts based on its
 * emoji + title. Maps emoji glyphs to Lucide icon names (those registered
 * in src/components/Icon.tsx).
 */
const fs = require('fs');
const path = require('path');

const TOOLS_FILE = path.resolve(__dirname, '../src/data/tools.ts');
const ICON_FILE = path.resolve(__dirname, '../src/components/Icon.tsx');

// Build the available icon name set from Icon.tsx
const iconSrc = fs.readFileSync(ICON_FILE, 'utf8');
const availableIcons = new Set();
const iconBlockMatch = iconSrc.match(/export const ICONS = \{([\s\S]*?)^\}/m);
if (iconBlockMatch) {
  const matches = iconBlockMatch[1].matchAll(/^\s*(\w+):/gm);
  for (const m of matches) availableIcons.add(m[1]);
}
console.log(`Available icons: ${availableIcons.size}`);

// Mapping rules: emoji or title-keyword → lucide name
// Tried in order; first match wins.
const RULES = [
  // Specific emoji
  ['🕐', 'clock'], ['⏰', 'clock'], ['🕑', 'clock'],
  ['📖', 'book'], ['📚', 'book'], ['📘', 'book'], ['📕', 'book'], ['📗', 'book'],
  ['📜', 'scroll'], ['📃', 'scroll'],
  ['🕯', 'flame'], ['🕯️', 'flame'], ['🔥', 'flame'],
  ['💧', 'droplet'], ['💦', 'droplets'],
  ['🌙', 'moon'], ['🌚', 'moon'], ['🌛', 'moon'],
  ['⭐', 'star'], ['✨', 'sparkles'], ['🌟', 'star'],
  ['🍂', 'leaf'], ['🍁', 'leaf'], ['🌿', 'leaf'], ['🌱', 'sprout'], ['🌳', 'leaf'],
  ['🌅', 'sun'], ['🌄', 'sun'], ['☀️', 'sun'], ['🌞', 'sun'],
  ['🌃', 'moon'], ['🌌', 'moon'],
  ['🍞', 'wheat'], ['🥖', 'wheat'], ['🌾', 'wheat'],
  ['🔍', 'search'], ['🔎', 'search'],
  ['📍', 'pin'], ['🗺', 'map'], ['🗺️', 'map'],
  ['🤖', 'sparkles'], ['💬', 'sparkles'],
  ['✍️', 'pencil'], ['📝', 'pencil'], ['✏️', 'pencil'],
  ['🍽', 'utensils'], ['🍽️', 'utensils'], ['🥄', 'utensils'],
  ['🌊', 'waves'], ['🛁', 'droplet'],
  ['🐛', 'bug'], ['🪲', 'bug'],
  ['📿', 'book'],
  ['⚖️', 'scale'], ['⚖', 'scale'],
  ['🍎', 'apple'], ['🍊', 'apple'], ['🍋', 'apple'],
  ['🫕', 'flame'], ['🍳', 'flame'], ['🥘', 'flame'],
  ['🛠', 'wrench'], ['🛠️', 'wrench'], ['🔧', 'wrench'],
  ['📐', 'ruler'], ['📏', 'ruler'],
  ['🏠', 'home'], ['🏡', 'home'],
  ['🎯', 'target'],
  ['🎲', 'help'], ['❓', 'help'],
  ['🏆', 'trophy'],
  ['💍', 'heart'], ['❤️', 'heart'], ['💝', 'heart'],
  ['👶', 'baby'],
  ['📞', 'phone'], ['☎️', 'phone'],
  ['🍷', 'wine'], ['🍾', 'wine'], ['🍺', 'wine'],
  ['🪞', 'mirror'],
  ['🧹', 'broom'],
  ['🥚', 'egg'],
  ['🐔', 'bird'], ['🐓', 'bird'],
  ['🪶', 'feather'],
  ['🐟', 'fish'], ['🐠', 'fish'],
  ['🥕', 'sprout'], ['🥬', 'leaf'], ['🥦', 'sprout'],
  ['🌰', 'sprout'],
  ['🪙', 'coin'], ['💰', 'coin'],
  ['🕊️', 'feather'], ['🕊', 'feather'],
  ['📅', 'calendar'], ['📆', 'calendar'], ['🗓', 'calendar'], ['🗓️', 'calendar'],
  ['🎉', 'sparkles'], ['🎊', 'sparkles'],
  ['📦', 'box'],
  ['⏳', 'clock'], ['⌛', 'clock'],
  ['🌍', 'globe'], ['🌎', 'globe'], ['🌏', 'globe'],
  ['🧮', 'calculator'],
  ['📊', 'bar-chart'],
  ['🎨', 'palette'],
  ['🏛', 'landmark'], ['🏛️', 'landmark'],
  ['📦', 'box'],
  ['💡', 'sparkles'],
  ['🔔', 'bell'],
  ['📢', 'megaphone'],
  ['👑', 'crown'],
  ['🪷', 'flower'],
  ['🌺', 'flower'],
  ['🍇', 'apple'],
  ['🪴', 'sprout'],
  ['⚱️', 'flame'], ['⚱', 'flame'],
  ['🌬', 'wind'],
  ['🦋', 'sparkles'],
  ['🧿', 'star'],
  ['🪶', 'feather'],
  ['⚡', 'sparkles'],
  ['🔦', 'sparkles'],

  // Title keyword fallbacks (Hebrew)
  // These run only if no emoji match
];

const KEYWORD_RULES = [
  ['זמני', 'clock'],
  ['שעה', 'clock'],
  ['שעות', 'clock'],
  ['תפיל', 'book'],
  ['סידור', 'book'],
  ['ברכ', 'book'],
  ['פדיון', 'coin'],
  ['חופה', 'heart'],
  ['ברית', 'baby'],
  ['קבר', 'pin'],
  ['ירושלים', 'pin'],
  ['בית כנסת', 'landmark'],
  ['מסעד', 'utensils'],
  ['חרק', 'bug'],
  ['מקווה', 'droplet'],
  ['מקוואות', 'droplet'],
  ['חלה', 'wheat'],
  ['תרומ', 'wheat'],
  ['מעשר', 'wheat'],
  ['ערלה', 'apple'],
  ['ספיר', 'sun'],
  ['עומר', 'wheat'],
  ['הכשרה', 'flame'],
  ['הכשרת', 'flame'],
  ['פסח', 'wheat'],
  ['חרוסת', 'apple'],
  ['חמץ', 'wheat'],
  ['חנוכה', 'flame'],
  ['פורים', 'sparkles'],
  ['מגיל', 'scroll'],
  ['רעשן', 'bell'],
  ['סוכ', 'home'],
  ['סכך', 'home'],
  ['לולב', 'leaf'],
  ['הושענ', 'leaf'],
  ['ארבעת', 'leaf'],
  ['מינים', 'leaf'],
  ['לבוד', 'ruler'],
  ['גימטר', 'calculator'],
  ['מחשבון', 'calculator'],
  ['חזק', 'droplet'],
  ['טל', 'droplet'],
  ['גשם', 'droplet'],
  ['ערוב', 'utensils'],
  ['תבשיל', 'utensils'],
  ['בשר', 'utensils'],
  ['חלב', 'droplet'],
  ['בדיק', 'search'],
  ['חיפוש', 'search'],
  ['גישה', 'search'],
  ['קומפס', 'compass'],
  ['מצפן', 'compass'],
  ['כיוון', 'compass'],
  ['חבר', 'sparkles'],
  ['רב', 'sparkles'],
  ['שאל', 'sparkles'],
  ['חידוש', 'pencil'],
  ['חידושי', 'pencil'],
  ['ספר', 'book'],
  ['ספרים', 'book'],
  ['לימוד', 'book'],
  ['פרשה', 'scroll'],
  ['פרשת', 'scroll'],
  ['שניים', 'book'],
  ['משניות', 'book'],
  ['משנה', 'book'],
  ['גמרא', 'book'],
  ['דף', 'book'],
  ['רמב', 'book'],
  ['929', 'book'],
  ['חוק', 'scroll'],
  ['ישראל', 'scroll'],
  ['תהיל', 'book'],
  ['תהילים', 'book'],
  ['רפוא', 'heart'],
  ['חולה', 'heart'],
  ['חולים', 'heart'],
  ['חיים', 'heart'],
  ['הים', 'waves'],
  ['ים', 'waves'],
  ['דרך', 'map'],
  ['נסיע', 'map'],
  ['חצות', 'moon'],
  ['לילה', 'moon'],
  ['שינה', 'moon'],
  ['מטה', 'moon'],
  ['מיטה', 'moon'],
  ['מולד', 'moon'],
  ['לבנה', 'moon'],
  ['מילה', 'baby'],
  ['ק"ש', 'book'],
  ['שמע', 'book'],
  ['ידיש', 'baby'],
  ['ילד', 'baby'],
  ['ברכת', 'book'],
  ['פדיון', 'coin'],
  ['מאיר', 'sparkles'],
  ['יארצייט', 'flame'],
  ['היסטוריה', 'history'],
  ['היסטו', 'history'],
  ['יום הולדת', 'cake'],
  ['היום הזה', 'history'],
  ['יומי', 'calendar'],
  ['היום', 'calendar'],
  ['לוח', 'calendar'],
  ['תקופ', 'leaf'],
  ['כפרות', 'bird'],
  ['תרנגול', 'bird'],
  ['ביכורי', 'wheat'],
  ['חוקי', 'scroll'],
  ['הלכ', 'book'],
  ['מוסר', 'book'],
  ['ילדים', 'baby'],
  ['ברכת ילדים', 'baby'],
  ['בור', 'droplet'],
  ['טהר', 'droplet'],
  ['ניד', 'droplet'],
  ['חינוך', 'book'],
  ['מוצאי', 'moon'],
  ['הבדל', 'wine'],
  ['קידוש', 'wine'],
  ['שבת', 'flame'],
  ['חופ', 'heart'],
  ['חתונה', 'heart'],
  ['אביב', 'leaf'],
  ['קי"ץ', 'sun'],
  ['קיץ', 'sun'],
  ['חורף', 'moon'],
  ['סתיו', 'leaf'],
  ['פרי', 'apple'],
  ['פירות', 'apple'],
  ['ירק', 'sprout'],
  ['ירקות', 'sprout'],
  ['גוי', 'globe'],
  ['חוץ לארץ', 'globe'],
  ['בית', 'home'],
  ['מטבח', 'utensils'],
  ['כלי', 'utensils'],
  ['כלים', 'utensils'],
  ['בעל בית', 'home'],
];

function pickIcon(emoji, title) {
  // Try emoji first
  for (const [pattern, name] of RULES) {
    if (emoji && emoji.includes(pattern)) {
      return availableIcons.has(name) ? name : null;
    }
  }
  // Try keyword fallback
  for (const [kw, name] of KEYWORD_RULES) {
    if (title && title.includes(kw)) {
      return availableIcons.has(name) ? name : null;
    }
  }
  return null;
}

let src = fs.readFileSync(TOOLS_FILE, 'utf8');
const toolRegex = /\{\s*id:\s*'([^']+)'[^}]*?title:\s*'([^']+)'[^}]*?emoji:\s*'([^']+)'[^}]*?\}/g;
let updated = 0;
let skipped = 0;

src = src.replace(toolRegex, (match, id, title, emoji) => {
  if (match.includes('iconName:')) {
    skipped++;
    return match;
  }
  const icon = pickIcon(emoji, title);
  if (!icon) {
    skipped++;
    return match;
  }
  // Insert iconName: 'X' right after emoji: 'X' field
  const newMatch = match.replace(
    /emoji:\s*'([^']+)'/,
    `emoji: '$1', iconName: '${icon}'`,
  );
  updated++;
  return newMatch;
});

fs.writeFileSync(TOOLS_FILE, src);
console.log(`Updated: ${updated}, Skipped: ${skipped}`);
