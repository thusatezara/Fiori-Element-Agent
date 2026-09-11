# Quickstart: OData 요청에서 Fiori Application 생성

## 목적

하나의 OData metadata와 자연어 화면 요청으로 001의 분석·판정·runtime input·단일 handoff·결과 취합을 검증한다.

## 사전 조건

- Node.js 20.11 이상과 npm
- repository root에서 `npm test`가 통과
- local fixture metadata 또는 유효한 HTTPS OData endpoint
- output parent가 workspace boundary 안에 있고 project name이 비어 있음

## 1. 단일 요청으로 Standard 앱 생성

    npm run generate -- --request "목록과 상세를 조회하는 Fiori application" --odata-url "https://service.example.test/odata/Products" --metadata-file tests/fixtures/sample-metadata.xml --output generated/products

기대 결과:

- exit code 0
- ServiceSnapshot의 OData version, EntitySet, key와 property가 metadata와 일치
- assessment.selectedType이 STANDARD
- generation report의 selected protocol이 STANDARD → 002
- protocol.selectedGenerator가 002이고 다른 child generator dispatch가 없음
- 002가 생성한 Fiori application과 generation report가 output에 기록됨
- output에 request summary, snapshot summary, assessment, handoff와 generation report가 기록됨

## 2. 기본값으로 처리되는 일반 요청

    npm run generate -- --request "화면을 만들어줘" --odata-url "https://service.example.test/odata/Products" --metadata-file tests/fixtures/sample-metadata.xml --output generated/products-insufficient

기대 결과:

- 명시적인 유형 질문이 없어도 001이 `STANDARD` safe default를 적용함
- child generator는 002 하나만 호출됨
- 생성 결과와 판단 근거가 report에 기록됨

## 3. 세 유형 routing

| 요청 | 기대 유형 | child protocol |
|---|---|---|
| standard.json | STANDARD | 002 |
| custom.json | CUSTOM | 003 |
| freestyle.json | FREESTYLE | 004 |

각 실행에서 정확히 하나의 child adapter만 호출되고 선택 유형과 다른 project가 생기지 않아야 한다.

## 4. 재실행

OData URL 또는 fields만 변경하여 다른 output directory로 실행한다.

기대 결과:

- specs/001~004의 정적 Feature Spec 수가 변하지 않음
- 새 output에 request summary, snapshot summary와 generation report만 생성됨
- 이전 output 또는 metadata hash를 재사용하지 않음

## 5. 차단 조건

다음 입력에서는 앱 생성이 차단되어야 한다.

- metadata에 없는 field
- metadata fetch 또는 authentication failure
- 기존 output project
- path escape
- child contract version conflict
- blocking backend prerequisite

## 6. 전체 검증

    npm test

생성된 application에서 `npm install`, `npm run lint`, `npm run build`를 실행한다.

모든 필수 validation이 성공한 결과만 COMPLETED로 보고한다.
