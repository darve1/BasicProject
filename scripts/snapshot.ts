// npm run snapshot — 개발 서버(npm run dev)가 켜진 상태에서 데모 계정 화면을 정적 미리보기 한 장으로 묶는다.
// 결과: .artifact/index.html (화면 10개를 #보기 로 전환, 할인 행은 공식 원문으로 연결, 조합 계산기만 실제 동작)
import { mkdirSync, writeFileSync } from "node:fs";
import { createServerClient } from "@supabase/ssr";
import * as cheerio from "cheerio";
import { build, type Plugin } from "esbuild";
import { adminClient } from "../crawler/db";
import { eligibilityTags } from "../lib/eligibility";

const ORIGIN = process.env.SNAPSHOT_ORIGIN ?? "http://localhost:3000";
const EMAIL = process.argv[2] ?? "demo-student@example.com";
const VIEWS: [view: string, route: string, calc?: { initial: string; compact: boolean }][] = [
  ["home", "/", { initial: "netflix,tving,wavve", compact: true }],
  ["lowest", "/lowest", { initial: "netflix,youtube,chatgpt", compact: false }],
  ["lowest-ott", "/lowest/ott"],
  ["lowest-ai", "/lowest/ai"],
  ["lowest-delivery", "/lowest/delivery"],
  ["lowest-etc", "/lowest/etc"],
  ["deals-card", "/deals/card"],
  ["deals-telecom", "/deals/telecom"],
  ["deals-platform", "/deals/platform"],
  ["about", "/about"],
  ["my", "/my"],
];
const viewOf = new Map(VIEWS.map(([v, r]) => [r, v]));

// 1) 데모 계정 세션 쿠키
const admin = adminClient();
const link = await admin.auth.admin.generateLink({ type: "magiclink", email: EMAIL });
if (link.error || !link.data.properties) throw link.error ?? new Error("데모 계정 링크를 만들지 못했어요");
const jar = new Map<string, string>();
const ssr = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
  cookies: { getAll: () => [...jar].map(([name, value]) => ({ name, value })), setAll: (list) => list.forEach((c) => jar.set(c.name, c.value)) },
});
const { error: otpErr } = await ssr.auth.verifyOtp({ token_hash: link.data.properties.hashed_token, type: "magiclink" });
if (otpErr) throw otpErr;
const cookie = [...jar].map(([n, v]) => `${n}=${v}`).join("; ");
const get = async (path: string) => {
  const res = await fetch(ORIGIN + path, { headers: { cookie } });
  if (!res.ok) throw new Error(`${path} ${res.status}`);
  return res.text();
};

// 2) 계산기 데이터와 딜 원문 주소
const userId = link.data.user.id;
const [{ data: brands }, { data: plans }, { data: cards }, { data: owned }, { data: profile }, { data: deals }] = await Promise.all([
  admin.from("brands").select("*").order("sort_order"),
  admin.from("plans").select("*").order("price_monthly"),
  admin.from("cards").select("*"),
  admin.from("user_brands").select("brand_id").eq("user_id", userId),
  admin.from("user_profiles").select("age_band, roles").eq("user_id", userId).maybeSingle(),
  admin.from("deals").select("id, url"),
]);
const ownedIds = (owned ?? []).map((r) => r.brand_id as string);
const calcData = {
  brands,
  services: (brands ?? []).filter((b) => b.category && (b.kind === "service" || b.kind === "platform")),
  telecoms: (brands ?? []).filter((b) => b.kind === "telecom"),
  memberships: (brands ?? []).filter((b) => b.kind === "platform"),
  plans,
  cards,
  owned: ownedIds,
  elig: eligibilityTags(profile?.age_band, profile?.roles ?? []),
};
const dealUrl = new Map((deals ?? []).map((d) => [d.id as string, d.url as string]));
const names = (brands ?? []).filter((b) => ownedIds.includes(b.id)).map((b) => b.name);

