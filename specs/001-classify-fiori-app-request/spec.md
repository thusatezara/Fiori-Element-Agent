# 기능 명세: Fiori 애플리케이션 요청 분석·판정·생성

**Feature Branch**: 001-fiori-request-orchestration-and-generation

**Created**: 2026-09-08

**Last Updated**: 2026-09-09

**Status**: Draft

**Input**: 사용자가 OData service와 자연어 화면 요청을 제공하면, service 계약을 확인하고 요구사항을 구체화한 뒤 적합한 Fiori 애플리케이션 유형을 판정하여 해당 생성 기능으로 전달하고 검증한다.

## 책임 범위

이 Feature는 OData 기반 Fiori 애플리케이션 생성의 유일한 진입 프로토콜이다. 입력 정규화, service inspection, 업무 질문, Standard·Custom·FreeStyle 판정, 단일 handoff와 결과 취합을 담당한다. 이 프로토콜은 사용자 요청마다 새 Feature Spec을 만드는 대신 runtime input을 하위 생성 프로토콜에 전달한다.

유형별 생성 정책과 template은 다음 하위 Feature가 소유한다.

| 유형 | 하위 Feature | 책임 |
|---|---|---|
| STANDARD | 002 | List Report, Object Page, metadata·annotation 중심의 표준 앱 |
| CUSTOM | 003 | 표준 요소를 재사용하는 Custom View와 공식 확장 |
| FREESTYLE | 004 | 직접 제어하는 SAPUI5 MVC 화면과 복잡한 상태 흐름 |

이 Feature는 OData별 정적 Feature Spec이나 요청별 실행 Spec을 만들지 않는다. OData URL, EntitySet, field, 사용자 답변과 service snapshot은 runtime input과 generation report로 관리한다.

## 사용자 시나리오 및 테스트

### 사용자 스토리 1 - OData 요청과 service 계약 분석 (Priority: P1)

사용자는 OData URL과 만들고 싶은 화면을 자연어로 설명한다. 시스템은 화면 결정을 묻기 전에 service metadata에서 확인 가능한 사실을 수집하고, 요청 field와 실제 property를 대조한다.

**독립 테스트**: 정상적인 OData collection URL과 목록 조회 요청을 입력하면 service root, OData version, EntitySet, key, property, navigation property와 확인 가능한 capability가 ServiceSnapshot에 기록된다. 존재하지 않는 field나 읽을 수 없는 metadata는 생성 준비를 차단한다.

**인수 시나리오**:

1. **Given** OData collection URL이 주어졌을 때, **When** 요청을 분석하면, **Then** service root와 EntitySet을 구분하고 OData version과 metadata hash를 기록한다.
2. **Given** metadata에서 EntitySet, key와 property를 확인할 수 있을 때, **When** 화면 질문을 준비하면, **Then** 확인된 사실을 사용자에게 다시 묻지 않고 판정 근거로 사용한다.
3. **Given** 사용자가 metadata에 없는 field를 요청했을 때, **When** 대조하면, **Then** field를 임의로 추가하지 않고 수정 또는 선행 조건을 제시한다.
4. **Given** metadata가 없거나 인증이 필요한 URL일 때, **When** 분석하면, **Then** 추측 없이 NEEDS_INPUT 또는 BLOCKED 상태로 남기고 앱 파일을 만들지 않는다.

### 사용자 스토리 2 - 업무 요청 구체화와 앱 유형 판정 (Priority: P1)

사용자는 Fiori 기술 용어를 몰라도 목록, 상세, 검색, 필터, 수정, 사용 기기와 화면 흐름을 설명한다. 시스템은 필요한 질문만 제시하고 사용자 진술, 시스템 해석과 service 사실을 구분하여 STANDARD, CUSTOM 또는 FREESTYLE을 판정한다.

**독립 테스트**: 일반 조회·검색·필터·상세 흐름, 표준 요소를 재사용하는 고유 배치, 복잡한 상태·단계 흐름을 각각 입력하여 기대 유형과 선택 이유가 보존되는지 검증한다.

**인수 시나리오**:

