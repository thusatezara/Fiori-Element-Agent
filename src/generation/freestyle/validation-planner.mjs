export function planValidation(request) {
    const normalized = String(request).toLowerCase();
    return {
        input: /validation|검증|입력 확인|필수/.test(normalized) ? "Requested input validation is represented by a client-side validation hook." : "No unverified business validation rule was invented.",
        transport: "OData request errors are surfaced through a UI message and remain backend-owned.",
        recovery: /retry|재시도|오류|복구/.test(normalized) ? "Retry/recovery handler scaffold is included." : "No additional recovery behavior was invented."
    };
}
