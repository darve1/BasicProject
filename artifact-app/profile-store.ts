// 보는 사람의 조건 저장소.
// claude.ai에 로그인한 사람: 아티팩트의 사람별 비공개 저장소(data/users/<id>/profile, 본인만 읽고 씀)
// 그 밖: 이 브라우저(localStorage). 둘 다 안 되면 이번 방문 동안만 기억한다
export type Profile = { brandIds: string[]; ageBand: string | null; roles: string[]; services: string[] };

const KEY = "subscription-ledger:profile:v1";

type DocRef = {
  get(): Promise<{ exists: boolean; data(): Record<string, unknown> | undefined }>;
  set(data: Record<string, unknown>): Promise<void>;
};

type ClaudeWindow = { claude?: { use(name: string): Promise<unknown> } };

export function loadLocal(): Profile | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? normalize(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

function saveLocal(p: Profile): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
    return true;
  } catch {
    return false;
  }
}

const strings = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);

export function normalize(v: unknown): Profile {
  const o = (v ?? {}) as Record<string, unknown>;
  return {
    brandIds: strings(o.brandIds),
    ageBand: typeof o.ageBand === "string" ? o.ageBand : null,
    roles: strings(o.roles),
    services: strings(o.services),
  };
}

let remoteRef: Promise<DocRef | null> | null = null;

// 저장소가 없거나(로그인 안 함, 권한 없음) 10초 안에 답이 없으면 null
export function remoteProfile(): Promise<DocRef | null> {
  remoteRef ??= (async () => {
    const claude = (window as unknown as ClaudeWindow).claude;
    if (!claude?.use) return null;
    const [db, user] = (await Promise.all([claude.use("db"), claude.use("user")])) as [
      { doc(path: string): DocRef } | null,
      { id(): Promise<string | null> } | null,
    ];
    if (!db || !user) return null;
    const id = await user.id();
    return id ? db.doc(`data/users/${id}/profile`) : null;
  })().catch(() => null);
  return remoteRef;
}

export async function loadRemote(): Promise<Profile | null> {
  const ref = await remoteProfile();
  if (!ref) return null;
  try {
    const snap = await ref.get();
    return snap.exists ? normalize(snap.data()) : null;
  } catch {
    return null;
  }
}

// 어디에 저장됐는지 돌려준다: "account" | "browser" | "memory"
export async function saveProfile(p: Profile): Promise<"account" | "browser" | "memory"> {
  const local = saveLocal(p);
  const ref = await remoteProfile();
  if (ref) {
    try {
      await ref.set({ ...p, updatedAt: new Date().toISOString() });
      return "account";
    } catch {
      // 읽기 전용 보기 등으로 거절되면 브라우저 저장만 남긴다
    }
  }
  return local ? "browser" : "memory";
}
