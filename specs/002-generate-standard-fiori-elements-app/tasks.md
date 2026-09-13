# Tasks: Standard Fiori Elements 애플리케이션 생성

`001`이 승인한 `STANDARD` handoff를 받아 metadata 기반 List Report/Object Page application을 생성한다.

## Phase 1: Source and common pipeline

- [x] T001 `src/generation/standard/`와 `templates/standard/` source boundary를 생성한다.
- [x] T002 공통 generation contract, template renderer, report와 atomic output을 `src/generation/common/`에 연결한다.
- [x] T003 generated project static validator를 `src/validation/generated-project.mjs`에 연결한다.

## Phase 2: Standard decision and rendering

- [x] T004 metadata property/key 기반 column과 filter decision을 `src/generation/standard/decision.mjs`에 구현한다.
- [x] T005 local `UI.LineItem`, `UI.SelectionFields`, `UI.HeaderInfo`, `UI.Facets` annotation plan을 `src/generation/standard/annotation-plan.mjs`에 구현한다.
- [x] T006 OData V2/V4 List Report/Object Page manifest plan을 `src/generation/standard/manifest-plan.mjs`에 구현한다.
- [x] T007 extension allowlist와 대안·영향·검증 정보를 `src/generation/standard/extension-policy.mjs`에 구현한다.
- [x] T008 package, UI5 config, Component, manifest, annotation, i18n, validator와 README template을 `templates/standard/`에 작성한다.
- [x] T009 Standard generator를 `src/generation/standard/generator.mjs`에 구현한다.

## Phase 3: 001 handoff and verification

- [x] T010 `src/cli/commands/generate-standard.mjs` adapter와 `src/cli/index.mjs`를 연결한다.
- [x] T011 Standard 결과가 단일 001 handoff, service metadata, List Report target과 annotation을 포함하는지 `tests/generate.test.mjs`에서 검증한다.
- [x] T012 generic fixture generation과 static validation을 통과시킨다.
- [x] T016 공통 FLP intent 계산·Sandbox config와 `--flp-intent` CLI 입력을 구현한다.
- [x] T017 Standard manifest inbound, `webapp/test/flpSandbox.html`, `fiori run` scripts와 static validation을 연결한다.
- [x] T018 fixture 생성 테스트에서 Sandbox 파일, intent 일치와 future generation 재사용을 검증한다.
- [x] T019 Standard List Report의 초기 자동 조회를 비활성화하고 Excel 요청 시 표준 table export를 활성화한다.
- [x] T020 생성기 test와 generated project validator에서 `initialLoad`와 `enableExport` 설정을 검증한다.

## Phase 4: Remaining validation

- [ ] T013 OData V2 Standard runtime preview와 live service binding을 별도 fixture로 검증한다.
- [ ] T014 Standard edit/approved extension의 OPA5 interaction test를 추가한다.
- [ ] T015 인증 destination interactive adapter를 추가한다.

## 완료 기준

- `001 → 002` 단일 handoff로 임의 EntitySet의 Standard application이 생성된다.
- 생성 application은 `templates/standard/`에서 렌더링되며 기존 output을 덮어쓰지 않는다.
- 생성 application은 `fiori run --open test/flpSandbox.html?...#<intent>`로 FLP Sandbox에서 실행되고, `start-noflp`로 standalone 실행도 제공한다.
- 정적 project validation과 repository test를 통과해야 한다.
- T013~T015는 환경 또는 추가 runtime 검증이 필요한 후속 작업으로 완료 보고에서 구분한다.
