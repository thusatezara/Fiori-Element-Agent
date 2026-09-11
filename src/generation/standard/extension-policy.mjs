export function getExtensionPolicy(request) {
    const requested = /extension|custom action|custom column|custom section|확장|사용자 정의 액션|사용자 정의 컬럼/i.test(String(request));
    return {
        requested,
        allowed: requested,
        reason: requested ? "사용자가 공식 extension scaffold를 명시적으로 요청했다." : "Standard annotation과 설정으로 충분하므로 extension을 추가하지 않는다.",
        alternative: "Prefer annotations and manifest settings before controller extensions.",
        maintenanceImpact: requested ? "Generated scaffold requires review against the target UI5/Fiori Elements version." : "No extension maintenance burden introduced.",
        validation: "Static manifest and extension path checks; runtime behavior requires application-specific OPA5 validation."
    };
}
