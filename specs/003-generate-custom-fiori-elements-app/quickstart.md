# Quickstart: Custom 앱 생성

## 사전 조건

- 001에서 `CUSTOM`으로 판정된 runtime input
- OData V4 snapshot에 root EntitySet과 필요한 annotation 존재
- Node.js 20.11 이상, npm 8 이상

## 1. Building Blocks 조합 생성

```powershell
npm run generate -- --request "Products 목록에 제한된 공식 extension을 추가한 Fiori application" --odata-url "https://service.example.test/odata/Products" --metadata-file tests/fixtures/sample-metadata.xml --type custom --output generated/products-custom
```

기대 결과:

- `sap.fe.core.fpm` Custom Page와 별도 View target
- Filter Bar/Table Building Block과 local annotation/service context 연결
- Standard List Report 선행 target 없음
- 003 handoff와 화면 영역 책임이 generation report에 기록

`npm start`는 `fiori run`으로 `webapp/test/flpSandbox.html`을 열고 기본 `<entity-set>-display` intent로 시작한다. FLP 없이 실행하려면 다음을 사용한다.

```powershell
npm run start-noflp
```

## 2. 제한적 direct region 생성

```powershell
npm run generate -- --request "Products 목록의 제한된 custom column extension" --odata-url "https://service.example.test/odata/Products" --metadata-file tests/fixtures/sample-metadata.xml --type custom --output generated/products-custom-extension
```

기대 결과:

- direct region fragment/controller scaffold가 별도 `webapp/ext/` 영역에 생성
- 기본 Building Block 영역은 표준 template 유지
- report에 001 → 003 handoff와 client-only boundary 기록

## 3. 생성물 검증

```powershell
npm test
cd generated/products-custom
npm install
npm run lint
npm run build
```

manifest/XML/metaPath static validation과 UI5 build가 성공해야 결과를 검증 완료로 보고한다. OPA5는 후속 검증 항목이다.
