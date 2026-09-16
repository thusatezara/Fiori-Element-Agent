# Data Model: CAP Backend 애플리케이션 생성

이 문서는 generator contract의 runtime object를 정의한다. 생성 대상 업무 entity의 실제 schema는 각 `CAPGenerationRequest`에 포함되며 core protocol에 고정하지 않는다.

## CAPGenerationRequest

| Field | Type | Rules |
|---|---|---|
| `handoffVersion` | string | `1.0` |
| `handoffId` | UUID | 한 handoff 실행의 unique ID |
| `planId` | UUID | 상위 `SolutionPlan` 참조 |
| `stepId` | string | `BACKEND` solution step와 일치 |
| `protocol` | object | `id=100`, registry version `1.0` |
| `request` | object | 000의 credential 없는 normalized request |
| `inputs` | `CAPInputs` | 승인된 Backend 생성 입력 |
| `target` | null | protocol 100은 external target을 받지 않음 |
| `completedDependencies` | string[] | step dependency의 완료 ID만 허용 |
| `requestedAt` | ISO datetime | 000이 handoff를 발행한 시각 |

## CAPInputs

| Field | Type | Rules |
|---|---|---|
| `requirements` | `RequirementRef[]` | 1개 이상, stable ID unique |
| `project` | `ProjectIntent` | output과 runtime 결정 |
| `domain` | `DomainContract` | entity 1개 이상 |
| `services` | `ServiceContract[]` | service 1개 이상 |
| `behaviors` | `BehaviorRule[]` | optional |
| `seedData` | object/null | 명시적으로 제공된 synthetic fixture만 허용 |

## ProjectIntent

| Field | Type | Rules |
|---|---|---|
| `name` | string | filesystem-safe, path separator 금지 |
| `namespace` | string | dot-separated CDS identifier |
| `outputParent` | string | workspace-relative, boundary 안에 resolve |
| `runtime` | enum | 최초 구현은 `NODEJS` |
| `persistence` | enum | 필수 명시값 `SQLITE`, `HANA`; 누락 시 default 없이 거부 |
| `odataVersion` | enum | `V4` |

`SQLITE`는 in-memory local/demo DB를 생성한다. `HANA`는 local 검증용 development SQLite profile과 durable deployment를 위한 production HANA profile을 생성하지만, 실제 HANA instance/binding은 200/300에 위임한다.

## RequirementRef

| Field | Type | Rules |
|---|---|---|
| `id` | string | request 안에서 unique |
| `text` | string | 원문 의미 보존, 비어 있지 않음 |
| `kind` | enum | `DOMAIN`, `SERVICE`, `BEHAVIOR`, `AUTHORIZATION`, `NON_FUNCTIONAL` |

## DomainEntity

| Field | Type | Rules |
|---|---|---|
| `id` | string | stable contract ID |
| `name` | string | namespace 안에서 unique CDS identifier |
| `aspects` | enum[] | `CUID`, `MANAGED`; semantics가 승인된 경우만 |
| `elements` | `DomainElement[]` | 1개 이상 |
| `relationships` | `Relationship[]` | optional |
| `requirementIds` | string[] | 모든 ID가 RequirementRef에 존재 |

## DomainElement

| Field | Type | Rules |
|---|---|---|
| `name` | string | entity 안에서 unique |
| `type` | enum | `UUID`, `STRING`, `INTEGER`, `DECIMAL`, `BOOLEAN`, `DATE`, `TIMESTAMP`, `LARGE_STRING` |
| `key` | boolean | entity마다 직접 key 또는 `CUID`가 반드시 존재 |
| `nullable` | boolean | business requirement와 일치 |
| `length` | integer/null | `STRING`일 때 1 이상 |
| `precision`, `scale` | integer/null | `DECIMAL`에서 `precision > scale >= 0` |
| `default` | scalar/null | type과 호환되는 safe literal만 허용 |
| `requirementIds` | string[] | 1개 이상 |

## Relationship

| Field | Type | Rules |
|---|---|---|
| `name` | string | source entity 안에서 unique |
| `targetEntityId` | string | 같은 DomainContract에 존재 |
| `kind` | enum | `ASSOCIATION`, `COMPOSITION` |
| `cardinality` | enum | `TO_ONE`, `TO_MANY` |
| `nullable` | boolean | to-one constraint에 사용 |
| `on` | object/null | unmanaged 관계일 때 명시 |
| `requirementIds` | string[] | lifecycle/cardinality 근거 포함 |

## ServiceContract

