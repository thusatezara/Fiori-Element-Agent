# Protocol 400: SAP Build Work Zone 게시

**Status**: Defined
**Runtime**: Not implemented
**Entry**: 000의 승인된 `PUBLISH_WORK_ZONE` handoff
**Risk**: External change

## 책임

Cloud Foundry와 HTML5 application repository에 배포된 application을 지정된 SAP Build Work Zone content provider와 site에 노출하고 tile navigation과 사용자 접근 조건을 검증한다.

## Input Contract

- 300의 성공한 deployment result와 deployed application identity
- Work Zone edition, subaccount, site와 content target
- `sap.app/id`, `sap.cloud/service`, semantic object와 action
- 명시적인 publish intent와 승인 evidence

## Output Contract

- content provider refresh/import 결과
- site content assignment와 tile identity summary
- navigation, role/content assignment와 visibility validation report

## Blocking Rules

- `STANDARD` 또는 `ADVANCED` edition이 확인되지 않으면 실행하지 않는다.
- subaccount, site, content target 또는 관리자 권한을 확인할 수 없으면 실행하지 않는다.
- credential과 token을 artifact에 저장하지 않는다.

## Validation Boundary

- deployed app와 Work Zone subaccount 관계, manifest business service/navigation intent
- content provider 반영, site assignment와 tile navigation
- business user role collection 부여는 명시된 범위에만 포함한다.

## 후속 작업

별도 Plan과 Tasks에서 edition별 publisher, content provider adapter와 visibility validator를 구현하기 전까지 protocol registry의 상태는 `DEFINED`다.
