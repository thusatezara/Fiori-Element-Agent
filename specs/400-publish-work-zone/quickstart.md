# Quickstart: SAP Build Work Zone 게시 검증

## 현재 상태

Protocol 400은 `DEFINED`이며 executor가 없다. 이 문서와 현재 quickstart를 실행해도 실제 content provider, site, role 또는 tile은 변경되지 않는다.

## Prerequisites

- Node.js 20 이상
- repository root에서 명령 실행
- current-state scenario에는 SAP BTP login 불필요
- future sandbox scenario는 성공한 Protocol 300 result, confirmed edition/subaccount/site/content target, 필요한 administrator permission과 사용자의 별도 publish 승인이 필요
- credential은 fixture, command argument, report에 넣지 않는다.

## Scenario 1: 완전한 target도 현재는 실행 차단

```powershell
npm run plan -- --request "Cloud Foundry 배포 결과를 STANDARD Work Zone site에 게시해줘" --cf-api "https://api.cf.example.test" --cf-org "demo-org" --cf-space "dev" --stage "DEV" --work-zone-edition "STANDARD" --work-zone-subaccount "demo-subaccount" --work-zone-site "main-site" --work-zone-content-target "business-apps"
```

Expected:

- `PUBLISH_WORK_ZONE` step은 protocol `400`과 `NOT_IMPLEMENTED` readiness를 보고한다.
- complete target이 있어도 registry status가 `DEFINED`이므로 외부 mutation은 0건이다.
- plan output에 credential-like 값이 없다.

## Scenario 2: target 누락 차단

```powershell
npm run plan -- --request "배포된 앱을 Work Zone에 게시해줘"
```

Expected:

- `edition`, `subaccount`, `site`, `contentTarget` 누락이 `NEEDS_INPUT` 원인으로 나타난다.
- edition을 자동 선택하지 않는다.
- Work Zone login 또는 mutation을 시도하지 않는다.

## Implementation 후 local validation

아래 명령은 `tasks.md` 구현이 완료된 뒤 사용한다.

```powershell
node --test tests/work-zone-publication-contract.test.mjs
node --test tests/work-zone-publication.test.mjs
node --test tests/work-zone-publisher-adapter.test.mjs
npm test
```

Expected:

- request/result fixture가 JSON Schema를 만족한다.
- 실패한 300 result, subaccount mismatch, missing `sap.cloud.service`, 잘못된 navigation과 approval mismatch가 mutation 0건으로 차단된다.
- `STANDARD`/`ADVANCED` fake adapter가 edition과 일치할 때만 선택된다.
- `PREVIEW`는 항상 mutation 0건이고 `READY_FOR_APPROVAL` 또는 stable blocking result를 반환한다.
- 승인 밖 content provider/site/role/tile operation 호출은 0건이다.
- 재시도에서 이미 충족된 desired state는 `NO_CHANGE`다.
- 전체 regression test가 통과한다.

## Approved sandbox validation (registry 전환 전 필수)

이 단계는 local quickstart의 일부로 자동 실행하지 않는다. 사용자가 edition, subaccount, site, content target, operation과 test subject를 명시적으로 승인한 별도 실행에서만 수행한다.

1. 성공한 300 result와 manifest digest가 같은 application을 지칭하는지 확인한다.
2. `PREVIEW` request로 target, capability, `sap.cloud.service`와 selected inbound를 검증한다.
3. preview result의 target/operation fingerprint에 대한 publish approval을 받는다.
4. 승인된 operation subset만 sandbox adapter로 실행한다.
5. content discovery, site assignment, canonical navigation과 승인된 test subject visibility를 검증한다.
6. report의 secret scan, operation evidence와 retry/no-change 결과를 보존한다.

Expected:

- 승인 목록에 없는 mutation은 0건이다.
- 결과는 `work-zone-publication-result.schema.json`을 만족한다.
- 실패 시 destructive rollback 없이 완료·실패·미실행 operation과 recovery guidance를 제공한다.
- `STANDARD`와 `ADVANCED` 각각 필요한 adapter evidence가 모두 승인되기 전에는 registry를 `IMPLEMENTED`로 전환하지 않는다.

## Contract references

- [Request Schema](./contracts/work-zone-publication-request.schema.json)
- [Result Schema](./contracts/work-zone-publication-result.schema.json)
- [Edition Publisher Contract](./contracts/edition-publisher.contract.md)
- [Data Model](./data-model.md)
