# VORA WORKS — VORA WORD 1.0.3 설치판 연결

상태: macOS·Linux 설치 검증 완료, STATIC 공개 준비 · 2026-10-28 · WORD-RELEASE177

## 공통 기준

실제 설치와 업데이트 검증을 마친 OS만 새 버전으로 연결한다. 미완료 OS는 기존 검증 파일을 유지하며, 공개한 버전별 파일을 다른 바이트로 교체하지 않는다. 다운로드 페이지와 메인 카드, 업데이트 목록, 다국어 검색·공유 정보는 같은 공개 카탈로그를 따른다.

## WORD 적용

- macOS Apple Silicon과 Linux x64는 1.0.3이다. 실행 소스는 `6261e0a1cee2f7a5182ce65d6f206accff2db50e`이며 부모 공통 엔진 변경을 포함한다.
- Windows x64는 검증된 1.0.2 MSI·ZIP을 그대로 유지한다. `downloadFallbacks.windows = "1.0.2"`로 OS 카드와 다운로드 링크에 실제 버전을 표시한다. Windows 1.0.3 완료를 의미하지 않는다.
- 기존 1.0.0~1.0.2 파일과 CELL·SLIDE·HWP 카탈로그를 유지한다. CELL 전 OS 1.0.3의 STATIC `22b2d05` 이후에 작업했다.
- 설치판은 AI·Smart 기능을 실행하지 않는다. 오프라인 문서 글꼴 548개와 기본 서식 563개를 포함하며 사용자 문서·설정을 유지한다.

## 설치와 업데이트 근거

- [고정 소스 수동 빌드 40625820609](https://github.com/saxoji/vora_works_word/actions/runs/40625820609): macOS·Linux OS 작업이 통과했다. Windows 작업은 진행 중이다.
- macOS: Developer ID 서명, 앱·DMG Apple 공증과 staple, 실제 Chrome 격리 다운로드, 정상 ‘열기’, 설치 사본 실행을 확인했다. [최종 설치·업데이트·롤백 40630570986](https://github.com/saxoji/vora_works_word/actions/runs/40630570986)이 통과했다. 최초 로컬 이미지 연결은 120초 시간 제한을 넘겨 해제한 뒤 600초 제한으로 재시도했으며 보안 설정·격리 속성은 변경하지 않았다.
- Linux: [업데이트·롤백 40631744332](https://github.com/saxoji/vora_works_word/actions/runs/40631744332), [설치·글꼴 검사와 보관 40632031787](https://github.com/saxoji/vora_works_word/actions/runs/40632031787)이 통과했다.
- 두 OS 모두 실제 설치 파일로 다운로드 취소, 저장 실패 보호, 정상 교체와 실패 복원을 검사했다. 운영 사용자의 자동 업데이트 실행 증거와 구분한다.

| 파일 | 바이트 | SHA-256 |
|---|---:|---|
| VORA-WORD-1.0.3-mac-arm64.dmg | 496151258 | `914bf0fb8afc3c45980bdd106f3ab54f1910500412383f1217328da7d89693bd` |
| VORA-WORD-1.0.3-mac-arm64.zip | 496151414 | `7c58b18db79c61a8d9c0ae72606bdf86c2a1675821efd47be7c16878dc536e92` |
| VORA-WORD-1.0.3-linux-x64.AppImage | 470432248 | `d78ed000de2fd112a47d18205f5948b032bb817228fbeed832991836a15a374c` |

Mac ZIP은 같은 검증 DMG를 담는다. 공개 파일과 검증 기록은 WORD 저장소의 `desktop-v1.0.3`에 보관했으며 QA 앱·전용 TLS 자료는 공개 다운로드에 포함하지 않는다.

## STATIC 검증과 공개

- 릴리스·공개 설정·설치 안내 검사 35개 통과. 설치 파일을 내려받지 않는 로컬 미리보기 20개 생성 완료.
- 다운로드 UI는 96개 언어·테마·너비 조합과 JavaScript 없는 화면의 링크·버전·SEO·공유 이미지 검사를 통과했다. JavaScript 컨텍스트를 닫은 뒤 다음 컨텍스트를 열며, 소유 프로세스 14개 종료를 확인하고 공용 UI 잠금을 해제했다. 한국어 데스크톱 어두운 화면과 영어 모바일 밝은 화면을 직접 확인했다.
- 메인 카드의 OS별 링크는 기존 언어별 WORD 다운로드 페이지를 사용한다. 해당 페이지는 1.0.3 카탈로그와 Windows 1.0.2 보존 항목을 함께 표시한다.
- 한국어·영어·일본어 페이지의 OS별 버전, 다운로드 링크, 구조화 정보·공유 이미지, 실제 공개 파일의 전체 크기·해시는 배포 후 확인한다. 현재 문서는 Render LIVE 완료를 주장하지 않는다.

## 변경 이력

| 날짜 | 차수 | 내용 |
|---|---:|---|
| 2026-10-28 | 1 | 검증 완료 Mac·Linux 1.0.3 연결 준비와 Windows 1.0.2 보존 |
