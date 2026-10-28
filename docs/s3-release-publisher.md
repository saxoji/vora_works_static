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

## 보존과 실패 처리

- 현재 catalog 원본 바이트 SHA-256과 제품·버전·원본 크기/해시를 기준으로 처리한다. GitHub source는 해당 제품의 고정 release asset API만 허용하고 CDN redirect에 GitHub 인증 헤더를 전달하지 않는다.
- 설치 파일은 64MiB part와 최대 2개 업로드 작업으로 스트리밍한다. 전체 37GB를 빌드/로컬 디스크에 적재하지 않는다. 원본 part와 최종 파일의 SHA-256·크기를 모두 확인한 뒤 S3 multipart를 완료한다. S3 전송 part도 SHA-256 checksum을 사용한다.
- 기존 객체의 크기/저장된 SHA가 같으면 다시 전송하지 않는다. 다르면 덮어쓰지 않고 중단한다. 새 키 완료 및 marker 쓰기에 `If-None-Match: *`를 사용해 동시 덮어쓰기를 막는다. 실패한 자신의 multipart만 중단하며 이전 공개 원본은 삭제하지 않는다.
- S3 완료 후 CDN HEAD의 200·Content-Length·ETag·원본 인코딩을 확인한다. 설치 파일/과거 버전을 전부 다시 다운로드해 검사하지 않는다. 기존 앱이 사용하는 `works.vora.im/releases/*` 주소는 사이트의 200 rewrite로 유지하며 301/302 전환을 사용하지 않는다.
- 해당 catalog의 모든 파일을 확인한 후에만 `releases/{product}/catalogs/{catalogSHA256}.json` marker를 마지막으로 게시한다. 내용은 `{"product":"cell","sha256":"..."}`다. 사이트 빌드는 이 고정 marker가 일치할 때만 해당 catalog를 공개한다.
- 중단 후 같은 명령을 실행하면 이미 완료된 객체는 재전송하지 않는다. 아직 완료되지 않은 파일만 다시 처리한다. 다운로드/권한/무결성 오류를 marker 성공으로 기록하지 않는다.

## 이번 확인

2026-10-28 기준 원본 catalog 4개, 파일 58개, 37,094,576,757바이트다. 단위 검사 9개에서 스트리밍·부분 해시·불변 객체·기존 객체 재사용·local 원본 재사용·인증 헤더 격리·CDN 응답·marker 게시 순서를 확인했다. SDK가 S3 조건부 완료와 SHA-256 multipart 기능을 지원함도 확인했다. 실제 이관 및 사이트 LIVE 완료는 운영 배포 기록에 별도로 남긴다.
