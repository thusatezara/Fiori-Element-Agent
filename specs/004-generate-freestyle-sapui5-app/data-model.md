# Data Model: FreeStyle SAPUI5 애플리케이션 생성

## FreestyleGenerationRequest

| Field | Type | Rules |
|---|---|---|
| `handoff` | Handoff | `selectedType=FREESTYLE`, approved |
| `screens` | `ScreenRequest[]` | 1~5개, unique ID |
| `transitions` | `TransitionRequest[]` | screen ID 참조, 시작 screen에서 도달 가능 |
| `stateFields` | `StateField[]` | OData 또는 UI ownership 명시 |
| `validations` | `ValidationRule[]` | field/screen/operation과 연결 |
| `operations` | `OperationRequest[]` | snapshot에서 확인 필요 |

## ScreenRequest

| Field | Type | Rules |
|---|---|---|
| `id` | string | route와 View 이름으로 변환 가능 |
| `titleKey` | string | i18n key |
| `purpose` | string | 사용자 업무 표현 |
| `controls` | array | approved SAPUI5 control role |
| `requirementIds` | string[] | 비어 있지 않음 |

## TransitionRequest

| Field | Type | Rules |
|---|---|---|
| `from` | screen ID | 존재해야 함 |
| `to` | screen ID | 존재해야 함 |
| `trigger` | string | user action 또는 success/error |
| `condition` | string? | 승인된 업무 조건 |
| `preserveState` | string[] | StateField 참조 |
| `backBehavior` | enum | `NONE`, `HISTORY`, `EXPLICIT` |

## StateField

| Field | Type | Rules |
|---|---|---|
| `name` | string | unique |
| `type` | string | EDM type 또는 JSON primitive |
| `owner` | enum | `ODATA`, `UI_STATE` |
| `initialValue` | scalar/null | secret 금지 |
| `lifetime` | enum | `SCREEN`, `FLOW`, `SESSION` |

## ValidationRule

| Field | Type | Rules |
|---|---|---|
| `id` | string | unique |
| `kind` | enum | `INPUT`, `TRANSPORT`, `BUSINESS` |
| `target` | string | field 또는 operation |
| `messageKey` | string | i18n에 존재 |
| `recovery` | enum | `EDIT`, `RETRY`, `CANCEL`, `BACK` |

## FreestyleGenerationResult

002의 file/check/trace model을 재사용하며 다음 check를 필수로 추가한다.

- `ROUTE_GRAPH_VALID`
- `ALL_SCREENS_REACHABLE`
- `STATE_OWNERSHIP_VALID`
- `BACKEND_BOUNDARY_VALID`
- `NO_UI_ANNOTATION_DEPENDENCY`
- `ERROR_RECOVERY_COVERED`

## State Transitions

```text
RECEIVED → FLOW_PLANNED → REVIEWED → APPROVED → STAGED → VALIDATED
             ├─────────→ RECLASSIFY
             └─────────→ BLOCKED
```

- route graph cycle은 명시적 back/retry flow가 아니면 거부한다.
- backend operation이 확인되지 않으면 해당 handler를 생성하지 않는다.
- 모든 screen, transition, state와 validation은 requirement에 추적되어야 한다.