1. **Given** 검색·필터·목록·상세 중심의 요청일 때, **When** 판정하면, **Then** STANDARD를 우선 추천하고 Custom과 FreeStyle을 선택하지 않은 이유를 설명한다.
2. **Given** 표준 목록·상세 흐름은 유지하지만 별도 배치나 제한된 공식 확장이 필요한 요청일 때, **When** 판정하면, **Then** CUSTOM을 검토하고 표준 대안과 유지보수 영향을 설명한다.
3. **Given** 여러 단계, 복잡한 client 상태 또는 직접 제어가 핵심인 요청일 때, **When** 판정하면, **Then** FREESTYLE을 검토하고 Standard·Custom으로 충족하기 어려운 이유를 설명한다.
4. **Given** 목록 중심 흐름과 독립적인 특수 시작 화면이 함께 요청되었을 때, **When** 우선순위를 확인할 수 없으면, **Then** 유형을 강제하지 않고 질문을 제시한다.
5. **Given** 요청이 부족하거나 서로 충돌할 때, **When** 판정하면, **Then** 1~3개의 업무 질문만 제시하고 답변 전에는 UNDECIDED를 유지한다.

### 사용자 스토리 3 - 고정 프로토콜 실행과 생성 의도 확정 (Priority: P1)

사용자는 판정 결과, 범위와 생성 결과를 이해할 수 있다. 시스템은 runtime input과 001 판정을 하나의 generation input으로 정리하고, 사용자의 명시적인 생성 요청을 002, 003 또는 004의 고정 프로토콜 실행과 연결한다.

**독립 테스트**: 명확한 read-only 생성 요청은 safe default를 적용해 선택 프로토콜로 진행할 수 있고, 편집·삭제·action·권한·출력 충돌처럼 결과에 영향을 주는 결정이 부족하면 파일 생성 없이 질문 또는 차단한다.

**인수 시나리오**:

1. **Given** OData metadata와 유형 판정이 확인되었을 때, **When** generation input을 만들면, **Then** request, snapshot summary, assessment, 화면 의도, 데이터 의도, interaction, trace, 가정, 제외 범위와 validation criteria를 하위 프로토콜에 전달한다.
2. **Given** 사용자가 화면을 만들어 달라고 명시했고 안전한 기본값으로 결과를 확정할 수 있을 때, **When** 실행하면, **Then** 원래 생성 요청을 local 새 output 생성에 대한 명시적 생성 의도로 사용한다.
3. **Given** 화면 유형, 표시 field, 편집 범위, output 이름 또는 외부 변경 여부가 결과를 바꿀 수 있을 때, **When** 결정이 부족하면, **Then** 생성 전에 해당 항목만 질문하고 실행을 중지한다.
4. **Given** 사용자가 생성 요약을 거부했을 때, **When** 생성 가능 여부를 결정하면, **Then** child generator와 앱 output을 만들지 않는다.

### 사용자 스토리 4 - 승인된 유형의 Fiori 애플리케이션 생성과 검증 (Priority: P1)

사용자는 자신의 요청에 맞는 하나의 Fiori 애플리케이션과 검증 결과를 받는다. 시스템은 선택된 유형 하나만 하위 generator로 전달하고, 생성 후 구조·데이터 연결·화면 흐름·요구사항 추적을 검증한다.

**독립 테스트**: STANDARD, CUSTOM, FREESTYLE 요청을 각각 수행하여 002, 003, 004 중 정확히 하나만 호출되고, 생성 결과와 validation report가 runtime output으로 기록되는지 확인한다.

**인수 시나리오**:

1. **Given** generation input이 확정되고 필요한 조건이 충족되었을 때, **When** 생성하면, **Then** 선택 유형의 하위 generator 하나만 호출한다.
2. **Given** STANDARD로 판정된 일반 조회 요청일 때, **When** 생성하면, **Then** 002에 handoff하고 List Report 시작 화면과 해당 유형의 검증 결과를 제공한다.
3. **Given** 다른 OData URL 또는 field 목록으로 재실행할 때, **When** 생성하면, **Then** 001~004를 그대로 재사용하고 새 application output과 generation report만 만든다.
4. **Given** output directory가 이미 존재할 때, **When** 생성하면, **Then** 기존 결과를 변경하지 않고 충돌 상태와 해결 방법을 보고한다.
5. **Given** 필수 build, target, navigation, field 또는 contract 검증이 실패했을 때, **When** 결과를 취합하면, **Then** 완료로 표시하지 않고 실패·차단 또는 추가 조치 필요 상태를 보고한다.

## Edge Cases

