# 지금 뜨는 미용 시술 (트렌드 보드)

원장님이 "요즘 뭐가 뜨나"를 한 화면에서 보는 모바일 웹. 앱 웹뷰로 그대로 불러 쓰도록 만들었습니다.

## 실행
```
npm install
cp .env.example .env   # 키 입력
npm start              # http://localhost:3000
```
키가 없으면 샘플 데이터로 화면만 뜹니다(화면 상단에 샘플 표시).

## 필요한 키
- NAVER API HUB(네이버 클라우드 플랫폼) Application 1개: 검색어트렌드, 블로그, 카페, 뉴스 선택

## 데이터 흐름 (하루 1회 자동)
1. 데이터랩 검색어트렌드: 시술 26개 × 최근 16주(주 단위). 요청마다 정규화가 따로 되기 때문에 매 요청에 보톡스를 끼워 넣고 "보톡스 평균 = 100"으로 다시 맞춰서 시술끼리 비교가 가능하게 함.
2. 관심층: 여성 20/30/40/50+대, 남성 구간별로 같은 방식으로 받아 "보톡스 대비 상대적으로 어느 층이 더 찾는지" 계산.
3. 네이버 블로그·카페 검색 → 시술별 최근 글 목록.
   한 주만 튄 시술은 '일시 급등'으로 표시하고 1위 후보에서 뺍니다.
4. 장비·제품 뉴스: 고정 검색어 + 급상승 시술 기준. 제목에 시술·장비 단어가 있는 기사만 남깁니다.

갱신 1회 호출량: 데이터랩 약 42회(일 한도 1,000), 검색 약 60회(일 한도 25,000).
결과는 `data/cache.json`에 저장되고 화면은 캐시만 읽어서 빠릅니다.
연결 점검: `npm run check`
수동 갱신: `curl -X POST -H "x-admin-token: <ADMIN_TOKEN>" http://서버/api/refresh`

## 시술 목록 바꾸기
`lib/keywords.js`에서 추가·삭제. `terms`는 같은 시술의 다른 표기 묶음입니다.

## 웹뷰 연동
- `?embed=1` : 상단 제목 숨김(앱 자체 헤더 쓸 때)
- `?theme=light|dark` : 앱 테마 강제
- 외부 링크(블로그·뉴스)는 앱으로 넘깁니다. 아래 중 하나를 앱에서 받아 외부 브라우저로 열면 됩니다.
  - React Native: `postMessage({type:'openExternal', url})`
  - iOS WKWebView: `messageHandlers.openExternal`
  - Android: `window.Android.openExternal(url)` (JavascriptInterface)
  - 브리지가 없으면 새 창으로 엽니다.
- 상세 화면은 history를 쓰므로 안드로이드 뒤로가기로 목록에 돌아옵니다(앱에서 `canGoBack` 처리 필요).
- safe-area, 다크모드 대응.

## 알아둘 점
- 검색량은 네이버만 반영합니다. 관심도 5 미만 시술은 변화율이 크게 튈 수 있어 히어로에서 제외합니다.

## 무료 배포 (GitHub Pages + GitHub Actions)
서버 없이 운영하는 방식입니다. GitHub가 매일 오전 6시(한국시간)에 데이터를 모아 `data.json`을 만들고, 화면과 함께 GitHub Pages에 올립니다.
1. GitHub에 공개(Public) 저장소를 만들고 이 폴더 내용을 올린다 (`.env`, `node_modules`는 올리지 않음).
2. Settings → Secrets and variables → Actions 에 `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET` 등록.
3. Settings → Pages → Source 를 "GitHub Actions" 로.
4. Actions 탭 → "매일 데이터 갱신" → Run workflow.
5. 주소: `https://<아이디>.github.io/<저장소이름>/` (웹뷰는 뒤에 `?embed=1`)

코드는 공개되지만 키는 Secrets에만 있어 노출되지 않습니다.
