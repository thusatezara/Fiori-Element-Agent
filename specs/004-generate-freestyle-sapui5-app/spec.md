# 기능 명세: Freestyle SAPUI5 애플리케이션 생성

**Feature Branch**: `004-generate-freestyle-sapui5-app`

**Created**: 2026-09-08

**Last Updated**: 2026-09-08

**Status**: Draft

**Input**: User description: "FreeStyle이 적합하다고 승인된 업무 요청을 대화로 구체화하여 화면, 상태, interaction과 navigation을 직접 제어하는 SAPUI5 애플리케이션을 생성하고, UI annotation에 의존하지 않음을 포함해 검증한다."

## 사용자 시나리오 및 테스트 *(필수)*

### 사용자 스토리 1 - 화면 전환과 상태를 직접 제어하는 업무 흐름 생성 (Priority: P1)

SAP 애플리케이션 개발자 또는 업무 전문가는 화면 단계, 이동 조건과 유지할 상태를 일상적인 표현으로 설명하고, 그 흐름을 직접 제어하는 검증된 SAPUI5 애플리케이션을 받는다.

**우선순위 이유**: 조건부 화면 전환과 상태 보존은 FreeStyle을 선택하는 핵심 이유이며, 이것만으로도 완결된 다단계 업무를 수행할 수 있다.

**독립 테스트**: `FREE-WIZARD-01`을 제공하고 생성 요약을 승인하여 여러 단계의 화면, 조건부 navigation과 이전 단계 상태 보존이 생성·검증되는지 확인한다.

**인수 시나리오**:

1. **Given** `FREESTYLE`로 승인된 요청에 화면 단계, 상태 변화 또는 이동 조건이 충분히 설명되지 않았을 때, **When** FreeStyle 생성을 준비하면, **Then** 시스템은 사용자가 실제 업무 흐름을 설명할 수 있는 비기술적 질문만 제시한다.
2. **Given** 사용자가 여러 단계의 입력에 따라 다음 화면과 선택지가 동적으로 달라지는 흐름을 설명했을 때, **When** 화면 구조를 결정하면, **Then** 단계별 표시, 동작 처리와 상태 책임을 구분한 구성을 추천하고 사용자에게 업무 흐름으로 설명한다.
3. **Given** 사용자가 여러 화면 사이의 이동, 이전 단계 복귀와 입력 상태 유지를 요구할 때, **When** navigation을 결정하면, **Then** 시작 화면과 각 이동 조건 및 보존할 상태가 원문 요구사항에 연결된다.
4. **Given** 화면 흐름 생성 입력이 완전할 때, **When** 사용자가 생성 요약을 승인하고 프로젝트를 생성·검증하면, **Then** 시작 화면, navigation과 상태 보존이 요구사항에 추적되고 필수 검증 실패는 완료로 표시되지 않는다.

---

### 사용자 스토리 2 - 입력 검증과 오류 복구가 가능한 업무 흐름 생성 (Priority: P2)

사용자는 입력 확인, 취소와 실패 시 복구 방식을 설명하고, 오류 유형별 안내와 재시도 흐름이 포함된 FreeStyle 앱을 받는다.

**우선순위 이유**: 정상 경로와 별개로 오류를 이해하고 복구할 수 있어야 사용자가 실제 업무를 중단 없이 완료할 수 있다.

**독립 테스트**: `FREE-ERROR-01`을 사용하여 입력 오류, 데이터 접근 실패와 업무 처리 실패가 서로 다른 결과와 복구 방식으로 생성·검증되는지 확인한다.

**인수 시나리오**:

1. **Given** 사용자가 입력 validation, 확인, 취소와 오류 복구를 요구할 때, **When** interaction을 결정하면, **Then** 성공, 사용자 입력 오류와 데이터 접근 실패를 구분하는 흐름이 생성 요약에 포함된다.
2. **Given** 오류 복구 생성 요약이 승인되었을 때, **When** 프로젝트를 생성하고 검증하면, **Then** 오류 유형별 안내, 재시도와 취소 흐름이 요구사항에 추적된다.

---

### 사용자 스토리 3 - FreeStyle 범위와 생성 안전성 확인 (Priority: P3)

