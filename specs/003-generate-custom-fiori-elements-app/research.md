# Research: Custom Fiori Elements 애플리케이션 생성

## Decision 1: Custom Page target은 `sap.fe.core.fpm`

**Decision**: manifest routing target을 `type: Component`, `name: sap.fe.core.fpm`으로 만들고 승인된 XML View를 `viewName`으로 연결한다.

**Rationale**: 별도 View target과 Fiori elements Flexible Programming Model 기능을 함께 제공하는 SAP 공식 방식이다.

**Alternatives considered**: `sap.ui.core.mvc.View`를 직접 target으로 사용하는 순수 UI5 routing은 Building Blocks의 page integration을 잃으므로 004에 가깝다. List Report를 먼저 만들고 custom page로 이동하는 구조는 사용자가 정한 독립 진입점과 충돌한다.

**Source**: [SAPUI5 Custom Pages routing target](https://help.sap.com/docs/SAPUI5/d625376e710e40cb9d40e43e1b02933b/ecdf1d6b2bda47b2accd369046c4936d.html)

## Decision 2: Building Blocks는 확인된 metaPath만 사용

**Decision**: Page, Filter Bar, Table, Form을 우선 지원하고 `contextPath`와 `metaPath`는 service snapshot에서 실제 EntitySet과 annotation term을 resolve한 후 생성한다.

**Rationale**: Building Blocks는 metadata/annotation context에 의존하므로 문자열을 추측하면 runtime failure가 발생한다.

**Alternatives considered**: 임의 binding path 생성은 제외한다. 필요한 annotation이 없으면 local annotation plan을 제시하거나 blocking prerequisite로 남긴다.

**Source**: [Fiori tools Building Blocks 유지관리](https://help.sap.com/docs/SAP_FIORI_tools/17d50220bcd848aa854c9c182d65b699/6d3ad83b9694475684d41f017bbccf20.html)

## Decision 3: 직접 구성 영역은 화면 영역 단위로 격리

**Decision**: 승인된 direct region은 별도 XML Fragment와 controller handler에 배치하고 requirement ID, input/output, 상태 소유권을 generation report에 기록한다.

**Rationale**: 표준 영역과 custom code의 경계를 검토·테스트할 수 있고 변경 영향을 줄인다.

**Alternatives considered**: 모든 View를 raw controls로 작성하면 Building Blocks 재사용 목표를 잃는다.

## Decision 4: Standard/FreeStyle 재판정은 생성 전에 수행

**Decision**: 고유 layout이 없으면 `STANDARD`, metadata 재사용 가치가 없고 복잡한 client 상태가 핵심이면 `FREESTYLE` 결과로 차단한다.

**Rationale**: Custom을 catch-all 유형으로 사용하지 않고 최소 자유도 원칙을 유지한다.

## Decision 5: XML과 navigation을 실행 전 정적으로 검증

**Decision**: namespace, controllerName, viewName, `contextPath`, `metaPath`, route/target 연결을 검사한 뒤 mock preview와 build를 실행한다.

**Rationale**: Custom Page 오류의 상당수는 binding 이전의 descriptor/XML 연결에서 발견할 수 있다.
