# Quickstart: Protocol 300 문서·안전 계약 검증

현재 protocol 상태는 `IMPLEMENTED`다. 실제 deployment는 exact target의 read-only preflight snapshot을 만든 후 그 snapshot과 artifact checksum에 결속된 승인이 있을 때만 실행한다.

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

## 5. 실행과 recovery

`createDeploymentPreflight`로 snapshot을 생성한 뒤 `deployToCloudFoundry`에 snapshot-bound approval을 전달한다. `PROD`에는 별도 `DEPLOY_CF_PROD` 승인이 필요하다. 실패 또는 관찰 불가 상태에서는 자동 retry, undeploy 또는 rollback을 수행하지 않으며 신규 승인을 요구하는 recovery guidance만 반환한다.

오류는 `DEPLOYMENT_BLOCKED`, `FAILED` 또는 `UNKNOWN`으로 구분한다. 성공은 operation, application health와 route가 모두 확인된 경우에만 `SUCCEEDED`다.
