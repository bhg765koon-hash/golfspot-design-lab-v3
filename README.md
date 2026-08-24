# 골프스팟 신규 UI Lab 03

운영 데이터와 분리된 반응형·인터랙티브 디자인 시안 7종입니다. 추천 계열 4종과
기존 원안 A/B/C가 같은 가명 데이터를 사용하며, 색만 바꾸지 않고 홈, 스케줄,
회원, 스튜디오의 공간 구조와 정보 위계를 서로 다르게 설계했습니다.

## 바로 보기

공개 비교 링크: <https://bhg765koon-hash.github.io/golfspot-design-lab-v3/>

- [D · Riviera Coral](https://bhg765koon-hash.github.io/golfspot-design-lab-v3/?concept=solstice&page=home)
- [E · Prism Aero](https://bhg765koon-hash.github.io/golfspot-design-lab-v3/?concept=aero&page=home)
- [F · Solar Grid](https://bhg765koon-hash.github.io/golfspot-design-lab-v3/?concept=grid&page=home)

`미리보기_3종.bat`을 더블클릭하거나 `site/index.html`을 직접 엽니다. 기본 진입은
`추천 조합`이며 새 D/E/F와 기존 A/B/C 원안을 상단에서 그대로 비교할 수 있습니다.

상단에서 다음 일곱 방향을 바꿀 수 있고, 각 안에서 홈·스케줄·회원·스튜디오 탭을 모두
눌러 볼 수 있습니다.

| 안 | 이름 | 주인공 | 메인 컬러 |
|---|---|---|---|
| R | 추천 조합 | A의 운영 홈·스케줄 + C의 회원·영상 Studio | 코발트·아쿠아·라임 |
| D | Riviera Coral | 리조트형 운영 런웨이와 가로 회원 셸프 | 코랄·플럼·선 옐로 |
| E | Prism Aero | 공간감 있는 정밀 코칭 캔버스 | 스카이·라일락·민트 |
| F | Solar Grid | 한 장으로 스캔하는 네오 점수판 | 레몬·코발트·라즈베리 |
| A | Pulse Club | 오늘의 퍼포먼스와 다음 행동 | 일렉트릭 블루·라임·아쿠아 |
| B | Clubhouse Edition | 회원과 레슨의 편집형 이야기 | 아이보리·미네랄 틸·코랄 |
| C | Motion Lab | 다음 레슨과 스윙 영상 | 아쿠아·코발트·오렌지 |

## 공통 원칙

- 본문 기본 16px, 작은 보조 정보도 10px 아래로 내리지 않았습니다.
- 카드 수를 늘리는 대신 주업무에 더 큰 면적과 강한 대비를 배정했습니다.
- 지표 `i`에 마우스·키보드 포커스를 두면 `정의 / 기준 / 다음 행동`을 확인합니다.
- 모바일은 320px부터 하단 4탭으로 전환하고 터치 영역을 44px 이상 유지합니다.
- 포인터 Spotlight, 숫자·그래프 진입 모션, 영상 진행선은 필요한 곳에만 사용합니다.
- `prefers-reduced-motion`에서는 이동·반복 효과를 끕니다.
- 외부 폰트, 이미지, 분석 SDK, API, 운영 DB, 영상 업로드를 사용하지 않습니다.

## 추천 4종의 인터랙션

- 홈의 지표와 Action Inbox가 실제 화면으로 연결되고, 레슨일지 완료 시 대기 건수와
  운영 점수가 함께 바뀝니다. 8초 안에는 알림에서 되돌릴 수 있습니다.
- `Ctrl/Cmd + K` 빠른 실행으로 화면, 회원, 스튜디오 작업과 레슨일지 행동을 검색합니다.
- 회원 선택은 Studio까지 유지되며, 영상 재생·±1프레임·J/K/L·속도 전환·전후 비교
  슬라이더·프레임 확대 렌즈를 직접 조작할 수 있습니다.
- 뒤로가기는 URL의 `concept`와 `page` 문맥을 복원하고, 활성 메뉴·회원·제작 단계는
  `aria-current` 또는 `aria-selected`로도 전달합니다.
- `Ctrl/Cmd + 1–7`로 일곱 시안을 바꿀 수 있으며, 좁은 화면에서는 선택된 시안이
  비교 레일 중앙으로 이동합니다.

Magic UI의 [전체 컴포넌트](https://magicui.design/docs/components)를 검토해 운영 화면에는
[Bento Grid](https://magicui.design/docs/components/bento-grid),
[Magic Card](https://magicui.design/docs/components/magic-card),
[Number Ticker](https://magicui.design/docs/components/number-ticker),
[Animated List](https://magicui.design/docs/components/animated-list),
[Border Beam](https://magicui.design/docs/components/border-beam),
[Animated Beam](https://magicui.design/docs/components/animated-beam),
[Shimmer Button](https://magicui.design/docs/components/shimmer-button), Blur Fade, Lens, Backlight,
Ripple Button, 제한적인 Dock 동작만 역할에 맞게 재구성했습니다. React·Framer·CDN 패키지를
추가하지 않고 현재 정적 HTML/CSS/JavaScript 안에서 구현했으며, 업무 판독을 방해하는
Particles·Meteors·Marquee·Smooth Cursor 등은 사용하지 않았습니다.

## 참고한 원본과 적용 범위

2026-08-24 TrendShift에서 `UI components`가 일간 상위권이고, 월간 상위 저장소에
자체 포함형 HTML·SVG 다이어그램 도구가 오른 흐름을 확인했습니다. 그래서 외부 패키지를
추가하지 않고 재사용 가능한 디자인 토큰·컴포넌트와 평면 정보 구조를 강화했습니다.

- [TrendShift 일간](https://trendshift.io/)과 [TrendShift 월간](https://trendshift.io/monthly):
  조립 가능한 UI 컴포넌트와 자체 포함형 시각화 흐름을 D/E/F 설계 근거로 사용했습니다.
- [WHOOP 브랜드 가이드](https://developer.whoop.com/assets/files/WHOOP%20-%20Brand%20%26%20Design%20Guidelines-bdea3554e94b4ea09e68695b1e8dc8e7.pdf),
  [Garmin Connect 새 디자인](https://www.garmin.com/en-US/newsroom/press-release/wearables-health/garmin-connect-gets-a-new-look-simplified-design-provides-a-more-customized-experience/):
  상태 수치가 행동으로 이어지는 퍼포먼스 계층을 Riviera Coral에 참고했습니다.
- [Apple Fitness+](https://www.apple.com/jp/apple-fitness-plus/),
  [Headspace](https://www.headspace.com/app): 밝고 넓은 캔버스에서 세션의 흐름을
  부드럽게 안내하는 방식을 Prism Aero에 참고했습니다.
- [IBM Carbon 데이터 시각화 팔레트](https://carbondesignsystem.com/data-visualization/color-palettes/),
  [Stripe 대시보드 차트](https://support.stripe.com/questions/dashboard-home-page-charts-for-business-insights):
  고대비 상태색과 한눈에 비교하는 운영 점수판을 Solar Grid에 참고했습니다.

- [21st.dev Dashboard Components](https://21st.dev/community/components/s/dashboard):
  Stats Bento, 예약 시각화, Floating Panel, Member List, Depth Tabs의 조합 원칙을 참고했습니다.
  커뮤니티 코드를 복사하지 않고 HTML/CSS로 다시 설계했습니다.
- [Linear UI redesign](https://linear.app/now/how-we-redesigned-the-linear-ui):
  전역 셸의 정렬, 탐색 밀도, 주업무와 보조 UI의 시각 위계를 참고했습니다.
- [Linear 2026 refresh](https://linear.app/now/behind-the-latest-design-refresh):
  모든 요소가 관심을 요구하지 않도록 보조 탐색을 물리고 콘텐츠 대비를 높이는 원칙을
  적용했습니다.
- [WHOOP Coach](https://support.whoop.com/s/article/How-to-Use-the-AI-Powered-WHOOP-Coach):
  많은 지표를 `오늘의 상태 → 권장 행동`으로 압축하는 구조를 Pulse Club에 적용했습니다.
- [Attio agent architecture](https://attio.com/engineering/blog/ask-attio-a-technical-look-at-our-new-agent):
  화면 문맥을 다시 설명하지 않아도 구조화된 UI와 다음 행동이 바로 이어지는 방식을
  회원 상세와 인스펙터에 적용했습니다.
- [The Golfer's Journal](https://www.golfersjournal.com/)과 [Cabot](https://cabot.com/):
  밝은 편집 지면, 큰 제목, 번호형 정보 위계를 Clubhouse Edition에 재해석했습니다.
- [TrackMan Shot Analysis](https://www.trackman.com/blog/shot-analysis-see-more-in-every-swing),
  [Onform Golf](https://onform.com/sports/golf/): 영상, 코칭 초점, 비교·피드백을 한 무대에
  연결하는 방식을 Motion Lab에 적용했습니다.

참고 제품의 브랜드·소스·화면을 복제하지 않았으며 골프스팟의 실제 운영 흐름에 맞춘
독립 시안입니다.

## 검증

```powershell
cd C:\DEV\golfspot-design-lab-v3
npm.cmd test
```

Chrome/Edge로 7안 × 4화면 × 10폭(320/390/480/481/768/860/861/1080/1081/1440),
총 280조합을 렌더합니다. 문서 가로 넘침, JavaScript 예외, 외부 네트워크 요청,
다이얼로그·빠른 실행·회원 문맥·완료/되돌리기·영상 재생/비교·Studio 단계를 검사합니다.

캡처가 필요하면 다음처럼 실행합니다.

```powershell
$env:GOLFSPOT_CAPTURE_DIR="C:\DEV\golfspot-design-lab-v3\captures"
node tests/smoke.mjs
```

## 운영 반영 경계

이 폴더는 디자인 비교본입니다. `golfspot-app` 또는 `golf_short` 운영 저장소를 수정하거나
배포하지 않습니다. 선택된 안을 실제 서비스에 이식할 때는 기능·권한 로직을 그대로
유지하고 CSS와 화면 렌더 구조만 단계적으로 옮겨야 합니다.
