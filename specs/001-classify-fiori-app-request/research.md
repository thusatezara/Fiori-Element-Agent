# Research: Fiori 애플리케이션 요청 유형 판정

## Decision 1: 첫 구현은 OData V4로 제한

**Decision**: local EDMX와 직접 접근 가능한 OData V4 service URL을 지원한다.

**Rationale**: Fiori elements Building Blocks와 Custom Page는 OData V4를 기준으로 제공되므로 세 생성 유형이 공유할 수 있는 최소 공통 기반이다. OData V2까지 동시에 지원하면 metadata와 annotation 해석, manifest 및 편집 capability 분기가 MVP 범위를 크게 넓힌다.

**Alternatives considered**: V2/V4 동시 지원은 후속 Feature로 연기한다. CAP model 직접 입력은 OData service 계약으로 변환한 뒤 지원한다.

**Source**: [SAP Fiori tools의 OData V4 권장 및 Custom Page 설명](https://help.sap.com/docs/SAP_FIORI_tools/17d50220bcd848aa854c9c182d65b699/7833775ae607430c9d708d9a3a145263.html)

## Decision 2: 판정은 설명 가능한 deterministic rules 사용

**Decision**: 업무 흐름, 화면 배치, metadata 재사용, client 상태 제어 신호를 명시적인 rule로 평가하고 충돌 또는 부족 정보는 `UNDECIDED`로 남긴다.

**Rationale**: 같은 입력에 같은 결과를 제공하고 판정 근거와 테스트 사례를 직접 추적할 수 있다. LLM은 문장 정규화 보조로 확장할 수 있지만 MVP의 필수 의존성이 아니다.

**Alternatives considered**: LLM 단독 판정은 설명 가능성과 재현성이 낮아 제외한다. 사용자가 기술 유형을 직접 선택하게 하는 방식은 비기술 사용자 요구와 충돌한다.

## Decision 3: metadata를 immutable service snapshot으로 정규화

**Decision**: EDMX에서 schema, EntitySet, EntityType, property, key, navigation, action/function 및 capability 근거를 추출하고 source hash와 함께 저장한다.

**Rationale**: 사용자 진술과 service 사실을 구분하고 모든 생성기가 동일한 입력을 사용하게 한다. 원본 EDMX도 run directory에 복사하되 URL credential과 header는 기록하지 않는다.

**Alternatives considered**: 생성기마다 EDMX를 다시 parsing하면 해석 차이와 반복 network access가 생겨 제외한다.

## Decision 4: URL 입력과 local file 입력을 동일 계약으로 처리

**Decision**: `--metadata <file>` 또는 `--service-url <url>` 중 하나만 허용한다. URL은 HTTPS를 기본으로 하고 선택적 인증 header는 환경변수 이름으로만 전달한다.

**Rationale**: offline fixture와 실제 service를 모두 검증하면서 secret을 command history나 결과 파일에 남기지 않는다.

**Alternatives considered**: username/password CLI argument와 TLS 검증 비활성화는 보안 원칙 때문에 제외한다. SAP destination 연결은 후속 Feature로 둔다.

## Decision 5: 후속 생성기는 versioned JSON handoff 사용

**Decision**: 승인 결과는 `handoffVersion`, `selectedType`, original request, answers, evidence, prerequisites, service snapshot reference, output intent를 포함한다.

**Rationale**: 001과 002~004를 느슨하게 결합하고 contract test로 호환성을 검증할 수 있다.

**Alternatives considered**: process memory 객체만 전달하면 재현과 감사를 할 수 없어 제외한다.

## Decision 6: Node.js 20.11+와 UI5 CLI 4 호환선 사용

**Decision**: orchestrator는 Node.js 20.11 이상을 사용하고 생성 프로젝트는 stable UI5 CLI 4 계열과 호환되는 구성을 만든다. 실제 package version은 lockfile로 고정한다.

**Rationale**: UI5 CLI 4는 Node.js 20.11+를 지원하며 UI5 CLI 5는 아직 alpha이므로 첫 결과의 안정성을 우선한다.

**Source**: [UI5 CLI 4 요구사항](https://ui5.github.io/cli/v4/pages/CLI/), [UI5 CLI 5 alpha migration](https://ui5.github.io/cli/v5/updates/migrate-v5)
