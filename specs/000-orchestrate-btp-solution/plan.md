# Implementation Plan: BTP 솔루션 요청 orchestration 기반

**Branch**: `000-orchestrate-btp-solution` | **Date**: 2026-09-11 | **Spec**: [spec.md](./spec.md)

**Input**: `specs/000-orchestrate-btp-solution/spec.md`

## Summary

기존 001~004 Frontend 생성 흐름 위에 000 solution entry protocol을 추가한다. 000은 자연어 요청을 고정 scope로 정규화하고, 중앙 registry에서 001·100·200·300·400 protocol을 찾아 dependency-ordered `SolutionPlan`을 만든다. 이번 Feature는 plan과 handoff validation까지만 실행하며, 100·200·300·400의 외부 또는 생성 executor는 `DEFINED` 상태로 등록해 미구현 기능의 실행을 차단한다.

## Technical Context

**Language/Version**: Node.js 20 이상, ECMAScript modules

**Primary Dependencies**: Node.js built-in API만 사용하며 runtime dependency를 추가하지 않는다.

**Storage**: plan 결과 JSON은 stdout 또는 호출자 메모리로 반환하며, 명시된 output이 없는 한 저장하지 않는다.

**Testing**: Node.js test runner를 사용한 registry, scope 분류, dependency, approval gate와 기존 generation regression test

**Target Platform**: Windows·Linux local CLI; 후속 adapter는 SAP BTP Cloud Foundry와 SAP Build Work Zone을 대상

**Project Type**: protocol-driven CLI generator/orchestrator

**Performance Goals**: 일반적인 자연어 요청을 외부 I/O 없이 100ms 이내에 계획

**Constraints**: 기존 `npm run generate` 호환, 외부 변경 없음, credential 저장 없음, 요청별 Spec 생성 없음, 미구현 executor 실행 금지

**Scale/Scope**: 한 요청에서 최대 5개 scope와 dependency-ordered step 5개

## Constitution Check

*GATE: Phase 0 전과 Phase 1 설계 후 검토 완료.*

| 원칙 | 설계 반영 | 결과 |
|---|---|---|
| I. 명세 우선과 추적성 | 000 Spec, protocol descriptor, handoff contract와 task를 연결한다. | PASS |
| II. 검증 가능한 요구사항 | 모든 scope, dependency, gate와 상태를 JSON contract와 test로 검증한다. | PASS |
| III. SAP 표준 우선 | CAP 표준 layout, MTA 배포, HTML5 Apps content provider 경계를 후속 protocol에 고정한다. | PASS |
| IV. 안전하고 통제 가능한 실행 | 300·400은 외부 변경이며 target과 명시적 의도가 없으면 차단한다. 이번 Feature는 실행하지 않는다. | PASS |
| V. 증거 기반 품질 | 신규 contract test와 기존 Frontend regression test를 모두 통과해야 완료한다. | PASS |

## Project Structure

### Documentation (this feature)

```text
specs/000-orchestrate-btp-solution/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── solution-request.schema.json
│   ├── solution-plan.schema.json
│   └── protocol-handoff.schema.json
├── checklists/requirements.md
└── tasks.md
```

### Protocol documentation

```text
specs/
├── 001-classify-fiori-app-request/       # 기존 Frontend entry
├── 002-generate-standard-fiori-elements-app/
├── 003-generate-custom-fiori-elements-app/
├── 004-generate-freestyle-sapui5-app/
├── 100-generate-cap-application/         # DEFINED, executor pending
├── 200-compose-mta-solution/             # DEFINED, executor pending
├── 300-deploy-cloud-foundry/             # DEFINED, executor pending
└── 400-publish-work-zone/                 # DEFINED, executor pending
```

### Source Code (repository root)

```text
src/
├── cli/plan.mjs
├── orchestration/
│   ├── solution-request.mjs
│   ├── protocol-registry.mjs
│   ├── solution-plan.mjs
│   ├── protocol-handoff.mjs
│   ├── workflow-executor.mjs
│   └── approval-gate.mjs
├── generation/backend/cap/protocol.mjs
├── composition/mta/protocol.mjs
├── deployment/cloud-foundry/protocol.mjs
├── publication/work-zone/protocol.mjs
└── validation/solution-plan.mjs
tests/solution-plan.test.mjs
.codex/agents/
├── frontend-agent.toml
├── cap-agent.toml
├── deployment-agent.toml
└── work-zone-agent.toml
```

**Structure Decision**: 기존 `src/orchestration/generate.mjs`와 유형별 generator 위치를 이동하지 않는다. 000의 planning 모듈을 같은 orchestration boundary에 추가하고, 후속 domain은 각 source namespace의 protocol descriptor부터 만든다. protocol Spec은 중앙 `specs/`에 유지하며 Agent 파일은 복제 없이 해당 경로를 참조한다.

## Key Design Decisions

### Decision 1: 000은 workflow plan만 소유

000은 하위 domain의 생성 정책을 포함하지 않는다. scope 분류, protocol lookup, dependency, prerequisite와 결과 취합만 담당한다.

### Decision 2: registry가 routing의 실행 가능한 원본

Root `AGENTS.md`에는 mandatory entry와 governance만 둔다. 정확한 protocol ID, capability, 상태, risk level과 executor 존재 여부는 immutable registry가 제공한다.

### Decision 3: plan과 execution 분리

`npm run plan`은 항상 외부 변경 없이 `SolutionPlan`을 출력한다. `workflow-executor`는 모든 step이 implemented이고 prerequisite가 충족된 경우에만 executor를 호출할 수 있으며, 이번 Feature에서는 미구현 domain step을 구조화된 blocked 결과로 반환한다.

### Decision 4: dependency는 capability 기준

신규 CAP Backend와 Frontend가 함께 요청되면 Backend의 service contract가 Frontend보다 먼저 온다. PACKAGE는 생성 결과, DEPLOY_CF는 package, PUBLISH_WORK_ZONE은 deployment에 의존한다.

### Decision 5: 외부 변경은 별도 risk level

300과 400은 `EXTERNAL_CHANGE`로 표시한다. 계획에 명시적 intent와 완전한 target reference가 모두 있어야 ready가 될 수 있다. credential은 target reference에 포함하지 않는다.

## Complexity Tracking

Constitution 위반 또는 승인된 예외가 없다.
