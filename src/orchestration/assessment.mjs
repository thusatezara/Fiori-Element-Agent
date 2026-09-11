export function classifyRequest(request, service, override) {
    const normalized = String(request ?? "").toLowerCase();
    const requestedType = String(override ?? "auto").toUpperCase();
    const selectedType = ["STANDARD", "CUSTOM", "FREESTYLE"].includes(requestedType)
        ? requestedType
        : /freestyle|free\s*style|wizard|multi[- ]step|복잡|다단계|직접 제어|상태 흐름/.test(normalized)
            ? "FREESTYLE"
            : /custom|커스텀|custom page|고유 배치|building block|사용자 정의/.test(normalized)
                ? "CUSTOM"
                : "STANDARD";
    const reasons = {
        STANDARD: "목록·검색·필터·상세 중심의 표준 OData 화면은 Fiori Elements 표준 흐름을 우선한다.",
        CUSTOM: "표준 화면 요소를 유지하면서 제한적인 고유 배치 또는 공식 확장이 필요하다고 판단했다.",
        FREESTYLE: "복잡한 상태, 다단계 흐름 또는 직접 interaction 제어가 요청되어 SAPUI5 MVC를 선택했다."
    };
    return {
        protocol: "001",
        selectedType,
        handoff: selectedType === "STANDARD" ? "002" : selectedType === "CUSTOM" ? "003" : "004",
        reason: reasons[selectedType],
        odataVersion: service.odataVersion,
        requestedOverride: requestedType === "AUTO" ? null : requestedType,
        alternatives: ["STANDARD", "CUSTOM", "FREESTYLE"].filter((type) => type !== selectedType),
        prerequisite: service.odataVersion === "4.0" || selectedType === "STANDARD" ? "PASS" : "CUSTOM/FREESTYLE require OData V4 in this generator.",
        outOfScope: ["backend changes", "authorization", "transactions", "deployment", "Work Zone content"]
    };
}
