# CELL 1.0.3 배포 기록 — 2026-10-28

CELL 소스 `3971b02f8489896cddb8ace60e09f711d3ba119a`의 기존 셀 값 편집 시 XLSX 원본 항목 보존 개선을 배포한다. 웹 소스 `3c12d82249e2acabcb052d45894dc58902bfa2f6`는 Render `dep-dbglrsbbc2fs73b34nrg`에서 LIVE이며 실제 Chrome 편집·Undo/Redo, WebKit 저장·재열기를 확인했다.

## 검증된 설치 파일

| OS | 파일 | 크기 | SHA-256 |
| --- | --- | ---: | --- |
| Linux x64 | `VORA-CELL-1.0.3-linux-x64.AppImage` | 1207056888 | `25b6273ed4c29fdfc7e9ffc9d566069118370fd33b7403a1755d2957fec6e9d1` |

Linux는 GitHub Actions `40624489209`에서 빌드 및 설치 후 실행 검사 12개를 통과했다. 실제 X11 포커스, Arial 선택 유지, 번들·시스템 글꼴, 공용 서식 60개, 통합 문서·차트 저장과 재열기, 한·영·일 및 밝고 어두운 화면을 확인했다. 비공개 draft `desktop-v1.0.3-3971b02f8489`의 asset `683679758` 이름·크기·SHA-256·uploaded 상태를 독립 확인했다.

## 플랫폼별 공개 범위

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

Git 푸시와 Render LIVE, 공개 파일 확인 결과는 배포 완료 후 이 기록에 추가한다.
