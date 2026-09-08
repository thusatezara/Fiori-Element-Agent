# Tasks: FreeStyle SAPUI5 애플리케이션 생성

**Input**: `specs/004-generate-freestyle-sapui5-app/`의 설계 문서

**Tests**: route/state/error/backend boundary와 QUnit/OPA5/UI5 build를 test-first로 검증한다.

## Phase 1: Setup

- [ ] T001 FreeStyle generator 디렉터리를 `src/generation/freestyle/`과 `templates/freestyle/`에 생성
- [ ] T002 [P] FreeStyle handoff/config fixture를 `tests/fixtures/handoffs/freestyle-*.json`과 `tests/fixtures/generation/freestyle-*.json`에 추가
- [ ] T003 [P] generated QUnit/OPA5 runner dependency와 scripts를 `package.json`에 추가

## Phase 2: Foundational

- [ ] T004 002 공통 generation pipeline을 FreeStyle에서 사용할 adapter를 `src/generation/freestyle/generation-context.ts`에 구현
- [ ] T005 [P] FreeStyle request/result runtime schema를 `src/generation/freestyle/contracts.ts`에 구현
- [ ] T006 [P] screen reachability, transition와 cycle validator를 `src/validation/route-graph.ts`에 구현
- [ ] T007 [P] OData/UI state ownership과 lifetime validator를 `src/validation/state-model.ts`에 구현
- [ ] T008 UI annotation term 사용을 탐지하는 generated-source validator를 `src/validation/no-ui-annotation.ts`에 구현

**Checkpoint**: FreeStyle flow contract와 annotation 비의존 검증 기반이 준비된다.

## Phase 3: User Story 1 - 화면 전환과 상태를 직접 제어하는 업무 흐름 생성 (P1) 🎯 MVP

**Goal**: 다단계 screen, conditional navigation과 state preservation을 가진 SAPUI5 앱을 생성한다.

**Independent Test**: `FREE-WIZARD-01` fixture가 모든 screen이 도달 가능하고 이전 이동에서 값을 보존하는 build 가능한 project를 생성한다.

- [ ] T009 [P] [US1] FreeStyle request/result JSON Schema contract test를 `tests/contract/freestyle-generation.test.ts`에 작성
- [ ] T010 [P] [US1] route graph planning test를 `tests/unit/freestyle/flow-planner.test.ts`에 작성
- [ ] T011 [P] [US1] OData/UI state separation test를 `tests/unit/freestyle/state-planner.test.ts`에 작성
- [ ] T012 [US1] screen/transition graph와 back behavior plan을 `src/generation/freestyle/flow-planner.ts`에 구현
- [ ] T013 [US1] JSONModel/OData state ownership plan을 `src/generation/freestyle/state-planner.ts`에 구현
- [ ] T014 [P] [US1] package/UI5 config template을 `templates/freestyle/package.json.hbs`, `templates/freestyle/ui5.yaml.hbs`, `templates/freestyle/ui5-mock.yaml.hbs`에 작성
- [ ] T015 [P] [US1] Component/manifest/model/i18n template을 `templates/freestyle/webapp/Component.js.hbs`, `templates/freestyle/webapp/manifest.json.hbs`, `templates/freestyle/webapp/model/models.js.hbs`, `templates/freestyle/webapp/i18n/i18n.properties.hbs`에 작성
- [ ] T016 [P] [US1] 반복 가능한 XML View와 controller template을 `templates/freestyle/webapp/view/View.view.xml.hbs`, `templates/freestyle/webapp/controller/View.controller.js.hbs`에 작성
- [ ] T017 [US1] flow/state 기반 project generation을 `src/generation/freestyle/generator.ts`에 구현
- [ ] T018 [US1] `generate freestyle` command를 `src/cli/commands/generate-freestyle.ts`와 `src/cli/index.ts`에 연결
- [ ] T019 [US1] wizard navigation/state integration test를 `tests/integration/freestyle-generator.test.ts`에 작성하고 통과

**Checkpoint**: OData V4 data와 client state를 분리한 다단계 앱을 생성할 수 있다.

## Phase 4: User Story 2 - 입력 검증과 오류 복구가 가능한 업무 흐름 생성 (P2)