// 3) 화면 받아서 정리
let cssHrefs: string[] = [];
let rootClass = "";
let bodyClass = "";
const views: string[] = [];
for (const [view, route, calc] of VIEWS) {
  const $ = cheerio.load(await get(route));
  if (!cssHrefs.length) cssHrefs = $('link[rel="stylesheet"]').toArray().map((l) => $(l).attr("href")!);
  rootClass ||= $("html").attr("class") ?? "";
  bodyClass ||= $("body").attr("class") ?? "";
  // 스트리밍된 조각(<div hidden id="S:n">)을 제자리에 끼워 넣는다. 원래 브라우저 스크립트가 하는 일이라 스크립트를 지우기 전에 직접 한다.
  // 자리표시는 두 가지: 로딩 경계 <template id="B:n"> (뒤따르는 로딩 화면 ~ <!--/$--> 를 지움), 조각 자리 <template id="P:n">.
  // 조각 안에 다음 조각 자리가 들어 있으므로 더 바뀌지 않을 때까지 반복한다
  for (let changed = true; changed; ) {
    changed = false;
    // 조각 그릇은 <div hidden id="S:n"> 이거나, 표 안이면 <table hidden><tbody id="S:n"> / <tr id="S:n">
    $('[id^="S:"]').each((_, el) => {
      const n = $(el).attr("id")!.slice(2);
      const slot = $(`template[id="P:${n}"]`);
      const boundary = $(`template[id="B:${n}"]`);
      // 문자열로 복사하지 않고 노드를 옮긴다 (React의 $RS/$RC와 같은 방식)
      if (slot.length) {
        slot.before($(el).contents());
        slot.remove();
      } else if (boundary.length) {
        let node = boundary[0].next;
        while (node && !(node.type === "comment" && node.data === "/$")) {
          const next = node.next;
          $(node).remove();
          node = next;
        }
        boundary.before($(el).contents());
        boundary.remove();
      } else return;
      const wrapper = $(el).closest("[hidden]");
      (wrapper.length ? wrapper : $(el)).remove();
      changed = true;
    });
  }
  $("script, noscript, next-route-announcer, nextjs-portal, link, template").remove();
  // 로그아웃 폼은 지우고, 검색 폼은 남겨 두었다가 페이지 안 스크립트로 행을 거른다
  $("form").filter((_, f) => $(f).find('input[name="q"]').length === 0 && $(f).find("fieldset").length === 0).remove();
  $('form:has(input[name="q"])').attr({ action: "#", "data-search": "" });
  // 분류 탭은 페이지 안에서 행을 거르는 버튼으로
  $('nav[aria-label="분류"] a').each((_, el) => {
    const a = $(el);
    const c = new URLSearchParams((a.attr("href") ?? "").split("?")[1] ?? "").get("c") ?? "";
    a.replaceWith(`<button type="button" data-filter="${c}" class="${a.attr("class") ?? ""}">${a.html()}</button>`);
  });
  // 내 조건 화면은 읽기 전용
  if (view === "my") {
    $("form input, form select").attr("disabled", "");
    $('form button[type="submit"]').replaceWith('<p class="text-sm text-ink-2">미리보기에서는 바꿀 수 없어요. 실제 사이트에서 로그인하면 저장돼요.</p>');
  }
  $("a[href]").each((_, el) => {
    const a = $(el);
    const href = a.attr("href")!;
    if (href.startsWith("/deal/")) {
      const url = dealUrl.get(href.slice(6));
      if (url) a.attr({ href: url, target: "_blank", rel: "noreferrer" });
      return;
    }
    if (!href.startsWith("/")) return;
    const [path, query] = href.split("?");
    const target = viewOf.get(path);
    if (target && !query?.startsWith("c=")) a.attr("href", `#${target}`);
    else a.replaceWith(`<span class="${a.attr("class") ?? ""}">${a.html()}</span>`); // 내 조건·로그인·분류 필터
  });
  if (calc) {
    $('section[aria-label="조합 계산기"]').each((_, el) => {
      $(el).replaceWith(`<div class="calc-mount" data-initial="${calc.initial}" data-compact="${calc.compact ? 1 : 0}">${$.html(el)}</div>`);
    });
  }
  $("header").first().after(
    `<p class="snap-note">${new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" })} 기준 미리보기 · 데모 계정(${[...names, "대학생", "만 19~24세"].join(" · ")}) 화면 · 조합 계산기는 실제로 계산하고, 할인 행을 누르면 공식 원문이 열려요.</p>`,
  );
  views.push(`<div data-view="${view}"${view === "home" ? "" : " hidden"}>${$("body").html()}</div>`);
  console.log(`화면 ${route}`);
}

