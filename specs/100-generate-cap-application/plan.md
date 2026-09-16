# Implementation Plan: CAP Backend 애플리케이션 생성

**Branch**: `100-generate-cap-application` | **Date**: 2026-09-11 | **Spec**: [spec.md](./spec.md)

**Input**: `specs/100-generate-cap-application/spec.md`

## Summary

000이 발행한 versioned `BACKEND` handoff를 검증한 뒤 CAP Node.js project의 `db/` domain model과 `srv/` public OData V4 service를 생성한다. 입력은 code가 아닌 structured domain/service/behavior contract로 제한하며, explicit projection, optional handler와 authorization annotation을 render한다. 생성물은 local SQLite로 compile, contract/handler test와 start smoke test를 수행하고 compile-derived service snapshot을 출력한다. 전체 pipeline은 credential scan과 workspace boundary를 통과한 staging에서 실행하고 성공한 새 directory만 final output으로 이동한다.

## Technical Context

**Language/Version**: generator는 Node.js 20 이상 ECMAScript modules; 생성물은 CAP Node.js와 CDS

**Primary Dependencies**: project-local `@sap/cds` 9.x compatible range, `@cap-js/sqlite`, HANA intent의 `@cap-js/hana`, reproducible production build용 devDependency `@sap/cds-dk`, Node.js built-in test runner, 기존 `src/generation/common` output transaction/report utilities

**Storage**: persistence intent는 필수 `SQLITE` 또는 `HANA`; `SQLITE`는 in-memory local/demo profile, `HANA`는 development SQLite와 production HANA profile을 생성하지만 100은 HANA binding/deploy를 수행하지 않음

**Testing**: Node.js test runner의 schema/contract/unit/integration test, `cds compile`, generated handler test, local HTTP metadata smoke test, credential scan

**Target Platform**: 로컬 workspace에서 project를 생성하는 CLI/executor; 생성 CAP server의 target은 Node.js runtime

**Project Type**: orchestration 하위의 local-write Backend generator

**Performance Goals**: dependency install 제외, entity 50개·service 10개·element 총 1,000개의 fixture를 10초 안에 plan/render; compile/start는 별도 check duration으로 보고

**Constraints**: `ProtocolHandoff 1.0` only, OData V4, Node.js only, 명시적 persistence 필수·default 금지, `db`/`srv`/`app` boundary, credential 0건, raw SQL 없음, 기존 output overwrite 없음, external change 없음

**Scale/Scope**: 한 handoff당 project 1개, domain entity 1~50개, service 1~10개, request size 2 MB 이하

## Constitution Check

*GATE: Phase 0 이전 및 Phase 1 이후 재검토 완료.*

| 원칙 | 설계 반영 | 결과 |
|---|---|---|
| I. 명세 우선과 추적성 | request의 stable requirement ID를 model/service/handler/file/check에 연결하고 result schema에 trace를 필수화한다. | PASS |
| II. 검증 가능성과 불확실성 | key, relation lifecycle, authorization와 destructive intent가 불명확하면 structured prerequisite로 차단한다. | PASS |
| III. SAP 표준과 Clean Core | standard aspect, managed association, projection, CAP event/CQL을 우선하고 raw SQL/database trigger를 생성하지 않는다. | PASS |
| IV. 안전하고 통제 가능한 실행 | credential scan, workspace boundary, new-directory guard, staging/atomic rename을 사용하고 external system을 변경하지 않는다. | PASS |
| V. 증거 기반 품질과 완료 | schema, compile, contract, handler, start와 snapshot consistency check가 모두 통과해야 `VALIDATED`다. | PASS |

Phase 1 설계 후에도 Constitution 예외는 없다. production HANA/identity 검증은 수행하지 않았음을 result prerequisite에 남긴다.

## Project Structure

### Documentation (this feature)

```text
specs/100-generate-cap-application/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── checklists/
│   └── requirements.md
├── contracts/
│   ├── cap-generation-request.schema.json
│   ├── cap-generation-result.schema.json
│   ├── service-snapshot.schema.json
│   └── executor-contract.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── cli/commands/generate-backend.mjs
├── generation/
│   ├── common/
│   │   ├── generator-contract.mjs
│   │   ├── output-transaction.mjs
│   │   ├── template-renderer.mjs
│   │   └── generation-report.mjs
│   └── backend/cap/
│       ├── protocol.mjs
│       ├── request-validator.mjs
│       ├── domain-plan.mjs
│       ├── service-plan.mjs
│       ├── behavior-plan.mjs
│       ├── service-snapshot.mjs
│       └── generator.mjs
├── orchestration/
│   ├── protocol-registry.mjs
│   └── workflow-executor.mjs
└── validation/
    └── generated-cap-project.mjs
templates/cap-nodejs/
├── package.json.hbs
├── README.md.hbs
├── db/schema.cds.hbs
├── srv/service.cds.hbs
├── srv/service.js.hbs
└── test/service.test.js.hbs
tests/
├── cap-generation-contract.test.mjs
├── cap-generation.test.mjs
└── cap-protocol-gate.test.mjs
```

**Structure Decision**: CAP-specific request interpretation, model/service/behavior plan과 snapshot은 `src/generation/backend/cap/`가 소유한다. 공통 renderer, report, credential guard와 output transaction만 `src/generation/common/`에서 재사용한다. template은 `templates/cap-nodejs/`에 두고 생성 결과에서 domain은 `db/`, service/handler는 `srv/`만 쓴다. `app/` UI는 만들지 않는다.

**Pipeline Decision**: validate specialized handoff → build immutable domain/service/behavior plan → render to staging → secret/static scan → install-independent CDS syntax/contract checks → generated-project dependency install in isolated test fixture → compile/test/start/snapshot checks → atomic rename → result/report 순서다. 어느 필수 단계든 실패하면 final directory와 completed capability를 만들지 않는다.

**Registry Decision**: mandatory test와 quickstart가 통과한 T034에서 `src/generation/backend/cap/protocol.mjs`의 executor를 연결하고 `IMPLEMENTED`로 동시에 전환했다. executor는 specialized handoff 전체를 받는 `invocation: HANDOFF` 계약을 사용한다.

**Persistence Decision**: 000이 `SQLITE` 또는 `HANA`를 명시적으로 확인한 handoff만 100에 전달한다. 누락된 persistence는 request validation에서 거부한다. `HANA` 선택은 local 검증용 development SQLite profile과 downstream 배포용 production HANA profile을 함께 생성한다.

## Requirement Traceability

| Spec 범위 | 설계 산출물 | 구현/검증 위치 |
|---|---|---|
| FR-001~004, FR-027~029 | request/result schema, executor contract | `request-validator.mjs`, protocol gate tests |
| FR-005~008 | DomainEntity model, standard aspect decision | `domain-plan.mjs`, generation tests |
| FR-009~18 | Service/Behavior/Snapshot contracts | `service-plan.mjs`, `behavior-plan.mjs`, snapshot tests |
| FR-019~022 | safe output pipeline | common output transaction integration, guard tests |
| FR-023~025 | required validation/result evidence | `generated-cap-project.mjs`, result contract tests |
| FR-026 | external-change exclusion | executor contract and negative integration tests |

## Complexity Tracking

Constitution 위반 또는 승인 필요한 예외가 없다.