사용자는 UI annotation 의존 여부, 더 표준적인 유형의 적합성, backend 선행 조건과 승인 상태를 생성 전에 확인한다.

**우선순위 이유**: FreeStyle의 자유도가 표준 기능 우회나 backend 책임 대체로 이어지지 않도록 생성 경계를 명확히 해야 한다.

**독립 테스트**: `FREE-ANNOTATION-01`, `FREE-RECLASS-01`, `FREE-BACKEND-01`, `FREE-APPROVAL-01`을 각각 제출하여 annotation 비의존, 재판정, 선행 조건과 승인 대기가 구분되는지 확인한다.

**인수 시나리오**:

1. **Given** 외부 서비스가 UI annotation을 제공할 때, **When** FreeStyle 화면 구성을 결정하면, **Then** 데이터 구조와 capability 확인에는 필요한 정보만 사용하고 화면 layout과 interaction은 UI annotation에 의존하지 않는다.
2. **Given** 요구사항을 Standard의 목록·상세 흐름이나 Custom의 표준 화면 요소 조합으로 충분히 충족할 수 있을 때, **When** FreeStyle 필요성을 재검토하면, **Then** 불필요한 FreeStyle 생성을 진행하지 않고 더 표준적인 유형과 유지보수 영향을 설명한다.
3. **Given** 필요한 property, association, action 또는 transaction capability를 서비스 정보에서 확인할 수 없을 때, **When** 생성을 준비하면, **Then** client 동작으로 대신하거나 존재를 추측하지 않고 누락된 항목을 backend 선행 조건으로 표시한다.
4. **Given** 생성 요약이 아직 승인되지 않았을 때, **When** 시스템이 프로젝트 생성 가능 여부를 결정하면, **Then** 어떤 프로젝트 파일도 생성하지 않는다.

### Edge Cases

- 사용자가 “복잡한 화면”이라고만 표현하면 복잡성의 원인이 layout, 단계, 상태, interaction 또는 backend 규칙 중 무엇인지 확인한다.
- 여러 화면이 있어도 단순 목록·상세 navigation이면 FreeStyle을 유지하지 않고 Standard 또는 Custom 재판정을 검토한다.
- 화면 간 이동 조건이 순환하거나 서로 충돌하면 생성 전에 흐름을 확정하도록 요청한다.
- 화면 또는 target 이름이 충돌하면 기존 파일을 덮어쓰지 않고 수정을 요청한다.
- 서비스 metadata는 데이터 구조 확인에 사용할 수 있지만 UI annotation을 화면 생성 근거로 사용하지 않는다.
- client 로직으로 backend 권한, transaction, 계산 또는 데이터 무결성을 대신하지 않는다.
- 요청에 없는 custom control이나 비표준 동작을 편의를 이유로 임의 생성하지 않는다.
- build는 성공하지만 시작 화면, navigation, 상태 또는 주요 interaction 검증이 실패하면 완료로 표시하지 않는다.

## 요구사항 *(필수)*

### 기능 요구사항

