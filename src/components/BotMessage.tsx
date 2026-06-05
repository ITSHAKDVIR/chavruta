/**
 * BotMessage — bubble with gradual typing animation + markdown rendering.
 *
 * Two markdown modes:
 *  - general/bugs/simulator: plain markdown (**bold**, *italic*, lists with - or ✓,
 *    numbered items with 1. style, `---` divider).
 *  - recommendations: structured cards with custom tags [P]/[K]/[G]/[N]
 *    parsed into product cards with kashrut chips + notes.
 *
 * Typing animation: text appears char-by-char at ~18ms. Tap the bubble to
 * skip to the end. Structured cards (recommendations + sim options) skip
 * animation and stagger-fade in instead.
 */
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../theme/colors';
import { typography } from '../theme/typography';

export type Topic = 'bugs' | 'general' | 'recommendations' | 'simulator';

type Props = {
  text: string;
  topic: Topic;
  /** Skip animation if user is scrolling back through old messages. */
  instant?: boolean;
};

const TYPE_SPEED_MS = 12;

export function BotMessage({ text, topic, instant }: Props) {
  // Character index for typing animation. When equal to text.length, animation done.
  const [typed, setTyped] = useState(instant ? text.length : 0);

  useEffect(() => {
    if (instant) { setTyped(text.length); return; }
    if (topic === 'recommendations') {
      // recommendations uses structured cards — no char-by-char, just render full
      setTyped(text.length);
      return;
    }
    let i = 0;
    const interval = setInterval(() => {
      i += 3; // 3 chars per tick for snappier feel
      if (i >= text.length) {
        setTyped(text.length);
        clearInterval(interval);
      } else {
        setTyped(i);
      }
    }, TYPE_SPEED_MS);
    return () => clearInterval(interval);
  }, [text, topic, instant]);

  // Build visible substring honoring HTML tag boundaries (don't cut mid-tag)
  const visible = text.slice(0, typed);

  return (
    <Pressable onPress={() => setTyped(text.length)}>
      {topic === 'recommendations'
        ? renderRecommendations(text)
        : renderGeneralMarkdown(visible, typed < text.length)}
    </Pressable>
  );
}

/**
 * Convert HTML markup that arrives from the Kosharot simulator/chat backend
 * into the markdown dialect we render natively. The backend wraps blocks in
 * <p>…</p> and emphasis in <strong>…</strong>; without this pass we'd render
 * those tags as visible text (which was the user-reported bug).
 */
