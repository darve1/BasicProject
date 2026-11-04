export type BrandKind = "telecom" | "card_issuer" | "pay" | "platform" | "service";
export type ServiceCategory = "ott" | "ai" | "delivery" | "etc";
export type SourceTrust = "official" | "public" | "platform" | "press";
export type DealType = "card" | "telecom" | "platform";
export type DealCategory =
  | "subscription"
  | "cafe"
  | "cvs"
  | "shopping"
  | "food"
  | "travel"
  | "culture"
  | "etc";
export type Eligibility = "youth" | "student" | "soldier" | "senior";

export type Brand = {
  id: string;
  kind: BrandKind;
  category: ServiceCategory | null;
  name: string;
  aliases: string[];
  official_domains: string[];
  homepage: string | null;
  sort_order: number;
};

export type PlanInclude = { service_id: string; tier?: string; ads?: boolean };

export type Plan = {
  id: string;
  name: string;
  seller_brand_id: string;
  route: "official" | "telecom" | "membership" | "platform";
  price_monthly: number;
  owned_price: number | null;
  billing: "monthly" | "annual";
  includes: PlanInclude[];
  requires_brand_ids: string[];
  eligibility: string[];
  exclusive_group: string | null;
  payment: "direct" | "bill";
  conditions: string[];
  source_url: string;
  source_trust: SourceTrust;
  checked_at: string;
  status: "confirmed" | "needs_check";
  signup_url?: string | null; // 가입하러 가는 공식 페이지 (출처와 다를 수 있음)
};

export type Card = {
  id: string;
  issuer_brand_id: string;
  name: string;
  annual_fee: number;
  min_prev_month_spend: number;
  discount_kind: "rate" | "amount";
  discount_value: number;
  monthly_cap: number | null;
  eligible_service_ids: string[];
  notes: string[];
  signup_url?: string | null; // 카드사 공식 홈페이지
  source_url: string;
  source_trust: SourceTrust;
  checked_at: string;
  status: "confirmed" | "needs_check";
};

export type Deal = {
  id: string;
  source_id: string;
  external_id: string;
  deal_type: DealType;
  category: DealCategory;
  related_service_ids: string[];
  title: string;
  benefit_text: string | null;
  merchant: string | null;
  starts_at: string | null;
  ends_at: string | null;
  url: string;
  eligibility: string[];
  is_active: boolean;
  source_trust: SourceTrust;
  first_seen_at: string;
  last_seen_at: string;
  deal_requirements?: { brand_id: string }[];
};

export type Source = {
  id: string;
  brand_id: string;
  deal_type: DealType;
  name: string;
  url: string;
  mode: "crawl" | "seed";
  note: string | null;
  last_run_at: string | null;
  last_status: string | null;
  last_count: number | null;
};
