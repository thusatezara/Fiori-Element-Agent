# Quickstart: Protocol 200 문서·계약 검증

현재 protocol 상태는 `DEFINED`다. 이 guide는 문서와 JSON contract를 검증하며 MTA build, `cf` command 또는 외부 변경을 실행하지 않는다.

## Prerequisites

- repository root에서 실행
- Node.js >=20
- credential, token 또는 실제 landscape target을 fixture에 넣지 않음

## 1. 산출물 확인

```powershell
rg --files specs/200-compose-mta-solution
```

Expected: spec/plan/research/data-model/quickstart/tasks, 2개 contract와 requirements checklist가 존재한다.

## 2. JSON syntax 확인

```powershell
Get-ChildItem specs/200-compose-mta-solution/contracts/*.json | ForEach-Object { Get-Content $_.FullName -Raw | ConvertFrom-Json | Out-Null }
```

Expected: error 없이 종료한다.

## 3. requirement와 task trace 확인

```powershell
rg -n "FR-[0-9]{3}|SC-[0-9]{3}" specs/200-compose-mta-solution/spec.md
rg -n "^- \[ \] T[0-9]{3}" specs/200-compose-mta-solution/tasks.md
```

Expected: FR-001~FR-018, SC-001~SC-007과 연속 task ID가 확인된다.

## 4. 안전 경계 확인

```powershell
rg -n "DEFINED|credential|token|외부 변경|cf deploy" specs/200-compose-mta-solution
```

Expected: credential 저장 금지, `DEFINED` 동안 package/build executor 실행 금지, `cf deploy` 비책임 경계가 명시된다.

## 5. 구현 후 activation

모든 contract, collision, deterministic render, boundary, build adapter와 checksum test가 통과하기 전에는 `src/composition/mta/protocol.mjs`의 상태를 `IMPLEMENTED`로 바꾸거나 executor를 등록하지 않는다.
