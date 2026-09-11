# BTP Solution Agent 작업 지침

## 목적

이 저장소는 사용자가 Frontend, Backend 또는 배포 project를 구분하지 않고 자연어로 요청하면 SAP BTP solution을 계획하고, 구현·검증된 고정 SDD protocol만 실행한다.

```text
사용자 요청 → 000 SolutionPlan → domain protocol handoff → 실행 → 검증 → 결과 보고
```

일반 요청마다 Feature Spec을 만들지 않는다. 요청별 정보는 runtime request, snapshot, plan, handoff와 report로 관리한다.

## 언어

- 사용자 대화와 프로젝트 문서는 한국어로 작성한다.
- 코드, 명령어, 파일명, 경로, API와 설정 키는 영어 원문을 유지한다.
- 기술적 정확성이 필요한 용어는 영어를 유지하고 필요할 때 한국어로 설명한다.

## 문서 선택

1. 모든 작업에서 `.specify/memory/constitution.md`를 먼저 읽는다.
2. 자연어 solution 요청은 `specs/000-orchestrate-btp-solution/spec.md`에서 scope, dependency와 handoff 규칙을 읽는다.
3. 판정된 scope에 해당하는 중앙 Spec만 추가로 읽는다.
   - Frontend: `specs/001-classify-fiori-app-request/`
   - CAP Backend: `specs/100-generate-cap-application/`
   - MTA composition: `specs/200-compose-mta-solution/`
   - Cloud Foundry deployment: `specs/300-deploy-cloud-foundry/`
   - Work Zone publication: `specs/400-publish-work-zone/`
4. Frontend는 001이 선택한 protocol 하나만 읽는다.
   - `STANDARD`: `specs/002-generate-standard-fiori-elements-app/`
   - `CUSTOM`: `specs/003-generate-custom-fiori-elements-app/`
   - `FREESTYLE`: `specs/004-generate-freestyle-sapui5-app/`
5. 구현을 변경할 때만 해당 protocol의 `plan.md`, `tasks.md`, contracts와 적용 가능한 `.agents/skills/*/SKILL.md`를 읽는다.

자연어 solution의 기본 진입점은 000이다. Frontend scope는 반드시 001을 통과하며 002, 003, 004를 직접 선택하지 않는다. 기존 `npm run generate`는 Frontend 호환을 위해 001로 직접 연결되는 명시적 예외다.

## Routing과 실행

1. credential-like 값이 포함된 요청과 target은 저장하거나 정규화하지 않고 거부한다.
2. 000에서 요청을 `FRONTEND`, `BACKEND`, `PACKAGE`, `DEPLOY_CF`, `PUBLISH_WORK_ZONE` scope로 분류한다.
3. `src/orchestration/protocol-registry.mjs`의 versioned descriptor만 routing 원본으로 사용한다.
4. dependency, protocol 상태, approval, target과 blocking reason을 포함한 `SolutionPlan`을 생성한다.
5. 유효한 `ProtocolHandoff`와 완료된 dependency가 있고 상태가 `IMPLEMENTED`인 executor만 실행한다.
6. `DEFINED`, prerequisite 미충족 또는 contract 불일치 step은 실행하지 않고 구조화된 차단 결과를 반환한다.
7. Cloud Foundry와 Work Zone 변경은 사용자가 대상까지 명시적으로 요청한 경우에만 해당 executor에서 수행한다.

## 구현 경계

- `src/orchestration`은 scope 판정, registry, plan, handoff와 실행 gate만 담당한다.
- Frontend, CAP, MTA, Cloud Foundry와 Work Zone 정책은 각각의 domain source와 중앙 Spec이 담당한다.
- 공통 생성 기능은 `src/generation/common`, 유형별 renderer와 template은 해당 generator와 `templates/<type>`에 둔다.
- domain 정책과 template을 orchestration에 인라인으로 넣지 않는다.
- 정확한 source 구조는 해당 Feature의 Plan을 기준으로 한다.

## 변경 규칙

- protocol 동작을 변경하면 해당 `spec.md`, `plan.md`, `tasks.md`, contracts, 구현과 test를 같은 변경으로 맞춘다.
- `DEFINED` protocol의 executor는 해당 protocol의 Plan, Tasks, contract와 validation을 먼저 완성한 뒤 등록한다.
- 전문 Agent는 중앙 `specs/`를 참조하며 Agent별 Spec 복사본을 만들지 않는다.
- 새로운 생성 유형이나 공통 capability를 추가할 때만 새 protocol 또는 extension을 만든다.
- business object와 service URL은 core protocol에 넣지 않고 `examples/`의 검증 예제에만 둔다.

## 변경 안전성

- 작업 전 관련 지침과 `git status`를 확인하고 사용자 변경을 보존한다.
- output은 workspace의 명시된 boundary에 생성하고 기존 경로와 충돌하면 덮어쓰지 않는다.
- commit, push, 로그인, 배포와 외부 시스템 변경은 사용자가 명시적으로 요청한 범위에서만 수행한다.

## 완료 기준과 보고

필수 validation이 실패한 작업은 완료로 보고하지 않는다. 완료 보고에는 다음을 포함한다.

- 000의 scope 판정과 선택된 domain protocol
- 단계별 dependency, 실행 상태와 차단 사유
- 생성 또는 변경된 output과 주요 파일
- 실행한 validation, lint, build와 test 결과
- 검증하지 못한 prerequisite와 남은 위험
- Frontend가 포함된 경우 001 판정과 선택된 002, 003 또는 004
