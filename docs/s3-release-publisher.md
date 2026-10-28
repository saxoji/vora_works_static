# 앱 배포 파일 S3/CDN 게시 도구

WORD·HWP·CELL·SLIDE의 검증된 기존 설치 파일과 업데이트 원본을 그대로 이관한다. 앱 재빌드·재포장·재서명·재공증을 하지 않는다. 공통 공개 정책은 [배포 저장소 정책](2026-10-28-release-storage.md)을 따른다.

## 사용

Python 3와 `boto3`/`certifi`, 기존 GitHub 비공개 release 읽기 권한이 필요하다. 최초 적용 환경은 boto3 1.40.61에서 검사했다. 인증값은 기존 보안 설정이나 AWS 기본 자격 증명 체인을 사용하며 명령 인자·소스·로그에 직접 넣지 않는다.

```sh
python3 scripts/upload-desktop-s3.py --plan
python3 scripts/upload-desktop-s3.py --env-file "$VORA_RELEASE_ENV_FILE"
```

기존 설정 파일의 `VORA_EXPORT_S3_ACCESS_KEY_ID`/`VORA_EXPORT_S3_SECRET_ACCESS_KEY`, 또는 `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`/`AWS_SESSION_TOKEN`을 읽을 수 있다. `DESKTOP_RELEASE_GITHUB_TOKEN`/`GH_TOKEN`이 없으면 이미 인증된 `gh auth token`을 메모리에서만 사용한다. 설정 파일을 Git에 넣지 않는다.

기본 목적지는 기존 `vora-tool-storage`/`ap-northeast-2`, `vora-works` prefix, CDN base `https://cdn.vora.im/vora-works`다. `--product cell` 등으로 한 제품만 처리할 수도 있다. 파일 키는 `vora-works/releases/{product}/{version}/{filename}`이며 과거 버전도 유지한다.

`--local-map /안전한/로컬-map.json`은 검증된 파일명→절대 경로의 JSON이다. 준비된 로컬 원본이 있으면 다시 다운로드하지 않고 이 파일을 읽어 업로드한다. 없으면 catalog의 고정 GitHub release asset/parts를 사용한다. 이 map도 개인 경로가 포함되므로 커밋하지 않는다.

SLIDE Windows의 `zip`/`windows-msi-cab-v1` 패키지는 검증된 Actions 결과의 내부 설치용 ZIP을 공급한다. catalog의 출처는 `assets[filename].actionsArtifact = {url, member, size, sha256}`로 기록한다. `url`은 해당 SLIDE 저장소의 고정 `actions/artifacts/ID/zip` API이며 `member`는 실제 안전한 상대 ZIP 경로다. 이 객체의 크기·SHA는 **바깥 Actions 아카이브**의 증거이고, manifest의 크기·SHA는 **안쪽 설치 파일**의 기준이다. 파일명을 공개용으로 바꾸더라도 바이트는 바꾸지 않는다.

준비된 `--local-map` 원본이 있으면 우선 사용한다. 로컬 원본이 없으면 `actions_archive.py`가 고정 출처와 정확한 ZIP member를 검증해 그 member의 바이트만 스트리밍하며, 업로더가 기존 multipart 경로에서 내부 파일의 전체 크기·SHA-256을 확인한다. ZIP 스트림 무결성 또는 내부 크기·SHA가 맞지 않으면 S3 완료 전에 자신의 multipart를 취소한다. 바깥 Actions 아카이브와 내부 설치 ZIP을 로컬 디스크에 적재하지 않는다. 최초 게시 이후에는 검증된 S3 객체를 재사용하므로 Actions 보관 기간에 의존하지 않는다.

