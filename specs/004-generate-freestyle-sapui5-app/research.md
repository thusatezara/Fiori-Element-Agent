# Research: FreeStyle SAPUI5 애플리케이션 생성

## Decision 1: FreeStyle은 최후 유형으로 유지

**Decision**: Standard List Report 또는 Custom Page/Building Blocks로 충분한 요청은 생성하지 않고 재판정한다.

**Rationale**: SAP는 OData V4의 유연한 화면에 Custom Page를 우선 권장하므로 FreeStyle은 복잡한 direct interaction과 client state가 핵심인 경우에만 필요하다.

**Alternatives considered**: 모든 특수 요청을 FreeStyle로 생성하면 framework 기능과 유지보수 이점을 잃는다.

**Source**: [SAP Fiori tools의 Custom Page 우선 권장](https://help.sap.com/docs/SAP_FIORI_tools/17d50220bcd848aa854c9c182d65b699/7833775ae607430c9d708d9a3a145263.html)

## Decision 2: XML View와 async module/controller pattern 사용

**Decision**: 각 screen은 XML View와 controller pair로 생성하고 `sap.ui.define` 및 async Component/routing 구성을 사용한다.

**Rationale**: declarative UI, namespace 안정성, testability와 표준 UI5 tooling 호환성을 제공한다.

**Alternatives considered**: JavaScript View와 global module은 유지보수성과 static validation이 낮아 제외한다.

## Decision 3: OData model과 UI state model 분리

**Decision**: 업무 데이터는 default OData V4 model, wizard selection과 임시 화면 상태는 named JSONModel에 저장한다.

**Rationale**: backend entity 상태와 client-only navigation state의 수명과 책임을 구분한다.

**Alternatives considered**: OData entity에 임시 UI field를 추가하거나 controller field에 분산 저장하는 방식은 제외한다.

## Decision 4: annotation은 UI 생성 근거로 사용하지 않음

**Decision**: EDMX의 schema, key, type, operation과 capability만 binding/operation validation에 사용하고 `UI.*` annotation term은 layout/control 선택 입력에서 제거한다.

**Rationale**: 사용자 정의의 FreeStyle 경계를 검증 가능하게 만든다.

**Alternatives considered**: annotation에서 columns/forms를 자동 구성하면 Custom Page와 구분이 흐려진다.

## Decision 5: backend boundary를 generation gate로 검사

**Decision**: action/transaction/authorization/data-integrity 요구는 service snapshot에서 capability가 확인되어야 하며 확인되지 않으면 client handler를 생성하지 않는다.

**Rationale**: UI 로직이 backend 업무 책임을 잘못 대체하는 것을 방지한다.

## Decision 6: 오류 유형별 상태 전이를 명시

**Decision**: input validation, transport failure, service business error를 서로 다른 transition과 사용자 message key로 생성한다.

**Rationale**: 오류 발생 후 사용자가 수정, 재시도, 취소 중 가능한 행동을 일관되게 검증할 수 있다.
