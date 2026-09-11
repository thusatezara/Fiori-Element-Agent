# 기능 명세: Standard Fiori Elements 애플리케이션 생성

**Feature Branch**: `002-generate-standard-fiori-elements-app`

**Created**: 2026-09-08

**Last Updated**: 2026-09-10

**Status**: Draft

**Input**: User description: "Standard가 적합하다고 승인된 업무 요청을 대화로 구체화하여 List Report를 시작 target으로 사용하고 metadata와 annotation을 중심으로 화면을 구성하며, 필요한 경우에만 공식 Extension을 적용한 애플리케이션을 생성하고 검증한다."

## 사용자 시나리오 및 테스트 *(필수)*

### 사용자 스토리 1 - 조회 중심 Standard 앱 생성 (Priority: P1)

SAP 애플리케이션 개발자 또는 업무 전문가는 목록 사용 방식, 데이터 규모와 주 사용 기기를 일상적인 표현으로 설명하고, 적합한 List Report 구성을 승인하여 조회 가능한 Standard 애플리케이션을 받는다.

**우선순위 이유**: 검색·필터·목록·상세 조회가 가능한 기본 앱만으로도 사용자는 실제 데이터를 탐색하는 독립적인 업무 가치를 얻는다.

**독립 테스트**: `STD-GRID-01`의 읽기 전용 요청을 001 handoff로 제공하여 Grid Table 기반 List Report와 상세 조회가 생성·검증되는지 확인한다.

**인수 시나리오**:

1. **Given** `STANDARD`로 승인된 업무 요청에 목록의 사용 방식, 예상 데이터 규모 또는 주 사용 기기가 빠져 있을 때, **When** 조회 앱 생성을 준비하면, **Then** 시스템은 누락된 결정에 필요한 업무 질문만 기술 용어 없이 제시한다.
2. **Given** 사용자가 많은 행과 열을 PC에서 연속적으로 탐색하고 열 너비 조정과 가로 탐색이 중요하다고 답했을 때, **When** table 구성을 결정하면, **Then** Grid Table을 추천하고 데이터 규모만이 아닌 사용 환경과 작업 방식에 근거한 이유를 설명한다.
3. **Given** 사용자가 모바일 접근을 중시하고 검색·필터 후 제한된 결과를 확인한다고 답했을 때, **When** table 구성을 결정하면, **Then** Responsive Table을 추천하고 큰 전체 데이터가 있더라도 해당 선택의 근거를 설명한다.
4. **Given** 조회 앱 생성 입력이 완전할 때, **When** 사용자가 생성 요약을 검토하면, **Then** 앱 정보, List Report 시작 화면, table, 상세 조회, annotation 반영, 선행 조건과 제외 항목을 확인할 수 있다.
5. **Given** 001에서 Standard handoff와 application 생성 요청이 확인되었을 때, **When** Standard 프로젝트를 생성하고 검증하면, **Then** List Report target을 시작점으로 사용하는 조회 앱과 요구사항 추적 결과가 제공되며 필수 검증 실패는 완료로 표시되지 않는다.
6. **Given** 생성된 Standard Fiori Elements 앱을 로컬에서 실행할 때, **When** `npm start`를 실행하면, **Then** `fiori run`이 `webapp/test/flpSandbox.html`을 열고 생성된 FLP inbound intent로 앱을 시작한다.

---

### 사용자 스토리 2 - 업무에 맞는 Standard 수정 흐름 생성 (Priority: P2)

사용자는 상세 화면 수정 또는 목록 내 수정을 업무 표현으로 요청하고, 지원 조건에 맞는 Standard 수정 흐름이나 꼭 필요한 제한적 Extension이 반영된 앱을 받는다.

**우선순위 이유**: 조회 앱 다음으로 자주 필요한 수정 업무를 별도의 독립 가치로 제공하면서 불필요한 custom code를 피할 수 있다.

**독립 테스트**: `STD-OBJECT-EDIT-01`, `STD-INLINE-01`, `STD-EXT-01`을 각각 사용하여 Standard 수정 지원 여부와 제한적 Extension 필요성이 구분되고, 001 handoff에 포함된 수정 흐름이 생성·검증되는지 확인한다.

**인수 시나리오**:

