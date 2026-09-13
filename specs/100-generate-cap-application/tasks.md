# Tasks: CAP Backend 애플리케이션 생성

**Input**: `specs/100-generate-cap-application/`의 spec, plan, research, data-model, contracts와 quickstart

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/)

**Tests**: Spec의 compile, contract, handler, authorization, start, guard와 snapshot success criteria를 구현하기 위해 test task를 필수로 포함한다.

**Protocol gate**: T034 완료 전까지 protocol 100은 `DEFINED`, `executor=null`이며 실행 가능으로 보고하지 않는다.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 선행 task 완료 후 다른 file에서 병렬 실행 가능
- **[Story]**: Spec의 user story와 연결
- 모든 task는 수정 대상 file과 완료 조건을 포함

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: CAP generator source/template/test boundary를 만든다.

- [ ] T001 `src/generation/backend/cap/`, `templates/cap-nodejs/`와 `tests/fixtures/cap/` directory boundary를 plan 구조대로 준비하고 placeholder executor는 추가하지 않는다.
- [ ] T002 [P] Protocol request/result/snapshot schema loader와 fixture validation harness를 `tests/helpers/cap-contract.mjs`에 추가한다.
- [ ] T003 [P] CAP generated-project fixture dependency와 test command를 repository `package.json`에 추가하고 lockfile을 `package-lock.json`에 동기화한다.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 모든 user story가 공유하는 handoff validation, immutable plan, rendering과 safe output 기반을 구현한다.

**⚠️ CRITICAL**: 이 phase가 끝날 때도 registry 상태는 `DEFINED`이며 user story executor를 외부에 노출하지 않는다.

- [ ] T004 Request schema와 000 handoff/version/protocol/dependency 교차 검증을 `src/generation/backend/cap/request-validator.mjs`에 구현한다.
- [ ] T005 [P] namespace, identifier, type/length/precision, key와 relationship reference semantic validation을 `src/generation/backend/cap/domain-plan.mjs`에 구현한다.
- [ ] T006 [P] explicit projection, service path, capability와 operation signature plan을 `src/generation/backend/cap/service-plan.mjs`에 구현한다.
- [ ] T007 [P] structured validation/action/transaction/authorization allowlist plan을 `src/generation/backend/cap/behavior-plan.mjs`에 구현하고 arbitrary code/raw SQL 입력을 거부한다.
- [ ] T008 CAP plan을 deterministic template context와 requirement trace로 결합하는 coordinator를 `src/generation/backend/cap/generator.mjs`에 구현하되 final output commit은 비활성 상태로 둔다.
- [ ] T009 공통 credential detector, workspace boundary와 staging/atomic output transaction을 `src/generation/backend/cap/generator.mjs`에서 `src/generation/common/` capability에 연결한다.
- [ ] T010 [P] invalid version, protocol mismatch, missing key, unresolved relation, unsupported runtime와 unsafe output의 contract test를 `tests/cap-generation-contract.test.mjs`에 작성하고 구현 전 실패를 확인한다.

**Checkpoint**: valid request는 immutable generation plan이 되고 invalid request는 write 이전 `BLOCKED` result가 된다. 외부 executor는 아직 없다.

---

## Phase 3: User Story 1 - 검증 가능한 domain과 service 생성 (Priority: P1) 🎯 MVP

**Goal**: valid 000 handoff에서 compile 가능한 `db`/`srv` project와 compile-derived consumer snapshot을 만든다.

**Independent Test**: `CAP-CRUD-01`, `CAP-CONTRACT-01` fixture가 explicit projection, compile/local start와 snapshot consistency를 통과하고 내부 field를 노출하지 않는다.

### Tests for User Story 1

- [ ] T011 [P] [US1] `CAP-CRUD-01` domain/service generation integration test를 `tests/cap-generation.test.mjs`에 작성하고 생성 전 실패를 확인한다.
- [ ] T012 [P] [US1] `CAP-CONTRACT-01` hidden persistence field 및 snapshot consistency test를 `tests/cap-service-snapshot.test.mjs`에 작성하고 구현 전 실패를 확인한다.

### Implementation for User Story 1

