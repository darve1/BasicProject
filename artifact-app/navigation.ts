// next/navigation 대신 (아티팩트 번들 전용)
import { useRouter } from "./router";

export function usePathname(): string {
  return useRouter().path.split("?")[0];
}