1. **Given** 사용자가 한 건을 선택하여 상세 화면에서 일반적인 방식으로 수정한다고 답했고 서비스가 필요한 수정 capability를 제공할 때, **When** 수정 방식을 결정하면, **Then** Object Page의 Standard 수정 흐름을 추천하며 Extension을 요구하지 않는다.
2. **Given** 사용자가 목록에서 일부 field를 직접 수정하기 원할 때, **When** 대상 환경과 서비스가 Standard inline edit 요구사항을 충족하는지 확인하면, **Then** 지원 여부와 제한을 근거로 Standard inline edit 사용 가능성을 결정한다.
3. **Given** 사용자가 표준 설정과 annotation으로 충족할 수 없는 추가 동작을 요구할 때, **When** 생성 범위를 판정하면, **Then** 공식 Extension으로 제한적으로 충족 가능한지 먼저 확인하고 그 필요성과 유지보수 영향을 설명한다.
4. **Given** 001 handoff에 수정 흐름이 포함되었을 때, **When** 프로젝트를 생성하고 검증하면, **Then** 허용된 Standard 수정 방식과 필요한 Extension만 반영되고 요구사항별 결과가 보고된다.

---

### 사용자 스토리 3 - Standard 범위와 생성 안전성 확인 (Priority: P3)

사용자는 Standard로 구현할 수 없는 요구사항이나 준비되지 않은 backend 조건을 생성 전에 확인하고, 잘못된 프로젝트 생성 대신 재판정 또는 선행 작업 안내를 받는다.

**우선순위 이유**: 범위를 벗어난 Extension 남용과 확인되지 않은 service capability 가정을 방지하여 생성 결과의 신뢰성을 높인다.

**독립 테스트**: `STD-RECLASS-01`, `STD-BACKEND-01`, `STD-APPROVAL-01`을 각각 제출하여 재판정·선행 조건·승인 대기가 구분되고 프로젝트 파일이 생성되지 않는지 확인한다.

**인수 시나리오**:

1. **Given** 요구사항이 광범위한 독립 View 또는 복잡한 client 상태 제어를 필요로 할 때, **When** Standard 범위를 판정하면, **Then** 임의 Extension을 생성하지 않고 `CUSTOM` 또는 `FREESTYLE` 재판정을 요청한다.
2. **Given** 필요한 EntitySet, property, association, action, update 또는 edit capability를 서비스 정보에서 확인할 수 없을 때, **When** 생성을 준비하면, **Then** 존재를 추측하지 않고 누락된 항목을 선행 조건으로 표시한다.
3. **Given** 001 handoff 또는 application 생성 요청이 없을 때, **When** 시스템이 프로젝트 생성 가능 여부를 결정하면, **Then** 어떤 프로젝트 파일도 생성하지 않는다.

### Edge Cases

- 전체 데이터 행 수와 사용자가 한 번에 탐색할 결과 행 수를 구분하며 행 수 하나만으로 table 유형을 결정하지 않는다.
- 모바일과 PC 요구가 동시에 중요하면 어느 한 환경을 임의로 무시하지 않고 우선 사용 환경과 허용 가능한 차이를 확인한다.
- 사용자가 “수정”이라고만 말하면 목록 inline edit, 상세 화면 edit 또는 별도 업무 action 중 무엇인지 확인한다.
- 같은 결과 이름이 존재하면 기존 파일을 덮어쓰지 않고 새 이름을 요청한다.
- local annotation이나 Extension으로 backend 권한, transaction, 계산 또는 데이터 무결성을 대신하지 않는다.
- Standard 기능과 공식 설정으로 충족할 수 있는 요구에 불필요한 custom 코드를 추가하지 않는다.
- build는 성공하지만 target, table, 수정 흐름 또는 필수 navigation 검증이 실패하면 완료로 표시하지 않는다.

## 요구사항 *(필수)*

### 기능 요구사항

