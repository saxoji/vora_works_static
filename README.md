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
- `robots.txt`, 4개 주소의 `sitemap.xml`은 빌드 시 생성한다.
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
- 실제 설치 파일은 아직 제공되지 않았으며 OS별 변수는 빈 값으로 배포한다.
- 로컬 검토 화면과 상세 결과는 `output/playwright/`에 기록한다.

### HWP desktop releases

`/downloads/hwp/` provides the HWP installer page (Korean, English, Japanese and system/light/dark themes). `PUBLIC_HWP_RELEASE_MANIFEST_URL` selects the public version feed. Existing `PUBLIC_HWP_{MACOS,WINDOWS,LINUX}_DOWNLOAD_URL` variables may point to this page or a verified versioned installer.

`releases/hwp/catalog.json` pins private build archives by GitHub release asset ID, expected byte size and SHA-256. At build time `scripts/hwp-releases.mjs` downloads these archives with the build-only `DESKTOP_RELEASE_GITHUB_TOKEN`, validates every artifact, and places the actual installers and manifests under `dist/releases/hwp/`. The token never enters `public/config.js` or the client bundle. Retain old release entries to preserve immutable version URLs; switch only `stableVersion` when advertising a new release or rolling back. An invalid or missing artifact fails the deployment build, keeping the previous published site.

Only verified targets have download buttons. macOS targets Apple Silicon only. Windows/Linux remain pending until their respective native build and smoke checks pass. The desktop app does not provide AI, Smart mode, background generation or Export to VORA; those belong to the web service.

Local release-pipeline regression: `node --test tests/hwp-releases.test.mjs`.

### HWP 다운로드 페이지

- `/downloads/hwp/` 및 `/downloads/hwp/ko/`, `/en/`, `/ja/`는 언어별 정적 HTML, canonical, 상호 hreflang, SoftwareApplication JSON-LD, sitemap, OG/Twitter 정보를 제공한다. 실제 공개된 설치 파일만 링크와 메타데이터에 포함한다.
- 테마 기본값은 시스템 설정이다. OS 테마 변화는 즉시 반영하며, 수동 선택은 WORKS 메인과 같은 저장 키를 사용한다. 제작사 로고도 같은 테마를 따른다.
- 서비스·가입·제작사 링크는 `PUBLIC_VORA_URL`, `PUBLIC_VORA_SIGNUP_URL`, `PUBLIC_COMPANY_URL`로 관리한다.
- 공유 카드: `public/brand/hwp-desktop-{ko,en,ja}-v1.png`, 1200×630. 로컬 서버 실행 후 `PREVIEW_URL=http://127.0.0.1:4190 node scripts/hwp-social-cards.mjs`로 재생성한다. 배포 빌드는 커밋된 PNG를 사용한다.
