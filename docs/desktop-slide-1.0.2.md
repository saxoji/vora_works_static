# VORA SLIDE 1.0.2 설치형 배포

2026-10-28 · Linux x64 및 macOS Apple Silicon 공개 연결. Windows는 준비 중이며 공개 링크를 활성화하지 않는다.

- 소스: `c7f87d4751bd7f816e81e53c5009adee38470622`
- Linux AppImage: `2,931,018,232` bytes, SHA-256 `c5f58b2c9b4cdf5b1f24b51ab82405881324355f1bb5cc986487050eabaa119e`
- 파일: `https://works.vora.im/releases/slide/1.0.2/VORA-SLIDE-1.0.2-linux-x64.AppImage`
- 다운로드: `https://works.vora.im/downloads/slide/?os=linux`
- 업데이트 피드: `https://works.vora.im/releases/slide/stable.json`

원본 빌드의 163개 검증과 실제 설치된 동일 AppImage의 입력·저장·재열기·서식·글꼴 검증은 run `40630703125`의 보존 근거를 재사용한다. 원본 run `40624816056`의 실패를 성공으로 변경하지 않았다. 업데이트·실패 복원 코드는 기존 검증 소스와 동일하므로 run `40581004084`의 실제 성공·복원 결과만 재사용했으며 과거 앱 화면 품질은 재사용하지 않았다. private 1.0.3은 공개하지 않는다.

게시 전송 run `40637998859`에서 원본 바이트를 재패키징하지 않고 3개 private GitHub asset으로 전달했다. 원격 조각 전체를 합친 크기·해시가 원본과 일치했다. STATIC 빌드는 기존 검증된 배포 경로로 조각을 결합하며 private asset 주소와 토큰을 공개 페이지에 표시하지 않는다.

이번 STATIC 변경 검증은 공개 설정 6개 검사 및 한국어·영어·일본어 다운로드/SEO/OG 링크 확인에 한정한다. 앱·UI·문서 검사를 다시 실행하지 않았다. 기존 다른 제품과 불변 1.0.0 파일을 보존한다. 운영 LIVE는 별도 배포 상태로 확인한다.


## macOS ZIP 우선 배포

- 소스: 동일 C7 / `1.0.2`. Apple Silicon용 signed/stapled 앱을 ZIP으로 배포한다.
- 최종 ZIP: `3,019,414,499` bytes, SHA-256 `a4c20f609bc8cb70d13f182eeb647055bc068fed413d99df87cb40b73e414a3f`.
- 파일: `https://works.vora.im/releases/slide/1.0.2/VORA-SLIDE-1.0.2-mac-arm64.zip`
- 다운로드: `https://works.vora.im/downloads/slide/?os=macos`
- Apple 공증 접수 `32c9a20e-ea57-489a-a6ba-b88d139eff70`의 `Accepted` 및 앱 staple 완료 후 생성한 최종 ZIP 바이트를 그대로 게시한다. 파일명에서 내부 `.signed` 표기만 제외하며 재압축·재서명·재공증하지 않는다.

C7의 기존 200개 검사, 실제 설치·첫 실행·서식·파일 저장/재열기 및 화면 검수(run `40621634934`)를 재사용한다. 서명 후 원본 코드 비교와 서명·공증 검증은 별도 근거로 보존한다. 최초 다운로드를 2차 DMG 공증 대기와 분리했다. 앱의 자동업데이트는 기존 DMG 선택 정책을 유지하며 ZIP을 자동업데이트용으로 간주하지 않는다. private N1.0.3은 공개하지 않는다.

STATIC 변경은 SLIDE macOS ZIP의 4GiB 한도 및 검증된 조각 결합 2경로만 확장했다. 관련 경계/조각 바이트 보존 검사 2개와 변경된 공개 설정 검사 1개를 실행했다. 기존 한국어·영어·일본어 ZIP 설치 안내를 재사용하고 새 실제 파일 링크·SEO/OG 연결을 생성 HTML로 확인했다. 앱·전체 웹/UI 검사를 반복하지 않는다. 실제 운영 LIVE와 링크 응답은 배포 후 별도로 확인한다.

서명 ZIP 전달은 private release `426298729`의 검증된 조각 3개를 재사용한다. 원격 조각 결합 크기·해시가 최종 ZIP과 일치하며 STATIC용 추가 업로드는 없다.

## macOS DMG 추가

동일한 signed/stapled C7 앱을 담은 DMG를 추가한다. 앱 재빌드·기존 기능 검사 없이 새 컨테이너의 서명·공증·staple·읽기 전용 앱 일치 확인만 완료했다. 공증 접수 `d99719eb-1997-466d-bd31-70f67227dc2d`는 `Accepted`다.

- DMG: `3,173,345,862` bytes, SHA-256 `0cc07453806d07d9081b489aab7fee5c6b7da2d443bf17563051fb46a625ff40`.
- 파일: `https://works.vora.im/releases/slide/1.0.2/VORA-SLIDE-1.0.2-mac-arm64.dmg`.
- private release `426327924`의 검증된 조각 3개를 STATIC에서 그대로 결합한다. 전체 원격 조각의 크기·해시 일치 확인 완료 후 등록하며 STATIC용 재업로드는 없다.
- 기존 DMG 우선 다운로드 정책과 네이티브 업데이트 형식에 맞춰 같은 `1.0.2` 피드에 추가했다. 기존 ZIP URL·Linux 및 다른 제품의 카탈로그는 보존한다. private N은 공개하지 않는다.

새 DMG의 실제 카탈로그 계약·우선 선택·기존 항목 보존만 로컬 확인했다. 기존 앱·전체 UI·웹 CI 검사는 반복하지 않는다. LIVE 및 새 DMG 링크 응답은 배포 후 별도로 확인한다.
