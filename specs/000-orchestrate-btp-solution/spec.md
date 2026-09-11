# 기능 명세: BTP 솔루션 요청 orchestration 기반

**Feature Branch**: `000-orchestrate-btp-solution`

**Created**: 2026-09-11

**Status**: Draft

**Input**: 사용자는 Frontend, Backend, 배포 프로젝트 구분 없이 자연어로 SAP BTP 솔루션 작업을 요청한다.

## 사용자 시나리오 및 테스트

### 사용자 스토리 1 - 하나의 자연어 진입점 (Priority: P1)

사용자는 기술 프로젝트 경계를 알지 못해도 만들고 싶은 업무 솔루션과 원하는 결과를 한 번에 설명한다. 시스템은 요청을 Frontend, Backend, 통합 패키징, Cloud Foundry 배포, Work Zone 게시 범위로 분해하고 실행 순서를 제시한다.

**Why this priority**: 사용자가 내부 프로젝트 구조를 구분하지 않는 것이 전체 제품의 핵심 가치다.

**Independent Test**: Frontend 전용, Backend 전용, 전체 솔루션 요청을 입력하여 각각 필요한 범위와 선행 관계가 포함된 실행 계획이 생성되는지 확인한다.

**Acceptance Scenarios**:

1. **Given** 기존 OData를 사용하는 화면 생성 요청, **When** 요청을 분석하면, **Then** 기존 001 Frontend 진입 protocol을 포함하는 계획을 만든다.
2. **Given** CAP Backend와 Fiori 화면을 함께 요청, **When** 요청을 분석하면, **Then** Backend 계약 확정 후 Frontend 생성, 통합 순서가 포함된다.
3. **Given** 배포와 Work Zone 게시까지 요청, **When** 요청을 분석하면, **Then** 생성·검증·패키징·배포·게시 순서와 각 외부 변경 gate가 포함된다.

---

### 사용자 스토리 2 - 재사용 가능한 protocol routing (Priority: P1)

시스템 관리자는 요청별 Spec을 만들지 않고 고정된 protocol을 재사용한다. 각 protocol은 입력, 출력, 선행 조건, 외부 변경 수준과 구현 상태를 공개한다.

**Why this priority**: routing을 대화 지침에만 의존하지 않고 검증 가능한 계약으로 유지해야 한다.

**Independent Test**: 등록된 모든 scope가 정확히 하나의 protocol에 연결되고, 구현되지 않은 protocol은 실행 가능한 것으로 표시되지 않는지 확인한다.

**Acceptance Scenarios**:

1. **Given** Frontend scope, **When** routing하면, **Then** 001로 연결하고 002·003·004 판정은 기존 001에 위임한다.
2. **Given** Backend, 패키징, 배포 또는 게시 scope, **When** routing하면, **Then** 각각 100, 200, 300, 400 protocol에 연결한다.
3. **Given** 등록되지 않은 scope 또는 구현되지 않은 executor, **When** 실행 가능성을 평가하면, **Then** 추측 실행하지 않고 차단 원인과 다음 조치를 반환한다.

---

### 사용자 스토리 3 - 안전한 외부 변경 계획 (Priority: P2)

사용자는 생성과 외부 시스템 변경을 구분할 수 있고, 배포 또는 게시 전에 대상 환경과 권한 요구사항을 확인할 수 있다.

**Why this priority**: 잘못된 Cloud Foundry space 또는 Work Zone tenant 변경을 방지해야 한다.

**Independent Test**: target 정보나 명시적 외부 변경 의도가 없는 배포·게시 요청이 실행 불가로 표시되는지 확인한다.

**Acceptance Scenarios**:

1. **Given** 배포 의도는 있으나 target이 없음, **When** 계획을 검증하면, **Then** target 확인을 blocking prerequisite로 기록한다.
2. **Given** Work Zone 게시 요청, **When** 계획을 검증하면, **Then** edition, site/content target과 권한 확인을 요구한다.
3. **Given** 계획만 요청, **When** 분석하면, **Then** 파일 생성 이외의 외부 변경을 수행하지 않는다.

### Edge Cases

- 요청에 Frontend와 Backend 표현이 모두 없으면 확인 가능한 결과물을 기준으로 범위를 판정하고, 판정 근거가 부족하면 계획을 차단한다.
- Work Zone edition이 없으면 STANDARD 또는 ADVANCED를 임의 선택하지 않는다.
- Backend가 새로 생성되는 경우 Frontend가 존재하지 않는 service metadata를 먼저 소비하지 않도록 계약 의존성을 둔다.
- 기존 001 CLI 요청은 새로운 진입점 추가 후에도 동일하게 동작해야 한다.
- 외부 변경을 포함하지 않은 요청에는 배포·게시 단계를 자동 추가하지 않는다.

## 요구사항

### 기능 요구사항