// 4) CSS: 글꼴은 data URI로 넣는다 (아티팩트는 외부 글꼴 호스트를 막는다)
let css = "";
for (const href of cssHrefs) {
  let part = await (await fetch(ORIGIN + href)).text();
  for (const m of new Set([...part.matchAll(/url\(("?)([^")]+\.woff2)\1\)/g)].map((x) => x[0]))) {
    const rel = m.replace(/^url\("?|"?\)$/g, "");
    const b64 = Buffer.from(await (await fetch(new URL(rel, ORIGIN + href))).arrayBuffer()).toString("base64");
    part = part.split(m).join(`url(data:font/woff2;base64,${b64})`);
  }
  css += part;
}
css += `
.snap{font-family:var(--font-sans);background:var(--paper);color:var(--ink)}
.snap header.sticky{top:env(safe-area-inset-top,0px)}
body::before{content:"";position:fixed;inset:0 0 auto;height:env(safe-area-inset-top,0px);z-index:40;background:var(--sheet)}
.snap-note{max-width:1180px;margin:0 auto;padding:10px max(20px,env(safe-area-inset-left,0px));font-size:.8125rem;color:var(--ink-2);border-bottom:1px solid var(--rule)}
`;

// 5) 계산기 번들: React는 cdnjs UMD 전역을 쓰고, 계산기 코드만 묶는다
const globals: Plugin = {
  name: "umd-globals",
  setup(b) {
    b.onResolve({ filter: /^react(-dom\/client|\/jsx-runtime)?$/ }, (a) => ({ path: a.path, namespace: "umd" }));
    b.onLoad({ filter: /.*/, namespace: "umd" }, (a) => ({
      loader: "js",
      contents:
        a.path === "react"
          ? "module.exports = window.React;"
          : a.path === "react-dom/client"
            ? "module.exports = window.ReactDOM;"
            : "var R = window.React; var j = function (t, p, k) { return R.createElement(t, k === undefined ? p : Object.assign({}, p, { key: k })); }; module.exports = { jsx: j, jsxs: j, Fragment: R.Fragment };",
    }));
  },
};
const bundle = await build({
  stdin: {
    contents: `import { createRoot } from "react-dom/client";
import { Calculator } from "@/components/calculator";
const data = JSON.parse(document.getElementById("calc-data").textContent);
document.querySelectorAll(".calc-mount").forEach((el) => {
  createRoot(el).render(<Calculator {...data} initial={el.dataset.initial.split(",")} compact={el.dataset.compact === "1"} />);
});`,
    loader: "tsx",
    resolveDir: process.cwd(),
  },
  bundle: true,
  write: false,
  minify: true,
  format: "iife",
  target: "es2019",
  jsx: "automatic",
  plugins: [globals],
  logLevel: "warning",
});

const filters = `(function(){document.querySelectorAll("[data-view]").forEach(function(v){var cat="",q="";var tabs=[].slice.call(v.querySelectorAll("[data-filter]"));var on=tabs.find(function(t){return t.getAttribute("aria-current")});var onCls=on?on.className:"",offCls=(tabs.find(function(t){return t!==on})||{}).className||"";function apply(){v.querySelectorAll("li[data-category]").forEach(function(li){var okC=!cat||li.dataset.category===cat;var okQ=!q||li.textContent.toLowerCase().indexOf(q)>=0;li.hidden=!(okC&&okQ)})}tabs.forEach(function(t){t.addEventListener("click",function(){cat=t.dataset.filter;tabs.forEach(function(x){x.className=x===t?onCls:offCls;x.toggleAttribute("aria-current",x===t)});apply()})});var f=v.querySelector("form[data-search]");if(f)f.addEventListener("submit",function(e){e.preventDefault();q=(f.querySelector("input[name=q]").value||"").trim().toLowerCase();apply()})})})();`;

const router = `(function(){var v=[].slice.call(document.querySelectorAll('[data-view]'));function show(){var id=(location.hash||'#home').slice(1);if(!v.some(function(x){return x.dataset.view===id}))id='home';v.forEach(function(x){x.hidden=x.dataset.view!==id});window.scrollTo(0,0)}addEventListener('hashchange',show);show()})();`;

const page = `<title>구독장부</title>
<style>${css}</style>
<div class="snap ${rootClass} ${bodyClass}">
${views.join("\n")}
</div>
<script type="application/json" id="calc-data">${JSON.stringify(calcData).replace(/</g, "\\u003c")}</script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js"></script>
<script>${router}</script>
<script>${filters}</script>
<script>${bundle.outputFiles[0].text}</script>
`;
mkdirSync(".artifact", { recursive: true });
writeFileSync(".artifact/index.html", page);
console.log(`.artifact/index.html ${(page.length / 1024 / 1024).toFixed(2)}MB`);
