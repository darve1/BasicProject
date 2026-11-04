// 아티팩트 실사용 모드: 서버 없이 페이지에 담긴 공개 카탈로그로 실제 사이트와 같은 화면을 그린다
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { createRoot } from "react-dom/client";
import type { FormState } from "@/app/actions";
import { Page, PageHead } from "@/components/ledger";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import { AboutView } from "@/components/views/about-view";
import { CategoryView, SERVICE_CATS } from "@/components/views/category-view";
import { DealView } from "@/components/views/deal-view";
import { DEAL_CATS, DEAL_TYPES, DealsView, queryDeals } from "@/components/views/deals-view";
import { HOME_FILTERS, HomeView } from "@/components/views/home-view";
import { initialServices, LowestView } from "@/components/views/lowest-view";
import { MyView } from "@/components/views/my-view";
import { buildCalcData } from "@/lib/calc-data";
import type { Viewer } from "@/lib/data";
import { AGE_BANDS, eligibilityTags, ROLES } from "@/lib/eligibility";
import { canGet } from "@/lib/match";
import type { Brand, Card, Deal, DealCategory, DealType, Plan, ServiceCategory, Source } from "@/lib/types";
import { conditionLabels } from "@/lib/viewer";
import { loadLocal, loadRemote, normalize, remoteProfile, saveProfile, type Profile } from "./profile-store";
import Link, { fromToken, RouterContext, toToken } from "./router";

type Catalog = { generatedAt: string; brands: Brand[]; plans: Plan[]; cards: Card[]; deals: Deal[]; sources: Source[] };

const catalog = JSON.parse(document.getElementById("ledger-data")!.textContent!) as Catalog;
const active = catalog.deals.filter((d) => d.is_active);

function toViewer(p: Profile | null): Viewer {
  const prof = p ?? { brandIds: [], ageBand: null, roles: [], services: [] };
  return {
    userId: "this-browser",
    email: null,
    ageBand: prof.ageBand,
    roles: prof.roles,
    services: prof.services,
    brandIds: prof.brandIds,
    elig: eligibilityTags(prof.ageBand, prof.roles),
    hasProfile: p !== null,
  };
}

const BAND_IDS = new Set<string>(AGE_BANDS.map((b) => b.id));
const ROLE_IDS = new Set<string>(ROLES.map((r) => r.id));
const BRAND_IDS = new Set(catalog.brands.map((b) => b.id));

const STORED_AT = {
  account: "저장했어요. claude.ai 계정에 나만 볼 수 있게 저장돼서 다른 기기에서도 이어져요.",
  browser: "저장했어요. 이 브라우저에 저장돼요. 다른 기기에서는 다시 적어야 해요.",
  memory: "이번 방문 동안만 기억해요. 이 브라우저는 저장을 막고 있어요.",
} as const;

