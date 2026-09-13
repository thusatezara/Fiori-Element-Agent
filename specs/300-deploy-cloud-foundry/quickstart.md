# Quickstart: Protocol 300 문서·안전 계약 검증

현재 protocol 상태는 `DEFINED`다. 이 guide에서는 실제 `cf` command, login, target 변경 또는 deployment를 실행하지 않는다.

## Prerequisites

- repository root에서 실행
- Node.js >=20
- 실제 API/org/space, credential, token 또는 active session 정보는 fixture에 저장하지 않음

## 1. 산출물 확인

```powershell
rg --files specs/300-deploy-cloud-foundry
```

Expected: spec/plan/research/data-model/quickstart/tasks, 2개 contract와 requirements checklist가 존재한다.

## 2. JSON syntax 확인

```powershell
Get-ChildItem specs/300-deploy-cloud-foundry/contracts/*.json | ForEach-Object { Get-Content $_.FullName -Raw | ConvertFrom-Json | Out-Null }
```

Expected: error 없이 종료한다.

## 3. requirement와 task trace 확인

```powershell
rg -n "FR-[0-9]{3}|SC-[0-9]{3}" specs/300-deploy-cloud-foundry/spec.md
rg -n "^- \[ \] T[0-9]{3}" specs/300-deploy-cloud-foundry/tasks.md
```

Expected: FR-001~FR-021, SC-001~SC-007과 연속 task ID가 확인된다.

## 4. `DEFINED` safety 확인

```powershell
rg -n "DEFINED|NOT_IMPLEMENTED|실제.*cf|credential|production approval" specs/300-deploy-cloud-foundry
```

Expected: 실제 CF process 실행 금지, exact target/approval/PROD gate와 secret 저장 금지가 명시된다.

## 5. 구현 후 activation

fake process adapter 기반 contract/preflight/approval/idempotency/health/recovery test와 전체 `npm test`가 통과한 동일 변경에서만 `src/deployment/cloud-foundry/protocol.mjs`에 executor를 등록하고 `IMPLEMENTED`로 전환한다. 실제 배포 검증은 그 이후에도 실행 시점의 API, org, space, stage와 명시적 외부 변경 승인을 다시 받아야 한다.
