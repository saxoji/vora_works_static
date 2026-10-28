# VORA WORD1.0.4 설치판 연결

상태: Linux1.0.4 게시 완료·macOS/Windows1.0.3 유지 · 2026-10-28 · WORD-RELEASE194

## 공통 게시 기준

각 제품은 검증한 새 설치 파일을 기존 S3/CDN에 게시한 뒤 정확한 catalog SHA marker를 공개한다. STATIC은 metadata-only로 빌드하고 설치 파일을 내려받지 않는다. 공개 주소 `https://works.vora.im/releases/`와 이전 버전은 유지한다. 아직 준비되지 않은 OS는 검증된 이전 버전을 제공하며 완료로 표시하지 않는다.

## WORD 변경 범위

- 실행 소스: `5a0203ccad4210cf11d2f033d0fb63b5df56b8d6`, 버전1.0.4.
- 수동 빌드: [40687916691](https://github.com/saxoji/vora_works_word/actions/runs/40687916691).
- 메뉴·리본의 파일 내용 삽입과 선택 대상 처리를 개선한 설치판이다. macOS Apple Silicon arm64, Windows x64, Linux x64가 대상이다.
- WORD 카탈로그·이 문서만 수정하며 다른 제품의 버전이나 앱 코드는 변경하지 않는다. 다운로드 화면의 기존 한국어·영어·일본어와 밝은/어두운 테마를 유지한다.
- 이전 릴리스에서 실행한 업데이터 검사는 원본 소스·파일·버전·실행 ID를 그대로 보존하고 실제 소스/의존성 비교로 재사용한다. 이를1.0.4의 새 업데이트 설치 실행으로 표기하지 않는다. 새 설치 파일의 실행 검사와 macOS 서명·공증·실제 브라우저 quarantine·일반 열기는 별도 검증한다.

## 공개 검증

OS별 게시 파일·크기·SHA-256은 `releases/word/catalog.json`의1.0.4 항목을 기준으로 한다.

- Linux 실제 AppImage 편집·내보내기와 설치 실행 PASS. 원본 보관 실행 [40692978152](https://github.com/saxoji/vora_works_word/actions/runs/40692978152).
- `VORA-WORD-1.0.4-linux-x64.AppImage`:470,612,472바이트, SHA-256 `74573c7562c268562444c969a95336b9c715b46216a804c9743663261d8c75ca`. S3 게시·CDN HEAD 확인 완료.
- 첫 catalog marker: `847c97b334952f18acb14db0565934b29e7e652bdfb44a2a1eb45cd47d59a7c9`. macOS·Windows는 준비될 때까지1.0.3 fallback을 유지한다.
- 실제 marker를 이용한 metadata-only 빌드 PASS, 설치 파일 다운로드0. Playwright24개 조합(3언어×2테마×4폭)과 저장된 테마·언어 이동·SHA 펼치기·JS 비활성·SEO/OG 확인 PASS. 테스트 소유 브라우저·드라이버와 서버 종료 확인.
- 실제 STATIC 배포와 공개 주소 검증 결과는 배포 후 갱신한다.
