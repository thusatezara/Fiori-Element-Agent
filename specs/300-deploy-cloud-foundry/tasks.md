# Tasks: Protocol 300 Cloud Foundry 배포

**Input**: `specs/300-deploy-cloud-foundry/`의 설계 문서

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: 외부 변경 safety가 핵심 acceptance criterion이므로 fake adapter 기반 contract/unit/integration test를 필수로 포함한다.

## Phase 1: Setup

- [ ] T001 Cloud Foundry secret-free fixture와 fake adapter 경계를 `tests/fixtures/cloud-foundry/README.md`에 정의한다.
- [ ] T002 [P] Protocol 300 schema loader와 safe error 형식을 `src/deployment/cloud-foundry/contract.mjs`에 구성한다.
- [ ] T003 [P] CF process 호출을 기록하되 외부 process를 만들지 않는 fake를 `tests/helpers/fake-cf-adapter.mjs`에 구성한다.

## Phase 2: Foundational

- [ ] T004 handoff와 Protocol 200 `READY` artifact/evidence/checksum validator를 `src/deployment/cloud-foundry/deployment-gate.mjs`에 구현한다. (FR-001~FR-003)
- [ ] T005 [P] HTTPS API/org/space/stage canonicalization과 fingerprint test를 `tests/cloud-foundry-contract.test.mjs`에 작성한다. (FR-004~FR-005)
- [ ] T006 credential-like payload와 raw CLI output redaction test를 `tests/cloud-foundry-contract.test.mjs`에 작성한다. (FR-009)
- [ ] T007 `DEFINED` 상태에서는 fake adapter조차 호출하지 않는 registry safety test를 `tests/solution-plan.test.mjs`에 보강한다. (FR-021)

## Phase 3: User Story 1 - target과 권한 확인 (Priority: P1) 🎯 MVP

**Goal**: artifact와 target prerequisite를 read-only snapshot으로 확인하되 deploy하지 않는다.

**Independent Test**: 누락/불일치/확인 불가 prerequisite는 `BLOCKED`, 완전한 fixture만 `READY_FOR_APPROVAL`이다.

- [ ] T008 [P] [US1] target match/mismatch, session/role/plugin/service/quota fixture를 `tests/fixtures/cloud-foundry/preflight/`에 작성한다.
- [ ] T009 [P] [US1] artifact checksum/evidence 및 preflight matrix test를 `tests/cloud-foundry-deployment.test.mjs`에 작성한다. (FR-001~FR-008)
- [ ] T010 [US1] canonical requested/current target inspector를 `src/deployment/cloud-foundry/target-inspector.mjs`에 구현한다. (FR-004~FR-005)
- [ ] T011 [US1] session/role, CLI/plugin, service/entitlement/quota inspector를 `src/deployment/cloud-foundry/prerequisite-inspector.mjs`에 구현한다. (FR-006~FR-008)
- [ ] T012 [US1] secret-free `PreflightSnapshot`과 freshness/fingerprint를 `src/deployment/cloud-foundry/deployment-gate.mjs`에 구현한다. (FR-009)

## Phase 4: User Story 2 - 명시적으로 승인된 배포 실행 (Priority: P1)

**Goal**: 현재 snapshot에 결속된 승인만 받아 idempotent adapter를 최대 1회 호출한다.

**Independent Test**: approval 오류와 PROD 추가 승인 누락은 호출 0회, 유효 요청은 key당 호출 최대 1회다.

- [ ] T013 [P] [US2] missing/stale/mismatch approval와 PROD approval fixture를 `tests/fixtures/cloud-foundry/approvals/`에 작성한다.
- [ ] T014 [P] [US2] approval, execution-time recheck 및 idempotency test를 `tests/cloud-foundry-deployment.test.mjs`에 작성한다. (FR-010~FR-015)
- [ ] T015 [US2] deploy intent, approval binding/freshness와 PROD 추가 gate를 `src/deployment/cloud-foundry/deployment-gate.mjs`에 구현한다. (FR-010~FR-013)
- [ ] T016 [US2] allowlisted executable/argument-array process boundary와 redaction을 `src/deployment/cloud-foundry/cf-process-adapter.mjs`에 구현한다. (FR-009, FR-014)
- [ ] T017 [US2] idempotency key와 operation lifecycle을 `src/deployment/cloud-foundry/operation-tracker.mjs`에 구현한다. (FR-015~FR-016)
- [ ] T018 [US2] gate 통과 후 adapter 1회 호출 순서를 `src/deployment/cloud-foundry/protocol.mjs` executor factory에 연결하되 registry 상태는 유지한다. (FR-013~FR-016, FR-021)

