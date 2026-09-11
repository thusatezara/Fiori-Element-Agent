# Implementation Plan: Fiori 애플리케이션 요청 분석·판정·생성

**Branch**: 001-fiori-request-orchestration-and-generation | **Date**: 2026-09-09 | **Spec**: spec.md

## Summary

001을 OData 기반 Fiori 애플리케이션 생성의 단일 진입 프로토콜로 구현한다. 입력 정규화와 OData metadata inspection을 먼저 수행하고, service 사실과 사용자 요구를 분리하여 유형을 판정한다. 판정 이후에는 runtime generation input을 만들고, STANDARD·CUSTOM·FREESTYLE 중 정확히 하나의 하위 프로토콜로 handoff한다. 생성 결과와 검증 결과는 application output의 generation report로 취합한다.

legacy Orchestrator 계층은 만들지 않는다. legacy 실행 상태, generation input, routing과 result aggregation 책임은 001의 orchestration runtime에 편입한다.

## Technical Context

**Language/Version**: Node.js 20 이상, ECMAScript modules

**Primary Dependencies**: Node.js built-in fetch, fs/promises, path, crypto; generated apps use `@ui5/cli` and `@sap/ux-ui5-tooling`

**Storage**: DB 없음. 생성 application 안의 generation report에 secret이 제거된 request summary, service summary, assessment, handoff, child result와 validation을 저장한다.

**Target Platform**: Windows, macOS, Linux의 local development environment

**Project Type**: Node.js CLI orchestrator와 유형별 Fiori application generator

**Supported Service**: OData V2/V4 metadata와 primitive property 기반 생성. 해석할 수 없는 metadata는 차단한다.

**Safety Constraints**: HTTPS 검증 유지, auth header value 비저장, output boundary 외 쓰기 금지, 기존 결과 덮어쓰기 금지, backend·배포 변경 금지

**Execution Mode**: 사용자가 명시적으로 Fiori application 생성을 요청한 경우, 001의 안전한 기본값으로 generation input을 확정할 수 있으면 동일 요청 안에서 생성·검증까지 진행한다. 결과를 바꾸는 미결정 사항이 있으면 최대 3개의 질문 후 멈춘다.

**Application Output**: 생성 application은 repository root의 `generated/<project-name>/`에 기본 출력한다. 사용자가 `--output`을 지정하면 workspace 내부의 비어 있는 directory만 허용하며, `examples/`는 특정 service를 보존하는 검증 산출물에만 사용한다.

## Constitution Check

| 원칙 | 설계 반영 | 결과 |
|---|---|---|
| I. 명세 우선과 추적성 | 001을 단일 활성 Spec으로 두고 FR·SC·task·run artifact를 연결한다. | PASS |
| II. 검증 가능한 요구사항 | UNDECIDED, NEEDS_INPUT, BLOCKED와 구조화된 validation criteria를 사용한다. | PASS |
| III. SAP 표준 우선 | 001은 유형을 판정하고, 세부 구현은 002~004의 표준·공식 extension 정책에 위임한다. | PASS |
| IV. 안전한 실행 | metadata read-only 확인, secret redaction, output boundary, collision guard를 적용한다. | PASS |
| V. 증거 기반 품질 | contract, unit, integration, build와 run validation 결과를 완료 기준으로 사용한다. | PASS |

## Architecture

    Natural-language request
            │
            ▼
    src/cli/index.mjs
    src/cli/generate.mjs
    src/cli/commands/
            │
            ▼
    src/orchestration/generate.mjs
       ├── request normalization
       ├── service inspection
       ├── business question gate
       ├── classification
       ├── runtime generation input
       ├── collision / prerequisite gate
       ├── one-generator handoff registry
       └── result aggregation
            │
            ├── STANDARD ──► src/generation/standard/generator.mjs
            ├── CUSTOM ────► src/generation/custom/generator.mjs
            └── FREESTYLE ─► src/generation/freestyle/generator.mjs

