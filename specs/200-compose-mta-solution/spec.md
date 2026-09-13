# 기능 명세: Protocol 200 MTA 솔루션 구성

**Feature Branch**: `200-compose-mta-solution`

**Created**: 2026-09-11

**Specification Status**: `READY_FOR_IMPLEMENTATION`

**Protocol Status**: `DEFINED` — runtime 미구현

**Input**: 000이 승인한 `PACKAGE` handoff와 검증 완료된 generation result를 Cloud Foundry용 MTA 배포 단위로 구성한다.

## 사용자 시나리오 및 테스트

### 사용자 스토리 1 - 검증 결과만 패키징 (Priority: P1)

솔루션 개발자는 CAP Backend, Fiori/SAPUI5 Frontend 또는 둘 모두의 검증 완료 결과를 하나의 패키징 요청으로 전달한다. 시스템은 handoff와 dependency evidence를 확인하고 검증되지 않았거나 변조된 입력은 descriptor 생성 전에 차단한다.

**Why this priority**: 잘못된 생성 결과를 패키징하면 이후 배포 단계에서 더 큰 비용과 외부 변경 위험이 발생한다.

**Independent Test**: 유효한 generation result와 실패·누락·checksum 불일치 result를 각각 입력해 전자만 composition 단계로 진행하고 후자는 구조화된 차단 결과를 반환하는지 확인한다.

**Acceptance Scenarios**:

1. **Given** 유효한 000 handoff와 검증 완료된 Backend/Frontend result, **When** composition preflight를 수행하면, **Then** 입력 provenance, validation status와 checksum을 확인하고 요청을 승인한다.
2. **Given** validation이 실패했거나 완료 증거가 없는 result, **When** 요청을 평가하면, **Then** 파일을 생성하지 않고 해당 dependency와 차단 사유를 보고한다.
3. **Given** handoff 또는 입력에 credential-like 값이 포함됨, **When** 요청을 평가하면, **Then** 값을 저장하거나 출력하지 않고 요청 전체를 거부한다.

---

### 사용자 스토리 2 - 일관된 MTA topology 구성 (Priority: P1)

솔루션 개발자는 검증된 구성요소의 module, resource, route, destination, authentication 및 HTML5 repository 요구를 충돌 없이 연결한 target-neutral descriptor를 얻는다.

**Why this priority**: MTA의 핵심 가치는 독립 생성된 구성요소를 추적 가능하고 재현 가능한 하나의 deployment topology로 연결하는 데 있다.

**Independent Test**: Backend 전용, Frontend 전용, 통합 솔루션 fixture를 구성해 필요한 module/resource 관계가 생성되고 application ID, `sap.cloud.service`, destination, route 충돌이 모두 검출되는지 확인한다.

**Acceptance Scenarios**:

1. **Given** CAP와 HTML5 application result, **When** topology를 구성하면, **Then** 각 module의 `path`, `requires`, `provides`와 필요한 managed service/resource 관계가 완전하게 생성된다.
2. **Given** 동일한 application ID, `sap.cloud.service`, resource name 또는 route를 서로 다르게 주장하는 입력, **When** topology를 구성하면, **Then** 임의 병합하지 않고 충돌 위치와 해결 항목을 보고한다.
3. **Given** landscape별 endpoint, org, space 또는 secret이 입력됨, **When** base descriptor를 렌더링하면, **Then** target-neutral 값만 유지하고 환경별 값은 별도 배포 handoff 책임으로 남긴다.

---

### 사용자 스토리 3 - archive-ready 결과 검증 (Priority: P2)

릴리스 담당자는 생성된 descriptor와 build plan을 정적 검증하고, 사용 가능한 로컬 build 도구가 있을 때만 격리된 build validation을 수행하여 Protocol 300이 소비할 수 있는 artifact manifest를 얻는다.

**Why this priority**: 배포 가능한 artifact임을 checksum과 검증 보고서로 증명해야 300의 외부 변경 gate를 안전하게 열 수 있다.

**Independent Test**: 유효·무효 descriptor fixture 및 build tool 유무 조건에서 schema/reference 검증, dry-run/build 결과, checksum과 민감정보 제거가 기대대로 보고되는지 확인한다.

**Acceptance Scenarios**:

1. **Given** 완전한 descriptor, **When** 정적 validation을 실행하면, **Then** schema, module/resource reference, 경로 경계와 secret scan 결과가 모두 기록된다.
2. **Given** build tool이 없거나 build가 실패함, **When** package validation을 수행하면, **Then** archive를 검증 완료로 표시하지 않고 재현 가능한 원인과 후속 조치를 반환한다.
3. **Given** build와 모든 필수 validation이 성공함, **When** 결과를 확정하면, **Then** archive 경로, SHA-256 checksum, descriptor fingerprint와 validation report를 포함한 `DeploymentArtifact`를 생성한다.

### Edge Cases

- Backend 또는 Frontend가 없는 단일 구성요소 패키지는 허용하되 최소 하나의 검증된 generation result가 필수다.
- 동일한 logical resource를 여러 module이 공유하는 것은 service/plan/config가 일치할 때만 허용한다.
- 입력 경로가 workspace 밖을 가리키거나 symbolic link로 boundary를 벗어나면 차단한다.
- 기존 `mta.yaml`이 있으면 자동 덮어쓰지 않고, 동일 fingerprint면 재사용 가능 상태를 보고하며 다르면 충돌로 차단한다.
- build tool이 없다는 사실을 정적 validation 성공으로 대체하지 않으며 archive-ready로 보고하지 않는다.
- 생성 결과가 validation 이후 변경되어 checksum이 달라졌으면 재검증을 요구한다.
- platform/space별 service plan 가용성은 200에서 사실로 가정하지 않고 300 preflight의 확인 대상으로 전달한다.

