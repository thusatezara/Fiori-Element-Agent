# 기능 명세: Work Zone 배포 준비가 완료된 Standard Fiori Elements 프로젝트 생성

**Feature Branch**: `master`  
**Created**: 2026-09-04  
**Status**: Draft  
**Input**: OData V4 서비스와 애플리케이션 요구사항으로부터 Standard Fiori Elements 프로젝트 및 Work Zone 배포 준비 산출물을 생성한다.

## 사용자 시나리오 및 테스트 *(필수)*

### 사용자 스토리 1 - Standard 프로젝트 생성 (Priority: P1)

SAP Fiori Elements 개발자는 애플리케이션 정보, OData V4 서비스 정보, 주요 EntitySet 및 요구사항을 제공하고, Standard Fiori Elements 지원 여부를 확인한 뒤 승인하여 List Report/Object Page 프로젝트와 Work Zone 배포 준비 산출물을 얻는다.

**우선순위 이유**: 반복적인 초기 설정을 줄이고 검증된 로컬 프로젝트를 만드는 것이 이 기능의 핵심 가치다.

**독립 테스트**: Standard 방식으로 구현 가능한 요구사항과 유효한 필수 입력을 제공하고, 사전 요약을 승인한 뒤 로컬 프로젝트와 검증 보고서가 생성되는지 확인할 수 있다.

**인수 시나리오**:

1. **Given** 유효한 OData V4 서비스 정보, metadata에 존재하는 EntitySet 및 모든 필수 애플리케이션 정보가 제공되고 요구사항이 Standard 방식으로 구현 가능할 때, **When** 사용자가 생성 요약을 승인하면, **Then** 선택한 EntitySet을 기반으로 하는 List Report/Object Page 프로젝트와 배포 준비 정보가 로컬 경로에 생성된다.
2. **Given** 사용자가 Tile Subtitle을 제공하지 않았을 때, **When** 프로젝트를 생성하면, **Then** Tile Title과 navigation intent는 포함되지만 Tile Subtitle은 생성 결과에 포함되지 않는다.
3. **Given** 프로젝트가 생성되었을 때, **When** 필수 검증을 수행하면, **Then** UI application build 결과와 가능한 배포 패키지 검증 결과가 생성 보고서에 기록된다.

---

### 사용자 스토리 2 - 구현 가능성 사전 판정 (Priority: P2)

개발자는 프로젝트 생성 전에 각 애플리케이션 요구사항이 Standard 방식으로 가능한지 알고, 불가능하거나 정보가 부족한 요구사항에 대한 이유와 후속 선택지를 확인한다.

**우선순위 이유**: 지원되지 않는 요구사항을 누락하거나 임의로 Custom 구현하는 위험을 생성 전에 차단한다.

**독립 테스트**: Standard, annotation 보완 필요, Extension 필요, Custom Page 필요, Freestyle 검토 필요 요구사항을 함께 입력하고 모든 항목이 하나의 분류와 근거를 받는지 확인할 수 있다.

**인수 시나리오**:

1. **Given** 여러 애플리케이션 요구사항이 제공되었을 때, **When** Agent가 구현 가능성을 판정하면, **Then** 각 요구사항은 정의된 다섯 가지 결과 중 정확히 하나로 분류되고 누락되지 않는다.
2. **Given** Extension이 필요한 요구사항이 있을 때, **When** 판정 결과를 보고하면, **Then** 대상 요구사항, Standard 방식의 한계, 권장 extension point, 예상 유지보수 영향 및 별도 Feature Spec이 필요한 이유를 포함한다.
3. **Given** Standard 범위 밖의 요구사항이 있을 때, **When** 생성 절차가 진행되면, **Then** 해당 요구사항을 임의로 생략하거나 Custom 코드로 변환하지 않고 사용자에게 별도 결정이 필요함을 알린다.

---

### 사용자 스토리 3 - 안전한 실패와 결과 확인 (Priority: P3)

개발자는 잘못되거나 불완전한 입력, 기존 파일 충돌 또는 검증 실패가 발생했을 때 기존 작업을 보호받고, 실패 이유와 필요한 후속 조치를 확인한다.

