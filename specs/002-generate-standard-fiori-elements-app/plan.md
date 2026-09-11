# Implementation Plan: Standard Fiori Elements 애플리케이션 생성

**Branch**: `002-generate-standard-fiori-elements-app` | **Date**: 2026-09-08 | **Spec**: [spec.md](./spec.md)

**Input**: `specs/002-generate-standard-fiori-elements-app/spec.md`

## Summary

001에서 승인된 `STANDARD` handoff와 OData V4 service snapshot을 입력받아 List Report를 시작 target으로 하는 독립 SAP Fiori elements 프로젝트를 생성한다. 기본 annotation이 부족하면 local annotation에 최소 `UI.LineItem`, `UI.SelectionFields`, `UI.HeaderInfo`, `UI.Facets`를 생성하며, metadata와 capability가 허용할 때 Object Page edit 또는 inline edit를 구성한다. Extension은 명시적으로 허용된 제한적 요구만 생성한다. 모든 Standard 결과에는 manifest inbound, `webapp/test/flpSandbox.html`과 `fiori run` 기반 FLP preview script를 함께 생성한다.

## Technical Context

**Language/Version**: Node.js 20 이상, ECMAScript modules; 생성물은 SAPUI5 OData V2/V4 애플리케이션

**Primary Dependencies**: 001 공통 CLI/domain 모듈, Node.js built-in XML/JSON parsing과 template renderer; 생성물은 stable UI5 CLI 4와 `@sap/ux-ui5-tooling` 기반 preview

**Storage**: 생성 대상의 새 project directory와 공통 run directory의 generation report; DB 없음

**Testing**: Node.js test runner contract/integration tests, JSON/XML parser validation, fixture OData V4 generation, generated-project validation과 선택적 UI5 build smoke test

**Target Platform**: 로컬 개발 환경에서 생성, 브라우저에서 SAP Fiori launchpad sandbox preview

**Project Type**: Node.js CLI generator가 독립 SAP Fiori elements web application을 출력

**Performance Goals**: fixture service 기준 생성 5초 이내(의존성 설치 제외), 5 MB metadata 입력 지원

**Constraints**: List Report가 유일한 시작 target, OData V4, backend/remote annotation 변경 금지, 표준 기능 우선, 기존 directory 덮어쓰기 금지

**Scale/Scope**: 한 번에 한 앱, root EntitySet 하나, 선택적 Object Page 하나, 제한적 공식 Extension 하나

## Constitution Check

*GATE: Phase 0 이전 및 Phase 1 이후 재검토 완료.*

| 원칙 | 설계 반영 | 결과 |
|---|---|---|
| I. 추적성 | generation decision과 report에 requirement ID 및 생성 파일을 연결한다. | PASS |
| II. 검증 가능성 | table/edit/extension 결정을 contract와 fixture test로 검증한다. | PASS |
| III. SAP 표준 우선 | List Report, Object Page, annotation을 먼저 사용하고 Extension은 별도 decision record가 있을 때만 허용한다. | PASS |
| IV. 안전한 실행 | 승인 handoff와 empty output directory를 요구하고 원격 service를 변경하지 않는다. | PASS |
| V. 증거 기반 완료 | manifest/XML 검사, mock preview, UI5 build를 통과한 결과만 완료한다. | PASS |

Phase 1 이후에도 예외는 없다.

## Project Structure

### Documentation (this feature)

```text
specs/002-generate-standard-fiori-elements-app/
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
├── cli/commands/generate-standard.mjs
├── generation/
│   ├── common/
│   │   ├── generator-contract.mjs
│   │   ├── output-transaction.mjs
│   │   ├── flp-navigation.mjs
│   │   ├── template-renderer.mjs
│   │   └── generation-report.mjs
│   └── standard/
│       ├── decision.mjs
│       ├── annotation-plan.mjs
│       ├── manifest-plan.mjs
│       ├── extension-policy.mjs
│       └── generator.mjs
├── orchestration/
│   └── generate.mjs
└── validation/
    ├── generated-project.mjs
    └── ui5-build.mjs
templates/standard/
├── package.json.hbs
├── ui5.yaml.hbs
├── ui5-mock.yaml.hbs
└── webapp/
    ├── manifest.json.hbs
    ├── Component.js.hbs
    ├── annotations/annotation.xml.hbs
    ├── i18n/i18n.properties.hbs
    ├── test/flpSandbox.html.hbs
    └── ext/ListReportExtension.js.hbs
tests/
└── generate.test.mjs
```

**Structure Decision**: 생성 과정은 decision → FLP intent plan → in-memory file plan → staging directory render → validation → atomic rename 순서로 수행한다. `src/generation/common/flp-navigation.mjs`가 Standard·Custom generator에서 intent와 Sandbox config를 공통으로 계산한다. Extension template은 기본 생성 경로와 분리한다. 기본 intent는 `<entity-set>-display`이며 CLI의 `--flp-intent`로 명시적으로 변경할 수 있다.

**FLP preview decision**: 로컬 개발용 physical `webapp/test/flpSandbox.html`을 유지하고 `fiori run --open`으로 진입한다. Sandbox config의 application key, `sap.app/crossNavigation.inbounds` key와 `npm start` URL fragment는 같은 intent를 사용한다. 운영 FLP/Work Zone 콘텐츠와 backend는 변경하지 않는다.

**Application Output**: 기본 생성 경로는 `generated/<project-name>/`이며, 001이 전달한 explicit `--output`은 workspace boundary와 empty-directory guard를 통과해야 한다.

## Complexity Tracking

Constitution 위반 또는 승인된 예외가 없다.
