# 기능 명세: SAP Build Work Zone 게시

**Feature Branch**: `400-publish-work-zone`

**Created**: 2026-09-11

**Specification Status**: `READY_FOR_IMPLEMENTATION`

**Protocol Status**: `DEFINED` — executor가 구현·검증되어 registry 상태가 `IMPLEMENTED`로 전환되기 전에는 외부 Work Zone 변경을 수행하지 않는다.

**Input**: 성공한 Protocol 300 배포 결과를 확인하고, 지정된 SAP Build Work Zone edition·subaccount·site·content target에 application content를 안전하게 게시하며 navigation과 visibility를 검증한다.

## 사용자 시나리오 및 테스트

### 사용자 스토리 1 - 게시 전 준비 상태 검증 (Priority: P1)

운영자는 외부 변경 전에 Protocol 300 배포 성공 여부, Work Zone 대상, application manifest의 business service와 navigation intent가 게시 가능한 상태인지 확인한다. 검증만 요청하면 Work Zone의 어떤 resource도 변경하지 않는다.

**Why this priority**: 잘못된 tenant 또는 서로 일치하지 않는 application identity와 navigation을 게시 단계보다 먼저 차단하는 것이 안전한 publication의 최소 가치다.

**Independent Test**: credential이 제거된 handoff fixture를 입력해 모든 prerequisite가 유효하면 `READY_FOR_APPROVAL`, 하나라도 누락되거나 불일치하면 구체적인 blocking code를 반환하며 mutation adapter가 호출되지 않는지 검증한다.

**Acceptance Scenarios**:

1. **Given** 검증된 `SUCCEEDED` 300 result, 확인된 edition·subaccount·site·content target과 일치하는 manifest evidence, **When** publication preflight를 실행하면, **Then** 각 evidence의 검증 결과와 `READY_FOR_APPROVAL` 상태를 반환하고 외부 변경은 0건이다.
2. **Given** 300 result가 없거나 status가 성공이 아님, **When** preflight를 실행하면, **Then** `DEPLOYMENT_NOT_SUCCEEDED`로 차단하고 Work Zone에 접근하지 않는다.
3. **Given** edition이 없거나 `STANDARD`/`ADVANCED`로 확인되지 않음, **When** preflight를 실행하면, **Then** edition을 추정하지 않고 `EDITION_UNCONFIRMED`로 차단한다.
4. **Given** `sap.cloud.service`가 비어 있거나 deployment identity와 불일치함, **When** manifest를 검증하면, **Then** `BUSINESS_SERVICE_MISMATCH`로 차단한다.
5. **Given** 선택한 inbound의 semantic object 또는 action이 없거나 intent와 불일치함, **When** navigation을 검증하면, **Then** `NAVIGATION_INTENT_INVALID`로 차단한다.

---

### 사용자 스토리 2 - 승인 범위 안에서 edition별 게시 (Priority: P1)

게시 관리자는 확인된 target과 승인된 operation만 `STANDARD` 또는 `ADVANCED` edition adapter를 통해 수행한다. content provider, site assignment, role 또는 tile 변경은 각각 명시적으로 승인된 경우에만 허용된다.

**Why this priority**: Work Zone publication은 외부 tenant 상태를 바꾸므로 target과 operation에 묶인 명시적 승인이 핵심 통제다.

**Independent Test**: fake edition adapter에 동일한 validated request를 전달하고 승인 목록에 포함된 operation만 순서대로 호출되며, 승인 밖 operation과 `DEFINED` protocol 실행은 모두 차단되는지 검증한다.

**Acceptance Scenarios**:

1. **Given** target과 requested operation 집합에 결합된 유효한 publish approval, **When** `IMPLEMENTED` executor가 게시하면, **Then** 확인된 edition adapter만 선택하고 승인된 operation만 수행한다.
2. **Given** publish intent가 없거나 approval의 target/operation fingerprint가 현재 request와 다름, **When** 실행을 요청하면, **Then** `APPROVAL_SCOPE_MISMATCH`로 차단하고 변경은 0건이다.
3. **Given** protocol registry 상태가 `DEFINED`, **When** 모든 prerequisite와 승인이 충족된 실행 요청을 받으면, **Then** `PROTOCOL_NOT_IMPLEMENTED`로 차단하고 외부 Work Zone 변경은 수행하지 않는다.
4. **Given** `ASSIGN_CONTENT_TO_SITE`만 승인됨, **When** 게시하면, **Then** content provider update, site setting update, tile create/update와 role assignment를 수행하지 않는다.
5. **Given** 같은 successful request가 재시도됨, **When** target의 현재 상태가 desired state와 같으면, **Then** 불필요한 mutation 없이 `NO_CHANGE` operation result를 반환한다.

---

### 사용자 스토리 3 - navigation·visibility 증거와 안전한 실패 보고 (Priority: P2)

운영자와 검토자는 게시 후 tile navigation과 content visibility를 확인하고, 수행된 변경과 실패 지점 및 안전한 후속 조치를 credential 없는 report로 받는다.

**Why this priority**: provider refresh 또는 site assignment의 성공만으로 실제 business user 접근과 navigation 성공을 보장할 수 없다.

**Independent Test**: 성공, no-change, 검증 실패와 중간 operation 실패 fixture를 사용해 operation별 evidence, navigation/visibility 결과, 변경된 resource 목록과 재시도 가능 여부가 정확히 보고되는지 검증한다.

**Acceptance Scenarios**:

1. **Given** 게시 operation이 성공함, **When** post-publication validation을 실행하면, **Then** content discovery, site assignment, resolved intent와 승인된 visibility subject를 각각 검증한다.
2. **Given** tile이 열리지만 resolved intent가 승인된 semantic object/action과 다름, **When** navigation을 검증하면, **Then** 전체 결과를 `VALIDATION_FAILED`로 표시하고 mismatch evidence를 반환한다.
3. **Given** operation 도중 실패함, **When** 결과를 생성하면, **Then** 완료·실패·미실행 operation을 구분하고 자동 destructive rollback 없이 recovery guidance를 제공한다.
4. **Given** report가 생성됨, **When** 보안 검사를 실행하면, **Then** password, token, authorization header 또는 client secret이 포함되지 않는다.

### Edge Cases

- 300 result의 subaccount evidence와 Work Zone target subaccount가 다르면 cross-subaccount 게시를 추정하지 않고 차단한다.
- 300 result가 성공했지만 대상 application identity 또는 manifest digest를 식별할 수 없으면 차단한다.
- 여러 manifest inbound가 존재하면 handoff에 선택된 inbound key가 반드시 있어야 하며 첫 번째 inbound를 자동 선택하지 않는다.
- 같은 semantic object/action이 여러 target item과 충돌하면 기존 tile을 임의 변경하지 않고 conflict로 차단한다.
- content provider refresh 후 application이 아직 보이지 않으면 bounded verification timeout 결과를 반환하고 role/tile을 우회 변경하지 않는다.
- approval이 만료되거나 현재 target/operation fingerprint와 다르면 새 승인을 요구한다.
- business user visibility 확인에 사용할 승인된 test subject가 없으면 role assignment 없이 visibility를 `NOT_VERIFIED`로 보고한다.
- read-only preflight 또는 dry-run에서 adapter의 mutation method가 호출되면 validation 실패로 간주한다.
- partial failure에서 이미 완료된 operation을 숨기지 않으며 destructive delete 또는 자동 rollback은 별도 승인 없이는 수행하지 않는다.

## 요구사항

### 기능 요구사항