- **FR-001**: 시스템은 모든 BTP 솔루션 자연어 요청을 하나의 최상위 orchestration protocol에서 정규화해야 한다.
- **FR-002**: 시스템은 요청을 FRONTEND, BACKEND, PACKAGE, DEPLOY_CF, PUBLISH_WORK_ZONE scope의 조합으로 분류해야 한다.
- **FR-003**: 시스템은 원문 요청, scope 판정 근거, 가정, prerequisite와 제외 범위를 실행 계획에 보존해야 한다.
- **FR-004**: 시스템은 scope를 versioned protocol registry의 정확히 하나의 protocol에 연결해야 한다.
- **FR-005**: FRONTEND scope는 기존 001을 통과하고 002, 003, 004 선택을 000에서 복제하지 않아야 한다.
- **FR-006**: 시스템은 Backend 계약이 Frontend보다 먼저 필요한 전체 생성 요청의 dependency를 표현해야 한다.
- **FR-007**: 시스템은 PACKAGE가 Backend와 Frontend 결과에, DEPLOY_CF가 PACKAGE 결과에, PUBLISH_WORK_ZONE이 DEPLOY_CF 결과에 의존하도록 계획해야 한다.
- **FR-008**: 시스템은 구현되지 않았거나 prerequisite가 충족되지 않은 protocol을 실행 가능으로 표시하지 않아야 한다.
- **FR-009**: 시스템은 외부 변경 단계에 명시적 요청 의도와 확인된 target을 요구해야 한다.
- **FR-010**: 시스템은 Cloud Foundry target을 API endpoint, org, space와 stage로 식별해야 한다.
- **FR-011**: 시스템은 Work Zone target을 edition, subaccount, site/content target으로 식별해야 한다.
- **FR-012**: 시스템은 credentials, token, password와 인증 header 값을 계획 또는 run artifact에 저장하지 않아야 한다.
- **FR-013**: 시스템은 요청별 Feature Spec을 만들지 않고 runtime plan과 report만 생성해야 한다.
- **FR-014**: 시스템은 기존 001~004 Frontend 생성 동작과 CLI contract를 유지해야 한다.
- **FR-015**: 시스템은 protocol별 담당 Agent가 중앙 `specs/`의 단일 Spec 원본을 참조하도록 구성해야 한다.
- **FR-016**: 시스템은 계획 결과에 단계별 protocol, dependency, 상태, approval level, blocking reason과 validation criteria를 포함해야 한다.
- **FR-017**: 시스템은 실행 전용 adapter가 없는 100, 200, 300, 400 protocol을 `DEFINED` 상태로 공개하되 완료된 기능으로 보고하지 않아야 한다.
- **FR-018**: 시스템은 요청 분석과 계획 생성을 local read-only 성격으로 수행해야 한다.

### 주요 정보 객체

- **SolutionRequest**: 원문, 요청된 결과, target 단서와 명시적 외부 변경 의도를 담는다.
- **SolutionPlan**: scope, 단계, dependency, prerequisite, approval과 validation 기준을 담는 runtime 계획이다.
- **ProtocolDescriptor**: protocol ID, version, 담당 scope, 입력·출력 capability, 상태와 executor 정보를 담는다.
- **LandscapeTarget**: Cloud Foundry 또는 Work Zone 실행 대상을 credential 없이 식별한다.
- **ProtocolHandoff**: 상위 계획의 한 단계를 하위 protocol에 전달하는 versioned 계약이다.

## 성공 기준

### 측정 가능한 결과

- **SC-001**: 대표 Frontend 전용, Backend 전용, 전체 솔루션 요청의 100%가 누락 없는 scope와 dependency를 포함한 계획을 생성한다.
- **SC-002**: 등록된 scope의 100%가 정확히 하나의 protocol descriptor로 해석된다.
- **SC-003**: target 또는 executor가 없는 외부 변경 단계의 100%가 실행 전에 차단된다.
- **SC-004**: 기존 Frontend generator test의 100%가 새 orchestration 도입 후에도 통과한다.
- **SC-005**: 생성되는 계획과 문서의 credential 저장 건수가 0건이다.
- **SC-006**: protocol 담당 Agent 정의의 100%가 중앙 Spec 경로와 책임 범위를 명시한다.

## 가정

- 이번 Feature는 orchestration 기반과 protocol 경계를 구현하며 실제 CAP 생성, MTA build, CF deploy와 Work Zone API 호출은 후속 protocol 구현에서 제공한다.
- CAP의 첫 runtime 대상은 Node.js로 계획하되 100 protocol 구현 전에는 기술 선택을 실행 가능한 기능으로 표시하지 않는다.
- Cloud Foundry와 Work Zone target은 사용자 입력 또는 인증된 실행 환경의 read-only inspection으로 확인한다.
- 기존 `npm run generate`는 Frontend 전용 호환 진입점으로 유지한다.
