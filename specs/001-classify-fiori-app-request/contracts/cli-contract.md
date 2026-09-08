# CLI Contract: 요청 판정과 승인

## `fiori-agent inspect`

```text
fiori-agent inspect (--metadata <file> | --service-url <https-url>)
                    [--auth-header-env <ENV_NAME>]
                    [--run-dir <directory>]
```

- 두 service source option 중 정확히 하나가 필요하다.
- 출력: `metadata.xml`, `service-snapshot.json`, `inspection-report.json`.
- 인증 header 값은 지정한 환경변수에서 읽고 파일과 log에 기록하지 않는다.

## `fiori-agent classify`

```text
fiori-agent classify --request <request.json>
                     --service-snapshot <service-snapshot.json>
                     [--answers <answers.json>]
                     [--json]
```

- `UNDECIDED`: 질문 1~3개와 충돌을 출력하고 exit code `2`.
- `RECOMMENDED`: 정확히 하나의 유형과 근거를 출력하고 exit code `0`.
- invalid input/service: 구조화된 error를 출력하고 exit code `1`.

## `fiori-agent approve`

```text
fiori-agent approve --assessment <assessment.json>
                    --request <request.json>
                    --service-snapshot <service-snapshot.json>
                    --output-parent <directory>
                    --project-name <name>
                    [--yes]
```

- `RECOMMENDED` assessment만 승인할 수 있다.
- interactive mode에서는 요약과 output path를 표시하고 명시적으로 확인한다.
- 성공 시 `handoff.json`을 만들고 선택 유형에 맞는 다음 명령을 표시한다.
- unresolved blocking prerequisite, 기존 output directory, path escape가 있으면 handoff 생성을 거부한다.

## Error Envelope

```json
{
  "error": {
    "code": "INVALID_ODATA_VERSION",
    "message": "현재 MVP는 OData V4만 지원합니다.",
    "details": [],
    "retryable": false
  }
}
```
