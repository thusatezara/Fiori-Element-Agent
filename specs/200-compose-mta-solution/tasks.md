# Tasks: Protocol 200 MTA 솔루션 구성

**Input**: `specs/200-compose-mta-solution/`의 설계 문서

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Spec이 validation과 안전 gate를 명시하므로 contract/unit/integration test를 필수 task로 포함한다.

## Phase 1: Setup

- [x] T001 MTA composition fixture 경계를 `tests/fixtures/mta/README.md`에 정의하고 secret-free fixture 목록을 기록한다.
- [x] T002 [P] Protocol 200 schema loader와 오류 형식을 `src/composition/mta/contract.mjs`에 구성한다.
- [x] T003 [P] 임시 workspace lifecycle helper를 `tests/helpers/mta-workspace.mjs`에 구성한다.

## Phase 2: Foundational

- [x] T004 full handoff를 검증하고 100·001~004 source result를 공통 `ComponentResult`로 정규화한 뒤 dependency evidence, `PASSED` status와 checksum gate를 `src/composition/mta/component-result-adapter.mjs`, `src/composition/mta/input-validator.mjs`에 구현한다. (FR-001~FR-003)
- [x] T005 [P] credential-like 값과 path traversal 거부 test를 `tests/mta-package-contract.test.mjs`에 작성한다. (FR-004~FR-005)
- [x] T006 credential scan과 output boundary/overwrite transaction을 `src/composition/mta/input-validator.mjs`에 구현한다. (FR-004~FR-005, FR-012)
- [x] T007 `DEFINED`이면 executor 없이 차단되는 registry test를 `tests/solution-plan.test.mjs`에 보강한다. (FR-018)

## Phase 3: User Story 1 - 검증 결과만 패키징 (Priority: P1) 🎯 MVP

**Goal**: 000 handoff와 검증된 generation result만 composition input으로 승인한다.

**Independent Test**: valid result만 preflight를 통과하고 missing/failed/tampered result와 credential payload는 file write 없이 차단된다.

- [x] T008 [P] [US1] valid, failed, missing-evidence, tampered fixture를 `tests/fixtures/mta/components/`에 작성한다.
- [x] T009 [P] [US1] request contract case를 `tests/mta-package-contract.test.mjs`에 작성한다. (FR-001~FR-004)
- [x] T010 [US1] provenance와 current checksum을 검증하도록 `src/composition/mta/input-validator.mjs`를 완성한다. (FR-002~FR-004)
- [x] T011 [US1] preflight success/blocking reason과 redaction을 `src/composition/mta/composition-report.mjs`에 구현한다. (FR-004)

## Phase 4: User Story 2 - 일관된 MTA topology 구성 (Priority: P1)

**Goal**: capability를 deterministic한 target-neutral module/resource topology로 구성한다.

**Independent Test**: 세 solution shape가 완전한 topology를 만들고 모든 collision과 landscape 값이 차단된다.

- [x] T012 [P] [US2] Backend-only, Frontend-only, integrated fixture를 `tests/fixtures/mta/topologies/`에 작성한다.
- [x] T013 [P] [US2] identifier/resource/route/path/config collision test를 `tests/mta-composition.test.mjs`에 작성한다. (FR-007, FR-009)
- [x] T014 [US2] canonical graph composer를 `src/composition/mta/topology-composer.mjs`에 구현한다. (FR-006~FR-008)
- [x] T015 [US2] collision detector를 `src/composition/mta/collision-detector.mjs`에 구현한다. (FR-009)
- [x] T016 [US2] target-neutral renderer를 `src/composition/mta/descriptor-renderer.mjs`에 구현한다. (FR-010~FR-011)
- [x] T017 [US2] stable fingerprint와 overwrite policy를 `tests/mta-composition.test.mjs`에서 검증한다. (FR-011~FR-012)

## Phase 5: User Story 3 - archive-ready 결과 검증 (Priority: P2)