- **FR-001**: 시스템은 000이 생성한 Protocol 400 handoff의 protocol ID/version, step binding과 완료된 dependency evidence를 검증해야 한다.
- **FR-002**: 시스템은 Protocol 300 result가 검증 가능한 identity를 가지며 최종 status가 `SUCCEEDED`인지 확인해야 한다.
- **FR-003**: 시스템은 300 result가 지칭하는 deployed application과 manifest evidence를 하나의 application identity로 결합해야 한다.
- **FR-004**: 시스템은 Work Zone target의 `edition`, `subaccount`, `site`, `contentTarget`이 모두 비어 있지 않은지 확인해야 한다.
- **FR-005**: 시스템은 edition을 `STANDARD` 또는 `ADVANCED`로 명시적으로 확인해야 하며 자동 선택해서는 안 된다.
- **FR-006**: 시스템은 300 deployment와 Work Zone target이 같은 subaccount에 속한다는 확인 evidence가 없거나 불일치하면 게시를 차단해야 한다.
- **FR-007**: 시스템은 manifest의 `sap.app/id`와 `sap.cloud/service`가 비어 있지 않고 deployment identity와 일치하는지 검증해야 한다.
- **FR-008**: 시스템은 handoff가 선택한 inbound key의 semantic object와 action을 검증하고 canonical intent `#<semanticObject>-<action>`과 일치시켜야 한다.
- **FR-009**: 시스템은 여러 inbound 중 하나를 임의로 선택해서는 안 된다.
- **FR-010**: 시스템은 preflight 결과에 모든 check의 status, code와 credential 없는 evidence를 포함해야 한다.
- **FR-011**: 시스템은 read-only preflight와 external mutation execution을 분리해야 한다.
- **FR-012**: 시스템은 publish intent가 명시되지 않으면 content provider, site, role 또는 tile을 변경하지 않아야 한다.
- **FR-013**: 시스템은 publish intent에 target과 requested operation 집합을 결합하고 approval evidence가 같은 fingerprint를 승인했는지 검증해야 한다.
- **FR-014**: 시스템은 승인 가능한 operation을 `REFRESH_CONTENT_PROVIDER`, `IMPORT_CONTENT`, `ASSIGN_CONTENT_TO_SITE`, `UPDATE_SITE`, `CREATE_TILE`, `UPDATE_TILE`, `ASSIGN_ROLE`로 제한하고 승인 목록 밖 operation을 실행하지 않아야 한다.
- **FR-015**: 시스템은 delete, unassign, role removal 같은 destructive operation을 Protocol 400 기본 범위에서 수행하지 않아야 한다.
- **FR-016**: 시스템은 확인된 edition과 정확히 일치하는 publisher adapter만 선택해야 한다.
- **FR-017**: 시스템은 operation을 사전 정의된 순서와 dependency에 따라 수행하고 각 operation의 `SUCCEEDED`, `NO_CHANGE`, `FAILED`, `NOT_RUN` 상태를 기록해야 한다.
- **FR-018**: 시스템은 동일 target과 desired state에 대한 재시도에서 이미 충족된 operation을 `NO_CHANGE`로 처리할 수 있어야 한다.
- **FR-019**: 시스템은 content discovery, site assignment, navigation intent와 승인된 visibility subject를 독립적으로 검증해야 한다.
- **FR-020**: 시스템은 role 또는 tile 변경이 승인되지 않았으면 visibility 문제를 해결하기 위해 이를 암묵적으로 수행하지 않아야 한다.
- **FR-021**: 시스템은 실패 시 완료·실패·미실행 operation, target, 재시도 가능 여부와 recovery guidance를 포함한 결과를 반환해야 한다.
- **FR-022**: 시스템은 credential, token, password, authorization header와 client secret을 request, approval, result 또는 log artifact에 저장하지 않아야 한다.
- **FR-023**: 시스템은 protocol registry 상태가 `DEFINED`인 동안 모든 mutation 요청을 `PROTOCOL_NOT_IMPLEMENTED`로 차단해야 한다.
- **FR-024**: 시스템은 구현 후 registry를 `IMPLEMENTED`로 전환하기 전에 contract, unit, integration test와 승인된 sandbox tenant 검증 evidence를 요구해야 한다.

### 주요 정보 객체

