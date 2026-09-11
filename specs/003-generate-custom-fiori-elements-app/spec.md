# 기능 명세: Custom Fiori Elements 애플리케이션 생성

**Feature Branch**: `003-generate-custom-fiori-elements-app`

**Created**: 2026-09-08

**Last Updated**: 2026-09-10

**Status**: Draft

**Input**: User description: "Custom이 적합하다고 승인된 업무 요청을 대화로 구체화하여 별도의 View를 시작 target으로 만들고, 적용 가능한 Fiori elements Building Blocks와 annotation을 사용한 애플리케이션을 생성하고 검증한다."

## 사용자 시나리오 및 테스트 *(필수)*

### 사용자 스토리 1 - 표준 화면 요소를 조합한 Custom 화면 생성 (Priority: P1)

SAP 애플리케이션 개발자 또는 업무 전문가는 원하는 화면 영역과 배치를 일상적인 표현으로 설명하고, 별도 View 안에 재사용 가능한 표준 화면 요소를 조합한 검증된 애플리케이션을 받는다.

**우선순위 이유**: Standard 화면 순서와 다른 고유한 배치가 필요한 사용자에게 최소한의 직접 구현으로 독립적인 업무 가치를 제공한다.

**독립 테스트**: `CUS-COMPOSE-01`을 제공하고 생성 요약을 승인하여 독립 View target 안에 검색 조건, 목록과 상세 영역이 배치되고 Standard List Report를 선행 생성하지 않는 프로젝트 및 검증 결과를 받는지 확인한다.

**인수 시나리오**:

1. **Given** `CUSTOM`으로 승인된 요청에 화면 영역, 배치 또는 표시 정보가 충분히 설명되지 않았을 때, **When** Custom 생성을 준비하면, **Then** 시스템은 사용자가 원하는 업무 화면을 설명할 수 있는 비기술적 질문만 제시한다.
2. **Given** 사용자가 하나의 고유한 업무 화면 안에 검색 조건, 결과 목록과 상세 정보를 원하는 위치에 조합한다고 답했을 때, **When** 화면 구성을 결정하면, **Then** 별도 View를 시작 target으로 추천하고 표준 목록·상세 흐름과 다른 이유를 설명한다.
3. **Given** 사용자의 화면 요소가 metadata 기반 표준 field, filter, table 또는 page 동작으로 충족될 수 있을 때, **When** Custom 구성을 결정하면, **Then** 해당 요소를 재사용하는 구성을 추천하고 사용자가 이해할 수 있는 화면 역할로 설명한다.
4. **Given** 화면 조합 입력이 완전하고 001 handoff가 확인되었을 때, **When** 프로젝트를 생성·검증하면, **Then** 별도 확장 영역과 허용된 표준 화면 요소 조합이 생성되고 요구사항별 결과가 제공된다.

---

### 사용자 스토리 2 - 제한적인 고유 동작을 포함한 Custom 화면 생성 (Priority: P2)

사용자는 표준 화면 요소로 충족되지 않는 제한적인 고유 동작을 설명하고, 표준 재사용 영역과 직접 구성 영역의 책임이 분리된 Custom 앱을 받는다.

**우선순위 이유**: 표준 요소의 장점을 유지하면서 특정 업무 차별점만 직접 구성하면 Custom 유형의 실질적인 확장 가치를 제공할 수 있다.

**독립 테스트**: `CUS-DIRECT-01`을 사용하여 고유 interaction 영역의 필요성과 책임 경계가 설명되고, 승인 후 해당 영역을 포함한 앱과 영향 검증 결과가 제공되는지 확인한다.

**인수 시나리오**:

1. **Given** 일부 요구가 표준 화면 요소로 충족되지 않을 때, **When** 화면 책임을 결정하면, **Then** 표준 재사용 영역과 직접 구성할 영역을 구분하고 직접 구성의 이유와 영향을 설명한다.
2. **Given** 직접 구성 영역을 포함한 생성 요약이 완전할 때, **When** 사용자가 요약을 검토하면, **Then** 해당 영역의 요구사항, 동작 책임, 데이터 연결과 표준 요소에 미치는 영향을 확인할 수 있다.
3. **Given** 직접 구성 영역을 포함한 001 handoff가 확인되었을 때, **When** 프로젝트를 생성하고 검증하면, **Then** 허용된 고유 동작만 생성되고 표준 영역과의 책임 경계가 요구사항에 추적된다.

