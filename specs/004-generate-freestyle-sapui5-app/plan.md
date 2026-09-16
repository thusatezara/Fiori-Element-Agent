# Implementation Plan: FreeStyle SAPUI5 애플리케이션 생성

**Branch**: `004-generate-freestyle-sapui5-app` | **Date**: 2026-09-08 | **Spec**: [spec.md](./spec.md)

**Input**: `specs/004-generate-freestyle-sapui5-app/spec.md`

## Summary

001에서 승인된 `FREESTYLE` handoff와 OData V4 service snapshot을 입력받아 manifest routing, `sap.f.DynamicPage` 기반 XML Views, controllers와 client-side state model을 직접 구성한 SAPUI5 앱을 생성한다. 각 화면은 `DynamicPageTitle`, pinnable `DynamicPageHeader`와 content aggregation을 명시적으로 가져 Standard 화면과 일관된 page shell을 제공한다. metadata는 data source와 binding path 검증에만 사용하고 UI annotation은 layout 또는 interaction 생성에 사용하지 않는다. 승인된 navigation, validation, error recovery만 생성하며 backend transaction을 client logic으로 대체하지 않는다.

## Technical Context

**Language/Version**: Node.js 20 이상, ECMAScript modules; 생성물은 JavaScript 기반 SAPUI5 XML View MVC 앱

**Primary Dependencies**: 001 공통 CLI/domain 및 002 공통 generation pipeline, Node.js built-in XML/JSON handling; 생성물은 stable UI5 CLI 4, `sap.f`, `sap.m`, `sap.ui.core`, `@sap/ux-ui5-tooling`

**Storage**: 새 project directory와 generation report; 생성 앱의 임시 UI state는 JSONModel, 업무 데이터는 OData V4 model

**Testing**: Node.js test runner contract/integration tests, generated QUnit controller unit test scaffold, optional OPA5 navigation/error journeys, UI5 build

**Target Platform**: 로컬 생성 및 브라우저 FLP sandbox preview

**Project Type**: Node.js CLI generator가 독립 SAPUI5 freestyle web application 출력

**Performance Goals**: fixture 기준 생성 5초 이내(설치 제외), 최대 5개 View와 15개 transition

**Constraints**: OData V4, XML Views, 모든 업무 화면의 `DynamicPage`/Title/Header/Content shell, async module pattern, annotation 기반 UI 생성 금지, backend rule/authorization/transaction 대체 금지, output 덮어쓰기 금지

**Scale/Scope**: 하나의 앱, 1~5개 화면, route graph 하나, app-level JSONModel 하나, 승인된 OData operations

## Constitution Check

*GATE: Phase 0 이전 및 Phase 1 이후 재검토 완료.*

| 원칙 | 설계 반영 | 결과 |
|---|---|---|
| I. 추적성 | screen, transition, state, validation과 handler를 requirement ID로 연결한다. | PASS |
| II. 검증 가능성 | route graph, state preservation, error recovery와 annotation 비의존을 자동 검증한다. | PASS |
| III. SAP 표준 우선 | 생성 전 Standard/Custom 충족 가능성을 재검사하고 공개 SAPUI5 controls/API만 사용한다. | PASS |
| IV. 안전한 실행 | 승인 gate, output boundary와 backend responsibility guard를 적용한다. | PASS |
| V. 증거 기반 완료 | QUnit/OPA5와 UI5 build를 통과한 결과만 완료한다. | PASS |

FreeStyle 자체는 더 표준적인 유형으로 충족되지 않는 승인 요청에 한정하므로 Constitution 예외가 아니다.

## Project Structure

### Documentation (this feature)

```text
specs/004-generate-freestyle-sapui5-app/
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
├── cli/commands/generate-freestyle.mjs
└── generation/freestyle/
    ├── flow-planner.mjs
    ├── state-planner.mjs
    ├── validation-planner.mjs
    ├── backend-boundary.mjs
    └── generator.mjs
templates/freestyle/
├── package.json.hbs
├── ui5.yaml.hbs
├── ui5-mock.yaml.hbs
└── webapp/
    ├── manifest.json.hbs
    ├── Component.js.hbs
    ├── view/App.view.xml.hbs
    ├── view/View.view.xml.hbs
    ├── view/Review.view.xml.hbs
    ├── controller/View.controller.js.hbs
    ├── controller/ErrorHandlers.js.hbs
    ├── model/models.js.hbs
    ├── i18n/i18n.properties.hbs
    └── test/
        ├── unit/Controller.qunit.js.hbs
        └── integration/FlowJourney.js.hbs
tests/
└── generate.test.mjs
```

**Structure Decision**: screen/transition/state plan을 먼저 검증한 뒤 화면별 XML/controller pair를 생성한다. 각 XML View는 `DynamicPage` root 아래 i18n heading과 snapped·expanded context를 가진 `DynamicPageTitle`, 화면 context를 가진 pinnable `DynamicPageHeader`, 업무 control을 가진 content를 동일한 순서로 구성한다. 화면 전역 primary action은 title action에 둔다. data access, UI state와 navigation 책임은 파일 단위로 분리한다.

**Application Output**: 기본 생성 경로는 `generated/<project-name>/`이며, 사용자가 지정한 output은 001의 workspace boundary와 collision guard를 따른다.

## Complexity Tracking

FreeStyle은 Standard/Custom 적합성 검사를 통과하지 못한 승인 요청에만 사용하므로 Constitution 예외는 없다. 각 생성 결과에 대안 검토와 유지보수 영향을 기록한다.
