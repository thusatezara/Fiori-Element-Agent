# CLI Contract: OData 기반 Fiori Application 생성

## Primary command

    npm run generate -- --request <natural-language-request>
                      --odata-url <entity-set-url>
                      [--metadata-file <local-edmx>]
                      [--entity-set <name>]
                      [--output <directory>]
                      [--type auto|standard|custom|freestyle]

`--request`는 자연어 업무 요청이고 `--odata-url`은 EntitySet URL 또는 service root다. 인증된 환경이 아니면 `--metadata-file`로 metadata를 제공할 수 있다.

## Execution flow

1. request, OData URL와 output boundary를 확인한다.
2. 001의 service inspection으로 metadata를 확인하고 service summary를 만든다.
3. 001의 classification policy로 selected type을 만든다.
4. 필수 정보가 없으면 질문 또는 차단 결과를 출력하고 앱 output을 만들지 않는다.
5. 선택 유형과 application 생성 요청으로 runtime generation input을 만든다.
6. selectedType을 STANDARD→002, CUSTOM→003, FREESTYLE→004로 매핑한다.
7. child request/result contract를 검증한 뒤 정확히 하나의 child generator를 호출한다.
8. child result, validation criteria, remaining risks와 completion state를 orchestration-result.json에 취합한다.

## Exit codes

- 0: child generation과 필수 validation 성공, COMPLETED
- 1: invalid input, contract violation, metadata failure, path failure, child failure 또는 validation failure
- 2: 추가 답변, 사용자 결정 또는 prerequisite 해결 필요. 앱 project는 생성하지 않음

## Direct request authorization

사용자가 자연어로 Fiori application 생성을 명시하고 safe default로 결과를 결정할 수 있으면 사용자 요청 자체를 local 새 output의 generation input으로 사용한다. 다음 항목이 결과를 바꾸면 별도 답변을 먼저 요구한다.

- STANDARD, CUSTOM, FREESTYLE 간 충돌
- 표시 field, EntitySet 또는 navigation을 metadata에서 확인할 수 없음
- EDIT, ACTION, DELETE, authorization 또는 transaction 요구
- 기존 output name 또는 path collision
- backend 또는 외부 시스템 변경 요구

## Preconditions and invariants

- serviceSource는 정확히 하나이며 URL은 HTTPS다.
- 001의 snapshot, assessment, generation input contract version을 확인한다.
- UNDECIDED, blocking prerequisite, stale metadata, unauthorized execution과 output collision이면 child generator를 호출하지 않는다.
- 한 실행에서 002, 003, 004 중 정확히 하나의 target만 dispatch한다.
- output은 지정된 새 project directory에만 만들고 기존 파일을 덮어쓰지 않는다.
- generation report는 새 application output 내부에만 쓴다.
- auth header value, token, password와 불필요한 business row data는 저장·log·result에 포함하지 않는다.

## Expected artifacts

    <output>/
    ├── fiori-agent-report.json
    ├── manifest.json
    ├── ui5.yaml
    └── webapp/

`fiori-agent-report.json`은 필요 최소 service summary와 metadata hash만 보존하며 credential, auth header와 원본 business row data를 포함하지 않는다.

유형별 앱 project 구조와 build 조건은 002, 003, 004의 contract가 소유한다.
