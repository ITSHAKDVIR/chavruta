export type WikiSummary = {
  title: string;
  extract: string;
  thumbnail?: string;
  contentUrl: string;
};

export async function fetchWikiSummary(hebrewTitle: string): Promise<WikiSummary | null> {
  try {
    const url = `https://he.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(hebrewTitle)}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'yahadut-app/1.0' } });
    if (!res.ok) return null;
    const json: any = await res.json();
    return {
      title: json.title,
      extract: json.extract,
      thumbnail: json.thumbnail?.source,
      contentUrl: json.content_urls?.desktop?.page || `https://he.wikipedia.org/wiki/${encodeURIComponent(hebrewTitle)}`,
    };
  } catch {
    return null;
  }
}
