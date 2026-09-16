# Research: CAP Backend 애플리케이션 생성

## Decision 1: 최초 runtime은 CAP Node.js로 제한

**Decision**: protocol 100의 첫 executor는 Node.js runtime만 지원하고, request contract의 `runtime`은 `NODEJS`만 허용한다.

**Rationale**: 000의 기존 가정과 현재 저장소의 ECMAScript module generator 구조에 맞고, 하나의 검증된 runtime을 먼저 제공해야 handler 및 test template을 결정적으로 만들 수 있다.

**Alternatives considered**: Node.js와 Java를 동시에 지원하면 runtime별 project layout, dependency, handler 및 test contract가 갈라져 최초 구현·검증 범위를 크게 늘린다. Java request는 추측 변환하지 않고 `BLOCKED`로 반환한다.

**Source**: [CAP Node.js 개발 문서](https://cap.cloud.sap/docs/node.js/)

## Decision 2: local SQLite와 production HANA intent를 분리

**Decision**: 생성물의 local compile/start/test는 SQLite를 사용하고, `persistence=HANA`는 production intent와 package configuration으로만 표현한다. 실제 HANA binding 또는 deploy는 수행하지 않는다.

**Rationale**: credential 없는 재현 가능한 local validation을 제공하면서 production persistence 선택을 후속 200/300 protocol에 전달할 수 있다.

**Alternatives considered**: HANA에 직접 compile/deploy하는 검증은 tenant, service instance와 credential이 필요하므로 100의 local-write 경계를 위반한다. DB를 명시하지 않은 요청에 file SQLite를 기본 적용하는 방식은 사용자의 durability 의도를 숨기므로 채택하지 않는다. 명시적 `SQLITE`는 in-memory demo로, `HANA`는 development SQLite와 production HANA profile로 표현한다.

**Source**: [CAP Database Services](https://cap.cloud.sap/docs/guides/databases/)

## Decision 3: domain model과 public service projection을 분리

**Decision**: persistence entity는 `db/schema.cds`, public service는 `srv/service.cds`의 explicit projection으로 생성하고 공개 field를 allowlist 방식으로 선택한다.

**Rationale**: 내부 persistence 구조의 우발적 노출을 막고 후속 consumer가 의존할 안정적인 service boundary를 제공한다.

**Alternatives considered**: persistence entity의 자동 전체 expose는 입력이 단순하지만 내부 field가 contract에 새어 나오며 schema 변경이 consumer-breaking change가 된다.

**Source**: [CAP Providing Services](https://cap.cloud.sap/docs/guides/providing-services/)

## Decision 4: 표준 aspect와 managed association 우선

**Decision**: 승인된 identity/audit semantics가 맞을 때 `cuid`, `managed`를 사용하고 관계는 managed association/composition으로 표현한다. composition은 lifecycle ownership이 명시된 경우에만 사용한다.

**Rationale**: CAP 표준 model 기능을 사용하면 boilerplate와 수동 foreign key 오류가 줄어들며 Clean Core 원칙과 맞는다.

**Alternatives considered**: 모든 key와 audit field, foreign key를 직접 생성하면 유연하지만 의미 중복과 inconsistency가 커진다. key 또는 ownership이 불명확하면 aspect를 임의 적용하지 않고 prerequisite로 차단한다.

**Source**: [CDS Common Types and Aspects](https://cap.cloud.sap/docs/cds/common)

## Decision 5: custom behavior는 service handler에 격리

**Decision**: declarative constraint로 표현할 수 없는 validation/action/transaction만 `srv/service.js`에 생성하고 CAP event 및 transaction context를 사용한다.

**Rationale**: `db/`는 data 의미, `srv/`는 service behavior라는 경계를 유지하고 raw database-specific SQL 없이 요청 lifecycle과 transaction을 검증할 수 있다.

**Alternatives considered**: database trigger 또는 UI validation은 portability와 Backend authority를 약화한다. 모든 규칙을 handler로 구현하는 방식도 declarative model validation을 중복하므로 제외한다.

**Source**: [CAP Core Services and Event Handlers](https://cap.cloud.sap/docs/node.js/core-services)

## Decision 6: authorization intent만 생성하고 identity resource는 위임

**Decision**: 승인된 role intent를 CDS authorization annotation과 local mocked-user test로 표현한다. XSUAA/IAS instance, role collection과 사용자 assignment는 생성하지 않는다.

**Rationale**: service의 access contract는 Backend가 소유하지만 실제 identity resource와 binding은 packaging/deployment target에 의존한다.

**Alternatives considered**: 100에서 security descriptor와 cloud resource까지 생성하면 200의 packaging 및 300의 external-change 경계를 침범한다. authorization이 불명확한 경우 open-by-default 또는 guessed role을 만들지 않는다.

**Source**: [CAP Authorization](https://cap.cloud.sap/docs/guides/security/authorization)

## Decision 7: compile-derived service snapshot을 후속 계약으로 사용

**Decision**: service snapshot은 request 원문이 아니라 compiled model/metadata에서 추출하며 `OData V4`, relative service URL hint, EntitySet, property, navigation, operation과 capability만 포함한다.

**Rationale**: 생성 의도와 실제 service surface의 차이를 검출하고 001이 존재하지 않는 element를 가정하지 않게 한다.

**Alternatives considered**: 입력 contract를 그대로 전달하면 renderer 오류나 projection 누락을 발견하지 못한다. live URL만 전달하면 아직 배포되지 않은 Backend를 Frontend가 먼저 소비하게 된다.

## Decision 8: staging validation 후 atomic output

**Decision**: 공통 output transaction을 재사용하여 workspace 내부 임시 staging에 render하고 credential scan, compile, test, local start와 snapshot consistency를 모두 통과한 뒤 새 final directory로 rename한다.

**Rationale**: 실패한 partial project와 기존 content 손상을 막고 성공/실패 결과를 명확히 구분한다.

**Alternatives considered**: final directory에 직접 쓰고 실패 시 cleanup하면 process interruption 때 partial output이 남고 기존 경로 처리 위험이 증가한다.