**Goal**: 정적 및 build validation이 성공한 artifact만 Protocol 300 입력으로 발급한다.

**Independent Test**: tool 부재/실패/invalid descriptor는 `READY`가 되지 않고 성공 결과만 checksum과 evidence를 가진다.

- [x] T018 [P] [US3] schema/reference/path/secret case를 `tests/mta-composition.test.mjs`에 작성한다. (FR-013)
- [x] T019 [P] [US3] build unavailable/failure/malformed/success case를 `tests/mta-composition.test.mjs`에 작성한다. (FR-014~FR-016)
- [x] T020 [US3] package validator를 `src/validation/mta-package.mjs`에 구현한다. (FR-013)
- [x] T021 [US3] allowlisted executable/version build adapter를 `src/composition/mta/build-adapter.mjs`에 구현한다. (FR-014~FR-015)
- [x] T022 [US3] archive checksum과 evidence를 `src/composition/mta/composition-report.mjs`에 연결한다. (FR-016~FR-017)
- [x] T023 [US3] result schema와 300 handoff contract test를 `tests/mta-package-contract.test.mjs`에 작성한다. (FR-016~FR-017)

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T024 [P] error code와 troubleshooting을 `specs/200-compose-mta-solution/quickstart.md`에 맞춘다.
- [x] T025 descriptor/capability와 문서·contract·구현을 `src/composition/mta/protocol.mjs` 기준으로 교차 검증한다.
- [x] T026 `npm test`와 quickstart 결과를 `specs/200-compose-mta-solution/checklists/implementation.md`에 기록한다.
- [x] T027 모든 검증 통과 후에만 `src/composition/mta/protocol.mjs`에 executor를 등록하고 `IMPLEMENTED`로 전환한다. (FR-018)

## Dependencies & Execution Order

- Phase 1 → Phase 2 → US1 → US2 → US3 → Phase 6 순서다.
- registry 전환 T027은 T001~T026과 모든 validation 통과에 의존한다.

## Parallel Opportunities

- T002/T003, T005/T007 및 각 story의 fixture/test task는 서로 다른 파일에서 병렬 수행할 수 있다.
- `[P]` 표시는 선행 task와 file conflict가 없는 항목에만 사용한다.

## Implementation Strategy

1. MVP는 Phase 1~US1이며 아직 build/executor를 열지 않는다.
2. US2에서 deterministic descriptor, US3에서 build evidence와 checksum을 완성한다.
3. 마지막 task에서만 registry를 원자적으로 `IMPLEMENTED`로 전환한다.

## Phase 7: Reusable CAP HANA topology convergence

- [x] T028 [US1] 검증된 BACKEND `package.json`에서 CAP Node.js와 production persistence를 파생하고 입력 capability 충돌을 차단하도록 `src/composition/mta/component-result-adapter.mjs`와 test를 보완한다. (FR-019)
- [x] T029 [US2] `identity.applicationId`에서 generic service/db-deployer/HDI resource 이름과 dependency를 생성하도록 `src/composition/mta/topology-composer.mjs`, `descriptor-renderer.mjs`와 test를 보완한다. (FR-019~FR-020)
- [x] T030 [US2] BACKEND source staging과 CAP production build path를 `src/composition/mta/protocol.mjs`에 구현하고 Frontend endpoint hardcoding을 capability 입력으로 대체한다. (FR-020~FR-021)
- [x] T031 [US3] reusable topology contract, Spec, Plan, research, quickstart와 traceability를 구현 및 전체 regression evidence와 동기화한다. (SC-008)
- [x] T032 [US3] MTAR 생성 후 backend staging의 임시 `node_modules`를 제거하고 archive와 provenance만 보존하도록 cleanup 및 test를 추가한다. (FR-005, FR-016)

## Format Validation

- 총 32개 task이며 checkbox, 연속 ID와 대상 file path를 포함한다.
- 사용자 스토리 task는 `[US1]`, `[US2]`, `[US3]` label을 가진다.
