# 기능 명세: CAP Backend 애플리케이션 생성

**Feature Branch**: `100-generate-cap-application`

**Created**: 2026-09-11

**Last Updated**: 2026-09-11

**Specification Status**: `IMPLEMENTED`

**Protocol Status**: `IMPLEMENTED`

**Runtime**: CAP Node.js executor와 local SQLite validation pipeline이 구현됨. 실제 cloud resource 변경은 200/300에 위임한다.

**Input**: 000에서 전달한 versioned `BACKEND` `ProtocolHandoff`와 승인된 domain/service 요구사항으로 하나의 CAP Backend project를 생성하고 검증한다.

## 사용자 시나리오 및 테스트

### 사용자 스토리 1 - 검증 가능한 domain과 service 생성 (Priority: P1)

업무 설계자는 entity, field, key, 관계와 필요한 조회·변경 동작을 설명하고, Frontend 또는 다른 consumer가 사용할 수 있는 명시적인 service contract를 갖는 Backend project를 받는다.

**우선순위 이유**: 안정적인 domain model과 service contract는 Backend 자체 실행과 후속 Frontend 생성 모두의 최소 가치 단위다.

**독립 테스트**: `CAP-CRUD-01` handoff를 제출하여 project 구조, domain model, service projection과 service snapshot이 함께 생성되고 필수 compile 검증을 통과하는지 확인한다.

**인수 시나리오**:

1. **Given** protocol ID/version이 일치하고 entity별 key, field type과 필수 여부가 결정된 `BACKEND` handoff, **When** 생성 준비를 검증하면, **Then** 모든 requirement를 domain entity, service surface, prerequisite 또는 범위 밖 중 하나로 추적한다.
2. **Given** 관계의 source, target, cardinality와 lifecycle 의도가 결정되었을 때, **When** domain model을 생성하면, **Then** 관계와 무결성 규칙을 임의로 보완하지 않고 승인된 의미대로 표현한다.
3. **Given** 공개할 entity와 operation이 결정되었을 때, **When** service를 생성하면, **Then** persistence model과 분리된 projection 및 안정적인 service path를 제공한다.
4. **Given** 생성물이 compile되고 local service metadata가 만들어졌을 때, **When** 결과를 검증하면, **Then** 001이 소비할 수 있는 credential 없는 service snapshot과 requirement trace를 출력한다.

---

### 사용자 스토리 2 - 업무 규칙과 authorization 경계 생성 (Priority: P2)

Backend 개발자는 단순한 data exposure를 넘어 validation, action, transaction과 authorization intent가 필요한 업무 동작을 안전한 service boundary에 반영한다.

**우선순위 이유**: 업무 규칙과 접근 제어를 UI에 위임하지 않고 Backend가 소유해야 데이터 무결성과 일관성을 유지할 수 있다.

**독립 테스트**: `CAP-RULES-01` handoff로 validation과 action을 생성하고, `CAP-AUTH-01` handoff로 role intent를 생성하여 정상·거부·rollback 사례가 local test에서 구분되는지 확인한다.

**인수 시나리오**:

1. **Given** 검증 규칙에 requirement ID, 적용 operation, 조건과 실패 결과가 있을 때, **When** service behavior를 생성하면, **Then** 해당 규칙을 Backend validation 또는 handler로 추적 가능하게 구현한다.
2. **Given** 여러 변경을 하나의 업무 action으로 처리해야 할 때, **When** action handler를 생성하면, **Then** 하나의 transaction 안에서 성공하거나 전체가 rollback되는 검증 기준을 둔다.
3. **Given** service 또는 operation별 authorization intent와 role이 승인되었을 때, **When** service contract를 생성하면, **Then** 인증·권한 annotation과 거부 테스트를 포함하되 identity provider 설정이나 credential은 생성하지 않는다.
4. **Given** authorization 또는 destructive operation의 의미가 불명확할 때, **When** 생성을 요청하면, **Then** 가장 제한적인 동작을 추측하지도 허용하지도 않고 구조화된 prerequisite로 차단한다.

---

### 사용자 스토리 3 - 안전한 생성과 재현 가능한 검증 (Priority: P3)

시스템 관리자와 검토자는 승인되지 않은 입력, credential, 기존 경로 충돌 또는 production 변경 없이 생성 결과와 검증 증거를 재현할 수 있다.