- **FR-001**: 시스템은 `001-classify-fiori-app-request`에서 승인된 `FREESTYLE` 유형, 원문 업무 요청, 사용자 답변과 판정 근거를 입력으로 받아야 한다.
- **FR-002**: 시스템은 application 식별 정보, 결과 이름, 화면, interaction, 상태, data source와 navigation 요구사항을 확인해야 한다.
- **FR-003**: 시스템은 사용자가 MVC, View, Controller, Model, control 또는 binding을 몰라도 화면에서 보고 수행할 업무와 상태 변화를 설명할 수 있도록 질문해야 한다.
- **FR-004**: 시스템은 사용자에게 묻기 전에 서비스 정보에서 데이터 구조, action, transaction과 필요한 capability를 확인해야 한다.
- **FR-005**: 시스템은 요청 유형이 `FREESTYLE`이 아니면 FreeStyle 생성 진입점을 실행해서는 안 된다.
- **FR-006**: 시스템은 승인된 화면별 표시 정보, 사용자 동작과 상태 책임을 구분하여 구성해야 한다.
- **FR-007**: 시스템은 시작 화면, 화면 간 이동 조건, 이전·취소 흐름과 보존할 상태를 원문 요구사항에 연결해야 한다.
- **FR-008**: 시스템은 필요한 데이터 사용과 화면 상태 관리를 각각 승인된 책임에 맞게 구성해야 한다.
- **FR-009**: 시스템은 Standard List Report 또는 Custom View 프로젝트를 FreeStyle 생성의 선행 산출물로 요구해서는 안 된다.
- **FR-010**: 시스템은 화면 layout, control, interaction과 상태 관리를 UI annotation에 의존하지 않고 구성해야 한다.
- **FR-011**: 시스템은 UI annotation 파일을 생성하거나 화면 구성의 필수 입력으로 요구해서는 안 된다.
- **FR-012**: 시스템은 서비스 metadata를 데이터 구조와 capability 확인에 사용할 수 있지만 UI annotation을 화면 결정 근거로 사용해서는 안 된다.
- **FR-013**: 시스템은 사용자 입력 validation, 확인, 취소, 오류와 재시도 흐름을 원문 요구사항에 따라 구분해야 한다.
- **FR-014**: 시스템은 확인되지 않은 property, association, action 또는 capability를 존재하는 것으로 추측해서는 안 된다.
- **FR-015**: 시스템은 client 화면 로직으로 backend 업무 규칙, authorization, transaction 또는 데이터 무결성을 대신해서는 안 된다.
- **FR-016**: 시스템은 Standard 또는 Custom으로 충분한 요청에 FreeStyle을 강제하지 않고 재판정 선택지와 유지보수 영향을 제공해야 한다.
- **FR-017**: 시스템은 파일 생성 전에 앱 정보, 화면 목록, 시작 화면, 화면별 표시·동작·상태 책임, data source, navigation, validation, 포함·제외 범위와 선행 조건을 사용자 표현과 기술적 handoff 정보로 함께 요약해야 한다.
- **FR-018**: 시스템은 사용자가 생성 요약을 명시적으로 승인한 후에만 프로젝트를 생성해야 한다.
- **FR-019**: 시스템은 기존 파일이나 같은 이름의 기존 결과를 덮어쓰거나 삭제해서는 안 된다.
- **FR-020**: 시스템은 생성된 시작 화면, navigation, 상태 관리, validation, 주요 interaction, 데이터 연결과 UI annotation 미사용 여부를 검증해야 한다.
- **FR-021**: 시스템은 요구사항별 반영 여부, 생성 파일, 주요 설정, 판정 근거, 검증 결과와 후속 작업을 제공해야 한다.
- **FR-022**: 시스템은 필수 검증 실패 시 결과를 완료로 표시해서는 안 된다.
- **FR-023**: 시스템은 실제 SAP 환경에 로그인하거나 배포 또는 콘텐츠 변경을 수행해서는 안 된다.

### 주요 정보 객체 *(Key Entities)*

> 이 절의 객체는 DB table이나 OData EntityType을 뜻하지 않는다. 기능이 생성, 참조 또는 전달하는 주요 정보를 정의하며 저장 방식은 Plan에서 결정한다.

- **FreeStyle 생성 요청**: 승인된 유형, 원문 업무 요청, 사용자 답변, 앱 정보, 화면, 상태, data source와 navigation 요구사항이다.
- **업무 흐름 설명**: 사용자가 원하는 화면 단계, 입력, 선택, 상태 변화, 오류와 복구를 기술 용어 없이 표현한 내용이다.
- **화면 책임 결정**: 각 화면의 표시 정보, 동작 처리, 상태와 데이터 사용 책임에 대한 근거 있는 결정이다.
- **서비스 설명**: 외부 서비스에서 확인한 데이터 구조와 capability이며 이 Feature가 소유하거나 변경하지 않는다.
- **생성 요약**: 화면 흐름, 책임, navigation, validation, 데이터 연결, 포함·제외 범위와 선행 조건에 대한 사전 검토 결과다.
- **FreeStyle 프로젝트**: UI annotation에 의존하지 않고 승인된 화면과 상태 및 interaction을 직접 구성한 SAPUI5 생성 결과다.
- **검증 결과**: 화면 흐름, 상태, interaction, 데이터 연결과 요구사항별 반영 여부에 대한 확인 결과다.

