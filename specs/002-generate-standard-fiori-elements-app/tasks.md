# Tasks: Standard Fiori Elements 애플리케이션 생성

**Input**: `specs/002-generate-standard-fiori-elements-app/`의 설계 문서

**Tests**: 생성물의 contract, manifest/XML, mock preview와 UI5 build를 test-first로 검증한다.

## Phase 1: Setup

- [ ] T001 Standard generator 디렉터리를 `src/generation/standard/`과 `templates/standard/`에 생성
- [ ] T002 [P] Handlebars 계열 template renderer dependency와 generated-project 검증 script를 `package.json`에 추가
- [ ] T003 [P] Standard test fixture handoff/config를 `tests/fixtures/handoffs/standard-*.json`과 `tests/fixtures/generation/standard-*.json`에 추가

## Phase 2: Foundational

- [ ] T004 [P] generator input/result runtime contracts를 `src/generation/common/generator-contract.ts`에 구현
- [ ] T005 staging, validation, atomic rename과 rollback을 `src/generation/common/output-transaction.ts`에 구현
- [ ] T006 [P] strict escaping과 binary-safe copy를 `src/generation/common/template-renderer.ts`에 구현
- [ ] T007 [P] file checksum, requirement trace와 check 결과 writer를 `src/generation/common/generation-report.ts`에 구현
- [ ] T008 generated manifest/XML/static path validator를 `src/validation/generated-project.ts`에 구현
- [ ] T009 UI5 build command runner와 timeout/log redaction을 `src/validation/ui5-build.ts`에 구현

**Checkpoint**: 공통 generator transaction이 준비되고 validation 실패 결과는 완료 directory가 되지 않는다.

## Phase 3: User Story 1 - 조회 중심 Standard 앱 생성 (P1) 🎯 MVP

**Goal**: OData V4 EntitySet에 연결된 List Report와 선택적 상세 조회 앱을 생성한다.

**Independent Test**: read-only `STD-GRID-01` 및 `STD-RESP-01` fixture가 각각 기대 table과 시작 target을 가진 build 가능한 project를 만든다.

- [ ] T010 [P] [US1] Standard request/result schema contract test를 `tests/contract/standard-generation.test.ts`에 작성
- [ ] T011 [P] [US1] Grid/Responsive table decision test를 `tests/unit/standard/decision.test.ts`에 작성
- [ ] T012 [P] [US1] annotation plan test를 `tests/unit/standard/annotation-plan.test.ts`에 작성
- [ ] T013 [US1] usage profile과 service fact 기반 decision을 `src/generation/standard/decision.ts`에 구현
- [ ] T014 [US1] existing/local annotation plan 생성을 `src/generation/standard/annotation-plan.ts`에 구현
- [ ] T015 [US1] List Report/Object Page routing plan을 `src/generation/standard/manifest-plan.ts`에 구현
- [ ] T016 [P] [US1] project/package/UI5 config template을 `templates/standard/package.json.hbs`, `templates/standard/ui5.yaml.hbs`, `templates/standard/ui5-mock.yaml.hbs`에 작성
- [ ] T017 [P] [US1] Component/manifest/i18n template을 `templates/standard/webapp/Component.js.hbs`, `templates/standard/webapp/manifest.json.hbs`, `templates/standard/webapp/i18n/i18n.properties.hbs`에 작성
- [ ] T018 [P] [US1] local annotation template을 `templates/standard/webapp/annotations/annotation.xml.hbs`에 작성
- [ ] T019 [US1] read-only project generation orchestration을 `src/generation/standard/generator.ts`에 구현
- [ ] T020 [US1] `generate standard` command를 `src/cli/commands/generate-standard.ts`와 `src/cli/index.ts`에 연결
- [ ] T021 [US1] List Report entry/table/detail integration test를 `tests/integration/standard-generator.test.ts`에 작성하고 통과

**Checkpoint**: 001 approved handoff에서 실제 Standard 조회 앱을 생성할 수 있다.

