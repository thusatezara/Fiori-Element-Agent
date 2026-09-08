# Tasks: Custom Fiori Elements 애플리케이션 생성

**Input**: `specs/003-generate-custom-fiori-elements-app/`의 설계 문서

**Tests**: Custom target, Building Block path, direct responsibility와 UI5 build를 test-first로 검증한다.

## Phase 1: Setup

- [ ] T001 Custom generator 디렉터리를 `src/generation/custom/`과 `templates/custom/`에 생성
- [ ] T002 [P] Custom handoff/config fixture를 `tests/fixtures/handoffs/custom-*.json`과 `tests/fixtures/generation/custom-*.json`에 추가
- [ ] T003 [P] Custom-specific Vitest snapshot serializer를 `tests/helpers/custom-project-snapshot.ts`에 추가

## Phase 2: Foundational

- [ ] T004 002의 output transaction/template renderer를 Custom generator에서 사용할 adapter를 `src/generation/custom/generation-context.ts`에 구현
- [ ] T005 [P] Custom request/result runtime schema를 `src/generation/custom/contracts.ts`에 구현
- [ ] T006 [P] XML namespace, stable ID, controllerName과 metaPath validator를 `src/validation/custom-page.ts`에 구현
- [ ] T007 route target과 View file resolution validator를 `src/validation/custom-routing.ts`에 구현

**Checkpoint**: Custom Page의 contract와 static validation 기반이 준비된다.

## Phase 3: User Story 1 - 표준 화면 요소를 조합한 Custom 화면 생성 (P1) 🎯 MVP

**Goal**: 독립 Custom Page에 확인된 Building Blocks를 배치한 build 가능한 앱을 생성한다.

**Independent Test**: `CUS-COMPOSE-01`이 `sap.fe.core.fpm` entry target과 Filter Bar/Table/detail region을 가진 project를 생성한다.

- [ ] T008 [P] [US1] Custom request/result JSON Schema contract test를 `tests/contract/custom-generation.test.ts`에 작성
- [ ] T009 [P] [US1] region과 Building Block mapping test를 `tests/unit/custom/building-block-planner.test.ts`에 작성
- [ ] T010 [US1] 업무 screen region 정규화와 ordering을 `src/generation/custom/region-planner.ts`에 구현
- [ ] T011 [US1] Filter Bar/Table/Form/Page contextPath/metaPath plan을 `src/generation/custom/building-block-planner.ts`에 구현
- [ ] T012 [US1] Custom target와 viewName decision을 `src/generation/custom/decision.ts`에 구현
- [ ] T013 [P] [US1] package/UI5 config template을 `templates/custom/package.json.hbs`, `templates/custom/ui5.yaml.hbs`, `templates/custom/ui5-mock.yaml.hbs`에 작성
- [ ] T014 [P] [US1] Component/manifest/i18n template을 `templates/custom/webapp/Component.js.hbs`, `templates/custom/webapp/manifest.json.hbs`, `templates/custom/webapp/i18n/i18n.properties.hbs`에 작성
- [ ] T015 [P] [US1] Custom Page XML View와 최소 controller template을 `templates/custom/webapp/ext/view/Main.view.xml.hbs`, `templates/custom/webapp/ext/controller/Main.controller.js.hbs`에 작성
- [ ] T016 [P] [US1] 필요한 local annotation template을 `templates/custom/webapp/annotations/annotation.xml.hbs`에 작성
- [ ] T017 [US1] Custom project generation orchestration을 `src/generation/custom/generator.ts`에 구현
- [ ] T018 [US1] `generate custom` command를 `src/cli/commands/generate-custom.ts`와 `src/cli/index.ts`에 연결
- [ ] T019 [US1] Custom entry와 Building Block integration test를 `tests/integration/custom-generator.test.ts`에 작성하고 통과

**Checkpoint**: List Report 없이 독립 Custom Page 앱을 생성할 수 있다.

