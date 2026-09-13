# 구현 계획: Protocol 300 Cloud Foundry 배포

**Branch**: `300-deploy-cloud-foundry` | **Date**: 2026-09-11 | **Spec**: [spec.md](spec.md)

## Summary

Protocol 300은 검증된 Protocol 200 artifact와 정확한 `api/org/space/stage`를 대상으로 read-only preflight를 수행하고, target/artifact/snapshot에 결속된 explicit approval 및 production 추가 승인을 검증한 뒤에만 idempotent deploy adapter를 호출한다. operation, health와 route 검증까지 성공해야 `SUCCEEDED`이며 timeout은 `UNKNOWN`이다. `DEFINED` 상태에서는 실제 `cf` command가 절대 실행되지 않는다.

## Technical Context

**Language/Version**: JavaScript ESM, Node.js >=20  
**Primary Dependencies**: Node.js 표준 library, 설치/version을 확인한 CF CLI와 MTA deployment plugin adapter; credential library 추가 없음  
**Storage**: secret-free local JSON snapshot/report와 in-process operation state; token/session material 저장 없음  
**Testing**: `node:test`, fake process adapter, fixture 기반 contract/integration/safety test  
**Target Platform**: SAP BTP Cloud Foundry environment  
**Project Type**: high-risk protocol executor/CLI adapter  
**Performance Goals**: local gate 판정 2초 이내; platform 조회/operation은 configurable timeout과 polling budget 적용  
**Constraints**: exact target, explicit intent/approval, PROD 추가 승인, no secret, no shell interpolation, no auto recovery  
**Scale/Scope**: 단일 MTA operation과 artifact가 선언한 application/service/route 검증

## Constitution Check

*GATE: Phase 0 전 및 Phase 1 후 재검토 완료.*

| Principle | 판정 | 근거 |
|-----------|------|------|
| I. 명세 우선과 추적성 | PASS | FR-001~021이 contract와 task에 연결된다. |
| II. 검증 가능성과 불확실성 | PASS | 확인 불가는 차단 또는 `UNKNOWN`이며 추측하지 않는다. |
| III. SAP 표준과 Clean Core | PASS | CF target/session 및 MTA operation의 표준 경계를 따른다. |
| IV. 안전한 Agent 실행 | PASS | exact target, explicit approval, production gate, secret 금지와 no-auto-recovery를 강제한다. |
| V. 증거 기반 완료 | PASS | operation/health/route evidence가 모두 있어야 성공이다. |

Phase 1 후 계약 재검토에서 위반이나 승인 필요한 예외는 없다.

## Project Structure

```text
specs/300-deploy-cloud-foundry/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── deployment-request.schema.json
│   └── deployment-result.schema.json
├── checklists/requirements.md
└── tasks.md

src/deployment/cloud-foundry/
├── protocol.mjs
├── contract.mjs
├── target-inspector.mjs
├── prerequisite-inspector.mjs
├── deployment-gate.mjs
├── cf-process-adapter.mjs
├── operation-tracker.mjs
├── deployment-validator.mjs
└── deployment-report.mjs

tests/cloud-foundry-deployment.test.mjs
tests/cloud-foundry-contract.test.mjs
tests/fixtures/cloud-foundry/
```

**Structure Decision**: domain inspection/gate/adapter를 `src/deployment/cloud-foundry`에 격리한다. orchestration은 versioned handoff와 top-level approval만 담당하며 CF policy를 복제하지 않는다. process adapter는 dependency injection으로 test에서 항상 fake를 사용한다.

## Phase 0: Research 결과

[research.md](research.md)에 exact target identity, two-stage approval, read-only prerequisite snapshot, idempotency/unknown, process isolation과 lifecycle 결정을 기록한다.

## Phase 1: Design & Contracts

- [data-model.md](data-model.md): target, preflight, approval, operation, validation/report 상태
- [contracts/deployment-request.schema.json](contracts/deployment-request.schema.json): 000/200→300 실행 요청
- [contracts/deployment-result.schema.json](contracts/deployment-result.schema.json): 300 결과 및 400이 참조할 배포 evidence
- [quickstart.md](quickstart.md): 실제 CF command 없는 문서/contract/safety validation

## Execution Gates

1. Protocol 200 artifact status, evidence와 현재 checksum이 모두 유효해야 한다.
2. canonical API/org/space가 active target과 정확히 일치해야 한다.
3. session/role, supported CLI/plugin, service plan/entitlement/quota가 확인되어야 한다.
4. intent와 approval이 현재 target/artifact/snapshot fingerprint에 결속되어야 한다.
5. `PROD`는 별도 production approval이 있어야 한다.
6. 실행 직전 재검증과 idempotency check가 통과해야 adapter를 1회 호출한다.
7. operation, health와 route evidence가 모두 성공이어야 최종 성공이다.
8. `DEFINED` 동안 gate 0에서 `NOT_IMPLEMENTED`로 차단하며 어떤 `cf` process도 만들지 않는다.

## Complexity Tracking

Constitution 위반 또는 승인 필요한 비표준 확장은 없다.