- **WorkZonePublicationRequest**: 400 handoff, 성공한 300 result reference, application/manifest evidence, Work Zone target, publish intent와 approval evidence를 묶는 credential 없는 요청이다.
- **DeploymentEvidence**: 성공한 300 operation과 deployed application identity, target subaccount 및 검증 시각을 참조한다.
- **ManifestEvidence**: `sap.app/id`, `sap.cloud/service`, manifest digest와 명시적으로 선택된 inbound navigation을 담는다.
- **WorkZoneTarget**: 확인된 edition, subaccount, site와 content target 식별자다.
- **PublishIntent**: mutation 허용 여부와 requested operation 집합을 선언한다.
- **ApprovalEvidence**: 승인 ID, 승인 시각, 만료 시각 및 현재 target/operation fingerprint를 결합한다.
- **PreflightCheck**: prerequisite 하나의 status, stable code와 redacted evidence를 나타낸다.
- **PublicationOperation**: 승인된 한 mutation의 순서, desired-state fingerprint, 결과와 resource reference를 나타낸다.
- **PublicationResult**: 전체 상태, operation evidence, navigation/visibility validation과 recovery guidance를 담는다.

## 성공 기준

### 측정 가능한 결과

- **SC-001**: 필수 prerequisite가 누락되거나 불일치한 모든 fixture에서 외부 mutation 호출은 0건이고 각각 stable blocking code가 반환된다.
- **SC-002**: `STANDARD`와 `ADVANCED` fixture 100%에서 확인된 edition과 일치하는 adapter만 선택된다.
- **SC-003**: 승인 범위 matrix의 모든 조합에서 승인되지 않은 content provider, site, role 또는 tile mutation 호출은 0건이다.
- **SC-004**: valid manifest fixture 100%는 통과하고 `sap.cloud.service` 또는 navigation mismatch fixture 100%는 게시 전에 차단된다.
- **SC-005**: 동일 publication request 재실행 시 이미 충족된 operation은 100% `NO_CHANGE`로 보고되고 중복 resource를 생성하지 않는다.
- **SC-006**: 성공 결과마다 content discovery, site assignment와 navigation 검증 결과가 존재하며, 승인된 visibility subject가 없으면 `NOT_VERIFIED`가 명시된다.
- **SC-007**: 생성된 request, result와 log fixture의 secret scanner에서 credential-like 값이 0건이다.
- **SC-008**: registry 상태가 `DEFINED`인 모든 실행 시나리오에서 외부 mutation은 0건이며 `PROTOCOL_NOT_IMPLEMENTED`가 반환된다.

## 가정 및 의존성

- 000은 credential 없는 versioned ProtocolHandoff와 명시적 external change intent를 제공한다.
- Protocol 300은 성공 status, immutable result reference, deployed application identity와 subaccount 확인 evidence를 제공한다.
- authentication session과 관리자 권한은 실행 환경에서 확인하며 artifact에 저장하지 않는다.
- edition별 실제 API/administration flow는 구현 시 지원되는 SAP interface와 승인된 sandbox tenant에서 검증한다.
- v1의 visibility validation은 승인된 test subject가 제공될 때만 business-user 관점으로 수행한다.
- 삭제, unpublish, role removal, site 생성과 content provider 생성은 v1 범위 밖이다.

## Protocol Contract 요약

### Input Contract

- `specs/400-publish-work-zone/contracts/work-zone-publication-request.schema.json`을 만족하는 credential 없는 request
- 검증된 `SUCCEEDED` Protocol 300 result와 deployed application identity
- 확인된 `STANDARD` 또는 `ADVANCED` edition, subaccount, site와 content target
- `sap.app/id`, `sap.cloud/service`, 선택된 inbound semantic object/action과 manifest digest
- target/operation fingerprint에 결합된 명시적 publish intent와 approval evidence

### Output Contract

- `specs/400-publish-work-zone/contracts/work-zone-publication-result.schema.json`을 만족하는 result
- preflight, operation, navigation과 visibility validation evidence
- 수행된 변경과 `NO_CHANGE`, failure, retry/recovery summary

### Blocking Rules

- 성공한 300 result, confirmed target, manifest/navigation coherence 또는 exact approval 중 하나라도 없으면 차단한다.
- `DEFINED` 상태에서는 readiness가 충족되어도 executor를 호출하지 않는다.
- 승인되지 않은 resource 종류나 operation으로 범위를 확장하지 않는다.
- credential-like 값을 감지하면 저장 또는 외부 호출 전에 request를 거부한다.
