# Implementation Plan: Custom Fiori Elements 애플리케이션 생성

**Branch**: `003-generate-custom-fiori-elements-app` | **Date**: 2026-09-08 | **Spec**: [spec.md](./spec.md)

**Input**: `specs/003-generate-custom-fiori-elements-app/spec.md`

## Summary

001에서 승인된 `CUSTOM` handoff와 OData V4 service snapshot을 입력받아 `sap.fe.core.fpm` Custom Page를 유일한 시작 target으로 구성한다. 화면 영역은 Page, Filter Bar, Table, Form 등 Fiori elements Building Blocks로 우선 생성하고, 표준 요소로 표현되지 않는 승인된 제한적 interaction만 controller/fragment에 배치한다. Standard List Report를 선행 생성하지 않는다.

## Technical Context

**Language/Version**: Node.js 20.11 이상, TypeScript 5.x; 생성물은 SAPUI5 OData V4 Custom Page

**Primary Dependencies**: 001 공통 CLI/domain 및 002 공통 output transaction/template renderer, `zod`, XML/JSON renderer; 생성물은 stable UI5 CLI 4, `sap.fe.core`, `sap.fe.macros`, `@sap/ux-ui5-tooling`

**Storage**: 새 project directory와 generation report; DB 없음

**Testing**: Vitest contract/snapshot tests, XML namespace와 `metaPath` validation, OPA5 smoke journey, UI5 build

**Target Platform**: 로컬 생성 및 브라우저 FLP sandbox preview

**Project Type**: Node.js CLI generator가 독립 Fiori elements Custom Page application 출력

**Performance Goals**: fixture 기준 생성 5초 이내(설치 제외), 최대 10개 화면 영역과 5개 Building Block

**Constraints**: OData V4 전용, 별도 View target, List Report 선행 생성 금지, 확인된 annotation/metaPath만 사용, 직접 구성 영역 allowlist

**Scale/Scope**: 한 Custom Page, root context 하나, Filter Bar/Table/Form/Page building blocks, 제한적 direct interaction 하나

## Constitution Check

*GATE: Phase 0 이전 및 Phase 1 이후 재검토 완료.*

| 원칙 | 설계 반영 | 결과 |
|---|---|---|
| I. 추적성 | 각 화면 영역과 Building Block/direct region을 requirement ID로 연결한다. | PASS |
| II. 검증 가능성 | metaPath, routing target, View/controller 책임과 재판정 조건을 자동 검증한다. | PASS |
| III. SAP 표준 우선 | Custom Page와 Building Blocks를 우선하고 direct region은 승인된 차이에만 사용한다. | PASS |
| IV. 안전한 실행 | 승인 gate, output boundary, remote service 불변을 적용한다. | PASS |
| V. 증거 기반 완료 | XML/manifest 검사, OPA5 smoke, UI5 build 성공이 완료 조건이다. | PASS |

Phase 1 이후에도 예외는 없다.

## Project Structure

### Documentation (this feature)

```text
specs/003-generate-custom-fiori-elements-app/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── generation-request.schema.json
│   ├── generation-result.schema.json
│   └── cli-contract.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── cli/commands/generate-custom.ts
└── generation/custom/
    ├── decision.ts
    ├── region-planner.ts
    ├── building-block-planner.ts
    ├── direct-region-policy.ts
    └── generator.ts
templates/custom/
├── package.json.hbs
├── ui5.yaml.hbs
├── ui5-mock.yaml.hbs
└── webapp/
    ├── manifest.json.hbs
    ├── Component.js.hbs
    ├── ext/view/Main.view.xml.hbs
    ├── ext/controller/Main.controller.js.hbs
    ├── annotations/annotation.xml.hbs
    └── i18n/i18n.properties.hbs
tests/
├── contract/custom-generation.test.ts
├── integration/custom-generator.test.ts
├── integration/custom-build.test.ts
└── unit/custom/
```

**Structure Decision**: 002의 공통 atomic generation pipeline을 재사용하되 Custom-specific screen plan과 template은 독립 모듈로 둔다. controller file은 direct interaction이 없으면 최소 shell만 생성한다.

## Complexity Tracking

승인된 direct region은 Constitution III가 허용하는 공식 extension 범위이며 위반 예외는 없다. 각 사용에는 standard 대안, 선택 이유, 영향과 검증 방법을 기록한다.
