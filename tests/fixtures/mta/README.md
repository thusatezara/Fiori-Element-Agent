# Protocol 200 fixture 경계

실제 credential이나 landscape target을 저장하지 않는다. `tests/mta-composition.test.mjs`가 임시 workspace에서 valid, failed-validation, tampered-checksum, collision 및 build failure fixture를 생성하며 테스트 종료 후 운영 source와 분리된다.

- `components`: BACKEND/FRONTEND source result envelope
- `topologies`: backend-only, frontend-only, integrated topology shape
- output boundary: OS temp directory 아래 테스트별 고유 경로

