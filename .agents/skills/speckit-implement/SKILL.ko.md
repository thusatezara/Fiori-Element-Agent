---
name: "speckit-implement"
description: "tasks.md에 정의된 모든 작업을 처리하고 실행하여 구현 계획을 실행합니다."
compatibility: ".specify/ 디렉토리가 있는 Spec Kit 프로젝트 구조가 필요합니다."
metadata:
  author: "github-spec-kit"
  source: "templates/commands/implement.md"
---


## 사용자 입력

```text
$ARGUMENTS
```

진행하기 전에 **반드시** 사용자 입력을 고려해야 합니다(비어 있지 않은 경우).

## 실행 전 검사

**확장 후크 확인(구현 전)**:
- 프로젝트 루트에 `.specify/extensions.yml`가 존재하는지 확인하세요.
- 존재하는 경우 이를 읽고 `hooks.before_implement` 키 아래 항목을 찾습니다.
- YAML을 파싱할 수 없거나 유효하지 않은 경우 후크 검사를 자동으로 건너뛰고 정상적으로 계속 진행합니다.
- `enabled`가 명시적으로 `false`인 후크를 필터링합니다. `enabled` 필드가 없는 후크는 기본적으로 활성화된 것으로 처리합니다.
- 나머지 각 후크에 대해 후크 `condition` 표현식을 해석하거나 평가하려고 **하지 마세요**.
- 후크에 `condition` 필드가 없거나 null/empty인 경우 후크를 실행 가능한 것으로 처리합니다.
- 후크가 비어 있지 않은 `condition`를 정의하는 경우 후크를 건너뛰고 조건 평가를 HookExecutor 구현에 맡깁니다.
- 후크 명령 이름으로 명령 호출을 구성할 때 점(`.`)을 하이픈(`-`)으로 바꾸십시오. 예를 들어 `speckit.git.commit` → `$speckit-git-commit`입니다.
- 각 실행 가능한 후크에 대해 `optional` 플래그를 기반으로 다음을 출력합니다.
- **후크 옵션**(`optional: true`):
    ```
## 확장 후크

**옵션 프리훅**: {extension}
명령: `/{command}`
설명: {description}

프롬프트: {prompt}
실행하려면: `/{command}`
    ```
- **필수 후크** (`optional: false`):
    ```
## 확장 후크

**자동 프리훅**: {extension}
실행 중: `/{command}`
EXECUTE_COMMAND: {command}

개요로 진행하기 전에 후크 명령의 결과를 기다리십시오.
    ```
위의 블록을 출력한 후에는 실제로 후크를 호출하고 계속하기 전에 완료될 때까지 기다려야 합니다. 이 에이전트/세션에서 직접 명령을 실행하는 것과 동일한 방식으로 실행합니다(호출은 위에 표시된 리터럴 `{command}` ID와 다를 수 있습니다. 예를 들어 기술 모드 에이전트는 이를 `/skill:speckit-...` 또는 `$speckit-...`로 실행합니다). 블록을 출력하는 것만으로는 후크가 실행되지 않습니다.
- 등록된 Hook이 없거나 `.specify/extensions.yml`가 존재하지 않는 경우 자동으로 건너뜁니다.

## 개요

1. repo 루트에서 `.specify/scripts/powershell/check-prerequisites.ps1 -Json -RequireTasks -IncludeTasks`를 실행하고 FEATURE_DIR 및 AVAILABLE_DOCS 목록을 구문 분석합니다. 모든 경로는 절대 경로여야 합니다. "I'm Groot"와 같이 인수에 작은따옴표를 사용하려면 이스케이프 구문을 사용하세요. 예: 'I'\''m Groot'(또는 가능하면 큰따옴표: "I'm Groot").

