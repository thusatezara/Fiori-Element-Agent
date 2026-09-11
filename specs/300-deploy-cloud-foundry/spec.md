# Protocol 300: Cloud Foundry 배포

**Status**: Defined
**Runtime**: Not implemented
**Entry**: 000의 승인된 `DEPLOY_CF` handoff
**Risk**: External change

## 책임

200에서 검증한 deployment artifact를 사용자가 지정한 SAP BTP Cloud Foundry API, org와 space에 배포하고 배포 상태를 검증한다.

## Input Contract

- 검증된 MTA archive와 checksum
- HTTPS CF API endpoint, org, space와 stage
- 명시적인 deploy intent와 승인 evidence
- 인증은 실행 환경에서만 사용하고 handoff에 credential을 넣지 않는다.

## Output Contract

- target reference, deployment operation ID와 상태
- 생성·변경된 application/service의 비밀정보 없는 summary
- health/route 검증과 실패 시 retry·rollback guidance

## Blocking Rules

- target의 api, org, space, stage 중 하나라도 없으면 실행하지 않는다.
- 인증 session, required plugin 또는 entitlement를 확인할 수 없으면 실행하지 않는다.
- `PROD`는 별도 명시적 승인 policy를 요구한다.

## Validation Boundary

- target 재확인, archive checksum, deployment result, application health와 route
- Work Zone content provider와 site content는 이 protocol이 변경하지 않는다.

## 후속 작업

별도 Plan과 Tasks에서 read-only target inspection, deploy adapter, idempotency와 recovery를 구현하기 전까지 protocol registry의 상태는 `DEFINED`다.
