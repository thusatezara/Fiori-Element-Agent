# Quickstart: Custom 앱 생성

## 사전 조건

- 001에서 생성한 approved `CUSTOM` handoff
- OData V4 snapshot에 root EntitySet과 필요한 annotation 존재
- Node.js 20.11 이상, npm 8 이상

## 1. Building Blocks 조합 생성

```powershell
npm run cli -- generate custom --handoff tests/fixtures/handoffs/custom-compose.json --config tests/fixtures/generation/custom-compose.json --yes
```

기대 결과:

- `sap.fe.core.fpm` entry target
- 생성된 `Main.view.xml`에 Page, Filter Bar, Table과 Form 영역
- 각 `metaPath`가 snapshot 또는 local annotation에 존재
- List Report target 없음

## 2. 제한적 direct region 생성

```powershell
npm run cli -- generate custom --handoff tests/fixtures/handoffs/custom-direct.json --config tests/fixtures/generation/custom-direct.json --yes
```

기대 결과:

- 승인된 region 하나에만 fragment/controller handler 생성
- 다른 영역은 Building Blocks 유지
- report에 표준 대안과 영향 기록

## 3. 생성물 검증

```powershell
npm test -- --run tests/integration/custom-generator.test.ts
npm run verify:generated -- .tmp/generated/quickstart-custom
```

manifest/XML/metaPath/OPA5 smoke/UI5 build가 모두 성공해야 `VALIDATED`다.