2. **체크리스트 상태 확인**(FEATURE_DIR/checklists/가 있는 경우):
- 체크리스트 마커를 읽기 전용 게이트로 처리합니다. 체크박스 상태를 스캔하고 상태를 보고하고 필요할 때 진행하기 전에 묻습니다. 체크리스트 파일이나 마커를 수정하지 마십시오
- `checklists/requirements.md`는 `$speckit-specify` 및 `$speckit-clarify`에서 유지 관리하는 내장 사양 품질 체크리스트입니다. `$speckit-checklist`에 의해 생성된 사용자 정의 체크리스트는 검토자가 소유한 요구 사항 품질 검토 아티팩트입니다.
- 맞춤형 체크리스트의 경우 `[x]`는 검토자가 요구사항 품질 기준이 충족되었다고 결정했음을 의미합니다. 구현 작업이 완료되었다는 의미는 아닙니다.
- checklists/ 디렉터리의 모든 체크리스트 파일을 스캔합니다.
- 각 체크리스트에 대해 다음을 계산합니다.
- 전체 항목: `- [ ]` 또는 `- [X]` 또는 `- [x]`와 일치하는 모든 라인
- 확인항목 : `- [X]` 또는 `- [x]`와 일치하는 라인
- 체크되지 않은 항목: `- [ ]`와 일치하는 라인
- 상태 테이블 생성:

     ```text
| 체크리스트 | 총계 | 선택됨 | 선택 취소됨 | 상태 |
     |-----------|-------|---------|-----------|--------|
| ux.md | 12 | 12 | 0 | ✓ 통과 |
| test.md | 8 | 5 | 3 | ✗ 실패 |
| security.md | 6 | 6 | 0 | ✓ 통과 |
     ```

- 전반적인 상태 계산:
- **PASS**: 모든 체크리스트에 체크되지 않은 항목이 0개 있습니다.
- **실패**: 하나 이상의 체크리스트에 선택되지 않은 항목이 있습니다.

- **체크리스트에 체크되지 않은 항목이 있는 경우**:
- 체크되지 않은 항목 개수를 테이블로 표시
- **중지**하고 다음과 같이 질문합니다. "일부 체크리스트에 선택되지 않은 항목이 있습니다. 그래도 구현을 계속하시겠습니까? (yes/no)"
- 계속하기 전에 사용자 응답을 기다립니다.
- 사용자가 "아니요", "대기" 또는 "중지"라고 말하면 실행이 중지됩니다.
- 사용자가 "예", "계속" 또는 "계속"이라고 대답하면 3단계로 진행합니다.

- **모든 체크리스트를 확인한 경우**:
- 통과한 모든 체크리스트를 보여주는 테이블을 표시합니다.
- 자동으로 3단계로 진행

3. 구현 컨텍스트를 로드하고 분석합니다.
- **필수**: 전체 작업 목록 및 실행 계획을 보려면 tasks.md를 읽어보세요.
- **필수**: 기술 스택, 아키텍처 및 파일 구조에 대해서는 plan.md를 읽어보세요.
- **존재하는 경우**: 엔터티 및 관계에 대해 data-model.md를 읽습니다.
- **존재하는 경우**: API 사양 및 테스트 요구 사항은 contracts/를 참조하세요.
- **존재하는 경우**: 기술적 결정 및 제약 사항은 research.md를 참조하세요.
- **존재하는 경우**: 거버넌스 제약에 대해서는 .specify/memory/constitution.md를 읽어보세요.
- **존재하는 경우**: 통합 시나리오는 quickstart.md를 참조하세요.

4. **프로젝트 설정 확인**:
- **필수**: Create/verify는 실제 프로젝트 설정을 기반으로 파일을 무시합니다.

**탐지 및 생성 로직**:
- 저장소가 git repo인지 확인하려면 다음 명령이 성공하는지 확인하세요(그렇다면 create/verify .gitignore).

     ```sh
     git rev-parse --git-dir 2>/dev/null
     ```

- Dockerfile*이 있는지 확인하거나 plan.md → create/verify .dockerignore에 Docker가 있는지 확인하세요.
- .eslintrc*가 존재하는지 확인 → create/verify .eslintignore
- eslint.config.*가 있는지 확인 → 구성의 `ignores` 항목이 필수 패턴을 포함하는지 확인
- .prettierrc*가 존재하는지 확인 → create/verify .prettierignore
- .npmrc 또는 package.json가 존재하는지 확인 → create/verify .npmignore(게시하는 경우)
- Terraform 파일(*.tf)이 존재하는지 확인 → create/verify .terraformignore
- .helmignore가 필요한지 확인하십시오(헬름 차트가 있음) → create/verify .helmignore

**무시 파일이 이미 존재하는 경우**: 필수 패턴이 포함되어 있는지 확인하고 누락된 중요한 패턴만 추가하세요.
**파일 누락을 무시하는 경우**: 감지된 기술에 대한 전체 패턴 세트로 생성