**우선순위 이유**: 자동 생성 과정의 데이터 손실과 잘못된 성공 보고를 방지하고 결과를 감사 가능하게 만든다.

**독립 테스트**: 누락 입력, 존재하지 않는 EntitySet, 기존 파일이 있는 경로 또는 build 실패 조건을 각각 제공하여 생성 중단, 무변경 보장 및 진단 보고를 확인할 수 있다.

**인수 시나리오**:

1. **Given** 필수 입력이 누락되거나 유효하지 않을 때, **When** 생성을 요청하면, **Then** 값을 추측하지 않고 생성 전에 오류와 필요한 수정 사항을 보고한다.
2. **Given** 대상 경로에 기존 파일이나 프로젝트가 있을 때, **When** 사용자가 덮어쓰기를 승인하지 않으면, **Then** 기존 파일을 변경하지 않고 생성을 중단한다.
3. **Given** 필수 build 또는 검증이 실패했을 때, **When** 결과를 보고하면, **Then** 생성을 성공으로 표시하지 않고 실패 단계, 확인된 원인 및 후속 검증 방법을 제공한다.
4. **Given** 생성 또는 검증 절차가 실행될 때, **When** 작업이 종료되면, **Then** 실제 SAP BTP, HTML5 Application Repository 및 Work Zone 환경은 변경되지 않는다.

### Edge Cases

- 제공된 서비스가 OData V4가 아니거나 metadata를 읽고 검증할 수 없으면 어떻게 중단하고 진단하는가?
- 선택한 EntitySet이 없거나 navigation 대상에 적합하지 않으면 어떤 입력 수정을 요구하는가?
- application ID 또는 namespace 형식, 최소 SAPUI5 version, Semantic Object 또는 Action이 유효하지 않으면 어떻게 보고하는가?
- 대상 경로가 존재하지 않거나 쓰기 권한이 없거나 비어 있지 않으면 어떻게 처리하는가?
- 일부 요구사항만 Standard 방식으로 구현 가능하면 생성 승인을 받기 전에 무엇을 보여주는가?
- 요구사항 판정에 필요한 annotation 정보가 metadata에 부족하면 어떻게 분류하는가?
- Tile Subtitle이 빈 문자열 또는 공백만 포함하면 미입력으로 취급하는가?
- UI application build는 가능하지만 배포 패키지 build 도구가 없거나 해당 build만 실패하면 완료 상태를 어떻게 판정하는가?
- 입력이나 오류 메시지에 자격 증명으로 보이는 값이 포함되면 저장 및 보고 과정에서 어떻게 보호하는가?

## 요구사항 *(필수)*

### 기능 요구사항

