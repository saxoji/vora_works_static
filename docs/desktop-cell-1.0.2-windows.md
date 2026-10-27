# CELL Windows 1.0.2 공개 — 2026-10-27

CELL 소유자의 `/private/tmp/cell-final190/windows-publication-approval.json`에 따라 이미 생성된 동일 MSI/ZIP을 연결한다. Mac/Linux와 이전 버전 파일은 변경하지 않는다. 새 앱 빌드나 통과한 기능 검사는 반복하지 않는다.

- source: `70aaaa37d2da3aa17de1347814983ba328763826`
- private release `425093085`, tag `desktop-v1.0.2-70aaaa37d2da`
- MSI asset `680981035`: 1,070,966,662 bytes, SHA-256 `8032b04dcb478f1f94b671395893e3451b11dee66af01d22958758601340c18f`
- ZIP asset `680982620`: 1,070,966,814 bytes, SHA-256 `3f1467323289f7f8dae4f412c4f797da8b6b94f08f951ed2b773e2b09d13727d`

현재 설치본의 실제 설치·Arial 선택·서식·저장/재열기 검사 `40474995027`과 실제 실패 복원 `40483592772`는 통과했다. 정상 업데이트는 업데이트 핵심 코드·진입점·의존성·패키저가 같은 이전 소스의 `40445323709` 통과 근거를 재사용했다. 중복 run `40483588435`는 취소 요청했으며 통과로 기록하지 않는다. 현재 동일 바이트로 정상 업데이트 전체 E2E를 새로 완료했다는 뜻은 아니다. 상세 범위는 CELL의 `windows-update-evidence-reuse.json`을 따른다.

`downloadFallbacks.windows`를 제거하고 stable1.0.2에 정확한 MSI/ZIP을 추가한다. 일반 다운로드 버튼은 ZIP을 우선하며 자동 업데이트는 MSI를 사용한다. 기존 `PUBLIC_CELL_WINDOWS_DOWNLOAD_URL`은 OS별 다운로드 페이지를 가리키므로 환경변수 변경은 필요 없다. 한국어·영어·일본어 페이지는 같은 manifest를 사용한다.

정적 페이지 생성과 연결된 URL/크기/SHA를 확인한다. Render의 기존 publisher가 GitHub 원본 바이트를 내려받아 크기·SHA를 검사한 후 배포한다. 이 배포 전송 검증은 앱 기능 재검사가 아니다.
