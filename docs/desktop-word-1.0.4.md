# VORA WORD1.0.4 설치판 연결

상태: macOS·Linux1.0.4 게시 완료·Windows1.0.3 유지 · 2026-10-28 · WORD-RELEASE194

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
- Linux 연결 STATIC `de1c1dc795112f2ce592c8ef992ad69b04ca50c3` / `dep-dbgv6n7f3r2c73anqd00`:2026-10-28 13:06:50 UTC LIVE. 실제3언어 페이지·홈 OS 링크·stable feed 일치·AppImage HEAD200/크기/무리디렉션 확인. 운영 확인에서도 설치 파일 본문 다운로드0.
- macOS Developer ID 서명·앱/DMG Apple 공증 Accepted·staple·Gatekeeper PASS. 실제 Chrome 다운로드의 quarantine을 유지한 일반 열기, 설치본 편집·내보내기 PASS. 앱/브라우저/임시 디스크 종료 확인. 서명 전후 리소스1,741개 동일.
- macOS DMG496,176,115바이트·SHA `ac1977b35db8dffa5b36dca1316fe9b89ebbff71dd8085446ce018b0a8b4752a`, 같은 DMG를 담은 ZIP496,176,271바이트·SHA `25d6f3857c3cad2f8458c0e83b7a94bf6de90b906af689b800abe95a32ce7b08`. 원본 보관과 S3/CDN 확인 완료.
- macOS 추가 marker: `a3b42219df26f944aa087ab09a1ee5c264b4658f03cec666f9b57e9603716e5f`. Windows만 검증된1.0.3 fallback을 유지한다. 화면 코드는 변경하지 않아24개 브라우저 검증 근거를 재사용하고 새 catalog의 metadata-only 빌드·공개 주소를 확인한다.
