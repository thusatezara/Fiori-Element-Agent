# 도서 및 상품 통합 조회

Bookshop의 OData V4 `Books`와 Northwind의 OData V2 `Products`를 하나의 responsive SAPUI5 화면에서 동시에 조회합니다. 목록과 상세 화면은 Standard 화면과 일관된 `sap.f.DynamicPage`·Title·Header·Content shell을 사용합니다. 첫 화면은 자동 요청하지 않으며, 검색 조건 확인 후 **두 목록 조회**를 선택해야 두 binding이 활성화됩니다. 각 행을 선택하면 hash route 기반 상세 화면으로 이동합니다.

## 실행

```powershell
npm install
npm start
```

로컬 개발 server의 `fiori-tools-proxy`가 다음 경로를 연결합니다.

- `/admin/` → Bookshop Cloud Foundry service
- `/northwind/` → public Northwind service

화면은 Cloud Foundry `html5-apps-repo/app-host` 인스턴스 `dual-odata-catalog-repo-host`에 HTML5 Application으로 업로드됩니다. HTML5 Repository 자체에는 CF route가 생성되지 않으므로 브라우저 진입점은 SAP Build Work Zone 또는 managed/standalone App Router 구독이 제공해야 합니다. Bookshop CAP service는 XSUAA 보호 상태이므로 `/admin/` 요청에는 유효한 `Authorization: Bearer <token>`이 필요합니다.

## 검증

```powershell
npm run lint
npm test
npm run build
```

## Cloud Foundry packaging

HTML5 Repository 배포 descriptor와 archive는 `deployment-html5/` 아래에 있습니다. `xs-app.json`은 `/admin/`을 CAP destination으로, `/northwind/`를 public destination으로 라우팅하고, `sap.cloud.service`는 Work Zone tile discovery에 사용할 `dual.odata.catalog`으로 설정됩니다. Protocol 300은 exact target preflight와 snapshot-bound approval 후에만 배포합니다.

현재 project는 읽기 전용 조회와 상세 navigation만 포함하며 생성·수정·삭제 기능은 포함하지 않습니다.
