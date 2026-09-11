# Tasks: Custom Fiori Elements 애플리케이션 생성

`001`이 승인한 `CUSTOM` handoff를 받아 OData V4 `sap.fe.core.fpm` Custom Page application을 생성한다.

## Phase 1: Source and common pipeline

- [x] T001 `src/generation/custom/`와 `templates/custom/` source boundary를 생성한다.
- [x] T002 001의 공통 contract, template renderer, report와 atomic output을 재사용한다.
- [x] T003 Custom OData V4 prerequisite와 generated project static validation을 연결한다.

## Phase 2: Custom Page planning

- [x] T004 Custom target/view decision을 `src/generation/custom/decision.mjs`에 구현한다.
- [x] T005 화면 영역 ordering과 data context를 `src/generation/custom/region-planner.mjs`에 구현한다.
- [x] T006 Filter Bar/Table/Form Building Block과 `metaPath` mapping을 `src/generation/custom/building-block-planner.mjs`에 구현한다.
- [x] T007 직접 구성 영역의 client-only boundary, 대안과 검증 방법을 `src/generation/custom/direct-region-policy.mjs`에 구현한다.
- [x] T008 Custom Page generator를 `src/generation/custom/generator.mjs`에 구현한다.

## Phase 3: Template and handoff

- [x] T009 package, UI5 config, Component, FPM manifest, Custom Page View, controller, annotation, i18n, validator와 README template을 `templates/custom/`에 작성한다.
- [x] T010 `src/cli/commands/generate-custom.mjs` adapter와 001 registry handoff를 연결한다.
- [x] T011 Custom 결과가 List Report 선행 생성 없이 FPM target과 Building Block View를 갖는지 `tests/generate.test.mjs`에서 검증한다.
- [x] T014 공통 FLP Sandbox template, manifest inbound와 `fiori run` scripts를 Custom generator에 연결한다.
- [x] T015 Custom 생성 결과의 FLP intent 일치와 static validation을 검증한다.

## Phase 4: Remaining validation

- [ ] T012 direct interaction OPA5 journey와 UI5 runtime build를 추가 검증한다.
- [ ] T013 unsupported OData V2와 unresolved metaPath의 no-write contract test를 추가한다.

## 완료 기준

- `001 → 003` 단일 handoff로 OData V4 Custom Page application이 생성된다.
- Standard List Report는 Custom application의 선행 산출물로 생성되지 않는다.
- 표준 화면 요소는 Building Block과 annotation을 우선 사용하고 직접 영역은 client-only boundary를 가진다.
- T012~T013은 추가 runtime/negative-path 검증이 필요한 후속 작업으로 완료 보고에서 구분한다.
