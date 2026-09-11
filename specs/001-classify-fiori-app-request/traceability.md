# Traceability: Fiori 애플리케이션 요청 분석·판정·생성

FR inventory: FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007, FR-008, FR-009, FR-010, FR-011, FR-012, FR-013, FR-014, FR-015, FR-016, FR-017, FR-018, FR-019, FR-020, FR-021, FR-022, FR-023, FR-024, FR-025, FR-026, FR-027, FR-028, FR-029, FR-030, FR-031, FR-032, FR-033, FR-034, FR-035, FR-036

| Requirement group | User story | Plan area | Tasks | Primary artifacts |
|---|---|---|---|---|
| FR-001~FR-009 | US1 | request normalization, OData inspection | T007~T028 | AppRequest, ServiceSnapshot, service-snapshot.json |
| FR-010~FR-019 | US2 | question catalog, deterministic classification | T029~T038 | Assessment, assessment.json |
| FR-020~FR-023 | US3 | GenerationInput, user request and safety gates | T004~T008 | generation-input.schema.json, generation report |
| FR-024~FR-029 | US4 | one-generator routing and handoff | T048~T055 | Handoff, child-result.json |
| FR-030~FR-036 | US4, cross-cutting | validation, result aggregation and security | T056~T063 | validation.json, orchestration-result.json |

## Routing trace

| Assessment selectedType | target Feature | Generator responsibility |
|---|---|---|
| STANDARD | 002 | Standard Fiori elements application |
| CUSTOM | 003 | Custom Fiori elements application |
| FREESTYLE | 004 | Freestyle SAPUI5 application |

## Artifact trace

| Artifact | Source | Consumer |
|---|---|---|
| request.json | User message and normalized input | 001 orchestrator |
| service-snapshot.json | OData metadata | 001 classifier and child generator |
| assessment.json | 001 classification rules | GenerationInput builder |
| generation-input.json | assessment, service summary and safe defaults | handoff router |
| handoff.json | GenerationInput | exactly one of 002, 003, 004 |
| child-result.json | selected child generator | result aggregator |
| validation.json | generated project checks | orchestration result |
