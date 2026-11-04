---
name: 구독장부
description: 구독 고정비를 매달 정산하는 노트. 정가는 빨간 펜으로 긋고, 아낀 값은 파란 펜으로, 합계엔 이중 밑줄, 확인된 숫자엔 인주 표시.
colors:
  ledger-paper: "#f6f7f4"
  sheet-white: "#fdfdfb"
  navy-ink: "#1d2430"
  ink-secondary: "#444d5b"
  ink-muted: "#5c6470"
  hairline: "#dfe3dc"
  hairline-strong: "#c7cdc4"
  hairline-field: "#858c95"
  correction-red: "#c4313a"
  correction-red-wash: "#fbeced"
  saving-blue: "#2453bd"
  saving-blue-wash: "#e9eefb"
  seal-vermilion: "#d03a40"
typography:
  page-title:
    fontFamily: "Pretendard Variable, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Pretendard Variable, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.35
  figure:
    fontFamily: "Pretendard Variable, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.15
    fontFeature: "\"tnum\" 1"
  total:
    fontFamily: "Pretendard Variable, system-ui, sans-serif"
    fontSize: "2.5rem"
    fontWeight: 700
    lineHeight: 1.05
    fontFeature: "\"tnum\" 1"
  body:
    fontFamily: "Pretendard Variable, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
    fontFeature: "\"tnum\" 1"
  small:
    fontFamily: "Pretendard Variable, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.45
rounded:
  control: "4px"
  sheet: "6px"
spacing:
  row-y: "14px"
  sheet: "24px"
  section: "48px"
  gutter-mobile: "20px"
  gutter-tablet: "32px"
components:
  button-primary:
    backgroundColor: "{colors.navy-ink}"
    textColor: "{colors.sheet-white}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
  button-primary-hover:
    backgroundColor: "{colors.ink-secondary}"
    textColor: "{colors.sheet-white}"
  toggle-chip:
    backgroundColor: "{colors.sheet-white}"
    textColor: "{colors.ink-secondary}"
    borderColor: "{colors.hairline-field}"
    height: "32px (휴대폰 40px)"
    rounded: "{rounded.control}"
    padding: "4px 10px"
  toggle-chip-selected:
    backgroundColor: "{colors.navy-ink}"
    textColor: "{colors.sheet-white}"
    rounded: "{rounded.control}"
  nav-item-active:
    textColor: "{colors.navy-ink}"
  confirm-seal:
    textColor: "{colors.seal-vermilion}"
    size: "50px"
  ledger-sheet:
    backgroundColor: "{colors.sheet-white}"
    rounded: "{rounded.sheet}"
    padding: "{spacing.sheet}"
---

# Design System: 구독장부

## Overview

**Creative North Star: "월말 정산 노트"**

한 달이 끝날 때 구독 고정비를 한 줄씩 정산하는 노트다. 푸른 기가 도는 장부지 위에 남색 잉크로 적고, 정가는 빨간 펜으로 한 번 긋고, 아낀 값은 파란 펜으로 고쳐 적고, 합계 아래에는 이중 밑줄을 긋는다. 공식 페이지에서 확인한 숫자에만 기울어진 원형 인주 도장을 찍고, 확인하지 못한 숫자는 점선 원으로 남겨 둔다. 이 노트의 권위는 화려함이 아니라 근거와 계산에서 나온다.

화면은 일하는 도구다. 내비게이션, 표, 필터, 버튼은 누구나 아는 표준 웹 컨트롤 그대로 두고, 노트의 세계는 네 가지로만 들어온다: 장부지와 펜 색 팔레트, 굵은 잉크 선 아래 가는 선으로 나눈 장부 표, 이중 밑줄 합계, 그리고 원형 확인 도장. 카드 격자에 큰 숫자를 띄우는 할인 앱 기본형, 둥근 상자와 알약 칩을 늘어놓는 템플릿, 쿠폰 사이트의 번잡함, 은행 앱의 딱딱함, 아이콘·이모지·파스텔 색 조각으로 꾸민 장난스러움은 모두 이 노트가 아니다.

