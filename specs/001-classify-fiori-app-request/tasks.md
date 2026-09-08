# Tasks: Fiori 애플리케이션 요청 유형 판정

**Input**: `specs/001-classify-fiori-app-request/`의 spec, plan, research, data-model, contracts

**Tests**: Constitution과 Spec의 Independent Test를 만족하도록 test-first로 작성한다.

## Phase 1: Setup

- [ ] T001 Node.js 20.11+ TypeScript ESM 프로젝트와 scripts를 `package.json`에 구성
- [ ] T002 TypeScript build 설정을 `tsconfig.json`에 구성
- [ ] T003 [P] ESLint 설정을 `eslint.config.js`에 구성
- [ ] T004 [P] Vitest 설정과 공통 test setup을 `vitest.config.ts`와 `tests/setup.ts`에 구성
- [ ] T005 CLI entry point와 `bin` 연결을 `src/cli/index.ts`와 `package.json`에 구성

## Phase 2: Foundational

- [ ] T006 [P] AppRequest와 Requirement runtime schema를 `src/domain/request.ts`에 구현
- [ ] T007 [P] Assessment runtime schema를 `src/domain/assessment.ts`에 구현
- [ ] T008 [P] Handoff runtime schema를 `src/domain/handoff.ts`에 구현
- [ ] T009 [P] 구조화된 error와 exit code mapping을 `src/domain/errors.ts`에 구현
- [ ] T010 output root 경계와 symlink escape 검사를 `src/io/safe-path.ts`에 구현
- [ ] T011 [P] URL·header·error의 secret redaction을 `src/io/redact.ts`에 구현
- [ ] T012 run artifact의 atomic write와 checksum을 `src/io/run-store.ts`에 구현
- [ ] T013 OData V4 최소/annotation/action fixture를 `tests/fixtures/odata-v4/`에 추가

**Checkpoint**: 공통 contract, 안전한 I/O와 fixture가 준비되어 각 User Story를 시작할 수 있다.

## Phase 3: User Story 1 - 비기술적 업무 요청의 앱 유형 추천 (P1) 🎯 MVP

**Goal**: 업무 요청과 service 사실을 이용해 세 유형 중 하나와 설명 가능한 근거를 추천한다.

**Independent Test**: `STD-01`, `CUS-01`, `FRE-01` fixture가 각각 기대 유형과 근거를 반환한다.

- [ ] T014 [P] [US1] assessment와 service snapshot JSON Schema contract test를 `tests/contract/assessment-contract.test.ts`와 `tests/contract/service-snapshot-contract.test.ts`에 작성
- [ ] T015 [P] [US1] EDMX parser unit test를 `tests/unit/odata/parse-edmx.test.ts`에 작성
- [ ] T016 [P] [US1] 세 유형 대표 판정 test를 `tests/unit/classification/classifier.test.ts`에 작성
- [ ] T017 [US1] local file/HTTPS metadata 입력과 환경변수 header 처리를 `src/odata/input.ts`와 `src/odata/fetch-metadata.ts`에 구현
- [ ] T018 [US1] OData V4 schema, EntitySet, property, navigation, operation parser를 `src/odata/parse-edmx.ts`에 구현
- [ ] T019 [US1] source hash와 capability evidence를 포함한 snapshot 생성을 `src/odata/service-snapshot.ts`에 구현
- [ ] T020 [US1] Standard/Custom/FreeStyle 최소 자유도 규칙을 `src/classification/rules.ts`에 구현
- [ ] T021 [US1] evidence와 requirement trace 생성을 `src/classification/trace.ts`에 구현
- [ ] T022 [US1] deterministic recommendation orchestration을 `src/classification/classifier.ts`에 구현
- [ ] T023 [US1] `inspect`와 `classify` command를 `src/cli/commands/inspect.ts`, `src/cli/commands/classify.ts`에 연결
- [ ] T024 [US1] local EDMX→유형 추천 CLI integration test를 `tests/integration/classify-cli.test.ts`에 작성하고 통과

**Checkpoint**: 명확한 비기술 요청을 독립적으로 판정하고 설명할 수 있다.

## Phase 4: User Story 2 - 불충분하거나 충돌하는 요청 구체화 (P2)

