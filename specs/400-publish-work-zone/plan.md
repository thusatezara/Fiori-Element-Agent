# Implementation Plan: SAP Build Work Zone 게시

**Branch**: `400-publish-work-zone` | **Date**: 2026-09-11 | **Spec**: [spec.md](./spec.md)

**Input**: `specs/400-publish-work-zone/spec.md`

## Summary

Protocol 400은 성공한 Protocol 300 result, 확인된 Work Zone edition·subaccount·site·content target, manifest의 `sap.app/id`·`sap.cloud/service`와 선택된 navigation inbound를 read-only preflight에서 검증한다. mutation은 target과 operation 집합에 결합된 publish approval을 통과한 뒤 확인된 edition adapter에만 위임한다. 현재 단계에서는 계약과 구현 task만 완성하며 registry의 `DEFINED` 상태를 유지해 실제 Work Zone 변경을 차단한다.

## Technical Context

**Language/Version**: Node.js 20 이상, ECMAScript modules

**Primary Dependencies**: Node.js built-in API와 edition별 port/adapter interface; 실제 SAP interface client 선택은 구현 시 지원 상태를 재확인하며 runtime dependency를 사전 확정하지 않는다.

**Storage**: request와 result는 호출자 메모리 또는 명시된 report output으로 반환한다. credential은 저장하지 않고 idempotency는 credential 없는 target·desired-state fingerprint로 판정한다.

**Testing**: Node.js test runner를 사용한 JSON contract, unit, adapter contract, integration test; 외부 mutation test는 fake adapter가 기본이며 실제 tenant 검증은 별도 승인된 sandbox에서만 수행한다.

**Target Platform**: local protocol executor와 SAP Build Work Zone `STANDARD`/`ADVANCED` edition adapter

**Project Type**: protocol-driven external publication adapter

**Performance Goals**: local fixture preflight 100건을 1초 이내에 검증하고, 외부 verification은 adapter별 bounded timeout과 operation evidence를 반환한다.

**Constraints**: 성공한 300 result 필수, edition 자동 선택 금지, target/operation-bound approval, `sap.cloud.service`와 navigation intent 검증, read-only/mutation 분리, 승인 밖 resource 변경 금지, credential 저장 금지, destructive operation 제외

**Scale/Scope**: 한 request에 application 1개, 선택된 inbound 1개, site/content target 1개와 최대 7개 승인 operation

## Constitution Check

*GATE: Phase 0 전과 Phase 1 설계 후 검토 완료.*

| 원칙 | 설계 반영 | 결과 |
|---|---|---|
| I. 명세 우선과 추적성 | FR 24개를 request/result schema, adapter contract와 task에 연결한다. | PASS |
| II. 검증 가능한 요구사항 | stable blocking code, mutation call count, operation status와 navigation/visibility evidence로 판정한다. | PASS |
| III. SAP 표준 우선 | edition별 지원 interface는 adapter 뒤에 격리하고 확인되지 않은 edition 또는 비공개 API를 추정하지 않는다. | PASS |
| IV. 안전하고 통제 가능한 실행 | preflight와 mutation을 분리하고 exact approval, credential redaction, destructive operation 제외, `DEFINED` 실행 차단을 적용한다. | PASS |
| V. 증거 기반 품질 | contract/unit/integration test와 승인된 sandbox evidence 전에는 `IMPLEMENTED`로 전환하지 않는다. | PASS |

Phase 1 재검토 결과도 동일하며 Constitution 위반 또는 승인 예외가 없다.

## Project Structure

### Documentation (this feature)

```text
specs/400-publish-work-zone/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── work-zone-publication-request.schema.json
│   ├── work-zone-publication-result.schema.json
│   └── edition-publisher.contract.md
├── checklists/requirements.md
└── tasks.md
```

### Source Code (future implementation boundary)

```text
src/publication/work-zone/
├── protocol.mjs
├── request-validator.mjs
├── manifest-validator.mjs
├── approval-gate.mjs
├── operation-planner.mjs
├── publisher.mjs
├── result.mjs
├── visibility-validator.mjs
└── adapters/
    ├── standard.mjs
    └── advanced.mjs
src/validation/work-zone-publication.mjs
tests/
├── work-zone-publication-contract.test.mjs
├── work-zone-publication.test.mjs
├── work-zone-publisher-adapter.test.mjs
└── fixtures/work-zone/
```

**Structure Decision**: orchestration은 000 handoff와 registry gate만 유지한다. Work Zone 대상 검증, operation policy, edition adapter와 결과 생성은 `src/publication/work-zone/`이 소유하고 공통 validation entry만 `src/validation/`에 둔다. edition 차이는 adapter 내부로 제한하며 protocol core가 administration flow를 추정하지 않는다.

## 설계 결정

### Decision 1: read-only preflight가 MVP

외부 mutation 없이 300 dependency, exact target, manifest identity와 navigation을 검증하는 slice를 먼저 구현한다. 이 단계만으로 잘못된 게시 요청을 안전하게 차단할 수 있다.

### Decision 2: target·operation-bound approval

approval은 단순 boolean이 아니라 edition/subaccount/site/contentTarget과 정렬된 requested operation의 fingerprint에 결합한다. request가 바뀌면 기존 승인은 재사용하지 않는다.

### Decision 3: edition은 입력이며 전략 선택 기준

`STANDARD`와 `ADVANCED`를 capability detection으로 추정하지 않는다. confirmed edition에 해당하는 adapter만 선택하고 지원되지 않는 operation은 게시 전에 차단한다.

### Decision 4: manifest/deployment identity coherence

`sap.app/id`, `sap.cloud/service`, manifest digest와 selected inbound를 300 deployment evidence에 묶는다. canonical intent는 `#<semanticObject>-<action>`이며 여러 inbound가 있으면 handoff가 하나를 명시해야 한다.

### Decision 5: desired-state operation과 보수적 recovery

각 mutation은 현재 상태와 desired state를 비교해 `NO_CHANGE` 또는 실행 대상으로 판정한다. partial failure를 숨기거나 destructive rollback하지 않고 완료·실패·미실행 operation과 recovery guidance를 반환한다.

### Decision 6: protocol status 전환은 별도 gate

문서와 local test 완성만으로 registry를 변경하지 않는다. edition별 adapter, authorization/target inspection, integration test와 승인된 sandbox evidence가 모두 있어야 `DEFINED → IMPLEMENTED` 변경 task를 수행한다.

## 요구사항 추적

| 요구사항 | 설계/계약 | 주요 Task |
|---|---|---|
| FR-001~FR-006 | request schema, request validator, dependency/target preflight | T005~T011 |
| FR-007~FR-010 | manifest validator, preflight checks | T008, T012~T015 |
| FR-011~FR-16 | approval gate, operation planner, edition adapter contract | T006, T016~T024 |
| FR-017~FR-021 | publisher state machine, visibility validator, result schema | T025~T034 |
| FR-022~FR-024 | secret scan, protocol gate, sandbox evidence | T007, T021, T035~T039 |

## Complexity Tracking

Constitution 위반 또는 승인된 예외가 없다.
