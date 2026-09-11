# CLI Contract: FreeStyle 생성

## Command

```text
npm run generate -- --request <request>
                  --odata-url <odata-url>
                  [--metadata-file <metadata.xml>]
                  --type freestyle
                  [--output <directory>]
```

## Preconditions

- 001의 `FREESTYLE` handoff version `1.0`
- EntitySet과 binding property가 service metadata에 존재
- application 생성 요청과 output boundary 확인
- backend responsibility를 client logic으로 대체하는 요청 없음
- output project path가 존재하지 않음

## Result

- 성공: exit code `0`, SAPUI5 MVC project와 `fiori-agent-report.json`
- reclassification 또는 추가 질문: exit code `2`, project 없음
- invalid graph/binding/build: exit code `1`, 완료 project 없음

## Invariants

- manifest의 default model은 metadata에 확인된 OData data source 사용
- XML View와 controller는 service primitive property를 binding
- layout/control 생성에 `UI.*` annotation path를 사용하지 않음
- Main View가 route에서 도달 가능하고 controller module이 resolve됨
- 확인되지 않은 backend operation handler를 생성하지 않음
