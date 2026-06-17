import raw from './siddurIndex.json';

export type SiddurNode = {
  en: string;
  he: string;
  ref?: string;
  children?: SiddurNode[];
};

export type Nusach = 'ashkenazi' | 'sephardi' | 'edot-mizrach' | 'chabad';

const TREES = raw as Record<Nusach, SiddurNode[]>;

export const NUSACH_LABEL: Record<Nusach, string> = {
  ashkenazi: 'אשכנז',
  sephardi: 'ספרד',
  'edot-mizrach': 'עדות מזרח',
  chabad: 'חב"ד',
};

/** All valid nusach strings, used by code that loads from storage. */
export const NUSACH_KEYS: Nusach[] = ['ashkenazi', 'sephardi', 'edot-mizrach', 'chabad'];

export function getNusachTree(n: Nusach): SiddurNode[] {
  return TREES[n] ?? [];
}

/** Walk down a path of slugs and return the children at that point.
 *  An empty path returns the top-level children. */
export function getNodesAtPath(n: Nusach, slugs: string[]): {
  here?: SiddurNode;
  children: SiddurNode[];
  /** Breadcrumb of [{en,he}] for the visited nodes, top-down. */
  trail: { en: string; he: string }[];
} {
  let nodes = getNusachTree(n);
  const trail: { en: string; he: string }[] = [];
  let here: SiddurNode | undefined;
  for (const slug of slugs) {
    const next = nodes.find((c) => slugify(c.en) === slug);
    if (!next) {
      return { children: nodes, trail };
    }
    here = next;
    trail.push({ en: next.en, he: next.he });
    nodes = next.children ?? [];
  }
  return { here, children: nodes, trail };
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/'/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Find a leaf with a specific ref. Used by deep-link routing. */
export function findRef(n: Nusach, slugs: string[]): SiddurNode | undefined {
  const { here } = getNodesAtPath(n, slugs);
  return here?.ref ? here : undefined;
}

/** Flatten all leaf descendants in order, preserving their hierarchical breadcrumb. */
export type FlatLeaf = {
  ref: string;
  he: string;
  en: string;
  /** Breadcrumb of parent labels (excluding the leaf itself) within the queried sub-tree. */
  trail: { he: string; en: string }[];
  /** Synthesized leaves whose text is NOT in Sefaria (piyutim like התעוורי /
   *  התקווה / אני מאמין). When present, the reader uses these lines verbatim
   *  instead of fetching `ref`. Each string is one paragraph (parsed normally). */
  inlineHe?: string[];
};

export function collectLeaves(node: SiddurNode, trail: { he: string; en: string }[] = []): FlatLeaf[] {
  if (node.ref) {
    return [{ ref: node.ref, he: node.he, en: node.en, trail }];
  }
  const out: FlatLeaf[] = [];
  const newTrail = [...trail, { he: node.he, en: node.en }];
  if (node.children) {
    for (const c of node.children) {
      out.push(...collectLeaves(c, newTrail));
    }
  }
  return out;
}

/** Like collectLeaves but for a list of top-level nodes (siddur root). */
export function collectLeavesFromList(nodes: SiddurNode[]): FlatLeaf[] {
  const out: FlatLeaf[] = [];
  for (const n of nodes) {
    out.push(...collectLeaves(n));
  }
  return out;
}

/** Returns true if all direct children of node are themselves containers (no refs).
 *  Used to decide whether to render running text or a navigation list. */
export function hasOnlyContainers(node: SiddurNode): boolean {
  if (!node.children || node.children.length === 0) return false;
  return node.children.every((c) => !c.ref && c.children && c.children.length > 0);
}

/**
 * Top-level item ready for display in the siddur index. The route path is
 * the full slug chain from the original tree, so navigation still works
 * regardless of whether the item was promoted from a deeper level.
 */
export type FlatTopItem = {
  he: string;
  en: string;
  ref?: string;
  childCount: number;
  /** Slash-separated slugs to feed to read.tsx via the `path` query param. */
  routePath: string;
};

/**
 * Sephardi/Edot-Mizrach/Chabad already expose prayer-level entries
 * (שחרית/מנחה/ערבית/etc.) at the top of the tree. Ashkenazi, in contrast,
 * wraps everything under day-type categories ("ימי חול", "שבת", "חגים",
 * "ברכות", "קדיש"). For UX parity — and so the user can tap "תפילת שחרית"
 * directly without first picking "ימי חול" — we promote the children of
 * those categories to top-level here. URLs still use the deep slug path so
 * the reader's tree walker finds them.
 */
const ASHKENAZI_FLATTEN_CATEGORIES = new Set(['Weekday', 'Shabbat', 'Festivals', 'Berachot', 'Kaddish']);

/**
 * Top-level entries that should NOT appear in the index — their content gets
 * merged into the Shacharit flow at read time so the user doesn't see two
 * separate menu items ("Upon Arising" then "Weekday Shacharit").
 */
const HIDE_AT_TOP_LEVEL_EN = new Set([
  'Upon Arising',          // Sephardi
  'Preparatory Prayers',   // Edot HaMizrach
]);

/** True if this node is a "wake-up" container we want absorbed into Shacharit. */
export function isHashkamatHaBokerNode(node: SiddurNode): boolean {
  return HIDE_AT_TOP_LEVEL_EN.has(node.en);
}

export function getFlatTopItems(nusach: Nusach): FlatTopItem[] {
  const tree = getNusachTree(nusach);
  const out: FlatTopItem[] = [];
  const shouldFlatten = nusach === 'ashkenazi';

  for (const top of tree) {
    // Hide pre-Shacharit prep sections — they're prepended to Shacharit's
    // leaf collection at read time (see read.tsx `allLeavesUnderHere`).
    if (HIDE_AT_TOP_LEVEL_EN.has(top.en)) continue;

    const topSlug = slugify(top.en);
    const isFlattenable =
      shouldFlatten &&
      ASHKENAZI_FLATTEN_CATEGORIES.has(top.en) &&
      top.children &&
      top.children.length > 0 &&
      !top.ref;

    if (isFlattenable && top.children) {
      for (const child of top.children) {
        out.push({
          he: child.he,
          en: child.en,
          ref: child.ref,
          childCount: child.children?.length ?? 0,
          routePath: `${topSlug}/${slugify(child.en)}`,
        });
      }
    } else {
      out.push({
        he: top.he,
        en: top.en,
        ref: top.ref,
        childCount: top.children?.length ?? 0,
        routePath: topSlug,
      });
    }
  }
  return out;
}

/**
 * Return the top-level "Hashkamat haBoker" container for this nusach, if it
 * exists. Used by the reader to prepend wake-up prayers into Shacharit.
 */
export function getHashkamatHaBokerNode(nusach: Nusach): SiddurNode | undefined {
  return getNusachTree(nusach).find((n) => HIDE_AT_TOP_LEVEL_EN.has(n.en));
}
