# Quickstart: Standard 앱 생성

## 사전 조건

- 001 quickstart로 `STANDARD` handoff 생성
- Node.js 20.11 이상, npm 8 이상
- output directory가 존재하지 않음

## 1. 조회 앱 생성

```powershell
npm run cli -- generate standard --handoff .tmp/quickstart/handoff.json --config tests/fixtures/generation/standard-grid.json --yes
```

기대 결과:

- List Report가 유일한 시작 target
- root EntitySet과 OData V4 model 연결
- Grid Table 결정 근거가 generation report에 기록
- 상세 조회가 요청된 경우 Object Page route 존재

## 2. Standard 수정 생성

```powershell
npm run cli -- generate standard --handoff tests/fixtures/handoffs/standard-edit.json --config tests/fixtures/generation/standard-object-edit.json --yes
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
npm test -- --run tests/integration/standard-generator.test.ts
npm run verify:generated -- .tmp/generated/quickstart-standard
```

`verify:generated`는 manifest/annotation XML parsing, mock preview smoke test와 UI5 build를 수행한다. 모든 필수 check가 성공해야 result status가 `VALIDATED`다.