## Phase 5: User Story 3 - 결과 검증과 안전한 recovery (Priority: P2)

**Goal**: operation/health/route evidence로 결과를 판정하고 실패/unknown에는 승인 기반 guidance만 제공한다.

**Independent Test**: success/failed/timeout/partial fixture가 정확한 상태와 credential-free evidence를 만들고 recovery 호출은 0회다.

- [ ] T019 [P] [US3] success/failure/timeout/partial/route-less-worker fixture를 `tests/fixtures/cloud-foundry/results/`에 작성한다.
- [ ] T020 [P] [US3] operation, health, route와 no-auto-recovery test를 `tests/cloud-foundry-deployment.test.mjs`에 작성한다. (FR-016~FR-020)
- [ ] T021 [US3] expected topology와 observed application health/route validator를 `src/deployment/cloud-foundry/deployment-validator.mjs`에 구현한다. (FR-017~FR-018)
- [ ] T022 [US3] `SUCCEEDED|FAILED|UNKNOWN` 판정과 approval prerequisite recovery guidance를 `src/deployment/cloud-foundry/deployment-report.mjs`에 구현한다. (FR-018~FR-019)
- [ ] T023 [US3] 400이 소비할 `resultId`, protocol, operation/application identity, artifact digest, subaccount와 verified time을 `src/deployment/cloud-foundry/deployment-report.mjs`에 포함한다. (FR-016~FR-020)
- [ ] T024 [US3] `deployment-result.schema.json`과 Protocol 400 handoff 호환 test를 `tests/cloud-foundry-contract.test.mjs`에 작성한다. (FR-016~FR-020)

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T025 [P] error code와 운영자 recovery 절차를 `specs/300-deploy-cloud-foundry/quickstart.md`에 구현 결과와 맞춘다.
- [ ] T026 모든 payload/log/report에 대한 credential scan coverage를 `tests/cloud-foundry-contract.test.mjs`에 완성한다. (FR-009)
- [ ] T027 `npm test`와 quickstart 결과 및 실제 CF 호출 0건을 `specs/300-deploy-cloud-foundry/checklists/implementation.md`에 기록한다.
- [ ] T028 모든 safety test 통과 후에만 `src/deployment/cloud-foundry/protocol.mjs`에 executor를 등록하고 `IMPLEMENTED`로 전환한다. (FR-021)

## Dependencies & Execution Order

- Phase 1 → Phase 2 → US1 → US2 → US3 → Phase 6 순서다.
- US1은 외부 변경 없는 read-only preflight MVP다.
- T028은 T001~T027, 전체 test와 credential/external-call audit 통과에 의존한다.

## Parallel Opportunities

- T002/T003, T005/T006 및 각 story의 fixture/test task는 다른 파일에서 병렬 수행할 수 있다.
- `[P]`는 incomplete dependency나 같은 파일 충돌이 없는 항목에만 사용한다.

## Implementation Strategy

1. MVP에서 artifact/target/prerequisite snapshot만 구현하고 deploy adapter를 활성화하지 않는다.
2. approval/idempotency를 완성한 뒤 fake adapter로만 execution flow를 검증한다.
3. post-validation과 400 evidence 계약을 완성한다.
4. 모든 safety gate 통과 후 마지막 task에서만 `IMPLEMENTED`로 전환한다.

## Format Validation

- 총 28개 task이며 checkbox, 연속 ID와 대상 file path를 포함한다.
- 사용자 스토리 task는 `[US1]`, `[US2]`, `[US3]` label을 가진다.
