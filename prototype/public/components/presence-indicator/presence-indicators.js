var wfPresenceIndicatorsDirective = function ($rootScope, wfPresenceService) {

    return {
        restrict: 'E',
        templateUrl: "/assets/components/presence-indicator/presence-indicators.html",
        scope: {
            id: "=presenceId",
            inDrawer: "=inDrawer"
        },
        link: function($scope) {

            function applyCurrentState(currentState) {
                if(currentState.length === 0) {
                    $scope.presences = [{ status: "free", indicatorText: ""}];
                } else {
                    $scope.presences = _.map(
                        _.uniq(currentState, false, function(s) { return s.clientId.person.email; }),
                        function (pr) {
                            var person = pr.clientId.person;
                            return { indicatorText:
                                (person.firstName.charAt(0) + person.lastName.charAt(0)).toUpperCase(),
                                longText: [person.firstName, person.lastName].join(" "),
                                email: person.email,
                                status: "present" };
                        });
                }
            }

            if ($scope.id) {
                wfPresenceService.initialData($scope.id).then(function (currentState) {
                    applyCurrentState(currentState);
                }, function (err) {
                    $log.error("Error getting initial data:", err);
                });

                $scope.$on("presence.status", function(ev, data) {
                    if($scope.id === data.subscriptionId) {
                        applyCurrentState(data.currentState);
                    }
                });
            }
        }
    };
}

export { wfPresenceIndicatorsDirective };
