# CLI Contract: Custom 생성

## Command

```text
fiori-agent generate custom --handoff <handoff.json>
                            --config <custom-config.json>
                            [--yes]
```

## Preconditions

- approved `CUSTOM` handoff version `1.0`
- root context와 모든 Building Block path가 service snapshot에서 resolve
- direct interaction이 있으면 책임·대안·검증 조건이 승인됨
- output project path가 존재하지 않음

## Result

- 성공: exit code `0`, 독립 Custom Page project와 report
- reclassification 또는 추가 질문: exit code `2`, project 없음
- invalid metadata/XML/build: exit code `1`, 완료 project 없음

## Invariants

- entry target의 component name은 `sap.fe.core.fpm`
- entry target의 `viewName`이 생성 XML View와 일치
- `sap.fe.templates.ListReport` target을 암묵적으로 생성하지 않음
- Building Block `contextPath`/`metaPath`가 snapshot/local annotation에서 확인됨
