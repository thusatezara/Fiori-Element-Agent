# Research: Protocol 300 Cloud Foundry 배포

## Decision 1: target identity는 API + org + space + stage

**Decision**: canonical HTTPS API endpoint, org, space, explicit stage 전체로 target fingerprint를 만들고 active target과 일치시킨다.

**Rationale**: 같은 org/space 이름이 다른 API endpoint에 존재할 수 있고 `PROD` 통제는 이름 추론이 아닌 명시적 stage가 필요하다.

**Alternatives considered**: org/space만 비교하거나 space 이름에서 stage를 추론하는 방식은 잘못된 landscape 변경 위험으로 제외했다.

## Decision 2: read-only preflight와 external-change approval 분리

**Decision**: artifact/session/target/plugin/role/entitlement/quota inspection snapshot을 먼저 만들고, 사용자는 그 fingerprint에 결속된 deploy approval을 제공한다.

**Rationale**: 사용자가 실제 변경 대상과 prerequisite evidence를 확인한 뒤 통제권을 행사할 수 있다.

**Alternatives considered**: 요청 문장의 “배포” 표현만으로 승인하는 방식과 로그인 session 존재만으로 target 확인을 생략하는 방식은 제외했다.

## Decision 3: PROD는 별도 approval

**Decision**: `stage=PROD`에는 일반 deploy approval과 별개인 production approval evidence를 요구한다.

**Rationale**: production 영향과 recovery 비용이 커서 별도 명시적 의도가 필요하다.

**Alternatives considered**: 모든 stage에 같은 approval을 쓰거나 이름 패턴으로 production을 추론하는 방식은 통제 수준과 정확성이 부족하다.

## Decision 4: idempotency와 `UNKNOWN`을 명시

**Decision**: 같은 idempotency key의 성공 operation은 재실행하지 않고 timeout/관찰 불가는 `UNKNOWN`으로 보존한다. 실패/unknown 자동 retry는 금지한다.

**Rationale**: network timeout 뒤 operation이 계속될 수 있어 무조건 재실행하면 중복 또는 충돌이 발생한다.

**Alternatives considered**: non-zero/timeout을 즉시 실패로 확정하거나 자동 retry하는 방식은 실제 platform state와 어긋날 수 있다.

## Decision 5: process adapter는 shell 없이 격리

**Decision**: allowlisted executable과 argument array만 사용하고 stdout/stderr를 credential-aware redaction 후 report에 반영한다.

**Rationale**: injection과 secret leakage를 줄이고 fake adapter로 외부 변경 0건 safety test를 가능하게 한다.

**Alternatives considered**: shell command string 및 raw CLI output 저장은 injection/leakage 위험으로 제외했다.

## Decision 6: `DEFINED` lifecycle은 최우선 gate

**Decision**: registry 상태가 `DEFINED`면 target inspection을 포함한 실제 CF process를 시작하지 않고 `NOT_IMPLEMENTED`를 반환한다.

**Rationale**: 부분 구현이나 문서만 완성된 protocol이 외부 변경을 일으키지 않도록 한다.

**Alternatives considered**: read-only CF command만 먼저 허용하면 lifecycle contract가 모호해지므로 executor 구현·검증 후 함께 활성화한다.
