# 기능 명세: Protocol 300 Cloud Foundry 배포

**Feature Branch**: `300-deploy-cloud-foundry`

**Created**: 2026-09-11

**Specification Status**: `READY_FOR_IMPLEMENTATION`

**Protocol Status**: `DEFINED` — runtime 미구현

**Risk**: External change

**Input**: 000이 승인한 `DEPLOY_CF` handoff와 Protocol 200의 검증된 `DeploymentArtifact`를 확인된 SAP BTP Cloud Foundry target에 배포하고 결과를 검증한다.

## 사용자 시나리오 및 테스트

### 사용자 스토리 1 - 배포 전 target과 권한 확인 (Priority: P1)

릴리스 담당자는 배포하려는 HTTPS CF API endpoint, org, space와 stage를 명시하고, 시스템은 현재 session, role, plugin, entitlement/quota 및 artifact checksum을 read-only로 확인한다. 모든 값과 실제 target이 일치하기 전에는 외부 변경이 시작되지 않는다.

**Why this priority**: 잘못된 space 또는 준비되지 않은 landscape에 배포하는 것이 가장 큰 운영 위험이다.

**Independent Test**: target field 누락, session 불일치, plugin/entitlement 부족, artifact 변조와 완전한 preflight fixture를 입력하여 완전한 경우만 `READY_FOR_APPROVAL`이 되는지 확인한다.

**Acceptance Scenarios**:

1. **Given** API, org, space, stage 중 하나가 누락되거나 current target과 다름, **When** preflight를 수행하면, **Then** deploy command 없이 차단 사유와 expected/observed target reference를 보고한다.
2. **Given** archive checksum이 200 result와 다르거나 validation evidence가 완전하지 않음, **When** preflight를 수행하면, **Then** artifact를 거부하고 200 재검증을 요구한다.
3. **Given** session, required plugin, role, service offering/plan, entitlement 또는 quota를 확인할 수 없음, **When** preflight를 수행하면, **Then** 추측하지 않고 해당 prerequisite를 차단 사유로 기록한다.

---

### 사용자 스토리 2 - 명시적으로 승인된 배포 실행 (Priority: P1)

릴리스 담당자는 preflight snapshot의 정확한 target과 artifact에 대해 외부 변경 의도를 명시적으로 승인한다. 시스템은 승인 scope와 freshness를 재검증하고, idempotency policy에 따라 하나의 deployment operation을 시작한다.

**Why this priority**: 기술 prerequisite가 충족되어도 사용자가 대상과 변경을 명시적으로 승인하지 않으면 외부 시스템을 변경해서는 안 된다.

**Independent Test**: 승인 없음/만료/target mismatch/중복 idempotency key 및 유효 승인 fixture를 사용해 전자는 모두 실행 전 차단되고 유효한 요청만 mock adapter 1회를 호출하는지 확인한다.

**Acceptance Scenarios**:

1. **Given** deploy intent 또는 approval evidence가 없거나 preflight target/artifact와 다름, **When** 실행 gate를 평가하면, **Then** adapter를 호출하지 않고 `APPROVAL_REQUIRED`로 차단한다.
2. **Given** stage가 `PROD`이고 별도 production approval이 없음, **When** 실행 gate를 평가하면, **Then** 일반 승인으로 대체하지 않고 차단한다.
3. **Given** 모든 gate가 충족되고 동일 idempotency key의 성공 operation이 없음, **When** 배포를 실행하면, **Then** shell interpolation 없이 검증된 argument로 정확히 한 번 operation을 시작한다.

---

### 사용자 스토리 3 - 결과 검증과 안전한 recovery (Priority: P2)

운영 담당자는 deployment operation, application/service 변화, health와 route 결과를 secret-free report로 확인하고, 실패하거나 결과가 불명확하면 자동 재시도 대신 안전한 recovery guidance를 얻는다.

**Why this priority**: command 종료만으로 배포 성공을 단정하면 부분 배포와 unhealthy application을 놓칠 수 있다.

