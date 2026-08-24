# 골프스팟 신규 UI Lab 03

운영 데이터와 분리된 반응형·인터랙티브 디자인 시안 3종입니다. 같은 가명 데이터를
사용하지만 색만 바꾸지 않고 홈, 스케줄, 회원, 스튜디오의 정보구조를 서로 다르게
설계했습니다.

## 바로 보기

`미리보기_3종.bat`을 더블클릭하거나 `site/index.html`을 직접 엽니다.

상단에서 다음 세 방향을 바꿀 수 있고, 각 안에서 홈·스케줄·회원·스튜디오 탭을 모두
눌러 볼 수 있습니다.

| 안 | 이름 | 주인공 | 메인 컬러 |
|---|---|---|---|
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

## 참고한 원본과 적용 범위

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

Chrome/Edge로 3안 × 4화면 × 5폭(320/390/768/1024/1440)을 렌더합니다. 문서 가로
넘침, JavaScript 예외, 외부 네트워크 요청, 다이얼로그·스튜디오 단계 상호작용을 검사합니다.

캡처가 필요하면 다음처럼 실행합니다.

```powershell
$env:GOLFSPOT_CAPTURE_DIR="C:\DEV\golfspot-design-lab-v3\captures"
node tests/smoke.mjs
```

## 운영 반영 경계

이 폴더는 디자인 비교본입니다. `golfspot-app` 또는 `golf_short` 운영 저장소를 수정하거나
배포하지 않습니다. 선택된 안을 실제 서비스에 이식할 때는 기능·권한 로직을 그대로
유지하고 CSS와 화면 렌더 구조만 단계적으로 옮겨야 합니다.

