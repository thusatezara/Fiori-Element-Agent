# Tasks: Freestyle SAPUI5 애플리케이션 생성

`001`이 승인한 `FREESTYLE` handoff를 받아 XML View, controller, OData model과 client state를 가진 SAPUI5 application을 생성한다.

## Phase 1: Source and common pipeline

- [x] T001 `src/generation/freestyle/`와 `templates/freestyle/` source boundary를 생성한다.
- [x] T002 001의 공통 contract, template renderer, report와 atomic output을 재사용한다.
- [x] T003 Freestyle OData V4 prerequisite와 generated project static validation을 연결한다.

## Phase 2: Freestyle planning

- [x] T004 screen/transition graph와 back behavior를 `src/generation/freestyle/flow-planner.mjs`에 구현한다.
- [x] T005 OData data와 client UI state ownership을 `src/generation/freestyle/state-planner.mjs`에 구현한다.
- [x] T006 input/transport/recovery validation plan을 `src/generation/freestyle/validation-planner.mjs`에 구현한다.
- [x] T007 backend rule, authorization와 transaction boundary를 `src/generation/freestyle/backend-boundary.mjs`에 구현한다.
- [x] T008 Freestyle generator를 `src/generation/freestyle/generator.mjs`에 구현한다.

## Phase 3: Template and handoff

- [x] T009 package, UI5 config, Component, manifest, model, XML View, controller, error handler, i18n과 QUnit/flow test template을 `templates/freestyle/`에 작성한다.
- [x] T010 `src/cli/commands/generate-freestyle.mjs` adapter와 001 registry handoff를 연결한다.
- [x] T011 Freestyle 결과가 responsive table, routing, JSONModel state와 annotation 비의존 경계를 갖는지 `tests/generate.test.mjs`에서 검증한다.

## Phase 4: Remaining validation

- [ ] T012 generated QUnit/OPA5 interaction journey와 UI5 runtime build를 추가 검증한다.
- [ ] T013 unsupported backend/authorization/transaction request와 no-write contract test를 추가한다.

## Phase 5: Standard-aligned DynamicPage shell

- [x] T014 `spec.md`, `plan.md`와 generation contract에 FreeStyle 공통 `DynamicPage`·Title·Header·Content 책임을 정의한다.
- [x] T015 main/review XML template과 manifest에 `sap.f.DynamicPage`, `DynamicPageTitle`, `DynamicPageHeader`와 `sap.f` dependency를 생성한다.
- [x] T016 source validation, generated validation script와 generator test에서 page shell 구조를 검증한다.
- [x] T017 검증 예제 `generated/dual-odata-catalog`의 목록·상세 화면을 같은 DynamicPage shell로 갱신한다.

## 완료 기준

- `001 → 004` 단일 handoff로 OData V4 Freestyle SAPUI5 application이 생성된다.
- OData model은 업무 데이터를, `view` JSONModel은 client UI state를 소유한다.
- 화면 layout과 interaction은 XML View/controller로 생성되며 UI annotation에 의존하지 않는다.
- 모든 업무 화면은 `DynamicPage` root와 명시적인 Title·Header·Content aggregation을 가지며 manifest는 `sap.f`를 선언한다.
- T012~T013은 추가 runtime/negative-path 검증이 필요한 후속 작업으로 완료 보고에서 구분한다.
