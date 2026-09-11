# CLI Contract: Standard 생성

## Command

```text
npm run generate -- --request <request>
                  --odata-url <odata-url>
                  [--metadata-file <metadata.xml>]
                  [--type standard]
                  [--flp-intent <semantic-object-action>]
                  [--output <directory>]
```

## Preconditions

- handoff schema version `1.0`
- `selectedType=STANDARD`
- blocking prerequisite 없음
- root EntitySet과 지정 property/action이 service snapshot에 존재
- output project path가 아직 존재하지 않음
- 001 handoff와 application 생성 요청 확인

## Result

- 성공: exit code `0`, 새 project directory와 `fiori-agent-report.json`
- 사용자 결정 필요 또는 재판정: exit code `2`, project directory 없음
- invalid input/build failure: exit code `1`, 완료 project directory 없음

## Required generated surface

```text
<project>/
├── package.json
├── ui5.yaml
├── scripts/validate.mjs
└── webapp/
    ├── Component.js
    ├── manifest.json
    ├── test/flpSandbox.html
    ├── annotations/annotation.xml
    └── i18n/i18n.properties
```

List Report와 Object Page target은 service EntitySet에 맞춰 생성하며 `webapp/ext/`는 Standard protocol의 승인된 extension decision이 있을 때만 추가한다.

`--flp-intent`가 없으면 `<entity-set>-display`를 사용한다. 동일한 intent가 `package.json`의 `start` URL fragment, `webapp/test/flpSandbox.html`의 application key와 `sap.app/crossNavigation.inbounds`에 있어야 한다.