**Goal**: 부족하거나 충돌하는 요청을 미결정으로 유지하고 필요한 업무 질문만 제시한다.

**Independent Test**: `INS-01`, `AMB-01`, `AMB-02`가 1~3개 질문을 반환하고 충분한 답변 후 하나의 추천으로 전환된다.

- [ ] T025 [P] [US2] 질문 우선순위와 반복 방지 test를 `tests/unit/classification/question-catalog.test.ts`에 작성
- [ ] T026 [P] [US2] 충돌·재판정 integration test를 `tests/integration/clarification-loop.test.ts`에 작성
- [ ] T027 [US2] 비기술적 질문 catalog와 조건을 `src/classification/question-catalog.ts`에 구현
- [ ] T028 [US2] 충돌 탐지, 미결정 유지와 답변 merge를 `src/classification/classifier.ts`에 구현
- [ ] T029 [US2] interactive/non-interactive answer 입력을 `src/cli/commands/classify.ts`에 구현
- [ ] T030 [US2] 이전 답변과 service fact를 재질문하지 않는 regression test를 `tests/integration/no-repeat-question.test.ts`에 작성하고 통과

**Checkpoint**: US2는 미리 준비한 request/snapshot fixture로 US1 UI 없이 독립 검증할 수 있다.

## Phase 5: User Story 3 - 판정 검토·승인 및 생성 요청 전달 (P3)

**Goal**: 승인 전 생성을 막고 승인 후 정확히 하나의 versioned handoff를 만든다.

**Independent Test**: prepared `CUSTOM` assessment fixture가 승인 전에는 handoff를 만들지 않고 승인 후 Custom handoff 하나를 만든다.

- [ ] T031 [P] [US3] handoff JSON Schema contract test를 `tests/contract/handoff-contract.test.ts`에 작성
- [ ] T032 [P] [US3] approval gate와 stale approval test를 `tests/unit/classification/approval.test.ts`에 작성
- [ ] T033 [US3] recommendation summary와 explicit approval state transition을 `src/classification/approval.ts`에 구현
- [ ] T034 [US3] immutable handoff 생성과 blocking prerequisite 검사를 `src/classification/handoff.ts`에 구현
- [ ] T035 [US3] `approve` command와 output intent 검증을 `src/cli/commands/approve.ts`에 구현
- [ ] T036 [US3] 미승인/승인 end-to-end test를 `tests/integration/approval-handoff.test.ts`에 작성하고 통과

**Checkpoint**: 각 생성기는 독립 fixture handoff로 P3를 검증할 수 있다.

## Phase 6: Polish & Cross-Cutting

- [ ] T037 [P] FR-001~FR-021 trace matrix를 `specs/001-classify-fiori-app-request/traceability.md`에 작성
- [ ] T038 [P] malformed XML, HTTP failure, redirect와 oversized EDMX test를 `tests/integration/odata-input-errors.test.ts`에 추가
- [ ] T039 secret redaction과 output boundary security test를 `tests/integration/security-boundary.test.ts`에 추가
- [ ] T040 `specs/001-classify-fiori-app-request/quickstart.md`의 모든 명령을 실행하고 결과를 `specs/001-classify-fiori-app-request/validation.md`에 기록

## Dependencies & Execution Order

- Phase 1 → Phase 2가 모든 Story를 차단한다.
- US1, US2, US3는 Phase 2 이후 fixture를 이용해 독립 구현 가능하다.
- 실제 사용자 흐름 통합은 US1 → US2 → US3 순서다.
- 002~004는 T008, T012, T019, T034가 완료된 후 시작한다.

## Parallel Opportunities

- T003/T004, T006~T009/T011, 각 Story의 test task는 병렬 가능하다.
- Phase 2 후 판정 rule, 질문 loop, approval handoff를 서로 다른 파일에서 병렬 구현할 수 있다.

## Implementation Strategy

1. Phase 1~2 완료
2. US1만 구현해 local EDMX→유형 추천 MVP 시연
3. US2로 실제 대화형 구체화 추가
4. US3로 승인된 generator handoff 완성
5. quickstart와 security boundary 검증 후 002로 진행
