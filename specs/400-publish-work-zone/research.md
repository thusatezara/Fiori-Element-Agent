# Research: SAP Build Work Zone 게시

## Decision 1: edition을 자동 판정하지 않는다

**Decision**: `STANDARD` 또는 `ADVANCED`는 확인된 target 입력으로만 받는다.

**Rationale**: edition별 administration surface와 지원 capability가 다를 수 있고 잘못된 추정은 다른 tenant/resource 변경으로 이어질 수 있다. SAP Build Work Zone advanced edition skill도 subscription, administrator role과 대상 환경의 사전 확인을 prerequisite로 둔다.

**Alternatives considered**: URL 형태나 발견 가능한 feature로 edition을 추정하는 방식은 환경 변화와 권한별 노출 차이 때문에 거부했다.

## Decision 2: preflight와 mutation을 물리적으로 분리한다

**Decision**: request/manifest/target validation은 read-only module에서 끝내고 publisher만 mutation adapter를 소유한다.

**Rationale**: 검증 또는 dry-run 요청이 content provider, site, role, tile을 바꾸지 않았다는 것을 fake adapter call count로 증명할 수 있다.

**Alternatives considered**: 하나의 adapter method가 validate와 publish를 함께 수행하는 설계는 숨은 mutation을 test하기 어려워 거부했다.

## Decision 3: approval은 exact target과 operation 집합에 결합한다

**Decision**: canonical target과 정렬된 unique operation의 fingerprint를 approval evidence에 저장한다.

**Rationale**: “게시 승인” 같은 포괄 boolean이 다른 site, role 또는 tile 변경에 재사용되는 것을 방지한다.

**Alternatives considered**: session-wide approval과 edition-only approval은 변경 범위가 불명확해 거부했다.

## Decision 4: deployment와 manifest identity를 함께 검증한다

**Decision**: 성공한 300 result reference, deployed application identity, subaccount evidence, manifest digest, `sap.app/id`, `sap.cloud/service`와 selected inbound를 하나의 request에 결합한다.

**Rationale**: Work Zone에서 발견할 content와 실제 배포된 artifact가 다르거나 stale manifest인 경우를 게시 전에 식별할 수 있다.

**Alternatives considered**: application name만 비교하는 방식은 이름 중복과 stale artifact를 구분하지 못해 거부했다.

## Decision 5: navigation은 선택된 inbound 하나로 검증한다

**Decision**: handoff가 inbound key를 명시하고 semantic object/action과 canonical intent를 교차 검증한다.

**Rationale**: 여러 inbound에서 첫 항목을 선택하면 의도하지 않은 tile navigation을 생성할 수 있다.

**Alternatives considered**: 모든 inbound 자동 게시와 첫 inbound default 선택은 범위를 암묵적으로 확대하므로 거부했다.

## Decision 6: adapter interface는 제품 surface와 독립적으로 유지한다

**Decision**: core는 inspect, capability check, desired-state operation, validation port만 정의하고 edition별 실제 지원 interface는 구현 시 공식 지원 상태와 sandbox에서 확인한다.

**Rationale**: 문서 단계에서 특정 UI automation 또는 API availability를 사실로 고정하지 않고, edition 차이를 core policy와 분리한다.

**Alternatives considered**: 하나의 공통 endpoint 형태를 가정하거나 browser automation을 기본 방식으로 고정하는 선택은 검증되지 않아 보류했다.

## Decision 7: idempotency와 partial failure를 operation 단위로 기록한다

**Decision**: desired-state fingerprint와 current-state inspection으로 `NO_CHANGE`를 판정하고, failure 이후 자동 destructive rollback은 하지 않는다.

**Rationale**: 이미 반영된 변경을 중복 생성하지 않고, 복구 과정에서도 사용자의 통제와 감사 가능성을 유지한다.

**Alternatives considered**: request 전체를 재실행하거나 실패 시 임의 삭제하는 방식은 중복 및 데이터 손실 위험 때문에 거부했다.

## Decision 8: visibility validation은 권한 변경과 분리한다

**Decision**: 승인된 test subject가 있을 때 visibility를 검증하고, 없으면 `NOT_VERIFIED`를 반환한다. role assignment는 별도 승인 operation이다.

**Rationale**: 검증 실패를 이유로 role을 자동 부여하면 최소 권한과 명시적 승인 원칙을 위반한다.

**Alternatives considered**: technical administrator visibility만으로 business user visibility를 성공 처리하거나 자동 role assignment하는 방식은 거부했다.