- **FR-001**: 시스템은 애플리케이션 이름, application ID 또는 namespace, 로컬 생성 경로, OData V4 서비스 정보, 주요 EntitySet, 애플리케이션 요구사항, 최소 SAPUI5 version, Tile Title, Semantic Object 및 Action을 필수 입력으로 받아야 한다.
- **FR-002**: 시스템은 Tile Subtitle을 선택 입력으로 받아야 하며, 값이 제공되지 않으면 관련 설정을 생성하지 않아야 한다.
- **FR-003**: 시스템은 프로젝트 생성 전에 모든 필수 입력의 존재 여부와 형식 유효성을 검사하고, 유효하지 않은 값을 추측하거나 보완하지 않아야 한다.
- **FR-004**: 시스템은 제공된 서비스가 OData V4인지 검증하고, 검증할 수 없거나 V4가 아니면 생성을 중단해야 한다.
- **FR-005**: 시스템은 사용자가 선택한 주요 EntitySet이 OData metadata에 존재하는지 검증하고, 존재하지 않으면 생성을 중단해야 한다.
- **FR-006**: 시스템은 각 애플리케이션 요구사항을 `Standard 방식으로 구현 가능`, `추가 annotation 정보 필요`, `Extension 필요`, `Custom Page 필요`, `Freestyle SAPUI5 검토 필요` 중 하나로 분류해야 한다.
- **FR-007**: 시스템은 Standard 방식으로 구현할 수 없는 요구사항을 생략하거나 Custom 코드로 변환해서는 안 된다.
- **FR-008**: 시스템은 Extension이 필요한 요구사항마다 대상 요구사항, Standard 방식으로 충족할 수 없는 이유, 권장 extension point, 예상 유지보수 영향 및 별도 Feature Spec이 필요한 이유를 보고해야 한다.
- **FR-009**: 시스템은 모든 필수 결정이 완료된 후 생성 전에 대상 경로, 주요 입력, 요구사항 판정 결과 및 생성 예정 결과를 사용자에게 보여주고 명시적 승인을 받아야 한다.
- **FR-010**: 시스템은 사용자의 승인 후에만 선택한 EntitySet을 기반으로 하는 Standard Fiori Elements List Report/Object Page 로컬 프로젝트를 생성해야 한다.
- **FR-011**: 생성 결과는 application ID와 namespace, OData V4 data source, 주요 EntitySet, 최소 SAPUI5 version 및 Standard navigation 정보를 반영해야 한다.
- **FR-012**: 생성 결과는 `sap.cloud.service`, backend destination, application version 및 후속 SAP BTP Cloud Foundry 배포에 필요한 배포 준비 정보를 표현해야 한다.
- **FR-013**: 생성 결과는 Semantic Object와 Action으로 Launchpad inbound navigation을 구성하고 Tile Title 및 제공된 경우에만 Tile Subtitle을 반영해야 한다.
- **FR-014**: 첫 번째 버전은 Custom Action, Custom Column, Custom Section, Controller Extension, XML Fragment 기반 사용자 정의 UI, Custom Page 및 Freestyle SAPUI5 구현을 생성해서는 안 된다.
- **FR-015**: 시스템은 대상 경로에 기존 파일이나 프로젝트가 있으면 충돌 대상과 영향을 알리고, 별도 사용자 승인 없이는 해당 파일을 덮어쓰거나 변경하지 않아야 한다.
- **FR-016**: 시스템은 생성된 UI application의 build를 검증하고, 실패하면 전체 생성 결과를 성공으로 보고해서는 안 된다.
- **FR-017**: 시스템은 배포 준비 산출물에 대한 검증 결과를 성공, 실패 또는 환경 제약으로 인해 미검증으로 구분하여 보고해야 한다.
- **FR-018**: 시스템은 생성·검증 중 실제 SAP BTP 로그인이나 배포, HTML5 Application Repository 변경, destination 또는 XSUAA 변경, Work Zone 콘텐츠·사이트·공간·페이지·Tile·역할 변경을 수행해서는 안 된다.
- **FR-019**: 시스템은 비밀번호, access token, service key 또는 사용자 자격 증명을 프로젝트, 생성 산출물 및 로그에 저장해서는 안 된다.
- **FR-020**: 시스템은 생성 파일, 적용된 주요 설정, 요구사항별 판정, 수행한 검증과 결과, 지원하지 못한 요구사항 및 후속 작업을 최종 보고해야 한다.
- **FR-021**: 시스템은 첫 번째 버전의 OData 서비스 정보 입력 범위를 **[NEEDS CLARIFICATION: 로컬 EDMX 파일만 지원할지, BTP destination이나 직접 service URL까지 지원할지, 또는 복수 방식을 지원할지 결정해야 한다.]**
- **FR-022**: metadata의 annotation이 부족한 경우 시스템의 동작은 **[NEEDS CLARIFICATION: 필요한 local annotation을 생성할지, 부족한 annotation과 필요한 정보를 보고만 할지 결정해야 한다.]**
- **FR-023**: 배포 준비 완료의 필수 기준은 **[NEEDS CLARIFICATION: `.mtar` 생성까지 필수로 할지, `mta.yaml` 생성·검증을 필수로 하고 `.mtar` build는 환경에 따른 선택 검증으로 둘지 결정해야 한다.]**

### 주요 엔터티

