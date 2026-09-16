# Data Model: BTP 솔루션 요청 orchestration 기반

이 model은 DB schema가 아니라 한 번의 solution planning 실행에서 생성되는 runtime object다.

## SolutionRequest

| Field | Type | Rules |
|---|---|---|
| requestId | UUID string | 한 실행에서 unique |
| originalText | string | 비어 있지 않고 원문 보존 |
| scopes | Scope[] | 중복 없는 판정 결과 |
| evidence | object[] | scope와 원문 표현 연결 |
| backend | BackendIntent | CAP persistence 선택과 출처; BACKEND가 아니면 nullable intent |
| requestedTargets | object | `cloudFoundry`, `workZone` optional |
| externalChangeIntent | boolean | deploy/publish의 명시적 요청 여부 |
| createdAt | ISO datetime | UTC |

## Scope

`FRONTEND`, `BACKEND`, `PACKAGE`, `DEPLOY_CF`, `PUBLISH_WORK_ZONE` 중 하나다.

## BackendIntent

| Field | Type | Rules |
|---|---|---|
| persistence | enum/null | `SQLITE`, `HANA`; BACKEND scope에서는 실행 전에 필수 |
| source | enum | `REQUEST_TEXT`, `STRUCTURED_INPUT`, `UNSPECIFIED` |

`persistence=null`은 default SQLite를 뜻하지 않는다. Backend step은 사용자에게 선택을 확인할 때까지 `NEEDS_INPUT`이다.

## ProtocolDescriptor

| Field | Type | Rules |
|---|---|---|
| id | string | `000`, `001`, `100`, `200`, `300`, `400` |
| version | string | semantic contract version |
| scope | Scope | 000을 제외한 실행 scope |
| status | enum | `IMPLEMENTED`, `DEFINED`, `DISABLED` |
| riskLevel | enum | `LOCAL_WRITE`, `EXTERNAL_CHANGE` |
| requires | string[] | 필요한 capability |
| produces | string[] | 생성 capability |
| specPath | string | workspace-relative 중앙 Spec path |
| executor | function/null | `IMPLEMENTED`일 때만 존재 |

## SolutionStep

| Field | Type | Rules |
|---|---|---|
| id | string | plan 안에서 unique |
| scope | Scope | step의 목적 |
| protocol | object | ID, version, status |
| dependsOn | string[] | 같은 plan의 기존 step ID |
| approval | enum | `NONE`, `LOCAL_WRITE`, `EXTERNAL_CHANGE` |
| readiness | enum | `READY`, `NEEDS_INPUT`, `NOT_IMPLEMENTED`, `BLOCKED` |
| blockingReasons | string[] | READY가 아니면 1개 이상 |
| validationCriteria | string[] | 관찰 가능한 완료 조건 |

## LandscapeTarget

### CloudFoundryTarget

| Field | Type | Rules |
|---|---|---|
| api | HTTPS URL/null | credential과 query secret 금지 |
| org | string/null | 외부 변경 전에 필수 |
| space | string/null | 외부 변경 전에 필수 |
| stage | enum/null | `DEV`, `TEST`, `PROD` |

### WorkZoneTarget

| Field | Type | Rules |
|---|---|---|
| edition | enum/null | `STANDARD`, `ADVANCED` |
| subaccount | string/null | credential이 아닌 식별자 |
| site | string/null | 게시 대상 site |
| contentTarget | string/null | catalog/space/page/content provider target |

## SolutionPlan

| Field | Type | Rules |
|---|---|---|
| planVersion | string | `1.0` |
| planId | UUID string | 한 planning 실행의 unique ID |
| request | SolutionRequest | 정규화된 입력 |
| steps | SolutionStep[] | dependency 순서 |
| status | enum | `READY`, `NEEDS_INPUT`, `PARTIALLY_IMPLEMENTED`, `BLOCKED` |
| assumptions | string[] | 안전한 기본값만 포함 |
| exclusions | string[] | 실행하지 않는 범위 |
| createdAt | ISO datetime | UTC |

## ProtocolHandoff

| Field | Type | Rules |
|---|---|---|
| handoffVersion | string | `1.0` |
| handoffId | UUID string | 한 handoff 실행의 unique ID |
| planId | UUID string | 상위 `SolutionPlan` 참조 |
| stepId | string | 실행할 `SolutionStep` ID |
| protocol | object | step의 protocol ID와 version과 일치 |
| request | SolutionRequest | credential이 제거된 정규화 요청 |
| inputs | object | 하위 executor 입력, credential 저장 금지 |
| target | object/null | credential 없는 실행 대상 참조 |
| completedDependencies | string[] | 현재 step의 선행 step 중 완료가 확인된 ID |
| requestedAt | ISO datetime | UTC |

## State Transition

```text
RECEIVED
  → CLASSIFIED
  → PLANNED
  ├── missing DB/target/input → NEEDS_INPUT
  ├── executor absent      → PARTIALLY_IMPLEMENTED
  ├── contract error       → BLOCKED
  └── all steps ready      → READY
```