## Phase 4: User Story 2 - 업무에 맞는 Standard 수정 흐름 생성 (P2)

**Goal**: capability에 맞는 Object Page/inline edit 또는 승인된 제한적 Extension을 생성한다.

**Independent Test**: `STD-INLINE-01`, `STD-EXT-01` fixture가 표준 edit와 Extension 경계를 구분한다.

- [ ] T022 [P] [US2] Object Page/inline capability decision test를 `tests/unit/standard/edit-decision.test.ts`에 작성
- [ ] T023 [P] [US2] Extension allowlist와 reclassification test를 `tests/unit/standard/extension-policy.test.ts`에 작성
- [ ] T024 [US2] edit capability 및 annotation 검사를 `src/generation/standard/decision.ts`에 구현
- [ ] T025 [US2] Extension 대안·영향·allowlist policy를 `src/generation/standard/extension-policy.ts`에 구현
- [ ] T026 [P] [US2] custom action/column/section 최소 template을 `templates/standard/webapp/ext/`에 작성
- [ ] T027 [US2] edit와 승인된 Extension file plan을 `src/generation/standard/generator.ts`에 통합
- [ ] T028 [US2] standard edit/extension integration test를 `tests/integration/standard-edit.test.ts`에 작성하고 통과

**Checkpoint**: US2는 prepared handoff로 조회 Story와 별도로 full project 생성 검증이 가능하다.

## Phase 5: User Story 3 - Standard 범위와 생성 안전성 확인 (P3)

**Goal**: 잘못된 유형, 누락 capability와 미승인 요청을 생성 전에 차단한다.

**Independent Test**: `STD-RECLASS-01`, `STD-BACKEND-01`, `STD-APPROVAL-01`에서 project directory가 생기지 않는다.

- [ ] T029 [P] [US3] wrong-type/missing-capability/unapproved contract test를 `tests/contract/standard-guard.test.ts`에 작성
- [ ] T030 [US3] Standard scope와 blocking prerequisite guard를 `src/generation/standard/decision.ts`에 구현
- [ ] T031 [US3] handoff approval 및 existing output preflight를 `src/cli/commands/generate-standard.ts`에 구현
- [ ] T032 [US3] no-write safety integration test를 `tests/integration/standard-no-write.test.ts`에 작성하고 통과

**Checkpoint**: 실패와 재판정 경로에서 filesystem 변경이 없다.

## Phase 6: Polish & Cross-Cutting

- [ ] T033 [P] FR-001~FR-024 trace matrix를 `specs/002-generate-standard-fiori-elements-app/traceability.md`에 작성
- [ ] T034 generated project mock metadata/sample data 준비를 `tests/fixtures/generated/standard/`에 추가
- [ ] T035 Standard generated project의 UI5 build smoke test를 `tests/integration/standard-build.test.ts`에 작성하고 통과
- [ ] T036 `specs/002-generate-standard-fiori-elements-app/quickstart.md`를 실행하고 결과를 `specs/002-generate-standard-fiori-elements-app/validation.md`에 기록

## Dependencies & Execution Order

- 001의 approved handoff/service snapshot과 Phase 1~2가 모든 Story를 차단한다.
- US1, US2, US3는 prepared fixture로 독립 구현 가능하다.
- 실제 product delivery는 US1 → US2 → US3 순서가 권장된다.
- 가장 빠른 OData→Fiori 앱 결과는 T001~T021이다.

## Parallel Opportunities

- Setup fixture와 dependency 설정, 공통 validator/report task는 파일이 달라 병렬 가능하다.
- 각 Story의 contract/unit tests와 template files는 병렬 작성 가능하다.

## Implementation Strategy

1. 001 완료 후 Phase 1~2 수행
2. US1로 read-only List Report MVP 생성 및 build
3. US2로 edit/Extension 추가
4. US3 안전 gate와 전체 quickstart 검증
