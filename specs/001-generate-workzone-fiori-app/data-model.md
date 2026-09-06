# Data Model

## GenerationRequest

한 run의 불변 입력이다.

| Field | Type | 규칙 |
|---|---|---|
| `schemaVersion` | string | 계약 버전 |
| `runId` | UUID | 실행 식별자 |
| `outputPath` | string | 새 경로 또는 빈 디렉터리 |
| `app` | AppConfig | namespace, id, title, floorplan |
| `service` | ServiceInput | service URL과 main entity |
| `launchpad` | LaunchpadConfig | semantic object/action, Tile text |
| `deployment` | DeploymentConfig | Work Zone/MTA 준비 설정 |
| `requirements` | Requirement[] | 최소 1개, `id` unique |

## AppConfig

- `id`: npm/UI5 application id 규칙을 만족하는 안정 식별자
- `title`: 사용자 표시 제목
- `namespace`: 생성 namespace
- `floorplan`: 초기 범위는 `LIST_REPORT_OBJECT_PAGE`
- `odataVersion`: metadata 판정 결과와 일치하는 `V4`; 다른 버전은 입력 검증 실패
- `minimumUI5Version`: 사용자가 지정한 최소 SAPUI5 version
- `version`: 생성 application version

## LaunchpadConfig

- `semanticObject`, `action`, `tileTitle`: 필수
- `tileSubtitle`: 선택. 값이 없으면 관련 설정을 생성하지 않는다.

## DeploymentConfig

- `sapCloudService`: `sap.cloud.service` 값
- `backendDestination`: 기존 BTP destination 참조 이름
- `approuter`: 첫 버전은 `MANAGED`

## ServiceInput

- `url`: 사용자가 입력한 service root 또는 `$metadata` URL
- `mainEntity`: main entity set 이름
- `metadataDigest`: 조회된 metadata bytes의 SHA-256; assess 후 기록
- credential 또는 authorization field는 두지 않는다.

## Requirement

- `id`: 원 Spec의 FR 또는 사용자 요구사항과 연결되는 unique key
- `description`: 구현 관점이 아닌 사용자 요구
- `mandatory`: 전체 완료 판정 포함 여부
- `signals`: 분류기가 사용할 구조화된 단서. 최종 classification 자체를 입력으로 받지 않는다.

## RequirementAssessment

| Field | 설명 |
|---|---|
| `requirementId` | Requirement 추적 key |
| `classification` | 대표 구현 방식 |
| `status` | 현재 처리 상태 |
| `reasons` | 판정 근거 목록 |
| `evidence` | metadata path, rule id 등 검증 가능한 증거 |
| `handoffId` | 후속 기능이 필요할 때 참조 |

### Classification

`STANDARD`, `LOCAL_ANNOTATION`, `EXTENSION`, `CUSTOM_PAGE`, `FREESTYLE_SAPUI5`, `BACKEND_CHANGE_REQUIRED`

판정 우선순위는 `BACKEND_CHANGE_REQUIRED` → `FREESTYLE_SAPUI5` → `CUSTOM_PAGE` → `EXTENSION` → `LOCAL_ANNOTATION` → `STANDARD`이다. 대표값 외의 신호는 `reasons`에 보존한다.

### RequirementStatus

`READY`, `BLOCKED_BY_AUTH`, `BLOCKED_BY_BACKEND`, `ROUTED_TO_EXTENSION`, `ROUTED_TO_CUSTOM_PAGE`, `REQUIRES_ARCHITECTURE_DECISION`, `VERIFIED`, `FAILED`, `DEFERRED`

## ApprovalSummary

- `runId`, `requestDigest`, `metadataDigest`
- 요구사항별 classification/status 요약
- 생성 예정 파일·후속 handoff·blocker 목록
- `canonicalDigest`: canonical JSON의 SHA-256
- `approvedDigest`: 사용자가 승인한 digest. 실행 직전 `canonicalDigest`와 같아야 한다.

## FeatureHandoff

- `handoffId`: UUID
- `sourceRunId`, `requirementIds`
- `kind`: `AUTH_SUPPORT`, `EXTENSION`, `CUSTOM_PAGE`, `BACKEND_CHANGE`, `FREESTYLE_ARCHITECTURE`
- `status`: `PROPOSED`, `ACCEPTED`, `IN_PROGRESS`, `VERIFIED`, `REJECTED`, `BLOCKED`
- `problem`, `acceptanceCriteria`, `dependencies`, `evidence`
- Agent가 후속 Spec을 만들 때 입력으로 사용하며 Core CLI는 해당 Spec을 직접 생성하지 않는다.

## ValidationResult

- `checkId`, `scope`, `mandatory`
- `status`: `PASSED`, `FAILED`, `SKIPPED`
- `evidence`, `durationMs`, `command`(비밀정보 제거)
- 필수 check의 `SKIPPED`는 전체 성공으로 간주하지 않는다.

## ProjectResult

- `outputPath`, `generatedFiles`, `mtarPath`
- `requirements`: 최종 RequirementAssessment[]
- `validationReportPath`, `handoffPaths`
- `complete`: 모든 mandatory requirement가 `VERIFIED`이고 필수 validation이 `PASSED`일 때만 true

## RunState

```text
NEW → ASSESSED → AWAITING_APPROVAL → APPROVED → GENERATING
                                              ├→ VERIFYING → FINALIZED
                                              └→ FAILED
ASSESSED/AWAITING_APPROVAL/APPROVED/GENERATING/VERIFYING → BLOCKED
FAILED/BLOCKED → (입력 digest가 유효한 경우) 재개 가능한 직전 단계
```

각 전이는 `updatedAt`, `requestDigest`, 산출물 경로와 실패 코드를 기록한다. 입력 또는 approval digest가 달라지면 새 승인을 받기 전 `GENERATING`으로 전이할 수 없다.
