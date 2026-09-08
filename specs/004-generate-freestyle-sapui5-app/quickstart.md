# Quickstart: FreeStyle 앱 생성

## 사전 조건

- 001에서 생성한 approved `FREESTYLE` handoff
- OData V4 service snapshot
- Node.js 20.11 이상, npm 8 이상

## 1. 다단계 flow 생성

```powershell
npm run cli -- generate freestyle --handoff tests/fixtures/handoffs/freestyle-wizard.json --config tests/fixtures/generation/freestyle-wizard.json --yes
```

기대 결과:

- manifest route와 XML View/controller pair 생성
- 이전 단계 복귀 시 승인된 UI state 보존
- OData data와 named JSONModel UI state 분리
- UI annotation 기반 layout 생성 없음

## 2. 오류 복구 흐름 생성

```powershell
npm run cli -- generate freestyle --handoff tests/fixtures/handoffs/freestyle-error.json --config tests/fixtures/generation/freestyle-error.json --yes
```

기대 결과:

- input error는 edit, transport error는 retry, business error는 승인된 recovery로 연결
- message text는 i18n key 사용

## 3. 생성물 검증

```powershell
npm test -- --run tests/integration/freestyle-generator.test.ts
npm run verify:generated -- .tmp/generated/quickstart-freestyle
```

contract, route graph, QUnit, OPA5, annotation 비의존 검사와 UI5 build가 모두 성공해야 `VALIDATED`다.