- **FR-001**: 시스템은 `001-classify-fiori-app-request`에서 승인된 `STANDARD` 유형, 원문 업무 요청, 사용자 답변과 판정 근거를 입력으로 받아야 한다.
- **FR-002**: 시스템은 application title, application ID, namespace, 결과 이름, 서비스 정보와 주요 업무 객체를 확인해야 한다.
- **FR-003**: 시스템은 사용자가 Fiori 기술 용어를 몰라도 목록 탐색, 검색·필터, 표시 정보, 사용 기기와 수정 방식을 설명할 수 있도록 업무 표현의 질문을 제공해야 한다.
- **FR-004**: 시스템은 사용자에게 묻기 전에 서비스 정보에서 EntitySet, property, association, action, annotation과 capability를 확인해야 한다.
- **FR-005**: 시스템은 요청 유형이 `STANDARD`가 아니면 Standard 생성 진입점을 실행해서는 안 된다.
- **FR-006**: 시스템은 List Report를 애플리케이션의 시작 target으로 구성하고 승인된 주요 업무 객체를 연결해야 한다.
- **FR-007**: 시스템은 table 유형을 결정할 때 전체·예상 결과 행 수, 열 수와 복잡도, 주 사용 기기, 연속 탐색, 수평 탐색 및 편집 방식을 함께 고려해야 한다.
- **FR-008**: 시스템은 하나의 답변만으로 table 유형을 확정하지 않고 선택 근거와 trade-off를 사용자에게 설명해야 한다.
- **FR-009**: 시스템은 목록에서 상세 화면으로 이동해 수정하는 일반 흐름을 Standard 기능으로 충족할 수 있으면 Extension 없이 우선 구성해야 한다.
- **FR-010**: 시스템은 목록 직접 수정 요구를 대상 환경과 서비스 capability에 대조하여 Standard inline edit 지원 가능성, 제한 또는 대안을 설명해야 한다.
- **FR-011**: 시스템은 검색, filter, table column, header, section과 field를 확인된 metadata와 annotation으로 표현해야 한다.
- **FR-012**: 시스템은 backend annotation을 변경하지 않고 화면 표현을 보완할 수 있을 때 local annotation으로 반영할 수 있어야 한다.
- **FR-013**: 시스템은 metadata 또는 annotation에서 확인되지 않은 요소를 존재하는 것으로 추측해서는 안 된다.
- **FR-014**: 시스템은 Standard 설정과 annotation으로 충족할 수 없는 요구사항에 한해서만 공식 Extension의 필요성을 판정해야 한다.
- **FR-015**: 시스템은 Extension을 제안할 때 대상 요구사항, 표준 대안 검토, 선택 이유, 유지보수 영향과 검증 방법을 생성 요약에 포함해야 한다.
- **FR-016**: 시스템은 Standard의 제한적 Extension 범위를 넘어서는 요구사항을 `CUSTOM` 또는 `FREESTYLE` 재판정 대상으로 표시해야 한다.
- **FR-017**: 시스템은 화면 설정, annotation 또는 Extension으로 backend 업무 규칙, authorization, transaction 또는 데이터 무결성을 대신해서는 안 된다.
- **FR-018**: 시스템은 파일 생성 전에 앱 정보, target, 업무 객체, table 유형, 상세·수정 흐름, annotation, Extension, navigation, 포함·제외 범위와 선행 조건을 요약해야 한다.
- **FR-019**: 시스템은 001 handoff와 사용자의 application 생성 요청이 확인된 후에만 프로젝트를 생성해야 한다.
- **FR-020**: 시스템은 기존 파일이나 같은 이름의 기존 결과를 덮어쓰거나 삭제해서는 안 된다.
- **FR-021**: 시스템은 생성된 애플리케이션의 구조, target, 화면 흐름과 실행 준비 상태를 검증해야 한다.
- **FR-022**: 시스템은 요구사항별 반영 여부, 생성 파일, 주요 설정, 판정 근거, 검증 결과와 후속 작업을 제공해야 한다.
- **FR-023**: 시스템은 필수 검증 실패 시 결과를 완료로 표시해서는 안 된다.
- **FR-024**: 시스템은 실제 SAP 환경에 로그인하거나 배포 또는 콘텐츠 변경을 수행해서는 안 된다.
- **FR-025**: 시스템은 Standard Fiori Elements 결과에 `webapp/test/flpSandbox.html`과 `fiori run` 기반 `start` script를 생성해야 한다.
- **FR-026**: 시스템은 앱 manifest의 FLP inbound와 Sandbox application entry를 동일한 `<semantic-object>-<action>` intent로 연결해야 하며, intent가 지정되지 않으면 EntitySet에서 일반적인 기본값을 만들어야 한다.
- **FR-027**: 시스템은 `--flp-intent`로 지정한 intent를 검증하고, 생성된 Sandbox 파일·manifest inbound·실행 script의 일치 여부를 정적으로 검증해야 한다.

### 주요 정보 객체 *(Key Entities)*

> 이 절의 객체는 DB table이나 OData EntityType을 뜻하지 않는다. 기능이 생성, 참조 또는 전달하는 주요 정보를 정의하며 저장 방식은 Plan에서 결정한다.

- **Standard 생성 요청**: 승인된 유형, 원문 업무 요청, 사용자 답변, 앱 정보, 서비스와 navigation 요구사항이다.
- **Standard 화면 결정**: List Report, table 유형, 상세 화면, 수정 방식과 Extension 필요 여부에 대한 근거 있는 결정이다.
- **서비스 설명**: 외부 OData 서비스에서 확인한 업무 객체, annotation과 capability이며 이 Feature가 소유하거나 변경하지 않는다.
- **생성 요약**: target, table, 수정 흐름, annotation, Extension, 포함·제외 범위와 선행 조건에 대한 사전 검토 결과다.
- **Standard 프로젝트**: List Report target과 metadata·annotation 중심으로 구성되고 승인된 경우에만 제한적 Extension을 포함하는 생성 결과다.
- **FLP preview configuration**: `webapp/test/flpSandbox.html`, manifest inbound와 `fiori run` 실행 script가 동일한 intent로 연결된 로컬 미리보기 구성이다.
- **검증 결과**: 요구사항별 반영 여부, 판정 근거와 프로젝트 실행 준비 상태에 대한 확인 결과다.

