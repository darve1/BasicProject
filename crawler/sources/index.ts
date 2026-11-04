import type { SourceAdapter } from "../types";
import { hyundai } from "./hyundai";
import { kb } from "./kb";
import { lgu } from "./lgu";
import { skt } from "./skt";

// 자동 수집 소스. 수집이 막힌 소스(신한·삼성·KT·간편결제)는 supabase/seed/sources.json에 mode='seed'로 둔다
export const ADAPTERS: SourceAdapter[] = [skt, lgu, hyundai, kb];
