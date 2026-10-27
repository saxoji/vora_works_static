# STATIC-INSTALL177 — 다운로드·설치 안내와 SEO

후속 정책: STATIC-DOWNLOAD179에서 메인 카드·다운로드 팝업의 설치 안내를 제거했다. 현재 설치방법은 4개 제품의 다운로드 상세 페이지에서만 제공한다. 아래는 최초 적용·검증 기록이다.

작업 기준: `0bea93910f953f2f19c8b83b2416646353abc0ae`, 격리 worktree `fix/static-install177`. 사이트 이름은 VORA AI DOCS, 제품·앱 이름은 기존 VORA DOCS / VORA WORD·SLIDE·CELL·HWP를 유지한다.

## 적용 범위

- 메인 4개 경로와 제품별 다운로드 16개 경로의 한국어·영어·일본어를 지원한다.
- `src/install.js`가 설치 안내를 공유한다. 제품 페이지는 OS별 안내 카드, 메인은 다운로드 팝업에서 같은 내용을 표시한다. 안내가 길어도 팝업 닫기 버튼은 고정하며 내용만 스크롤한다. 실시간 릴리스 정보를 받더라도 펼친 카드·스크롤·키보드 초점을 유지하고 닫힌 팝업이나 다른 제품 팝업을 덮지 않는다.
- Mac DMG/ZIP, Windows 설치 번들/portable, Linux AppImage를 실제 선호 다운로드 형식과 맞춘다. WORD·CELL ZIP은 동봉 MSI 실행, SLIDE의 `windows-msi-cab-v1` ZIP은 MSI와 모든 CAB를 같은 폴더에 유지, HWP ZIP은 압축을 푼 앱 실행을 설명한다.
- Mac의 표준 첫 실행 확인과 개발자 확인 차단을 구분한다. 개발자 확인에 막힌 경우에만 시스템 설정에서 해당 앱을 허용하는 Apple 안내를 사용한다. 손상·유해 경고에는 실행 중단과 공식 최신 파일 재다운로드를 안내한다. 전역 보안 해제·격리 속성 삭제·서명 우회 명령은 넣지 않는다.
- Linux 터미널 예시는 고정 형식의 AppImage 파일 이름에만 제공한다. 외부 문자를 명령에 삽입하지 않는다.
- 기존 카탈로그·환경변수·배포 준비 상태는 변경하지 않는다. 설치 가이드는 공개 준비 완료를 뜻하지 않는다. `currentManifest`는 기존 publisher의 철회 필터를 그대로 공용화하여 개발 서버에서도 철회된 다운로드를 복원하지 않는다.

## SEO·공유 카드

메인과 4제품 다운로드 페이지의 제목·설명·OG/Twitter 대체 텍스트를 해당 언어의 설치 안내와 맞췄다. 기존 canonical·3언어 및 x-default hreflang을 보존한다. 메인 CollectionPage는 4개 제품 안내로 연결하며, 제품 SoftwareApplication은 도움말 주소를 포함한다. 준비 중인 제품에는 설치 가능 OS·다운로드 URL·출시 버전을 추가하지 않는다.

메인 3장 `social-*-v7.png`, 제품 12장 `*-desktop-*-v4.png`를 코드와 기존 승인 브랜드 자산으로 생성했다. 모든 이미지는 1200×630이고 제품명은 정사각형 중앙 잘림 범위 안에 둔다. 메인의 추가 문구와 아래 제품 아이콘 사이도 자동으로 간격을 검사한다.

## 공식 근거

- [Apple: Mac에서 안전하게 앱 열기](https://support.apple.com/en-us/102445) — 정상 첫 실행, 개발자 확인 차단, 손상·유해 경고를 구분한다.
- [Apple: 앱 설치·제거](https://support.apple.com/guide/mac-help/install-and-uninstall-other-apps-mh35835/mac) — 디스크 이미지와 설치 흐름.
- [Microsoft: ZIP 압축 풀기](https://support.microsoft.com/en-us/windows/experience/storage-filemanagement/zip-and-unzip-files) — 전체 압축 해제.
- [Microsoft: 온라인 프로그램 설치](https://support.microsoft.com/en-us/windows/apps/how-to-install-programs-from-online-sources-on-windows) — 공식 출처와 설치 프로그램 실행.
- [AppImage: Quickstart](https://docs.appimage.org/introduction/quickstart.html) — 파일 속성의 실행 권한 또는 해당 파일의 `chmod +x`, AppImage 실행.

2026-10-27 공식 문서를 확인했으며 원문 전체나 벤더 이미지를 복사하지 않았다. 제품별 번들 내부 형식은 기존 공개 카탈로그와 제품 담당의 검증된 배포 계약을 따른다.

## 검증과 게시 경계

`npm run build:preview`는 설치 파일을 복사하거나 다운로드하지 않고 `output/install-guide-preview/`에 20개 페이지를 생성하는 **로컬 QA 전용**이다. 게시용 `dist/`나 운영 빌드 명령을 바꾸지 않으며 robots는 `Disallow: /`다. 이 결과를 배포하지 않는다. 운영의 `npm run build`는 기존 출처 저장소·파일 크기·SHA·분할 아카이브 검증을 모두 실행한다.

최종 실행 결과와 화면 증거는 로컬 `output/playwright/install177/result.json`에 기록한다. HTML/locale/SEO 및 publisher 검사는 `npm run test:config`, `npm run test:releases`, `npm run test:install`, 실제 브라우저 검사는 `npm run test:downloads`와 `npm run test:install:browser`로 재현한다. 브라우저 주소는 `PREVIEW_URL`로 지정한다. 이미 설치된 WebKit의 명시 경로를 사용해야 할 때만 `WEBKIT_EXECUTABLE_PATH`를 지정한다.

최종 로컬 결과:

- 설정 6개 + 릴리스/출처/크기/SHA/철회 19개 + 설치/locale/SEO/OG 9개 = Node 검사 34개 통과.
- 기존 Chrome 96개 제품·언어·테마·화면 폭 조합 통과. JavaScript 비활성 HTML, 언어/테마 저장, canonical/hreflang, 다운로드/체크섬, 실제 OG 크기 검사 포함.
- 추가 Chrome 상세 페이지 48개, 팝업 48개, Windows 형식·현재 보류·모순된 피드·닫기 후 지연 응답 7개 경계 통과. 가로 넘침과 페이지 오류 0.
- 설치된 WebKit 2368을 명시 경로로 사용해 3개 언어의 모바일 안내와 팝업 열기/키보드 닫기 통과. 새 브라우저를 다운로드하지 않았다.
- 실제 브라우저 화면 27장을 생성하고 대표 화면과 OG 15장 contact sheet를 육안 확인했다. Node 실행 로그와 공개 설정·카탈로그의 불변 SHA는 `output/playwright/install177/validation.json` 및 `node-tests.log`에 보관한다.
- 20개 로컬 페이지 생성, JavaScript 구문 검사, `git diff --check` 통과. 공유 UI 잠금은 검증 후 반환했다.

설치 파일·manifest·공개 URL을 변경하지 않았으므로 네이티브 재설치 및 기존 설치 파일의 대용량 재다운로드는 이번 UI 변경 검사에 포함하지 않는다. 실제 게시와 공개 파일 해시 검증은 총괄 publisher의 기존 전체 빌드 경로에서 별도로 수행한다.