---

### 사용자 스토리 3 - Custom 범위와 생성 안전성 확인 (Priority: P3)

사용자는 Custom보다 Standard 또는 FreeStyle이 적합한 요청과 준비되지 않은 backend 조건을 생성 전에 확인하고 올바른 재판정 또는 선행 작업 안내를 받는다.

**우선순위 이유**: 모든 요청을 Custom으로 강제하지 않고 유형 경계와 외부 의존성을 지키면 불필요한 구현과 잘못된 생성을 예방할 수 있다.

**독립 테스트**: `CUS-RECLASS-STD-01`, `CUS-RECLASS-FREE-01`, `CUS-BACKEND-01`, `CUS-APPROVAL-01`을 각각 제출하여 재판정·선행 조건·승인 대기가 구분되고 프로젝트 파일이 생성되지 않는지 확인한다.

**인수 시나리오**:

1. **Given** 요구사항이 일반적인 목록·상세 흐름만으로 충분히 충족될 수 있을 때, **When** Custom 필요성을 재검토하면, **Then** 불필요한 Custom 구성을 생성하지 않고 `STANDARD` 재판정 선택지와 이유를 제시한다.
2. **Given** 요구사항이 복잡한 화면 상태, 자유로운 control 조합 또는 interaction의 직접 제어를 필요로 하고 metadata 기반 표준 요소 재사용이 실질적인 가치를 제공하지 못할 때, **When** Custom 범위를 판정하면, **Then** 임의 custom code를 확대하지 않고 `FREESTYLE` 재판정을 요청한다.
3. **Given** 필요한 property, association, action, annotation 또는 data context를 서비스 정보에서 확인할 수 없을 때, **When** 생성을 준비하면, **Then** 존재를 추측하거나 임의 binding으로 대체하지 않고 누락된 항목을 선행 조건으로 표시한다.
4. **Given** 001 handoff 또는 application 생성 요청이 없을 때, **When** 시스템이 프로젝트 생성 가능 여부를 결정하면, **Then** 어떤 프로젝트 파일도 생성하지 않는다.

### Edge Cases

- 사용자가 “대시보드”, “한 화면”, “특별한 화면”이라고만 표현하면 화면 영역과 interaction을 확인하고 단어 하나만으로 Custom을 확정하지 않는다.
- 표준 화면 요소로 충분한 요청을 화면 배치가 다르다는 이유만으로 모두 직접 구현하지 않는다.
- 하나의 View 요구사항에 서로 양립할 수 없는 layout이나 navigation이 있으면 생성 전에 결정을 요청한다.
- View 이름이나 target 식별자가 충돌하면 기존 파일을 덮어쓰지 않고 수정을 요청한다.
- 필요한 data context 또는 annotation이 없으면 임의 binding을 생성하지 않는다.
- Custom 구성으로 backend 권한, transaction, 계산 또는 데이터 무결성을 대신하지 않는다.
- View는 생성되었지만 target, 데이터 context 또는 필수 화면 요소 검증이 실패하면 완료로 표시하지 않는다.

## 요구사항 *(필수)*

### 기능 요구사항