**Key Characteristics:**
- 장부지(#f6f7f4) 바탕에 남색 잉크, 상자 대신 선으로 나눈 장부 표
- 빨간 펜은 정가·마감·감액에만, 파란 펜은 아낀 값과 자격에만
- 합계는 3px 이중 밑줄 위에, 최저가는 파란 펜 숫자 하나로
- 홈은 펼친 장부 한 장: 왼쪽 쪽에서 쓰는 구독을 고르면 오른쪽 쪽 정산표가 그 자리에서 다시 적힌다
- 모든 가격·혜택 행에 원형 확인 도장(목록 50px, 상세 64px), 확인 필요는 점선 원
- 글자 크기 세 단계와 숫자 둘(합계 total은 화면에 한 곳), 숫자는 모두 고정폭

## Colors

장부지와 남색 잉크가 바탕을 이루고, 빨강·파랑 두 펜과 인주가 의미를 운반한다. 장식용 색은 없다.

### Primary
- **Navy Ink** (`navy-ink`): 본문, 제목, 칸 제목 위 2px 선, 합계 이중 밑줄, 선택된 토글, 주 버튼 배경.
- **Correction Red** (`correction-red`): 정가 취소선, 마감 임박(D-7 이내), 카드 할인액(−), 절약액 문구, 현재 위치를 가리키는 하위 메뉴 밑줄, 오류 문구.
- **Saving Blue** (`saving-blue`): 고쳐 적은 최저가, 내 최저 경로, 링크, 자격 표시(청년 전용 등), 저장 성공 문구, 포커스 링.

### Secondary
- **Seal Vermilion** (`seal-vermilion`): 확인 도장 테두리·글자에만. 다른 곳에 쓰지 않는다.

### Neutral
- **Ledger Paper** (`ledger-paper`): 페이지 바탕, 행 hover, 폼 하단 저장 바.
- **Sheet White** (`sheet-white`, #fdfdfb): 상단 바, 하단 탭 바, 펼친 장부 시트, 입력칸 배경. 순백이 아니라 장부지 쪽으로 아주 살짝 기운 흰색.
- **Ink Secondary / Muted** (`ink-secondary`, `ink-muted`): 보조 설명과 메타 정보. 장부지·흰 바탕 모두에서 4.5:1 이상.
- **Hairline / Hairline Strong** (`hairline`, `hairline-strong`): 행 구분선, 표 머리 아래 선, 스크롤바.
- **Hairline Field** (`hairline-field`, #858c95): 입력칸·선택 상자·비선택 토글의 테두리. 흰 바탕과 장부지 모두에서 3:1 이상이라 칸의 경계가 보인다.

### Named Rules
**The Two Pens Rule.** 빨강은 "덜 내도 되는 돈과 위험", 파랑은 "아낀 돈과 내 자격"만 뜻한다. 장식으로 쓰는 순간 장부가 거짓말을 한다.

**The Seal Is Earned Rule.** 도장은 출처에서 확인한 날짜가 있는 숫자에만 찍는다. 60일이 지났거나, 플랫폼 출처이거나, 달러 결제이거나, 공식 페이지 변경이 감지되면 점선 "확인 필요"로 내려간다.

**The No Decoration Color Rule.** 섹션 구분을 위해 색을 쓰지 않는다. 섹션은 제목과 굵은 잉크 선으로 구분한다.

## Typography

**Display Font:** Pretendard Variable (with system-ui)
**Body Font:** Pretendard Variable (with system-ui)

**Character:** 한 가지 한국어 고딕으로 굵기만 바꿔 위계를 만든다. 가장 굵은 굵기(800)는 쓰지 않고 700에서 멈춘다. 숫자는 모두 고정폭이라 가격 열이 장부처럼 줄을 맞춘다.

### Hierarchy
- **Page title** (700, 1.75rem 데스크톱 / 1.5rem 모바일, -0.02em): 페이지당 하나. "11월 구독 정산".
- **Title** (700, 1.25rem, 1.35): 칸 제목. 바로 아래 2px 잉크 선.
- **Figure** (700, 1.75rem, 1.15, tnum): 합계의 최저가 한 곳. 화면당 한두 번.
- **Total** (700, 2.5rem 데스크톱 / 2rem 휴대폰, 1.05, tnum): 펼친 장부의 월 합계 한 곳. 다른 곳에 쓰지 않는다.
- **Body** (400–600, 1rem, 1.55): 행 제목(600), 설명(400). 설명 문단은 62~68ch를 넘기지 않는다.
- **Small** (400–700, 0.875rem, 1.45): 메타 정보, 표 머리, 하위 메뉴, 출처 줄.

### Named Rules
**The Three Sizes Rule.** 글자 크기는 small·body·title 세 단계와 figure, 그리고 합계 한 곳의 total뿐이다. 더 강조하고 싶으면 크기가 아니라 굵기를 올린다. 한국어는 어절 단위로 줄을 바꾼다(`word-break: keep-all`).

## Layout

상단 바(높이 56px) 아래 가운데 정렬된 본문. 본문 최대폭은 화면 성격대로 1180px(홈·목록·표), 920px(계산기·추천 기준), 720px(상세·내 조건·로그인). 좌우 여백은 모바일 20px, 태블릿 32px, 1280px 이상은 본문 폭이 남는 만큼.

- **홈:** 맨 위에 본문 폭 전체를 쓰는 펼친 장부 한 장. 시트 폭이 768px 이상이면 왼쪽 쪽(5/12, 쓰는 구독과 조건)과 오른쪽 쪽(7/12, 정산표)으로 펼치고 가운데를 1px 선으로 나눈다. 더 좁으면 고르기 위, 정산 아래로 쌓는다. 그 아래 `minmax(0,1fr)` 할인 장부 + 300px 옆 칸(분야별 가장 크게 아끼는 곳, 도장 설명). 1024px 이상에서 옆 칸은 상단 바 아래에 고정된다.
- **계산기 화면:** 같은 펼친 장부를 920px 폭에서. 카드 세 장, 다른 조합, 근거 줄까지 모두 보인다.
- **768px 미만:** 상단 메뉴가 사라지고 화면 아래 4칸 탭(홈·최저가·할인·내 조건)으로 바뀐다. 하위 메뉴는 가로로 넘긴다.
- **장부 표의 열 배치는 화면이 아니라 표가 놓인 칸의 너비로 정한다**(container query, 672px 이상에서 혜택 | 받는 조건 | 기간 | 확인 네 열). 좁은 칸에서는 제목·설명 아래에 조건·기간·확인을 한 줄로 모은다.

간격 리듬: 행 위아래 14px, 칸 제목 아래 선까지 8px, 칸 사이 48px, 페이지 제목 위 32~40px. 제목 위 여백이 아래보다 크다.

## Elevation & Depth

그림자도 상자도 거의 쓰지 않는다. 깊이는 장부지 위의 선으로 표현한다: 칸 제목 아래 2px 잉크 선, 행 사이 1px 가는 선, 합계 위 3px 이중 밑줄. 흰 시트는 계산기처럼 손으로 만지는 도구에만 쓴다. 유일한 움직임은 도장이 찍히는 순간(420ms, 기울어진 채 커졌다가 자리 잡음)이며, 동작 줄이기 설정에서는 생략된다.

### Named Rules
**The Lines Not Boxes Rule.** 정보 묶음은 상자로 감싸지 않고 굵은 선 아래 행으로 적는다. 상자 안에 상자는 없다.

## Shapes

모서리는 작고 일정하다: 버튼·토글·입력 4px, 계산기 시트 6px. 알약 모양은 쓰지 않는다. 완전한 원은 확인 도장과 보유 표시에만 쓴다.

## Components

### Buttons
- **Shape:** 4px 모서리.
- **Primary:** 남색 잉크 배경, 흰 글자, 굵게, 10px 16px. "찾기", "저장하기", "원문에서 확인하기", "로그인 링크 받기", "내 조건 적기".
- **Hover / Focus / Active:** hover 시 보조 잉크(#444d5b)로 한 단계 밝아짐. 포커스는 파란 펜 2px 링, 2px 띄움, 바로 나타남. 누르는 순간 1px 내려앉음.
- **Outline:** 남색 1px 테두리 + 투명 바탕(휴대폰의 "내 구독으로 직접 계산하기").
- **Disabled / Pending:** 투명도 60%, "저장하는 중…"처럼 진행형 문구로 바뀜.

### Chips
- **Toggle:** 흰 바탕, hairline-field 테두리, 보조 잉크 글자, 4px 모서리, 높이 32px(휴대폰 40px). 선택되면 남색 배경·흰 글자. 계산기의 구독 선택, 내 조건 선택지.
- **Filter tabs:** 상자 없이 글자만, 선택된 탭은 굵게 + 빨간 2px 밑줄. 분류 필터와 하위 메뉴.
- **자격·마감 표시:** 상자 없이 글자색만. 자격은 파랑 굵게("청년 전용"), 마감은 빨강 굵게("D-5").

### Cards / Containers
- 카드는 쓰지 않는다. 목록은 장부 표, 묶음은 칸 제목 + 2px 선.
- **계산기 시트:** 흰 바탕, 1px hairline, 6px 모서리, 안쪽 20~28px.

### Inputs / Fields
- **Style:** 흰 바탕, hairline-field 테두리(3:1 이상), 4px 모서리, 높이 40px, 옆 버튼과 같은 높이, placeholder는 muted 잉크.
- **Focus:** 파란 펜 2px 링.
- **Checkbox/radio:** 브라우저 기본 컨트롤에 파란 펜 accent-color. 내 조건 폼은 토글 안에 숨긴 입력을 넣어 토글 전체가 눌린다.

### Navigation
- **상단 바:** 흰 바탕, 아래 1px 선. 왼쪽 워드마크(구독 + 빨간 장부), 주 메뉴(홈·최저가·할인·내 조건·추천 기준)는 선택 시 굵게 + 2px 잉크 밑줄. 오른쪽에 내 조건 요약("SKT · 신한카드 외 3")과 로그아웃.
- **하위 메뉴:** 상단 바 아래 줄, small 글자, 선택 시 빨간 2px 밑줄.
- **휴대폰:** 화면 아래 4칸 탭, 선택 칸 위에 짧은 빨간 선 + 굵게. `aria-current="page"`.

### 장부 표 (Signature Component)
칸 제목 아래 2px 잉크 선, 표 머리(혜택 | 받는 조건 | 기간 | 확인)는 small·muted, 행은 1px 선으로 나눈다. 행 전체가 상세로 가는 링크이며 hover 시 장부지색으로 칠해진다.

### 정산표와 이중 밑줄 (Signature Component)
가입 경로마다 한 줄, 그 아래 "본사 단품으로 따로 낼 때" 비교 줄, 맨 아래 3px 이중 밑줄 위에 "월 합계". 합계는 정가를 빨간 펜 2px 취소선으로 긋고 최저가를 파란 펜 figure로 적는다. 그 아래 빨강 굵게 "한 달 ○○원, 1년이면 ○○원 덜 내요". 합계 줄은 표 밖에 두어 칸 너비에 묶이지 않는다.

### 확인 도장 (Signature Component)
원형 인주 도장. 목록·표·계산기 행에는 지름 50px(2px 실선, 글자 11px), 상세 화면과 안내에는 64px(2.5px 실선, 글자 12px). 인주색, -8° 기울기, 두 줄 글자("공식확인" / "11.03"), 찍힐 때 한 번 눌리는 움직임. 확인 필요 값은 점선 muted 원, 기울기 없음, "확인 / 필요". 도장에 마우스를 올리면 출처 종류와 확인 날짜를 말해 준다. 좁은 칸에서는 행 제목 오른쪽 위에 둔다.

### 펼친 장부 (Signature Component)
홈과 계산기 화면의 한 장짜리 시트. 왼쪽 쪽 "쓰는 구독"에 분야별 토글과 통신사·광고·연간·멤버십 조건, 오른쪽 쪽 "가장 싼 조합"에 정산표가 있다. 토글을 누르면 정산표·합계·카드가 그 자리에서 다시 적힌다. 정산표 행마다 본사 단품보다 아끼는 값을 가격 아래 파란 펜으로(−4,000원) 적고, 표 아래 이중 밑줄 위에 월 합계를 total 크기로 적는다(휴대폰에서는 정가 줄이 합계 위로 올라간다). 홈에서는 카드 한 장("카드까지 쓰면")과 계산기 화면으로 가는 링크, 계산기 화면에서는 카드 세 장과 다른 조합.

### 추천 행 (이전 구성, 펼친 장부로 합침)
예전 홈 맨 위 "이번 달 추천" 칸. 행마다 왼쪽에 종류(바꾸기·카드·할인), 가운데 상품 이름과 근거 한 줄("넷플릭스 · 본사 단품 월 7,000원 대신 월 0원"), 오른쪽에 파란 펜 절약액(월 −7,000원)과 이동할 곳(공식 페이지·자세히). 칸 제목 오른쪽의 "바꾸면 월 ○원 덜 내요"는 정산표의 정가 합 − 최저 합과 같은 숫자다. 순서는 아끼는 돈 순.

### 링크 규칙
- 요금제·카드 이름은 공식 가입 페이지(카드는 카드사 공식 홈페이지)로, 새 창.
- 근거(출처)는 "근거: 유튜브 공식 블로그"처럼 글자로만 적고 링크하지 않는다. 뉴스 기사는 근거로 쓰지 않고, 뉴스·블로그로 보내지 않는다.
- 할인 행은 우리 상세 화면으로, 상세 화면에서 공식 원문으로.
- 모든 화면 아래에 같은 푸터(최저가·할인·내 장부 메뉴, 수집 현황).

### 보유 표시
요구 조건마다 지름 8px 원: 가진 조건은 채운 원, 없는 조건은 빈 원. 색 없이도 읽힌다.

## Do's and Don'ts

### Do:
- **Do** 모든 가격·혜택 행에 확인 도장을 찍는다(목록 50px, 상세 64px).
- **Do** 한 화면에서 같은 합계는 한 번만 적는다. 계산 결과는 펼친 장부 한 곳에.
- **Do** 메타 줄은 쉼표나 줄바꿈으로 나눈다. 단어 나열의 가운뎃점(통신사·카드)은 괜찮고, 띄어 쓴 구분자("A · B")는 쓰지 않는다.
- **Do** 금액 묶음은 정산표로: 항목 줄 → 비교 줄 → 이중 밑줄 합계.
- **Do** 목록은 칸 제목 + 2px 잉크 선 아래, 1px 선으로 나눈 행으로 만든다.
- **Do** 표의 열 배치는 표가 놓인 칸의 너비로 정한다.
- **Do** 상태를 색과 모양 둘 다로 표시한다(채운/빈 원, 실선/점선).
- **Do** 맞춤 결과가 비면 빈 화면 대신 "조건을 갖추면 받아요"로 이어서 보여준다.

### Don't:
- **Don't** 카드 격자에 큰 숫자·작은 라벨을 띄우는 할인 앱 기본형으로 만들지 않는다.
- **Don't** 둥근 흰 상자와 알약 칩을 반복해 화면을 채우지 않는다.
- **Don't** 섹션을 파스텔 색 조각이나 색 막대로 구분하지 않는다.
- **Don't** 쿠폰·광고 사이트처럼 배너와 강조색을 늘어놓지 않는다.
- **Don't** 아이콘·이모지로 장식하거나 손글씨 글꼴을 쓰지 않는다.
- **Don't** 제목 위에 작은 꼬리표(eyebrow) 문구를 붙이지 않는다.
- **Don't** 그림자, 유리·블러 효과, 그라디언트 글자를 쓰지 않는다.
- **Don't** 확인하지 않은 숫자에 실선 도장을 찍지 않는다.
