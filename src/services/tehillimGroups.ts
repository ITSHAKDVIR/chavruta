/**
 * Tehillim groups client — talks to the PHP server at kosharot.co.il/BIMD.
 *
 * The server provides:
 *   - create / get / claim / release endpoints (JSON)
 *   - a shareable HTML viewer at action=view&id=X that non-app users open
 *     in any browser to join the distribution
 */

const ENDPOINT = 'https://www.kosharot.co.il/BIMD/tehillim-groups.php';

export type TehillimGroup = {
  id: string;
  name: string;
  dedication: string;
  created: number;
  /** perek number (1-150) → claimer name */
  claims: Record<string, string>;
};

export function viewUrl(id: string): string {
  return `${ENDPOINT}?action=view&id=${id}`;
}

export async function createGroup(name: string, dedication: string): Promise<{ id: string; link: string; group: TehillimGroup }> {
  const res = await fetch(`${ENDPOINT}?action=create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, dedication }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getGroup(id: string): Promise<TehillimGroup> {
  const res = await fetch(`${ENDPOINT}?action=get&id=${id}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function claimPerek(id: string, perek: number, claimer: string): Promise<TehillimGroup> {
  const res = await fetch(`${ENDPOINT}?action=claim`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, perek, claimer }),
  });
  const json = await res.json();
  if (!res.ok || json.error) throw new Error(json.error || 'שגיאה');
  return json;
}

export async function releasePerek(id: string, perek: number): Promise<TehillimGroup> {
  const res = await fetch(`${ENDPOINT}?action=release`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, perek }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
