type StatusItem = {
  id?: number | string;
  code?: number | string;
  value?: string;
  name?: string;
  label?: string;
  title?: string;
  text?: string;
};

export type StatusMap = Record<string | number, string>;

const cache = new Map<string, StatusMap>();

function parseStatusMap(json: any): StatusMap {
  const map: StatusMap = {};
  if (!json) return map;
  // direct mapping like {1:"Pending",2:"Done"}
  if (typeof json === "object" && !Array.isArray(json)) {
    const candidate = json.statuses || json.data?.statuses || json;
    if (
      candidate &&
      typeof candidate === "object" &&
      !Array.isArray(candidate)
    ) {
      for (const [k, v] of Object.entries(candidate)) {
        if (typeof v === "string") map[k] = v;
        else if (v && typeof v === "object") {
          const str =
            (v as any).name ??
            (v as any).label ??
            (v as any).title ??
            (v as any).text;
          if (str) map[k] = String(str);
        }
      }
      if (Object.keys(map).length) return map;
    }
  }
  // array of items
  const arr: StatusItem[] = Array.isArray(json)
    ? json
    : json?.statuses || json?.data?.statuses || json?.data || json?.items || [];
  if (Array.isArray(arr)) {
    for (const it of arr as any[]) {
      const id = (it?.id ?? it?.code) as any;
      const label = it?.name ?? it?.label ?? it?.title ?? it?.text ?? it?.value;
      if (id !== undefined && id !== null && label) map[id] = String(label);
    }
  }
  return map;
}

async function tryFetch(
  url: string,
  token?: string
): Promise<StatusMap | null> {
  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    const txt = await res.text();
    let json: any = {};
    try {
      json = txt ? JSON.parse(txt) : {};
    } catch {
      json = {};
    }
    if (!res.ok) return null;
    const map = parseStatusMap(json);
    return Object.keys(map).length ? map : null;
  } catch {
    return null;
  }
}

function getDefaultMap(
  type?: "responses" | "repairs" | "services" | "history"
): StatusMap {
  // Reasonable defaults in Georgian, used when API doesn't expose a dictionary
  const common: StatusMap = {
    1: "ელოდება დადასტურებას",
    2: "მიმდინარეობს შესრულება",
    3: "დასრულებული",
  };
  // Can be customized per type if needed later
  return common;
}

export async function loadStatusMap(
  baseUrl: string,
  token?: string,
  type?: "responses" | "repairs" | "services" | "history"
): Promise<StatusMap> {
  const key = `${baseUrl}|${type || "all"}`;
  if (cache.has(key)) return cache.get(key)!;

  const candidates: string[] = [];
  if (type === "responses" || type === "history" || !type) {
    candidates.push(
      `${baseUrl}/app/responses/statuses`,
      `${baseUrl}/app/statuses/responses`,
      `${baseUrl}/app/responses-statuses`
    );
  }
  if (type === "repairs" || type === "history" || !type) {
    candidates.push(
      `${baseUrl}/app/repairs/statuses`,
      `${baseUrl}/app/statuses/repairs`,
      `${baseUrl}/app/repairs-statuses`
    );
  }
  if (type === "services" || type === "history" || !type) {
    candidates.push(
      `${baseUrl}/app/services/statuses`,
      `${baseUrl}/app/statuses/services`,
      `${baseUrl}/app/services-statuses`
    );
  }
  // generic fallbacks
  candidates.push(
    `${baseUrl}/app/statuses`,
    `${baseUrl}/statuses`,
    `${baseUrl}/status`
  );

  let fetched: StatusMap | null = null;
  for (const url of candidates) {
    const map = await tryFetch(url, token);
    if (map) {
      fetched = map;
      break;
    }
  }
  const merged = { ...getDefaultMap(type), ...(fetched || {}) } as StatusMap;
  cache.set(key, merged);
  return merged;
}

export function mapStatusLabel(map: StatusMap, raw: any): string {
  const s = raw?.status ?? raw?.state ?? raw;
  if (typeof s === "string") return s;
  if (s && typeof s === "object")
    return s.name ?? s.label ?? s.title ?? s.text ?? String(s.id ?? "");
  if (s != null && map && s in map) return map[s];
  return raw?.status_text || raw?.status_label || (s != null ? String(s) : "—");
}