- [ ] T013 [P] [US1] CAP Node.js dependency, scripts, SQLite local profile와 HANA intent-only profile template을 `templates/cap-nodejs/package.json.hbs`에 작성한다.
- [ ] T014 [P] [US1] standard aspect, explicit element와 approved association/composition domain template을 `templates/cap-nodejs/db/schema.cds.hbs`에 작성한다.
- [ ] T015 [P] [US1] explicit projection, capability restriction, action/function signature service template을 `templates/cap-nodejs/srv/service.cds.hbs`에 작성한다.
- [ ] T016 [P] [US1] generated project 실행·검증·production exclusion 설명을 `templates/cap-nodejs/README.md.hbs`에 작성한다.
- [ ] T017 [US1] compiled CSN/EDMX에서 public entity/property/navigation/operation/capability만 추출하고 digest를 계산하는 `src/generation/backend/cap/service-snapshot.mjs`를 구현한다.
- [ ] T018 [US1] CDS compile, generated contract test, local metadata start와 snapshot consistency check를 `src/validation/generated-cap-project.mjs`에 구현한다.
- [ ] T019 [US1] `CAP-CRUD-01`과 `CAP-CONTRACT-01`을 `tests/fixtures/cap/`에 비민감 example handoff로 추가하고 `tests/cap-generation.test.mjs`의 end-to-end validation을 통과시킨다.

**Checkpoint**: US1만으로 local CRUD Backend와 후속 001용 service snapshot을 검증할 수 있지만 registry는 여전히 `DEFINED`다.

---

## Phase 4: User Story 2 - 업무 규칙과 authorization 경계 생성 (Priority: P2)

**Goal**: 승인된 validation, transaction action과 role intent를 Backend handler/service contract에 반영한다.

**Independent Test**: `CAP-RULES-01`의 success/error/rollback과 `CAP-AUTH-01`의 mocked role allow/deny가 승인 intent와 일치한다.

### Tests for User Story 2

- [ ] T020 [P] [US2] validation/action transaction success, stable error와 rollback test를 `tests/cap-behavior.test.mjs`에 작성하고 구현 전 실패를 확인한다.
- [ ] T021 [P] [US2] service/entity/operation authorization allow/deny contract test를 `tests/cap-authorization.test.mjs`에 작성하고 구현 전 실패를 확인한다.

### Implementation for User Story 2

- [ ] T022 [P] [US2] structured behavior plan을 CAP event/CQL handler로 render하는 optional template을 `templates/cap-nodejs/srv/service.js.hbs`에 작성한다.
- [ ] T023 [P] [US2] generated validation/action/transaction/authorization regression template을 `templates/cap-nodejs/test/service.test.js.hbs`에 작성한다.
- [ ] T024 [US2] behavior plan의 transaction atomicity, destructive confirmation과 role annotation을 `src/generation/backend/cap/behavior-plan.mjs` 및 `src/generation/backend/cap/service-plan.mjs`에 연결한다.
- [ ] T025 [US2] `CAP-RULES-01`, `CAP-AUTH-01` fixture를 `tests/fixtures/cap/`에 추가하고 `tests/cap-behavior.test.mjs`, `tests/cap-authorization.test.mjs`를 통과시킨다.

**Checkpoint**: US2까지 완료하면 business behavior와 authorization intent가 local test로 검증되며 cloud identity resource는 만들지 않는다.

---

## Phase 5: User Story 3 - 안전한 생성과 재현 가능한 검증 (Priority: P3)

**Goal**: invalid/secret/unsafe 입력과 validation failure가 final output을 남기지 않고, valid 결과는 완전한 evidence report를 제공한다.

**Independent Test**: `CAP-GUARD-01` variants가 모두 `BLOCKED` 또는 `FAILED`로 final file 없이 끝나고 valid result만 atomic commit된다.

### Tests for User Story 3

- [ ] T026 [P] [US3] credential-like handoff, path escape, existing output와 invalid handoff negative test를 `tests/cap-generation-guard.test.mjs`에 작성하고 구현 전 실패를 확인한다.
- [ ] T027 [P] [US3] staged compile/test/start failure가 partial final output과 service snapshot을 남기지 않는 test를 `tests/cap-generation-failure.test.mjs`에 작성하고 구현 전 실패를 확인한다.
- [ ] T028 [P] [US3] result schema, required check set와 requirement trace completeness test를 `tests/cap-generation-result.test.mjs`에 작성하고 구현 전 실패를 확인한다.

### Implementation for User Story 3

- [ ] T029 [US3] redacted blocking/failure result와 complete validation report 생성을 `src/generation/backend/cap/generator.mjs` 및 `src/generation/common/generation-report.mjs`에 연결한다.
- [ ] T030 [US3] 모든 mandatory validation 후에만 staging을 final directory로 commit하고 실패 cleanup risk를 보존하도록 `src/generation/backend/cap/generator.mjs`를 완성한다.
- [ ] T031 [US3] `CAP-GUARD-01`의 synthetic variants를 `tests/fixtures/cap/` 또는 in-memory fixture builder에 추가하고 guard/failure/result test를 모두 통과시킨다.

**Checkpoint**: valid generation은 `VALIDATED`, 안전 prerequisite는 `BLOCKED`, validation 오류는 `FAILED`이며 incomplete `GENERATED`는 외부 결과가 아니다.

---

## Phase 6: Integration and Protocol Activation