- collection URL과 service root가 함께 입력되거나 EntitySet을 URL에서 확정할 수 없으면 확인 질문을 한다.
- OData V2, OData V4 또는 metadata 버전이 프로젝트 지원 범위와 다르면 임의 변환하지 않고 선행 조건으로 표시한다.
- navigation property, 계산 값, 미지원 경로를 일반 property처럼 화면에 연결하지 않는다.
- 사용자가 table, 수정 또는 복잡한 화면이라는 단어만 제공하면 실제 업무 목적과 사용 흐름을 질문한다.
- 요청 field가 비어 있으면 metadata에서 안전한 기본 후보를 제시하고 생성 의도를 확인한다.
- metadata hash가 실행 중 바뀌면 기존 판정과 generation input을 폐기하고 다시 대조한다.
- backend annotation이 있어도 service 구조와 사용자 요청을 함께 확인하며 annotation만으로 유형을 결정하지 않는다.
- authorization, transaction, action, update capability 또는 데이터 무결성이 확인되지 않으면 앱 화면으로 대신 구현하지 않는다.
- URL에 credential, token, password 또는 auth header value가 포함되면 저장·log·artifact 기록에서 제거하고 필요한 인증 설정을 안내한다.
- 사용자가 여러 앱을 한 요청에 포함하면 앱별 입력과 유형 판정으로 분리하도록 안내한다.
- 하위 Feature의 contract가 없거나 버전이 충돌하면 유형을 바꾸지 않고 BLOCKED로 보고한다.

## 기능 요구사항

- **FR-001**: 시스템은 자연어 업무 요청, OData service URL 또는 metadata file, 선택 EntitySet, 선택 field와 output intent를 입력으로 받아야 한다.
- **FR-002**: 시스템은 원문 요청과 사용자 답변을 보존하고 각 요구사항에 stable ID를 부여해야 한다.
- **FR-003**: 시스템은 사용자가 기술 유형을 고르기 전에 업무 흐름과 화면 동작에서 판정 근거를 추출해야 한다.
- **FR-004**: 시스템은 metadata에서 확인 가능한 service 정보를 질문 전에 수집해야 한다.
- **FR-005**: 시스템은 service root, OData version, EntitySet, EntityType, key, property, navigation, operation, annotation과 capability를 ServiceSnapshot으로 정규화해야 한다.
- **FR-006**: 시스템은 URL 입력의 HTTPS와 metadata hash를 검증하고 credential, token, password와 auth header value를 저장하지 않아야 한다.
- **FR-007**: 시스템은 collection URL에서 service root와 EntitySet을 판별하고 판별이 불가능하면 질문해야 한다.
- **FR-008**: 시스템은 요청 field를 확인된 property와 대조하고 존재하지 않거나 지원되지 않는 field를 생성에 연결하지 않아야 한다.
- **FR-009**: 시스템은 metadata 누락, 인증 실패, 지원하지 않는 OData version 또는 해석 불가 요소를 prerequisite 또는 BLOCKED 상태로 기록해야 한다.
- **FR-010**: 시스템은 판정에 꼭 필요한 정보가 없을 때만 업무 표현의 추가 질문을 최대 3개 제시해야 한다.
- **FR-011**: 시스템은 이미 제공된 답변이나 ServiceSnapshot에서 확인된 사실을 반복 질문하지 않아야 한다.
- **FR-012**: 시스템은 부족하거나 충돌하는 정보가 있으면 UNDECIDED를 유지하고 유형을 강제 확정하지 않아야 한다.
- **FR-013**: 시스템은 사용자 진술, 시스템 해석, service 사실과 결정 사항을 판정 결과에서 구분해야 한다.
- **FR-014**: 시스템은 표준 목록·검색·필터·상세·일반 편집 흐름으로 충족 가능하면 STANDARD를 우선 추천해야 한다.
- **FR-015**: 시스템은 표준 흐름을 유지하면서 별도 배치 또는 제한된 공식 확장이 필요한 경우에만 CUSTOM을 추천해야 한다.
- **FR-016**: 시스템은 복잡한 client 상태, 다단계 흐름 또는 직접 interaction 제어가 핵심인 경우 FREESTYLE을 추천해야 한다.
- **FR-017**: 시스템은 STANDARD로 충족 가능한 요구에 CUSTOM 또는 FREESTYLE을 추천하지 않아야 하며, CUSTOM에서 FREESTYLE로 올릴 때 이유를 설명해야 한다.
- **FR-018**: 시스템은 table 유형, 전체 행 수, 수정 요구 하나만으로 앱 유형·table 유형·Extension을 결정하지 않아야 한다.
- **FR-019**: 시스템은 판정 결과에 추천 유형, 업무 설명, 기술 근거, 대안, conflicts, 미결정 사항, prerequisite와 후속 Feature를 포함해야 한다.
- **FR-020**: 시스템은 generation input에 원문, 답변, snapshot summary, assessment, 화면·데이터·interaction 의도, trace, 가정, 제외 범위, output과 validation criteria를 포함해야 한다.
- **FR-021**: 시스템은 사용자의 명시적 생성 요청을 safe local output의 생성 의도로 사용할 수 있으며, 결과를 바꾸는 미결정 사항은 생성 전에 해결해야 한다.
- **FR-022**: 시스템은 사용자가 application 생성을 요청하지 않은 상태에서 child generator를 호출하지 않아야 한다.
- **FR-023**: 시스템은 output directory 충돌, path escape, stale metadata, blocking prerequisite와 child contract 충돌을 생성 전에 차단해야 한다.
- **FR-024**: 시스템은 STANDARD를 002, CUSTOM을 003, FREESTYLE을 004에 정확히 하나의 handoff로 연결해야 한다.
- **FR-025**: 시스템은 한 실행에서 둘 이상의 유형별 generator 또는 project를 생성하지 않아야 한다.
- **FR-026**: 시스템은 handoff에 원문 요구사항, 답변, 판정 근거, snapshot reference, 선택 유형과 prerequisite를 손실 없이 전달해야 한다.
- **FR-027**: 시스템은 runtime request, snapshot summary, assessment, handoff, child result와 validation result를 generation report로 기록해야 한다.
- **FR-028**: 시스템은 OData 또는 field가 바뀐 재실행에서 OData별 정적 Feature Spec을 만들지 않아야 한다.
- **FR-029**: 시스템은 backend service, CDS, annotation, authorization, transaction, 업무 규칙, 데이터 무결성, 배포와 Work Zone content를 변경하거나 대신하지 않아야 한다.
- **FR-030**: 시스템은 생성 후 project 구조, 시작 target, navigation, data source, EntitySet, 표시·filter field, annotation, 승인된 interaction과 실행 준비 상태를 검증해야 한다.
- **FR-031**: 시스템은 필수 validation 실패를 COMPLETED로 보고하지 않아야 한다.
- **FR-032**: 시스템은 결과에 requirement trace, 생성 파일, 검증 명령, 통과·실패 criteria, 남은 위험과 후속 조치를 포함해야 한다.
- **FR-033**: 시스템은 지원하지 않는 기능 또는 확인되지 않은 property를 추측하여 화면에 추가하지 않아야 한다.
- **FR-034**: 시스템은 실행 상태를 RECEIVED, SERVICE_INSPECTED, ASSESSMENT_READY, HANDED_OFF, GENERATING, VALIDATING, NEEDS_INPUT, BLOCKED, CANCELLED, FAILED, COMPLETED로 구분해야 한다.
- **FR-035**: 시스템은 validation, metadata, contract, approval, routing, path와 child-generation 오류에 구조화된 code와 retryability를 포함해야 한다.
- **FR-036**: 시스템은 실제 SAP 환경 로그인, backend 변경, 배포와 외부 시스템 변경을 수행하지 않아야 한다.

