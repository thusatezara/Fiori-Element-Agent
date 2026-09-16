# 구현 계획: Protocol 200 MTA 솔루션 구성

**Branch**: `200-compose-mta-solution` | **Date**: 2026-09-11 | **Spec**: [spec.md](spec.md)

## Summary

Protocol 200은 000의 `PACKAGE` handoff와 검증된 generation result만 받아 target-neutral `MtaTopology`를 만들고, collision/schema/reference/boundary/secret 검증과 격리된 MTA build validation을 통과한 경우에만 checksum이 있는 `DeploymentArtifact`를 출력한다. 배포 target 확인과 외부 변경은 300에 위임한다. 구현 및 필수 검증 완료 후 registry 상태와 package executor를 `IMPLEMENTED`로 활성화했다.

## Technical Context

**Language/Version**: JavaScript ESM, Node.js >=20  
**Primary Dependencies**: Node.js 표준 library, 설치 여부와 version을 검증한 MTA build tool adapter; 신규 runtime dependency는 decision record 없이 추가하지 않음  
**Storage**: workspace 내 명시적 output directory와 JSON/YAML artifact; credential 저장 없음  
**Testing**: `node:test`, fixture 기반 contract/unit/integration test, package script `npm test`  
**Target Platform**: local Node.js protocol executor; 산출물 대상은 SAP BTP Cloud Foundry MTA  
**Project Type**: protocol-driven CLI/library module  
**Performance Goals**: 100개 module/resource topology의 정적 preflight를 2초 이내 완료(외부 build 시간 제외)  
**Constraints**: 검증된 generation result 필수, workspace boundary, deterministic output, overwrite 금지, no secret, no external change  
**Scale/Scope**: 단일 solution당 module/resource 합계 100개와 dependency edge 500개까지 검증

## Constitution Check

*GATE: Phase 0 전 및 Phase 1 후 재검토 완료.*

| Principle | 판정 | 근거 |
|-----------|------|------|
| I. 명세 우선과 추적성 | PASS | FR-001~018을 contracts 및 tasks에 연결한다. |
| II. 검증 가능성과 불확실성 | PASS | build tool/service availability를 가정하지 않고 차단 조건으로 둔다. |
| III. SAP 표준과 Clean Core | PASS | 표준 MTA descriptor와 managed service resource 연결을 사용한다. |
| IV. 안전한 Agent 실행 | PASS | secret 거부, boundary/overwrite gate, 외부 변경 금지를 강제한다. |
| V. 증거 기반 완료 | PASS | archive-ready는 schema/reference/build/checksum 증거가 모두 있어야 한다. |

Phase 1 후 계약 검토에서도 위 gate를 위반하는 예외는 없다.

## Project Structure

```text
specs/200-compose-mta-solution/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── composition-request.schema.json
│   └── composition-result.schema.json
├── checklists/requirements.md
└── tasks.md

src/composition/mta/
├── protocol.mjs
├── contract.mjs
├── component-result-adapter.mjs
├── input-validator.mjs
├── topology-composer.mjs
├── collision-detector.mjs
├── descriptor-renderer.mjs
├── build-adapter.mjs
└── composition-report.mjs

src/validation/mta-package.mjs
tests/mta-composition.test.mjs
tests/mta-package-contract.test.mjs
tests/fixtures/mta/
```

**Structure Decision**: 기존 `src/composition/mta/protocol.mjs` 경계 아래에 domain policy를 유지하고 공통 orchestration에 MTA 규칙을 인라인하지 않는다. build adapter는 argument array 기반으로 tool을 호출하고 shell string이나 credential을 받지 않는다.

## Phase 0: Research 결과

[research.md](research.md)에 target-neutral descriptor, validated generation result, deterministic topology, build adapter lifecycle 및 secret-free report 결정을 기록한다.

## Phase 1: Design & Contracts

- [data-model.md](data-model.md): request, result, topology, collision, build와 artifact 상태 전이
- [contracts/composition-request.schema.json](contracts/composition-request.schema.json): 000→200 handoff payload
- [contracts/composition-result.schema.json](contracts/composition-result.schema.json): 200→300 artifact/result payload
- [quickstart.md](quickstart.md): 외부 변경 없는 contract 및 fixture validation

## Implementation Gates

1. `ProtocolHandoff` version/protocol/dependency가 일치해야 한다.
2. 최소 하나의 `PASSED` generation result와 checksum이 있어야 한다.
3. secret scan, path boundary, collision preflight가 모두 통과해야 file write를 시작한다.
4. 기존 output은 fingerprint가 동일할 때만 재사용하고 다르면 차단한다.
5. 정적 검증과 실제 build validation이 모두 성공해야 `READY` artifact를 발급한다.
6. executor와 registry `IMPLEMENTED` 전환은 모든 task/test가 완료된 동일 변경에서 수행한다.

## Reusable CAP HANA Topology Decision

- BACKEND component는 checksum 검증 후 `package.json`의 production DB profile을 읽어 `HANA` 또는 `SQLITE` capability로 정규화한다.
- HANA CAP module 이름은 고정 예제가 아니라 `identity.applicationId`에서 `<id>-srv`, `<id>-db-deployer`, `<id>-db`로 파생한다.
- source는 composition output의 `backend/`에 staging하고 CAP production build 결과인 `backend/gen/srv`, `backend/gen/db`를 module path로 사용한다.
- MTAR 생성 후 staging에만 사용된 backend와 `gen/*`의 `node_modules`는 제거하고 archive, build output 및 lockfile만 보존한다.
- `<id>-db`는 `com.sap.xs.hdi-container`, offering `hana`, plan `hdi-shared`로 선언하며 300 preflight가 marketplace 가용성을 확인한다.
- Frontend proxy가 필요하면 검증된 component capability로만 전달하며 core runtime source에 endpoint를 하드코딩하지 않는다.
- 이 결정은 HDI container topology까지만 소유하며 HANA Cloud database instance provisioning은 수행하지 않는다.

## Complexity Tracking

Constitution 위반 또는 정당화가 필요한 비표준 확장은 없다.