**기술별 공통 패턴**(plan.md 기술 스택에서):
- **Node.js/JavaScript/TypeScript**: `node_modules/`, `dist/`, `build/`, `*.log`, `.env*`
- **파이썬**: `__pycache__/`, `*.pyc`, `.venv/`, `venv/`, `dist/`, `*.egg-info/`
- **자바**: `target/`, `*.class`, `*.jar`, `.gradle/`, `build/`
- **C#/.NET**: `bin/`, `obj/`, `*.user`, `*.suo`, `packages/`
- **이동**: `*.exe`, `*.test`, `vendor/`, `*.out`
- **루비**: `.bundle/`, `log/`, `tmp/`, `*.gem`, `vendor/bundle/`
- **PHP**: `vendor/`, `*.log`, `*.cache`, `*.env`
- **러스트**: `target/`, `debug/`, `release/`, `*.rs.bk`, `*.rlib`, `*.prof*`, `.idea/`, `*.log`, `.env*`
- **코틀린**: `build/`, `out/`, `.gradle/`, `.idea/`, `*.class`, `*.jar`, `*.iml`, `*.log`, `.env*`
- **C++**: `build/`, `bin/`, `obj/`, `out/`, `*.o`, `*.so`, `*.a`, `*.exe`, `*.dll`, `.idea/`, `*.log`, `.env*`
- **C**: `build/`, `bin/`, `obj/`, `out/`, `*.o`, `*.a`, `*.so`, `*.exe`, `*.dll`, `autom4te.cache/`, `config.status`, `config.log`, `.idea/`, `*.log`, `.env*`
- **스위프트**: `.build/`, `DerivedData/`, `*.swiftpm/`, `Packages/`
- **R**: `.Rproj.user/`, `.Rhistory`, `.RData`, `.Ruserdata`, `*.Rproj`, `packrat/`, `renv/`
- **범용**: `.DS_Store`, `Thumbs.db`, `*.tmp`, `*.swp`, `.vscode/`, `.idea/`

**도구별 패턴**:
- **도커**: `node_modules/`, `.git/`, `Dockerfile*`, `.dockerignore`, `*.log*`, `.env*`, `coverage/`
- **ESLint**: `node_modules/`, `dist/`, `build/`, `coverage/`, `*.min.js`
- **더 예쁘다**: `node_modules/`, `dist/`, `build/`, `coverage/`, `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`
- **테라폼**: `.terraform/`, `*.tfstate*`, `*.tfvars`, `.terraform.lock.hcl`
- **Kubernetes/k8s**: `*.secret.yaml`, `secrets/`, `.kube/`, `kubeconfig*`, `*.key`, `*.crt`

5. tasks.md 구조를 구문 분석하고 추출합니다.
- **작업 단계**: 설정, 테스트, 핵심, 통합, 폴란드어
- **작업 종속성**: 순차 실행 규칙과 병렬 실행 규칙
- **작업 세부정보**: ID, 설명, 파일 경로, 병렬 마커 [P]
- **실행 흐름**: 순서 및 종속성 요구 사항

6. 작업 계획에 따라 구현을 실행합니다.
- **단계별 실행**: 다음 단계로 이동하기 전에 각 단계를 완료합니다.
- **종속성 존중**: 순차적 작업을 순서대로 실행하고, 병렬 작업 [P]를 함께 실행할 수 있습니다.
- **TDD 접근 방식을 따르세요**: 해당 구현 작업 전에 테스트 작업을 실행합니다.
- **파일 기반 조정**: 동일한 파일에 영향을 미치는 작업은 순차적으로 실행되어야 합니다.
- **검증 체크포인트**: 진행하기 전에 각 단계 완료를 확인합니다.

7. 구현 실행 규칙:
- **설정 우선**: 프로젝트 구조, 종속성, 구성 초기화
- **코드 전 테스트**: 계약, 엔터티, 통합 시나리오에 대한 테스트를 작성해야 하는 경우
- **핵심 개발**: 모델, 서비스, CLI 명령, 엔드포인트 구현
- **통합작업**: 데이터베이스 연결, 미들웨어, 로깅, 외부 서비스
- **정리 및 검증**: 단위 테스트, 성능 최적화, 문서화

