# VORA AI WORKS — Static Site

VORA WORD · VORA SLIDE · VORA CELL · VORA HWP 소개 사이트.

EDITORIAL 디자인의 정적 소개 사이트. 별도 서버 런타임이나 데이터베이스가 필요 없다.

## 로컬 실행

```sh
npm run dev
```

http://127.0.0.1:4173/ 에서 실행한다.

- 최초 언어는 브라우저 언어 우선순위에서 한국어·일본어·영어를 선택한다. 지원 언어가 없으면 영어를 사용한다.
- 언어 메뉴에서 자동 또는 특정 언어를 고를 수 있으며 수동 선택은 유지된다.
- 테마 기본값은 시스템 설정이며 운영체제의 다크·라이트 변경을 실시간 반영한다.
- 테마 메뉴에서 시스템·라이트·다크를 선택할 수 있다. 수동 선택은 시스템 변경에 영향받지 않는다.
- `?lang=ko|ja|en|auto`, `?theme=light|dark|system`으로 직접 지정할 수 있다.
- 언어별 주소 `/ko/`, `/ja/`, `/en/`은 브라우저 언어보다 우선한다. 자동 모드로 바꾸면 기본 주소 `/`로 돌아간다.
- 모바일·태블릿·데스크톱에 맞게 제품 카드가 1·2·4열로 배치된다.
- OS 아이콘은 26px로 통일한다. 애플 실루엣과 Linux 아이콘의 그림 여백을 보정해 실제 보이는 크기를 맞추며, 무료 개인 이용 문구와 HYPER RAG 연결을 강조한다.

## 주소와 환경변수

`.env.defaults`는 공개 가능한 기본 주소, `.env.example`은 설정 예시다.
로컬 수정은 `.env.local`, Render에서는 Environment에 같은 변수명을 사용한다.
우선순위는 프로세스 환경변수 > `.env.local` > `.env.defaults`.

| 제품 | 웹 주소 변수 | Render에서 확인한 주소 |
|---|---|---|
| WORD | `PUBLIC_WORD_WEB_URL` | https://vword.vora.im |
| SLIDE | `PUBLIC_SLIDE_WEB_URL` | https://vslide.vora.im |
| CELL | `PUBLIC_CELL_WEB_URL` | https://vcell.vora.im |
| HWP | `PUBLIC_HWP_WEB_URL` | https://vhwp.vora.im |

각 제품에 다음 세 변수를 설정하면 해당 OS의 다운로드 링크가 활성화된다.

```dotenv
PUBLIC_WORD_MACOS_DOWNLOAD_URL=
PUBLIC_WORD_WINDOWS_DOWNLOAD_URL=
PUBLIC_WORD_LINUX_DOWNLOAD_URL=
```

`WORD`를 `SLIDE`, `CELL`, `HWP`로 바꾼 변수도 같은 방식으로 사용한다.
값이 없으면 준비 중 안내를 표시한다. 설치 파일이 준비된 OS만 다운로드 링크를 설정한다. 공개 HTTPS URL만 허용한다.

CELL은 세 OS의 설치 파일이 등록되어 있어 다음 다운로드 페이지 주소를 기본값으로 사용한다.
주소를 변경하려면 `.env.local` 또는 Render Environment에서 해당 키를 덮어쓴다.
특정 OS의 링크를 임시로 숨길 때는 그 키의 값을 빈 문자열로 설정한다.

```dotenv
PUBLIC_CELL_MACOS_DOWNLOAD_URL=https://works.vora.im/downloads/cell/?os=macos
PUBLIC_CELL_WINDOWS_DOWNLOAD_URL=https://works.vora.im/downloads/cell/?os=windows
PUBLIC_CELL_LINUX_DOWNLOAD_URL=https://works.vora.im/downloads/cell/?os=linux
```

이 설정은 메인 페이지의 OS별 다운로드 링크를 연결한다. 다운로드 페이지의 실제 설치 파일·버전·체크섬은
`releases/cell/catalog.json`에서 관리하며, 공개 링크 설정만으로 카탈로그나 설치 파일을 변경하지 않는다.
HWP도 세 OS의 설치 파일이 등록되어 있으며 `PUBLIC_HWP_*_DOWNLOAD_URL`의 기본값은 같은 형식의 `/downloads/hwp/?os=macos|windows|linux` 주소다.

