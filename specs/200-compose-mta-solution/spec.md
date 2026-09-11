# Protocol 200: MTA 솔루션 구성

**Status**: Defined
**Runtime**: Not implemented
**Entry**: 000의 승인된 `PACKAGE` handoff

## 책임

검증된 CAP Backend와 Fiori/SAPUI5 Frontend 결과를 하나의 Cloud Foundry 배포 단위로 구성한다. module, resource, destination와 HTML5 application repository 연결을 선언하고 archive-ready 결과를 만든다.

## Input Contract

- 100의 CAP generation result 또는 검증된 기존 Backend
- 001~004의 Frontend generation result
- application ID, `sap.cloud.service`, navigation intent와 auth intent
- target-neutral service requirement

## Output Contract

- `mta.yaml`과 필요한 security/router/destination descriptor
- HTML5 content deployment를 위한 module/resource 연결
- build plan과 package validation report

## Prerequisites

- 모든 입력 project validation이 통과해야 한다.
- application ID와 `sap.cloud.service` 충돌 가능성을 검사해야 한다.
- landscape별 값과 credential을 base descriptor에 저장하지 않는다.

## Validation Boundary

- descriptor schema, module/resource reference와 build dry-run
- 이 protocol은 `cf deploy` 또는 Work Zone content 변경을 수행하지 않는다.

## 후속 작업

별도 Plan과 Tasks에서 MTA composer, template, build validator와 executor를 구현하기 전까지 protocol registry의 상태는 `DEFINED`다.