function htmlToMarkdown(text: string): string {
  let t = text;
  // Strong → markdown **bold**
  t = t.replace(/<strong>([\s\S]*?)<\/strong>/gi, '**$1**');
  t = t.replace(/<\/?strong>/gi, '**');
  // Paragraphs → newline-separated blocks
  t = t.replace(/<\/p>\s*<p[^>]*>/gi, '\n\n');
  t = t.replace(/<p[^>]*>/gi, '');
  t = t.replace(/<\/p>/gi, '\n');
  // Line breaks
  t = t.replace(/<br\s*\/?>/gi, '\n');
  // Lists → markdown bullets
  t = t.replace(/<\/li>\s*<li[^>]*>/gi, '\n- ');
  t = t.replace(/<li[^>]*>/gi, '- ');
  t = t.replace(/<\/li>/gi, '');
  t = t.replace(/<\/?ul[^>]*>/gi, '\n');
  t = t.replace(/<\/?ol[^>]*>/gi, '\n');
  // Emphasis
  t = t.replace(/<em>([\s\S]*?)<\/em>/gi, '*$1*');
  t = t.replace(/<\/?em>/gi, '*');
  // Strip any leftover tags
  t = t.replace(/<[^>]+>/g, '');
  // Decode common HTML entities
  t = t.replace(/&nbsp;/g, ' ')
       .replace(/&amp;/g, '&')
       .replace(/&lt;/g, '<')
       .replace(/&gt;/g, '>')
       .replace(/&quot;/g, '"')
       .replace(/&#39;/g, "'")
       .replace(/&hellip;/g, '…');
  // Collapse 3+ newlines
  t = t.replace(/\n{3,}/g, '\n\n');
  return t.trim();
}

/**
 * Plain markdown rendering for bugs/general/simulator topics.
 * Supports: **bold**, *italic*, _italic_, [link](url), lists (- ✓), 1. numbered,
 * --- horizontal rule, line breaks. HTML markup from the backend is
 * normalized to markdown first via htmlToMarkdown.
 */
function renderGeneralMarkdown(text: string, partial: boolean) {
  const lines = htmlToMarkdown(text).split('\n');
  const out: React.ReactNode[] = [];
  let listBuf: string[] = [];
  let listType: 'bullet' | 'check' | null = null;

  const flushList = () => {
    if (listBuf.length === 0) return;
    out.push(
      <View key={`list-${out.length}`} style={{ marginVertical: 4, gap: 3 }}>
        {listBuf.map((item, i) => (
          <View key={i} style={{ flexDirection: 'row-reverse', alignItems: 'flex-start' }}>
            <Text style={{ color: listType === 'check' ? colors.success : colors.primary, marginLeft: 6, fontSize: 14 }}>
              {listType === 'check' ? '✓' : '•'}
            </Text>
            <Text style={[mdStyles.line, { flex: 1 }]}>{renderInline(item)}</Text>
          </View>
        ))}
      </View>,
    );
    listBuf = []; listType = null;
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { flushList(); continue; }
    if (line === '---') {
      flushList();
      out.push(<View key={out.length} style={{ height: 1, backgroundColor: colors.glassBorder, marginVertical: 6 }} />);
      continue;
    }
    if (/^\d+\.\s/.test(line)) {
      flushList();
      out.push(
        <View key={out.length} style={mdStyles.numItem}>
          <Text style={mdStyles.line}>{renderInline(line)}</Text>
        </View>,
      );
      continue;
    }
    if (line.startsWith('✓ ')) {
      if (listType !== 'check') { flushList(); listType = 'check'; }
      listBuf.push(line.slice(2));
      continue;
    }
    if (line.startsWith('- ') || line.startsWith('• ')) {
      if (listType !== 'bullet') { flushList(); listType = 'bullet'; }
      listBuf.push(line.slice(2));
      continue;
    }
    flushList();
    out.push(<Text key={out.length} style={mdStyles.line}>{renderInline(line)}</Text>);
  }
  flushList();
  if (partial) {
    out.push(<Text key="cursor" style={{ color: colors.primary, fontWeight: '700' }}>▎</Text>);
  }
  return <>{out}</>;
}

/** Inline parsing: **bold**, *italic*, _italic_, [text](url) → simplified */
function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  // Tokenize by **...**, *...*, _..._
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|_[^_]+_|\[[^\]]+\]\([^)]+\))/g;
  let last = 0; let m: RegExpExecArray | null; let key = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(<Text key={key++}>{text.slice(last, m.index)}</Text>);
    const tok = m[0];
    if (tok.startsWith('**')) parts.push(<Text key={key++} style={{ fontWeight: '700' }}>{tok.slice(2, -2)}</Text>);
    else if (tok.startsWith('*')) parts.push(<Text key={key++} style={{ fontStyle: 'italic' }}>{tok.slice(1, -1)}</Text>);
    else if (tok.startsWith('_')) parts.push(<Text key={key++} style={{ fontStyle: 'italic' }}>{tok.slice(1, -1)}</Text>);
    else if (tok.startsWith('[')) {
      const m2 = tok.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (m2) parts.push(<Text key={key++} style={{ color: '#60a5fa', textDecorationLine: 'underline' }}>{m2[1]}</Text>);
    }
    last = m.index + tok.length;
  }
  if (last < text.length) parts.push(<Text key={key++}>{text.slice(last)}</Text>);
  return parts;
}

/**
 * Recommendations-mode parser — converts the [P]/[K]/[G]/[N] tags into
 * structured cards.
 *
 *  [P]name[/P]            → product name (card title)
 *  [K]kashrut[/K]         → kashrut chip inside the current card
 *  [G]kashrut[/G]         → global-section chip (separate green section)
 *  [N]note[/N]            → note shown under chips
 *  - prefixed lines       → list items
 *  TITLE-like lines       → section header above cards
 */