범위 스트리밍은 GitHub metadata의 바깥 아카이브 크기·digest를 catalog와 대조한다. 이것을 바깥 파일 전체를 다시 내려받아 해시한 것으로 보고하지 않는다. 인증된 API의 302 주소 선택과 무인증 blob의 206 요청을 분리하고, 모든 자동 redirect를 막는다. API 응답 형식은 [GitHub Actions artifacts API](https://docs.github.com/en/rest/actions/artifacts) 문서를 따른다. 최대 8MiB씩 읽으며 정확한 Content-Range·전체 크기·고정 ETag를 확인한다. 만료된 주소 갱신 시에도 같은 metadata를 확인하고 중단된 범위만 계속 읽는다. 실패 범위당 3회 시도·1회 주소 갱신·60초, 전송 전체 90분으로 제한하며 정상 진행 중 필요한 주소 갱신 횟수에 별도 작은 한도를 두지 않는다. 내부 파일 상한은 기존 catalog와 같은 16GiB다.

## 보존과 실패 처리

- 현재 catalog 원본 바이트 SHA-256과 제품·버전·원본 크기/해시를 기준으로 처리한다. 직접 다운로드하는 release source는 해당 제품의 고정 asset API만 허용하고 CDN redirect에 GitHub 인증 헤더를 전달하지 않는다. 위 SLIDE Actions 출처는 별도의 고정 artifact API와 정확한 내부 ZIP 경로만 허용한다. Actions 아카이브 자체를 공개 설치 파일로 업로드하지 않는다.
- 설치 파일은 64MiB part와 최대 2개 업로드 작업으로 스트리밍한다. 전체 37GB를 빌드/로컬 디스크에 적재하지 않는다. 원본 part와 최종 파일의 SHA-256·크기를 모두 확인한 뒤 S3 multipart를 완료한다. S3 전송 part도 SHA-256 checksum을 사용한다.
- 기존 객체의 크기/저장된 SHA가 같으면 다시 전송하지 않는다. 다르면 덮어쓰지 않고 중단한다. 새 키 완료 및 marker 쓰기에 `If-None-Match: *`를 사용해 동시 덮어쓰기를 막는다. 실패한 자신의 multipart만 중단하며 이전 공개 원본은 삭제하지 않는다.
- S3 완료 후 CDN HEAD의 200·Content-Length·ETag·원본 인코딩을 확인한다. 설치 파일/과거 버전을 전부 다시 다운로드해 검사하지 않는다. 기존 앱이 사용하는 `works.vora.im/releases/*` 주소는 사이트의 200 rewrite로 유지하며 301/302 전환을 사용하지 않는다.
- 해당 catalog의 모든 파일을 확인한 후에만 `releases/{product}/catalogs/{catalogSHA256}.json` marker를 마지막으로 게시한다. 내용은 `{"product":"cell","sha256":"..."}`다. 사이트 빌드는 이 고정 marker가 일치할 때만 해당 catalog를 공개한다.
- 중단 후 같은 명령을 실행하면 이미 완료된 객체는 재전송하지 않는다. 아직 완료되지 않은 파일만 다시 처리한다. 다운로드/권한/무결성 오류를 marker 성공으로 기록하지 않는다.

## 이번 확인

2026-10-28 기준 원본 catalog 4개, 파일 58개, 37,094,576,757바이트다. 단위 검사 9개에서 스트리밍·부분 해시·불변 객체·기존 객체 재사용·local 원본 재사용·인증 헤더 격리·CDN 응답·marker 게시 순서를 확인했다. SDK가 S3 조건부 완료와 SHA-256 multipart 기능을 지원함도 확인했다. 실제 이관 및 사이트 LIVE 완료는 운영 배포 기록에 별도로 남긴다.

Actions 내부 설치 파일 경로를 추가하면서 새 검사 2개와 직접 영향이 있는 기존 검사 2개를 통과했다. 다른 제품·다른 형식·경로 이탈·잘못된 outer 증거 거부, local 부재 시 업로드 시작 차단, inner SHA 불일치 시 완료 차단, 최초 게시 후 원본 없이 S3 재사용을 포함한다. 기존 전체 앱 검수나 서명·공증은 반복하지 않았다.

## Actions 범위 스트리밍 보강 검증

2026-10-28 후속 변경은 위 local-only 요구를 exact-member 스트리밍으로 확장했다.

- `tests/test_actions_archive.py`: helper 담당자의 신규 11개 통과 기록을 재사용했다. 기존 9개를 다시 실행하지 않고 16GiB 경계와 8회를 넘는 정상 주소 갱신 사례 2개만 추가했다. metadata·정확한 member·CRC·크기·ETag·인증 분리·실패 범위 재시도·미소비 스트림 거부를 포함한다.
- `tests/test_desktop_s3_upload.py`: 신규 연결 6개와 직접 영향이 있는 출처 검증 2개 통과. 실제 합성 ZIP → Range → CRC → multipart 통합도 포함하며, 잘못된 크기·SHA·CRC·S3 오류는 완료 없이 Abort한다. 한 검사에서 helper 호출 인자 개수를 맞춘 뒤 그 사례만 다시 실행했다.
- `--plan`: 기존 4개 catalog의 SHA·58개 파일 목록이 그대로임을 로컬 metadata로 확인했다. 기존 바이너리 재다운로드·재해시와 운영 네트워크 업로드는 검증에 포함하지 않았다.

업로더 코드 게시와 실제 새 Windows 파일 게시를 구분한다. 설치 파일은 제품 담당자의 원본 검수가 끝난 뒤 한 번 업로드하며, 새 marker가 준비된 다음에만 다운로드 환경변수와 STATIC 배포를 갱신한다.
