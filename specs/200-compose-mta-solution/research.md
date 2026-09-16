# Research: Protocol 200 MTA 솔루션 구성

## Decision 1: base descriptor는 target-neutral로 유지

**Decision**: `mta.yaml`에는 solution topology와 service requirement만 담고 CF API, org, space, stage 및 credential을 넣지 않는다.

**Rationale**: 동일 archive의 환경 간 이동성을 보존하고 landscape secret/target 책임을 Protocol 300에 집중한다.

**Alternatives considered**: 환경별 descriptor 직접 생성은 drift와 accidental deployment 위험 때문에, placeholder secret 저장은 leakage와 잘못된 substitution 위험 때문에 제외했다.

## Decision 2: 검증된 generation result가 유일한 component 입력

**Decision**: 000의 full handoff를 먼저 검증한 뒤 source protocol별 result를 credential-free `ComponentResult` envelope로 정규화한다. 최소 하나의 component result가 `PASSED`, provenance, output boundary 및 SHA-256 checksum을 가져야 하며 현재 파일 checksum과 일치해야 한다.

**Rationale**: 생성 이후 변조 또는 미검증 결과가 배포 artifact로 승격되는 것을 방지한다.

**Alternatives considered**: source protocol의 서로 다른 result shape를 직접 소비하는 방식은 protocol 결합도를 높여 제외했다. 임의 project directory 직접 탐색과 사용자 확인만으로 validation을 대체하는 방식도 재현 가능한 evidence가 없어 제외했다.

## Decision 3: topology 정규화 후 deterministic render

**Decision**: module/resource/edge를 canonical key로 정렬하고 identifier 및 configuration 충돌을 먼저 해결한 뒤 descriptor를 렌더링한다.

**Rationale**: 같은 입력이 같은 fingerprint를 생성해야 idempotent 재실행과 provenance 검증이 가능하다.

**Alternatives considered**: filesystem 발견 순서 유지와 마지막 입력 우선 병합은 결과 변동 또는 숨은 충돌을 만들므로 제외했다.

## Decision 4: 정적 validation과 build validation 모두 필수

**Decision**: schema/reference/path/secret 검증은 항상 실행하고 archive-ready 판정은 검증된 MTA build tool adapter 성공까지 요구한다.

**Rationale**: 실제 build 없이 deployable artifact라고 과장하지 않는다.

**Alternatives considered**: YAML parse 성공만으로 ready 처리하거나 build 실패를 warning으로 낮추는 방식은 완료 gate에 위배되어 제외했다.

## Decision 5: `DEFINED` 상태에서는 package command를 실행하지 않음

**Decision**: 문서와 구현 task가 모두 완료되어 registry가 원자적으로 `IMPLEMENTED`로 전환되기 전에는 executor 및 build adapter를 호출하지 않는다.

**Implementation status**: 필수 task와 safety test 완료 후 `IMPLEMENTED`로 전환되었다.

**Rationale**: 부분 구현의 실행 가능 노출을 막는다.

**Alternatives considered**: experimental executor를 `DEFINED`에서 실행하는 방식은 000 registry 계약을 위반한다.

## Decision 6: CAP HANA topology는 identity와 artifact metadata에서 파생

**Decision**: CAP BACKEND의 이름, persistence와 build path를 sample 이름에서 가져오지 않는다. checksum이 검증된 component `package.json`에서 production persistence를 읽고 `identity.applicationId`를 기반으로 service module, db-deployer와 HDI resource를 생성한다.

**Rationale**: Protocol 200을 Bookshop뿐 아니라 임의의 CAP solution에 동일하게 적용하면서 source artifact와 descriptor 사이의 persistence drift를 차단한다.

**Alternatives considered**: core code에 `bookshop-*` 이름이나 remote endpoint를 넣는 방식은 재사용성과 target-neutral 원칙을 위반해 제외했다. HANA Cloud database instance 자동 생성도 account entitlement, sizing과 credential 결정이 필요하므로 HDI packaging과 분리한다.
