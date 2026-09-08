# Bookshop Books

`AdminService/Books`를 조회하는 SAP Fiori elements `List Report` 애플리케이션입니다.

## 확인된 서비스 계약

- OData version: `4.0`
- Service root: `https://cc779debtrial-dev-bookshop-srv.cfapps.us10-001.hana.ondemand.com/admin/`
- Entity set: `Books`
- Key: `ID`
- 목록 필드: `ID`, `title`, `author_ID`, `genre_ID`, `stock`, `price`, `currency_code`

화면 표현은 backend annotation을 수정하지 않고 `webapp/annotations/annotation.xml`의 local annotation으로 정의했습니다.

## 실행

```powershell
npm install
npm start
```

현재 프로젝트는 standalone preview로 실행하므로 브라우저에서 `http://localhost:8080/index.html`을 엽니다. `/sap/bc/ui2/flp;sap-metrics-only`는 실제 SAP Fiori Launchpad backend 경로이며 이 로컬 UI5 서버에는 존재하지 않아 `404`가 발생합니다.

`fiori-tools-proxy`가 `/admin` 요청을 원격 service로 전달합니다. standalone preview에서 Fiori Elements가 optional flexibility 확인 요청(`/sap/bc/lrep/flex/data/...`)을 시도할 수 있지만, 해당 backend가 없으면 `404`를 기록한 뒤 화면 startup을 계속합니다. 원격 service의 인증 또는 CORS 정책이 변경되면 별도 destination 또는 인증 설정이 필요합니다.

## 검증

```powershell
npm run build
npm run lint
```
