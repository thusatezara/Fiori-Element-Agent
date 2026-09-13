# Tasks: SAP Build Work Zone 게시

**Input**: `specs/400-publish-work-zone/`의 설계 문서

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`

**Tests**: 외부 변경 protocol이므로 contract, unit, adapter integration, secret scan과 승인된 sandbox validation을 필수로 포함한다.

## Phase 1: Setup

**Purpose**: credential 없는 fixture와 test 경계를 준비한다.

- [ ] T001 Work Zone request/result의 valid·invalid fixture directory와 redacted sample inventory를 `tests/fixtures/work-zone/README.md`에 만든다.
- [ ] T002 [P] request/result JSON Schema loader와 fixture assertion helper를 `tests/helpers/work-zone-contract.mjs`에 만든다.
- [ ] T003 [P] mutation 호출과 operation별 current state를 기록하는 fake edition adapter를 `tests/helpers/fake-work-zone-adapter.mjs`에 만든다.

---

## Phase 2: Foundational

**Purpose**: 모든 사용자 스토리가 공유하는 contract, stable code와 credential-safe model을 구현한다.

**⚠️ CRITICAL**: 이 phase 완료 전에는 story별 executor를 구현하지 않는다.

- [ ] T004 request schema의 PREVIEW/PUBLISH conditional과 필수 field contract test를 `tests/work-zone-publication-contract.test.mjs`에 먼저 작성한다.
- [ ] T005 [P] result schema의 preflight/operation/validation 상태 contract test를 `tests/work-zone-publication-contract.test.mjs`에 먼저 작성한다.
- [ ] T006 [P] stable blocking/result code와 허용 operation enum을 `src/publication/work-zone/contracts.mjs`에 정의한다.
- [ ] T007 credential-like key/value를 request, result와 adapter error에서 거부하는 sanitizer를 `src/publication/work-zone/credential-policy.mjs`에 구현한다.
- [ ] T008 request/result JSON contract validator를 `src/validation/work-zone-publication.mjs`에 구현해 T004~T005를 통과시킨다.

**Checkpoint**: credential-safe request/result contract를 독립 검증할 수 있다.

---

## Phase 3: User Story 1 - 게시 전 준비 상태 검증 (Priority: P1) 🎯 MVP

**Goal**: 외부 변경 없이 300 dependency, exact target, manifest business service와 selected navigation을 검증한다.

**Independent Test**: valid fixture는 `READY_FOR_APPROVAL`, 각 invalid fixture는 stable blocking code를 반환하며 fake adapter mutation count는 항상 0이다.

### Tests for User Story 1

- [ ] T009 [P] [US1] handoff binding과 Protocol 300 `SUCCEEDED` dependency의 pass/fail test를 `tests/work-zone-publication.test.mjs`에 작성한다.
- [ ] T010 [P] [US1] edition/subaccount/site/contentTarget 누락 및 cross-subaccount mismatch test를 `tests/work-zone-publication.test.mjs`에 작성한다.
- [ ] T011 [P] [US1] `sap.app/id`, `sap.cloud/service`, digest mismatch와 multi-inbound selection test를 `tests/work-zone-publication.test.mjs`에 작성한다.
- [ ] T012 [P] [US1] semantic object/action/canonical intent validation test를 `tests/work-zone-publication.test.mjs`에 작성한다.

### Implementation for User Story 1

- [ ] T013 [US1] Protocol 400 handoff와 성공한 300 result binding validator를 `src/publication/work-zone/request-validator.mjs`에 구현한다.
- [ ] T014 [US1] confirmed edition·target completeness와 same-subaccount evidence validator를 `src/publication/work-zone/request-validator.mjs`에 구현한다.
- [ ] T015 [US1] deployment identity와 manifest `sap.app/id`·`sap.cloud/service`·digest coherence를 `src/publication/work-zone/manifest-validator.mjs`에 구현한다.
- [ ] T016 [US1] selected inbound와 canonical `#<semanticObject>-<action>` validator를 `src/publication/work-zone/manifest-validator.mjs`에 구현한다.
- [ ] T017 [US1] read-only preflight pipeline과 stable check evidence 생성을 `src/publication/work-zone/preflight.mjs`에 구현한다.
- [ ] T018 [US1] PREVIEW에서 mutation adapter 호출이 0건임을 검증하는 integration test를 `tests/work-zone-publication.test.mjs`에 완성한다.