**Independent Test**: success, failed, timeout/unknown, partial deployment fixture에서 operation 상태와 health/route 판정, retry/rollback guidance 및 secret redaction을 검증한다.

**Acceptance Scenarios**:

1. **Given** operation이 성공하고 기대 application이 healthy이며 route가 확인됨, **When** post-deploy validation을 수행하면, **Then** target fingerprint, operation ID, changed resource summary와 검증 evidence를 `SUCCEEDED` report에 기록한다.
2. **Given** command failure, timeout 또는 일부 application unhealthy, **When** 결과를 평가하면, **Then** 성공으로 보고하지 않고 상태를 `FAILED` 또는 `UNKNOWN`으로 구분한다.
3. **Given** 실패 또는 unknown 결과, **When** report를 생성하면, **Then** credential 없는 diagnostic과 사용자 승인 후 수행할 retry/rollback guidance를 제공하고 자동 destructive recovery를 수행하지 않는다.

### Edge Cases

- API endpoint는 HTTPS absolute URL이어야 하며 target fingerprint 계산 전 canonicalize한다.
- 같은 org/space 이름이라도 API endpoint가 다르면 다른 target이다.
- preflight 후 current CF target, artifact checksum 또는 approval scope가 바뀌면 preflight와 승인을 다시 요구한다.
- `PROD`는 이름 추론이 아니라 handoff의 명시적 stage 값으로 판정하고 별도 production approval을 요구한다.
- 기존 성공 operation과 같은 idempotency key는 재배포하지 않고 기존 결과를 반환한다. 실패/unknown operation은 사용자 재승인 없이 자동 retry하지 않는다.
- CLI output, environment, service key와 `VCAP_SERVICES`에서 credential을 report에 복사하지 않는다.
- route가 의도적으로 없는 worker module은 artifact의 expected topology에 따라 health만 검증한다.
- Work Zone content provider, content item과 site publication은 Protocol 400 책임이며 300이 변경하지 않는다.

## 요구사항

### 기능 요구사항

- **FR-001**: 시스템은 000의 `ProtocolHandoff`가 Protocol 300 step/version과 일치하고 Protocol 200 dependency가 완료되었는지 검증해야 한다.
- **FR-002**: 시스템은 status `READY`, archive path, SHA-256 checksum, descriptor fingerprint 및 완전한 validation evidence를 가진 Protocol 200 `DeploymentArtifact`만 허용해야 한다.
- **FR-003**: 시스템은 배포 직전 archive checksum을 다시 계산하고 artifact contract와 불일치하면 실행을 차단해야 한다.
- **FR-004**: 시스템은 target의 HTTPS API endpoint, org, space와 `DEV|TEST|PROD` stage가 모두 명시되어야 한다.
- **FR-005**: 시스템은 read-only inspection으로 current API/org/space가 요청 target과 정확히 일치하는지 검증해야 한다.
- **FR-006**: 시스템은 active authenticated session과 필요한 org/space role을 확인할 수 없으면 배포를 차단해야 한다.
- **FR-007**: 시스템은 MTA deploy에 필요한 CLI/plugin의 설치 및 지원 version을 확인할 수 없으면 배포를 차단해야 한다.
- **FR-008**: 시스템은 artifact의 service requirement마다 target marketplace offering/plan, entitlement 및 충분한 quota를 read-only로 확인해야 한다.
- **FR-009**: 시스템은 credential, token, password, service key, authentication header 또는 `VCAP_SERVICES` 내용을 handoff, snapshot, command argument, log와 report에 저장하지 않아야 한다.
- **FR-010**: 시스템은 `deployIntent=true`와 target/artifact/preflight snapshot에 결속된 명시적 approval evidence를 요구해야 한다.
- **FR-011**: 시스템은 `PROD` stage에 일반 승인과 구분되는 별도 production approval evidence를 요구해야 한다.
- **FR-012**: 시스템은 approval이 누락, 만료 또는 target/artifact와 불일치하면 deploy adapter를 호출하지 않아야 한다.
- **FR-013**: 시스템은 approved target fingerprint와 artifact checksum을 실행 직전에 재확인하고 바뀌면 preflight/approval을 무효화해야 한다.
- **FR-014**: 시스템은 shell interpolation 없이 allowlisted executable과 argument array로 배포 operation을 시작해야 한다.
- **FR-015**: 시스템은 idempotency key별 operation 상태를 확인하여 성공한 배포의 중복 실행을 방지해야 한다.
- **FR-016**: 시스템은 result/protocol ID, operation ID, target reference/fingerprint, application ID, `sap.cloud.service`, artifact digest, 확인된 subaccount, 검증 시각과 secret-free changed application/service summary를 기록해야 한다.
- **FR-017**: 시스템은 command exit뿐 아니라 deployment operation status, 기대 application health와 route를 검증한 뒤 성공을 판정해야 한다.
- **FR-018**: 시스템은 timeout 또는 관찰 불가 상태를 `UNKNOWN`으로 보고하고 성공이나 실패로 추측하지 않아야 한다.
- **FR-019**: 시스템은 실패/unknown 시 자동 retry, undeploy 또는 rollback을 수행하지 않고 영향과 사용자 승인 prerequisite가 있는 recovery guidance를 제공해야 한다.
- **FR-020**: 시스템은 Work Zone publication이나 scope 밖 landscape 변경을 수행하지 않아야 한다.
- **FR-021**: Protocol 300 registry 상태가 `DEFINED`인 동안 어떤 실제 `cf` command도 실행하지 않고 executor를 등록하지 않아야 한다.

