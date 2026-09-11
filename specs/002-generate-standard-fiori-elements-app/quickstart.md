# Quickstart: Standard 앱 생성

## 사전 조건

- 001 protocol이 `STANDARD`로 판정할 수 있는 요청
- Node.js 20.11 이상, npm 8 이상
- output directory가 존재하지 않음

## 1. 조회 앱 생성

```powershell
npm run generate -- --request "Products 목록과 상세를 조회하는 Fiori application" --odata-url "https://service.example.test/odata/Products" --metadata-file tests/fixtures/sample-metadata.xml --output generated/products-standard
```

기대 결과:

- List Report가 유일한 시작 target
- root EntitySet과 OData V4 model 연결
- Responsive Table 결정 근거가 generation report에 기록
- 상세 조회가 요청된 경우 Object Page route 존재

`npm start`는 `fiori run`으로 `webapp/test/flpSandbox.html`을 열고 기본 intent인 `products-display`로 앱을 시작한다. FLP 없이 앱만 실행하려면 다음을 사용한다.

```powershell
npm run start-noflp
```

다른 FLP intent가 필요하면 생성 시 지정한다.

```powershell
npm run generate -- --request "Products 목록을 조회하는 Fiori application" --odata-url "https://service.example.test/odata/Products" --metadata-file tests/fixtures/sample-metadata.xml --flp-intent "cominnotekitembod-tile" --output generated/products-flp
```

## 2. Standard 수정 생성

```powershell
npm run generate -- --request "Products 조회와 상세를 제공하는 Fiori application" --odata-url "https://service.example.test/odata/Products" --metadata-file tests/fixtures/sample-metadata.xml --type standard --output generated/products-standard-edit
```

기대 결과:

- update capability가 확인된 경우 Object Page standard edit
- 수정 요구만으로 controller Extension을 생성하지 않음

## 3. 안전성 검증

동일 명령을 같은 output으로 다시 실행한다.

기대 결과:

- 기존 directory를 덮어쓰지 않고 실패
- 원본 project checksum 불변

## 4. 생성물 검증

```powershell
npm test
cd generated/products-standard
npm install
npm run lint
npm run build
```

`npm run lint`는 manifest/annotation/XML과 service binding을 검증하고, `npm run build`는 UI5 build를 수행한다. 모든 필수 check가 성공해야 결과를 검증 완료로 보고한다.
