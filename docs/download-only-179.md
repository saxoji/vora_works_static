# STATIC-DOWNLOAD179 — 설치방법은 다운로드 페이지에서만 표시

기준: `a621194df9602df3e28c6cdc3a493cd3b09c7f30`. 사용자의 최신 지시에 따라 설치 안내의 노출 위치만 좁혔다.

- 메인 4개 제품 카드의 설치방법 버튼을 제거했다. 앱 다운로드 링크와 OS 버튼의 URL·사용 가능 상태는 유지한다.
- 메인 다운로드 팝업에서 OS별 설치 단계와 가이드 링크를 제거했다. 제목은 기존 번역인 앱 다운로드 / Download app / アプリをダウンロード를 사용한다. 다운로드·준비 중 상태, 웹 버전 링크, 닫기 및 Escape 동작은 유지한다.
- 다운로드 상세 페이지는 기존 OS별 설치 안내, 공식 도움말, 준비 중 상태를 유지한다. 메인 및 다운로드 페이지의 SEO·canonical·hreflang·OG 이미지는 바꾸지 않는다.
- 실제 공개 catalog·manifest·URL·빌드 보안 검증은 변경하지 않는다. 현재 공개되지 않은 OS를 테스트 때문에 활성화하지 않는다. 모든 제품 팝업 확인은 브라우저 내부의 명시적 미공개 OS fixture로만 실행한다.

## 검증 범위

Node 설정·릴리스·설치/다국어/SEO 검사, 20개 페이지의 로컬 QA 빌드와 실제 브라우저 검사를 수행한다. `npm run build:preview`의 결과는 게시하지 않는다. 운영 설치 파일은 바뀌지 않아 대용량 설치 파일을 다시 내려받거나 네이티브 설치를 반복하지 않는다. 운영 전체 빌드·게시 검증은 publisher가 기존 경로로 수행한다.

브라우저 검사는 `PREVIEW_URL=http://127.0.0.1:54729 npm run test:install:browser`이며 설치된 WebKit의 명시 경로는 `WEBKIT_EXECUTABLE_PATH`로 전달한다. 기존 `tests/install-guides-browser.mjs`를 현재 노출 정책에 맞춰 유지한다. 스크린샷·검증 영수증은 Git에 넣지 않고 `output/playwright/download179/`에 보관한다.

최종 검증 결과:

- Node 설정 6개 + 릴리스 19개 + 설치·다국어·SEO 9개 = 34개 통과.
- 최종 메인 화면 12조합(ko/en/ja × light/dark × 320/1440px), 실제 설정의 앱 다운로드·OS 링크 클릭 108회 통과.
- 4개 제품의 다운로드 팝업 48조합 통과. 설치 가이드 부재, 다운로드 제목, 3개 OS 상태, 닫기 버튼·Escape·기존 버튼으로 초점 복귀, 팝업 및 본문 가로 넘침을 검사했다.
- 현재 보류·모순된 피드·닫은 뒤 늦게 온 응답 등 7개 피드 경계와 WebKit 3언어 모바일 검사 통과. 페이지 오류 0.
- 다운로드 상세 페이지 48조합의 OS 가이드·링크·펼치기·테마 검사를 통과했다. 이후 수정은 메인 팝업 본문 CSS에만 있으므로 상세 페이지 증거는 그대로 재사용한다.
- 실제 PNG 검토에서 발견한 일본어 320px 팝업 본문 잘림을 수정했다. 일본어/영어 팝업 본문에만 줄바꿈을 보강하고 내부 `scrollWidth` 회귀 검사를 추가했다. 최종 PNG에서 정상 줄바꿈을 다시 확인했다.
- 20페이지 로컬 QA 빌드, JavaScript 구문, `git diff --check` 통과. 설치 안내/SEO·환경설정·catalog·OG 등 보호 대상 31개 파일은 기준 커밋과 SHA-256이 같다.
- 최종 메인/팝업 증거: `output/playwright/download179-popupfix/result.json`. 변경 없는 상세 페이지 증거: `output/playwright/download179/result.json`. 파일 보존 검증: `output/playwright/download179/preserved-files.json`. 공유 UI lease는 두 검사 종료 후 모두 반환했다.

실제 설치 파일·release manifest·공개 URL은 변경하지 않았다. 소스 커밋만 총괄에 전달하며 push·배포는 publisher가 수행한다.