**우선순위 이유**: 자동 생성의 편의보다 사용자 데이터 보존, 비밀정보 보호와 완료 판정의 신뢰성이 우선한다.

**독립 테스트**: `CAP-GUARD-01`의 invalid handoff, credential-like 입력과 existing output을 각각 제출하여 project 파일이 생성되지 않고 이유가 구분되는지 확인한다.

**인수 시나리오**:

1. **Given** 000이 발행하지 않았거나 protocol ID/version이 일치하지 않는 handoff, **When** 100 진입을 시도하면, **Then** 생성 전에 차단하고 파일을 쓰지 않는다.
2. **Given** 입력 또는 target에 password, token, secret, 인증 header나 credential-like 값이 있을 때, **When** 요청을 검증하면, **Then** 값을 저장·정규화·로그하지 않고 요청을 거부한다.
3. **Given** output path가 workspace 밖이거나 기존 파일과 충돌할 때, **When** 생성을 시도하면, **Then** 기존 content를 덮어쓰거나 삭제하지 않고 차단 결과를 반환한다.
4. **Given** compile, contract test 또는 local start 검증이 실패했을 때, **When** generation report를 만들면, **Then** 상태를 `FAILED`로 기록하고 완료된 Backend capability로 전달하지 않는다.
5. **Given** 모든 local validation이 통과했을 때, **When** 결과를 반환하면, **Then** 생성 파일, requirement trace, check 결과, 가정과 미검증 production prerequisite를 포함한다.

### Edge Cases

- 자연어에 entity 이름은 있지만 key가 없으면 임의 key를 추가하지 않고 차단한다.
- field type, 길이, 정밀도 또는 필수 여부가 결과 의미에 영향을 주는데 결정되지 않았으면 prerequisite로 남긴다.
- composition과 association 중 ownership 의미가 불명확하면 lifecycle을 추측하지 않는다.
- entity 또는 element 식별자가 충돌하거나 안전한 CDS identifier로 정규화되지 않으면 source requirement를 훼손하지 않고 차단한다.
- service에 공개하지 않은 persistence field는 service snapshot에도 노출하지 않는다.
- destructive action은 명시적 intent, 대상과 validation rule이 모두 없으면 생성하지 않는다.
- seed data는 사용자가 제공한 비민감 fixture만 허용하며 실제 업무 data나 개인정보를 예제로 복사하지 않는다.
- output project 안의 `app/`은 비워 두거나 Backend 소유 설명만 둘 수 있으며 UI artifact를 생성하지 않는다.
- local SQLite 검증 성공을 SAP HANA, XSUAA/IAS, Cloud Foundry 배포 성공으로 간주하지 않는다.
- 같은 handoff를 재실행해 existing output과 충돌하면 overwrite하지 않고 안전하게 실패한다.
- persistence intent가 없으면 SQLite로 보완하지 않고 `SQLITE` 또는 `HANA`의 명시적 선택을 요구하며 생성 전에 차단한다.

## 요구사항

### 기능 요구사항