## 주요 정보 객체

- **AppRequest**: 원문 업무 요청, 답변, 요구사항과 output intent를 담는 입력이다.
- **ServiceSnapshot**: 실행 시점의 OData metadata, EntitySet, key, property, navigation, operation, annotation, capability와 metadata hash다.
- **Assessment**: 001이 만든 유형 판정, evidence, conflicts, questions, prerequisite와 requirement trace다.
- **GenerationInput**: runtime request, service summary, 001 판정, 선택 유형, 가정, 제외 범위, validation 기준과 output을 묶은 입력 객체다.
- **GenerationReport**: 선택 protocol, 생성 파일, metadata hash, validation result와 후속 작업을 묶은 실행 결과다.
- **Handoff**: 선택 유형과 대응 하위 Feature 하나에 전달하는 versioned generation input이다.
- **RunArtifact**: 필요할 때 생성 output 내부에 저장되는 request summary, snapshot summary, assessment, handoff, result와 validation 기록이다.
- **OrchestrationResult**: 실행 상태, dispatch, child result, validation, 오류, 위험과 후속 작업을 포함하는 최종 결과다.

## 성공 기준

| ID | 상황 | 기대 결과 |
|---|---|---|
| ORCH-ANALYZE-01 | OData collection URL과 목록 조회 요청 | metadata 기반 ServiceSnapshot과 요청 field 검증 |
| ORCH-STD-01 | 검색·필터·목록·상세 중심 요청 | STANDARD 판정 후 002 단일 handoff와 Fiori 앱 |
| ORCH-CUS-01 | 표준 흐름을 유지하는 제한적 고유 배치 | CUSTOM 판정 후 003 단일 handoff |
| ORCH-FREE-01 | 복잡한 상태와 직접 interaction 제어 | FREESTYLE 판정 후 004 단일 handoff |
| ORCH-INPUT-01 | field·metadata·업무 결정 부족 | NEEDS_INPUT 또는 BLOCKED, 앱 파일 없음 |
| ORCH-APPROVAL-01 | 사용자 생성 요청 또는 필수 입력 미확정 | child generator와 앱 output 없음 |
| ORCH-ROUTE-01 | 승인된 하나의 유형 | 해당 유형 generator 하나만 호출 |
| ORCH-RERUN-01 | 다른 OData URL 또는 field로 재실행 | 정적 Feature Spec 증가 0건, 새 run artifact만 생성 |
| ORCH-SAFE-01 | 기존 output directory 또는 path escape | 기존 파일 불변, 생성 차단 |