8. 진행 상황 추적 및 오류 처리:
- 완료된 각 작업 후에 진행 상황을 보고합니다.
- 병렬이 아닌 작업이 실패하면 실행을 중지합니다.
- 병렬 작업 [P]의 경우 성공적인 작업을 계속하고 실패한 작업을 보고합니다.
- 디버깅을 위한 컨텍스트와 함께 명확한 오류 메시지 제공
- 구현을 진행할 수 없는 경우 다음 단계 제안
- **중요** 완료된 작업의 경우 작업 파일에서 해당 작업을 [X]로 표시해야 합니다.

9. 완료 검증:
- 필요한 모든 작업이 완료되었는지 확인합니다.
- 구현된 기능이 원래 사양과 일치하는지 확인
- 테스트 통과 및 적용 범위가 요구 사항을 충족하는지 확인
- 기술계획에 따라 구현이 진행되는지 확인

참고: 이 명령은 tasks.md에 전체 작업 분석이 존재한다고 가정합니다. 작업이 불완전하거나 누락된 경우 먼저 `$speckit-tasks`를 실행하여 작업 목록을 다시 생성하는 것이 좋습니다.

## 필수 실행 후 후크

**사용자에게 완료를 보고하기 전에 이 섹션을 완료해야 합니다.**

프로젝트 루트에 `.specify/extensions.yml`가 있는지 확인하세요.
- 존재하지 않거나 `hooks.after_implement`에 등록된 Hook이 없는 경우 Completion Report로 건너뜁니다.
- 존재하는 경우 이를 읽고 `hooks.after_implement` 키 아래에서 항목을 찾습니다.
- YAML을 구문 분석할 수 없거나 유효하지 않은 경우 후크 검사를 자동으로 건너뛰고 완료 보고서를 계속 진행합니다.
- `enabled`가 명시적으로 `false`인 후크를 필터링합니다. `enabled` 필드가 없는 후크는 기본적으로 활성화된 것으로 처리합니다.
- 나머지 각 후크에 대해 후크 `condition` 표현식을 해석하거나 평가하려고 **하지 마세요**.
- 후크에 `condition` 필드가 없거나 null/empty인 경우 후크를 실행 가능한 것으로 처리합니다.
- 후크가 비어 있지 않은 `condition`를 정의하는 경우 후크를 건너뛰고 조건 평가를 HookExecutor 구현에 맡깁니다.
- 후크 명령 이름으로 명령 호출을 구성할 때 점(`.`)을 하이픈(`-`)으로 바꾸십시오. 예를 들어 `speckit.git.commit` → `$speckit-git-commit`입니다.
- 각 실행 가능한 후크에 대해 `optional` 플래그를 기반으로 다음을 출력합니다.
- **필수 후크**(`optional: false`) — **각 필수 후크에 대해 `EXECUTE_COMMAND:`를 내보내야 합니다**:
    ```
## 확장 후크

**자동 후크**: {extension}
실행 중: `/{command}`
EXECUTE_COMMAND: {command}
    ```
위의 블록을 출력한 후에는 실제로 후크를 호출하고 계속하기 전에 완료될 때까지 기다려야 합니다. 이 에이전트/세션에서 직접 명령을 실행하는 것과 동일한 방식으로 실행합니다(호출은 위에 표시된 리터럴 `{command}` ID와 다를 수 있습니다. 예를 들어 기술 모드 에이전트는 이를 `/skill:speckit-...` 또는 `$speckit-...`로 실행합니다). 블록을 출력하는 것만으로는 후크가 실행되지 않습니다.
- **후크 옵션**(`optional: true`):
    ```
## 확장 후크

**후크 옵션**: {extension}
명령: `/{command}`
설명: {description}

프롬프트: {prompt}
실행하려면: `/{command}`
    ```

## 완료 보고서

완료된 작업 요약과 함께 최종 상태를 보고합니다.

## 완료 시기

- [ ] tasks.md의 모든 작업이 완료되고 `[X]`로 표시됨
- [ ] 사양, 계획 및 테스트 범위에 대해 구현이 검증되었습니다.
- [ ] 위의 필수 실행 후 후크 규칙에 따라 확장 후크가 전달되거나 건너뛰었습니다.
- [ ] 완료된 작업 요약과 함께 완료가 사용자에게 보고됨
