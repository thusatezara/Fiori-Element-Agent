# Data Model: Custom Fiori Elements 애플리케이션 생성

## CustomGenerationRequest

| Field | Type | Rules |
|---|---|---|
| `handoff` | Handoff | `selectedType=CUSTOM`, approved |
| `rootContextPath` | string | service snapshot에서 resolve 가능 |
| `regions` | `ScreenRegionRequest[]` | 1~10개, stable ID |
| `navigation` | array | 시작 View에서 도달 가능 |
| `directInteractions` | array | 선택 사항, 명시적 승인 필요 |

## ScreenRegionRequest

| Field | Type | Rules |
|---|---|---|
| `id` | string | XML stable ID로 변환 가능 |
| `purpose` | string | 사용자 업무 표현 |
| `kind` | enum | `FILTER`, `TABLE`, `FORM`, `CONTENT`, `DIRECT` |
| `contextPath` | string | snapshot에 존재 |
| `annotationPath` | string? | Building Block일 때 resolve 필요 |
| `requirementIds` | string[] | 비어 있지 않음 |

## CustomDecision

| Field | Type | Rules |
|---|---|---|
| `targetKind` | constant | `FPM_CUSTOM_PAGE` |
| `viewName` | string | application namespace 하위 |
| `regions` | `RegionDecision[]` | `BUILDING_BLOCK` 또는 `DIRECT` |
| `reclassification` | enum/null | `STANDARD`, `FREESTYLE`, null |
| `prerequisites` | array | unresolved annotation/action 포함 |
| `evidence` | array | requirement와 결정 연결 |

## DirectRegionDecision

| Field | Type | Rules |
|---|---|---|
| `regionId` | string | ScreenRegionRequest 참조 |
| `reason` | string | Building Block 대안 검토 포함 |
| `viewResponsibility` | string | 표시와 event boundary |
| `controllerResponsibility` | string | 승인된 handler만 포함 |
| `stateOwnership` | enum | `NONE`, `PAGE_LOCAL`, `APP_SHARED` |
| `validation` | string[] | interaction 검증 조건 |

## CustomGenerationResult

002의 `GeneratedFile`, `ValidationCheck`, `TraceEntry`를 재사용하며 다음 check를 필수로 추가한다.

- `CUSTOM_TARGET_IS_ENTRY`
- `NO_LIST_REPORT_PREREQUISITE`
- `VIEW_NAME_RESOLVES`
- `BUILDING_BLOCK_PATHS_RESOLVE`
- `DIRECT_REGION_BOUNDARIES_RECORDED`

## State Transitions

```text
RECEIVED → REGION_PLANNED → REVIEWED → APPROVED → STAGED → VALIDATED
             ├───────────→ RECLASSIFY
             └───────────→ BLOCKED
```

- reclassification 또는 blocking prerequisite이면 staging을 만들지 않는다.
- 모든 region은 Building Block, direct region, prerequisite 또는 out-of-scope로 추적되어야 한다.
