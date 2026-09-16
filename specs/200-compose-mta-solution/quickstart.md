# Quickstart: Protocol 200 문서·계약 검증

현재 protocol 상태는 `IMPLEMENTED`다. 이 guide는 contract 검증, 격리된 MTA build와 결과 확인 절차를 설명하며 `cf` command 또는 외부 변경은 Protocol 300에만 위임한다.

## Prerequisites

- repository root에서 실행
- Node.js >=20
- credential, token 또는 실제 landscape target을 fixture에 넣지 않음

## 1. 산출물 확인

```powershell
rg --files specs/200-compose-mta-solution
```

Expected: spec/plan/research/data-model/quickstart/tasks, 2개 contract와 requirements checklist가 존재한다.

## 2. JSON syntax 확인

```powershell
Get-ChildItem specs/200-compose-mta-solution/contracts/*.json | ForEach-Object { Get-Content $_.FullName -Raw | ConvertFrom-Json | Out-Null }
```

Expected: error 없이 종료한다.

## 3. requirement와 task trace 확인

```powershell
rg -n "FR-[0-9]{3}|SC-[0-9]{3}" specs/200-compose-mta-solution/spec.md
rg -n "^- \[ \] T[0-9]{3}" specs/200-compose-mta-solution/tasks.md
```

Expected: FR-001~FR-018, SC-001~SC-007과 연속 task ID가 확인된다.

## 4. 안전 경계 확인

```powershell
rg -n "DEFINED|credential|token|외부 변경|cf deploy" specs/200-compose-mta-solution
```

Expected: credential 저장 금지, `DEFINED` 동안 package/build executor 실행 금지, `cf deploy` 비책임 경계가 명시된다.

## 5. Build와 error code

`composeMtaSolution`은 input/checksum/boundary/collision 검증 뒤 `mbt build -p cf`를 argument array로 실행한다. 검증 실패는 `PREFLIGHT_FAILED`로 차단하며 기존 output을 덮어쓰지 않는다. 성공 결과는 `.mtar`, archive SHA-256, descriptor fingerprint와 validation evidence를 포함한다.

```powershell
npm test
```

Expected: Protocol 200 contract, tamper, topology, build 및 전체 regression test가 통과한다.

## 6. 재사용 가능한 CAP HANA topology

`tests/mta-composition.test.mjs`는 예제와 무관한 `inventory-api` CAP component를 사용해 다음을 검증한다.

- `inventory-api-srv`, `inventory-api-db-deployer`, `inventory-api-db` 이름이 application identity에서 파생된다.
- HDI resource는 `com.sap.xs.hdi-container`, `hana/hdi-shared`다.
- module path는 staging된 `backend/gen/srv`, `backend/gen/db`다.
- CAP package persistence와 입력 capability가 충돌하면 build 전에 `BLOCKED`다.
- core descriptor와 runtime source에 `bookshop` 같은 sample-specific 이름이나 endpoint가 없다.
