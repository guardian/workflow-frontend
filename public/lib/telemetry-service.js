import angular from "angular";
import {UserTelemetryEventSender} from "@guardian/user-telemetry-client"


angular
    .module("wfTelemetryService", [])
    .factory("wfTelemetryService", [() => {

    class TelemetryService {
        constructor() {
            this.telemetrySender = _wfConfig.telemetryUrl ? new UserTelemetryEventSender(_wfConfig.telemetryUrl) : undefined;
        }
        sendTelemetryEvent = (type, tags, value = true) =>
            this.telemetrySender?.addEvent({
                app: "workflow",
                stage: _wfConfig.stage,
                eventTime: new Date().toISOString(),
                type,
                value,
                tags,
            });
    }

    return new TelemetryService();
}]);


