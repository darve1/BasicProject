// npm run artifact — 실사용 모드 아티팩트 한 장(.artifact/index.html)을 만든다.
// 공개 카탈로그(누구나 읽을 수 있는 데이터)만 담고, 화면은 실제 사이트의 뷰 컴포넌트를 브라우저에서 그린다.
// 먼저 next build 가 끝나 있어야 한다 (CSS·글꼴을 빌드 결과에서 가져온다)
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { build, type Plugin } from "esbuild";

const root = process.cwd();

// 1) 공개 카탈로그: 일반 방문자 키(publishable)로 읽어서, 공개되는 데이터만 들어가게 한다
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, { auth: { persistSession: false } });
const pick = async <T,>(q: PromiseLike<{ data: T | null; error: { message: string } | null }>) => {
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data as T;
};
const [brands, plans, cards, deals, sources] = await Promise.all([
  pick(db.from("brands").select("*").order("sort_order")),
  pick(db.from("plans").select("*").order("price_monthly")),
  pick(db.from("cards").select("*")),
  pick(db.from("deals").select("*, deal_requirements(brand_id)").eq("is_active", true).order("ends_at", { ascending: true, nullsFirst: false }).limit(2000)),
  pick(db.from("sources").select("*").order("mode").order("id")),
]);
const catalog = { generatedAt: new Date().toISOString(), brands, plans, cards, deals, sources };
console.log(`카탈로그: 브랜드 ${(brands as unknown[]).length}, 요금제 ${(plans as unknown[]).length}, 카드 ${(cards as unknown[]).length}, 할인 ${(deals as unknown[]).length}`);

// 2) CSS와 글꼴: next build 결과에서. 글꼴은 data URI로 넣는다 (아티팩트는 외부 글꼴 호스트를 막는다)
const cssFiles: string[] = [];
const walk = (dir: string) => {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (p.endsWith(".css")) cssFiles.push(p);
  }
};
if (!existsSync(".next/static")) throw new Error("먼저 npx next build 를 실행하세요");
walk(".next/static");
let css = "";
for (const file of cssFiles) {
  let part = readFileSync(file, "utf8");
  for (const m of new Set([...part.matchAll(/url\(("?)([^")]+\.woff2)\1\)/g)].map((x) => x[0]))) {
    const rel = m.replace(/^url\("?|"?\)$/g, "");
    const b64 = readFileSync(resolve(dirname(file), rel)).toString("base64");
    part = part.split(m).join(`url(data:font/woff2;base64,${b64})`);
  }
  css += part;
}
const fontVar = css.match(/\.([\w-]*pretendard[\w-]*variable[\w-]*)\{/i)?.[1] ?? "";
css += `
#root{font-family:var(--font-sans);background:var(--paper);color:var(--ink);min-height:100dvh}
#root header.sticky{top:env(safe-area-inset-top,0px)}
body{background:var(--paper)}
body::before{content:"";position:fixed;inset:0 0 auto;height:env(safe-area-inset-top,0px);z-index:40;background:var(--sheet)}
`;

// 3) 앱 번들: React는 cdnjs UMD 전역을 쓰고, next/link·next/navigation은 아티팩트용 대체물로
const umd: Plugin = {
  name: "umd-globals",
  setup(b) {
    b.onResolve({ filter: /^react(-dom(\/client)?|\/jsx-runtime)?$/ }, (a) => ({ path: a.path, namespace: "umd" }));
    b.onLoad({ filter: /.*/, namespace: "umd" }, (a) => ({
      loader: "js",
      contents:
        a.path === "react"
          ? "module.exports = window.React;"
          : a.path.startsWith("react-dom")
            ? "module.exports = window.ReactDOM;"
            : "var R = window.React; var j = function (t, p, k) { return R.createElement(t, k === undefined ? p : Object.assign({}, p, { key: k })); }; module.exports = { jsx: j, jsxs: j, Fragment: R.Fragment };",
    }));
  },
};
const bundle = await build({
  entryPoints: [join(root, "artifact-app/main.tsx")],
  bundle: true,
  write: false,
  minify: true,
  format: "iife",
  target: "es2020",
  jsx: "automatic",
  alias: { "next/link": "./artifact-app/router.tsx", "next/navigation": "./artifact-app/navigation.ts" },
  define: { "process.env.NODE_ENV": '"production"' },
  plugins: [umd],
  logLevel: "error",
});

const page = `<title>구독장부</title>
<meta name="description" content="통신사·카드·멤버십 결합 혜택과 제휴 할인을 공식 출처에서 모아, 내 조건에 맞는 구독 최저 조합과 할인만 보여줘요.">
<style>${css}</style>
<div id="root" class="${fontVar} min-h-dvh pb-16 md:pb-0"><p style="padding:24px 20px">구독장부를 여는 중이에요.</p></div>
<script type="application/json" id="ledger-data">${JSON.stringify(catalog).replace(/</g, "\\u003c")}</script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js"></script>
<script>${bundle.outputFiles[0].text}</script>
`;
mkdirSync(".artifact", { recursive: true });
writeFileSync(".artifact/index.html", page);
console.log(`.artifact/index.html ${(page.length / 1024 / 1024).toFixed(2)}MB`);
