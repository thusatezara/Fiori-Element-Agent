# Core CLI Contract

## 명령

| Command | 입력 | 성공 결과 | 주요 실패 |
|---|---|---|---|
| `assess` | `--request <json>` | assessment와 approval summary | invalid input/URL/metadata, auth block |
| `approve` | `--run-id`, `--digest` | 승인 상태 | digest mismatch, unknown run |
| `generate` | `--run-id` | staging project | not approved, target conflict, generator failure |
| `verify` | `--run-id` | validation report, `.mtar`, finalized project | static/build/finalize failure |
| `resume` | `--run-id` | 안전한 다음 단계 결과 | digest mismatch, non-resumable state |

모든 명령은 `--json`을 지원한다. Core CLI는 prompt를 표시하지 않으며 Agent process나 Spec Kit를 직접 실행하지 않는다.

## stdout envelope

모든 명령의 stdout은 [cli-envelope.schema.json](./cli-envelope.schema.json)을 만족해야 한다.

```json
{
  "schemaVersion": "1.0.0",
  "command": "assess",
  "ok": true,
  "runId": "00000000-0000-4000-8000-000000000000",
  "state": "AWAITING_APPROVAL",
  "data": {},
  "errors": []
}
```

- stdout에는 envelope 하나만 출력한다. 초기 입력 validation으로 run을 식별할 수 없으면 `runId`와 `state`는 `null`이다.
- 진단은 stderr에 쓰고 URL query, fragment, credential 가능 문자열을 제거한다.
- 예상 가능한 domain failure도 schema-valid envelope로 반환하고 process exit code는 non-zero다.

`ok`가 `true`이면 `errors`는 비어 있어야 하고, `ok`가 `false`이면 `errors`에 하나 이상의 구조화된 오류가 있어야 한다.

## 검증과 finalize

- `verify`는 정적 구조, UI build, `mbt build`, `.mtar` 및 필수 요구사항 상태를 검증한다.
- 모든 필수 검증이 통과한 경우에만 `verify` workflow의 마지막 단계에서 staging 프로젝트를 대상 경로로 원자적으로 finalize하고 run을 `FINALIZED`로 전이한다.
- 검증 또는 finalize가 실패하면 성공으로 보고하지 않으며 최종 대상 경로는 변경하지 않는다. 진단을 위한 staging과 run artifact는 보존한다.
- 별도의 `finalize` CLI 명령은 제공하지 않는다.

## 안전 계약

- metadata 요청에 credential과 custom authorization header를 받지 않는다.
- child process는 executable allowlist와 argument array로 실행하며 shell을 사용하지 않는다.
- 비어 있지 않은 output path를 덮어쓰지 않는다.
- 저장된 `approvalDigest`가 현재 canonical approval summary에서 다시 계산한 값과 다르면 생성하지 않는다.
- `cf login`과 `cf deploy`를 호출하지 않는다.

## 멱등성과 재개

- 동일 `runId`와 동일 request digest의 재조회는 기존 artifact를 반환한다.
- 완료된 단계를 중복 실행해 파일을 다시 쓰지 않는다.
- handoff identity는 source run, kind, 정렬된 requirement IDs에서 결정하여 중복 생성을 막는다.
- failed/block 상태의 재개 가능 여부와 다음 단계는 `run-state.schema.json`에 맞게 기록한다.