**Goal**: input, transport, business error별 안내와 recovery transition을 생성한다.

**Independent Test**: `FREE-ERROR-01` fixture가 edit/retry/cancel recovery를 각각 실행 가능한 handler와 test로 만든다.

- [ ] T020 [P] [US2] validation/recovery mapping test를 `tests/unit/freestyle/validation-planner.test.ts`에 작성
- [ ] T021 [P] [US2] error journey OPA5 expectation을 `tests/integration/freestyle-error-flow.test.ts`에 작성
- [ ] T022 [US2] validation kind, i18n message와 recovery plan을 `src/generation/freestyle/validation-planner.ts`에 구현
- [ ] T023 [P] [US2] generated controller error handler template을 `templates/freestyle/webapp/controller/ErrorHandlers.js.hbs`에 작성
- [ ] T024 [P] [US2] generated QUnit/OPA5 test template을 `templates/freestyle/webapp/test/unit/Controller.qunit.js.hbs`와 `templates/freestyle/webapp/test/integration/FlowJourney.js.hbs`에 작성
- [ ] T025 [US2] error handler와 recovery route 생성을 `src/generation/freestyle/generator.ts`에 통합하고 tests 통과

**Checkpoint**: 오류 복구 Story를 prepared handoff로 독립 생성·검증할 수 있다.

## Phase 5: User Story 3 - FreeStyle 범위와 생성 안전성 확인 (P3)

**Goal**: 더 표준적인 유형, UI annotation 의존, backend 책임과 미승인 생성을 차단한다.

**Independent Test**: 네 guard fixture가 reclassification/prerequisite/approval 결과를 반환하고 project를 생성하지 않는다.

- [ ] T026 [P] [US3] reclassification/backend/approval contract test를 `tests/contract/freestyle-guard.test.ts`에 작성
- [ ] T027 [US3] Standard/Custom 재판정 logic을 `src/generation/freestyle/flow-planner.ts`에 구현
- [ ] T028 [US3] action/transaction/authorization boundary 검사를 `src/generation/freestyle/backend-boundary.ts`에 구현
- [ ] T029 [US3] UI annotation 비의존 validation을 `src/validation/no-ui-annotation.ts`와 `src/generation/freestyle/generator.ts`에 연결
- [ ] T030 [US3] approval 및 existing output preflight를 `src/cli/commands/generate-freestyle.ts`에 구현
- [ ] T031 [US3] no-write safety integration test를 `tests/integration/freestyle-no-write.test.ts`에 작성하고 통과

**Checkpoint**: FreeStyle이 표준 기능 또는 backend 책임을 우회하지 않는다.

## Phase 6: Polish & Cross-Cutting

- [ ] T032 [P] FR-001~FR-023 trace matrix를 `specs/004-generate-freestyle-sapui5-app/traceability.md`에 작성
- [ ] T033 generated FreeStyle QUnit/OPA5 fixture를 `tests/fixtures/generated/freestyle/webapp/test/`에 추가
- [ ] T034 FreeStyle project QUnit/OPA5/UI5 build test를 `tests/integration/freestyle-build.test.ts`에 작성하고 통과
- [ ] T035 [P] accessibility labels, i18n와 async module static checks를 `src/validation/ui5-quality.ts`에 추가
- [ ] T036 `specs/004-generate-freestyle-sapui5-app/quickstart.md`를 실행하고 결과를 `specs/004-generate-freestyle-sapui5-app/validation.md`에 기록

## Dependencies & Execution Order

- 001 완료와 002 공통 generation pipeline이 선행 조건이다.
- Feature 내부에서는 Phase 1~2 후 US1/US2/US3를 fixture로 독립 구현할 수 있다.
- delivery 순서는 US1 → US2 → US3를 권장한다.

## Parallel Opportunities

- route/state validators, contract tests와 templates는 파일이 달라 병렬 가능하다.
- US2와 US3는 US1 generator shell이 준비된 뒤 병렬 진행할 수 있다.

## Implementation Strategy

1. Phase 1~2 완료
2. US1로 다단계 navigation/state MVP 생성
3. US2로 오류 복구 흐름 추가
4. US3와 QUnit/OPA5/UI5 build 검증 완료
