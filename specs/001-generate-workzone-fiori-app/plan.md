# 구현 계획: Work Zone 배포 준비가 완료된 Standard Fiori Elements 프로젝트 생성

**Branch**: `master` | **Date**: 2026-09-06 | **Spec**: [spec.md](./spec.md)

**Input**: `specs/001-generate-workzone-fiori-app/spec.md`

## 요약

사용자가 입력한 OData service URL과 화면 요구사항을 분석하여 구현 방식을 분류하고, 승인된 경우 Standard Fiori Elements 프로젝트와 local annotation, Work Zone 설정 및 MTA build 설정을 재현 가능하게 생성한다. 구조는 **C안: 결정론적 TypeScript Core CLI + Agent Workflow**로 고정한다. Core CLI가 입력 검증, metadata 조회, 분류, 생성, 검증 및 handoff 산출을 담당하고, Agent는 사용자 승인과 후속 Spec Kit 작업의 반복 조정을 담당한다.

## 기술 컨텍스트

**Language/Version**: Core CLI는 TypeScript 5.x와 Node.js 22 LTS 이상, 생성되는 Fiori Elements 앱은 JavaScript 기본

**Primary Dependencies**: `@sap-ux/fiori-elements-writer`, `@sap-ux/fiori-annotation-api`, `@sap-ux/cf-deploy-config-writer`, `ajv`; 버전은 구현 시 검증 후 exact pin

**Storage**: DB 없음. 실행 상태와 보고서는 `.fiori-agent/runs/<run-id>/`의 JSON 파일, 생성 결과는 승인된 대상 디렉터리

**Testing**: Node.js built-in test runner, JSON Schema contract test, OData metadata fixture 기반 integration test, 임시 디렉터리 E2E test

**Target Platform**: Windows, Linux, SAP Business Application Studio의 Node.js 환경

**Project Type**: 단일 TypeScript CLI 패키지와 생성되는 SAPUI5/Fiori Elements 애플리케이션

**Performance Goals**: 로컬 fixture 기반 판정 및 dry-run 10초 이내, 네트워크 제외 프로젝트 생성·정적 검증 60초 이내

**Constraints**: 자격 증명 미수집, unauthenticated `$metadata`만 조회, 실제 `cf deploy` 제외, 새 디렉터리 또는 빈 디렉터리에만 생성, shell interpolation 금지

**Scale/Scope**: 실행당 OData service root 1개, main entity 1개, Fiori Elements 프로젝트 1개; 요구사항별 분류와 후속 handoff는 복수 허용

## Constitution Check

*Gate: Phase 0 시작 전 및 Phase 1 설계 후 재검토. 두 시점 모두 PASS.*

| 원칙 | 판정 | 계획의 근거 |
|---|---|---|
| I. 명세 우선과 추적성 | PASS | `requirementId`를 assessment, handoff, validation까지 유지하고 이후 Tasks에서 FR/SC를 연결한다. |
| II. 검증 가능한 요구사항과 명시적 불확실성 | PASS | JSON Schema, 상태 전이, 실패 코드, quickstart 시나리오로 결과를 관찰 가능하게 한다. 인증·backend 변경은 임의 추정하지 않는다. |
| III. SAP 표준 우선과 Clean Core | PASS | SAP Fiori tools의 공개 `@sap-ux` writer/API와 Fiori Elements 표준 기능을 우선한다. Extension/Custom Page/Freestyle은 자동 구현하지 않고 handoff한다. |
| IV. 안전하고 통제 가능한 Agent 실행 | PASS | 승인 digest, staging 생성, 대상 충돌 거부, 무자격 metadata 조회, 배포 제외, 명령 allowlist를 적용한다. |
| V. 증거 기반 품질과 완료 | PASS | contract/unit/integration/E2E 검증과 `validation-report.json`을 필수 산출물로 정의한다. 필수 항목이 모두 `VERIFIED`일 때만 완료한다. |

## 아키텍처

```text
GenerationRequest
      │
      ▼
Agent Orchestrator ── 사용자 승인 / 질문 / 후속 Spec Kit loop
      │ JSON 계약
      ▼
TypeScript Core CLI
  ├─ input + URL policy
  ├─ metadata client
  ├─ feasibility classifier
  ├─ Fiori Elements generator
  ├─ local annotation writer
  ├─ Work Zone/MTA config writer
  ├─ build + validation runner
  └─ state/report/handoff writer
      │
      ├─ generated-project/
      ├─ validation-report.json
      └─ feature-handoffs/*.json
```

