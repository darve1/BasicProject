// 크롤링 예절: robots.txt 확인, 같은 호스트에 1초 이상 간격, 식별 가능한 User-Agent
import { BlockedError } from "./types";

export const USER_AGENT = "BasicProjectBot/0.1 (+https://github.com/darve1/BasicProject)";
const MIN_GAP_MS = 1200;

const lastHit = new Map<string, number>();
const robotsCache = new Map<string, Rule[]>();

type Rule = { allow: boolean; path: string };

// User-agent: * 그룹의 Allow/Disallow만 본다. 가장 긴 경로가 이긴다 (RFC 9309)
export function parseRobots(txt: string): Rule[] {
  const rules: Rule[] = [];
  let inStar = false;
  let sawRule = false;
  for (const raw of txt.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, "").trim();
    const m = line.match(/^([A-Za-z-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const key = m[1].toLowerCase();
    const val = m[2].trim();
    if (key === "user-agent") {
      if (sawRule) {
        inStar = false;
        sawRule = false;
      }
      if (val === "*") inStar = true;
    } else if (key === "allow" || key === "disallow") {
      sawRule = true;
      if (inStar && val) rules.push({ allow: key === "allow", path: val });
    }
  }
  return rules;
}

export function isAllowed(rules: Rule[], pathname: string): boolean {
  let best: Rule | null = null;
  for (const r of rules) {
    const re = new RegExp(
      "^" + r.path.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\\\$$/, "$"),
    );
    if (re.test(pathname) && (!best || r.path.length > best.path.length)) best = r;
  }
  return !best || best.allow;
}

async function robotsFor(origin: string): Promise<Rule[]> {
  if (!robotsCache.has(origin)) {
    let rules: Rule[] = [];
    try {
      const res = await fetch(`${origin}/robots.txt`, { headers: { "user-agent": USER_AGENT } });
      if (res.ok) rules = parseRobots(await res.text());
    } catch {
      // robots.txt를 못 읽으면 제한 없음으로 본다
    }
    robotsCache.set(origin, rules);
  }
  return robotsCache.get(origin)!;
}

async function wait(host: string) {
  const gap = Date.now() - (lastHit.get(host) ?? 0);
  if (gap < MIN_GAP_MS) await new Promise((r) => setTimeout(r, MIN_GAP_MS - gap));
  lastHit.set(host, Date.now());
}

export async function politeFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const u = new URL(url);
  if (!isAllowed(await robotsFor(u.origin), u.pathname + u.search)) {
    throw new BlockedError(`robots.txt가 ${u.pathname} 수집을 허용하지 않음`);
  }
  await wait(u.host);
  const res = await fetch(url, {
    ...init,
    headers: { "user-agent": USER_AGENT, "accept-language": "ko-KR,ko;q=0.9", ...init.headers },
  });
  if (res.status === 403 || res.status === 429) throw new BlockedError(`${u.host} 응답 ${res.status}`);
  if (!res.ok) throw new Error(`${url} 요청 실패 (${res.status})`);
  return res;
}

export const getText = async (url: string, init?: RequestInit) => (await politeFetch(url, init)).text();
export const getJson = async <T>(url: string, init?: RequestInit) => (await politeFetch(url, init)).json() as Promise<T>;
