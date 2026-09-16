# Protocol 300 fixture 경계

모든 target은 `example.test`를 사용하고 credential을 포함하지 않는다. `tests/helpers/fake-cf-adapter.mjs`와 deployment test가 다음 matrix를 메모리에서 생성한다.

- preflight: target match/mismatch, session, CLI/plugin/role
- approval: missing, stale, mismatch, DEV 및 PROD approval
- result: success, failure, timeout, unhealthy 및 route 없음
- safety: 실제 `cf` process 0건, 자동 retry/rollback 0건