**Checkpoint**: User Story 1만으로 safe publication readiness MVP를 독립 실행할 수 있다.

---

## Phase 4: User Story 2 - 승인 범위 안에서 edition별 게시 (Priority: P1)

**Goal**: exact target/operation 승인을 검증하고 confirmed edition adapter로 승인된 desired-state operation만 수행한다.

**Independent Test**: fake `STANDARD`/`ADVANCED` adapter에서 승인 operation만 호출되고 mismatch, unsupported, conflict와 `DEFINED` protocol은 mutation 0건으로 차단된다.

### Tests for User Story 2

- [ ] T019 [P] [US2] missing/expired approval과 target/operation fingerprint mismatch test를 `tests/work-zone-publication.test.mjs`에 작성한다.
- [ ] T020 [P] [US2] 승인 operation subset, destructive operation 거부와 conflicting tile operation test를 `tests/work-zone-publication.test.mjs`에 작성한다.
- [ ] T021 [P] [US2] registry가 `DEFINED`일 때 모든 mutation을 `PROTOCOL_NOT_IMPLEMENTED`로 차단하는 regression test를 `tests/solution-plan.test.mjs`에 추가한다.
- [ ] T022 [P] [US2] edition match/mismatch와 adapter capability contract test를 `tests/work-zone-publisher-adapter.test.mjs`에 작성한다.
- [ ] T023 [P] [US2] current desired state가 일치할 때 `NO_CHANGE`이고 중복 mutation이 없는 test를 `tests/work-zone-publisher-adapter.test.mjs`에 작성한다.

### Implementation for User Story 2

- [ ] T024 [US2] canonical target/operation fingerprint와 approval expiry/scope gate를 `src/publication/work-zone/approval-gate.mjs`에 구현한다.
- [ ] T025 [US2] 허용 operation subset, dependency ordering, conflict와 capability validation을 `src/publication/work-zone/operation-planner.mjs`에 구현한다.
- [ ] T026 [P] [US2] `STANDARD` edition port 구현을 `src/publication/work-zone/adapters/standard.mjs`에 추가한다.
- [ ] T027 [P] [US2] `ADVANCED` edition port 구현을 `src/publication/work-zone/adapters/advanced.mjs`에 추가한다.
- [ ] T028 [US2] confirmed edition adapter만 선택하고 desired-state operation을 순차 실행하는 publisher를 `src/publication/work-zone/publisher.mjs`에 구현한다.
- [ ] T029 [US2] request validation/preflight/approval/publisher를 연결하되 `DEFINED` 상태에서는 dispatch하지 않도록 `src/publication/work-zone/protocol.mjs`에 executor gate를 구현한다.

**Checkpoint**: User Story 2는 fake adapter로 exact approval publication과 idempotent no-change를 독립 검증할 수 있다. 실제 tenant 게시 승인은 아직 별도다.

---

## Phase 5: User Story 3 - navigation·visibility 증거와 안전한 실패 보고 (Priority: P2)

**Goal**: 게시 후 discovery, assignment, navigation, visibility를 검증하고 partial failure를 credential 없이 보고한다.

**Independent Test**: success/no-change/navigation mismatch/no-subject/operation failure fixture에서 전체 상태, operation evidence와 recovery guidance가 contract와 일치한다.

### Tests for User Story 3

- [ ] T030 [P] [US3] content discovery, site assignment와 canonical navigation pass/fail test를 `tests/work-zone-publication.test.mjs`에 작성한다.
- [ ] T031 [P] [US3] visibility subject 유무와 role auto-assignment 금지 test를 `tests/work-zone-publication.test.mjs`에 작성한다.
- [ ] T032 [P] [US3] partial failure 후 완료·실패·미실행 operation과 retryability test를 `tests/work-zone-publisher-adapter.test.mjs`에 작성한다.
- [ ] T033 [P] [US3] request/result/log의 credential-like content가 0건인지 검증하는 test를 `tests/work-zone-publication-contract.test.mjs`에 작성한다.

### Implementation for User Story 3

