# Core CLI Contract

## 명령

| Command | 입력 | 성공 결과 | 주요 실패 |
|---|---|---|---|
| `assess` | `--request <json>` | assessment와 approval summary | invalid input/URL/metadata, auth block |
| `approve` | `--run-id`, `--digest` | 승인 상태 | digest mismatch, unknown run |
| `generate` | `--run-id` | staging project | not approved, target conflict, generator failure |
| `verify` | `--run-id` | validation report와 `.mtar` | static/build failure |
| `resume` | `--run-id` | 안전한 다음 단계 결과 | digest mismatch, non-resumable state |

모든 명령은 `--json`을 지원한다. Core CLI는 prompt를 표시하지 않으며 Agent process나 Spec Kit를 직접 실행하지 않는다.

## stdout envelope

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

- stdout에는 envelope 하나만 출력한다.
- 진단은 stderr에 쓰고 URL query, fragment, credential 가능 문자열을 제거한다.
- 예상 가능한 domain failure도 schema-valid envelope로 반환하고 process exit code는 non-zero다.

## 안전 계약

- metadata 요청에 credential과 custom authorization header를 받지 않는다.
- child process는 executable allowlist와 argument array로 실행하며 shell을 사용하지 않는다.
- 비어 있지 않은 output path를 덮어쓰지 않는다.
- 승인 digest가 현재 canonical summary와 다르면 생성하지 않는다.
- `cf login`과 `cf deploy`를 호출하지 않는다.

## 멱등성과 재개

- 동일 `runId`와 동일 request digest의 재조회는 기존 artifact를 반환한다.
- 완료된 단계를 중복 실행해 파일을 다시 쓰지 않는다.
- handoff identity는 source run, kind, 정렬된 requirement IDs에서 결정하여 중복 생성을 막는다.
- failed/block 상태의 재개 가능 여부와 다음 단계는 `run-state.schema.json`에 맞게 기록한다.
