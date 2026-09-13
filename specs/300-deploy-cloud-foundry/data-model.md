# Data Model: Protocol 300 Cloud Foundry 배포

## DeploymentRequest

| Field | Type | Validation |
|-------|------|------------|
| handoff | ProtocolHandoff | `300@1.0`, DEPLOY_CF step 일치 |
| artifact | DeploymentArtifact | Protocol 200, `READY`, checksum/evidence 필수 |
| target | CloudFoundryTarget | api/org/space/stage 모두 필수 |
| deployIntent | boolean | `true` 필수 |
| approval | ApprovalEvidence | target/artifact/snapshot에 결속 |
| productionApproval | ApprovalEvidence/null | `PROD`일 때 필수 |
| idempotencyKey | UUID string | logical attempt 고유 |

JSON contract에서는 `handoff` 개념을 `handoffVersion`, `handoffId`, `planId`, `stepId`, `protocol`, `completedDependencies`, `requestedAt`의 top-level envelope field로 직렬화한다. executor는 이 field들을 000의 원본 `ProtocolHandoff`와 대조한 뒤에만 CF preflight를 시작한다.

## CloudFoundryTarget

| Field | Type | Validation |
|-------|------|------------|
| api | HTTPS URL | canonical absolute URL |
| org | string | non-empty, observed target와 exact match |
| space | string | non-empty, observed target와 exact match |
| stage | enum | `DEV`, `TEST`, `PROD` |
| fingerprint | SHA-256 | canonical api/org/space/stage에서 계산 |

## PreflightSnapshot

| Field | Type | Validation |
|-------|------|------------|
| snapshotId | UUID string | approval reference |
| targetFingerprint | SHA-256 | requested/current target 일치 |
| artifactChecksum | SHA-256 | 현재 archive와 일치 |
| session | enum | `CONFIRMED`, `UNCONFIRMED`; credential 없음 |
| roleChecks | Check[] | 모두 `PASSED` 필요 |
| toolChecks | Check[] | CLI/plugin 설치 및 version |
| serviceChecks | Check[] | offering/plan/entitlement/quota |
| createdAt | ISO date-time | freshness policy 적용 |
| status | enum | `READY_FOR_APPROVAL`, `BLOCKED` |

## ApprovalEvidence

| Field | Type | Validation |
|-------|------|------------|
| approvalId | UUID string | audit reference, credential 아님 |
| scope | enum | `DEPLOY_CF`, `DEPLOY_CF_PROD` |
| targetFingerprint | SHA-256 | snapshot과 일치 |
| artifactChecksum | SHA-256 | snapshot과 일치 |
| snapshotId | UUID string | current snapshot |
| approvedAt | ISO date-time | freshness policy 통과 |

## DeploymentOperation

| Field | Type | Validation |
|-------|------|------------|
| idempotencyKey | UUID string | logical operation 고유 |
| operationId | string/null | platform 반환값 |
| status | enum | `PENDING`, `RUNNING`, `SUCCEEDED`, `FAILED`, `UNKNOWN` |
| startedAt/finishedAt | ISO date-time/null | 시간 순서 유효 |
| exitEvidence | object | redacted, raw credential 없음 |

## DeploymentReport

| Field | Type | Validation |
|-------|------|------------|
| status | enum | `SUCCEEDED`, `FAILED`, `UNKNOWN`, `BLOCKED`, `NOT_IMPLEMENTED` |
| resultId / protocol | UUID / object | `300@1.0` result identity |
| target | CloudFoundryTarget | secret-free |
| operation | DeploymentOperation/null | 실행된 경우 필수 |
| applicationId / sapCloudService | string/null | artifact manifest identity와 일치 |
| artifactDigest | SHA-256 | 배포한 archive checksum과 일치 |
| subaccount / verifiedAt | string/null / ISO date-time | 성공 evidence에서 필수, 400 same-subaccount 검증용 |
| changedResources | object[] | app/service name과 change type만 기록 |
| validation | DeploymentValidation[] | health/route/operation evidence |
| blockingReasons | object[] | safe message |
| recoveryGuidance | object[] | 자동 실행하지 않음, approval prerequisite 포함 |

## Relationships

```text
ProtocolHandoff 1 ── 1 DeploymentRequest
DeploymentRequest 1 ── 1 DeploymentArtifact
DeploymentRequest 1 ── 1 CloudFoundryTarget
DeploymentRequest 1 ── 1 PreflightSnapshot
PreflightSnapshot 1 ── 1..2 ApprovalEvidence
DeploymentRequest 1 ── 0..1 DeploymentOperation
DeploymentOperation 1 ── 0..1 DeploymentReport
```

## State Transitions

```text
RECEIVED ─ protocol DEFINED → NOT_IMPLEMENTED
RECEIVED ─ invalid artifact/target/secret → BLOCKED
RECEIVED ─ valid local contract → PREFLIGHT
PREFLIGHT ─ prerequisite mismatch/unknown → BLOCKED
PREFLIGHT ─ all confirmed → READY_FOR_APPROVAL
READY_FOR_APPROVAL ─ missing/stale/mismatch approval → BLOCKED
READY_FOR_APPROVAL ─ valid approval → EXECUTING
EXECUTING ─ observed success → VALIDATING
EXECUTING ─ known failure → FAILED
EXECUTING ─ timeout/unobservable → UNKNOWN
VALIDATING ─ operation + health + route pass → SUCCEEDED
VALIDATING ─ check fails → FAILED|UNKNOWN
```
