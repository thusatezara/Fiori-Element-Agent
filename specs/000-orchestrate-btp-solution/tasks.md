# Tasks: BTP 솔루션 요청 orchestration 기반

**Input**: `specs/000-orchestrate-btp-solution/`의 설계 문서

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`

**Tests**: routing, dependency, approval gate와 기존 Frontend 호환성을 자동화 test로 검증한다.

## Phase 1: Setup

- [x] T001 Root routing과 source boundary를 새 000·100·200·300·400 구조에 맞게 `AGENTS.md`와 `README.md`에 반영한다.
- [x] T002 [P] 후속 protocol 책임·상태·입출력 경계를 `specs/100-generate-cap-application/spec.md`, `specs/200-compose-mta-solution/spec.md`, `specs/300-deploy-cloud-foundry/spec.md`, `specs/400-publish-work-zone/spec.md`에 정의한다.
- [x] T003 [P] 전문 Agent가 중앙 Spec을 참조하도록 `.codex/agents/frontend-agent.toml`, `.codex/agents/cap-agent.toml`, `.codex/agents/deployment-agent.toml`, `.codex/agents/work-zone-agent.toml`을 구성한다.

## Phase 2: Foundational

- [x] T004 protocol descriptor를 `src/generation/backend/cap/protocol.mjs`, `src/composition/mta/protocol.mjs`, `src/deployment/cloud-foundry/protocol.mjs`, `src/publication/work-zone/protocol.mjs`에 구현한다.
- [x] T005 immutable scope routing과 descriptor validation을 `src/orchestration/protocol-registry.mjs`에 구현한다.
- [x] T006 credential-like target 값과 incomplete external target을 차단하는 gate를 `src/orchestration/approval-gate.mjs`에 구현한다.
- [x] T007 plan contract와 dependency 무결성 validator를 `src/validation/solution-plan.mjs`에 구현한다.

## Phase 3: User Story 1 - 하나의 자연어 진입점 (Priority: P1)

**Goal**: 자연어 요청에서 dependency-ordered solution plan을 생성한다.

**Independent Test**: Frontend, Backend+Frontend, 배포+게시 요청이 예상 scope와 순서를 반환한다.

- [x] T008 [US1] scope 분류와 요청 정규화 test를 `tests/solution-plan.test.mjs`에 먼저 작성한다.
- [x] T009 [US1] `SolutionRequest` 정규화를 `src/orchestration/solution-request.mjs`에 구현한다.
- [x] T010 [US1] dependency expansion과 step readiness 계산을 `src/orchestration/solution-plan.mjs`에 구현한다.
- [x] T011 [US1] read-only planning CLI를 `src/cli/plan.mjs`와 `package.json`의 `plan` script에 연결한다.

## Phase 4: User Story 2 - 재사용 가능한 protocol routing (Priority: P1)

**Goal**: 중앙 registry가 scope를 protocol에 정확히 연결하고 미구현 executor를 차단한다.

**Independent Test**: 모든 scope가 하나의 descriptor에 연결되고 DEFINED protocol 실행 시 구조화된 blocked 결과를 반환한다.

- [x] T012 [US2] registry uniqueness와 executor readiness test를 `tests/solution-plan.test.mjs`에 추가한다.
- [x] T013 [US2] safe dispatch와 structured blocked result를 `src/orchestration/workflow-executor.mjs`에 구현한다.

## Phase 5: User Story 3 - 안전한 외부 변경 계획 (Priority: P2)

**Goal**: target과 외부 변경 의도가 없는 deploy/publish step을 실행 전에 차단한다.

**Independent Test**: incomplete CF/Work Zone target은 NEEDS_INPUT이고 완전한 target도 executor가 없으면 NOT_IMPLEMENTED다.

- [x] T014 [US3] CF와 Work Zone target gate test를 `tests/solution-plan.test.mjs`에 추가한다.
- [x] T015 [US3] target CLI option parsing을 `src/cli/plan.mjs`에 추가하고 credential 저장 금지를 검증한다.

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T016 전체 `npm test`와 `specs/000-orchestrate-btp-solution/quickstart.md` scenario를 실행해 신규 planning과 기존 001~004 regression을 검증한다.
- [x] T017 구현 결과와 제한 사항을 `README.md`에 정리하고 모든 task/requirement trace를 재검토한다.

## Dependencies & Execution Order

- Phase 1 → Phase 2 → Phase 3 순서로 진행한다.
- Phase 4는 Phase 2와 Phase 3의 plan 객체에 의존한다.
- Phase 5는 Phase 3의 planning과 Phase 2의 approval gate에 의존한다.
- Phase 6은 모든 사용자 스토리 완료 후 실행한다.

## Parallel Opportunities

- T002와 T003은 서로 다른 문서/config 파일을 다루므로 병렬 가능하다.
- User Story test는 같은 test file을 수정하므로 순차 적용한다.
- protocol descriptor는 registry보다 먼저 완료한다.

## Implementation Strategy

1. 000 plan CLI와 registry를 MVP로 완성한다.
2. 기존 Frontend path를 회귀 검증한다.
3. 후속 protocol은 `DEFINED` 상태와 명시적 boundary로 노출한다.
4. 실제 CAP/MTA/CF/Work Zone executor는 각 protocol의 별도 Plan과 Tasks로 구현한다.

## Phase 7: Convergence

- [x] T018 [US1] 상위 dependency step이 실행 가능하지 않을 때 자체적으로 `READY`인 downstream step을 `BLOCKED`로 표시하고 executor가 dependency completion evidence를 요구하도록 `src/orchestration/solution-plan.mjs`, `src/orchestration/workflow-executor.mjs`, `tests/solution-plan.test.mjs`, `specs/000-orchestrate-btp-solution/quickstart.md`를 보완한다. (FR-006, FR-008 partial)
- [x] T019 [US2] versioned `ProtocolHandoff` 생성·검증 경계를 `src/orchestration/protocol-handoff.mjs`에 구현하고 `src/orchestration/workflow-executor.mjs`, contract, plan, test를 연결한다. (Plan Summary, ProtocolHandoff object partial)
- [x] T020 [US1] CAP persistence가 없는 자연어 요청을 `NEEDS_INPUT`으로 차단하고 `--db SQLITE|HANA` 및 원문 명시를 지원하도록 request normalization, plan gate, schema, Protocol 100 validation과 회귀 테스트를 동기화한다. (FR-019, SC-007)
