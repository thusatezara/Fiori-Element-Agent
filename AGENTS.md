# Fiori Application Agent 작업 지침

## 목적

이 저장소는 사용자의 자연어 요청과 OData service를 입력으로 받아 SAP Fiori Application을 생성한다. 모든 Fiori 생성은 고정된 SDD 생성 프로토콜을 실행한다.

```text
사용자 요청 → 001 분석·판정 → 002 또는 003 또는 004 handoff → 생성 → 검증 → 결과 보고
```

`001~004`는 반복해서 사용하는 생성 표준이다. 일반적인 사용자 요청마다 `specs/<request>` 또는 새로운 Feature Spec을 만들지 않는다. 요청별 정보는 runtime input, service snapshot, assessment, handoff와 generation report로만 관리한다.

## 언어

- 사용자 대화, 설명, 계획 및 프로젝트 문서는 한국어로 작성한다.
- 코드, 명령어, 파일명, 경로, API 이름, 설정 키 및 기술 식별자는 영어 원문을 유지한다.
- 기술적 정확성이 중요한 용어는 영어를 유지하고 필요한 경우 한국어 설명을 덧붙인다.

## 문서 우선순위와 고정 프로토콜

다음 순서로 생성 규칙을 읽는다.

1. `.specify/memory/constitution.md`
2. `specs/001-classify-fiori-app-request/` — 모든 요청의 분석·분류·handoff 프로토콜
3. 선택된 하위 프로토콜
   - `STANDARD` → `specs/002-generate-standard-fiori-elements-app/`
   - `CUSTOM` → `specs/003-generate-custom-fiori-elements-app/`
   - `FREESTYLE` → `specs/004-generate-freestyle-sapui5-app/`
4. 적용 가능한 `.agents/skills/*/SKILL.md`

001은 유일한 진입점이다. 002, 003, 004를 직접 선택하거나 직접 UI 파일부터 만들지 않는다. 005의 내용은 001에 통합되었으며, `specs/005-spec-driven-odata-fiori-generation/README.md`는 superseded pointer로만 취급한다.

001~004의 `spec.md`, `plan.md`, `tasks.md`, contracts는 생성기의 고정된 설계·실행 계약이다. 사용자의 입력으로 이 문서들을 덮어쓰지 않는다.

## 구현 경계

Plan의 source code 구조를 구현의 기준으로 사용한다.

```text
src/cli/                         # CLI 입력과 유형별 command adapter
src/orchestration/               # 001: service inspection, assessment, single handoff
src/generation/common/           # 공통 contract, template renderer, report, atomic output
src/generation/standard/         # 002: Standard Fiori Elements generator
src/generation/custom/           # 003: Custom Page generator
src/generation/freestyle/        # 004: Freestyle SAPUI5 generator
src/validation/                  # 생성 결과와 UI5 build validation
templates/standard/              # 002 application templates
templates/custom/                # 003 application templates
templates/freestyle/             # 004 application templates
generated/<project-name>/          # 실행 시 생성되는 application output
examples/                        # 특정 service를 사용하는 검증 예제
```

`src/orchestration`에는 하위 화면 정책이나 template을 인라인으로 넣지 않는다. 공통 기능은
`src/generation/common`, 유형별 정책과 renderer는 해당 하위 generator와 `templates/<type>`에 둔다.
Plan의 구조를 바꿔야 하면 관련 Plan과 Tasks를 먼저 갱신하고 구현·테스트·validation report를
같은 변경으로 맞춘다.

## Fiori 생성 요청 판정

다음 입력이 있으면 Fiori 생성 요청으로 처리한다.

- OData URL, service root, `$metadata`, EntitySet 또는 OData 응답
- 화면, 앱, Fiori, Fiori elements, SAPUI5, 조회, 생성, 수정, 삭제 또는 application 요청

모든 Fiori 생성 요청은 001의 `generate` 진입 흐름으로 시작한다.

```text
Mandatory routing rule: every Fiori application generation request enters protocol 001 first.
```

## 표준 실행 순서

### 1. Runtime input 정규화

- 원문 요청을 보존하되 자격 증명, token, password와 인증 header 값은 제거한다.
- OData URL, 선택 EntitySet, output intent와 화면 의도를 추출한다.
- 요청별 Feature Spec을 생성하지 않는다.

### 2. OData service inspection

