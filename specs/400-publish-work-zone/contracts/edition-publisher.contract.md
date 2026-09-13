# Contract: Work Zone Edition Publisher Adapter

Protocol core는 edition별 제품 차이를 이 port 뒤에 격리한다. adapter는 자신의 confirmed edition과 다른 request를 거부해야 한다.

## 공통 원칙

- 모든 inspect/capability method는 read-only다.
- mutation method는 `PUBLISH`, exact approval, `IMPLEMENTED` protocol gate를 통과한 prepared operation만 받는다.
- adapter는 operation 목록에 없는 보조 변경을 수행하지 않는다.
- credential과 authentication session은 실행 환경에서만 사용하며 argument, result 또는 log에 직렬화하지 않는다.
- 지원되지 않는 operation은 mutation 전에 `OPERATION_UNSUPPORTED`로 반환한다.
- adapter는 current/desired state를 비교해 `NO_CHANGE`를 반환할 수 있어야 한다.
- delete, unassign, role removal, site/content provider creation은 이 contract에 없다.

## Port

```text
edition: STANDARD | ADVANCED

inspectTarget(target) -> TargetInspection
getCapabilities(target) -> OperationType[]
inspectOperation(target, preparedOperation) -> CURRENT_MATCHES | CHANGE_REQUIRED | CONFLICT
executeOperation(target, preparedOperation, executionContext) -> OperationResult
validatePublication(target, application, validationContext) -> ValidationEvidence
```

`executionContext`는 approval validation 결과와 ephemeral authenticated transport를 전달하지만 credential 값을 노출하지 않는다.

## Required behavior

| Method | Required result | Forbidden behavior |
|---|---|---|
| `inspectTarget` | edition/subaccount/site/contentTarget 존재와 접근 가능성 | resource 생성·수정 |
| `getCapabilities` | 현재 edition/target에서 지원하는 operation 집합 | capability를 이유로 operation 자동 추가 |
| `inspectOperation` | desired state 비교와 conflict evidence | conflict 자동 해결 |
| `executeOperation` | 한 operation의 `SUCCEEDED`/`NO_CHANGE`/`FAILED` | 다른 resource 종류 변경 |
| `validatePublication` | discovery, assignment, navigation, visibility 결과 | visibility 실패 시 role 자동 부여 |

## Edition binding

- `standardPublisher.edition`은 `STANDARD`다.
- `advancedPublisher.edition`은 `ADVANCED`다.
- request target과 adapter edition이 다르면 `EDITION_ADAPTER_MISMATCH`다.
- protocol core는 fallback adapter를 자동 선택하지 않는다.

## Operation ordering

requested subset 안에서 다음 dependency를 적용한다.

```text
REFRESH_CONTENT_PROVIDER ─┐
IMPORT_CONTENT ───────────┴→ ASSIGN_CONTENT_TO_SITE
UPDATE_SITE (explicit only)
CREATE_TILE | UPDATE_TILE (둘 중 승인된 것만)
ASSIGN_ROLE (explicit only)
→ validatePublication
```

서로 충돌하는 `CREATE_TILE`과 `UPDATE_TILE`을 동시에 계획하면 preflight에서 차단한다.

## Error contract

error는 최소 `code`, `message`, `retryable`, `operationType`과 credential 없는 `evidence`를 포함한다. adapter는 partial completion을 exception text에만 남기지 않고 operation result로 반환해야 한다.

## Contract test matrix

- edition match/mismatch
- 모든 operation의 supported/unsupported 분기
- read-only method mutation call 0건
- exact operation 한 건만 수행
- current state match 시 `NO_CHANGE`
- conflict 시 mutation 0건
- operation failure 후 후속 operation `NOT_RUN`
- visibility subject 없음 → `NOT_VERIFIED`, role mutation 0건
- result/log secret scan 0건
