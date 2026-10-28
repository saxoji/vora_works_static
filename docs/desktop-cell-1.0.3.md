# CELL 1.0.3 배포 기록 — 2026-10-28

CELL 소스 `3971b02f8489896cddb8ace60e09f711d3ba119a`의 기존 셀 값 편집 시 XLSX 원본 항목 보존 개선을 배포한다. 웹 소스 `3c12d82249e2acabcb052d45894dc58902bfa2f6`는 Render `dep-dbglrsbbc2fs73b34nrg`에서 LIVE이며 실제 Chrome 편집·Undo/Redo, WebKit 저장·재열기를 확인했다.

## Linux 우선 공개 설치 파일

| OS | 파일 | 크기 | SHA-256 |
| --- | --- | ---: | --- |
| Linux x64 | `VORA-CELL-1.0.3-linux-x64.AppImage` | 1207056888 | `25b6273ed4c29fdfc7e9ffc9d566069118370fd33b7403a1755d2957fec6e9d1` |

Linux는 GitHub Actions `40624489209`에서 빌드 및 설치 후 실행 검사 12개를 통과했다. 실제 X11 포커스, Arial 선택 유지, 번들·시스템 글꼴, 공용 서식 60개, 통합 문서·차트 저장과 재열기, 한·영·일 및 밝고 어두운 화면을 확인했다. 비공개 draft `desktop-v1.0.3-3971b02f8489`의 asset `683679758` 이름·크기·SHA-256·uploaded 상태를 독립 확인했다.

## Linux 우선 공개 시점의 플랫폼별 범위

- stable feed의 1.0.3 `artifacts`에는 검증된 Linux 파일만 포함한다.
- macOS·Windows는 각각 검증된 1.0.2 다운로드를 `downloadFallbacks`로 유지하며 카드에 해당 버전을 표시한다. 새 설치 파일 검증이 끝나면 플랫폼별로 갱신한다.
- fallback은 다운로드 화면용이다. 네이티브 업데이트는 1.0.3 `artifacts`만 사용하므로 구버전 파일을 1.0.3으로 오인하지 않는다.
- 기존 버전의 URL·크기·해시는 변경하지 않는다. Windows 다운로드는 ZIP, 네이티브 업데이트는 MSI 정책을 유지한다.
- 다른 제품의 catalog·소스·배포 설정은 변경하지 않는다.

## 변경 영향에 맞춘 검증

- release publisher/feed·public config 테스트 21개 통과.
- 로컬 preview 20페이지 생성 성공. 설치 파일 중복 다운로드는 생략하고 운영 빌드가 원본 전체 크기와 SHA-256을 검증하도록 한다.
- CELL 한·영·일의 데스크톱·모바일 화면에서 OS별 버전·다운로드 링크, canonical·OG·JSON-LD 1.0.3, 가로 넘침 없음 확인. 한국어 데스크톱 스크린샷도 확인했다.
- 로컬 preview의 운영 stable feed 호출은 서로 다른 origin이므로 CORS로 거절된다. 내장 catalog로 표시되는 위 검사와 구분하며, LIVE 후 동일 origin feed와 콘솔을 별도로 확인한다.
- 기존 공통 설치 안내·테마·업데이트 구현은 바뀌지 않아 해당 전체 회귀는 반복하지 않았다. 실제 AI 호출은 정상 VORA 실행 링크가 필요한 별도 검증이며 본 배포 결과에 포함하지 않는다.

## 운영 상태

Linux 우선 공개 소스 `ce2c724b7ac386d280ec6d26fa09ec87b59b7c4c`를 main에 푸시했다. Render `dep-dbgmq0c9v7es73at1e10`은 2026-10-28 03:43:33 UTC에 LIVE가 됐다. 운영 빌드에서 설치 파일 전체 크기·SHA-256 검증을 통과했으며, 공개 stable feed 1.0.3/Linux artifact와 macOS·Windows 1.0.2 fallback을 확인했다. Linux 공개 파일은 HTTP 206, 전체 크기 1207056888 및 ELF 헤더를 확인했다. 후속 Mac·Windows 검증 결과는 아래에 이어 기록한다.

운영 사이트 한·영·일의 canonical·OG·JSON-LD·OS별 링크, 모바일 가로 넘침 없음, 다크 화면을 확인했고 브라우저 콘솔·페이지 오류는 0개였다. 로컬 preview에서만 발생하던 cross-origin feed 제한은 실제 동일 origin 사이트에서 발생하지 않았다.

## macOS 1.0.3 공개 승인

- 파일: `VORA-CELL-1.0.3-mac-arm64.dmg`, 1356768678 bytes.
- SHA-256: `7b806b32fa6c56cb23d439be5c00b27dcfcf699c2200f963b209adcddb39321f`; 동일 draft의 asset `683720425`.
- Developer ID 팀 `3M66TS3B3A`로 서명했고 앱과 DMG 각각 Apple 공증 Accepted, staple·Gatekeeper 검증을 통과했다.
- [설치 검사 40628309608](https://github.com/saxoji/vora_works_cell/actions/runs/40628309608)는 최종 DMG를 다시 빌드하거나 서명하지 않고 전체 해시·소스·팀을 확인한 뒤 설치했다. DMG를 분리하고 실행한 11개 검사에서 공용 서식 60개, Arial 선택 유지와 2032개 글꼴 선택지, 통합 문서·차트 저장/재열기, 한·영·일과 밝고 어두운 화면 검사를 통과했다.
- 설치된 실행 파일 SHA가 로컬 서명 완료본과 같고, CI exit code는 0이다. Mac fallback은 검증된 1.0.3 파일로 대체한다.

## Windows 1.0.3 공개 승인과 최종 범위

[3플랫폼 실행 40624489209](https://github.com/saxoji/vora_works_cell/actions/runs/40624489209)은 전체 성공했다. Windows의 컴파일·편집/내보내기 검사 이후 MSI/ZIP을 만들고, 별도 깨끗한 Windows 설치 환경에서 11개 검사·exit code 0을 확인했다. 실제 Arial 선택 유지 화면도 검토했다. 설치 서식 60개, 글꼴 선택·저장/재열기, 통합 문서·차트, 한·영·일 및 밝고 어두운 화면을 포함한다. 설치 완료 후 동일 파일의 비공개 draft 업로드 상태·크기·해시·소스도 대조했다.

| 형식 | Asset | 크기 | SHA-256 |
| --- | --- | ---: | --- |
| MSI | `683785689` | 1072049018 | `f7771c0ca14d3c9ea60e86c1bc56b0321af5484bd0e46fb58d6a63b4178adc30` |
| ZIP | `683786644` | 1072049170 | `a0f40f631adb4948fc17ba97245907ec0e0a9ad7bda2c03801dc12c1a652dd9b` |

최종 1.0.3에는 macOS arm64 DMG, Windows x64 ZIP/MSI, Linux x64 AppImage를 모두 포함하며 fallback을 제거한다. Windows 다운로드 화면은 ZIP을, 네이티브 자동 업데이트는 MSI를 계속 사용한다. 기존 버전 파일은 그대로 보존한다. 플랫폼별로 달랐던 이전 공개 상태와 위 Linux 우선 공개 기록은 당시 이력이다.

업데이트 실행 코드는 수정하지 않았으며 기존 통과 근거를 재사용한다. 이번 확인은 새 설치 파일의 실제 설치·실행·문서 동작과 새 버전 feed 연결이며, 동일 업데이트 전체 시나리오를 반복하지 않았다.
