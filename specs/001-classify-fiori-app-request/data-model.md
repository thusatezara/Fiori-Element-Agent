# Data Model: Fiori 애플리케이션 요청 분석·판정·생성

이 문서의 model은 DB schema가 아니라 한 번의 Fiori 생성 실행에서 생성·검증되는 domain object다.

## AppRequest

| Field | Type | Rules |
|---|---|---|
| requestId | UUID string | run 안에서 unique |
| originalText | string | 비어 있지 않으며 원문 보존 |
| serviceSource | object | FILE 또는 URL 중 정확히 하나 |
| entitySet | string/null | URL 또는 답변으로 확인하지 못하면 null |
| fields | string[] | 중복 없이 요청 순서 보존 |
| requirements | Requirement[] | 각 항목에 stable ID 부여 |
| answers | Answer[] | question ID와 연결 |
| appIdentity | object/null | title, application ID, namespace, output name |
| createdAt | ISO datetime | UTC |

## Requirement

| Field | Type | Rules |
|---|---|---|
| id | string | REQ-### 형식 |
| text | string | 사용자 표현 유지 |
| source | enum | ORIGINAL, ANSWER, SERVICE |
| category | enum | FLOW, LAYOUT, INTERACTION, DATA, ENVIRONMENT, OTHER |
| disposition | enum/null | EVIDENCE, PREREQUISITE, ASSUMPTION, OUT_OF_SCOPE |
| targetId | string/null | FR, evidence 또는 생성 항목 연결 |

## ServiceSnapshot

| Field | Type | Rules |
|---|---|---|
| snapshotVersion | string | contract version |
| sourceKind | enum | FILE, URL |
| sourceDisplay | string | credential·query secret 제거 |
| serviceRoot | string/null | URL이면 HTTPS root, FILE이면 null |
| metadataSha256 | lowercase hex string | 실행 전 재확인 |
| odataVersion | string | MVP는 4.0 우선 |
| schemas | Schema[] | namespace별 정규화 |
| entitySets | EntitySet[] | name과 EntityType reference |
| entityTypes | EntityType[] | key, property, navigation 포함 |
| operations | Operation[] | action/function과 binding |
| annotations | AnnotationFact[] | 확인된 UI·Common annotation |
| capabilities | CapabilityFact[] | 근거와 confidence 포함 |
| warnings | string[] | 해석하지 못한 요소 |

## Assessment

| Field | Type | Rules |
|---|---|---|
| assessmentId | UUID string | unique |
| status | enum | UNDECIDED, RECOMMENDED, APPROVED |
| recommendedType | enum/null | STANDARD, CUSTOM, FREESTYLE 또는 null |
| evidence | Evidence[] | user requirement와 service fact 연결 |
| conflicts | Conflict[] | 충돌 source 연결 |
| questions | Question[] | 최대 3개 |
| prerequisites | Prerequisite[] | blocking 여부 포함 |
| trace | Trace[] | 모든 requirement의 disposition |
| alternatives | string[] | 검토한 유형과 선택하지 않은 이유 |

## GenerationInput

| Field | Type | Rules |
|---|---|---|
| protocolVersion | string | 1.0 |
| originalRequest | string | 사용자 요청 보존 |
| serviceSnapshot | ServiceSnapshot summary | metadata hash와 확인된 사실 |
| assessment | Assessment | 001 판정과 selected type 연결 |
| selectedType | enum | STANDARD, CUSTOM, FREESTYLE 하나 |
| requirements | Requirement[] | source와 disposition 보존 |
| screenIntent | object | list, detail, filter, device, layout |
| dataIntent | object | EntitySet, displayFields, filterFields |
| interactionIntent | object | READ_ONLY, EDIT, ACTION, NAVIGATION |
| assumptions | string[] | 사용자 미결정 기본값 |
| exclusions | string[] | backend 변경, 미승인 extension 등 |
| prerequisites | Prerequisite[] | blocking과 해결 조건 |
| validationCriteria | string[] | observable 결과 |
| outputIntent | OutputIntent | 새 project 위치 |
| createdAt | ISO datetime | UTC |

## GenerationReport

| Field | Type | Rules |
|---|---|---|
| generatorVersion | string | runtime version |
| protocol | object | entry 001과 target 002/003/004 |
| service | ServiceSnapshot summary | service root, EntitySet, properties와 metadata hash |
| assessment | Assessment summary | selected type와 판정 이유 |
| files | string[] | 생성된 파일 목록 |
| validation | object | static, lint, build 결과 |

## Handoff

| Field | Type | Rules |
|---|---|---|
| handoffVersion | string | 1.0 |
| selectedType | enum | GenerationInput과 동일 |
| targetFeature | enum | STANDARD는 002, CUSTOM은 003, FREESTYLE은 004 |
| request | AppRequest | 원문과 답변 보존 |
| serviceSnapshot | ServiceSnapshot summary | 하위 protocol에 전달할 service 사실 |
| generationInput | GenerationInput | 요청별 runtime 입력 |
| prerequisites | Prerequisite[] | blocking이 없어야 dispatch |
| outputIntent | OutputIntent | path boundary 검증 |
| requestedAt | ISO datetime | 사용자 생성 요청 시각 |

## HandoffDispatch

| Field | Type | Rules |
|---|---|---|
| selectedType | enum | Handoff와 동일 |
| targetFeature | enum | 002, 003, 004 중 하나 |
| handoffPath | relative path/null | output report 또는 runtime memory reference |
| generatorStarted | boolean | contract·path·prerequisite 이후에만 true |
| childResultPath | relative path/null | child generator 호출 후 |

## OrchestrationResult

| Field | Type | Rules |
|---|---|---|
| runId | UUID string | run 식별자 |
| status | enum | NEEDS_INPUT, BLOCKED, CANCELLED, FAILED, COMPLETED |
| selectedType | enum/null | dispatch 전에는 null일 수 있음 |
| artifacts | object | run artifact relative paths |
| dispatch | HandoffDispatch/null | handoff 전에는 null |
| validation | object | criteria별 passed와 risks |
| errors | Error[] | code, message, retryable |

## RunState

    RECEIVED
      → SERVICE_INSPECTED
      → ASSESSMENT_READY ── missing answer ──→ NEEDS_INPUT
      → GENERATION_INPUT_READY
      → HANDED_OFF
      ── contract/path/prerequisite issue ──→ BLOCKED
      → GENERATING
      → VALIDATING ── validation failure ──→ FAILED
      → COMPLETED

- UNDECIDED, blocking prerequisite, stale metadata 또는 output collision에서는 child generator를 호출하지 않는다.
- metadata hash가 바뀌면 기존 generation input과 handoff를 폐기하고 다시 대조한다.
- generation report는 output과 함께 기록하며 기존 app output을 덮어쓰지 않는다.
