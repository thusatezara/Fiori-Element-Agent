# Executor Contract: Protocol 100 CAP Backend 생성

## Entry

Protocol 100 executor는 000의 `workflow-executor`가 전달한 specialized `ProtocolHandoff 1.0`만 받는다. 독립 자연어 entry 또는 protocol 100 직접 호출은 지원하지 않는다.

```text
000 SolutionPlan
  → BACKEND step readiness 확인
  → ProtocolHandoff 1.0 생성
  → protocol 100 request validation
  → local generation/validation
  → CAPGenerationResult 1.0
```

## Preconditions

- `handoffVersion=1.0`
- `protocol.id=100`, `protocol.version`은 registry descriptor와 동일
- handoff의 `stepId`와 BACKEND `SolutionStep`이 동일
- `completedDependencies`는 실제 step dependency의 완료 ID만 포함
- `target=null`; protocol 100은 landscape target을 소비하지 않음
- request가 [cap-generation-request.schema.json](./cap-generation-request.schema.json)을 만족
- credential detector가 전체 handoff에서 credential-like content를 찾지 않음
- output parent가 workspace boundary 안이고 final project path가 존재하지 않음
- protocol descriptor가 `IMPLEMENTED`이고 executor가 등록된 경우에만 실행. `DEFINED`에서는 항상 `NOT_IMPLEMENTED`로 차단

## Invocation

향후 local CLI adapter는 fixture와 수동 검증을 위해 다음 contract를 제공한다. CLI도 handoff를 새로 만들지 않고 000이 생성한 JSON만 읽는다.

```text
npm run generate:backend -- --handoff <protocol-handoff.json>
```

- `--handoff` 외에 secret, target 또는 arbitrary template option을 받지 않는다.
- output intent는 handoff의 `inputs.project`에만 존재한다.
- stdout은 credential 없는 summary만 출력하며 machine-readable result는 generation report에 기록한다.

## Result and exit codes

| Result status | Exit code | Final project | Service snapshot |
|---|---:|---|---|
| `VALIDATED` | `0` | 새 directory 1개 | 1개 이상 |
| `BLOCKED` | `2` | 없음 | 없음 |
| `FAILED` | `1` | 없음 | 없음 |
| `GENERATED` | 반환 금지 | staging only | completed capability 아님 |

Result는 [cap-generation-result.schema.json](./cap-generation-result.schema.json)을 만족해야 한다.

## Required generated surface

```text
<project>/
├── package.json
├── README.md
├── db/
│   └── schema.cds
├── srv/
│   ├── service.cds
│   └── service.js          # custom behavior가 있을 때만
├── test/
│   └── service.test.js
└── gen/contract/
    ├── metadata.xml
    └── service-snapshot.json
```

`app/` UI source, `mta.yaml`, service binding, `.env`, credential file과 production data는 생성 surface가 아니다.

## Required validation checks

다음 check는 result의 `checks`에 각각 한 번 존재하고 모두 `PASS`여야 `VALIDATED`다.

1. `HANDOFF_SCHEMA`
2. `DOMAIN_SEMANTICS`
3. `OUTPUT_BOUNDARY`
4. `CREDENTIAL_SCAN`
5. `CDS_COMPILE`
6. `CONTRACT_TEST`
7. `HANDLER_TEST`
8. `LOCAL_START`
9. `SNAPSHOT_CONSISTENCY`

custom handler가 없더라도 `HANDLER_TEST`는 handler 부재가 계획과 일치하는지 확인하고 `PASS`해야 한다. 필수 check를 `SKIPPED`로 두고 완료할 수 없다.

## Failure safety

- validation 전에는 final path를 만들지 않는다.
- staging 실패 시 final path는 없으며 cleanup 실패도 risk로 보고한다.
- existing output을 merge, overwrite 또는 delete하지 않는다.
- error message에는 handoff 원문이나 의심 값 전체를 echo하지 않는다.
- HANA, XSUAA/IAS, Cloud Foundry와 remote service 검증은 이 contract의 성공 조건이 아니며 미검증 production prerequisite로 report한다.
