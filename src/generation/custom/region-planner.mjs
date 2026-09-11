export function planRegions(request, service) {
    const normalized = String(request).toLowerCase();
    const regions = [
        { id: "filterBar", purpose: "검색 및 필터 입력", kind: "building-block", dataContext: `/${service.entitySet}` },
        { id: "table", purpose: "조회 결과 표시", kind: "building-block", dataContext: `/${service.entitySet}` }
    ];
    if (/상세|form|formulario|편집|detail/i.test(normalized)) regions.push({ id: "form", purpose: "선택된 항목의 상세 정보", kind: "building-block", dataContext: `/${service.entitySet}` });
    if (/direct|직접 구성|고유 동작|custom interaction|버튼/i.test(normalized)) regions.push({ id: "directRegion", purpose: "승인된 제한적 직접 interaction", kind: "direct", dataContext: "client-only" });
    return regions;
}
