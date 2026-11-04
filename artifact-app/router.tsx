// 아티팩트 안의 화면 전환. next/link·next/navigation 자리를 대신한다.
// 아티팩트 주소에는 #토큰(글자·숫자·-)만 남길 수 있어서 경로를 토큰으로 바꿔 둔다
import { createContext, useContext, type AnchorHTMLAttributes, type MouseEvent, type ReactNode } from "react";

export type Router = { path: string; navigate: (href: string) => void };
export const RouterContext = createContext<Router>({ path: "/", navigate: () => {} });
export const useRouter = () => useContext(RouterContext);

// "/deals/card?c=cafe" → "deals-card", "/deal/<id>" → "deal-<id>", "/" → "home"
export function toToken(href: string): string {
  const path = href.split("?")[0].replace(/\/+$/, "") || "/";
  if (path === "/") return "home";
  if (path === "/login") return "my";
  return path.slice(1).replace(/\//g, "-");
}

export function fromToken(token: string): string {
  if (!token || token === "home") return "/";
  const deal = token.match(/^deal-([0-9a-f-]{36})$/);
  if (deal) return `/deal/${deal[1]}`;
  const [head, ...rest] = token.split("-");
  return rest.length ? `/${head}/${rest.join("-")}` : `/${head}`;
}

type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children?: ReactNode; scroll?: boolean; prefetch?: boolean };

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- scroll·prefetch는 next/link 전용이라 받아서 버린다
export default function Link({ href, children, scroll: _scroll, prefetch: _prefetch, onClick, ...rest }: LinkProps) {
  const { navigate } = useRouter();
  const go = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    navigate(href);
  };
  return (
    <a {...rest} href={`#${toToken(href)}`} onClick={go}>
      {children}
    </a>
  );
}