- [ ] T034 [US3] discovery, site assignment, navigation과 optional subject visibility validator를 `src/publication/work-zone/visibility-validator.mjs`에 구현한다.
- [ ] T035 [US3] operation evidence, overall status, retryability와 non-destructive recovery guidance builder를 `src/publication/work-zone/result.mjs`에 구현한다.
- [ ] T036 [US3] publisher failure 이후 후속 operation을 `NOT_RUN`으로 보존하고 post-validation/result builder를 연결하도록 `src/publication/work-zone/publisher.mjs`를 완성한다.

**Checkpoint**: 모든 story 결과가 credential 없는 audit/result contract로 검증된다.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T037 전체 `npm test`와 `specs/400-publish-work-zone/quickstart.md`의 local scenario를 실행하고 결과를 `specs/400-publish-work-zone/validation-report.md`에 기록한다.
- [ ] T038 승인된 sandbox에서 edition별 target/capability/publication/visibility evidence를 수집하고 secret scan 결과를 `specs/400-publish-work-zone/sandbox-validation.md`에 기록한다.
- [ ] T039 contract·unit·integration·sandbox gate가 모두 통과한 경우에만 `src/publication/work-zone/protocol.mjs`와 `src/orchestration/protocol-registry.mjs`의 Protocol 400 상태/executor를 `IMPLEMENTED`로 전환하고 `tests/solution-plan.test.mjs` regression을 갱신한다.

---

## Dependencies & Execution Order

### Phase Dependencies

- Phase 1 → Phase 2 → Phase 3 순서로 진행한다.
- Phase 4는 Phase 3의 validated preflight output에 의존한다.
- Phase 5는 Phase 4의 operation result contract에 의존한다.
- T037은 모든 local story 완료 후 실행한다.
- T038은 local gate 통과와 별도 사용자 승인에 의존한다.
- T039는 T037과 T038 evidence가 모두 통과하기 전에는 실행하지 않는다.

### User Story Dependencies

- **US1 (P1)**: Foundational 이후 독립 구현 가능하며 MVP다.
- **US2 (P1)**: US1의 preflight가 필요하며 fake adapter까지만 외부 변경 없이 독립 검증 가능하다.
- **US3 (P2)**: US2의 operation evidence를 소비하지만 validator와 result test는 fixture 기반으로 병렬 작성할 수 있다.

### Parallel Opportunities

- T002와 T003은 서로 다른 helper file이므로 병렬 가능하다.
- 같은 test file을 수정하는 task는 충돌을 피하도록 한 작업자가 순차 적용한다.
- T026과 T027은 공통 adapter contract가 고정된 뒤 병렬 구현 가능하다.
- T030~T033 test 설계는 서로 다른 concern이며 file ownership을 조정하면 병렬 가능하다.
- T034와 T035는 input/output contract가 고정된 뒤 병렬 구현 가능하다.

## Parallel Example: User Story 2

```text
Task: "STANDARD edition port를 src/publication/work-zone/adapters/standard.mjs에 구현"
Task: "ADVANCED edition port를 src/publication/work-zone/adapters/advanced.mjs에 구현"
```

## Implementation Strategy

### MVP First

1. Phase 1과 Phase 2의 credential-safe contract를 완성한다.
2. US1 read-only preflight를 구현한다.
3. invalid dependency/target/manifest/navigation fixture에서 mutation 0건을 검증한다.
4. 이 시점에도 registry는 `DEFINED`로 유지한다.

### Incremental Delivery

1. US1 → safe readiness report
2. US2 → fake adapter 기반 exact approval와 edition routing
3. US3 → post-publication validation과 failure evidence
4. 전체 local regression → 별도 승인된 sandbox validation
5. 모든 gate 통과 후에만 protocol status 전환

## Notes

- 모든 checkbox는 구현 전 상태이므로 미완료로 유지한다.
- 실제 외부 게시, login, role/tile 변경은 task 문서 작성만으로 승인되지 않는다.
- T038에는 정확한 edition, subaccount, site, content target, operation과 test subject에 대한 별도 사용자 승인이 필요하다.
- T039는 문서 완성이 아니라 재현 가능한 runtime evidence에 의해 결정된다.