- **FR-001**: 시스템은 `001-classify-fiori-app-request`에서 승인된 `CUSTOM` 유형, 원문 업무 요청, 사용자 답변과 판정 근거를 입력으로 받아야 한다.
- **FR-002**: 시스템은 application 식별 정보, 결과 이름, 서비스 정보, 화면 영역, interaction과 navigation 요구사항을 확인해야 한다.
- **FR-003**: 시스템은 사용자가 View, Building Blocks 또는 annotation을 몰라도 화면에서 보고 수행할 업무와 원하는 배치를 설명할 수 있도록 질문해야 한다.
- **FR-004**: 시스템은 사용자에게 묻기 전에 서비스 정보에서 property, association, action, annotation, capability와 사용 가능한 data context를 확인해야 한다.
- **FR-005**: 시스템은 요청 유형이 `CUSTOM`이 아니면 Custom 생성 진입점을 실행해서는 안 된다.
- **FR-006**: 시스템은 승인된 고유 업무 화면에 대응하는 별도의 View를 생성하고 해당 routing target이 View를 직접 가리키도록 구성해야 한다.
- **FR-007**: 시스템은 Standard List Report 프로젝트나 target을 Custom 생성의 선행 산출물로 요구해서는 안 된다.
- **FR-008**: 시스템은 각 화면 영역을 업무 목적, 표시 정보, 사용자 동작, 데이터 context와 연결하여 설명해야 한다.
- **FR-009**: 시스템은 metadata 기반 표준 field, filter, table 또는 page 동작으로 충족 가능한 화면 요소를 적용 가능한 Fiori elements Building Blocks와 annotation으로 우선 구성해야 한다.
- **FR-010**: 시스템은 사용자가 Building Block 또는 annotation 이름을 직접 지정하지 않아도 확인된 요구사항과 서비스 근거로 적합한 표준 요소를 추천해야 한다.
- **FR-011**: 시스템은 표준 요소로 충족되지 않는 직접 구성 영역을 식별하고 표준 요소와의 책임 경계를 생성 요약에 포함해야 한다.
- **FR-012**: 시스템은 확인되지 않은 property, association, action, context, annotation 또는 capability를 존재하는 것으로 추측해서는 안 된다.
- **FR-013**: 시스템은 Custom 구성으로 backend 업무 규칙, authorization, transaction 또는 데이터 무결성을 대신해서는 안 된다.
- **FR-014**: 시스템은 Standard로 충분한 요청에 Custom을 강제하지 않고 재판정 선택지를 제공해야 한다.
- **FR-015**: 시스템은 Custom의 제한을 넘어 복잡한 client 상태와 직접 제어가 필요한 요구사항을 `FREESTYLE` 재판정 대상으로 표시해야 한다.
- **FR-016**: 시스템은 파일 생성 전에 앱 정보, View target, 화면 영역, Building Blocks와 annotation의 역할, 직접 구성 요소, navigation, 포함·제외 범위와 선행 조건을 사용자 표현과 기술적 handoff 정보로 함께 요약해야 한다.
- **FR-017**: 시스템은 001 handoff와 사용자의 application 생성 요청이 확인된 후에만 프로젝트를 생성해야 한다.
- **FR-018**: 시스템은 기존 파일이나 같은 이름의 기존 결과를 덮어쓰거나 삭제해서는 안 된다.
- **FR-019**: 시스템은 생성된 View와 target 연결, 필수 화면 요소, 데이터 context, navigation 및 실행 준비 상태를 검증해야 한다.
- **FR-020**: 시스템은 요구사항별 반영 여부, 생성 파일, 주요 설정, 판정 근거, 검증 결과와 후속 작업을 제공해야 한다.
- **FR-021**: 시스템은 필수 검증 실패 시 결과를 완료로 표시해서는 안 된다.
- **FR-022**: 시스템은 실제 SAP 환경에 로그인하거나 배포 또는 콘텐츠 변경을 수행해서는 안 된다.
- **FR-023**: 시스템은 Custom Fiori Elements 결과에 manifest inbound, `webapp/test/flpSandbox.html`과 동일 intent를 사용하는 `fiori run` 기반 `start` script를 생성해야 한다.
- **FR-024**: 시스템은 Custom 결과의 FLP Sandbox 파일·manifest inbound·실행 script 일치 여부를 정적으로 검증해야 한다.

### 주요 정보 객체 *(Key Entities)*

> 이 절의 객체는 DB table이나 OData EntityType을 뜻하지 않는다. 기능이 생성, 참조 또는 전달하는 주요 정보를 정의하며 저장 방식은 Plan에서 결정한다.

- **Custom 생성 요청**: 승인된 유형, 원문 업무 요청, 사용자 답변, 앱 정보, 서비스와 navigation 요구사항이다.
- **업무 화면 설명**: 사용자가 원하는 화면 영역, 표시 정보, 배치와 interaction을 기술 용어 없이 표현한 내용이다.
- **Custom 화면 결정**: View target, 영역별 표준 요소 재사용, 직접 구성 요소와 책임 경계에 대한 근거 있는 결정이다.
- **서비스 설명**: 외부 OData 서비스에서 확인한 업무 객체, annotation, capability와 data context이며 이 Feature가 소유하거나 변경하지 않는다.
- **생성 요약**: View, 화면 영역, 표준·직접 구성 요소, 데이터 연결, 포함·제외 범위와 선행 조건에 대한 사전 검토 결과다.
- **Custom 프로젝트**: 별도 View target 안에서 적용 가능한 Building Blocks와 annotation을 우선 활용한 생성 결과다.
- **검증 결과**: View, target, 화면 요소, 데이터 연결과 요구사항별 반영 여부에 대한 확인 결과다.

