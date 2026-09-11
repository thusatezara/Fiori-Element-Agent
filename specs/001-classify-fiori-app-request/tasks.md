# Tasks: 재사용 가능한 Fiori SDD 생성 프로토콜

`001~004`는 사용자 요청마다 복제하는 Feature Spec이 아니라, 모든 OData 기반 Fiori 생성에 재사용하는 고정 프로토콜이다. runtime input은 protocol을 실행하기 위한 일시적인 값이며 새 `specs/<request>`를 만들지 않는다.

## Phase 1: Protocol definition

- [x] T001 `AGENTS.md`에 001 단일 진입점, 002/003/004 단일 handoff와 요청별 Spec 미생성 규칙을 정의
- [x] T002 001 문서에서 execution Spec을 GenerationInput과 GenerationReport로 변경
- [x] T003 001 handoff/result contract에서 요청별 Feature Spec과 approval artifact 의존성을 제거

## Phase 2: 001 runtime

- [x] T004 `src/orchestration/generate.mjs`에 OData URL 정규화와 service root/EntitySet 분리 구현
- [x] T005 OData V2/V4 metadata에서 EntitySet, EntityType, key, property와 navigation property 추출
- [x] T006 자연어 요청과 명시적 type override를 001의 STANDARD/CUSTOM/FREESTYLE 판정으로 연결
- [x] T007 metadata hash, secret-safe service summary와 output collision guard 구현
- [x] T008 staging directory와 atomic rename으로 생성 중간 결과가 최종 output에 노출되지 않도록 구현

## Phase 3: 002 Standard Fiori Elements

- [x] T009 metadata 기반 List Report/Object Page manifest 생성
- [x] T010 EntityType, key와 primitive property에서 local UI annotation 생성
- [x] T011 service root, proxy path, namespace와 i18n을 입력값으로 렌더링
- [x] T012 generated project validator와 generation report 생성

## Phase 4: 003 Custom Fiori Elements

- [x] T013 Standard Fiori Elements 구조를 재사용하는 Custom handoff 생성
- [x] T014 공식 controller extension scaffold를 Custom output에 포함
- [x] T015 Custom handoff가 다른 generator를 호출하지 않는지 report에 기록

## Phase 5: 004 Freestyle SAPUI5

- [x] T016 OData property에서 동적 responsive table XML 생성
- [x] T017 SAPUI5 Component, manifest, routing, OData model과 i18n 생성
- [x] T018 Freestyle binding/routing validator 생성

## Phase 6: Verification and examples

- [x] T019 generic metadata fixture로 001 parsing과 세 유형 routing test 작성
- [x] T020 fixture 기반 Standard generation test 작성
- [x] T021 실제 OData service를 read-only로 조회해 `examples/` 아래 예제 application 생성
- [x] T022 생성 예제의 `npm run lint`와 `npm run build` 통과 확인
- [ ] T023 OData V2 Standard Fiori Elements runtime preview를 별도 fixture로 검증
- [ ] T024 Custom extension과 Freestyle 화면의 OPA5 interaction test 추가
- [ ] T025 인증 destination을 사용해야 하는 service의 interactive input adapter 추가

## 완료 기준

- 모든 Fiori 생성 요청은 001 runtime으로 시작한다.
- 001은 002, 003, 004 중 정확히 하나만 선택한다.
- 일반 요청에서는 새로운 `specs/<request>`가 생성되지 않는다.
- 기본 Standard 요청은 metadata가 읽히는 임의 EntitySet 이름에 대해 application output을 생성한다.
- 생성 결과는 기존 directory를 덮어쓰지 않고, service summary와 선택 protocol을 report에 남긴다.
- 필수 static validation, lint와 build를 통과한 결과만 완료로 보고한다.

## Phase 7: Convergence — Plan과 구현 구조 정렬

- [x] T026 Plan에 정의된 orchestration·common·유형별 generator source 경계를 실제 파일 구조로 분리한다 (plan: source structure, missing)
- [x] T027 유형별 application template을 `templates/standard|custom|freestyle`로 분리하고 renderer가 runtime에 연결한다 (plan: template boundary, missing)
- [x] T028 하나의 001 CLI 진입점에서 Standard·Custom·Freestyle handoff와 결과 구조를 검증하는 통합 테스트를 추가한다 (SC-005, partial)
