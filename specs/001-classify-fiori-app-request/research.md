# Research: Fiori 애플리케이션 요청 분석·판정·생성

## Decision 1: 001을 단일 진입점으로 사용

**Decision**: OData 입력, service inspection, 업무 질문, 유형 판정, generation input, routing과 result aggregation을 001에서 담당한다. legacy Orchestrator Feature는 폐기하고 그 책임을 001에 편입한다.

**Rationale**: 자연어 요청부터 유형별 생성까지 하나의 흐름으로 묶어 context loss와 중복 정책을 줄인다. 사용자가 같은 OData 요청을 보내면 항상 001부터 시작할 수 있다.

**Alternatives considered**: legacy Orchestrator를 상위 계층으로 남기는 방식은 001과 service·classification·approval 책임이 겹치고, agent의 진입점이 둘로 분리된다. 유형별 생성 로직을 001에 복사하는 방식은 하위 Feature의 책임 경계를 깨므로 제외한다.

## Decision 2: service fact와 user intent 분리

**Decision**: OData metadata를 immutable ServiceSnapshot으로 정규화하고, 자연어 요청과 답변을 AppRequest 및 Requirement로 보존한다. Assessment는 두 출처를 evidence와 trace로 연결한다.

**Rationale**: 확인된 property와 사용자의 희망 field를 구분하고, 확인되지 않은 capability를 추측하지 않게 한다. 모든 하위 generator가 동일한 snapshot을 사용할 수 있다.

**Alternatives considered**: 각 generator가 metadata를 다시 읽고 해석하는 방식은 판정과 생성 사이의 drift를 만들 수 있어 제외한다.

## Decision 3: 질문과 생성 의도 gate

**Decision**: service facts로 확인할 수 있는 내용은 질문하지 않는다. 결과를 바꾸는 결정이 비어 있으면 최대 3개 업무 질문을 하고, 명확한 Fiori application 생성 요청과 safe default가 있으면 해당 요청을 local 새 output의 generation intent로 사용한다.

**Rationale**: 짧은 사용자 요청도 한 번의 작업으로 완료할 수 있게 하면서, 유형·field·edit·external change처럼 중요한 불확실성은 생성 전에 해소한다.

**Alternatives considered**: 모든 요청에 별도 승인 문장만 요구하면 명확한 생성 요청에도 불필요한 중단이 생긴다. 모든 ambiguity를 추측하면 잘못된 앱이 생성될 수 있어 제외한다.

## Decision 4: deterministic classification과 단일 dispatch

**Decision**: 업무 흐름과 service 사실을 명시적인 rule로 평가하고 STANDARD→002, CUSTOM→003, FREESTYLE→004 registry로 정확히 하나의 child generator를 호출한다.

**Rationale**: 같은 입력에서 재현 가능한 판정과 one-generator invariant를 보장한다. 하위 Feature의 정책을 여러 번 평가하지 않는다.

**Alternatives considered**: 세 generator를 모두 실행해 결과를 비교하는 방식은 불필요한 output과 승인 범위 초과를 만들므로 제외한다.

## Decision 5: 실행별 artifact와 정적 Spec 분리

**Decision**: runtime request summary, snapshot summary, assessment, handoff, result와 validation은 생성 application의 generation report에 저장한다. 고정 생성 프로토콜은 001과 002~004에만 둔다.

**Rationale**: OData 또는 field가 바뀌어도 정책 Spec이 늘어나지 않고, 어떤 입력과 결정으로 앱을 만들었는지 재현할 수 있다.

**Alternatives considered**: OData마다 specs/<odata>/를 만드는 방식은 정적 정책과 실행 데이터를 섞고 관리 대상이 계속 증가하므로 제외한다.

## Decision 6: local CLI와 fixture 기반 검증

**Decision**: root의 generate command와 local OData fixture로 분석부터 child handoff까지 재현한다. 실제 remote service는 read-only smoke로만 확인하며 backend 변경과 배포를 테스트에 포함하지 않는다.

**Rationale**: credential 없이 contract, 질문 gate, one-generator routing, no-write와 rerun을 검증할 수 있다.

**Source**: project constitution, 002~004 Feature Spec, SAP Fiori tools와 UI5 공식 문서

## Open implementation risk

현재 저장소에는 이 Plan의 root CLI, 001 orchestration module과 002~004 generator 전체가 아직 구현되지 않았다. 문서 통합으로 진입 정책은 정리되었으며, runtime 구현 전에도 Agent가 하위 Spec을 따르는 manual adapter로 동일한 요청을 실행할 수 있다. 재현 가능한 CLI 자동 실행은 tasks.md의 implementation phase 완료 후 보장된다.
