# CLI Contract: Custom 생성

## Command

```text
npm run generate -- --request <request>
                  --odata-url <odata-url>
                  [--metadata-file <metadata.xml>]
                  --type custom
                  [--flp-intent <semantic-object-action>]
                  [--output <directory>]
```

## Preconditions

- 001의 `CUSTOM` handoff version `1.0`
- root EntitySet과 property가 service metadata에서 resolve
- application 생성 요청과 output boundary 확인
- output project path가 존재하지 않음

## Result

- 성공: exit code `0`, Fiori Elements project, extension scaffold와 report
- reclassification 또는 추가 질문: exit code `2`, project 없음
- invalid metadata/XML/build: exit code `1`, 완료 project 없음

## Invariants

- Fiori Elements List Report target과 local annotation은 EntitySet metadata에서 생성
- `webapp/ext/ListReportExtension.js`는 003 handoff가 선택된 경우에만 생성
- extension scaffold는 공식 controller extension 위치를 사용
- `webapp/test/flpSandbox.html`, manifest inbound와 `npm start` URL fragment는 동일한 FLP intent를 사용
- 승인되지 않은 backend operation이나 custom control은 생성하지 않음