- VORA 링크: `PUBLIC_VORA_URL`
- VORA 가입 링크: `PUBLIC_VORA_SIGNUP_URL` (현재 공식 로그인·가입 공용 화면)
- 제작사 링크: `PUBLIC_COMPANY_URL`
- 운영 사이트 주소 및 공유·검색 메타데이터: `PUBLIC_SITE_URL`

정적 사이트이므로 환경변수 변경 후 재빌드·재배포해야 한다.
명시적으로 허용한 공개 링크만 `config.js`로 생성한다.

## 다국어 SEO와 공유 카드

- `/`와 `/ko/`, `/ja/`, `/en/`의 본문을 빌드 시 정적 HTML로 생성한다. 검색 로봇은 JavaScript 없이도 전체 내용을 읽을 수 있다.
- 기본 주소는 브라우저 언어를 따르며, 브라우저 정보가 없는 공유 로봇에는 한국어 카드를 제공한다. 특정 언어로 공유하려면 해당 언어 주소를 사용한다.
- 각 언어에 고유한 제목·설명·canonical·OG locale·Twitter 카드와 1200×630 PNG를 제공한다.
- 모든 페이지에 상호 `hreflang`과 `x-default`, WebSite·Organization·CollectionPage JSON-LD를 포함한다.
- `robots.txt`, 메인 4개와 제품별 다운로드 16개 주소를 포함하는 `sitemap.xml`은 빌드 시 생성한다.
- 도메인 매핑 후 `PUBLIC_SITE_URL`을 실제 도메인으로 변경하고 재배포하면 canonical·공유 이미지·sitemap 주소가 함께 갱신된다.
- 작은 공유 카드의 정사각형 크롭을 고려해 4색 심볼과 VORA AI WORKS를 중앙에 배치했다. 80×80·107×107·160×160·240×126px로 확인했고, 이미지 URL 버전을 갱신했다.
- OG 카드는 `public/brand/social-{ko,ja,en}-v4.png`. 재생성하려면 개발 의존성을 설치하고 로컬 서버를 켠 뒤 `npm run social`을 실행한다. 파비콘과 터치 아이콘은 공식 PNG를 그대로 사용한다. Render에서는 커밋된 PNG를 사용하므로 브라우저 설치가 필요 없다.
- 다국어 연결은 [Google Search 가이드](https://developers.google.com/search/docs/specialty/international/localized-versions), 공유 메타데이터는 [Open Graph 규격](https://ogp.me/)을 따른다.

## 빌드 및 Render 배포

```sh
npm run build
npm run preview
```

- Git remote: https://github.com/saxoji/vora_works_static.git
- Render 이름: `HorizonAI-Vora-Works`
- 서비스 종류: Static Site
- 빌드: `npm ci --omit=dev && npm run build`
- Publish directory: `dist`
- Node 22 이상, 서버 런타임·데이터베이스·비밀키 불필요
- 운영 주소: https://works.vora.im — 사용자가 매핑한 도메인의 Render verified 상태를 확인했으며 `PUBLIC_SITE_URL`에 반영했다.
- 기본 Render 주소도 사용 가능: https://horizonai-vora-works.onrender.com
- 시안 전환 메뉴와 다른 시안 소스는 운영 사이트에서 제거했다. 로컬 시안 기록은 `output/design-archive/`에 보관한다.
- `render.yaml`에 동일한 공개 환경변수와 빌드 설정이 기록되어 있다.
- 환경변수 변경 후 Render에서 재배포하면 웹·다운로드 링크가 갱신된다.

## 자산 출처

- WORKS·WORD·SLIDE·CELL: `/Users/yunsungji/Documents/vora_works`의 각 `docs/brand/` 공식 SVG.
- WORKS 심볼은 노랑이 위, 파랑이 오른쪽, 민트가 아래, 코랄이 왼쪽인 마름모 방향이다. `vora_word/docs/brand/vora-works.svg`와 `vora-works-{32,180}.png` 공식 원본을 그대로 사용한다. 방향과 여백이 자산에 반영되어 있으므로 CSS에서 추가 회전하지 않는다. 헤더·히어로·OG는 같은 SVG, 파비콘·터치 아이콘은 공식 PNG를 참조한다.
- Apple OS 아이콘: [Simple Icons의 Apple SVG](https://github.com/simple-icons/simple-icons/blob/develop/icons/apple.svg), CC0. 본문과 설치 안내에서 같은 크기 보정을 적용한다.
- HWP: `vora_hwp/docs/brand/vora-hwp.svg`, 2026-10-20 선정 C안.
- VORA 가로 로고: WORD 공통 자산 `vora-service-wide.png`, 공식 VORA 서비스 원본.
- 제작사: `https://www.horizonai.ai/brand/logo-h-onlight-640.webp` 및 `logo-h-ondark-640.webp`.
- Manrope·Instrument Serif·Pretendard: 로컬 호스팅, 라이선스는 `public/fonts/`에 포함.
- 디자인 원칙: awesome-design-md의 Framer, Apple, Notion 참고. 레이아웃·목업은 이 사이트용으로 제작.

## 검증 — 2026-10-20

- 빌드 및 JavaScript 구문 검사.
- 한국어·일본어·영어·미지원 언어와 시스템 다크·라이트의 8가지 첫 방문 조합.
- 브라우저 언어 선택·수동 선택 보존·자동 모드 복귀·실시간 시스템 테마 변경.
- 다운로드 안내를 열어 둔 상태에서 시스템 테마 변경, Esc 닫기.
- 320·390·768·1024·1280·1440px × 3언어 × 2테마, 36가지 화면 조합.
- 모든 OS 아이콘 26×26px 및 가로 넘침 없음. 아이콘마다 실제 그림 크기도 별도로 확인한다.
- 정적 렌더링 전환 후 3언어 × 2테마 × 320·390·768·1440px 24개 조합 재검증.
- JavaScript를 끈 브라우저에서 3개 언어 페이지의 본문·메타데이터·canonical·hreflang·JSON-LD 검증.
- 언어 변경 시 URL·공유 이미지 동기화, 새로고침 유지, 자동 모드 복귀 및 다운로드 안내 동작 확인.
- 설정 기본값·로컬 덮어쓰기·빈 다운로드 상태·공개 변수 허용목록·잘못된 URL 거부.
- 네 제품의 실제 웹 루트 HTTP 200 및 Render 커스텀 도메인 verified 상태 확인.
- 당시 설치 파일이 없는 OS는 준비 중으로 표시했다. 현재 공개 여부는 제품별 릴리스 카탈로그와 다운로드 페이지를 기준으로 한다.
- 로컬 검토 화면과 상세 결과는 `output/playwright/`에 기록한다.

## 데스크톱 다운로드와 자동 업데이트

WORD·SLIDE·CELL·HWP는 `/downloads/{product}/` 및 `/downloads/{product}/{ko,en,ja}/`에서 동일한 다운로드 UI를 사용한다. 각 제품의 로고·설명·지원 형식·실제 릴리스는 따로 관리한다. 테마 기본값은 시스템이며 라이트·다크 수동 선택은 WORKS 메인과 공유한다.

- 모든 제품의 최초 데스크톱 버전 표기는 `1.0.0`이다. 설치 파일이 준비되지 않은 제품은 준비 중인 버전으로 표시한다.
- macOS는 Apple Silicon arm64, Windows·Linux는 x64이다. 빌드와 해당 OS 검증을 통과한 설치 파일만 다운로드 버튼으로 제공한다.
- 배포 서명·macOS 공증이 없다는 설치 안내, 새 버전 알림·문서 저장 후 업데이트 안내를 제공한다.
- AI·스마트 모드·서버 백그라운드 생성·VORA 내보내기는 독립 실행형에서 제공하지 않는다. 외부 LLM/MCP 연결도 제공하지 않는다. 로컬 문서 편집·저장·내보내기는 각 제품 엔진의 지원 범위를 유지한다.
- 하단의 보라 바로가기·가입·제작사 링크는 `PUBLIC_VORA_URL`, `PUBLIC_VORA_SIGNUP_URL`, `PUBLIC_COMPANY_URL`로 관리한다. OS·제품·제작사 공식 로고를 사용한다.

제품마다 다음 공개 환경변수를 지원한다. `WORD`를 `SLIDE`, `CELL`, `HWP`로 바꾸면 동일한 정책이다.

```dotenv
PUBLIC_WORD_DOWNLOAD_PAGE_URL=https://works.vora.im/downloads/word/
PUBLIC_WORD_RELEASE_MANIFEST_URL=https://works.vora.im/releases/word/stable.json
PUBLIC_WORD_MACOS_DOWNLOAD_URL=
PUBLIC_WORD_WINDOWS_DOWNLOAD_URL=
PUBLIC_WORD_LINUX_DOWNLOAD_URL=
```

메인 페이지의 앱 다운로드 링크는 제품별 다운로드 페이지를 가리킨다. OS별 주소는 설치 파일이 검증된 뒤에만 설정한다. 실제 설치 파일과 자동 업데이트 버전 정보는 STATIC 서버가 제공한다. GitHub의 비공개 Release는 빌드 보관소로만 사용한다.

### 릴리스 발행 계약

`releases/{product}/catalog.json`은 GitHub Release asset ID, 공개 경로, 바이트 크기, SHA-256을 고정한다. 빌드 시 `scripts/desktop-releases.mjs`가 빌드 전용 `DESKTOP_RELEASE_GITHUB_TOKEN`으로 파일을 가져와 검증한 뒤 `dist/releases/{product}/`에 저장한다. 토큰은 공개 설정이나 클라이언트 번들에 포함하지 않는다.

파일명은 `VORA-{WORD|SLIDE|CELL|HWP}-{version}-{mac|win|linux}-{arm64|x64}.{format}`이다. 공개 URL은 `/releases/{product}/{version}/{filename}`이고 자동 업데이트 피드는 `/releases/{product}/stable.json`이다. macOS는 DMG/ZIP, Linux는 AppImage, Windows는 EXE/ZIP과 native 제품의 MSI를 지원한다. HWP는 기존 EXE/ZIP 계약을 유지한다.

제품·버전·아키텍처·출처 저장소가 다르거나 크기·체크섬이 일치하지 않으면 빌드가 실패하여 기존 배포를 유지한다. 빈 카탈로그는 `status: pending`, `artifacts: []`인 1.0.0 피드를 생성하고 다운로드 링크나 설치 가능 OS를 메타데이터에 표시하지 않는다. 버전 정보(`stable.json` 및 버전별 `manifest.json`)는 재검증하며, `VORA-*` 설치 파일만 장기 캐시한다. 최초 출시 시 OS별 설치 파일을 순차 추가해도 최신 버전 정보가 오래 캐시되지 않는다. 이전 릴리스를 카탈로그에 유지해 버전별 URL이 사라지지 않게 하며, 새로운 릴리스 또는 롤백은 `stableVersion`으로 선택한다. 이미 공개한 버전의 설치 파일을 다른 파일로 교체하지 않는다.

### 다운로드 페이지 SEO·OG

- 16개 다운로드 경로의 본문을 정적 HTML로 생성하여 JavaScript 없이도 읽고 다운로드할 수 있다.
- 제품·언어별 제목·설명·canonical·상호 hreflang·x-default·OG locale·Twitter 카드·SoftwareApplication JSON-LD와 sitemap을 제공한다.
- 설치 파일이 없는 제품은 구조화 데이터에 다운로드 URL·설치 가능 OS·출시 버전을 주장하지 않는다.
- 공유 카드 12장: `public/brand/{word,slide,cell,hwp}-desktop-{ko,en,ja}-v1.png`, 각 1200×630. 정사각형 크롭에도 제품명·심볼이 남도록 중앙 배치했다.
- 로컬 서버 실행 후 `PREVIEW_URL=http://127.0.0.1:4190 npm run social:desktop`으로 재생성한다. Render는 커밋된 PNG를 사용한다.

### 로컬 검증 — 2026-10-26

```sh
npm run test:config
npm run test:releases
PREVIEW_URL=http://127.0.0.1:4190 npm run test:downloads
npm run build
```

- 공개 설정 검사는 임시 경로에서 기본값·로컬 및 환경변수 우선순위·빈 값으로 링크 숨기기·잘못된 URL 거부·토큰 비노출과 3언어 다운로드 링크를 확인한다. 실제 `.env.local`이나 공개 빌드 결과는 변경하지 않는다.
- 메인과 제품별 다운로드 페이지 하단의 `AI`는 기존 메인 로고와 같은 Instrument Serif 기울임체·파란색을 사용하며, 주변 글자의 1.4배 크기로 맞춘다.
- 4제품 × 3언어 × 2테마 × 4화면 폭(320·390·768·1440px), 96개 조합의 오버플로·폰트·로고·공식 링크·제품 내비게이션.
- 실시간 시스템 테마와 수동 설정 저장, 언어 전환, 실제 다운로드 파일 검증 정보.
- JavaScript를 끈 상태의 정적 본문·다운로드·canonical·hreflang·JSON-LD·12개 OG 이미지 규격.
- 4제품 설치 파일 발행, 준비 중 피드, 다른 제품/호스트/버전/아키텍처 및 변조된 파일 거부.
- 다운로드 페이지는 같은 제품의 유효한 준비 중 피드를 받으면 이전 설치 링크를 제거한다. 잘못된 피드·다른 제품 응답·통신 실패 때는 빌드 당시의 다운로드 정보를 유지한다. 이 전환은 실제 페이지 코드의 Node 회귀로 검사한다.
- 검토 스크린샷은 `output/desktop-downloads/`에 보관한다. 배포 후 기능 검증은 사용자가 직접 진행한다.

### 메인 다운로드·브랜드·SEO 후속 검증 — 2026-10-26

- CELL·HWP 공개 설치 파일의 macOS·Windows·Linux 링크를 기본 환경값 및 Render 공개 설정에 연결했다. WORD·SLIDE는 설치 파일 공개 전까지 준비 중 상태를 유지한다.
- 실제 배포 파일을 제공하는 정적 서버에서 메인 24조합, 다운로드 96조합, 하단 AI 로고 40조합을 검사했다. UI와 JavaScript 비활성 HTML의 CELL·HWP 3개 링크가 일치한다. 이전 설정을 보관한 개발 서버의 응답은 최종 증거로 사용하지 않는다.
- 한국어·영어·일본어 메인 OG 3장과 제품별 다운로드 OG 12장을 재생성했다. 메인은 파란 AI 로고에 맞춘 `social-*-v5.png`로 캐시를 분리했다. 15개 언어별 페이지의 제목·설명·canonical·hreflang·JSON-LD·Twitter/OG 주소 및 실제 1200×630 이미지를 확인했다.
- 로컬 UI 빌드는 변경하지 않은 릴리스 카탈로그·이미 검증된 설치 파일/manifest를 재사용하여 중복 다운로드를 피했다. 운영 Render 빌드는 기존 publisher의 실제 설치 파일 다운로드·SHA 검증을 그대로 실행한다. 배포 후 기능 검사는 사용자 검증 범위이며 자동 확인은 배포 상태에 한정한다.

- 다운로드로 이동할 때 현재 페이지의 언어를 유지한다. 같은 사이트의 `/downloads/{product}/` 링크만 현재 `ko/en/ja` 경로로 맞추고, OS 쿼리·해시는 보존한다. 외부·사용자 지정·직접 설치 파일 URL 및 공유 설정 원문은 바꾸지 않는다. 설정 검사 6건, CELL/HWP × 3언어 × 3OS의 실제 팝업 이동 18건과 JavaScript 비활성 링크 검사를 통과했다. 실제 이동 검사는 모든 운영 URL 요청을 로컬 배포 파일로 전달해 수행했다.
