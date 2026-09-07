# Quickstart 및 검증 시나리오

이 문서의 명령은 구현 완료 후 사용할 예정 인터페이스다. 현재 Plan 단계에서는 실행 파일이 아직 없다.

## 사전 조건

- Node.js 22 LTS 이상
- 정상 동작하는 `npm`
- dependency 설치 후 생성되는 lockfile
- MTA build 검증을 위한 Cloud MTA Build Tool의 `mbt`
- 인증 없이 `$metadata`를 반환하는 test OData service 또는 repository fixture

현재 host는 Node.js `v22.14.0`이지만 `npm-cli.js`가 누락되어 `npm`이 실패하고 `mbt`가 없다. 구현 시작 전 toolchain을 복구해야 하며 도구 부재를 검증 성공으로 처리하면 안 된다.

## 예정 기본 명령

```powershell
npm ci
npm run build
npm test
node dist/cli/main.js assess --request request.json --json
node dist/cli/main.js approve --run-id <run-id> --digest <canonical-digest> --json
node dist/cli/main.js generate --run-id <run-id> --json
node dist/cli/main.js verify --run-id <run-id> --json
node dist/cli/main.js resume --run-id <run-id> --json
```

각 명령은 stdout에 `contracts/cli-envelope.schema.json`을 만족하는 단일 JSON envelope를 쓰고 사람이 읽는 진단은 stderr에 쓴다. `verify`는 모든 필수 검증이 성공할 때 같은 workflow 안에서 결과를 최종 대상 경로로 finalize한다.

## 인수 시나리오

### 1. Standard CRUD

OData metadata fixture와 단순 CRUD 요구사항으로 `assess`를 실행한다. `STANDARD/READY`가 나오고 승인 후 List Report/Object Page 프로젝트, navigation, Work Zone 및 MTA 설정이 생성되어야 한다.

### 2. Local annotation

표시 label, field group, line item 등 UI 표현 요구를 넣는다. `LOCAL_ANNOTATION/READY`로 분류되고 backend artifact 수정 없이 app-local annotation file과 manifest reference가 생성되어야 한다.

### 3. Extension 및 Custom Page routing

Controller validation 또는 non-draft 일괄 반영 요구는 `EXTENSION/ROUTED_TO_EXTENSION`, Fiori Elements context는 유지하지만 표준 floorplan으로 핵심 interaction을 표현할 수 없는 요구는 `CUSTOM_PAGE/ROUTED_TO_CUSTOM_PAGE`가 되어야 한다. base project를 생성할 수 있으면 생성하되 각 후속 handoff JSON을 남긴다.

### 4. Backend blocker

service에 없는 필수 데이터·business transaction·authorization 변경 요구를 입력한다. `BACKEND_CHANGE_REQUIRED/BLOCKED_BY_BACKEND`가 되고 전체 결과는 complete가 아니어야 한다.

### 5. Freestyle architecture

entity가 없거나 여러 entity를 독립적으로 조합하는 pivot 요구를 입력한다. `FREESTYLE_SAPUI5/REQUIRES_ARCHITECTURE_DECISION`과 architecture handoff를 반환하며 이를 Standard Fiori Elements로 자동 생성하지 않는다.

### 6. 인증 실패

metadata endpoint가 `401` 또는 `403`을 반환하면 credential을 요청·저장하거나 우회하지 않는다. run은 `BLOCKED_BY_AUTH`가 되고 auth-support handoff를 남긴다.

### 7. 대상 충돌과 rollback

비어 있지 않은 output path에 대해 generate를 실행하면 기존 파일 hash가 바뀌지 않아야 한다. staging 단계 실패에서도 최종 output path는 생성되지 않으며 run report가 실패 원인을 보존해야 한다.

### 8. Build 실패

`mbt` 미설치와 `mbt build` non-zero exit를 각각 재현한다. 둘 다 필수 validation 실패여야 하며 `.mtar`이 없는데 complete가 true가 되어서는 안 된다.

### 9. 승인 변조 방지와 resume

승인 후 request 또는 assessment를 변경하면 digest mismatch로 generate가 거부되어야 한다. 변경하지 않은 failed/interrupted run은 기록된 안전 단계에서 resume되고 handoff를 중복 생성하지 않아야 한다.

## 완료 증거

- `npm test` 성공
- 공통 CLI envelope를 포함한 JSON Schema contract test 성공
- 생성된 `manifest.json`과 annotation reference 검사 성공
- 필수 validation이 모두 `PASSED`
- `.mtar` 경로와 SHA-256 기록
- mandatory requirement가 모두 `VERIFIED`
- 기존 사용자 파일이 변경되지 않았다는 E2E 증거
