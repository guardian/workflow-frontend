const domainMatch = /^.*\.(?<environment>local|code)\.dev-gutools\.co\.uk$|^.*\.gutools\.co\.uk$/
    .exec(location.hostname);
if (domainMatch) {
    const stage = (domainMatch.groups?.environment || "PROD");
    const telemetryUrl = stage === "PROD" ? "user-telemetry.gutools.co.uk" : `user-telemetry.${stage}.dev-gutools.co.uk`;
    new Image().src = `https://${telemetryUrl}/guardian-tool-accessed?app=workflow&stage=${stage.toUpperCase()}&path=${window.location.pathname}`;
}