## 성공 기준 *(필수)*

### 대표 검증 사례

| ID | 비기술적 요청 또는 상황 | 기대 결과 |
|---|---|---|
| `STD-GRID-01` | 1,000건이 넘는 업무 객체를 PC에서 많은 열과 함께 탐색하고 한 건의 상세 내용을 조회 | Grid Table 기반 List Report와 상세 조회 |
| `STD-RESP-01` | 전체 데이터는 많지만 모바일에서 검색·필터 후 소수 결과와 상세 내용을 조회 | Responsive Table 기반 List Report와 상세 조회 |
| `STD-OBJECT-EDIT-01` | 한 건을 선택해 상세 화면에서 일반적인 방식으로 수정 | Object Page Standard edit, Extension 없음 |
| `STD-INLINE-01` | 목록의 일부 field를 직접 수정 | 대상 환경·서비스 capability 확인 후 Standard inline edit 가능 여부 결정 |
| `STD-EXT-01` | 표준 목록에 지원되지 않는 제한적 사용자 동작 하나가 추가로 필요 | 표준 대안 검토 후 공식 Extension 필요성과 영향 보고 |
| `STD-RECLASS-01` | 독립 업무 화면과 복잡한 client 상태 제어가 필요 | Standard 생성 차단 및 Custom/FreeStyle 재판정 |
| `STD-BACKEND-01` | 상세 수정이 필요하지만 update capability를 확인할 수 없음 | Standard 후보 유지, 생성 차단과 backend 선행 조건 표시 |
| `STD-APPROVAL-01` | 생성 요약이 완전하지만 사용자가 승인하지 않음 | 프로젝트 파일 생성 없음 |

### 측정 가능한 결과

- **SC-001**: `STD-GRID-01`과 `STD-RESP-01`에서 업무 환경과 사용 방식에 맞는 table 유형이 각각 추천되고 단일 행 수만으로 결정되지 않는다.
- **SC-002**: `STD-OBJECT-EDIT-01`, `STD-INLINE-01`의 수정 사례 100%에서 Standard 기능 지원 여부를 먼저 확인하고 수정 요구만으로 Extension을 추가하지 않는다.
- **SC-003**: `STD-EXT-01`의 Extension 제안에 대상 요구사항, 표준 대안, 선택 이유, 유지보수 영향과 검증 방법이 모두 포함된다.
- **SC-004**: `STD-RECLASS-01`과 모든 비Standard 판정 사례의 100%에서 Standard 프로젝트 생성이 차단된다.
- **SC-005**: 제출된 원문 요구사항과 사용자 답변의 100%가 반영, 재판정, 선행 조건 또는 범위 밖 중 하나로 추적된다.
- **SC-006**: `STD-APPROVAL-01`과 모든 미승인 사례의 100%에서 새 프로젝트 파일이 생성되지 않는다.
- **SC-007**: 필수 target, table, 화면 흐름과 실행 검증을 모두 통과한 결과만 완료로 표시된다.
- **SC-008**: 생성되는 Standard 프로젝트의 100%에서 FLP Sandbox 파일, manifest inbound와 `npm start` intent가 일치하고, `npm run lint`가 누락 또는 불일치를 검출한다.

## 가정 및 의존성

- 이 Feature는 `001-classify-fiori-app-request`에서 승인된 `STANDARD` 판정 결과를 사용한다.
- 사용자는 Grid Table, Responsive Table, Object Page, inline edit, annotation 또는 Extension을 알지 못할 수 있다.
- 서비스 metadata와 annotation을 확인할 수 있는 OData V4 서비스가 제공된다.
- 지원되는 table과 edit 기능은 승인된 대상 환경에서 확인하며 특정 SAPUI5 version을 Spec에서 고정하지 않는다.
- Standard의 Extension은 공식 extension point로 제한하며 표준 기능을 우선한다.
- 배포 대상과 운영 환경 결정은 별도 Feature에서 다룬다.
- 로컬 FLP Sandbox는 개발·검증용이며 SAP Build Work Zone의 운영 콘텐츠를 대신하지 않는다.

## 범위 제외

- 독립 Custom View target 중심 애플리케이션 생성
- annotation을 화면 구성에 사용하지 않는 FreeStyle MVC 애플리케이션 생성
- backend 서비스, annotation 및 업무 규칙 변경
- 확인되지 않은 extension point 또는 비공개 API 사용
- 기존 프로젝트 수정 또는 migration
- 실제 SAP BTP 배포와 Work Zone 콘텐츠 변경