## 성공 기준 *(필수)*

### 대표 검증 사례

| ID | 비기술적 요청 또는 상황 | 기대 결과 |
|---|---|---|
| `CUS-COMPOSE-01` | 한 화면 안에 검색 조건, 업무 객체 목록과 선택 항목 상세를 원하는 위치에 함께 배치 | 독립 View target과 적용 가능한 표준 화면 요소 조합 |
| `CUS-SUMMARY-01` | 상단 업무 요약 영역과 하단 목록을 고유하게 배치하되 표준 field와 table 동작 재사용 | Custom 유지, 표준 요소 우선 활용 |
| `CUS-DIRECT-01` | 표준 요소 사이에 제한적인 고유 interaction 영역 필요 | 표준·직접 구성 책임 경계와 영향 보고 |
| `CUS-RECLASS-STD-01` | 검색·필터 목록과 한 건 상세 수정 외 고유 배치나 동작 없음 | Standard 재판정 제시 |
| `CUS-RECLASS-FREE-01` | 복잡한 client 상태와 자유로운 control interaction이 화면 핵심 | FreeStyle 재판정 제시 |
| `CUS-BACKEND-01` | 화면에 승인 동작이 필요하지만 action을 확인할 수 없음 | Custom 후보 유지, 생성 차단과 backend 선행 조건 표시 |
| `CUS-APPROVAL-01` | 생성 요약이 완전하지만 사용자가 승인하지 않음 | 프로젝트 파일 생성 없음 |

### 측정 가능한 결과

- **SC-001**: `CUS-COMPOSE-01`과 `CUS-SUMMARY-01`에서 승인된 업무 화면 영역의 100%가 View 안의 표준 재사용 요소 또는 직접 구성 영역으로 추적된다.
- **SC-002**: 성공으로 보고된 Custom 결과의 100%에서 생성된 View가 승인된 routing target과 데이터 context에 연결된다.
- **SC-003**: 모든 Custom 생성 기준 사례에서 Standard List Report가 암묵적 선행 프로젝트나 시작 target으로 생성되는 사례는 0건이다.
- **SC-004**: `CUS-RECLASS-STD-01`과 `CUS-RECLASS-FREE-01`에서 각각 적합한 재판정 선택지가 제시되고 잘못된 Custom 생성이 차단된다.
- **SC-005**: 제출된 원문 요구사항과 사용자 답변의 100%가 표준 요소, 직접 구성, 재판정, 선행 조건 또는 범위 밖 중 하나로 추적된다.
- **SC-006**: `CUS-APPROVAL-01`과 모든 미승인 사례의 100%에서 새 프로젝트 파일이 생성되지 않는다.
- **SC-007**: 필수 View, target, 화면 요소, 데이터 연결과 실행 검증을 모두 통과한 결과만 완료로 표시된다.
- **SC-008**: 생성되는 Custom 프로젝트의 100%에서 FLP Sandbox와 inbound intent가 일치하고, `npm run lint`가 누락 또는 불일치를 검출한다.

## 가정 및 의존성

- 이 Feature는 `001-classify-fiori-app-request`에서 승인된 `CUSTOM` 판정 결과를 사용한다.
- 사용자는 View, Building Blocks, annotation, data context 또는 routing target을 알지 못할 수 있다.
- Custom은 별도 View target을 사용하며 적용 가능한 Fiori elements Building Blocks와 annotation을 활용하는 유형이다.
- Building Blocks에 필요한 metadata와 annotation을 확인할 수 있는 OData V4 서비스가 제공된다.
- 직접 구성 요소와 controller logic은 승인된 업무 요구사항에 한정하며 구체적인 지원 범위는 Plan에서 검토한다.
- 배포 대상과 운영 환경 결정은 별도 Feature에서 다룬다.

## 범위 제외

- Standard List Report target 중심 애플리케이션 생성
- annotation을 화면 구성에 사용하지 않는 FreeStyle MVC 애플리케이션 생성
- backend 서비스, annotation 및 업무 규칙 변경
- 확인되지 않은 extension point 또는 비공개 API 사용
- 기존 프로젝트 수정 또는 migration
- 실제 SAP BTP 배포와 Work Zone 콘텐츠 변경