## 요구사항

### 기능 요구사항

- **FR-001**: 시스템은 000의 versioned `ProtocolHandoff`가 Protocol 200 및 계획 step과 일치하는지 검증해야 한다.
- **FR-002**: 시스템은 패키징 시작 전에 최소 하나의 generation result가 `PASSED`이며 provenance, output boundary와 checksum을 포함하는지 검증해야 한다.
- **FR-003**: 시스템은 handoff의 모든 `completedDependencies`와 실제 입력 result 사이의 완전한 대응을 검증해야 한다.
- **FR-004**: 시스템은 credential-like key/value가 handoff, generation result, descriptor 또는 report에 포함되면 저장·렌더링 전에 요청을 거부해야 한다.
- **FR-005**: 시스템은 입력 project의 파일을 수정하지 않고 명시된 output boundary에만 composition 결과를 생성해야 한다.
- **FR-006**: 시스템은 Backend 전용, Frontend 전용 및 통합 solution topology를 지원하되 구성요소별 module 유형과 build path를 generation result에서 파생해야 한다.
- **FR-007**: 시스템은 module의 `requires`/`provides`와 resource 참조가 존재하며 방향이 일관적인지 검증해야 한다.
- **FR-008**: 시스템은 인증, destination, HTML5 application repository 및 content deployment 요구를 입력 capability에 따라서만 구성해야 한다.
- **FR-009**: 시스템은 application ID, `sap.cloud.service`, module/resource name, destination name 및 route 충돌을 deterministic하게 탐지해야 한다.
- **FR-010**: 시스템은 base descriptor에 CF API, org, space, stage별 endpoint, credential 또는 token을 기록하지 않아야 한다.
- **FR-011**: 시스템은 동일한 정규화 입력에 대해 의미상 동일한 descriptor와 stable fingerprint를 생성해야 한다.
- **FR-012**: 시스템은 기존 output과 충돌할 때 자동 덮어쓰지 않고 동일 fingerprint 재사용 또는 차단 결과를 반환해야 한다.
- **FR-013**: 시스템은 descriptor schema, module/resource reference, build path boundary와 비밀정보 부재를 정적으로 검증해야 한다.
- **FR-014**: 시스템은 archive-ready 판정 전에 승인된 build plan에 따른 MTA build validation 성공을 요구해야 한다.
- **FR-015**: 시스템은 build tool 미설치, build 실패 또는 validation 실패를 성공으로 완화하지 않아야 한다.
- **FR-016**: 시스템은 검증 성공 시 archive 경로, SHA-256 checksum, descriptor fingerprint, source result references와 validation report를 포함한 `DeploymentArtifact`를 생성해야 한다.
- **FR-017**: 시스템은 Protocol 300에 target-neutral artifact와 service requirement를 전달하되 배포 또는 Work Zone 변경을 수행하지 않아야 한다.
- **FR-018**: Protocol 200의 registry 상태가 `DEFINED`인 동안 executor는 등록되지 않아야 하며 실제 package build를 실행하지 않아야 한다.

### 주요 정보 객체

- **CompositionRequest**: 000 handoff, 검증된 component result 참조, solution identity, output boundary와 target-neutral 요구를 담는다.
- **ComponentResult**: protocol, validation status, provenance, output path, checksum과 제공/요구 capability를 나타낸다.
- **MtaTopology**: module, resource 및 dependency edge의 정규화된 target-neutral graph다.
- **CollisionReport**: 식별자, 경로, route와 configuration 충돌 및 해결 필요 항목을 담는다.
- **BuildPlan**: descriptor와 module build 순서, 입력 경로 및 예상 archive를 담는다.
- **DeploymentArtifact**: 검증된 archive, checksum, descriptor fingerprint와 validation evidence를 담아 300에 전달한다.
- **CompositionReport**: 실행 상태, 생성 파일, 검증 결과, 차단 사유와 민감정보 제거 상태를 기록한다.

## 성공 기준

### 측정 가능한 결과

- **SC-001**: validation evidence가 없거나 실패한 generation result fixture의 100%가 파일 생성 전에 차단된다.
- **SC-002**: 대표 Backend 전용, Frontend 전용 및 통합 fixture의 100%가 누락 없는 module/resource topology를 생성한다.
- **SC-003**: 준비된 identifier, route, resource 및 output 충돌 fixture의 100%가 정확한 위치와 함께 탐지된다.
- **SC-004**: 같은 입력을 반복 구성한 결과의 descriptor fingerprint가 100% 동일하다.
- **SC-005**: archive-ready로 보고된 결과의 100%가 schema/reference/build validation과 SHA-256 checksum을 가진다.
- **SC-006**: 생성 descriptor, artifact manifest와 report에 credential 또는 token 저장 건수가 0건이다.
- **SC-007**: Protocol 200 validation 중 Cloud Foundry 또는 Work Zone 외부 변경 호출 건수가 0건이다.

## 가정

- 100 및 001~004의 source result는 Protocol 200 input adapter가 공통 `ComponentResult` envelope로 정규화하며, 원본 result identity, validation evidence, output boundary와 checksum을 보존한다.
- MTA build tool과 지원 version은 구현 시 pinning 및 compatibility 검증 대상으로 정하며, 현재 문서는 특정 설치 상태를 가정하지 않는다.
- service offering/plan 가용성, quota와 entitlement는 landscape 종속이므로 300의 read-only preflight에서 확인한다.
- Protocol 200 구현이 완료되고 필수 test가 통과하기 전 registry 상태는 `DEFINED`로 유지한다.
