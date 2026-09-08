# Implementation Plan: Fiori 애플리케이션 요청 유형 판정

**Branch**: `001-classify-fiori-app-request` | **Date**: 2026-09-08 | **Spec**: [spec.md](./spec.md)

**Input**: `specs/001-classify-fiori-app-request/spec.md`

## Summary

사용자의 비기술적 업무 요청과 OData V4 metadata를 정규화한 service snapshot을 입력받아 `STANDARD`, `CUSTOM`, `FREESTYLE` 또는 `UNDECIDED`를 결정하는 로컬 CLI workflow를 구현한다. 판정은 명시적인 규칙과 질문 catalog를 사용하며, 결과 승인 전에는 생성기를 호출하지 않는다. 승인된 결과는 002·003·004가 공통으로 소비하는 versioned JSON handoff로 전달한다.

## Technical Context

**Language/Version**: Node.js 20.11 이상, TypeScript 5.x, ECMAScript modules

**Primary Dependencies**: `commander`(CLI), `@inquirer/prompts`(대화형 질문), `zod`(runtime contract validation), `fast-xml-parser`(EDMX parsing), Node.js built-in `fetch`

**Storage**: DB 없음. 명시한 workspace 아래 `.fiori-agent/runs/<run-id>/`에 request, service snapshot, assessment, approval을 JSON으로 저장하며 secret은 저장하지 않는다.

**Testing**: Vitest unit/contract/integration tests, fixture EDMX, CLI process tests

**Target Platform**: Windows, macOS, Linux의 로컬 개발 환경

**Project Type**: 단일 Node.js CLI 애플리케이션과 생성기 모듈

**Performance Goals**: 5 MB 이하 EDMX의 local parsing과 최초 판정을 일반 개발 PC에서 2초 이내 완료하고, 추가 질문은 한 번에 최대 3개만 제시한다.

**Constraints**: OData V4 우선 지원, HTTPS 검증 우회 금지, 인증정보·header value 비저장, 승인 전 파일 생성 금지, output root 밖 쓰기 금지

**Scale/Scope**: 한 실행에서 하나의 service와 하나의 앱 요청, 최대 100 EntitySet과 2,000 property의 metadata

## Constitution Check

*GATE: Phase 0 이전 및 Phase 1 이후 재검토 완료.*

| 원칙 | 설계 반영 | 결과 |
|---|---|---|
| I. 명세 우선과 추적성 | `requirementIds`, rule evidence, handoff schema로 Spec→Plan→Task→결과를 연결한다. | PASS |
| II. 검증 가능성과 불확실성 | `UNDECIDED` 상태와 질문 catalog를 두고 확인되지 않은 capability를 prerequisite로 기록한다. | PASS |
| III. SAP 표준 우선과 Clean Core | Standard→Custom→FreeStyle 순서의 최소 자유도 규칙을 사용하고 OData V4 metadata를 사실 근거로 삼는다. | PASS |
| IV. 안전한 Agent 실행 | 승인 gate, output boundary, atomic directory creation, secret redaction을 적용한다. | PASS |
| V. 증거 기반 완료 | contract, fixture, CLI integration test 결과가 성공한 경우에만 완료한다. | PASS |

Phase 1 설계 후에도 위 원칙을 위반하는 예외는 없다.

## Project Structure

### Documentation (this feature)

```text
specs/001-classify-fiori-app-request/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── assessment.schema.json
│   ├── service-snapshot.schema.json
│   ├── handoff.schema.json
│   └── cli-contract.md
└── tasks.md
```

### Source Code (repository root)

```text
package.json
tsconfig.json
eslint.config.js
src/
├── cli/
│   ├── index.ts
│   └── commands/
│       ├── inspect.ts
│       ├── classify.ts
│       └── approve.ts
├── domain/
│   ├── request.ts
│   ├── assessment.ts
│   ├── handoff.ts
│   └── errors.ts
├── odata/
│   ├── input.ts
│   ├── fetch-metadata.ts
│   ├── parse-edmx.ts
│   └── service-snapshot.ts
├── classification/
│   ├── rules.ts
│   ├── question-catalog.ts
│   ├── classifier.ts
│   └── trace.ts
└── io/
    ├── run-store.ts
    ├── safe-path.ts
    └── redact.ts
tests/
├── fixtures/odata-v4/
├── contract/
├── integration/
└── unit/
```

**Structure Decision**: 하나의 TypeScript CLI 안에서 OData 입력, 판정, 승인과 후속 생성기의 공통 domain contract를 분리한다. 002~004는 `src/generation/` 아래에 추가되며 001의 immutable handoff와 service snapshot만 소비한다.

## Complexity Tracking

Constitution 위반 또는 예외 승인 사항이 없다.