## Phase 4: User Story 2 - 제한적인 고유 동작을 포함한 Custom 화면 생성 (P2)

**Goal**: 승인된 direct region 하나를 표준 영역과 분리하여 생성한다.

**Independent Test**: `CUS-DIRECT-01`에서 direct Fragment/controller handler와 책임 report가 생성되고 표준 영역은 유지된다.

- [ ] T020 [P] [US2] direct region allowlist/boundary test를 `tests/unit/custom/direct-region-policy.test.ts`에 작성
- [ ] T021 [P] [US2] mixed Building Block/direct region integration test를 `tests/integration/custom-direct-region.test.ts`에 작성
- [ ] T022 [US2] direct interaction 대안·상태·handler policy를 `src/generation/custom/direct-region-policy.ts`에 구현
- [ ] T023 [P] [US2] direct region Fragment template을 `templates/custom/webapp/ext/fragment/DirectRegion.fragment.xml.hbs`에 작성
- [ ] T024 [US2] approved Fragment와 handler 생성을 `src/generation/custom/generator.ts`에 통합
- [ ] T025 [US2] requirement-to-region 책임 trace 검증을 `src/validation/custom-page.ts`에 추가하고 integration test 통과

**Checkpoint**: direct region Story를 prepared Custom handoff로 독립 생성·검증할 수 있다.

## Phase 5: User Story 3 - Custom 범위와 생성 안전성 확인 (P3)

**Goal**: Standard/FreeStyle 재판정, missing metadata와 미승인 요청을 no-write로 차단한다.

**Independent Test**: 네 guard fixture에서 올바른 결과가 나오고 project directory가 생성되지 않는다.

- [ ] T026 [P] [US3] reclassification/backend/approval guard contract test를 `tests/contract/custom-guard.test.ts`에 작성
- [ ] T027 [US3] Standard/FreeStyle reclassification logic을 `src/generation/custom/decision.ts`에 구현
- [ ] T028 [US3] unresolved metaPath/action prerequisite guard를 `src/generation/custom/building-block-planner.ts`에 구현
- [ ] T029 [US3] approval 및 existing output preflight를 `src/cli/commands/generate-custom.ts`에 구현
- [ ] T030 [US3] no-write safety integration test를 `tests/integration/custom-no-write.test.ts`에 작성하고 통과

**Checkpoint**: 잘못된 Custom 생성이 filesystem 변경 전에 차단된다.

## Phase 6: Polish & Cross-Cutting

- [ ] T031 [P] FR-001~FR-022 trace matrix를 `specs/003-generate-custom-fiori-elements-app/traceability.md`에 작성
- [ ] T032 Custom OPA5 entry smoke journey fixture를 `tests/fixtures/generated/custom/webapp/test/integration/CustomJourney.js`에 추가
- [ ] T033 Custom project UI5 build/OPA5 smoke test를 `tests/integration/custom-build.test.ts`에 작성하고 통과
- [ ] T034 `specs/003-generate-custom-fiori-elements-app/quickstart.md`를 실행하고 결과를 `specs/003-generate-custom-fiori-elements-app/validation.md`에 기록

## Dependencies & Execution Order

- 001 완료와 002 공통 generation pipeline(T004~T009)이 선행 조건이다.
- Feature 내부에서는 Phase 1~2 후 US1/US2/US3를 fixture로 독립 구현할 수 있다.
- delivery 순서는 US1 → US2 → US3를 권장한다.

## Parallel Opportunities

- contract/unit tests, manifest/XML templates, validators는 파일이 달라 병렬 가능하다.
- US2와 US3는 US1 generator shell이 준비된 뒤 병렬 진행할 수 있다.

## Implementation Strategy

1. Phase 1~2 완료
2. US1로 Building Blocks 기반 Custom Page MVP 생성
3. US2로 제한적인 direct interaction 추가
4. US3 및 build/OPA5 검증 완료
