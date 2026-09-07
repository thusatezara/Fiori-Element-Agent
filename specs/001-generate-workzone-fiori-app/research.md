# Phase 0 Research

## 1. Core CLI와 Agent 분리

**Decision**: 결정론적 TypeScript Core CLI가 분석·생성·검증을 수행하고 Agent가 승인과 후속 Spec의 loop를 조정한다.

**Rationale**: 파일 생성과 검증은 재실행 가능해야 하지만, 질문·승인·다른 architecture로의 전환은 사람과 Agent의 판단이 필요하다. JSON 계약을 경계로 두면 테스트와 감사가 가능하다.

**Alternatives considered**: Agent가 파일을 직접 생성하는 방식은 실행 결과의 편차와 복구 비용이 크다. CLI만 사용하는 방식은 Extension/Backend/Auth 같은 분기에서 사람과의 협업을 표현하기 어렵다.

## 2. Fiori Elements 프로젝트 생성

**Decision**: SAP Fiori tools 팀이 관리하는 [`@sap-ux/fiori-elements-writer`](https://github.com/SAP/open-ux-tools/tree/main/packages/fiori-elements-writer)의 programmatic `generate` API를 사용한다.

**Rationale**: 공식 SAP Open UX Tools의 generator를 재사용하여 manifest와 프로젝트 구조를 직접 조립하는 위험을 줄인다.

**Alternatives considered**: Yeoman subprocess는 prompt와 버전별 동작을 통제하기 어렵다. 자체 template 복사는 SAP Fiori tools의 변경을 지속적으로 추적해야 한다.

## 3. Local annotation

**Decision**: [`@sap-ux/fiori-annotation-api`](https://github.com/SAP/open-ux-tools/tree/main/packages/fiori-annotation-api)를 사용해 app-local annotation을 읽고 변경하며 XML로 직렬화한다. 저수준 `@sap-ux/odata-annotation-core`는 상위 API가 지원하지 않는 최소 범위에서만 고려한다.

**Rationale**: backend CAP/RAP 변경 없이 화면 표현을 애플리케이션 단위로 빠르게 변경한다는 Spec의 정책과 맞고, 문자열 기반 XML 편집보다 안전하다.

**Alternatives considered**: backend annotation은 공유 서비스 영향과 변경 lead time이 크다. 직접 XML 문자열 조립은 namespace, target, reference 오류 가능성이 높다.

## 4. Metadata 조회

**Decision**: Node.js built-in `fetch`로 unauthenticated `$metadata` GET을 수행하고 응답을 메모리 제한 내에서 저장한다.

**Rationale**: 인증 없는 공개 metadata라는 현재 범위에는 별도 HTTP dependency가 필요하지 않다. `401`/`403`은 인증을 추측하지 않고 `BLOCKED_BY_AUTH`로 기록한다.

**Alternatives considered**: destination/credential 지원은 BTP 환경·권한 계약이 필요한 별도 기능이다. browser automation은 생성기의 결정론적 입력 채널로 적절하지 않다.

## 5. URL 및 네트워크 안전성

**Decision**: HTTPS와 loopback HTTP만 허용하고, URL user-info 및 non-HTTP(S)를 거부한다. redirect는 same-origin만 허용하며 timeout, 최대 응답 크기, content 검사를 적용한다. 로그에서는 query와 fragment를 제거한다.

**Rationale**: 사용자가 URL을 직접 입력하므로 SSRF, credential 노출, 무한 응답 및 예상하지 않은 redirect 위험을 입력 경계에서 제한해야 한다.

**Alternatives considered**: 모든 HTTP URL 허용은 안전 기준을 충족하지 못한다. host allowlist는 현재 알려진 landscape가 없어 전역 기본값으로 확정할 수 없다.

## 6. Work Zone/MTA 설정

**Decision**: [`@sap-ux/cf-deploy-config-writer`](https://github.com/SAP/open-ux-tools/tree/main/packages/cf-deploy-config-writer)로 Cloud Foundry deployment configuration을 생성·보정하고 결과 파일을 구조 검증한다.

**Rationale**: SAP가 제공하는 writer를 사용해 managed/standard approuter와 MTA 설정의 수작업 오류를 줄인다.

**Alternatives considered**: 고정 `mta.yaml` template은 서비스와 project option별 차이를 흡수하기 어렵다.

## 7. Build와 deploy 경계

**Decision**: 이 기능은 `mbt build`와 `.mtar` 존재 검증까지 수행하고 `cf deploy`는 수행하지 않는다.

**Rationale**: build는 배포 가능한 artifact의 정적 증거지만 deploy는 BTP account, org/space, entitlement, credential 및 외부 상태 변경 승인이 필요하다.

**Alternatives considered**: 동일 flow에서 `cf deploy`까지 자동화하면 현재 Spec의 무자격·최소 권한 경계를 넘는다. 실제 배포는 별도 Spec과 승인 gate가 적합하다.

## 8. 실행 상태와 handoff

**Decision**: run별 JSON 상태, immutable 입력 digest, approval digest, assessment, validation, feature handoff를 기록한다.

**Rationale**: Agent 간 반복 작업에서 동일 이슈를 중복 생성하지 않고 중단 후 재개하며, 어떤 요구사항이 어느 후속 작업으로 전달됐는지 추적할 수 있다.

**Alternatives considered**: 대화 기록만 사용하면 자동 검증과 재개가 어렵다. 초기 범위에 DB를 추가하는 것은 운영 복잡도에 비해 이점이 작다.

## 9. 생성 원자성과 rollback

**Decision**: 대상과 같은 volume의 staging 디렉터리에 생성하고 `verify`의 모든 필수 검증이 성공하면 같은 workflow의 원자적 마지막 단계에서 finalize한다. 별도 `finalize` CLI 명령은 두지 않으며 비어 있지 않은 대상은 변경하지 않는다.

**Rationale**: 실패한 생성이 사용자 파일과 섞이지 않으며 rename 기반 finalize와 진단 보존이 가능하다.

**Alternatives considered**: 대상에 직접 생성 후 삭제 rollback은 기존 파일 오인 삭제 위험이 있다.

## 10. Toolchain 및 dependency 정책

**Decision**: Node.js 22 LTS 이상과 TypeScript 5.x를 사용하며 dependency는 구현 시 공식 package metadata와 호환성을 확인한 exact version으로 lockfile에 고정한다. child process는 `mbt` 등 고정 allowlist와 argument array로만 실행한다.

**Rationale**: shell 문자열 실행과 floating version을 피하면 재현성과 공급망 통제가 좋아진다.

**현재 host 관찰**: `node v22.14.0`은 확인했으나 현재 `npm` 실행은 사용자 roaming 경로의 `npm-cli.js` 누락으로 실패하고 `mbt`는 설치되어 있지 않다. Plan 작성에는 영향이 없지만 구현 dependency 설치와 실제 MTA build 전에 개발 환경 복구가 필요하다.
