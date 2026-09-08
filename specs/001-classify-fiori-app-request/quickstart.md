# Quickstart: OData 요청 판정 및 승인

## 목적

fixture OData V4 metadata와 비기술적 요청으로 앱 유형을 판정하고 승인된 handoff를 만드는 end-to-end 검증 절차다.

## 사전 조건

- Node.js 20.11 이상과 npm 8 이상
- repository root에서 `npm ci` 완료
- `tests/fixtures/odata-v4/basic-service/metadata.xml` 존재

## 1. Metadata 검사

```powershell
npm run cli -- inspect --metadata tests/fixtures/odata-v4/basic-service/metadata.xml --run-dir .tmp/quickstart
```

기대 결과:

- `.tmp/quickstart/service-snapshot.json` 생성
- `odataVersion`이 `4.0`
- EntitySet, key, property와 operation이 원본 EDMX와 일치

## 2. 명확한 요청 판정

```powershell
npm run cli -- classify --request tests/fixtures/requests/standard-clear.json --service-snapshot .tmp/quickstart/service-snapshot.json --json
```

기대 결과:

- status `RECOMMENDED`
- recommendedType `STANDARD`
- 원문 requirement가 evidence 또는 prerequisite에 모두 추적됨

## 3. 모호한 요청 판정

```powershell
npm run cli -- classify --request tests/fixtures/requests/insufficient.json --service-snapshot .tmp/quickstart/service-snapshot.json --json
```

기대 결과:

- status `UNDECIDED`
- 기술 용어를 요구하지 않는 질문 1~3개
- handoff 파일 없음

## 4. 승인 gate 검증

```powershell
npm run cli -- approve --assessment .tmp/quickstart/assessment.json --request tests/fixtures/requests/standard-clear.json --service-snapshot .tmp/quickstart/service-snapshot.json --output-parent .tmp/generated --project-name quickstart-standard --yes
```

기대 결과:

- `handoff.json`이 [handoff schema](./contracts/handoff.schema.json)를 통과
- selectedType에 맞는 생성 명령 하나만 표시
- 기존 `.tmp/generated/quickstart-standard`가 있으면 덮어쓰지 않고 실패

## 5. 전체 검증

```powershell
npm test
npm run lint
npm run build
```

모든 명령이 성공해야 이 Feature를 완료로 판단한다.
