# Research: BTP 솔루션 요청 orchestration 기반

## Decision: CAP solution layout

- **Decision**: 생성되는 전체 솔루션은 CAP 관례에 맞춰 `app/`, `db/`, `srv/`를 사용한다.
- **Rationale**: Frontend와 Backend를 사용자에게 하나의 solution으로 제공하면서도 각 runtime 책임을 표준 directory로 분리할 수 있다.
- **Alternatives considered**: Frontend와 Backend를 별도 repository로 생성하는 방식은 사용자가 project 경계를 관리해야 하고 통합 MTA 생성이 복잡해져 기본값에서 제외한다.

## Decision: Cloud Foundry deployment boundary

- **Decision**: 200은 MTA descriptor와 archive-ready 결과까지만, 300은 target 확인과 실제 CF deployment만 소유한다.
- **Rationale**: SAP CAP의 공식 Cloud Foundry 경로가 MTA module/resource 구성과 build/deploy를 구분하며, 실제 배포는 외부 상태 변경과 인증을 요구한다.
- **Source**: https://cap.cloud.sap/docs/guides/deploy/to-cf
- **Alternatives considered**: generator에서 즉시 `cf deploy`를 실행하면 local generation과 외부 변경이 결합되어 안전 gate와 재시도가 어려워진다.

## Decision: Work Zone publication boundary

- **Decision**: 400은 Work Zone edition, subaccount, content provider와 site target을 확인한 뒤 publish를 수행하는 별도 protocol이다.
- **Rationale**: HTML5 app deployment만으로 최종 사용자 tile 노출이 완결되지 않으며 manifest navigation/business service 정보와 content provider/site 작업이 필요하다.
- **Source**: https://help.sap.com/docs/build-work-zone-advanced-edition/sap-build-work-zone-advanced-edition/expose-html5-applications-in-sap-build-work-zone-advanced-edition
- **Alternatives considered**: 300에 Work Zone 처리를 포함하면 deployment 성공과 content 노출 성공을 구분할 수 없다.

## Decision: Agent와 Spec 분리

- **Decision**: protocol Spec은 Root `specs/`에 단일 원본으로 두고 project-scoped Agent는 `.codex/agents/`에서 담당 Spec을 참조한다.
- **Rationale**: Spec 복제를 피하고 Agent의 실행 역할과 protocol의 제품 계약을 독립적으로 변경할 수 있다.
- **Alternatives considered**: Agent별 directory에 Spec을 복제하면 동일 요구사항이 서로 다르게 갱신될 가능성이 높다.

## Decision: deterministic planning baseline

- **Decision**: MVP scope 판정은 명시적 키워드와 dependency rule을 사용하는 deterministic planner로 제공한다.
- **Rationale**: 현재 runtime dependency를 늘리지 않고 routing regression을 재현 가능하게 검증할 수 있다. 이후 LLM adapter가 추가되어도 같은 `SolutionRequest` contract를 출력해야 한다.
- **Alternatives considered**: 처음부터 model 호출에 routing 전체를 맡기는 방식은 offline test와 결과 재현성이 떨어진다.
