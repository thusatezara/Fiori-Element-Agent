# Data Model: Fiori 애플리케이션 요청 유형 판정

이 문서의 model은 DB schema가 아니라 실행 중 생성·검증되는 domain object다.

## AppRequest

| Field | Type | Rules |
|---|---|---|
| `requestId` | UUID string | run 안에서 unique |
| `originalText` | string | 비어 있지 않으며 원문 보존 |
| `requirements` | `Requirement[]` | 각 항목에 stable ID 부여 |
| `answers` | `Answer[]` | 질문 ID와 연결 |
| `appIdentity` | object? | title, application ID, namespace, output name |
| `createdAt` | ISO datetime | UTC |

## Requirement

| Field | Type | Rules |
|---|---|---|
| `id` | string | `REQ-###` 형식 |
| `text` | string | 사용자 표현 유지 |
| `source` | enum | `ORIGINAL`, `ANSWER`, `SERVICE` |
| `category` | enum? | `FLOW`, `LAYOUT`, `INTERACTION`, `DATA`, `ENVIRONMENT`, `OTHER` |

## ServiceSnapshot

| Field | Type | Rules |
|---|---|---|
| `snapshotVersion` | string | contract version |
| `sourceKind` | enum | `FILE`, `URL` |
| `sourceDisplay` | string | credential과 query secret 제거 |
| `serviceRoot` | string/null | URL source의 HTTPS service root, file source에서는 null |
| `metadataSha256` | string | 원본 EDMX 무결성 |
| `odataVersion` | string | MVP에서는 `4.0`만 허용 |
| `schemas` | `Schema[]` | namespace별 정규화 |
| `entitySets` | `EntitySet[]` | target EntityType 참조 |
| `entityTypes` | `EntityType[]` | key, property, navigation 포함 |
| `operations` | `Operation[]` | action/function과 binding 정보 |
| `capabilities` | `CapabilityFact[]` | 확인 근거와 confidence 포함 |
| `warnings` | string[] | 해석하지 못한 요소 |

## Assessment

| Field | Type | Rules |
|---|---|---|
| `assessmentId` | UUID string | unique |
| `status` | enum | `UNDECIDED`, `RECOMMENDED`, `APPROVED` |
| `recommendedType` | enum/null | `STANDARD`, `CUSTOM`, `FREESTYLE` 또는 null |
| `evidence` | `Evidence[]` | rule과 requirement/service fact 연결 |
| `conflicts` | `Conflict[]` | 상충 신호와 해소 질문 |
| `questions` | `Question[]` | 미응답 필수 질문만 포함 |
| `prerequisites` | `Prerequisite[]` | 앱 유형과 별도 관리 |
| `trace` | `TraceEntry[]` | 모든 requirement 분류 |

## Handoff

| Field | Type | Rules |
|---|---|---|
| `handoffVersion` | string | `1.0` |
| `assessmentId` | UUID string | 승인된 Assessment 참조 |
| `selectedType` | enum | 정확히 하나의 생성 유형 |
| `request` | AppRequest | 원문과 답변 포함 |
| `serviceSnapshotPath` | relative path | run root 내부 path |
| `prerequisites` | array | 미해결이면 generator가 차단 가능 |
| `outputIntent` | object | parent directory와 새 project name |
| `approvedAt` | ISO datetime | 명시적 승인 시점 |

## State Transitions

```text
RECEIVED
  → SERVICE_INSPECTED
  → UNDECIDED ──answer──┐
       ↑                │
       └────────────────┘
  → RECOMMENDED
  → APPROVED
  → HANDED_OFF
```

- `UNDECIDED`에서는 handoff를 만들 수 없다.
- recommendation 변경 시 이전 approval은 무효화한다.
- unresolved blocking prerequisite가 있으면 `APPROVED`여도 generator는 시작하지 않는다.
- trace에서 어떤 requirement도 누락될 수 없다.
