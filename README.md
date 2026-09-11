# BTP Solution Agent

이 저장소는 사용자가 Frontend, Backend와 배포 project를 구분하지 않고 요청할 수 있도록 고정된 SDD protocol을 재사용한다. 현재 Frontend 생성은 구현되어 있고 CAP·MTA·Cloud Foundry·Work Zone은 protocol 경계가 정의된 상태다.

```text
request → 000 solution plan → 001/100/200/300/400 → validation/report
```

## Solution planning

```powershell
npm run plan -- --request "CAP backend와 Fiori Elements 앱을 만들고 MTA로 구성해줘"
```

`plan`은 외부 시스템이나 application 파일을 변경하지 않고 scope, dependency, protocol 상태와 prerequisite를 JSON으로 출력한다. 100, 200, 300, 400은 executor가 구현되기 전까지 `DEFINED`/`NOT_IMPLEMENTED`로 보고된다.

프로젝트별 전문 Agent는 `.codex/agents/`에 있고 중앙 `specs/`의 protocol을 참조한다. Spec은 Agent directory에 복제하지 않는다.

## Frontend 생성

```powershell
npm run generate -- --request "목록과 상세를 조회하는 Fiori application" --odata-url "https://service.example.test/odata/Products"
```

기본 동작은 다음과 같다.

- 001: OData metadata를 읽고 EntitySet, key, property와 OData version을 확인한다.
- 002: 일반 목록·검색·상세 요청에 대해 Fiori Elements List Report/Object Page를 생성한다.
- 003: Custom 요청에 대해 Fiori Elements extension scaffold를 생성한다.
- 004: 복잡한 상태·단계·interaction 요청에 대해 Freestyle SAPUI5 table application을 생성한다.

기본 output은 `generated/<project-name>`이며 project name을 생략하면 EntitySet 이름을 사용한다. 기존 directory는 덮어쓰지 않는다. 인증이 필요한 service는 `--metadata-file`로 metadata를 검증하거나 사용자가 인증된 실행 환경을 제공해야 한다.

Generator source와 application output은 분리한다. `src/orchestration`은 001 handoff만 담당하고,
`src/generation/standard|custom|freestyle`은 각 generator를, `templates/standard|custom|freestyle`은
생성 application template을 담당한다. `generated/<entity-set>`은 실행 결과만 보관한다.

```powershell
npm run generate -- `
  --request "Products 목록을 조회하는 Fiori application" `
  --odata-url "https://service.example.test/odata/Products" `
  --metadata-file "tests/fixtures/sample-metadata.xml" `
  --output "generated/products"
```

## 검증

```powershell
npm test
```

생성된 application에서는 다음을 실행한다.

```powershell
npm install
npm run lint
npm run build
```

Standard·Custom Fiori Elements application은 `npm start`에서 `fiori run`과 `webapp/test/flpSandbox.html`을 사용한다. 기본 FLP intent는 `<entity-set>-display`이며, 생성 시 `--flp-intent <semantic-object-action>`으로 변경할 수 있다. FLP 없이 standalone 페이지를 실행하려면 생성 application에서 `npm run start-noflp`를 사용한다.

특정 business object와 service URL은 `examples/` 아래의 검증 예제에만 둔다.
