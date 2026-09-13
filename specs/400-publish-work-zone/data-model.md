# Data Model: SAP Build Work Zone 게시

이 model은 DB schema가 아니라 한 번의 Protocol 400 validation/publication 실행에서 사용되는 credential 없는 runtime object다.

## WorkZonePublicationRequest

| Field | Type | Rules |
|---|---|---|
| requestVersion | string | `1.0` |
| requestId | UUID string | 실행별 unique |
| handoff | HandoffReference | protocol `400`, version과 step binding 필수 |
| deployment | DeploymentEvidence | Protocol 300 `SUCCEEDED` evidence |
| application | ManifestEvidence | 배포 identity와 manifest/navigation 연결 |
| target | WorkZoneTarget | 네 식별자 모두 confirmed |
| publishIntent | PublishIntent | `PREVIEW` 또는 `PUBLISH` |
| approval | ApprovalEvidence/null | `PUBLISH`이면 필수, `PREVIEW`이면 사용하지 않음 |
| requestedAt | ISO datetime | UTC |

## HandoffReference

| Field | Type | Rules |
|---|---|---|
| handoffId | UUID string | 000 handoff reference |
| handoffVersion | string | `1.0` |
| planId | UUID string | 상위 SolutionPlan reference |
| stepId | string | Protocol 400 step |
| protocol | object | `id: "400"`, version 명시 |
| completedDependencies | string[] | deployment step completion evidence 포함 |

## DeploymentEvidence

| Field | Type | Rules |
|---|---|---|
| resultId | UUID string | immutable Protocol 300 result reference |
| protocol | object | `id: "300"`, version 명시 |
| status | enum | `SUCCEEDED`만 허용 |
| operationId | string | 외부 배포 operation 식별자 |
| applicationId | string | deployed application identity |
| sapCloudService | string | manifest 값과 정확히 일치 |
| artifactDigest | string | `sha256:<64 hex>` |
| subaccount | string | Work Zone target과 일치하는 확인 evidence |
| verifiedAt | ISO datetime | 성공 확인 시각 |

## ManifestEvidence

| Field | Type | Rules |
|---|---|---|
| sapAppId | string | manifest `sap.app/id`, 비어 있지 않음 |
| sapCloudService | string | manifest `sap.cloud/service`, deployment와 일치 |
| manifestDigest | string | deployment artifact digest와 연결 가능한 `sha256` |
| inboundKey | string | 여러 inbound 중 명시적으로 선택 |
| semanticObject | string | `[A-Za-z0-9][A-Za-z0-9._-]*` |
| action | string | `[A-Za-z0-9][A-Za-z0-9._-]*` |
| canonicalIntent | string | `#<semanticObject>-<action>`과 정확히 일치 |

## WorkZoneTarget

| Field | Type | Rules |
|---|---|---|
| edition | enum | `STANDARD`, `ADVANCED`; 추정 금지 |
| subaccount | string | deployment evidence와 일치 |
| site | string | 기존 확인된 site 식별자 |
| contentTarget | string | 기존 확인된 content target 식별자 |

네 field의 canonical serialization을 fingerprint 입력으로 사용한다. site나 content target 생성은 v1 범위 밖이다.

## PublishIntent

| Field | Type | Rules |
|---|---|---|
| mode | enum | `PREVIEW`, `PUBLISH` |
| operations | OperationType[] | unique; `PREVIEW`는 빈 배열, `PUBLISH`는 1개 이상 |
| targetFingerprint | string | 현재 canonical target과 일치 |

`OperationType`은 다음으로 제한한다.

- `REFRESH_CONTENT_PROVIDER`
- `IMPORT_CONTENT`
- `ASSIGN_CONTENT_TO_SITE`
- `UPDATE_SITE`
- `CREATE_TILE`
- `UPDATE_TILE`
- `ASSIGN_ROLE`

delete, unassign, role removal과 site/content provider creation은 허용하지 않는다.

## ApprovalEvidence

| Field | Type | Rules |
|---|---|---|
| approvalId | string | 비어 있지 않은 audit reference |
| approved | boolean | 반드시 `true` |
| targetFingerprint | string | intent/current target과 일치 |
| operationFingerprint | string | 정렬된 unique operation 집합과 일치 |
| approvedAt | ISO datetime | UTC |
| expiresAt | ISO datetime | 실행 시각보다 이후 |

approver credential이나 authentication material은 포함하지 않는다.

## PreflightCheck

| Field | Type | Rules |
|---|---|---|
| name | enum | `HANDOFF`, `DEPLOYMENT`, `TARGET`, `SUBACCOUNT`, `MANIFEST`, `NAVIGATION`, `APPROVAL`, `PROTOCOL_STATUS` |
| status | enum | `PASSED`, `FAILED`, `NOT_RUN` |
| code | string | stable machine-readable code |
| evidence | object/null | credential 없는 reference/summary만 포함 |

## PublicationOperation

| Field | Type | Rules |
|---|---|---|
| sequence | integer | 1 이상, 실행 순서 |
| type | OperationType | requested/approved 집합에 포함 |
| desiredStateFingerprint | string | idempotency 비교 기준 |
| status | enum | `SUCCEEDED`, `NO_CHANGE`, `FAILED`, `NOT_RUN` |
| resource | object/null | resource type과 opaque ID만 포함 |
| startedAt/completedAt | ISO datetime/null | 실행되지 않으면 null 가능 |
| code | string | operation 결과 code |

## ValidationEvidence

| Field | Type | Rules |
|---|---|---|
| contentDiscovery | ValidationCheck | application content 발견 여부 |
| siteAssignment | ValidationCheck | target site 할당 여부 |
| navigation | ValidationCheck | resolved intent 일치 여부 |
| visibility | ValidationCheck | 승인된 subject가 없으면 `NOT_VERIFIED` |

`ValidationCheck.status`는 `PASSED`, `FAILED`, `NOT_VERIFIED`, `NOT_RUN` 중 하나다.

## PublicationResult

| Field | Type | Rules |
|---|---|---|
| resultVersion | string | `1.0` |
| resultId | UUID string | 실행별 unique |
| requestId | UUID string | input request reference |
| protocol | object | ID `400`, version과 실행 시 status |
| status | enum | `BLOCKED`, `READY_FOR_APPROVAL`, `SUCCEEDED`, `VALIDATION_FAILED`, `FAILED` |
| target | WorkZoneTarget | credential 없는 exact target |
| preflight | PreflightCheck[] | 실행된 모든 gate evidence |
| operations | PublicationOperation[] | preview/blocked이면 빈 배열 가능 |
| validation | ValidationEvidence | mutation 후 또는 read-only 확인 결과 |
| retryable | boolean | 같은 approval로 안전하게 재시도 가능한지 여부 |
| recoveryGuidance | string[] | destructive command 또는 credential 금지 |
| completedAt | ISO datetime | UTC |

## 상태 전이

```text
RECEIVED
  → PREFLIGHT
  ├── invalid dependency/target/manifest → BLOCKED
  ├── protocol status DEFINED            → BLOCKED
  ├── PREVIEW valid                      → READY_FOR_APPROVAL
  └── PUBLISH + exact approval + IMPLEMENTED
        → EXECUTING
        ├── operation failure            → FAILED
        └── operations complete
              ├── validation failure     → VALIDATION_FAILED
              └── validation pass        → SUCCEEDED
```

`FAILED`에서 자동 destructive rollback 전이는 없다. 재시도는 current state를 다시 inspect하고 operation별 `NO_CHANGE`를 재계산한다.
