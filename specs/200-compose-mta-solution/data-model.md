# Data Model: Protocol 200 MTA 솔루션 구성

## CompositionRequest

| Field | Type | Validation |
|-------|------|------------|
| handoff | ProtocolHandoff | version `1.0`, protocol `200@1.0`, step 일치 |
| solutionId | string | lowercase identifier, 1~63자 |
| outputDirectory | relative path | workspace 내부, 기존 충돌 없음 |
| components | ComponentResult[] | 최소 1개, 모두 `PASSED` |
| identity | SolutionIdentity | application ID 필수, 선택적으로 `sap.cloud.service` |
| requirements | ServiceRequirement[] | target-neutral, credential 금지 |

JSON contract에서는 `handoff` 개념을 `handoffVersion`, `handoffId`, `planId`, `stepId`, `protocol`, `completedDependencies`, `requestedAt`의 top-level envelope field로 직렬화한다. 000의 full `ProtocolHandoff`를 검증한 뒤 domain input adapter가 아래 `ComponentResult` 형태로 source result를 정규화한다.

## ComponentResult

| Field | Type | Validation |
|-------|------|------------|
| resultId | UUID string | handoff dependency evidence에서 참조 가능 |
| protocol | object | source protocol ID/version |
| kind | enum | `BACKEND`, `FRONTEND` |
| validationStatus | enum | `PASSED`만 소비 가능 |
| outputPath | relative path | workspace 내부 |
| checksum | SHA-256 string | 현재 output과 일치 |
| capabilities | object | modules, provides, requires, navigation/auth intent |
| validatedAt | ISO date-time | 유효한 timestamp |

## MtaTopology

| Field | Type | Validation |
|-------|------|------------|
| schemaVersion | string | 지원 version allowlist |
| id | string | application ID와 일관 |
| version | string | canonical version |
| modules | ModuleNode[] | name 고유, path boundary 통과 |
| resources | ResourceNode[] | name 고유, offering/plan 일관 |
| edges | DependencyEdge[] | 양 끝 node 존재, 허용 방향 |

## BuildPlan과 DeploymentArtifact

| Entity.Field | Type | Validation |
|--------------|------|------------|
| BuildPlan.descriptorPath | relative path | output boundary 내부 |
| BuildPlan.moduleOrder | string[] | dependency 위상 순서 |
| BuildPlan.expectedArchive | relative path | overwrite 금지 |
| DeploymentArtifact.status | enum | `READY`, `BLOCKED` |
| DeploymentArtifact.archiveChecksum | SHA-256/null | `READY`일 때 필수 |
| DeploymentArtifact.descriptorFingerprint | SHA-256 | canonical descriptor에서 계산 |
| DeploymentArtifact.validation | ValidationEvidence[] | 모든 필수 check가 `PASSED` |

## CompositionReport

| Field | Type | Validation |
|-------|------|------------|
| status | enum | `READY`, `BLOCKED`, `FAILED`, `NOT_IMPLEMENTED` |
| generatedFiles | relative path[] | workspace 내부 |
| artifact | DeploymentArtifact/null | `READY`일 때만 존재 |
| blockingReasons | object[] | code, field/reference, safe message |
| secretScan | enum | `PASSED`, `FAILED` |

## Relationships

```text
ProtocolHandoff 1 ── 1 CompositionRequest
CompositionRequest 1 ── 1..* ComponentResult
CompositionRequest 1 ── 1 MtaTopology
MtaTopology 1 ── 1 CollisionReport
MtaTopology 1 ── 1 BuildPlan
BuildPlan 1 ── 0..1 DeploymentArtifact
DeploymentArtifact 1 ── 1 CompositionReport
```

## State Transitions

```text
RECEIVED ─ invalid handoff/result/secret → BLOCKED
RECEIVED ─ valid input → PREFLIGHTED
PREFLIGHTED ─ collision/boundary failure → BLOCKED
PREFLIGHTED ─ topology valid → COMPOSED
COMPOSED ─ static validation failure → FAILED
COMPOSED ─ static validation pass → BUILD_PENDING
BUILD_PENDING ─ tool unavailable/build failure → BLOCKED|FAILED
BUILD_PENDING ─ build and checksum pass → READY
```

`DEFINED` lifecycle에서는 executor 진입 전에 항상 `NOT_IMPLEMENTED`로 끝나며 runtime transition을 수행하지 않는다.