Agent는 Core CLI의 JSON 결과만을 근거로 승인과 후속 작업을 조정한다. Core CLI는 Agent process를 생성하거나 Spec Kit 명령을 직접 실행하지 않는다. 이 경계로 같은 입력과 승인 상태에 대한 생성 결과를 반복 검증할 수 있게 한다.

## 실행 수명주기

1. `assess`: 입력 schema와 URL 정책을 검증하고 `$metadata`를 조회한 뒤 각 요구사항을 분류한다.
2. `approve`: 사람이 확인할 canonical approval summary의 `approvalDigest`를 승인 상태에 기록한다.
3. `generate`: 승인 digest가 현재 요청과 일치할 때 같은 volume의 staging 디렉터리에 프로젝트를 생성한다.
4. `verify`: 구조, manifest, annotation, launchpad/MTA 설정과 `mbt build`를 검증한다. 모든 필수 검증이 통과하면 같은 명령의 원자적 마지막 단계에서 staging 결과를 새 대상 또는 확인된 빈 대상에 finalize한다.
5. `resume`: 중단된 run의 상태와 입력 digest를 검사하여 안전한 단계부터 재개한다.

## 프로젝트 구조

### 이 기능의 문서

```text
specs/001-generate-workzone-fiori-app/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── cli-contract.md
│   ├── cli-envelope.schema.json
│   ├── generation-request.schema.json
│   ├── assessment-report.schema.json
│   ├── feature-handoff.schema.json
│   ├── run-state.schema.json
│   └── validation-report.schema.json
└── checklists/
    └── requirements.md
```

`tasks.md`는 다음 `$speckit-tasks` 단계에서만 생성한다.

### 구현 예정 소스

```text
src/
├── cli/
│   ├── main.ts
│   └── commands/
├── contracts/
├── domain/
│   ├── classification.ts
│   ├── run-state.ts
│   └── approval.ts
├── infrastructure/
│   ├── metadata-client.ts
│   ├── sap-writers.ts
│   ├── process-runner.ts
│   └── file-store.ts
└── workflows/
    ├── assess.ts
    ├── generate.ts
    ├── verify.ts
    └── resume.ts

tests/
├── contract/
├── fixtures/metadata/
├── integration/
├── unit/
└── e2e/
```

**Structure Decision**: CLI entry, 도메인 판정, 외부 SAP/파일/프로세스 adapter, workflow를 분리한다. 생성되는 Fiori 프로젝트는 CLI 소스 안에 포함하지 않고 테스트 fixture 또는 실행 결과로만 취급한다.

## 핵심 설계 결정

### Metadata와 인증 경계

- 사용자가 service root 또는 `$metadata` URL을 직접 입력한다.
- `https`를 기본 허용하고 local test에 한해 loopback `http`를 허용한다.
- URL user-info, 비 HTTP(S), cross-origin redirect를 거부하며 timeout과 응답 크기 제한을 적용한다.
- 인증 header와 credential을 받지 않는다. `401`/`403`은 `BLOCKED_BY_AUTH`로 종료하고 인증 지원용 별도 Spec handoff를 만든다.

### 구현 가능성 분류

- `STANDARD`: 단순 CRUD 등 Fiori Elements 표준 기능으로 충족.
- `LOCAL_ANNOTATION`: UI 표현 변경을 app-local annotation으로 충족.
- `EXTENSION`: non-draft 일괄 수정, virtual field, 지연 batch, controller validation/action 등 extension 필요.
- `CUSTOM_PAGE`: 동일 OData service와 Fiori Elements shell/context를 유지하되 표준 floorplan/extension만으로 핵심 interaction을 표현할 수 없는 UI.
- `FREESTYLE_SAPUI5`: 연결 entity가 없거나 여러 entity를 독립·복합 조회해 pivot 등 비정형 화면을 구성.
- `BACKEND_CHANGE_REQUIRED`: service 계약, business logic, transaction, authorization 또는 필요한 데이터를 frontend만으로 제공할 수 없음.

