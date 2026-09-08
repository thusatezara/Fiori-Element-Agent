# Research: Standard Fiori Elements 애플리케이션 생성

## Decision 1: List Report와 선택적 Object Page를 기본 vertical slice로 사용

**Decision**: 시작 target은 `sap.fe.templates.ListReport`, 상세가 요청되면 `sap.fe.templates.ObjectPage`를 navigation target으로 구성한다.

**Rationale**: Standard 유형의 목록·필터·상세 업무를 가장 적은 custom code로 제공한다.

**Alternatives considered**: Custom Page와 Freestyle target은 각각 003, 004의 독립 진입점이므로 생성하지 않는다.

**Source**: [SAP Fiori elements OData V4 standard floorplans](https://help.sap.com/docs/SAP_FIORI_tools/17d50220bcd848aa854c9c182d65b699/7833775ae607430c9d708d9a3a145263.html)

## Decision 2: table 유형은 workload profile로 선택

**Decision**: desktop 중심, 많은 열, 행 단위 탐색과 가로 작업이 중요하면 Grid Table 후보로 두고, mobile/responsive 접근과 제한된 결과 탐색이면 Responsive Table을 선택한다. 전체 행 수만으로 결정하지 않는다.

**Rationale**: table control의 사용성은 데이터 전체 크기보다 viewport, 열 밀도와 작업 방식의 영향을 함께 받는다.

**Alternatives considered**: 모든 앱을 Grid 또는 Responsive로 고정하는 방식은 Spec의 대표 사례를 충족하지 못한다.

## Decision 3: edit는 standard capability를 먼저 사용

**Decision**: service update capability와 metadata 조건을 확인한 후 Object Page standard edit를 우선하고, 지원되는 경우에만 inline edit를 선택한다.

**Rationale**: “수정” 요구만으로 Extension을 만들지 않고 Fiori elements가 제공하는 transaction 흐름을 유지한다.

**Source**: [Object Page edit mode navigation](https://help.sap.com/docs/SAPUI5/b2f662dd9d7a4ec680056733050b4d34/8665847a17a14e1abdcebe3e235c8c68.html)

## Decision 4: annotation은 local overlay로만 보완

**Decision**: service annotation을 우선 소비하며 필수 화면 term이 부족할 때 생성 project의 `webapp/annotations/annotation.xml`에 local annotation을 추가한다.

**Rationale**: backend 계약을 변경하지 않으면서 생성 앱을 실행할 수 있고, 생성된 보완 내용을 명확하게 검토할 수 있다.

**Alternatives considered**: backend CDS/annotation 자동 변경은 권한과 소유권을 벗어나 제외한다.

## Decision 5: Extension은 allowlist와 근거 record를 요구

**Decision**: MVP는 공식 custom action, custom column, custom section 중 승인된 하나만 허용한다. standard 대안, 필요 이유, 대상 requirement와 검증 방법이 없으면 거부한다.

**Rationale**: Clean Core 원칙과 upgrade 안정성을 지키면서 제한적인 차이를 제공한다.

**Source**: [SAP Fiori elements app extensions](https://help.sap.com/docs/SAPUI5/b2f662dd9d7a4ec680056733050b4d34/358cf2598d71462b8ac2bd8c944efbfd.html)

## Decision 6: 생성물은 mock preview와 production build를 모두 검증

**Decision**: local metadata/mock data를 사용하는 preview smoke test와 `ui5 build`를 실행하고 결과를 report에 기록한다.

**Rationale**: file 생성만으로 완료하지 않고 routing, descriptor와 tooling 구성이 실제로 로드·build되는지 확인한다.
