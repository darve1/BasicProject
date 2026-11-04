// 내 조건 화면
import Link from "next/link";
import type { FormState } from "@/app/actions";
import { Page, PageHead } from "@/components/ledger";
import { ProfileForm } from "@/components/profile-form";
import type { Viewer } from "@/lib/data";
import type { Brand } from "@/lib/types";

export function MyView({
  viewer,
  brands,
  save,
  storageNote,
}: {
  viewer: Viewer;
  brands: Brand[];
  save: (prev: FormState, form: FormData) => Promise<FormState>;
  storageNote?: string;
}) {
  return (
    <Page width="narrow">
      <PageHead
        title="내 조건"
        note={viewer.userId ? "쓰는 구독과 가진 것, 자격만 적어 주세요. 홈 정산표, 할인 목록, 계산기가 이 조건으로 받을 수 있는 것만 남겨요. 성별·생년월일은 받지 않아요." : undefined}
      />
      {!viewer.userId ? (
        <div className="border-t-2 border-ink pt-5">
          <p className="max-w-[56ch] text-ink-2">조건을 저장하려면 로그인이 필요해요. 이메일로 받은 링크만 누르면 돼요.</p>
          <Link href="/login" className="mt-4 inline-block rounded-[4px] bg-ink px-4 py-2.5 font-bold text-sheet hover:bg-ink-2">
            로그인하기
          </Link>
        </div>
      ) : (
        <ProfileForm
          key={[...viewer.services, ...viewer.brandIds, viewer.ageBand ?? "", ...viewer.roles].join(",")}
          brands={brands}
          initial={{ brandIds: viewer.brandIds, ageBand: viewer.ageBand, roles: viewer.roles, services: viewer.services }}
          save={save}
          storageNote={storageNote}
        />
      )}
    </Page>
  );
}