| Field | Type | Rules |
|---|---|---|
| `id` | string | request 안에서 unique |
| `name` | string | unique service identifier |
| `path` | string | `/`로 시작하는 stable relative path |
| `entities` | `ServiceEntity[]` | 1개 이상 |
| `operations` | `ServiceOperation[]` | optional |
| `authorization` | `AuthorizationIntent[]` | optional; 미결정이면 request 자체를 차단 |
| `requirementIds` | string[] | 1개 이상 |

## ServiceEntity

| Field | Type | Rules |
|---|---|---|
| `name` | string | service 안에서 unique |
| `sourceEntityId` | string | DomainEntity 참조 |
| `exposedElements` | string[] | source에 존재, unique, key 포함 |
| `capabilities` | enum[] | `READ`, `CREATE`, `UPDATE`, `DELETE` allowlist |
| `authorization` | `AuthorizationIntent[]` | optional |
| `requirementIds` | string[] | 1개 이상 |

## ServiceOperation

| Field | Type | Rules |
|---|---|---|
| `name` | string | service 안에서 unique |
| `kind` | enum | `ACTION`, `FUNCTION` |
| `boundTo` | string/null | ServiceEntity name 또는 unbound |
| `parameters` | object[] | name/type/nullability 명시 |
| `returns` | object/null | return type 명시 |
| `sideEffect` | boolean | function은 false |
| `destructive` | boolean | true이면 confirmed intent와 rule 필수 |
| `requirementIds` | string[] | 1개 이상 |

## BehaviorRule

| Field | Type | Rules |
|---|---|---|
| `id` | string | unique |
| `kind` | enum | `VALIDATION`, `ACTION`, `TRANSACTION` |
| `serviceId` | string | ServiceContract 참조 |
| `target` | string | entity 또는 operation name |
| `events` | enum[] | `CREATE`, `READ`, `UPDATE`, `DELETE`, `ACTION` |
| `condition` | structured object | executable allowlist 표현; free-form code 금지 |
| `error` | object/null | stable code와 non-secret message |
| `atomic` | boolean | transaction rule이면 true |
| `requirementIds` | string[] | 1개 이상 |

## AuthorizationIntent

| Field | Type | Rules |
|---|---|---|
| `grant` | enum[] | `READ`, `CREATE`, `UPDATE`, `DELETE`, operation name |
| `roles` | string[] | 1개 이상, credential/assignment 아님 |
| `where` | structured object/null | row restriction가 승인된 경우만 |
| `requirementIds` | string[] | 1개 이상 |

## ServiceSnapshot

| Field | Type | Rules |
|---|---|---|
| `snapshotVersion` | string | `1.0` |
| `odataVersion` | string | `4.0` |
| `serviceName` | string | compiled service와 일치 |
| `serviceUrlHint` | string | relative path, credential/query 금지 |
| `entitySets` | object[] | public name, key, property, navigation, capability |
| `operations` | object[] | public action/function signature |
| `metadataPath` | string | project-relative artifact path |
| `modelDigest` | string | compiled public model integrity 확인 |

## CAPGenerationResult

| Field | Type | Rules |
|---|---|---|
| `resultVersion` | string | `1.0` |
| `status` | enum | `BLOCKED`, `GENERATED`, `VALIDATED`, `FAILED` |
| `handoffId` | UUID | request 참조 |
| `projectPath` | string/null | `VALIDATED`일 때만 final path |
| `files` | `GeneratedFile[]` | relative path와 requirement ID |
| `checks` | `ValidationCheck[]` | 필수 check 전체 포함 |
| `trace` | `TraceEntry[]` | 모든 requirement ID exactly once 이상 |
| `serviceSnapshots` | object[] | `VALIDATED`일 때만 제공 |
| `assumptions` | string[] | 적용한 safe default |
| `prerequisites` | object[] | unresolved/production validation |
| `risks` | string[] | consumer가 알아야 할 제한 |

## State Transitions

```text
RECEIVED
  ├── invalid handoff / secret / unsafe path → BLOCKED
  └── valid request → PLANNED → STAGED → GENERATED
                                      ├── required check fail → FAILED
                                      └── all required checks pass → VALIDATED
```

- `BLOCKED`, `FAILED`에서는 final output과 completed service snapshot을 제공하지 않는다.
- `GENERATED`는 staging 내부 중간 상태이며 외부 완료 결과로 반환하지 않는다.
- descriptor `DEFINED → IMPLEMENTED` 전환은 모든 mandatory task와 protocol validation이 완료된 별도 registry 변경이다.
