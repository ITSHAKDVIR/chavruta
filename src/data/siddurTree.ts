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