- **FR-001**: 시스템은 000이 발행한 `handoffVersion=1.0`, `protocol.id=100`, registry와 일치하는 `protocol.version`, `BACKEND` step의 `ProtocolHandoff`만 입력으로 받아야 한다.
- **FR-002**: 시스템은 handoff의 `planId`, `stepId`, request, inputs, completed dependency와 requested time을 검증해야 한다.
- **FR-003**: 시스템은 원문 요구사항과 모든 stable requirement ID를 보존하고 각 항목을 생성 결과, prerequisite 또는 범위 밖 결정에 연결해야 한다.
- **FR-004**: 시스템은 project name, namespace, output parent, runtime intent와 명시적인 `SQLITE` 또는 `HANA` persistence intent를 생성 전에 검증해야 하며, persistence 누락을 기본값으로 보완해서는 안 된다.
- **FR-005**: 시스템은 entity마다 이름, 하나 이상의 key, field type, nullability와 필요한 length/precision을 확인해야 한다.
- **FR-006**: 시스템은 관계마다 source, target, cardinality, ownership/lifecycle과 필수 여부를 확인하고 결정되지 않은 의미를 추측해서는 안 된다.
- **FR-007**: 시스템은 승인된 domain model을 `db/`, 공개 service definition과 custom behavior를 `srv/`, UI content를 `app/` 경계에 유지해야 한다.
- **FR-008**: 시스템은 공통 identity/audit 의미가 요구사항과 일치할 때 표준 aspect를 우선하고, 적용한 기본값을 generation report에 기록해야 한다. `managed` 또는 `cuid`가 승인된 entity에는 해당 aspect가 제공하는 표준 field를 explicit service projection에서 선택할 수 있어야 한다.
- **FR-009**: 시스템은 persistence entity를 직접 무제한 공개하지 않고 승인된 field와 operation만 service projection에 포함해야 한다.
- **FR-010**: 시스템은 service name, path, entity projection, operation, parameter, return type과 side-effect intent를 명시적인 service contract로 생성해야 한다.
- **FR-011**: 시스템은 validation rule을 적용 대상 operation, 조건, 오류 식별자와 requirement ID에 연결해야 한다.
- **FR-012**: 시스템은 custom behavior가 필요한 경우 service handler에만 배치하고 raw database-specific SQL 또는 UI-side business rule을 생성해서는 안 된다.
- **FR-013**: 시스템은 하나의 업무 operation에 속한 여러 변경의 transaction 성공 및 rollback 조건을 검증할 수 있어야 한다.
- **FR-014**: 시스템은 authorization intent가 승인된 service, entity와 operation에 인증 및 role 제약을 표현해야 한다.
- **FR-015**: 시스템은 authorization intent 또는 destructive operation이 불명확하면 생성 전에 차단해야 한다.
- **FR-016**: 시스템은 identity provider, role collection, service instance 또는 production binding을 생성·변경하지 않아야 한다.
- **FR-017**: 시스템은 Frontend가 소비할 service URL hint, OData version, service/entity/operation metadata와 capability를 credential 없는 service snapshot으로 출력해야 한다.
- **FR-018**: 시스템은 service snapshot이 compile된 service model과 일치하고 공개되지 않은 persistence element를 포함하지 않는지 검증해야 한다.
- **FR-019**: 시스템은 새 output directory만 생성하며 기존 file/directory를 덮어쓰거나 삭제해서는 안 된다.
- **FR-020**: 시스템은 output을 workspace의 승인된 boundary 아래로 제한하고 path traversal과 absolute escape를 거부해야 한다.
- **FR-021**: 시스템은 password, token, secret, private key, cookie, authorization header와 credential-like 값을 입력, 생성물, report, fixture 또는 log에 저장해서는 안 된다.
- **FR-022**: 시스템은 생성물을 staging 영역에서 완성·검증한 뒤 성공 시에만 final output으로 원자적으로 이동해야 한다.
- **FR-023**: 시스템은 CDS compile, service contract test, handler test와 local service start smoke test를 필수 validation으로 수행해야 한다.
- **FR-024**: 시스템은 필수 validation 실패 시 status를 `FAILED`로 반환하고 service snapshot을 후속 완료 dependency로 공개해서는 안 된다.
- **FR-025**: 시스템은 생성 파일, requirement trace, validation check, assumption, prerequisite와 risk를 generation report에 포함해야 한다.
- **FR-026**: 시스템은 실제 SAP HANA, Cloud Foundry, remote SAP system, XSUAA/IAS tenant 또는 Work Zone을 변경하지 않아야 한다.
- **FR-027**: 시스템은 Node.js runtime의 최소 generator capability를 제공하되 다른 runtime을 요청받으면 지원된 것으로 추측하지 않고 차단해야 한다.
- **FR-028**: protocol descriptor가 `DEFINED`인 동안 executor를 노출하거나 handoff를 실행 가능으로 보고해서는 안 된다.
- **FR-029**: 구현과 필수 validation이 완료된 뒤에만 100 descriptor를 `IMPLEMENTED`로 변경할 수 있어야 한다.

### 주요 정보 객체

> 이 절의 객체는 generator가 주고받는 계약이며 생성 대상 업무 DB의 고정 schema가 아니다.

