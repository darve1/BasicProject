---
version: 1
slug: "app-page-tsx"
primary_target: "app/page.tsx"
related_targets: ["app/lowest","app/deals","app/deal","app/my","app/about","app/login"]
---

# 앱 셸 전체 (홈·최저가·할인·내 정보·추천 기준·로그인)

Mode: Operate. 방문자는 대학생·취준생, 일은 "내 조건으로 받을 수 있는 구독 최저 조합과 할인을 찾고 근거를 확인하기". 시연 핵심 장면은 출처·신뢰 표시와 내 조건 맞춤 피드. 실패 모습: 은행 앱처럼 딱딱함, 장난스러움, SaaS 템플릿, 쿠폰·광고 사이트처럼 번잡함.

## Direction contract

THESIS: 구독료를 매달 적는 고정비 장부로 다룬다. 정가는 빨간 펜으로 긋고 최저가를 파란 펜으로 고쳐 적으며, 공식 페이지에서 확인한 숫자에만 도장을 찍는다. 카드 격자에 큰 숫자를 띄우는 할인 앱 기본형을 거부한다.

OWN-WORLD: 푸른 기 도는 흰 장부지(#f6f7f4) 위 남색 잉크(#1d2430), 정정용 빨강(#d23a3f), 절약용 파랑(#2756c7), 주홍 인주 원형 도장. 섹션마다 가계부 인덱스 탭 색(OTT 민트, AI 하늘, 배달 살구, 기타 버터, 카드·통신사·플랫폼도 각자 색). 가는 선으로 나눈 촘촘한 행, 표준 웹 컨트롤, 글자 크기 세 단계, 숫자는 고정폭.

STORY: 내 통신사·카드·자격을 적으면 장부가 내 것만 남기고, 정가 대비 얼마를 고쳐 적을 수 있는지와 그 숫자의 출처를 바로 믿게 된다. 그다음 계산기에서 조합을 바꿔 본다.

FIRST VIEWPORT: 왼쪽 섹션 레일(색 탭이 붙은 메뉴), 상단에 내 조건 칩과 수정 버튼, 그 아래 한 줄짜리 장부 정정선(정가 취소선 → 최저가 → 연간 절약), 본문 왼쪽은 맞춤 할인 행 목록(필터 탭 위), 오른쪽은 조합 계산기. 각 가격 옆 도장이 서명 동작.

FORM: 가계부(빨간 펜 정정과 확인 도장), 내 순위 목록 7번, seed:fb538404a5f947b4. 외부 후보에서 가져온 규율: 색 없이도 읽히는 채움/빈 원 상태, 사실 한 번만 쓰기, 가는 선 고밀도 행, 글자 크기 세 단계, 정가 막대를 넘지 않는 합계 막대, 섹션 고유 색 일관.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## 미결정

- 수익 기능(광고·제휴 링크)은 이번 범위 밖.