- **생성 요청**: 사용자가 제공한 애플리케이션 식별 정보, 대상 경로, 서비스 정보, EntitySet, UI 요구사항, version 및 Tile navigation 정보를 묶은 요청이다.
- **서비스 설명**: OData version, EntitySet 및 annotation 등 프로젝트 생성과 지원 여부 판정에 사용되는 확인 가능한 metadata다.
- **요구사항 판정**: 개별 사용자 요구사항, 다섯 가지 구현 가능성 분류, 판정 근거 및 필요한 후속 조치를 포함한다.
- **생성 승인 요약**: 프로젝트를 만들기 전에 사용자에게 제시되는 대상 경로, 주요 설정, 범위 및 미지원 요구사항의 스냅샷이다.
- **프로젝트 결과**: 승인된 입력에 따라 생성된 로컬 애플리케이션과 배포 준비 산출물의 목록 및 적용 값이다.
- **검증 결과**: 검증 항목별 성공, 실패 또는 미검증 상태와 그 근거 및 후속 조치를 기록한다.

## 성공 기준 *(필수)*

### 측정 가능한 결과

- **SC-001**: 모든 필수 입력이 유효한 Standard 범위의 요청에서 사용자는 한 번의 승인 흐름을 거쳐 로컬 프로젝트와 최종 검증 보고서를 얻을 수 있다.
- **SC-002**: 제출된 애플리케이션 요구사항의 100%가 정의된 다섯 가지 구현 가능성 결과 중 하나로 분류되며, 미분류 또는 무보고 요구사항은 0개다.
- **SC-003**: 유효하지 않은 필수 입력, OData version 불일치 또는 존재하지 않는 EntitySet이 포함된 테스트 요청의 100%가 파일 생성 전에 중단되고 수정 가능한 오류를 제공한다.
- **SC-004**: 사전 승인 없이 기존 파일이 변경되는 검증 사례는 0건이다.
- **SC-005**: 성공으로 보고된 모든 생성 결과에서 application ID·namespace, 주요 EntitySet, 최소 SAPUI5 version, Semantic Object·Action, Tile Title 및 선택적 Tile Subtitle 반영 여부를 사용자가 보고서와 산출물에서 확인할 수 있다.
- **SC-006**: 성공으로 보고된 모든 생성 결과에서 UI application build가 통과하며, 배포 준비 검증은 성공·실패·미검증 중 하나와 근거가 100% 기록된다.
- **SC-007**: 실행 전후 비교에서 SAP BTP, HTML5 Application Repository 및 Work Zone 외부 환경 변경은 0건이다.
- **SC-008**: 최종 보고서는 생성 파일, 주요 설정, 요구사항 판정, 검증 결과, 미지원 요구사항 및 후속 작업의 여섯 범주를 빠짐없이 포함한다.

## 가정 및 의존성

- 사용자는 프로젝트 생성 시점에 실제 OData V4 metadata와 회사별 BTP 설정을 제공한다.
- 사용자는 선택할 주요 EntitySet과 생성 대상 로컬 경로에 대한 쓰기 권한을 알고 있다.
- 기본 구현 언어는 별도 요청이 없으면 JavaScript다.
- 기본 배포 준비 대상은 독립형 MTA, `mta.yaml`, SAP Managed Application Router 및 기존 BTP destination 참조 방식이다. 세부 파일 구조, 라이브러리 및 명령은 Plan 단계에서 결정한다.
- 실제 BTP 배포와 Work Zone Tile 게시는 후속 Feature에서 다루며 현재 기능의 성공 여부에 포함하지 않는다.
- 실제 환경과 제품 동작을 확인할 때 대상 OData V4 metadata, 프로젝트 루트 `AGENTS.md`, 프로젝트 Constitution, SAP Fiori Elements·Fiori tools·Build Work Zone standard edition·BTP HTML5 Application Repository 공식 문서를 근거로 사용한다.

## 범위 제외

- 실제 SAP BTP 로그인과 `cf deploy`
- SAP BTP subaccount, org 또는 space 변경
- HTML5 Application Repository 실제 배포
- destination 또는 XSUAA service instance 생성·변경
- Work Zone 콘텐츠 갱신, Site·Space·Page·Tile 배치 및 역할 할당
- 실제 Tile 실행 검증
- Extension 코드, Custom Page 또는 Freestyle SAPUI5 애플리케이션 생성
- 기존 프로젝트 업데이트