function renderRecommendations(rawText: string): React.ReactNode {
  // === Full normalization pipeline — matches chat-widget.js exactly ===
  let text = rawText;
  // 1. Fix wonky closing tags [X/] → [/X]
  text = text.replace(/\[([PKGN])\/\]/g, '[/$1]');
  // 2-3. Add "- " prefix to lines starting with bare [P] or [G]
  text = text.replace(/^(\[P\])/gm, '- $1');
  text = text.replace(/^(\[G\])/gm, '- $1');
  // 4. Convert "- [name] —" pattern to "- [P]name[/P] —"
  text = text.replace(/^- \[([^\]]+)\]\s*—\s*/gm, '- [P]$1[/P] — ');
  // 5. Convert "- **name** —" or "- **name**:" to product card
  text = text.replace(/^- \*\*([^*\n]+)\*\*\s*[—:]\s*/gm, '- [P]$1[/P] — ');
  // 6. Line that's ONLY **bold** = section title
  text = text.replace(/^\*\*([^*\n]+)\*\*$/gm, '<TITLE>$1</TITLE>');
  // 7. Convert newlines inside [N]...[/N] notes to pipes (chat-widget convention)
  text = text.replace(/\[N\]([\s\S]*?)\[\/N\]/g, (_, c) => `[N]${c.replace(/\n/g, '|')}[/N]`);
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const out: React.ReactNode[] = [];
  let card: { name: string; koshers: string[]; note: string } | null = null;
  let globalItems: string[] = [];
  let globalTitle = 'ההמלצה כאשר מופיעה אחת מהכשרויות הבאות:';

  function flushCard() {
    if (!card) return;
    const allRequired = card.note.includes('כל הכשרויות');
    out.push(
      <View key={`card-${out.length}`} style={recStyles.card}>
        {card.name ? <Text style={recStyles.cardTitle}>{card.name}</Text> : null}
        {card.koshers.length > 1 && (
          <Text style={recStyles.koshersLabel}>
            {allRequired
              ? 'ההמלצה כאשר מופיעות על המוצר כל הכשרויות הבאות יחד:'
              : 'ההמלצה כאשר מופיעה אחת מהכשרויות הבאות:'}
          </Text>
        )}
        {card.koshers.length > 0 && (
          <View style={recStyles.chipRow}>
            {card.koshers.map((k, i) => (
              <View key={i} style={recStyles.chipKosher}>
                <Text style={recStyles.chipText}>{k}</Text>
              </View>
            ))}
          </View>
        )}
        {card.note && !allRequired && (
          <Text style={recStyles.note}>{card.note.replace(/\|/g, '\n')}</Text>
        )}
      </View>,
    );
    card = null;
  }
  function flushGlobal() {
    if (globalItems.length === 0) return;
    out.push(
      <View key={`global-${out.length}`} style={recStyles.globalBox}>
        <Text style={recStyles.globalTitle}>{globalTitle}</Text>
        <View style={recStyles.chipRow}>
          {globalItems.map((g, i) => (
            <View key={i} style={recStyles.chipGlobal}>
              <Text style={recStyles.chipText}>{g}</Text>
            </View>
          ))}
        </View>
      </View>,
    );
    globalItems = []; globalTitle = 'ההמלצה כאשר מופיעה אחת מהכשרויות הבאות:';
  }
  function startCard(name: string, koshers: string[] = [], note = '') {
    flushCard();
    card = { name, koshers, note };
  }

  for (const line of lines) {
    // Title-like lines (open with אנו ממליצים, מומלץ, וכו')
    if (
      /^<TITLE>/.test(line) ||
      (/^(אנו ממליצים|אנחנו ממליצים|המוצר |המוצרים המומלצים|מומלץ על ידינו|אינו מופיע|בנוסף)/.test(line)
        && !line.startsWith('-'))
    ) {
      if (line.startsWith('בנוסף')) {
        flushCard(); flushGlobal();
        globalTitle = line.replace(/<\/?TITLE>/g, '').trim();
        continue;
      }
      flushCard(); flushGlobal();
      const clean = line
        .replace(/<\/?TITLE>/g, '')
        .replace(/\[K\].*?\[\/K\]/g, '')
        .replace(/\[G\].*?\[\/G\]/g, '')
        .replace(/\[N\][\s\S]*?\[\/N\]/g, '')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .trim();
      out.push(<Text key={`title-${out.length}`} style={recStyles.sectionTitle}>{clean}</Text>);
      continue;
    }

    // List item
    if (line.startsWith('- ')) {
      const content = line.slice(2);
      const gMatch = content.match(/^\[G\](.*?)\[\/G\]/);
      const pMatch = content.match(/^\[P\](.*?)\[\/P\](.*)/);
      if (gMatch) {
        flushCard();
        globalItems.push(gMatch[1].trim());
        continue;
      }
      if (pMatch) {
        const name = pMatch[1].trim();
        const rest = pMatch[2] || '';
        const ks = (rest.match(/\[K\](.*?)\[\/K\]/g) || []).map((s) => s.replace(/\[K?\/?K?\]/g, ''));
        const nm = rest.match(/\[N\]([\s\S]*?)\[\/N\]/);
        startCard(name, ks, nm ? nm[1].trim() : '');
        continue;
      }
      if (content.includes('[K]')) {
        const ks = (content.match(/\[K\](.*?)\[\/K\]/g) || []).map((s) => s.replace(/\[K?\/?K?\]/g, ''));
        const nameIdx = content.search(/\s*\[K\]/);
        const name = nameIdx > 0 ? content.slice(0, nameIdx).trim() : '';
        const nm = content.match(/\[N\]([\s\S]*?)\[\/N\]/);
        startCard(name, ks, nm ? nm[1].trim() : '');
        continue;
      }
      // [K]-only continuation of an open card
      const kOnly = content.match(/^\[K\](.*?)\[\/K\](.*)/);
      if (kOnly) {
        if (!card) card = { name: '', koshers: [], note: '' };
        card.koshers.push(kOnly[1].trim());
        const rest = kOnly[2] || '';
        (rest.match(/\[K\](.*?)\[\/K\]/g) || []).forEach((m) => {
          card!.koshers.push(m.replace(/\[K?\/?K?\]/g, ''));
        });
        const nm = rest.match(/\[N\]([\s\S]*?)\[\/N\]/);
        if (nm) card.note = nm[1].trim();
        continue;
      }
      // [N]-only — attach note to currently open card
      const nMatch = content.match(/^\[N\]([\s\S]*?)\[\/N\]/);
      if (nMatch && card) {
        card.note = nMatch[1].trim();
        continue;
      }
      // Plain list item — convert inline tags and render as bullet
      const inline = content
        .replace(/\[P\](.*?)\[\/P\]/g, '$1')
        .replace(/\[K\](.*?)\[\/K\]/g, '$1')
        .replace(/\[G\](.*?)\[\/G\]/g, '$1')
        .replace(/\[N\]([\s\S]*?)\[\/N\]/g, ' ($1)');
      flushCard();
      out.push(
        <View key={`bul-${out.length}`} style={{ flexDirection: 'row-reverse', marginVertical: 2 }}>
          <Text style={{ color: colors.primary, marginLeft: 6 }}>•</Text>
          <Text style={[mdStyles.line, { flex: 1 }]}>{renderInline(inline)}</Text>
        </View>,
      );
      continue;
    }

    // Standalone tag lines (not in list)
    if (line.includes('[K]')) {
      const ks = (line.match(/\[K\](.*?)\[\/K\]/g) || []).map((s) => s.replace(/\[K?\/?K?\]/g, ''));
      const nameIdx = line.search(/\s*\[K\]/);
      const name = nameIdx > 0 ? line.slice(0, nameIdx).trim() : '';
      const nm = line.match(/\[N\]([\s\S]*?)\[\/N\]/);
      startCard(name, ks, nm ? nm[1].trim() : '');
      continue;
    }
    if (line.includes('[G]')) {
      const gs = (line.match(/\[G\](.*?)\[\/G\]/g) || []).map((s) => s.replace(/\[G?\/?G?\]/g, ''));
      flushCard();
      globalItems.push(...gs);
      continue;
    }

    // Plain paragraph
    flushCard(); flushGlobal();
    out.push(<Text key={`p-${out.length}`} style={mdStyles.line}>{renderInline(line)}</Text>);
  }
  flushCard(); flushGlobal();
  return <>{out}</>;
}

const mdStyles = StyleSheet.create({
  line: { color: colors.textPrimary, fontSize: 14.5, lineHeight: 22 },
  numItem: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    marginVertical: 3,
  },
});

const recStyles = StyleSheet.create({
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
  },
  card: {
    backgroundColor: 'rgba(212,164,55,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(212,164,55,0.3)',
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  koshersLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 4,
  },
  chipRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 4,
  },
  chipKosher: {
    backgroundColor: 'rgba(74,222,128,0.15)',
    borderColor: 'rgba(74,222,128,0.4)',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  chipGlobal: {
    backgroundColor: 'rgba(74,222,128,0.2)',
    borderColor: 'rgba(74,222,128,0.5)',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  chipText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  note: {
    fontSize: 12,
    fontStyle: 'italic',
    color: colors.textMuted,
    marginTop: 4,
  },
  globalBox: {
    backgroundColor: 'rgba(74,222,128,0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(74,222,128,0.4)',
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginBottom: 6,
  },
  globalTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.success,
    marginBottom: 4,
  },
});
