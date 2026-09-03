// Header used to tag every browser request in a scenario with a unique id, so a
// shared WireMock container's request journal can be filtered to that scenario
// (set once by the scenarioId fixture in steps/fixtures.ts).
export const SCENARIO_HEADER = "x-e2e-scenario";