### 주요 정보 객체

- **DeploymentRequest**: handoff, artifact, target, deploy intent, approval evidence와 idempotency key를 담는다.
- **CloudFoundryTarget**: canonical HTTPS API endpoint, org, space, stage와 fingerprint를 담는다.
- **PreflightSnapshot**: 확인된 current target, session/role, CLI/plugin, service/entitlement/quota 및 artifact check를 secret 없이 기록한다.
- **ApprovalEvidence**: target/artifact/preflight fingerprint, 승인 범위, 승인 시각과 production 여부를 담고 credential은 담지 않는다.
- **DeploymentOperation**: idempotency key, platform operation ID, 상태와 timestamp를 추적한다.
- **DeploymentValidation**: application health, route와 expected topology의 비교 결과다.
- **DeploymentReport**: 최종 상태, target, operation, changed resource summary, validation, blocking reason과 recovery guidance를 담는다.

## 성공 기준

### 측정 가능한 결과

- **SC-001**: target, artifact, session, role, plugin, entitlement 또는 quota가 불완전한 fixture의 100%가 adapter 호출 전에 차단된다.
- **SC-002**: approval 누락·만료·mismatch 및 production 추가 승인 누락 fixture의 100%가 외부 변경 전에 차단된다.
- **SC-003**: 승인된 mock deployment case에서 adapter 호출 횟수는 idempotency key당 최대 1회다.
- **SC-004**: 성공으로 보고된 case의 100%가 operation success, expected application health와 route evidence를 가진다.
- **SC-005**: timeout/관찰 불가 case의 100%가 `UNKNOWN`으로 구분되고 자동 retry 또는 rollback 호출은 0회다.
- **SC-006**: handoff, snapshot, log와 report의 credential/token 저장 건수가 0건이다.
- **SC-007**: Protocol 300이 `DEFINED`인 동안 test 및 validation에서 실제 `cf` command 실행 건수는 0건이다.

## 가정

- 인증은 사용자가 준비한 실행 환경의 active session으로만 제공되며 protocol payload에 전달하지 않는다.
- CLI/plugin 지원 version과 approval 유효기간은 구현 전 policy module 및 test로 고정한다.
- rollback 가능 여부는 배포 전 captured non-secret baseline과 platform operation 상태에 따라 달라지며 자동 수행하지 않는다.
- Protocol 300 구현과 모든 safety test가 완료되기 전 registry 상태는 `DEFINED`로 유지한다.