001은 하위 generator template을 소유하지 않는다. 공통 contract와 output transaction은 `src/generation/common/`에 두고, 유형별 decision·planner·generator와 template은 각 하위 protocol 경계에 둔다. 001은 `handoff.mjs`의 allowlist에서 정확히 하나의 generator만 호출하고 결과 contract를 검증한다.

## Project Structure

### Documentation

    specs/001-classify-fiori-app-request/
    ├── spec.md
    ├── plan.md
    ├── research.md
    ├── data-model.md
    ├── quickstart.md
    ├── traceability.md
    ├── validation.md
    ├── checklists/requirements.md
    └── contracts/
        ├── service-snapshot.schema.json
        ├── assessment.schema.json
        ├── handoff.schema.json
        ├── orchestration-request.schema.json
        ├── generation-input.schema.json
        ├── orchestration-result.schema.json
        └── cli-contract.md

### Source Code

    package.json
    src/
    ├── cli/
    │   ├── index.mjs
    │   ├── generate.mjs
    │   └── commands/
    ├── orchestration/
    │   ├── generate.mjs
    │   ├── service-inspection.mjs
    │   ├── assessment.mjs
    │   └── handoff.mjs
    ├── generation/
    │   ├── common/
    │   ├── standard/
    │   ├── custom/
    │   └── freestyle/
    └── validation/
    templates/
    ├── standard/
    ├── custom/
    └── freestyle/
    tests/
    ├── fixtures/sample-metadata.xml
    └── generate.test.mjs

## Key Design Decisions

### Decision 1: 001을 단일 진입점으로 통합

OData 요청 분석과 실행 orchestration을 하나의 001 Feature로 관리한다. 유형 판정과 하위 protocol handoff 사이의 context 손실을 줄이고, 사용자가 어떤 OData 요청을 보내도 항상 동일한 진입 규칙을 적용할 수 있다.

### Decision 2: service facts와 user intent 분리

OData metadata는 immutable ServiceSnapshot으로 정규화하고, 자연어 요청과 답변은 AppRequest 및 Requirement로 보존한다. 판정 결과에는 두 출처의 evidence를 분리해 기록한다.

### Decision 3: runtime input은 protocol handoff

정적 Spec은 정책을 소유하고, OData URL·field·답변·output은 runtime input과 application의 generation report로 전달한다. OData별로 specs 디렉터리를 생성하지 않는다.

### Decision 4: 단일 dispatch registry

STANDARD→002, CUSTOM→003, FREESTYLE→004의 allowlist registry를 사용한다. 한 실행에서 한 target만 호출되도록 adapter가 guard한다.

### Decision 5: 명시적 생성 요청과 질문 gate

사용자가 application 생성을 직접 요청하고 safe default로 결과를 결정할 수 있으면 해당 요청을 local 새 output의 generation input으로 사용한다. 편집·삭제·action·권한·외부 변경 또는 유형 충돌처럼 결과를 바꾸는 정보가 부족하면 생성 전에 질문한다.

### Decision 6: child generator contract 분리

002~004는 각자의 template, UI 정책, build 조건을 소유한다. 001은 child request/result contract를 검증하고 생성 결과를 취합한다. 현재 구현은 Node.js ESM과 dependency-free template renderer를 사용하며, 유형별 정책을 001에 복제하지 않는다.

## Implementation Order

1. project CLI, contract와 safe I/O를 준비한다.
2. OData V2/V4 input, parser와 ServiceSnapshot을 구현한다.
3. deterministic classifier와 single handoff를 구현한다.
4. generation input, collision/prerequisite gate와 atomic output을 구현한다.
5. 002~004 generator output과 validator를 연결한다.
6. generic fixture와 실제 OData 예제로 lint/build evidence를 기록한다.

## Complexity Tracking

001 내부의 orchestration 계층은 legacy Orchestrator Feature를 대체하기 위한 통합 경계다. 유형별 UI template과 정책을 복제하지 않으며, 별도 예외 승인은 없다.