**Purpose**: 000 handoff adapter, CLI와 전체 validation을 연결한 뒤 마지막에 protocol 상태를 전환한다.

- [ ] T032 [P] specialized handoff file만 받는 local adapter와 `generate:backend` command를 `src/cli/commands/generate-backend.mjs`, `src/cli/index.mjs` 및 `package.json`에 연결한다.
- [ ] T033 [P] 000 workflow가 invalid dependency/contract를 차단하고 100 result를 step report로 전달하는 integration test를 `tests/cap-protocol-gate.test.mjs`에 작성한다.
- [ ] T034 quickstart의 schema, CRUD, behavior, authorization, guard, repository lint/test를 모두 통과한 같은 변경에서만 `src/generation/backend/cap/protocol.mjs`에 executor를 연결하고 `status`를 `DEFINED`에서 `IMPLEMENTED`로 전환한다.
- [ ] T035 [P] 최종 구현과 contract가 달라진 항목을 `specs/100-generate-cap-application/spec.md`, `plan.md`, `contracts/`와 `quickstart.md`에 동기화하고 requirement trace 누락이 0건인지 검토한다.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 즉시 시작 가능
- **Foundational (Phase 2)**: Setup 완료 후 시작하며 모든 story를 차단
- **US1 (Phase 3)**: Foundational 완료 후 시작; protocol MVP
- **US2 (Phase 4)**: Foundational과 service model contract가 필요하므로 T006 완료 후 병렬 시작 가능하며 최종 integration은 US1 template에 연결
- **US3 (Phase 5)**: Foundational output transaction 후 시작 가능하며 US1/US2의 failure surface를 최종 검증
- **Activation (Phase 6)**: 선택한 모든 story와 필수 test가 완료된 뒤 실행; T034가 유일한 status 전환 task

### User Story Dependencies

- **US1 (P1)**: Foundational 이후 독립적으로 local CRUD project와 snapshot을 제공
- **US2 (P2)**: Foundational 이후 behavior-only fixture로 개발 가능; service template integration에서 US1 T015 필요
- **US3 (P3)**: Foundational 이후 guard를 개발 가능; complete failure/report matrix는 US1/US2 checks가 필요

### Requirement Coverage

- **US1**: FR-003~010, FR-017~018, FR-023~025, FR-027
- **US2**: FR-011~016, FR-023~025
- **US3**: FR-001~004, FR-019~026, FR-028~029

## Parallel Opportunities

- T002와 T003은 다른 test/setup file에서 병렬 가능하다.
- T005, T006, T007과 T010은 request contract 확정 후 서로 다른 source/test file에서 병렬 가능하다.
- US1의 T011~T016은 snapshot implementation 전에 test/template 단위로 병렬 가능하다.
- US2의 T020~T023은 behavior plan contract 확정 후 병렬 가능하다.
- US3의 T026~T028은 각 negative/result test file에서 병렬 가능하다.
- Activation 전 T032와 T033은 adapter와 integration test file에서 병렬 가능하다.

## Parallel Example: User Story 1

```text
Task T011: tests/cap-generation.test.mjs에 CAP-CRUD-01 failing test 작성
Task T012: tests/cap-service-snapshot.test.mjs에 CAP-CONTRACT-01 failing test 작성
Task T013: templates/cap-nodejs/package.json.hbs 작성
Task T014: templates/cap-nodejs/db/schema.cds.hbs 작성
Task T015: templates/cap-nodejs/srv/service.cds.hbs 작성
Task T016: templates/cap-nodejs/README.md.hbs 작성
```

## Implementation Strategy

### MVP First (User Story 1)

1. Phase 1 Setup 완료
2. Phase 2 Foundational 완료
3. Phase 3 US1 구현 및 `CAP-CRUD-01`, `CAP-CONTRACT-01` 검증
4. MVP behavior를 독립 검토하되 protocol 상태는 `DEFINED` 유지
5. 안전성/필수 story와 activation gate 완료 전 executor 공개 금지

### Incremental Delivery

1. immutable request/domain/service plan
2. compile 가능한 CRUD service와 snapshot
3. validation/action/transaction/authorization behavior
4. guard, atomic output와 evidence report
5. 000 integration 전체 검증 후 단일 status activation

## Notes

- 모든 checkbox는 아직 구현되지 않은 작업이며 문서 완성만으로 체크하지 않는다.
- `[P]` task도 표시된 선행 contract와 같은 file 수정 여부를 확인한 뒤 실행한다.
- 실제 HANA, identity service와 Cloud Foundry 검증은 100 완료 조건이 아니며 downstream prerequisite로 보고한다.
- T034 전에는 어떤 중간 생성 성공도 protocol 100을 실행 가능한 것으로 만들지 않는다.
