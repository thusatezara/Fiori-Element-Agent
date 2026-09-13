# Quickstart: CAP Backend protocol 검증

이 문서는 protocol 100 구현 후 재현할 validation 시나리오다. 현재 descriptor는 `DEFINED`이며 아래 command가 구현·통과하고 registry가 `IMPLEMENTED`로 전환되기 전에는 실행 가능한 protocol이 아니다.

## 사전 조건

- Node.js 20 이상과 npm
- 000의 `ProtocolHandoff 1.0` 형식을 따르는 fixture
- dependency 설치가 가능한 승인된 개발 환경
- credential, production data와 remote target이 없는 local workspace

## 1. Protocol gate 확인

```powershell
npm test -- --test-name-pattern "CAP protocol gate"
```

구현 전 기대 결과:

- registry의 protocol 100은 `status=DEFINED`, `executor=null`이다.
- 000 plan은 BACKEND step을 `NOT_IMPLEMENTED`로 표시한다.
- 직접 실행 또는 잘못된 version handoff는 project file 없이 차단된다.

구현 완료 전환 후 기대 결과:

- 모든 mandatory task와 validation이 통과한 같은 변경에서만 `status=IMPLEMENTED`와 executor가 함께 등록된다.
- valid 000 handoff만 executor에 도달한다.

## 2. 최소 CRUD project 생성

fixture `tests/fixtures/cap/cap-crud-01.handoff.json`은 business object 이름을 예제로만 담고 core protocol에는 포함하지 않는다.

```powershell
npm run generate:backend -- --handoff tests/fixtures/cap/cap-crud-01.handoff.json
```

기대 결과:

- `generated/<project-name>/db/schema.cds`
- `generated/<project-name>/srv/service.cds`
- `generated/<project-name>/package.json`
- `generated/<project-name>/test/service.test.js`
- `generated/<project-name>/cap-generation-report.json`
- report가 참조하는 metadata와 `service-snapshot.json`
- UI source, MTA, binding 또는 credential file 없음

`service-snapshot.json`은 [service-snapshot.schema.json](./contracts/service-snapshot.schema.json)을 통과하고 compiled public model과 일치해야 한다.

## 3. 업무 규칙과 authorization 검증

```powershell
npm run generate:backend -- --handoff tests/fixtures/cap/cap-rules-01.handoff.json
npm run generate:backend -- --handoff tests/fixtures/cap/cap-auth-01.handoff.json
```

각 generated project에서 다음을 실행한다.

```powershell
npm install
npm run compile
npm test
npm run validate
```

기대 결과:

- valid action은 하나의 transaction으로 완료된다.
- validation failure는 stable error code를 반환하고 data를 일부 commit하지 않는다.
- mocked role의 허용/거부 결과가 authorization intent와 일치한다.
- local start smoke test가 metadata를 반환한다.

## 4. 안전 guard 검증

```powershell
npm test -- --test-name-pattern "CAP generation guard"
```

다음 사례는 모두 `BLOCKED`이며 final output을 만들지 않아야 한다.

- protocol ID 또는 version 불일치
- missing entity key 또는 unresolved relationship lifecycle
- unsupported runtime
- credential-like key/value 또는 authorization header 포함
- workspace 밖 output 또는 path traversal
- 이미 존재하는 output directory

secret fixture에는 실제 secret을 사용하지 않고 detector가 credential-like로 분류하는 명백한 placeholder만 memory에서 구성한다. 입력 원문 값은 snapshot이나 test output에 남기지 않는다.

## 5. Repository validation

```powershell
npm test
npm run lint
```

추가 contract validation:

```powershell
Get-ChildItem specs/100-generate-cap-application/contracts/*.json | ForEach-Object { Get-Content -Raw $_.FullName | ConvertFrom-Json | Out-Null }
```

## 완료 판정

- request/result/snapshot schema contract test 통과
- `CAP-CRUD-01`, `CAP-RULES-01`, `CAP-AUTH-01`, `CAP-GUARD-01`, `CAP-CONTRACT-01` 통과
- compile, handler/authorization test, local start와 snapshot consistency 통과
- 생성물과 report의 credential scan 0건
- existing output 손상 0건
- HANA, XSUAA/IAS와 Cloud Foundry는 검증하지 않았다고 report에 명시
- 위 조건을 모두 만족한 뒤에만 protocol descriptor를 `IMPLEMENTED`로 전환
