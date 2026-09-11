# Protocol 100: CAP Backend 생성

**Status**: Defined
**Runtime**: Not implemented
**Entry**: 000의 승인된 `BACKEND` handoff

## 책임

자연어 업무 요구사항과 승인된 domain/service 계약에서 하나의 CAP application을 생성한다. 기본 solution layout은 `db/`, `srv/`, `app/`을 사용하며 Frontend가 소비할 검증된 OData service contract를 출력한다.

## Input Contract

- 원문 요구사항과 stable requirement ID
- domain entity, field, 관계, key와 validation rule
- service operation과 authorization intent
- persistence, runtime과 output intent

## Output Contract

- CAP project 또는 solution root의 `db/`, `srv/` 결과
- compile 가능한 CDS model과 service metadata
- 생성 파일, validation, assumption과 risk를 포함한 generation report
- 001이 소비할 수 있는 service snapshot 또는 metadata artifact

## Prerequisites

- domain key와 필수 field가 결정되어야 한다.
- destructive operation, authorization과 business rule은 명시적으로 확인되어야 한다.
- 기존 output을 덮어쓰지 않는다.

## Validation Boundary

- CDS compile, local service start, contract와 handler test
- production binding은 local credential로 대체하거나 저장하지 않는다.
- 실제 HANA, Cloud Foundry와 remote system은 이 protocol이 변경하지 않는다.

## 후속 작업

별도 Plan과 Tasks에서 CAP Node.js generator, template, validator와 executor를 구현하기 전까지 protocol registry의 상태는 `DEFINED`다.
