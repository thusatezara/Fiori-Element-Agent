# Quickstart: FreeStyle 앱 생성

## 사전 조건

- 001에서 `FREESTYLE`로 판정된 runtime input
- OData V4 service snapshot
- Node.js 20.11 이상, npm 8 이상

## 1. 다단계 flow 생성

```powershell
npm run generate -- --request "Products 다단계 wizard와 client state를 제공하는 SAPUI5 application" --odata-url "https://service.example.test/odata/Products" --metadata-file tests/fixtures/sample-metadata.xml --type freestyle --output generated/products-freestyle
```

기대 결과:

- manifest route와 XML View/controller pair 생성
- metadata 기반 responsive table과 XML View/controller pair 생성
- OData model과 UI5 routing 연결
- UI annotation 기반 layout 생성 없음

## 2. 오류 복구 흐름 생성

```powershell
npm run generate -- --request "Products 입력 오류와 재시도 흐름을 가진 SAPUI5 application" --odata-url "https://service.example.test/odata/Products" --metadata-file tests/fixtures/sample-metadata.xml --type freestyle --output generated/products-freestyle-error
```

기대 결과:

- generated controller와 i18n 확장 지점을 제공
- service binding과 table columns는 metadata에서 생성

## 3. 생성물 검증

```powershell
npm test
cd generated/products-freestyle
npm install
npm run lint
npm run build
```

contract, route graph, generated QUnit scaffold, annotation 비의존 검사와 UI5 build가 성공해야 결과를 검증 완료로 보고한다. OPA5는 후속 검증 항목이다.