- service root, OData version, EntitySet, EntityType, key, primitive property, navigation property와 확인 가능한 capability를 read-only로 확인한다.
- URL이 EntitySet을 가리키면 service root와 EntitySet을 분리한다. service root만 있으면 metadata에서 EntitySet을 확인하고, 여러 후보가 있으면 질문한다.
- metadata를 읽을 수 없거나 인증이 필요하면 추측하지 않고 원인과 필요한 입력을 보고한다.
- 사용자가 요청한 field가 metadata에 존재하는지 확인한다.
- metadata 원문 또는 business row를 불필요하게 저장하지 않는다. 필요한 service summary와 metadata hash만 generation report에 기록한다.

### 3. 001 유형 판정

- 목록·검색·필터·상세 중심은 `STANDARD`로 판정한다.
- 표준 화면을 유지하면서 제한된 공식 확장이나 고유 배치가 필요하면 `CUSTOM`으로 판정한다.
- 복잡한 client 상태, 다단계 흐름 또는 직접 interaction 제어가 핵심이면 `FREESTYLE`로 판정한다.
- 애매한 경우에만 최대 3개의 업무 질문을 한다. metadata에서 확인 가능한 사실은 다시 묻지 않는다.

### 4. 단일 handoff

- `STANDARD`는 002, `CUSTOM`은 003, `FREESTYLE`은 004로 정확히 하나만 handoff한다.
- 선택된 하위 프로토콜의 input contract, prerequisite, output boundary를 확인한다.
- 하위 generator runtime이 있으면 versioned adapter 또는 `npm run generate` runtime으로 실행한다.
- runtime이 없는 경우에는 동일한 001~004 계약을 따라 수동으로 실행하고, 동일한 validation report를 남긴다.

### 5. 생성

- 기본 실행 명령은 다음과 같다.

```powershell
npm run generate -- --request "<업무 화면 요청>" --odata-url "<OData EntitySet URL>"
```

- `--type auto`가 기본이며 001이 유형을 결정한다. 명시적 `--type`은 사용자가 유형을 지정했을 때만 사용한다.
- 기본 output은 `generated/<project-name>`이며 project name을 생략하면 EntitySet 이름을 사용한다. 기존 output directory는 덮어쓰지 않는다.
- 생성기는 backend, remote annotation, authorization, transaction, deployment와 Work Zone content를 변경하지 않는다.
- 생성된 application은 service metadata와 사용자 요청에서 확인한 정보만 사용한다.

### 6. 검증

생성 후 다음을 모두 확인한다.

- project 구조, `manifest.json`, `ui5.yaml`, 시작 화면과 routing
- OData version, service URI, EntitySet context와 표시 property
- local annotation 또는 Freestyle binding
- 선택된 002/003/004 유형과 생성 결과의 일치
- generated project validator, `npm run lint`, `npm run build`

필수 검증이 실패하면 완료로 보고하지 않는다.

## 변경 규칙

- 001~004의 생성 표준을 변경하면 해당 Feature의 `spec.md`, `plan.md`, `tasks.md`, contracts와 구현을 함께 갱신한다.
- 일반 사용자 입력이 달라졌다는 이유로 001~004 문서를 복제하거나 새 Feature Spec을 만들지 않는다.
- 새로운 생성 유형 또는 공통 생성 기능을 추가할 때만 새로운 protocol/extension을 검토한다.
- 특정 business object 이름과 service URL은 core generator와 protocol에 넣지 않는다. 특정 service 이름은 `examples/` 아래의 검증 예제에만 허용한다.

## 변경 안전성

- 작업 전에 관련 지침과 `git status`를 확인한다.
- 사용자 변경과 관련 없는 파일을 되돌리거나 정리하지 않는다.
- 파일은 workspace와 명시된 output boundary 안에서만 생성한다.
- 생성 output 충돌 시 새 경로를 사용하거나 사용자에게 선택을 요청한다.
- commit, push, 배포, 로그인, 자격 증명 사용과 외부 시스템 변경은 명시적 요청 없이는 수행하지 않는다.

## 완료 보고

완료 보고에는 다음을 포함한다.

- 001 판정 결과와 선택된 하위 protocol
- 생성 output과 주요 파일
- 원문 요청·metadata·화면 요구사항의 추적 요약
- 실행한 validation, lint, build 및 test 결과
- 검증하지 못한 항목, prerequisite와 남은 위험
