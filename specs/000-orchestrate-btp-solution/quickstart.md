# Quickstart: BTP solution planning 검증

## Prerequisites

- Node.js 20 이상
- repository root에서 명령 실행
- 외부 SAP BTP login 불필요

## Scenario 1: 기존 OData Frontend

```powershell
npm run plan -- --request "기존 OData로 구매오더 Fiori Elements 앱을 만들어줘"
```

Expected:

- `FRONTEND` step만 존재한다.
- protocol은 `001`, 상태는 `IMPLEMENTED`다.
- 실제 application 파일이나 외부 resource를 만들지 않는다.

## Scenario 2: CAP와 Fiori 전체 생성 계획

```powershell
npm run plan -- --request "재고 관리 CAP backend와 Fiori Elements 화면을 만들고 MTA로 구성해줘"
```

Expected:

- `BACKEND → FRONTEND → PACKAGE` 순서다.
- 100과 200은 `NOT_IMPLEMENTED` readiness를 보고한다.
- 001은 구현되어 있어도 선행 BACKEND가 준비되지 않았으므로 `BLOCKED`를 보고한다.
- 결과 status는 `PARTIALLY_IMPLEMENTED`다.

## Scenario 3: CF 배포와 Work Zone 게시 계획

```powershell
npm run plan -- --request "솔루션을 Cloud Foundry에 배포하고 Work Zone에 타일을 등록해줘"
```

Expected:

- dependency를 충족하기 위한 PACKAGE, DEPLOY_CF, PUBLISH_WORK_ZONE step이 생성된다.
- CF target과 Work Zone target이 없으므로 외부 변경 step은 `NEEDS_INPUT`이다.
- 어떤 `cf` 또는 Work Zone command도 실행하지 않는다.

## Regression

```powershell
npm test
```

신규 planning test와 기존 001~004 generation test가 모두 통과해야 한다.
