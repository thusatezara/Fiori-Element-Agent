# CLI Contract: Standard 생성

## Command

```text
fiori-agent generate standard --handoff <handoff.json>
                              --config <standard-config.json>
                              [--yes]
```

## Preconditions

- handoff schema version `1.0`
- `selectedType=STANDARD`
- blocking prerequisite 없음
- root EntitySet과 지정 property/action이 service snapshot에 존재
- output project path가 아직 존재하지 않음
- interactive mode에서 생성 요약 승인

## Result

- 성공: exit code `0`, 새 project directory와 `generation-result.json`
- 사용자 결정 필요 또는 재판정: exit code `2`, project directory 없음
- invalid input/build failure: exit code `1`, 완료 project directory 없음

## Required generated surface

```text
<project>/
├── package.json
├── ui5.yaml
├── ui5-mock.yaml
└── webapp/
    ├── Component.js
    ├── manifest.json
    ├── localService/metadata.xml
    ├── annotations/annotation.xml
    └── i18n/i18n.properties
```

Object Page, mock data와 `webapp/ext/`는 승인된 decision에 따라 추가한다.