우선순위는 backend blocker를 먼저 판정하고, 그다음 architecture decision, Custom Page, Extension, local annotation, Standard 순으로 적용한다. 한 요구사항에는 대표 classification 하나를 기록하되 근거와 복수 신호는 별도 배열로 보존한다.

### 생성과 rollback

- output path가 존재하며 비어 있지 않으면 실패한다. overwrite 옵션은 제공하지 않는다.
- 같은 filesystem의 run별 staging 경로에 생성하고 검증 후 rename/finalize한다.
- 실패 시 기존 파일을 변경하지 않으며 staging과 로그를 보존해 재현 가능하게 한다.
- 승인 summary를 canonical JSON으로 직렬화한 SHA-256 digest가 달라지면 재승인을 요구한다.

### Build와 배포 경계

- 본 Spec은 Work Zone 배포 준비 파일 생성과 `mbt build`를 통한 `.mtar` 검증까지 담당한다.
- `mbt`는 외부 prerequisite이며 자동 설치하지 않는다. 미설치나 non-zero exit는 명시적 실패다.
- `cf login`, `cf deploy`, production 변경은 수행하지 않는다. 실제 배포는 별도 Spec/승인 프로세스로 분리한다.

### Agent loop handoff

- `EXTENSION`, `CUSTOM_PAGE`, `BLOCKED_BY_AUTH`는 종류별 후속 Spec 후보 JSON을 만든다.
- `BACKEND_CHANGE_REQUIRED`는 backend contract와 담당자 결정 전 현재 run을 block한다.
- `FREESTYLE_SAPUI5`는 현재 Fiori Elements 생성과 다른 architecture decision으로 보낸다.
- Agent는 handoff를 읽어 Spec Kit의 `specify → clarify/checklist → plan → tasks → analyze → implement → converge` loop를 조정하지만, 새 Spec 생성이나 구현은 각각 별도 사용자 승인 범위에서 진행한다.

## 검증 전략

- Contract: 모든 입력/출력 JSON이 `contracts/*.schema.json`을 통과해야 한다.
- Unit: 분류 규칙, URL 정책, canonical serialization 기반 `approvalDigest`, 상태 전이, path 안전성을 table-driven test로 검증한다.
- Integration: OData V4 metadata fixture, 401/403, redirect, timeout, malformed XML을 재현한다.
- Generator: 생성된 `manifest.json`, local annotation reference, navigation, launchpad/MTA 설정을 구조적으로 검사한다.
- E2E: 임시 디렉터리에서 `assess → approve → generate → verify(성공 시 finalize)`와 중단 후 `resume`을 검증한다.
- Build: 설치된 환경에서는 `mbt build` 성공과 `.mtar` 존재를 확인한다. 도구가 없으면 성공으로 간주하지 않는다.

## Phase 0/1 산출물

- 기술 조사와 선택 근거: [research.md](./research.md)
- 도메인 및 상태 모델: [data-model.md](./data-model.md)
- CLI/JSON 계약: [contracts/](./contracts/)
- 구현 후 검증 절차: [quickstart.md](./quickstart.md)

## 요구사항 추적

| Spec | 설계 및 검증 연결 |
|---|---|
| FR-001~005, FR-021, FR-027, SC-003/010 | `GenerationRequest`, URL policy, metadata client, contract 및 auth/error integration test |
| FR-006~008, FR-024~034 | 분류 규칙, `RequirementAssessment`, 우선순위, `FeatureHandoff`, table-driven classification test |
| FR-009~010 | `ApprovalSummary` canonical digest와 `approve → generate` 상태 gate |
| FR-011~014, FR-022 | SAP writer adapter, local annotation API, manifest/navigation/config 구조 검사 |
| FR-015, SC-004 | same-volume staging, non-empty target 거부, rollback E2E |
| FR-016~017, FR-023, SC-006 | UI build, `mbt build`, `.mtar` 및 digest 검증 |
| FR-018~019, SC-007/010 | no-deploy/no-credential 계약, process allowlist, 로그 redaction test |
| FR-020, FR-026, SC-001/002/005/008/009 | run state와 최종 validation report의 completeness invariant |

## Complexity Tracking

Constitution 위반 또는 승인된 예외 없음.
