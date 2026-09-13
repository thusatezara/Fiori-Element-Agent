# Traceability: Protocol 200 MTA 솔루션 구성

| Requirement | User story / Plan area | Task coverage | Validation evidence |
|---|---|---|---|
| FR-001~FR-005 | US1, handoff·component preflight | T004~T011 | source-result normalization, provenance, checksum, path/secret tests |
| FR-006~FR-012 | US2, deterministic topology | T012~T017 | topology variants, collision and stable fingerprint tests |
| FR-013~FR-017 | US3, package validation | T018~T023 | schema/reference/build cases and archive checksum |
| FR-018 | activation gate | T007, T025~T027 | registry blocking and final evidence gate |
| SC-001 | US1 | T008~T011 | invalid/tampered input is blocked before write |
| SC-002~SC-004 | US2 | T012~T017 | topology completeness, collision detection, determinism |
| SC-005 | US3 | T018~T023 | build and archive-ready evidence |
| SC-006~SC-007 | cross-cutting | T005~T006, T018, T021, T026 | secret-free artifacts and zero external change |

Protocol 200은 T027의 모든 검증이 통과하기 전까지 `DEFINED`, `executor=null`을 유지한다.
