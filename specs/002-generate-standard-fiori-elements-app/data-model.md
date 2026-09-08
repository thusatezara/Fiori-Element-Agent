# Data Model: Standard Fiori Elements 애플리케이션 생성

## StandardGenerationRequest

| Field | Type | Rules |
|---|---|---|
| `handoff` | Handoff | `selectedType=STANDARD`, version `1.0`, approved |
| `rootEntitySet` | string | service snapshot에 존재 |
| `navigationEntitySet` | string? | association으로 연결 가능해야 함 |
| `usageProfile` | object | device, expected result size, column density, navigation pattern |
| `editIntent` | enum | `READ_ONLY`, `OBJECT_PAGE`, `INLINE` |
| `extensionRequest` | object? | allowlist type과 requirement ID 포함 |

## StandardDecision

| Field | Type | Rules |
|---|---|---|
| `tableType` | enum | `GRID`, `RESPONSIVE` |
| `objectPage` | boolean | 상세 또는 standard edit에 필요 |
| `editMode` | enum | `NONE`, `OBJECT_PAGE`, `INLINE` |
| `annotationSources` | array | remote/local source 구분 |
| `extensionDecision` | object | `NONE`, `APPROVED`, `RECLASSIFY` |
| `evidence` | array | 각 결정과 requirement/capability 연결 |
| `prerequisites` | array | blocking condition 포함 |

## AnnotationPlan

| Field | Type | Rules |
|---|---|---|
| `entityType` | qualified name | snapshot에 존재 |
| `selectionFields` | property path[] | primitive/filterable property만 허용 |
| `lineItems` | property path[] | 존재하고 표시 가능한 property |
| `headerInfo` | object | title property 필수 |
| `facets` | array | Object Page가 있을 때만 필요 |
| `source` | enum | `SERVICE`, `LOCAL_GENERATED` |

## GeneratedFile

| Field | Type | Rules |
|---|---|---|
| `relativePath` | string | project root escape 금지 |
| `sha256` | string | 검증 후 기록 |
| `requirementIds` | string[] | 최소 한 개 또는 shared infrastructure 표시 |
| `kind` | enum | `CONFIG`, `DESCRIPTOR`, `ANNOTATION`, `SOURCE`, `TEST` |

## GenerationResult

| Field | Type | Rules |
|---|---|---|
| `status` | enum | `BLOCKED`, `GENERATED`, `VALIDATED`, `FAILED` |
| `projectPath` | absolute path? | output root 안 |
| `decision` | StandardDecision | immutable |
| `files` | GeneratedFile[] | 생성 manifest |
| `checks` | ValidationCheck[] | descriptor, XML, preview, build |
| `trace` | TraceEntry[] | 모든 requirement disposition |

## State Transitions

```text
RECEIVED → DECIDED → REVIEWED → APPROVED
APPROVED → STAGED → GENERATED → VALIDATED
                     └────────→ FAILED
RECEIVED/DECIDED → BLOCKED 또는 RECLASSIFY
```

- `APPROVED` 전에는 staging directory를 만들지 않는다.
- blocking prerequisite 또는 reclassification이면 project 생성이 없다.
- validation 실패 시 staging 결과를 완료 project로 rename하지 않는다.
