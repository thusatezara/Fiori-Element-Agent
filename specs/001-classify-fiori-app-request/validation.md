# Validation: Fiori 애플리케이션 요청 분석·판정·생성

## Documentation validation

- 001 spec, plan, tasks, data-model과 contracts가 동일한 단일 진입점과 routing을 사용한다.
- 005 본문 문서는 제거하고 superseded README로 대체했다.
- .specify/feature.json이 활성 feature directory를 001로 가리킨다.
- AGENTS.md가 OData + Fiori 생성 요청을 001로 강제한다.
- STANDARD→002, CUSTOM→003, FREESTYLE→004 mapping이 spec, plan, tasks, contract와 traceability에 일치한다.
- generation input, safe default, 질문 gate와 output collision 기준이 서로 일치한다.
- check-prerequisites.ps1가 FEATURE_DIR을 specs/001-classify-fiori-app-request로 반환했다.
- 001 contracts의 JSON parse가 성공했다.
- 001 tasks가 고정 protocol, runtime과 validation 범위를 추적한다.
- FR-001~FR-036이 traceability.md의 coverage inventory에 포함된다.

## Implementation validation

상태: 실행됨

    npm test

generic OData fixture에 대해 하나의 001 entry point에서 Standard → 002, Custom → 003,
Freestyle → 004 결과를 생성했다. 각 결과에서 `npm run lint`가 통과했고, 세 유형 모두
생성 project의 `npm run build`가 통과했다.

사용자가 제공한 원격 OData service는 read-only metadata로 Standard smoke test했고,
OData V4, `Books` EntitySet, key와 properties를 확인했다. 인증정보와 business row data는
artifact에 저장하지 않았다.

생성 project dependency 설치 과정에서 `npm audit`가 11개 취약점을 보고했다. 생성기의
runtime 실패는 아니지만 dependency upgrade 또는 security review가 필요한 남은 위험이다.
