import presenceIndicatorsTemplate from './presence-indicators.html';
import _ from 'lodash';

function wfPresenceIndicatorsDirective($rootScope, wfPresenceService,
    wfPresenceInitialData) {

    return {
        restrict: 'E',
        template: presenceIndicatorsTemplate,
        scope: {
            id: "=presenceId",
            dontDisplayIdle: "=dontDisplayIdle",
            inDrawer: "=inDrawer"
        },
        link: ($scope) => {

            function applyCurrentState(currentState) {
                if (currentState.length === 0) {
                    $scope.presences = [{ status: "free", indicatorText: "" }];
                } else {
                    $scope.presences = _.map(
                        _.uniqBy(currentState, (s) => { return s.clientId.person.email; }),
                        (pr) => {
                            const person = pr.clientId.person;

                            const presenceObject = {
                                indicatorText:
                                    (person.firstName.charAt(0) + person.lastName.charAt(0)).toUpperCase(),
                                longText: [person.firstName, person.lastName].join(" "),
                                email: person.email
                            };
                            const locations = pr.locations || [];
                            const currentLocations = pr.location ? [...locations, pr.location] : locations;
                            const editingBodyLocations = ["body", "document"];
                            const editingFurnitureLocations = ["furniture"];

                            if (editingBodyLocations.some((l) => currentLocations.includes(l)) || $scope.dontDisplayIdle) {
                                return {
                                    ...presenceObject, 
                                    status: "present",
                                    longTitle: [presenceObject.longText, "editing body"].join(" - "),
                                    shortTitle: [presenceObject.email, "editing body"].join(" - "),
                                    iconPrecedence: 1
                                };
                            } else if(editingFurnitureLocations.some((l) => currentLocations.includes(l))) {
                                // the user is not editing the body, has clicked 'Save and close'
                                return {
                                    ...presenceObject,
                                    status: "furniture",
                                    longTitle: [presenceObject.longText, "editing furniture"].join(" - "),
                                    shortTitle: [presenceObject.email, "editing furniture"].join(" - "),
                                    iconPrecedence: 2
                                };
                            } else {
                                // the user is not editing the body, has clicked 'Save and close'
                                return {
                                    ...presenceObject,
                                    status: "idle",
                                    longTitle: [presenceObject.longText, "idle"].join(" - "),
                                    shortTitle: [presenceObject.email, "idle"].join(" - "),
                                    iconPrecedence: 3
                                };
                            }
                        }).sortBy(function (pr) { return pr.iconPrecedence });
                }
            }

            $scope.$watch(() => wfPresenceInitialData.getForId($scope.id), () => {
                applyCurrentState(wfPresenceInitialData.getForId($scope.id));
            });

            $scope.$on("presence.status", (ev, data) => {
                if($scope.id === data.subscriptionId) {
                    applyCurrentState(data.currentState);
                }
            });
        }
    };
}

export { wfPresenceIndicatorsDirective };