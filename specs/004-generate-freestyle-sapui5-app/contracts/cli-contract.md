# CLI Contract: FreeStyle 생성

## Command

```text
fiori-agent generate freestyle --handoff <handoff.json>
                               --config <freestyle-config.json>
                               [--yes]
```

## Preconditions

- approved `FREESTYLE` handoff version `1.0`
- screen/transition graph valid
- binding property와 operation이 service snapshot에 존재
- backend responsibility를 client logic으로 대체하는 요청 없음
- output project path가 존재하지 않음

## Result

- 성공: exit code `0`, 독립 SAPUI5 MVC project와 report
- reclassification 또는 추가 질문: exit code `2`, project 없음
- invalid graph/binding/build: exit code `1`, 완료 project 없음

## Invariants

- manifest의 default model은 OData V4 data source 사용
- UI-only state는 named JSONModel 사용
- layout/control 생성에 `UI.*` annotation path를 사용하지 않음
- 모든 View가 route에서 도달 가능하고 각 controller module이 resolve됨
- 확인되지 않은 backend operation handler를 생성하지 않음
