# VORA WORKS — VORA WORD 1.0.3 설치판 연결

상태: 전 OS1.0.3 원본 게시 완료, Windows STATIC 연결 반영·합동 배포 대기 · 2026-10-28 · WORD-RELEASE177/181

## 공통 기준

실제 설치 검증을 마친 OS만 새 버전으로 연결한다. 변경된 코드와 직접 영향만 검사하며, 업데이트 구현·연결·의존성이 같으면 기존 업데이트/복원 근거를 출처와 함께 재사용한다. 같은 설치 파일의 반복 실행·다운로드·전체 해시 검사를 공개 조건으로 삼지 않는다. 미완료 OS는 기존 검증 파일을 유지하며, 공개한 버전별 파일을 다른 바이트로 교체하지 않는다. 다운로드 페이지와 메인 카드, 업데이트 목록, 다국어 검색·공유 정보는 같은 공개 카탈로그를 따른다.

## WORD 적용

- macOS Apple Silicon과 Linux x64는 1.0.3이다. 실행 소스는 `6261e0a1cee2f7a5182ce65d6f206accff2db50e`이며 부모 공통 엔진 변경을 포함한다.
- Windows x64도 같은 소스의 1.0.3 MSI·ZIP으로 연결하고 이전 `downloadFallbacks.windows`를 제거했다. 기존 버전별 1.0.2 파일은 유지한다.
- 기존 1.0.0~1.0.2 파일과 CELL·SLIDE·HWP 카탈로그를 유지한다. CELL 전 OS 1.0.3의 STATIC `22b2d05` 이후에 작업했다.
- 설치판은 AI·Smart 기능을 실행하지 않는다. 오프라인 문서 글꼴 548개와 기본 서식 563개를 포함하며 사용자 문서·설정을 유지한다.

## 설치와 업데이트 근거