- **CAPGenerationRequest**: 000 handoff, output intent, runtime/persistence intent, domain contract, service contract와 behavior rule을 묶은 생성 입력이다.
- **DomainEntity**: stable ID, CDS name, key, field와 관계를 갖는 업무 개체 정의다.
- **ServiceDefinition**: service name/path, 공개 projection, operation과 authorization intent를 갖는 외부 계약이다.
- **BehaviorRule**: validation, action 또는 transaction rule과 requirement trace다.
- **ServiceSnapshot**: compile 결과에서 추출한 OData version, service URL hint, entity set, property, navigation, operation과 capability다.
- **CAPGenerationResult**: 상태, project path, 생성 파일, check, trace, assumption, prerequisite와 service snapshot 참조를 담는다.

## 성공 기준

### 대표 검증 사례

| ID | 상황 | 기대 결과 |
|---|---|---|
| `CAP-CRUD-01` | key와 관계가 확정된 두 entity 및 read/create/update service | compile 가능한 domain/service와 consumer snapshot |
| `CAP-RULES-01` | quantity 검증과 여러 entity를 갱신하는 action | 오류 contract와 transaction rollback test 포함 |
| `CAP-AUTH-01` | read role과 write role이 구분된 service | 허용/거부 조건이 contract 및 test로 추적됨 |
| `CAP-GUARD-01` | invalid handoff, credential-like 값 또는 existing output | 파일 생성 없이 구조화된 `BLOCKED` 결과 |
| `CAP-CONTRACT-01` | persistence에는 있으나 service에 제외된 field | snapshot과 metadata에 해당 field 미노출 |

### 측정 가능한 결과

- **SC-001**: 대표 valid handoff의 100%가 모든 stable requirement ID를 생성 파일, prerequisite 또는 범위 밖 중 하나로 추적한다.
- **SC-002**: `CAP-CRUD-01`의 100%에서 domain/service compile, local start와 service snapshot 검증이 모두 통과한다.
- **SC-003**: `CAP-RULES-01`의 정상·오류·rollback 사례가 각각 기대 결과와 일치하며 부분 commit은 0건이다.
- **SC-004**: `CAP-AUTH-01`의 허용 및 거부 사례 100%가 승인된 authorization intent와 일치한다.
- **SC-005**: invalid handoff, credential-like 입력, path escape와 existing output 사례 100%가 final project file을 생성하지 않는다.
- **SC-006**: 생성물, report와 fixture에서 credential 또는 secret 저장 검출 건수는 0건이다.
- **SC-007**: service snapshot의 entity, property, navigation, operation과 capability 100%가 compile된 public service model과 일치한다.
- **SC-008**: 필수 validation이 하나라도 실패한 결과의 완료 보고 및 후속 완료 dependency 제공 건수는 0건이다.
- **SC-009**: persistence가 누락된 Protocol 100 handoff의 100%가 파일 생성 전에 거부되고, `HANA` 선택 시 development SQLite와 production HANA profile이 모두 생성된다.

## 가정 및 의존성

- 000의 registry와 `ProtocolHandoff 1.0`이 routing의 단일 원본이다.
- 첫 구현 범위는 CAP Node.js와 local SQLite 검증이며 production persistence intent는 `HANA`로 기록만 하고 실제 binding 또는 deploy는 200/300에 위임한다.
- `SQLITE`와 `HANA`는 사용자가 선택하는 상이한 persistence intent이며 Protocol 100은 둘 중 하나를 자동 기본값으로 정하지 않는다.
- OData V4를 기본 service contract로 사용한다. 다른 OData version 요구는 명시적인 후속 범위 없이는 지원하지 않는다.
- entity key, destructive operation, authorization intent와 business rule은 사용자 또는 상위 planning에서 승인되어 전달된다.
- 공통 generator의 staging, atomic output, credential detection과 report capability를 재사용하되 CAP domain 정책은 `src/generation/backend/cap/`에 둔다.

## 범위 제외

- Fiori/SAPUI5 화면 또는 `app/` UI artifact 생성
- MTA descriptor, approuter와 deployment package 생성
- 실제 HANA schema 배포, Cloud Foundry 배포 또는 service instance 변경
- XSUAA/IAS tenant, role collection 또는 사용자 assignment 변경
- remote SAP API 호출, data migration, production seed data와 운영 data 변경
- Java runtime, multitenancy, messaging, AI 또는 custom database extension의 최초 구현