function App() {
  const [path, setPath] = useState(() => fromToken(location.hash.slice(1)));
  const [profile, setProfile] = useState<Profile | null>(() => loadLocal());
  const [accountStore, setAccountStore] = useState(false);

  // 계정 저장소에 저장된 조건이 있으면 그걸로 맞춘다 (다른 기기에서 저장한 것)
  useEffect(() => {
    let alive = true;
    remoteProfile().then((ref) => alive && setAccountStore(Boolean(ref)));
    loadRemote().then((p) => alive && p && setProfile(p));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const onHash = () => {
      const token = location.hash.slice(1);
      setPath((cur) => {
        if (toToken(cur) === token) return cur;
        scrollTo(0, 0);
        return fromToken(token);
      });
    };
    addEventListener("hashchange", onHash);
    return () => removeEventListener("hashchange", onHash);
  }, []);

  const navigate = useCallback((href: string) => {
    setPath(href);
    const token = toToken(href);
    if (location.hash.slice(1) !== token) location.hash = token;
    scrollTo(0, 0);
  }, []);

  const viewer = useMemo(() => toViewer(profile), [profile]);
  const calc = useMemo(() => buildCalcData(catalog.brands, catalog.plans, catalog.cards, viewer), [viewer]);
  const personal = viewer.hasProfile;
  const reachable = useMemo(() => (personal ? active.filter((d) => canGet(d, viewer.brandIds, viewer.elig)) : active), [personal, viewer]);

  // 서버 사이트와 같은 모양으로 FormData를 읽어 저장한다
  const save = useCallback(async (_: FormState, form: FormData): Promise<FormState> => {
    const ageBand = String(form.get("age_band") ?? "");
    const next: Profile = normalize({
      ageBand: BAND_IDS.has(ageBand) ? ageBand : null,
      roles: form.getAll("roles").map(String).filter((r) => ROLE_IDS.has(r)),
      brandIds: [...new Set(form.getAll("brands").map(String))].filter((b) => BRAND_IDS.has(b)),
      services: [...new Set(form.getAll("services").map(String))].filter((b) => BRAND_IDS.has(b)),
    });
    setProfile(next);
    const where = await saveProfile(next);
    return { ok: true, message: STORED_AT[where] };
  }, []);

  // 검색처럼 action이 있는 GET 폼은 페이지 이동 대신 화면 전환으로
  const onSubmitCapture = (e: FormEvent<HTMLDivElement>) => {
    const form = e.target as HTMLFormElement;
    const action = form.getAttribute("action");
    if (!action?.startsWith("/")) return;
    e.preventDefault();
    const qs = new URLSearchParams([...new FormData(form)].map(([k, v]) => [k, String(v)]) as [string, string][]);
    for (const [k, v] of [...qs]) if (!v) qs.delete(k);
    navigate(`${action}${qs.toString() ? `?${qs}` : ""}`);
  };

  const [route, query] = path.split("?");
  const params = new URLSearchParams(query ?? "");
  const seg = route.split("/").filter(Boolean);
  const conditionHref = "/my";

  let view;
  if (seg.length === 0) {
    const c = params.get("c") as DealCategory | null;
    view = (
      <HomeView
        viewer={viewer}
        calc={calc}
        reachable={reachable}
        totalCount={active.length}
        category={c && HOME_FILTERS.includes(c) && c !== ("all" as DealCategory) ? c : undefined}
        conditionHref={conditionHref}
      />
    );
  } else if (seg[0] === "lowest" && seg.length === 1) {
    view = <LowestView calc={calc} initial={initialServices(params.get("s") ?? undefined, calc, viewer.services)} />;
  } else if (seg[0] === "lowest" && SERVICE_CATS.includes(seg[1] as ServiceCategory)) {
    view = <CategoryView category={seg[1] as ServiceCategory} calc={calc} />;
  } else if (seg[0] === "deals" && DEAL_TYPES.includes(seg[1] as DealType)) {
    const c = params.get("c") as DealCategory | null;
    const q = { category: c && DEAL_CATS.includes(c) ? c : undefined, q: (params.get("q") ?? "").trim().slice(0, 40), sort: params.get("sort") === "new" ? ("new" as const) : ("ending" as const) };
    view = (
      <DealsView
        type={seg[1] as DealType}
        query={q}
        viewer={viewer}
        brands={catalog.brands}
        all={queryDeals(active, seg[1] as DealType, q)}
        sources={catalog.sources}
        conditionHref={conditionHref}
      />
    );
  } else if (seg[0] === "deal" && seg[1]) {
    const deal = catalog.deals.find((d) => d.id === seg[1]);
    view = deal ? <DealView deal={deal} viewer={viewer} brands={catalog.brands} sources={catalog.sources} conditionHref={conditionHref} /> : <Missing />;
  } else if (seg[0] === "about") {
    view = <AboutView sources={catalog.sources} />;
  } else if (seg[0] === "my" || seg[0] === "login") {
    view = (
      <MyView
        viewer={viewer}
        brands={catalog.brands}
        save={save}
        storageNote={accountStore ? "claude.ai 계정에 나만 볼 수 있게 저장돼요." : "이 브라우저에 저장돼요. 로그인 없이 쓸 수 있어요."}
      />
    );
  } else {
    view = <Missing />;
  }

  return (
    <RouterContext.Provider value={{ path, navigate }}>
      <div onSubmitCapture={onSubmitCapture}>
        <SiteNav signedIn conditions={conditionLabels(viewer, catalog.brands)} />
        {view}
        <SiteFooter sources={catalog.sources} />
        <p className="mx-auto max-w-[1180px] px-5 pb-6 text-sm text-ink-3 md:px-8 xl:px-0">
          할인·요금 정보는 {catalog.generatedAt.slice(0, 10)}에 모은 공식 출처 기준이에요. 가입 전 공식 페이지에서 최종 조건을 확인하세요.
        </p>
      </div>
    </RouterContext.Provider>
  );
}

function Missing() {
  return (
    <Page width="narrow">
      <PageHead title="장부에 없는 페이지예요" note="주소가 바뀌었거나 끝난 할인일 수 있어요." />
      <Link href="/" className="inline-block rounded-[4px] bg-ink px-4 py-2.5 font-bold text-sheet hover:bg-ink-2">
        홈으로
      </Link>
    </Page>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