- [고정 소스 수동 빌드 40625820609](https://github.com/saxoji/vora_works_word/actions/runs/40625820609): 세 OS 제품 빌드·설치/글꼴·편집/내보내기 검사가 통과했다. Windows는 QA 빌드/업로드 이후 정리 과정에서 전체 상태가 취소됐지만 모든 실제 단계는 성공 또는 조건부 생략이었다.
- macOS: Developer ID 서명, 앱·DMG Apple 공증과 staple, 실제 Chrome 격리 다운로드, 정상 ‘열기’, 설치 사본 실행을 확인했다. [최종 설치·업데이트·롤백 40630570986](https://github.com/saxoji/vora_works_word/actions/runs/40630570986)이 통과했다. 최초 로컬 이미지 연결은 120초 시간 제한을 넘겨 해제한 뒤 600초 제한으로 재시도했으며 보안 설정·격리 속성은 변경하지 않았다.
- Linux: [업데이트·롤백 40631744332](https://github.com/saxoji/vora_works_word/actions/runs/40631744332), [설치·글꼴 검사와 보관 40632031787](https://github.com/saxoji/vora_works_word/actions/runs/40632031787)이 통과했다.
- 두 OS 모두 실제 설치 파일로 다운로드 취소, 저장 실패 보호, 정상 교체와 실패 복원을 검사했다. 운영 사용자의 자동 업데이트 실행 증거와 구분한다.
- Windows: [원본 설치 파일 게시 40637867982](https://github.com/saxoji/vora_works_word/actions/runs/40637867982)가 2026-10-28 14:27 KST에 통과했다. 원본 MSI·ZIP과 1.0.3 설치/글꼴 PASS를 재사용했다. 업데이트 구현·앱 연결·패키저·전이 의존성의 동일성 서명은 `d15755ede94465611dd531386f50edb16b5407aa8463cb5d465f7b40c56c870d`이며, 기존1.0.2 [업데이트/복원 40521276210](https://github.com/saxoji/vora_works_word/actions/runs/40521276210)의 증거를 보존했다. 1.0.3 업데이트 E2E를 새로 실행한 것은 아니다. 공개 `build-evidence-windows.json`에 재사용 출처와 `newInstallerUpdateExecuted: false`를 기록했다.

| 파일 | 바이트 | SHA-256 |
|---|---:|---|
| VORA-WORD-1.0.3-mac-arm64.dmg | 496151258 | `914bf0fb8afc3c45980bdd106f3ab54f1910500412383f1217328da7d89693bd` |
| VORA-WORD-1.0.3-mac-arm64.zip | 496151414 | `7c58b18db79c61a8d9c0ae72606bdf86c2a1675821efd47be7c16878dc536e92` |
| VORA-WORD-1.0.3-linux-x64.AppImage | 470432248 | `d78ed000de2fd112a47d18205f5948b032bb817228fbeed832991836a15a374c` |
| VORA-WORD-1.0.3-win-x64.msi | 410039381 | `39fa5c64f3fcb41a603c696e430b2c07459d6af3af3398ac59cc771f7e5447da` |
| VORA-WORD-1.0.3-win-x64.zip | 409240009 | `3397bb386742cb838f811d66147db6ad678c45de318959b993f7cf420f5519f3` |

Mac ZIP은 같은 검증 DMG를 담는다. 공개 파일과 검증 기록은 WORD 저장소의 `desktop-v1.0.3`에 보관했으며 QA 앱·전용 TLS 자료는 공개 다운로드에 포함하지 않는다.

## STATIC 검증과 공개

- 릴리스·공개 설정·설치 안내 검사 35개 통과. 설치 파일을 내려받지 않는 로컬 미리보기 20개 생성 완료.
- 다운로드 UI는 96개 언어·테마·너비 조합과 JavaScript 없는 화면의 링크·버전·SEO·공유 이미지 검사를 통과했다. JavaScript 컨텍스트를 닫은 뒤 다음 컨텍스트를 열며, 소유 프로세스 14개 종료를 확인하고 공용 UI 잠금을 해제했다. 한국어 데스크톱 어두운 화면과 영어 모바일 밝은 화면을 직접 확인했다.
- 메인 카드의 OS별 링크는 기존 언어별 WORD 다운로드 페이지를 사용한다. 이번 변경의 다운로드 페이지와 업데이트 목록은 전 OS 1.0.3 카탈로그를 따른다.
- STATIC `9436cb12750324b9b706e9ece8144df2119af0ca`, Render `dep-dbgnor8n74is73cvpa40`가 2026-10-28 13:47:04 KST에 LIVE로 전환됐다. 한국어·영어·일본어 페이지의 OS별 버전·다운로드 링크·메인 카드·구조화 정보·공유 이미지와 stable feed가 일치했다.
- Mac DMG·ZIP, Linux AppImage와 기존 Windows MSI·ZIP의 실제 공개 응답 전체를 읽어 5개 파일의 크기와 SHA-256이 카탈로그 및 검증 원본과 일치함을 확인했다. `/private/tmp/word-static177-partial-live.json`에 결과를 기록했다.
- 최초 확인에서 기본/영어 HTML은 CDN의 `s-maxage=300` 캐시로 이전 버전을 표시했다. 동일 배포를 유지하고 한정된 재확인으로 전파 완료를 확인했다. 캐시 대기를 앱 빌드 실패로 처리하거나 설치 파일 바이트를 교체하지 않았다.
- Windows 추가분은 소형 manifest·빌드 증거와 GitHub asset의 크기·해시 메타데이터를 대조했다. MSI/ZIP의 중복 다운로드 없이 기존 버전·Mac/Linux 항목이 그대로이고 Windows fallback만 제거됐음을 확인했다. 증거: `/private/tmp/word177-windows-catalog-check.json`. 기존 35개 검사·96개 화면과 기존 공개 파일 해시는 반복하지 않았다.
- WORD 카탈로그와 이 기록만 최신 STATIC main 위에 반영했다. 최종 합동 STATIC 배포는 HWP 담당이 수행하며, 이 단계는 Windows 공개 URL의 LIVE 완료를 의미하지 않는다.

## 변경 이력

| 날짜 | 차수 | 내용 |
|---|---:|---|
| 2026-10-28 | 1 | 검증 완료 Mac·Linux 1.0.3 연결 준비와 Windows 1.0.2 보존 |
| 2026-10-28 | 2 | Mac·Linux STATIC LIVE와 3언어/5파일 전체 해시 검증, CDN 전파 기록 |
| 2026-10-28 | 3 | 검증 Windows1.0.3 원본 연결, 변경 없는 업데이트 증거 재사용·중복 검사 제거 |
