import presenceIndicatorsTemplate from './presence-indicators.html';
import _ from 'lodash';

function wfPresenceIndicatorsDirective ($rootScope, wfPresenceService,
                                        wfPresenceInitialData) {

    return {
        restrict: 'E',
        template: presenceIndicatorsTemplate,
        scope: {
            id: "=presenceId",
            inDrawer: "=inDrawer"
        },
        link: ($scope) => {

            function applyCurrentState(currentState) {
                if(currentState.length === 0) {
                    $scope.presences = [{ status: "free", indicatorText: ""}];
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

                            if(currentState[0].location === "body") {
                                // the user is actively editing the body
                                return {...presenceObject, ...{status: "present"}};
                            } else {
                                // the user is not editing the body, has clicked 'Save and close'
                                return {...presenceObject, ...{status: "idle"}};
                            }
                        });
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