## 성공 기준 *(필수)*

### 대표 검증 사례

| ID | 비기술적 요청 또는 상황 | 기대 결과 |
|---|---|---|
| `FREE-WIZARD-01` | 단계별 입력에 따라 다음 질문과 화면이 달라지고 이전 단계 복귀 시 값 유지 | 단계별 화면, 조건부 이동과 상태 보존 구성 |
| `FREE-STATE-01` | 여러 화면에서 임시 선택을 쌓은 뒤 마지막에 한 번 확인·처리 | 화면별 표시·동작·상태 책임과 최종 처리 흐름 구성 |
| `FREE-ERROR-01` | 입력 오류, 통신 실패와 업무 처리 실패마다 다른 안내와 복구 필요 | 오류 유형별 사용자 흐름과 재시도 조건 구성 |
| `FREE-ANNOTATION-01` | 서비스에 UI annotation이 있지만 화면은 직접 정의한 동적 흐름 사용 | UI annotation을 layout·interaction 결정에 사용하지 않음 |
| `FREE-RECLASS-01` | 검색·필터 목록과 한 건 상세 수정만 필요 | Standard 재판정 제시 |
| `FREE-BACKEND-01` | 최종 일괄 처리 transaction이 필요하지만 service capability를 확인할 수 없음 | FreeStyle 후보 유지, 생성 차단과 backend 선행 조건 표시 |
| `FREE-APPROVAL-01` | 생성 요약이 완전하지만 사용자가 승인하지 않음 | 프로젝트 파일 생성 없음 |

### 측정 가능한 결과

- **SC-001**: `FREE-WIZARD-01`과 `FREE-STATE-01`에서 승인된 화면, 이동 조건과 상태 요구사항의 100%가 생성 요약과 결과에 추적된다.
- **SC-002**: `FREE-ERROR-01`에서 정의된 입력 오류, 데이터 접근 실패와 업무 처리 실패가 서로 구분되고 각각의 복구 결과를 검증할 수 있다.
- **SC-003**: `FREE-ANNOTATION-01`과 모든 FreeStyle 기준 사례에서 UI annotation이 화면 layout이나 interaction 결정에 사용되는 사례는 0건이다.
- **SC-004**: 모든 FreeStyle 생성 기준 사례에서 Standard 또는 Custom 프로젝트가 암묵적 선행 산출물로 생성되는 사례는 0건이다.
- **SC-005**: `FREE-RECLASS-01`에서 Standard 재판정이 제시되고 불필요한 FreeStyle 생성이 차단된다.
- **SC-006**: 제출된 원문 요구사항과 사용자 답변의 100%가 화면, 동작, 상태, 재판정, 선행 조건 또는 범위 밖 중 하나로 추적된다.
- **SC-007**: `FREE-APPROVAL-01`과 모든 미승인 사례의 100%에서 새 프로젝트 파일이 생성되지 않는다.
- **SC-008**: 필수 화면, navigation, 상태, validation, interaction과 실행 검증을 모두 통과한 결과만 완료로 표시된다.

## 가정 및 의존성

- 이 Feature는 `001-classify-fiori-app-request`에서 승인된 `FREESTYLE` 판정 결과를 사용한다.
- 사용자는 MVC, View, Controller, Model, control, binding 또는 annotation을 알지 못할 수 있다.
- FreeStyle은 전형적인 MVC 책임을 따르지만 사용자는 기술 구조가 아니라 업무 화면과 동작을 설명한다.
- data source는 승인된 요청에서 확인하며 metadata는 데이터 구조와 capability 확인에만 사용할 수 있다.
- 화면별 interaction과 backend 계약은 생성 전에 확인 가능한 형태로 제공된다.
- 배포 대상과 운영 환경 결정은 별도 Feature에서 다룬다.

## 범위 제외

- Standard List Report와 annotation 중심 애플리케이션 생성
- Fiori elements Building Blocks와 annotation 중심 Custom View 생성
- backend 서비스와 업무 규칙 생성 또는 변경
- 요청되지 않은 custom control 또는 비공개 API 사용
- 기존 프로젝트 수정 또는 migration
- 실제 SAP BTP 배포와 Work Zone 콘텐츠 변경
