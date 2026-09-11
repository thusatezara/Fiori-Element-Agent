export function planState(service, flow) {
    return {
        dataOwner: "ODataModel",
        dataPath: `/${service.entitySet}`,
        uiStateOwner: "view JSONModel",
        stateKeys: ["busy", "errorMessage", "currentStep", "draft"],
        initialState: { busy: false, errorMessage: "", currentStep: flow.startScreen, draft: {} }
    };
}