- **SC-001**: 모든 생성 시도에서 앱 파일 생성 전에 ServiceSnapshot, Assessment, GenerationInput과 생성 요청이 확인된다.
- **SC-002**: 요청 field의 100%가 생성 전에 metadata와 대조된다.
- **SC-003**: 모든 판정 결과에 선택 이유, 검토한 대안, 범위, prerequisite와 미확인 사항이 기록된다.
- **SC-004**: 추가 정보가 필요한 모든 실행에서 최대 3개의 중복 없는 업무 질문이 생성 전에 제시된다.
- **SC-005**: STANDARD, CUSTOM, FREESTYLE 실행의 100%가 올바른 하위 Feature 하나로만 handoff된다.
- **SC-006**: 승인되지 않았거나 생성 의도가 부족한 실행의 100%에서 앱 파일이 생성되지 않는다.
- **SC-007**: OData URL 또는 field만 바꾼 재실행의 100%에서 정적 Feature Spec 신규 생성 건수가 0건이다.
- **SC-008**: 기존 output 충돌, stale metadata, blocking prerequisite와 contract 오류의 100%가 생성 전에 보고된다.
- **SC-009**: 필수 validation을 통과하지 못한 결과의 100%가 COMPLETED가 아닌 FAILED, BLOCKED 또는 추가 조치 필요 상태로 보고된다.
- **SC-010**: 원문 요구사항과 사용자 답변의 100%가 evidence, prerequisite, assumption, out-of-scope 또는 생성 결과로 추적된다.
- **SC-011**: 사용자 요청이 명확한 정상 경로에서는 별도 유형 선택을 요구하지 않고 001이 판정부터 생성·검증까지 진행한다.

## 가정 및 의존성

- MVP는 OData V4 metadata와 HTTPS service URL 또는 local EDMX file을 지원한다.
- 사용자가 기술 유형을 지정하지 않으면 STANDARD를 먼저 검토한다.
- 사용자가 명시한 화면 생성 요청은 local workspace의 새 output 생성 의도로 간주할 수 있다.
- 사용자가 명시하지 않은 업무 범위는 read-only 조회로 간주한다.
- title, application ID, namespace, table type, device와 상세 흐름에 안전한 기본값이 있으면 GenerationInput에 가정으로 기록한다.
- 편집·삭제·action·authorization·transaction은 service capability와 사용자의 명시적 요구가 모두 확인될 때만 후속 유형 Spec으로 전달한다.
- 002, 003, 004는 versioned generation request/result contract를 제공한다.
- generation report는 application output 내부에 저장할 수 있으며 자격 증명과 불필요한 원본 행 데이터를 저장하지 않는다.
- 실제 SAP 로그인, backend 변경, 배포와 Work Zone content 변경은 범위 밖이다.

## 범위 제외

- OData service별 정적 Feature Spec 추가
- backend service, CDS, authorization, transaction, 업무 규칙과 데이터 모델 생성·변경
- 확인되지 않은 property, association, action, capability 또는 extension point 추측
- 하위 Feature가 소유한 유형별 template과 상세 UI 정책의 중복 구현
- 기존 output 덮어쓰기, 삭제, commit, push, 배포와 외부 시스템 변경
- 하나의 실행에서 여러 유형 프로젝트 동시 생성
- 운영 환경용 queue, multi-user state, 보존 정책과 모니터링 시스템
