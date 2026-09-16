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

## 검증

```powershell
npm run lint
npm test
npm run build
```

## Cloud Foundry packaging

Protocol 200은 원본 source를 변경하지 않고 `deployment/` 아래에 target-neutral `mta.yaml`, 정적 Node.js host와 checksummed `.mtar`를 생성합니다. 배포 모듈의 allowlisted reverse proxy가 `/admin/`과 `/northwind/`의 읽기 요청을 연결합니다. Protocol 300은 exact target preflight와 snapshot-bound approval 후에만 배포합니다.

현재 project는 읽기 전용 조회와 상세 navigation만 포함하며 생성·수정·삭제 기능은 포함하지 않습니다.
