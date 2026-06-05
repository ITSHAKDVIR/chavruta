import { getJSON, setJSON } from '../storage/storage';

const KEY_BACKEND = '@yahadut/tehillim-backend-url';
const KEY_USER = '@yahadut/tehillim-user';
const KEY_GROUPS = '@yahadut/tehillim-groups-joined';

export type TehillimGroupData = {
  groupId: string;
  code?: string;
  name: string;
  total: number;
  chapters: Record<string, string>;
  members: string[];
  updatedAt?: number;
};

export async function getBackendUrl(): Promise<string> {
  return (await getJSON<string>(KEY_BACKEND, '')) || '';
}
export async function setBackendUrl(url: string) {
  await setJSON(KEY_BACKEND, url);
}

export async function getUserName(): Promise<string> {
  return (await getJSON<string>(KEY_USER, '')) || '';
}
export async function setUserName(name: string) {
  await setJSON(KEY_USER, name);
}

export async function getJoinedGroups(): Promise<{ id: string; name: string; code?: string }[]> {
  return getJSON<{ id: string; name: string; code?: string }[]>(KEY_GROUPS, []);
}
export async function addJoinedGroup(g: { id: string; name: string; code?: string }) {
  const list = await getJoinedGroups();
  if (!list.find((x) => x.id === g.id)) {
    list.push(g);
    await setJSON(KEY_GROUPS, list);
  }
}
export async function removeJoinedGroup(id: string) {
  const list = await getJoinedGroups();
  await setJSON(KEY_GROUPS, list.filter((g) => g.id !== id));
}

async function call(url: string, body: any): Promise<any> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function createGroup(name: string, total = 150): Promise<{ groupId: string; code: string } | null> {
  const url = await getBackendUrl();
  if (!url) throw new Error('backend-url-missing');
  return call(url, { action: 'create', name, total });
}

export async function joinGroup(codeOrId: string, user: string): Promise<TehillimGroupData> {
  const url = await getBackendUrl();
  if (!url) throw new Error('backend-url-missing');
  const isCode = /^\d{6}$/.test(codeOrId);
  return call(url, { action: 'join', [isCode ? 'code' : 'groupId']: codeOrId, user });
}

export async function getGroup(groupId: string): Promise<TehillimGroupData> {
  const url = await getBackendUrl();
  if (!url) throw new Error('backend-url-missing');
  return call(url, { action: 'get', groupId });
}

export async function claimChapter(groupId: string, chapter: number, user: string): Promise<any> {
  const url = await getBackendUrl();
  if (!url) throw new Error('backend-url-missing');
  return call(url, { action: 'claim', groupId, chapter, user });
}

export async function releaseChapter(groupId: string, chapter: number, user: string): Promise<any> {
  const url = await getBackendUrl();
  if (!url) throw new Error('backend-url-missing');
  return call(url, { action: 'release', groupId, chapter, user });
}
